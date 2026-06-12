const fs = require("fs");
const path = require("path");

const appDir = path.resolve(__dirname, "..");
const publicDir = path.join(appDir, "public");
const artDir = path.join(publicDir, "art");
const srcDir = path.join(appDir, "src");
const contentDir = path.join(publicDir, "content");
const registry = JSON.parse(fs.readFileSync(path.join(srcDir, "image-registry.json"), "utf8"));
const responsive = registry.responsive || {};

function walkFiles(dir, predicate = () => true) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(filePath, predicate));
    else if (predicate(filePath)) out.push(filePath);
  }
  return out;
}

function format(bytes) {
  return `${Math.round(bytes / 1024)} kB`;
}

function publicArtRel(filePath) {
  return path.relative(artDir, filePath).replace(/\\/g, "/");
}

function addRef(map, rel, source) {
  if (!rel || !/\.(webp|png|jpe?g)$/i.test(rel)) return;
  const clean = rel.replace(/^art\//, "");
  if (!map.has(clean)) map.set(clean, new Set());
  map.get(clean).add(source.replace(/\\/g, "/"));
}

function collectArtMapRefs(map) {
  const artMapPath = path.join(contentDir, "art-map.json");
  const artMap = JSON.parse(fs.readFileSync(artMapPath, "utf8"));
  for (const [doc, entry] of Object.entries(artMap.docs || {})) {
    const source = `public/content/art-map.json#doc-${doc}`;
    addRef(map, entry.opener, source);
    for (const accent of entry.accents || []) addRef(map, accent, source);
    for (const panel of entry.panels || []) addRef(map, panel.src, source);
  }
}

function collectReferences() {
  const references = new Map();
  const files = walkFiles(srcDir, (file) => /\.(ts|tsx|js|jsx)$/.test(file) && path.basename(file) !== "imageRegistry.ts");
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const source = path.relative(appDir, file);
    for (const asset of text.matchAll(/artUrl\(["']([^"']+\.(?:webp|png|jpe?g))["']\)/g)) addRef(references, asset[1], source);
    for (const asset of text.matchAll(/["']([^"']+\.(?:webp|png|jpe?g))["']/g)) addRef(references, asset[1], source);
  }
  collectArtMapRefs(references);
  return references;
}

function isIgnoredUnused(rel) {
  return (registry.ignoreUnused || []).some((pattern) => {
    if (pattern.endsWith("/*")) return rel.startsWith(pattern.slice(0, -1));
    return rel === pattern;
  });
}

function variantRel(rel, width) {
  const ext = path.extname(rel);
  const base = rel.slice(0, -ext.length);
  return `${base}-${width}w.webp`;
}

function checkRegistryVariants() {
  const missing = [];
  for (const [rel, entry] of Object.entries(responsive)) {
    for (const width of entry.widths || []) {
      if (width >= entry.width) continue;
      const candidate = variantRel(rel, width);
      if (!fs.existsSync(path.join(artDir, candidate))) missing.push(candidate);
    }
  }
  return missing;
}

function printBucket(label, files) {
  console.log(`\n${label}:`);
  if (files.length === 0) {
    console.log("- none");
    return;
  }
  for (const file of files) {
    const refs = file.references.length > 0 ? ` · ${file.references.join(", ")}` : "";
    console.log(`- ${file.rel} ${format(file.size)}${refs}`);
  }
}

function main() {
  const references = collectReferences();
  const artFiles = walkFiles(artDir, (file) => /\.(webp|png|jpe?g|ico)$/i.test(file))
    .map((filePath) => {
      const rel = publicArtRel(filePath);
      const refs = [...(references.get(rel) ?? [])];
      const registryEntry = responsive[rel];
      return {
        rel,
        size: fs.statSync(filePath).size,
        isVariant: /-\d+w\.webp$/.test(path.basename(rel)),
        role: registryEntry?.role ?? "other",
        references: refs,
      };
    })
    .sort((a, b) => b.size - a.size);

  const originals = artFiles.filter((file) => !file.isVariant);
  const variants = artFiles.filter((file) => file.isVariant);
  const total = artFiles.reduce((sum, file) => sum + file.size, 0);
  const oversized = originals.filter((file) => file.size >= 90 * 1024);
  const priority = oversized.filter((file) => file.role === "priority");
  const contentPanels = oversized.filter((file) => file.role === "content-panel");
  const otherReferenced = oversized.filter((file) => file.role === "other" && file.references.length > 0);
  const unused = originals.filter((file) => file.references.length === 0 && !isIgnoredUnused(file.rel));
  const missingVariants = checkRegistryVariants();

  console.log(`Image audit: ${originals.length} originals · ${variants.length} variants · ${format(total)} total`);
  printBucket("Priority responsive art", priority);
  printBucket("Responsive content panels over 90 kB", contentPanels);
  printBucket("Other referenced oversized originals", otherReferenced);

  console.log(`\nUnused originals excluding ignored app/icons: ${unused.length}`);
  for (const file of unused.slice(0, 20)) console.log(`- ${file.rel} ${format(file.size)}`);
  if (unused.length > 20) console.log(`- ...${unused.length - 20} more`);

  if (missingVariants.length > 0) {
    console.log("\nMissing registered responsive variants:");
    for (const rel of missingVariants) console.log(`- ${rel}`);
    process.exitCode = 1;
  } else {
    console.log("\nRegistered responsive variants are present.");
  }
}

main();
