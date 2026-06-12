const fs = require("fs");
const path = require("path");

const appDir = path.resolve(__dirname, "..");
const publicDir = path.join(appDir, "public");
const artDir = path.join(publicDir, "art");
const srcDir = path.join(appDir, "src");
const REQUIRED_RESPONSIVE = new Set([
  "panels/themap.webp",
  "panels/insight2-panel.webp",
  "panels/source-verification-panel.webp",
]);

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

function collectReferences() {
  const references = new Map();
  const files = [
    ...walkFiles(srcDir, (file) => /\.(ts|tsx|js|jsx)$/.test(file)),
    ...walkFiles(path.join(publicDir, "content"), (file) => /\.json$/.test(file)),
  ];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const asset of text.matchAll(/(?:artUrl\(["']|["'])([^"']+\.(?:webp|png|jpe?g))/g)) {
      const rel = asset[1].replace(/^art\//, "");
      if (!references.has(rel)) references.set(rel, []);
      references.get(rel).push(path.relative(appDir, file).replace(/\\/g, "/"));
    }
  }
  return references;
}

function main() {
  const references = collectReferences();
  const artFiles = walkFiles(artDir, (file) => /\.(webp|png|jpe?g)$/i.test(file))
    .map((filePath) => {
      const rel = publicArtRel(filePath);
      const size = fs.statSync(filePath).size;
      const isVariant = /-\d+w\.webp$/.test(path.basename(rel));
      return {
        rel,
        size,
        isVariant,
        references: references.get(rel) ?? [],
      };
    })
    .sort((a, b) => b.size - a.size);

  const oversized = artFiles.filter((file) => !file.isVariant && file.size >= 90 * 1024);
  const liveOversized = oversized.filter((file) => file.references.length > 0);
  const total = artFiles.reduce((sum, file) => sum + file.size, 0);

  console.log(`Image audit: ${artFiles.length} art files · ${format(total)} total`);
  console.log("\nLargest original art assets:");
  for (const file of oversized.slice(0, 20)) {
    const refText = file.references.length > 0 ? file.references.join(", ") : "no direct code/content reference found";
    console.log(`- ${file.rel} ${format(file.size)} · ${refText}`);
  }

  console.log("\nReferenced oversized originals:");
  if (liveOversized.length === 0) {
    console.log("- none");
  } else {
    for (const file of liveOversized) {
      console.log(`- ${file.rel} ${format(file.size)} · ${file.references.join(", ")}`);
    }
  }

  const missingVariants = liveOversized.filter((file) => REQUIRED_RESPONSIVE.has(file.rel)).filter((file) => {
    const ext = path.extname(file.rel);
    const base = file.rel.slice(0, -ext.length);
    return !fs.existsSync(path.join(artDir, `${base}-640w.webp`)) || !fs.existsSync(path.join(artDir, `${base}-960w.webp`));
  });
  if (missingVariants.length > 0) {
    console.log("\nPriority responsive originals without 640w/960w variants:");
    for (const file of missingVariants) console.log(`- ${file.rel}`);
    process.exitCode = 1;
  } else {
    console.log("\nPriority responsive originals have 640w/960w variants.");
  }
}

main();
