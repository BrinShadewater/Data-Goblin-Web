// Browser-free per-route meta prerender. Writes English shells at
// dist/<route>/index.html and French shells at dist/fr/<route>/index.html, each
// with route- and language-specific <title>/description/OG tags, a
// self-referencing canonical, and hreflang alternates (en-CA / fr-CA /
// x-default) so crawlers index each language at its own URL. Pure Node.
const fs = require("fs");
const path = require("path");

const DIST = process.env.PRERENDER_DIST ? path.resolve(process.env.PRERENDER_DIST) : path.resolve(__dirname, "../dist");
const SITE = "https://datagoblin.ca";
const indexPath = path.join(DIST, "index.html");
if (!fs.existsSync(indexPath)) { console.error("prerender-meta: dist/index.html missing — skipping"); process.exit(0); }
const base = fs.readFileSync(indexPath, "utf8");

const DESC_EN = "A free, open field guide to AI, data centres, and digital sovereignty, written for Canadians. Every claim comes with a receipt.";
const DESC_FR = "Un guide de terrain gratuit et ouvert sur l'IA, les centres de données et la souveraineté numérique, écrit pour les Canadiens. Chaque affirmation s'accompagne d'un reçu.";
const HOME_FULL_EN = "Data Goblin — A Field Guide to AI, Power, and Data in Canada";
const HOME_FULL_FR = "Data Goblin — Guide de terrain sur l'IA, la puissance et les données au Canada";

// route -> { en: [title, desc], fr: [title, desc] }   (title is the page name; "— Data Goblin" is appended)
const ROUTE_META = [
  ["/guide", "Field Guide", DESC_EN, "Guide de terrain", DESC_FR],
  ["/map", "Map", "Browse the field guide by region and question.", "Carte", "Parcourez le guide par région et par question."],
  ["/loot", "Glossary", "Plain-language definitions for the AI, data, and sovereignty terms the guide uses.", "Glossaire", "Définitions en langage clair des termes d'IA, de données et de souveraineté utilisés dans le guide."],
  ["/receipts", "Receipts", "The claim-by-claim source ledger behind the guide.", "Reçus", "Le registre des sources, revendication par revendication, derrière le guide."],
  ["/about", "About", "About Data Goblin and Shadewater Labs.", "À propos", "À propos de Data Goblin et de Shadewater Labs."],
  ["/contribute", "Contribute", "Suggest a source, flag an error, or help improve the guide.", "Contribuer", "Suggérez une source, signalez une erreur ou aidez à améliorer le guide."],
  ["/updates", "Updates & Corrections", "A dated log of what changed and what was corrected in the guide.", "Mises à jour et corrections", "Un journal daté de ce qui a changé et de ce qui a été corrigé dans le guide."],
  ["/toolkit", "The Toolkit · Test Any AI Claim", "Run any AI claim through the guide’s bias-mapping method: who’s making it, what’s the scope, and where’s the receipt.", "La boîte à outils · Tester toute allégation d'IA", "Passez n'importe quelle allégation d'IA au crible de la méthode de cartographie des biais du guide : qui la formule, quelle est la portée, et où est le reçu."],
  ["/privacy", "Privacy", "What this site stores, and what it does not.", "Confidentialité", "Ce que ce site stocke, et ce qu'il ne stocke pas."],
];

function chapterTitle(dir, n, lang) {
  try {
    const ch = JSON.parse(fs.readFileSync(path.join(dir, `ch${String(n).padStart(2, "0")}.json`), "utf8"));
    const t = (ch.title || "").split(" — ")[0];
    if (n === 0) return lang === "fr" ? "Pages liminaires" : "Front Matter";
    if (n === 20) return lang === "fr" ? "Annexe — Bibliothèque des sources" : "Source Library Appendix";
    return lang === "fr" ? `Chapitre ${n} : ${t}` : `Chapter ${n}: ${t}`;
  } catch { return lang === "fr" ? `Chapitre ${n}` : `Chapter ${n}`; }
}
try {
  const enDir = path.join(DIST, "content", "chapters");
  const frDir = path.join(DIST, "content", "fr", "chapters");
  for (const f of fs.readdirSync(enDir).filter((n) => /^ch\d+\.json$/.test(n))) {
    const n = JSON.parse(fs.readFileSync(path.join(enDir, f), "utf8")).number;
    ROUTE_META.push([`/chapter/${n}`, chapterTitle(enDir, n, "en"), DESC_EN, chapterTitle(frDir, n, "fr"), DESC_FR]);
  }
} catch (e) { console.warn("prerender-meta: chapter read warning —", e.message); }

const TOPICS = [
  ["sovereignty", "AI Sovereignty in Canada", "La souveraineté de l'IA au Canada"],
  ["data-centres", "Canada's AI Data Centres", "Les centres de données d'IA du Canada"],
  ["environment", "AI's Environmental Footprint", "L'empreinte environnementale de l'IA"],
  ["copyright", "AI, Copyright & Creators in Canada", "IA, droit d'auteur et créateurs au Canada"],
  ["deepfakes", "Deepfakes & Misinformation", "Hypertrucages et désinformation"],
  ["privacy", "AI, Privacy & Surveillance", "IA, vie privée et surveillance"],
  ["labour", "AI, Jobs & the Canadian Economy", "IA, emploi et économie canadienne"],
  ["governance", "How AI Is Governed in Canada", "Comment l'IA est gouvernée au Canada"],
];
for (const [slug, en, fr] of TOPICS) ROUTE_META.push([`/topic/${slug}`, en, DESC_EN, fr, DESC_FR]);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function render(route, fullTitle, desc, lang) {
  const urlEn = SITE + (route || "/");
  const urlFr = SITE + "/fr" + route; // "" -> /fr, "/map" -> /fr/map
  const self = lang === "fr" ? urlFr : urlEn;
  let h = base;
  if (lang === "fr") h = h.replace('<html lang="en-CA">', '<html lang="fr-CA">');
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`);
  h = h.replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
  h = h.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(fullTitle)}$2`);
  h = h.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
  h = h.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(self)}$2`);
  if (lang === "fr") h = h.replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1fr_CA$2`);
  h = h.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(fullTitle)}$2`);
  h = h.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
  const alternates =
    `<link rel="canonical" href="${esc(self)}" />` +
    `\n    <link rel="alternate" hreflang="en-CA" href="${esc(urlEn)}" />` +
    `\n    <link rel="alternate" hreflang="fr-CA" href="${esc(urlFr)}" />` +
    `\n    <link rel="alternate" hreflang="x-default" href="${esc(urlEn)}" />`;
  h = h.replace(/<link rel="canonical" href="[^"]*" \/>/, alternates);
  return h;
}

function write(relPath, html) {
  const dir = path.join(DIST, relPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

let count = 0;
// Home (both languages)
write("", render("", HOME_FULL_EN, DESC_EN, "en")); // overwrites dist/index.html with hreflang
write("fr", render("", HOME_FULL_FR, DESC_FR, "fr"));
count += 2;
for (const [route, enTitle, enDesc, frTitle, frDesc] of ROUTE_META) {
  const rel = route.replace(/^\//, "");
  write(rel, render(route, `${enTitle} — Data Goblin`, enDesc, "en"));
  write("fr/" + rel, render(route, `${frTitle} — Data Goblin`, frDesc, "fr"));
  count += 2;
}
console.log(`prerender-meta: wrote ${count} per-route HTML shells (EN + FR)`);
