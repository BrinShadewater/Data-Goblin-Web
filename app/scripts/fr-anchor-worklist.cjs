/**
 * Worklist for translating claim anchors into French.
 *
 * Receipt markers pin a ledger entry to a verbatim phrase in the prose. The
 * anchors are English, so on the French edition they match nothing and the
 * receipts apparatus silently disappears. This prints, for each anchor that
 * still resolves in English but not in French, the English phrase, the English
 * paragraph it sits in, and the SAME paragraph in the French edition — so the
 * French phrase is chosen deliberately from the real translated sentence
 * rather than guessed at by fuzzy matching.
 *
 *   node scripts/fr-anchor-worklist.cjs
 */
const fs = require("fs");
const path = require("path");

const CONTENT = path.join(__dirname, "..", "public", "content");
const anchors = JSON.parse(fs.readFileSync(path.join(CONTENT, "claim-anchors.json"), "utf8"));

const load = (dir, num) => {
  const p = path.join(CONTENT, dir, "chapters", `ch${String(num).padStart(2, "0")}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
};

/** Ordered prose paragraphs, section by section, so EN and FR line up. */
function paragraphs(ch) {
  const out = [];
  const push = (md) =>
    (md || "")
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((t) => out.push(t));
  push(ch.startHere);
  (ch.sections || []).forEach((s) => push(s.markdown));
  return out;
}

const rows = [];
for (const [num, list] of Object.entries(anchors)) {
  const en = load("", num);
  const fr = load("fr", num);
  if (!en || !fr) continue;
  const enP = paragraphs(en);
  const frP = paragraphs(fr);
  const enProse = enP.join("\n");
  const frProse = frP.join("\n");

  for (const a of list) {
    if (!enProse.includes(a.anchor)) continue; // dead in EN — a separate problem
    if (frProse.includes(a.anchor)) continue; // already works in FR
    const i = enP.findIndex((p) => p.includes(a.anchor));
    rows.push({
      chapter: num,
      id: a.id,
      anchor: a.anchor,
      aligned: enP.length === frP.length,
      en: i >= 0 ? enP[i] : null,
      fr: i >= 0 && enP.length === frP.length ? frP[i] : null,
    });
  }
}

for (const r of rows) {
  console.log("=".repeat(70));
  console.log(`ch${r.chapter} #${r.id}  ANCHOR: ${JSON.stringify(r.anchor)}  aligned=${r.aligned}`);
  console.log("EN: " + (r.en || "(not located)").replace(/\s+/g, " ").slice(0, 400));
  console.log("FR: " + (r.fr || "(no aligned paragraph)").replace(/\s+/g, " ").slice(0, 400));
}
console.log("=".repeat(70));
console.log(`${rows.length} anchors need a French phrase; ${rows.filter((r) => r.fr).length} have an aligned paragraph`);
