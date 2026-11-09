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
 * chapter -> ledger id -> French phrase, or a map by English phrase when
 * the same receipt is linked from more than one claim.
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
    115: "objectif fédéral d’accès à 500 MW de capacité de calcul",
    42: "a déposé le projet de loi C-16 en décembre 2025",
    3: "Code de conduite volontaire",
    22: "Fonds d'accès informatique IA",
    26: "Bell IA Fabric",
    23: "19,2 %",
  },
  6: {
    116: "Sherwood, près de Regina",
    13: "règlement délégué",
    14: "GPU de centres de données",
    41: "1 200 MW",
    // Anchorable again as of 2026-08-01: the French said "un dixième" (one
    // tenth) for one-fifteenth, so this was held back rather than let a receipt
    // vouch for a wrong number. pipeline/fr-corrections.json fixes the text.
    24: "un quinzième",
  },
  8: {
    117: "15 demandes totalisant près de 800 MW",
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
  10: {
    77: "C'est un outil basé sur Microsoft Excel",
    78: "Des bots à la porte",
    82: "Clearview indiquaient 521 requêtes de recherche",
  },
  11: { 29: "n'a ni signé ni adhéré" },
  12: {
    49: "projet de loi C-16",
    108: "a changé les profils recherchés",
    109: "animer du matériel d’archives",
    110: "plusieurs centaines de personnes",
    112: "refusé de laisser un producteur modéliser leur voix",
  },
  // Added after reanchor-chapter-drift.cjs moved these to the chapters their
  // phrases actually live in; they had been dead in English, so they had never
  // needed a French phrase before.
  13: {
    114: "a élargi l’infraction fédérale d’usurpation de qualité électorale",
    12: "cas aggravés",
    4: "Danemark",
    32: { "0.12%-of-views (on X)": "0,12\u00a0% des vues sur X" },
    // The French edition does not name the Act in the takedown-duty paragraph
    // the English anchors to; its only mention is "US TAKE IT DOWN" in the
    // chapter's international-comparison sentence. Same statute, slightly
    // different sentence — noted so nobody thinks it drifted.
    11: "TAKE IT DOWN",
  },
  14: {
    98: "Loi sur les nouvelles en ligne",
    99: "640 médias locaux",
  },
  15: {
    15: "retour en arrière du GPT-4o",
    7: "Ewert c. Canada",
    34: "Commissariat à la protection de la vie privée de 2024-25",
  },
  16: {
    35: "Les employeurs canadiens dépensent environ",
    111: "19 % des 446",
    113: "26 % moins d’emplois salariés",
  },
  17: {
    10: "35 millions d'euros",
    2: "Convention-cadre du Conseil de l'Europe sur l'IA",
    16: "IA Security Institute",
    17: "plan d'action en juillet 2025",
  },
  18: { 8: "loi générale sur la protection des renseignements personnels du secteur privé" },
};

/**
 * Anchors left out on purpose, with the reason. These are not oversights.
 *
 * Empty as of 2026-08-01. It held ch6 #24, where the French rendered
 * "one-fifteenth" as "un dixième" (one tenth) — anchoring a receipt there would
 * have made the apparatus vouch for a wrong number. The French text is
 * corrected now (pipeline/fr-corrections.json), so the anchor is back.
 *
 * If MT ever mangles a fact again, park the anchor here with the reason rather
 * than pointing a receipt at wrong text.
 */
const UNTRANSLATABLE = [];

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

    const translation = FR[num]?.[a.id];
    const curated = typeof translation === "string" ? translation : translation?.[a.anchor];
    let anchor;
    if (curated) {
      anchor = curated;
      translated++;
      if (!frText.includes(anchor)) {
        problems.push(`ch${num} #${a.id}: ${JSON.stringify(anchor)} is not in the French prose`);
        continue;
      }
    } else if (frText.includes(a.anchor)) {
      anchor = a.anchor; // survives translation unchanged
      carried++;
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
