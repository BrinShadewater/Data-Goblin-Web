/**
 * Build public/content/fr/claim-anchors.json from the English anchors.
 *
 *   node scripts/build-fr-anchors.cjs
 *
 * Receipt markers pin a ledger entry to a verbatim phrase in the prose, so the
 * English anchors match nothing in the French edition and the whole receipts
 * apparatus disappears there. Each French phrase below was read out of the
 * aligned French paragraph by hand, not produced by fuzzy matching: a
 * mis-anchored receipt would attach a source to the wrong sentence, which is
 * worse than showing no receipt at all.
 *
 * Anchors that survive translation unchanged (proper nouns, "AI for All",
 * "PUE") are carried over automatically — they are not listed here.
 *
 * Every anchor this writes is verified to appear verbatim in the French prose;
 * the script fails loudly if one does not.
 */
const fs = require("fs");
const path = require("path");

const CONTENT = path.join(__dirname, "..", "public", "content");

/**
 * chapter -> ledger id -> French phrase.
 * Keep the phrase as short as it can be while still unique in its paragraph:
 * the marker underlines it in the reading flow.
 */
const FR = {
  1: {
    28: "soixante-dix définitions de l'intelligence",
    38: "université Massey",
    48: "Registre de l'IA du Conseil du Trésor",
    25: "800 000",
  },
  5: {
    3: "Code de conduite volontaire",
    22: "Fonds d'accès informatique IA",
    26: "Bell IA Fabric",
    23: "19,2 %",
  },
  6: {
    13: "règlement délégué",
    14: "GPU de centres de données",
    41: "1 200 MW",
    // 24 ("one-fifteenth") is deliberately absent — see UNTRANSLATABLE below.
  },
  8: {
    27: "54 % des projets énergétiques-transition-minéraux du monde",
    39: "22 % des installations canadiennes",
    21: "comté de Loudoun",
    44: "36 milliards de dollars américains",
  },
  9: {
    30: "projets miniers de transition énergétique",
    50: "Abondant Intelligences",
    19: "Principes du PACO",
    43: "28 000",
  },
  11: { 29: "n'a ni signé ni adhéré" },
  12: { 49: "projet de loi C-16" },
};

/**
 * Anchors left out on purpose, with the reason. These are not oversights.
 *
 * ch6 #24 "one-fifteenth" — the French edition renders this as "un dixième"
 *   (one tenth). That is a machine-translation error: the English claim, and
 *   the source behind ledger entry 24, is one-fifteenth. Anchoring the receipt
 *   to "un dixième" would attach a verified source to a wrong number and make
 *   the apparatus vouch for the error. Left unanchored until the French text
 *   is corrected.
 */
const UNTRANSLATABLE = [{ chapter: 6, id: 24, reason: "FR text says 'un dixième' (one tenth) for one-fifteenth" }];

const load = (dir, num) => {
  const p = path.join(CONTENT, dir, "chapters", `ch${String(num).padStart(2, "0")}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
};
const prose = (ch) => [ch.startHere, ...(ch.sections || []).map((s) => s.markdown)].join("\n\n");

const en = JSON.parse(fs.readFileSync(path.join(CONTENT, "claim-anchors.json"), "utf8"));
const out = {};
const problems = [];
let carried = 0;
let translated = 0;
let deadInEn = 0;

for (const [num, list] of Object.entries(en)) {
  const enCh = load("", num);
  const frCh = load("fr", num);
  if (!enCh || !frCh) continue;
  const enText = prose(enCh);
  const frText = prose(frCh);

  for (const a of list) {
    if (!enText.includes(a.anchor)) {
      deadInEn++;
      continue; // dead in English too — reported separately, not a French problem
    }
    if (UNTRANSLATABLE.some((u) => String(u.chapter) === String(num) && u.id === a.id)) continue;

    let anchor = null;
    if (frText.includes(a.anchor)) {
      anchor = a.anchor; // survives translation unchanged
      carried++;
    } else if (FR[num] && FR[num][a.id]) {
      anchor = FR[num][a.id];
      translated++;
      if (!frText.includes(anchor)) {
        problems.push(`ch${num} #${a.id}: ${JSON.stringify(anchor)} is not in the French prose`);
        continue;
      }
    } else {
      problems.push(`ch${num} #${a.id}: no French phrase for ${JSON.stringify(a.anchor)}`);
      continue;
    }
    (out[num] = out[num] || []).push({ anchor, id: a.id, status: a.status });
  }
}

if (problems.length) {
  console.error("PROBLEMS:\n  " + problems.join("\n  "));
  process.exit(1);
}

// Written to BOTH copies. site/content is canonical and app/public/content is
// what the app serves; check_content_sync.py fails the build if they diverge.
const body = JSON.stringify(out, null, 1) + "\n";
const dests = [
  path.join(CONTENT, "fr", "claim-anchors.json"),
  path.join(__dirname, "..", "..", "content", "fr", "claim-anchors.json"),
];
for (const d of dests) {
  fs.mkdirSync(path.dirname(d), { recursive: true });
  fs.writeFileSync(d, body);
}
console.log(
  `wrote ${dests.length} copies\n` +
    `  ${carried} carried over unchanged, ${translated} translated by hand\n` +
    `  ${Object.values(out).reduce((n, l) => n + l.length, 0)} anchors across ${Object.keys(out).length} chapters\n` +
    `  ${UNTRANSLATABLE.length} deliberately omitted, ${deadInEn} skipped as dead in English too`
);
