const fs = require("fs");
const path = require("path");

const appDir = path.resolve(__dirname, "..");
const siteDir = path.resolve(appDir, "..");
const artDir = path.join(appDir, "public", "art");
const archiveDir = path.join(siteDir, "archived-art", "unused-public-art");
const srcDir = path.join(appDir, "src");
const contentDir = path.join(appDir, "public", "content");
const registry = JSON.parse(fs.readFileSync(path.join(srcDir, "image-registry.json"), "utf8"));
const RESERVED = new Set(["panels/indigenous-data-panel.webp"]);

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

function addRef(map, rel) {
  if (!rel || !/\.(webp|png|jpe?g|ico)$/i.test(rel)) return;
  const clean = rel.replace(/^art\//, "");
  if (!map.has(clean)) map.set(clean, true);
}

function collectArtMapRefs(map) {
  const artMap = JSON.parse(fs.readFileSync(path.join(contentDir, "art-map.json"), "utf8"));
  for (const entry of Object.values(artMap.docs || {})) {
    addRef(map, entry.opener);
    for (const accent of entry.accents || []) addRef(map, accent);
    for (const panel of entry.panels || []) addRef(map, panel.src);
  }
}

function collectReferences() {
  const references = new Map();
  const files = walkFiles(srcDir, (file) => /\.(ts|tsx|js|jsx|json)$/.test(file) && path.basename(file) !== "image-registry.json");
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const asset of text.matchAll(/artUrl\(["']([^"']+\.(?:webp|png|jpe?g|ico))["']\)/g)) addRef(references, asset[1]);
    for (const asset of text.matchAll(/["']([^"']+\.(?:webp|png|jpe?g|ico))["']/g)) addRef(references, asset[1]);
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

function isVariant(rel) {
  return /-\d+w\.webp$/.test(path.basename(rel));
}

function findCandidates() {
  const references = collectReferences();
  return walkFiles(artDir, (file) => /\.(webp|png|jpe?g|ico)$/i.test(file))
    .map((filePath) => ({ filePath, rel: path.relative(artDir, filePath).replace(/\\/g, "/") }))
    .filter((file) => !isVariant(file.rel))
    .filter((file) => !references.has(file.rel))
    .filter((file) => !isIgnoredUnused(file.rel))
    .filter((file) => !RESERVED.has(file.rel))
    .sort((a, b) => a.rel.localeCompare(b.rel));
}

function main() {
  const yes = process.argv.includes("--yes");
  const candidates = findCandidates();
  const total = candidates.reduce((sum, file) => sum + fs.statSync(file.filePath).size, 0);
  console.log(`${yes ? "Archiving" : "Dry run:"} ${candidates.length} unused public art originals (${Math.round(total / 1024)} kB).`);
  for (const file of candidates) {
    const target = path.join(archiveDir, file.rel);
    console.log(`- ${file.rel} -> ${path.relative(siteDir, target).replace(/\\/g, "/")}`);
    if (!yes) continue;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.renameSync(file.filePath, target);
  }
  if (!yes) {
    console.log("Run with --yes to move these files out of app/public/art.");
  }
}

main();
