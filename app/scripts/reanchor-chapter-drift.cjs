/**
 * One-off: move claim anchors to the chapters their phrases actually live in.
 *
 *   node scripts/reanchor-chapter-drift.cjs
 *
 * Chapters were inserted at some point and claim-anchors.json was never
 * renumbered, so seventeen anchors pointed at chapters that no longer contain
 * their phrase and their receipt markers stopped rendering.
 *
 * ONLY the unambiguous ones are moved here: each phrase below occurs in exactly
 * one chapter of the whole book, so there is no question which sentence the
 * receipt attaches to. The seven where the phrase appears in more than one
 * candidate chapter are deliberately untouched — choosing among them means
 * deciding which sentence a receipt verifies, which is an editorial call, and
 * getting it wrong attaches a verified source to the wrong claim.
 *
 * Safe to re-run: it verifies before and after, and refuses to move anything
 * whose destination does not contain the phrase exactly once.
 */
const fs = require("fs");
const path = require("path");

const COPIES = [
  path.join(__dirname, "..", "public", "content"),
  path.join(__dirname, "..", "..", "content"),
];

/** id, the chapter it is filed under now, and where the phrase actually is. */
const MOVES = [
  { id: 12, from: "12", to: "13" }, // "aggravated"
  { id: 18, from: "12", to: "13" }, // "AB 2839"
  { id: 32, from: "12", to: "13" }, // "8.66%"
  { id: 15, from: "13", to: "15" }, // "GPT-4o rollback"
  { id: 35, from: "14", to: "16" }, // "per employee"
  { id: 9, from: "14", to: "16" }, // "CWA Canada"
  { id: 2, from: "15", to: "17" }, // "Council of Europe AI Framework Convention"
  { id: 16, from: "15", to: "17" }, // "AI Security Institute"
  { id: 17, from: "15", to: "17" }, // "AI Action Plan"
  { id: 31, from: "16", to: "18" }, // "40.7"
];

const base = COPIES[0];
const proseOf = (num) => {
  const p = path.join(base, "chapters", `ch${String(num).padStart(2, "0")}.json`);
  if (!fs.existsSync(p)) return null;
  const ch = JSON.parse(fs.readFileSync(p, "utf8"));
  return [ch.startHere, ...(ch.sections || []).map((s) => s.markdown)].join("\n\n");
};

const anchors = JSON.parse(fs.readFileSync(path.join(base, "claim-anchors.json"), "utf8"));
const moved = [];

for (const m of MOVES) {
  const src = anchors[m.from] || [];
  const i = src.findIndex((a) => a.id === m.id);
  if (i < 0) {
    console.error(`#${m.id}: not filed under ch${m.from} — already moved? Aborting.`);
    process.exit(1);
  }
  const entry = src[i];
  // The guard that matters is one CHAPTER, not one occurrence. Repeats inside a
  // chapter are fine — receiptLinkBlocks marks the first eligible one. What
  // would make this a judgement call is the phrase living in two chapters.
  const chapters = [];
  for (let n = 0; n <= 21; n++) {
    const p = proseOf(n);
    if (p && p.includes(entry.anchor)) chapters.push(n);
  }
  if (chapters.length !== 1 || String(chapters[0]) !== m.to) {
    console.error(
      `#${m.id}: ${JSON.stringify(entry.anchor)} appears in chapter(s) ${chapters.join(", ") || "none"}; ` +
        `expected exactly ch${m.to}. Aborting — this one is not mechanical.`
    );
    process.exit(1);
  }
  src.splice(i, 1);
  if (src.length === 0) delete anchors[m.from];
  (anchors[m.to] = anchors[m.to] || []).push(entry);
  moved.push(`#${m.id} ${JSON.stringify(entry.anchor)}  ch${m.from} -> ch${m.to}`);
}

const body = JSON.stringify(anchors, null, 1) + "\n";
for (const dir of COPIES) fs.writeFileSync(path.join(dir, "claim-anchors.json"), body);

console.log(moved.join("\n"));
console.log(`\nmoved ${moved.length} anchors, wrote ${COPIES.length} copies`);
