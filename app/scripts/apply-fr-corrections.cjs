/**
 * Apply pipeline/fr-corrections.json to the already-generated French content.
 *
 *   node scripts/apply-fr-corrections.cjs           # apply
 *   node scripts/apply-fr-corrections.cjs --check   # verify only, non-zero if stale
 *
 * translate_fr.py applies the same corrections on every translation run, but
 * re-running MT needs the OPUS-MT model ($DG_MT_MODEL) which is not on every
 * machine. This repairs the committed FR JSON in place from the same source of
 * truth, so the two cannot drift.
 *
 * Writes both content copies, since check_content_sync.py fails the build when
 * site/content and app/public/content diverge.
 */
const fs = require("fs");
const path = require("path");

const SITE = path.join(__dirname, "..", "..");
const CORRECTIONS = path.join(SITE, "pipeline", "fr-corrections.json");
const ROOTS = [
  path.join(SITE, "app", "public", "content", "fr"),
  path.join(SITE, "content", "fr"),
];

const checkOnly = process.argv.includes("--check");
const { corrections } = JSON.parse(fs.readFileSync(CORRECTIONS, "utf8"));

const walk = (node, fixes, counter) => {
  if (typeof node === "string") {
    let s = node;
    for (const c of fixes) {
      if (s.includes(c.find)) {
        s = s.split(c.find).join(c.replace);
        counter.n++;
      }
    }
    return s;
  }
  if (Array.isArray(node)) return node.map((v) => walk(v, fixes, counter));
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = walk(v, fixes, counter);
    return out;
  }
  return node;
};

let applied = 0;
let stale = 0;

for (const c of corrections) {
  for (const root of ROOTS) {
    const file = path.join(root, c.file);
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw);
    const counter = { n: 0 };
    const fixed = walk(data, [c], counter);
    if (counter.n === 0) continue;
    stale += counter.n;
    if (checkOnly) {
      console.log(`STALE  ${path.relative(SITE, file)}  ${counter.n}x ${JSON.stringify(c.find)}`);
      continue;
    }
    fs.writeFileSync(file, JSON.stringify(fixed, null, 1) + "\n");
    applied += counter.n;
    console.log(`fixed  ${path.relative(SITE, file)}  ${counter.n}x`);
    console.log(`       ${JSON.stringify(c.find)} -> ${JSON.stringify(c.replace)}`);
  }
}

if (checkOnly) {
  if (stale) {
    console.error(
      `\nFAIL: ${stale} uncorrected string(s) in the French edition.\n` +
        `Run: node scripts/apply-fr-corrections.cjs`
    );
    process.exit(1);
  }
  console.log(`French corrections are applied (${corrections.length} in the map).`);
  process.exit(0);
}

console.log(
  applied
    ? `\napplied ${applied} correction(s)`
    : `nothing to fix — all ${corrections.length} correction(s) already applied`
);
