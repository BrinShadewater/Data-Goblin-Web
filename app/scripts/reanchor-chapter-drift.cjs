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

/**
 * Anchors whose phrase occurs in exactly one chapter. Verified below, so these
 * involve no choice at all.
 */
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

/**
 * Anchors whose phrase appears in more than one chapter, so the destination is
 * a judgement about which sentence the receipt verifies. Alex confirmed these
 * three on 2026-07-31; they are applied with the ambiguity-guard relaxed and
 * the reasoning recorded, because a script cannot derive them.
 *
 * Four others are deliberately NOT here and stay in the check's ratchet:
 *   #10 "€35"  — ch17 vs ch18, both state the EU AI Act fine; a coin flip.
 *   #7  "Ewert v. Canada" — ch10 treats it in full, ch15 refers back.
 *   #34 "2024-25 privacy opinion research" — ch10 and ch15 are near identical.
 *   #42 "golf" — in no chapter; a wrong anchor, not a drifted one.
 */
const JUDGED = [
  // --- Second pass, 2026-08-01. Rule applied consistently: FOLLOW THE PROSE
  // THAT MOVED. A receipt was written against a specific passage; when that
  // passage moved chapters the receipt goes with it, even where a different
  // chapter now discusses the same topic. That is why #7 and #34 go to ch15
  // (the old ch13 content) rather than ch10, which covers the same subjects but
  // is not the text these receipts were written against.
  {
    id: 10, from: "15", to: "17",
    why: "EU AI Act fine: ch17 is where old ch15 landed. ch18 states the same figure, but this receipt was written against the governance chapter's text.",
  },
  {
    id: 7, from: "13", to: "15",
    why: 'Ewert v. Canada: corrects a confabulated "Mason v. Canada" in the old ch13, which is now ch15. ch10 treats the case in full — ch15 even says so — but the error being corrected lived here.',
  },
  {
    id: 34, from: "13", to: "15",
    why: "OPC 2024-25 polling: same old-ch13 passage as #7. ch10 carries a near-identical sentence, but this is the text the receipt was written against.",
  },
  {
    // Not drift. The anchor was simply wrong — "golf" is in no chapter at all.
    // Re-anchored to the sentence that actually makes the claim: ch5's "Sean
    // Fraser as Justice Minister tabled Bill C-16 in December 2025". The ledger
    // entry itself lists "(Ch 5/9/10/13, appendix)", ch5 first.
    id: 42, from: "8", to: "5",
    reanchorTo: "tabled Bill C-16 in December 2025",
    why: 'Bill C-16 status: the old anchor "golf" matched nothing anywhere. ch5 states the tabling claim the ledger entry verifies.',
  },

  // --- First pass, confirmed 2026-07-31.
  {
    id: 11, from: "12", to: "13",
    why: 'TAKE IT DOWN Act: ch13 carries the substantive treatment (4 mentions incl. the takedown duty); ch17 mentions it once in passing.',
  },
  {
    id: 4, from: "12", to: "13",
    why: "Denmark: ch13 states the likeness-rights amendment itself, which is what ledger entry 4 is about; ch11 and ch20 cite it as precedent.",
  },
  {
    id: 8, from: "16", to: "18",
    why: 'Ontario private-sector privacy law: ledger entry 8 is specifically about Ontario, and ch18 is where "What Ontario lacks…" appears; ch10 is the general regime.',
  },
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

/** Already at its destination? Then this run is a no-op for that anchor. */
const alreadyMoved = (id, to) => (anchors[to] || []).some((a) => a.id === id);

for (const m of MOVES) {
  if (alreadyMoved(m.id, m.to)) continue;
  const src = anchors[m.from] || [];
  const i = src.findIndex((a) => a.id === m.id);
  if (i < 0) {
    console.error(`#${m.id}: not filed under ch${m.from} and not at ch${m.to}. Aborting.`);
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

for (const j of JUDGED) {
  if (alreadyMoved(j.id, j.to)) continue;
  const src = anchors[j.from] || [];
  const i = src.findIndex((a) => a.id === j.id);
  if (i < 0) {
    console.error(`#${j.id}: not filed under ch${j.from} and not at ch${j.to}. Aborting.`);
    process.exit(1);
  }
  const entry = src[i];
  // A judged move may also replace the phrase itself, for the case where the
  // old anchor was simply wrong rather than drifted (#42's "golf").
  if (j.reanchorTo) entry.anchor = j.reanchorTo;
  const dest = proseOf(j.to);
  if (!dest || !dest.includes(entry.anchor)) {
    console.error(`#${j.id}: ${JSON.stringify(entry.anchor)} is not in ch${j.to}. Aborting.`);
    process.exit(1);
  }
  src.splice(i, 1);
  if (src.length === 0) delete anchors[j.from];
  (anchors[j.to] = anchors[j.to] || []).push(entry);
  moved.push(`#${j.id} ${JSON.stringify(entry.anchor)}  ch${j.from} -> ch${j.to}   [judged] ${j.why}`);
}

const body = JSON.stringify(anchors, null, 1) + "\n";
for (const dir of COPIES) fs.writeFileSync(path.join(dir, "claim-anchors.json"), body);

console.log(moved.join("\n"));
console.log(`\nmoved ${moved.length} anchors, wrote ${COPIES.length} copies`);
