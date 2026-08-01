/**
 * Claim-anchor resolution check.
 *
 *   node scripts/check-claim-anchors.cjs
 *
 * Receipt markers pin a ledger entry to a VERBATIM phrase in the prose. If the
 * manuscript is edited and the phrase changes, the anchor silently stops
 * matching: no error, no warning, the marker just never renders. Nothing caught
 * that, and by 2026-07-31 seventeen of forty-nine anchors had gone dead in
 * English — a receipts apparatus quietly failing to show its receipts.
 *
 * This fails the build when an anchor no longer resolves, so the next one is
 * caught the day it breaks rather than months later.
 *
 * The French edition is checked too, but only warns: fr/claim-anchors.json is
 * hand-curated against a machine-translated text and is expected to be a subset.
 */
const fs = require("fs");
const path = require("path");

const CONTENT = path.join(__dirname, "..", "public", "content");

/**
 * Anchors already broken when this check was written, on 2026-07-31. They are a
 * RATCHET, not an exemption: the build fails if anything outside this list stops
 * resolving, and it also fails if an entry here starts resolving, so the list
 * can only shrink.
 *
 * All but "golf" look like chapter drift — chapters were inserted and
 * claim-anchors.json was never renumbered, so ch12's anchors are now in ch13,
 * ch13's in ch15, ch14's in ch16, ch15's in ch17, ch16's in ch18. Several are
 * NOT safe to renumber mechanically, because the phrase appears in more than
 * one candidate chapter (#34 and #8 in both ch10 and a later one), and picking
 * wrong would attach a verified source to the wrong sentence. Deciding which
 * sentence each receipt verifies is an editorial call — see WORK-LOG.
 */
const KNOWN_UNRESOLVED = new Set([
  "8#42", // "golf" — not in any chapter; looks like a bad anchor for the Bill C-16 entry
  "12#11", "12#12", "12#4", "12#18", "12#32",
  "13#34", "13#7", "13#15",
  "14#35", "14#9",
  "15#2", "15#16", "15#17", "15#10",
  "16#8", "16#31",
]);

const load = (rel) => {
  const p = path.join(CONTENT, rel);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
};
const chapterProse = (dir, num) => {
  const ch = load(path.join(dir, "chapters", `ch${String(num).padStart(2, "0")}.json`));
  return ch ? [ch.startHere, ...(ch.sections || []).map((s) => s.markdown)].join("\n\n") : null;
};

function check(anchorsFile, dir, label, useBaseline) {
  const anchors = load(anchorsFile);
  if (!anchors) return { label, missing: [], known: [], fixed: [], total: 0, skipped: true };
  const missing = [];
  const known = [];
  const seenKeys = new Set();
  let total = 0;
  for (const [num, list] of Object.entries(anchors)) {
    const prose = chapterProse(dir, num);
    if (prose == null) {
      missing.push(`ch${num}: chapter file missing`);
      continue;
    }
    for (const a of list) {
      total++;
      const key = `${num}#${a.id}`;
      seenKeys.add(key);
      if (prose.includes(a.anchor)) continue;
      const entry = `ch${num} #${a.id} ${JSON.stringify(a.anchor)}`;
      if (useBaseline && KNOWN_UNRESOLVED.has(key)) known.push(entry);
      else missing.push(entry);
    }
  }
  // Baseline entries that now resolve (or vanished) should leave the list.
  const fixed = useBaseline
    ? [...KNOWN_UNRESOLVED].filter((k) => !known.some((e) => e.startsWith(`ch${k.split("#")[0]} #${k.split("#")[1]} `)))
    : [];
  return { label, missing, known, fixed, total };
}

const en = check("claim-anchors.json", "", "EN", true);
const fr = check(path.join("fr", "claim-anchors.json"), "fr", "FR", false);

for (const r of [en, fr]) {
  if (r.skipped) {
    console.log(`${r.label}: no anchors file, skipped`);
    continue;
  }
  const ok = r.total - r.missing.length - r.known.length;
  console.log(
    `${r.label}: ${ok}/${r.total} anchors resolve` +
      (r.known.length ? ` (+${r.known.length} known-broken, see KNOWN_UNRESOLVED)` : "")
  );
  if (r.missing.length) console.log("  UNRESOLVED:\n    " + r.missing.join("\n    "));
}

if (fr.missing.length) {
  console.log("\nFR anchors are hand-curated against a machine translation; unresolved ones warn only.");
}

let failed = false;
if (en.missing.length) {
  console.error(
    `\nFAIL: ${en.missing.length} English claim anchor(s) newly stopped matching the manuscript.\n` +
      `Their receipt markers will not render. Either re-anchor them to the current wording\n` +
      `in claim-anchors.json, or drop the entry if the claim is gone.`
  );
  failed = true;
}
if (en.fixed.length) {
  console.error(
    `\nFAIL: ${en.fixed.length} anchor(s) in KNOWN_UNRESOLVED now resolve or no longer exist:\n    ` +
      en.fixed.join("\n    ") +
      `\nRemove them from the list in this script — it is a ratchet and may only shrink.`
  );
  failed = true;
}
if (failed) process.exit(1);
console.log("\nClaim anchors resolve (known-broken baseline unchanged).");
