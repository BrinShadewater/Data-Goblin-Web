// check-i18n-gaps — every string the UI wraps in tr("...") must have a French entry in
// src/ui-fr.ts, or /fr silently shows it in English (tr() falls back to its argument).
//
// Why a check: on 2026-09-05 seven strings had been English on the French site for
// months (page nav, volume, search, an alt text, "Sources", a placeholder) and nothing
// could have noticed. Literal keys only; strings that arrive through data arrays and
// tr(item.field) are covered by the data-goblin-i18n helper's per-page extract.
//
// Exit 1 with the list when anything is missing. Run: node scripts/check-i18n-gaps.cjs

const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "..", "src");
const DICT = path.join(SRC, "ui-fr.ts");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(entry.name) && full !== DICT) out.push(full);
  }
  return out;
}

const dictSource = fs.readFileSync(DICT, "utf8");
const match = dictSource.match(/const FR: Record<string, string> = (\{[\s\S]*?\});/);
if (!match) {
  console.error("check-i18n-gaps: could not find the FR dictionary literal in ui-fr.ts");
  process.exit(2);
}
const fr = JSON.parse(match[1]);

const keys = new Map();
const literal = /\btr\(\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/g;
for (const file of walk(SRC)) {
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(literal)) {
    const key = (m[1] ?? m[2]).replace(/\\(["'])/g, "$1");
    if (!keys.has(key)) keys.set(key, path.relative(SRC, file));
  }
}

const missing = [...keys].filter(([key]) => !(key in fr));
console.log(`check-i18n-gaps: ${keys.size} tr() literals, ${Object.keys(fr).length} dictionary keys, ${missing.length} missing French`);
if (missing.length) {
  for (const [key, file] of missing) console.log(`  ${file}: ${JSON.stringify(key)}`);
  console.log("Add them with the data-goblin-i18n helper (i18n_merge.cjs merge), never by hand-editing ui-fr.ts.");
  process.exit(1);
}
