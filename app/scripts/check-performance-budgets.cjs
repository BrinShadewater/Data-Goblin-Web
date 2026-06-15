const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const appDir = path.resolve(__dirname, "..");
const distAssetsDir = path.join(appDir, "dist", "assets");
const artDir = path.join(appDir, "public", "art");

const BUDGETS = {
  chunks: {
    "index-": { raw: 60 * 1024, gzip: 18 * 1024 }, // gzip 15->18: i18n + URL-based FR routing + audio context (dictionary itself is lazy-loaded, see ui-fr chunk)
    "react-vendor-": { raw: 390 * 1024, gzip: 120 * 1024 },
    "icons-vendor-": { raw: 34 * 1024, gzip: 14 * 1024 }, // ~30 distinct lucide icons, already tree-shaken (~1 kB each); the old 13/6 was aspirational and never actually met
    "Markdown-": { raw: 205 * 1024, gzip: 60 * 1024 },
    "FieldGuidePage-": { raw: 60 * 1024, gzip: 14 * 1024 },
  },
  anyJsChunkRaw: 390 * 1024,
  maxPublicArtRaw: 500 * 1024,
  maxResponsiveVariantRaw: 400 * 1024,
  totalOriginalPublicArtRaw: 8 * 1024 * 1024, // raised from 6: 42 chapter figures added (lazy-loaded, no initial-load cost)
  totalResponsiveVariantRaw: 5.0 * 1024 * 1024, // raised from 4.5: bilingual edition adds a French map + flag variant set
  totalPublicArtRaw: 13 * 1024 * 1024, // raised from 10.5: 42 chapter figures added (lazy-loaded)
};

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function format(bytes) {
  return `${Math.round(bytes / 1024)} kB`;
}

function walkFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(filePath));
    else out.push(filePath);
  }
  return out;
}

function gzipSize(filePath) {
  return zlib.gzipSync(fs.readFileSync(filePath)).length;
}

function checkNamedChunk(files, prefix, budget) {
  const file = files.find((item) => item.name.startsWith(prefix) && item.name.endsWith(".js"));
  if (!file) {
    fail(`Missing expected chunk ${prefix}*.js`);
    return;
  }
  if (file.raw > budget.raw) fail(`${file.name} raw size ${format(file.raw)} exceeds budget ${format(budget.raw)}.`);
  if (file.gzip > budget.gzip) fail(`${file.name} gzip size ${format(file.gzip)} exceeds budget ${format(budget.gzip)}.`);
}

function main() {
  if (!fs.existsSync(distAssetsDir)) {
    fail("dist/assets not found. Run npm run build first.");
    return;
  }

  const jsFiles = fs.readdirSync(distAssetsDir)
    .filter((name) => name.endsWith(".js"))
    .map((name) => {
      const filePath = path.join(distAssetsDir, name);
      return { name, raw: fs.statSync(filePath).size, gzip: gzipSize(filePath) };
    })
    .sort((a, b) => b.raw - a.raw);

  for (const file of jsFiles) {
    if (file.raw > BUDGETS.anyJsChunkRaw) {
      fail(`${file.name} raw size ${format(file.raw)} exceeds any-chunk budget ${format(BUDGETS.anyJsChunkRaw)}.`);
    }
  }
  for (const [prefix, budget] of Object.entries(BUDGETS.chunks)) {
    checkNamedChunk(jsFiles, prefix, budget);
  }

  const artFiles = walkFiles(artDir).map((filePath) => ({
    filePath,
    raw: fs.statSync(filePath).size,
    isVariant: /-\d+w\.webp$/.test(path.basename(filePath)),
  }));
  const totalArt = artFiles.reduce((sum, file) => sum + file.raw, 0);
  const originalArt = artFiles.filter((file) => !file.isVariant);
  const variantArt = artFiles.filter((file) => file.isVariant);
  const totalOriginalArt = originalArt.reduce((sum, file) => sum + file.raw, 0);
  const totalVariantArt = variantArt.reduce((sum, file) => sum + file.raw, 0);
  const largestArt = [...originalArt].sort((a, b) => b.raw - a.raw)[0];
  const largestVariant = [...variantArt].sort((a, b) => b.raw - a.raw)[0];
  if (largestArt && largestArt.raw > BUDGETS.maxPublicArtRaw) {
    fail(`${path.relative(appDir, largestArt.filePath)} is ${format(largestArt.raw)}, above max public art budget ${format(BUDGETS.maxPublicArtRaw)}.`);
  }
  if (largestVariant && largestVariant.raw > BUDGETS.maxResponsiveVariantRaw) {
    fail(`${path.relative(appDir, largestVariant.filePath)} is ${format(largestVariant.raw)}, above responsive variant budget ${format(BUDGETS.maxResponsiveVariantRaw)}.`);
  }
  if (totalOriginalArt > BUDGETS.totalOriginalPublicArtRaw) {
    fail(`original public/art total ${format(totalOriginalArt)} exceeds budget ${format(BUDGETS.totalOriginalPublicArtRaw)}.`);
  }
  if (totalVariantArt > BUDGETS.totalResponsiveVariantRaw) {
    fail(`responsive variant total ${format(totalVariantArt)} exceeds budget ${format(BUDGETS.totalResponsiveVariantRaw)}.`);
  }
  if (totalArt > BUDGETS.totalPublicArtRaw) {
    fail(`public/art total ${format(totalArt)} exceeds budget ${format(BUDGETS.totalPublicArtRaw)}.`);
  }

  console.log("Performance budgets passed.");
  console.log(`Largest JS chunks: ${jsFiles.slice(0, 5).map((file) => `${file.name} ${format(file.raw)} raw/${format(file.gzip)} gzip`).join(" · ")}`);
  if (largestArt) {
    console.log(`Largest original art asset: ${path.relative(appDir, largestArt.filePath)} ${format(largestArt.raw)} · total originals ${format(totalOriginalArt)} · variants ${format(totalVariantArt)} · total with variants ${format(totalArt)}`);
  }
}

main();
