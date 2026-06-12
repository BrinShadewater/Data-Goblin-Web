const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const appDir = path.resolve(__dirname, "..");
const distAssetsDir = path.join(appDir, "dist", "assets");
const artDir = path.join(appDir, "public", "art");

const BUDGETS = {
  chunks: {
    "index-": { raw: 60 * 1024, gzip: 15 * 1024 },
    "react-vendor-": { raw: 390 * 1024, gzip: 120 * 1024 },
    "icons-vendor-": { raw: 13 * 1024, gzip: 4 * 1024 },
    "Markdown-": { raw: 205 * 1024, gzip: 60 * 1024 },
    "FieldGuidePage-": { raw: 60 * 1024, gzip: 14 * 1024 },
  },
  anyJsChunkRaw: 390 * 1024,
  maxPublicArtRaw: 500 * 1024,
  totalPublicArtRaw: 6 * 1024 * 1024,
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

  const artFiles = walkFiles(artDir).map((filePath) => ({ filePath, raw: fs.statSync(filePath).size }));
  const totalArt = artFiles.reduce((sum, file) => sum + file.raw, 0);
  const largestArt = [...artFiles].sort((a, b) => b.raw - a.raw)[0];
  if (largestArt && largestArt.raw > BUDGETS.maxPublicArtRaw) {
    fail(`${path.relative(appDir, largestArt.filePath)} is ${format(largestArt.raw)}, above max public art budget ${format(BUDGETS.maxPublicArtRaw)}.`);
  }
  if (totalArt > BUDGETS.totalPublicArtRaw) {
    fail(`public/art total ${format(totalArt)} exceeds budget ${format(BUDGETS.totalPublicArtRaw)}.`);
  }

  console.log("Performance budgets passed.");
  console.log(`Largest JS chunks: ${jsFiles.slice(0, 5).map((file) => `${file.name} ${format(file.raw)} raw/${format(file.gzip)} gzip`).join(" · ")}`);
  if (largestArt) {
    console.log(`Largest art asset: ${path.relative(appDir, largestArt.filePath)} ${format(largestArt.raw)} · total art ${format(totalArt)}`);
  }
}

main();
