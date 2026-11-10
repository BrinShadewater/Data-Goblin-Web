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
    138: "Registre de l'IA du Conseil du Trésor",
    25: "800 000",
  },
  2: { 131: "Des chercheurs ont extrait de GPT-2 des centaines de passages" },
  3: {
    132: "Meta a déclaré avoir utilisé le Projet Gutenberg et Books3 pour le premier LLaMA",
    133: "LAION-5B indexait environ 5,85 milliards de paires",
  },
  4: {
    105: "10 à 50 réponses de longueur moyenne",
    135: "1,2 à 5,0 millions de tonnes",
  },
  5: {
    118: "Ottawa s’est engagé à investir par étapes jusqu’à 1,6 milliard",
    138: "plus de 400 systèmes provenant de 42 institutions",
    115: "objectif fédéral d’accès à 500 MW de capacité de calcul",
    42: "a déposé le projet de loi C-16 en décembre 2025",
    3: "Code de conduite volontaire",
    22: "Fonds d'accès informatique IA",
    26: "Bell IA Fabric",
    23: "19,2 %",
    33: "à l’Hôpital général de Toronto",
  },
  6: {
    39: "environ 22 % des centres déclaraient leur PUE",
    116: "Sherwood, près de Regina",
    13: "règlement délégué",
    14: "GPU de centres de données",
    141: "1 200 MW",
    // Anchorable again as of 2026-08-01: the French said "un dixième" (one
    // tenth) for one-fifteenth, so this was held back rather than let a receipt
    // vouch for a wrong number. pipeline/fr-corrections.json fixes the text.
    24: "un quinzième",
  },
  7: { 118: "La prise de participation prévue par Ottawa s’accompagne d’engagements de Cohere" },
  8: {
    121: "En Irlande, les compteurs des centres de données",
    128: "Le Manitoba a adopté une loi",
    129: "Hydro-Québec propose un tarif CD",
    130: "L’Ontario propose une catégorie distincte",
    145: "Le prélèvement albertain sur les centres de données",
    146: "Les règles albertaines de raccordement",
    147: "l’agrandissement du parc industriel de Spruce Lake",
    117: "15 demandes totalisant près de 800 MW",
    27: "54 % se situaient sur les terres de peuples autochtones ou à proximité",
    39: "22 % de RNCan concerne la déclaration du PUE",
    21: "comté de Loudoun",
    106: "36 milliards de dollars américains",
  },
  9: {
    30: "projets miniers de transition énergétique",
    143: "Abondant Intelligences",
    19: "Principes du PACO",
    107: "a interrogé ses membres en 2023",
  },
  10: {
    70: "Le projet de loi C-22 sur l’accès légal",
    136: "un membre du personnel en mesure de réviser la décision",
    77: "C'est un outil basé sur Microsoft Excel",
    78: "Des bots à la porte",
    82: "Clearview indiquaient 521 requêtes de recherche",
  },
  11: {
    29: "n'a ni signé ni adhéré",
    134: {
      "Ontario Superior Court": "Cour supérieure de justice de l’Ontario",
      "The plaintiffs allege that OpenAI copied works they own or license": "Les demandeurs allèguent qu’OpenAI a copié sans autorisation",
    },
  },
  12: {
    139: "son cadre modernisé de certification des émissions canadiennes",
    42: "Loi visant à protéger les victimes",
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
    32: {
      "9.24%": "9,24 %",
      "0.12% of the sampled X post views": "0,12 % des vues des publications échantillonnées sur X",
    },
    // The French edition does not name the Act in the takedown-duty paragraph
    // the English anchors to; its only mention is "US TAKE IT DOWN" in the
    // chapter's international-comparison sentence. Same statute, slightly
    // different sentence — noted so nobody thinks it drifted.
    11: "TAKE IT DOWN",
  },
  14: {
    122: "Deezer a indiqué que les titres",
    98: "Loi sur les nouvelles en ligne",
    99: "640 médias locaux",
  },
  15: {
    15: "retour en arrière du GPT-4o",
    7: "Ewert c. Canada",
    34: "Commissariat à la protection de la vie privée de 2024-25",
  },
  16: {
    59: "31 % des salariés de 18 à 64 ans",
    123: "les embauches chez les 15 à 29 ans ont ralenti",
    35: "Les employeurs canadiens dépensent environ",
    111: "19 % des 446",
    113: "26 % moins d’emplois salariés",
  },
  17: {
    119: "L’orientation fédérale sur la préparation en matière de cybersécurité est entrée en vigueur le 1er octobre 2026",
    124: "des agents soumis à une évaluation de cybersécurité d’OpenAI",
    148: "des actions non autorisées dans 10 des 122 essais",
    10: "35 millions d'euros",
    2: "Convention-cadre du Conseil de l'Europe sur l'IA",
    16: "IA Security Institute",
    17: "plan d'action en juillet 2025",
  },
  18: {
    120: "948 méthodes fonctionnelles d’exploitation permettant une élévation locale de privilèges",
    125: "Le Commissariat à la protection de la vie privée a recommandé",
    126: "En septembre 2026, OpenAI a présenté",
    144: "loi générale sur la protection des renseignements personnels du secteur privé",
    31: "40,69 sur 100",
    137: "14 des 19 développeurs sollicités",
  },
  21: { 127: "un essai randomisé mené dans 16 cliniques de soins primaires au Kenya" },
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
