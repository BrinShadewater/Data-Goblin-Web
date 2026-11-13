// Browser-free per-route meta prerender. Writes English shells at
// dist/<route>/index.html and French shells at dist/fr/<route>/index.html, each
// with route- and language-specific <title>/description/OG tags, a
// self-referencing canonical, and hreflang alternates (en-CA / fr-CA /
// x-default) so crawlers index each language at its own URL. Pure Node.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const receiptNotes = require("../src/receiptNotes.json");
const latestUpdate = require("../src/latestUpdate.json");
const sourceChangeUpdate = require("../src/sourceChangeUpdate.json");
const editorialCorrectionUpdate = require("../src/editorialCorrectionUpdate.json");
const readerCorrectionsUpdate = require("../src/readerCorrectionsUpdate.json");
const readerEntry = require("../src/readerEntry.json");
const homeQuestions = require("../src/homeQuestions.json");
const dataCentrePower = require("../src/dataCentrePower.json");
const labourHiring = require("../src/labourHiring.json");
const dataCentrePowerUpdate = require("../src/dataCentrePowerUpdate.json");
const labourHiringUpdate = require("../src/labourHiringUpdate.json");
const receiptReviewUpdate = require("../src/receiptReviewUpdate.json");
const chapterExplainers = [
  { chapter: dataCentrePower.chapter, section: dataCentrePower.section, update: dataCentrePowerUpdate, file: "app/src/dataCentrePowerUpdate.json" },
  { chapter: labourHiring.chapter, section: labourHiring.section, update: labourHiringUpdate, file: "app/src/labourHiringUpdate.json" },
];

const DIST = process.env.PRERENDER_DIST ? path.resolve(process.env.PRERENDER_DIST) : path.resolve(__dirname, "../dist");
const SITE = "https://datagoblin.ca";
const BUILD_DATE = new Date().toISOString().slice(0, 10); // dateModified for Article freshness
const PUBLISHED = "2026-06-04"; // first edition / AI for All launch
const indexPath = path.join(DIST, "index.html");
if (!fs.existsSync(indexPath)) { console.error("prerender-meta: dist/index.html missing — skipping"); process.exit(0); }
let base = fs.readFileSync(indexPath, "utf8");

// Rebuild the Book schema's hasPart (in the index.html JSON-LD graph) straight from
// book.json, so the structured chapter list can't silently drift from the real book
// — it had (it was missing "The News" and shifted every later chapter by one).
try {
  const b = JSON.parse(fs.readFileSync(path.join(DIST, "content", "book.json"), "utf8"));
  const chaps = [];
  for (const part of b.parts || []) for (const ch of part.chapters || []) {
    if (typeof ch.number === "number") chaps.push([ch.number, String(ch.title || "").split(" — ")[0]]);
  }
  if (chaps.length && /"hasPart":\s*\[/.test(base)) {
    const hasPart = chaps.map(([n, t]) =>
      `        {\n          "@type": "Chapter",\n          "position": ${n},\n          "name": ${JSON.stringify(t)},\n          "url": "${SITE}/chapter/${n}"\n        }`
    ).join(",\n");
    base = base.replace(/"hasPart":\s*\[[\s\S]*?\n(\s*)\]/, `"hasPart": [\n${hasPart}\n$1]`);
  }
} catch (e) { console.warn("prerender-meta: book hasPart rebuild warning —", e.message); }

const DESC_EN = "A free, open field guide to AI, data centres, and digital sovereignty, written for Canadians. Every claim comes with a receipt.";
const DESC_FR = "Un guide de terrain gratuit sur l'IA, les centres de données et la souveraineté numérique au Canada. Chaque affirmation a son reçu.";
const HOME_DESC_EN = "Read Data Goblin, a free, interactive guide to AI, data centres, and digital sovereignty in Canada. Follow the sources behind each claim.";
const HOME_DESC_FR = "Data Goblin est un guide interactif gratuit sur l’IA, les centres de données et la souveraineté numérique au Canada. Consultez les sources qui étayent les affirmations du guide.";
const HOME_FULL_EN = "Data Goblin — A Field Guide to AI, Power, and Data in Canada";
const HOME_FULL_FR = "Data Goblin — Guide de terrain sur l'IA, la puissance et les données au Canada";

// route -> { en: [title, desc], fr: [title, desc] }   (title is the page name; "— Data Goblin" is appended)
// Descriptions are unique per route (~140–160 chars) so no two pages share a meta
// description and none is too short — search snippets stay distinct and readable.
const ROUTE_META = [
  ["/guide", "Field Guide", "The full table of contents for Data Goblin, the free field guide to AI, data centres, and digital sovereignty in Canada — chapter by chapter, all sourced.", "Guide de terrain", "La table des matières complète de Data Goblin, le guide de terrain gratuit sur l'IA, les centres de données et la souveraineté numérique au Canada."],
  ["/map", "Map", "Browse Data Goblin by region and by question to find the chapters that answer what you want to know about AI, data, and power in Canada.", "Carte", "Parcourez Data Goblin par région et par question pour trouver les chapitres qui répondent à vos questions sur l'IA, les données et le pouvoir au Canada."],
  ["/loot", "Glossary", "Plain-language definitions for the AI, data-centre, and digital-sovereignty terms used across the guide, each one linked to a source you can check.", "Glossaire", "Définitions en langage clair des termes d'IA, de centres de données et de souveraineté numérique du guide, chacune reliée à une source vérifiable."],
  ["/receipts", "Receipts", "The claim-by-claim source ledger behind Data Goblin: every factual statement in the guide, matched to the receipt that backs it up.", "Reçus", "Le registre des sources derrière Data Goblin, revendication par revendication : chaque affirmation du guide, reliée au reçu qui la confirme."],
  ["/about", "About", "Who makes Data Goblin and why: an independent, free field guide from Shadewater Labs on AI, power, and data in Canada, with every claim sourced.", "À propos", "Qui fait Data Goblin et pourquoi : un guide de terrain indépendant et gratuit de Shadewater Labs sur l'IA, le pouvoir et les données au Canada."],
  ["/contribute", "Contribute", "Suggest a source, flag an error, or help improve Data Goblin. It is an open, community-checked field guide, and your corrections make it better.", "Contribuer", "Suggérez une source, signalez une erreur ou aidez à améliorer Data Goblin. Ce guide ouvert et vérifié par la communauté s'améliore grâce à vous."],
  ["/updates", "Updates & Corrections", "A dated log of what changed in Data Goblin: new chapters, corrections, and updated sources, so you can see exactly how the guide has evolved.", "Mises à jour et corrections", "Un journal daté des changements de Data Goblin : nouveaux chapitres, corrections et sources mises à jour, pour suivre l'évolution du guide."],
  ["/toolkit", "The Toolkit · Test Any AI Claim", "Run any AI claim through the guide’s bias-mapping method: who’s making it, what’s the scope, and where’s the receipt.", "La boîte à outils · Tester toute allégation d'IA", "Passez n'importe quelle allégation d'IA au crible de la méthode de cartographie des biais du guide : qui la formule, quelle est la portée, et où est le reçu."],
  ["/privacy", "Privacy", "What this site stores and what it does not. Data Goblin runs without ad trackers or personal profiles, and this page spells out exactly what that means.", "Confidentialité", "Ce que ce site stocke et ce qu'il ne stocke pas. Data Goblin fonctionne sans traqueurs publicitaires ni profils personnels, et cette page l'explique."],
];

function chapterTitle(dir, n, lang) {
  try {
    const ch = JSON.parse(fs.readFileSync(path.join(dir, `ch${String(n).padStart(2, "0")}.json`), "utf8"));
    const t = (ch.title || "").split(" — ")[0];
    if (n === 0) return lang === "fr" ? "Pages liminaires" : "Front Matter";
    if (n === 21) return lang === "fr" ? "Annexe — Bibliothèque des sources" : "Source Library Appendix";
    return lang === "fr" ? `Chapitre ${n} : ${t}` : `Chapter ${n}: ${t}`;
  } catch { return lang === "fr" ? `Chapitre ${n}` : `Chapter ${n}`; }
}
// Per-chapter meta description: strip markdown from the chapter's own intro
// (startHere, else its first section) and clip to ~155 chars at a word boundary.
// Falls back to the site default if the chapter has no usable lede.
function stripMd(s) {
  return String(s || "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function clipDesc(s) {
  if (s.length <= 155) return s;
  const cut = s.slice(0, 155);
  const i = cut.lastIndexOf(" ");
  return (i > 60 ? cut.slice(0, i) : cut).replace(/[\s,;:.—-]+$/, "") + "…";
}
function chapterDesc(dir, n, fallback) {
  try {
    const ch = JSON.parse(fs.readFileSync(path.join(dir, `ch${String(n).padStart(2, "0")}.json`), "utf8"));
    const lede = ch.startHere || (Array.isArray(ch.sections) && ch.sections[0] && ch.sections[0].markdown) || "";
    const d = clipDesc(stripMd(lede));
    return d.length >= 60 ? d : fallback;
  } catch { return fallback; }
}
try {
  const enDir = path.join(DIST, "content", "chapters");
  const frDir = path.join(DIST, "content", "fr", "chapters");
  for (const f of fs.readdirSync(enDir).filter((n) => /^ch\d+\.json$/.test(n))) {
    const n = JSON.parse(fs.readFileSync(path.join(enDir, f), "utf8")).number;
    ROUTE_META.push([`/chapter/${n}`, chapterTitle(enDir, n, "en"), chapterDesc(enDir, n, DESC_EN), chapterTitle(frDir, n, "fr"), chapterDesc(frDir, n, DESC_FR)]);
  }
} catch (e) { console.warn("prerender-meta: chapter read warning —", e.message); }

// Topic hubs. Each carries a unique EN/FR meta description (~140–160 chars) so the
// hub pages — which are shell-only, no inlined body — are not duplicates of each
// other or of the home page, and read as distinct results for non-branded queries.
const TOPICS = [
  ["sovereignty", "AI Sovereignty in Canada", "Can Canada run its own AI? The chapters on compute, data, and dependence on foreign providers, and what digital sovereignty really means here.", "La souveraineté de l'IA au Canada", "Le Canada peut-il faire tourner sa propre IA ? Les chapitres sur le calcul, les données, la dépendance aux fournisseurs étrangers et le sens de la souveraineté."],
  ["data-centres", dataCentrePower.en.title, dataCentrePower.en.description, dataCentrePower.fr.title, dataCentrePower.fr.description],
  ["environment", "AI's Environmental Footprint", "The energy, water, and emissions behind AI in Canada: what the numbers say, what is still contested, and where each figure comes from.", "L'empreinte environnementale de l'IA", "L'énergie, l'eau et les émissions derrière l'IA au Canada : ce que disent les chiffres, ce qui reste contesté, et d'où vient chaque donnée."],
  ["copyright", "AI, Copyright & Creators in Canada", "How AI training uses creators' work, what Canadian copyright law says, and the fights over consent and pay. The chapters for artists and writers.", "IA, droit d'auteur et créateurs au Canada", "Comment l'entraînement de l'IA utilise le travail des créateurs, ce que dit le droit d'auteur canadien, et les débats sur le consentement et la rémunération."],
  ["film-media", "AI, Film & Media in Canada", "AI in Canadian film, TV, and media: synthetic actors, dubbing, and the labour questions behind them. The chapters on screens and storytelling.", "IA, cinéma et médias au Canada", "L'IA dans le cinéma, la télévision et les médias canadiens : acteurs synthétiques, doublage et les questions de travail qui les accompagnent."],
  ["deepfakes", "Deepfakes & Misinformation", "How deepfakes and synthetic media spread in Canada, how to spot them, and what the law can and cannot do. The chapters on trust and evidence.", "Hypertrucages et désinformation", "Comment les hypertrucages et les médias synthétiques se propagent au Canada, comment les repérer, et ce que la loi peut ou ne peut pas faire."],
  ["privacy", "AI, Privacy & Surveillance", "What AI systems collect, how surveillance works in Canada, and the privacy rights you actually have. The chapters on the data kept about you.", "IA, vie privée et surveillance", "Ce que collectent les systèmes d'IA, comment fonctionne la surveillance au Canada, et les droits à la vie privée que vous avez réellement."],
  ["labour", labourHiring.en.title, labourHiring.en.description, labourHiring.fr.title, labourHiring.fr.description],
  ["governance", "How AI Is Governed in Canada", "The bills, agencies, and rules shaping AI in Canada, from Bill C-16 to the CRTC and the Privacy Commissioner. The chapters on who sets the guardrails.", "Comment l'IA est gouvernée au Canada", "Les projets de loi, les organismes et les règles qui encadrent l'IA au Canada, de C-16 au CRTC et au Commissariat à la vie privée."],
];
for (const [slug, en, enDesc, fr, frDesc] of TOPICS) ROUTE_META.push([`/topic/${slug}`, en, enDesc, fr, frDesc]);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Primary navigation rendered into the crawlable shell. This is the internal-link
// surface non-JS crawlers (and AI engines) see; React replaces #root on mount.
const NAV_EN = [["/", "Home"], ["/guide", "The Field Guide"], [readerEntry.introduction.href, "Start reading"], ["/map", "Map"], ["/loot", "Glossary"], ["/receipts", "Receipts"], ["/toolkit", "Toolkit"], ["/about", "About"], ["/contribute", "Contribute"], ["/privacy", "Privacy"], ["/updates", "Updates"]];
const NAV_FR = [["/fr", "Accueil"], ["/fr/guide", "Le guide de terrain"], ["/fr" + readerEntry.introduction.href, readerEntry.introduction.fr], ["/fr" + readerEntry.guide.href, readerEntry.guide.fr], ["/fr/map", "Carte"], ["/fr/loot", "Glossaire"], ["/fr/receipts", "Reçus"], ["/fr/toolkit", "Boîte à outils"], ["/fr/about", "À propos"], ["/fr/contribute", "Contribuer"], ["/fr/privacy", "Confidentialité"], ["/fr/updates", "Mises à jour"]];

// ---- Chapter body inliner ----
// Render the full chapter text into the crawlable shell so non-JS crawlers and AI
// engines see the whole chapter, not just the H1 + intro. Browser-free, minimal
// markdown -> HTML. Operates on escaped text so author angle brackets stay safe;
// markdown punctuation (* [ ] ( ) ` #) survives escaping. Real http links become
// anchors; internal art-asset links (icon markers) are flattened to plain text so
// the shell carries real prose + citations, not icon refs.
function inlineMd(s) {
  return esc(String(s))
    .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, (_m, t, u) =>
      /^https?:\/\//.test(u) ? `<a href="${u.replace(/"/g, "%22")}">${t}</a>` : t)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
function mdToHtml(md, passageIds = []) {
  const out = [];
  for (const block of String(md).split(/\n{2,}/)) {
    const t = block.trim();
    if (!t) continue;
    if (t === "---") { out.push("<hr>"); continue; }
    const h = t.match(/^(#{1,6})\s+([\s\S]*)$/);
    if (h) { const lvl = Math.min(6, h[1].length + 2); out.push(`<h${lvl}>${inlineMd(h[2])}</h${lvl}>`); continue; }
    if (/^\s*[-*]\s+/.test(t)) {
      const items = t.split(/\n/).filter((l) => /^\s*[-*]\s+/.test(l)).map((l) => `<li>${inlineMd(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("");
      out.push(`<ul>${items}</ul>`); continue;
    }
    if (/^>\s?/.test(t)) { out.push(`<blockquote>${inlineMd(t.replace(/^>\s?/gm, ""))}</blockquote>`); continue; }
    for (const passage of passageIds) {
      if (passage.phrase && t.includes(passage.phrase)) {
        out.push(`<span id="receipt-passage-${esc(passage.id)}"></span>`);
        passage.phrase = "";
      }
    }
    out.push(`<p>${inlineMd(t.replace(/\n/g, " "))}</p>`);
  }
  return out.join("");
}
function localizedChapterPath(lang, number) {
  const dir = lang === "fr" ? "content/fr/chapters" : "content/chapters";
  return `${dir}/ch${String(number).padStart(2, "0")}.json`;
}

function readChapter(lang, number) {
  try { return JSON.parse(fs.readFileSync(path.join(DIST, localizedChapterPath(lang, number)), "utf8")); }
  catch { return null; }
}

const sectionLinks = JSON.parse(fs.readFileSync(path.join(DIST, "content", "section-links.json"), "utf8"));
const directReceiptIds = new Set(Object.keys(receiptNotes).filter((id) => receiptNotes[id].review));

// Build the inlined body for a /chapter/N route in the given language.
function chapterBodyHtml(route, lang) {
  const m = route.match(/^\/chapter\/(\d+)$/);
  if (!m) return "";
  const ch = readChapter(lang, Number(m[1]));
  if (!ch) return "";
  const fr = lang === "fr";
  const links = sectionLinks[ch.number] ?? [];
  const receipts = Object.entries(receiptNotes).flatMap(([id, { passage, references = [] }]) =>
    [passage, ...references].filter((location) => location?.chapter === ch.number).map(({ section }) => ({ id, section })));
  const sections = ch.sections ?? [];
  const explainer = chapterExplainers.find((entry) => entry.chapter === ch.number);
  const outlineLabel = fr ? "Dans ce chapitre" : "In this chapter";
  let b = "";
  if (ch.startHere) b += `<p>${inlineMd(ch.startHere)}</p>`;
  if (links.length) {
    const items = links.map(({ id, [lang]: heading }) => `<li><a href="#${esc(id)}">${esc(heading)}</a></li>`);
    b += `<nav aria-label="${outlineLabel}"><h2>${outlineLabel}</h2><ol>${items.join("")}</ol></nav>`;
  }
  for (const [index, s] of sections.entries()) {
    const link = links[index];
    if (s && s.heading) b += `<h2${link ? ` id="${esc(link.id)}"` : ""}>${esc(s.heading)}</h2>`;
    if (s?.heading && link) {
      const otherLang = fr ? "en-CA" : "fr-CA";
      const otherPath = fr ? route : `/fr${route}`;
      const label = fr ? "Read this section in English" : "Lire cette section en français";
      b += `<p><a href="${otherPath}#${esc(link.id)}" lang="${otherLang}" hreflang="${otherLang}">${label}</a></p>`;
    }
    const source = link?.source?.[lang];
    if (source) b += `<p><strong>${fr ? "Source :" : "Source:"}</strong> <a href="${esc(source.url)}">${esc(source.label)}</a></p>`;
    if (explainer && link?.id === explainer.section) {
      const href = (fr ? "/fr" : "") + explainer.update.topicPath;
      b += `<p><a href="${esc(href)}">${esc(explainer.update[lang].linkLabel)}</a></p>`;
    }
    for (const { id, section } of receipts) {
      if (section === link?.id) {
        b += `<p><a href="${fr ? "/fr" : ""}/receipts#receipt-${esc(id)}">${fr ? "Voir le reçu" : "View receipt"} #${esc(id)}</a></p>`;
      }
    }
    if (s?.markdown) {
      const exactIds = receipts.filter(({ id, section }) => directReceiptIds.has(id) && section === link?.id);
      const anchors = exactIds.length
        ? JSON.parse(fs.readFileSync(path.join(DIST, fr ? "content/fr" : "content", "claim-anchors.json"), "utf8"))[ch.number] ?? []
        : [];
      const passages = exactIds.map(({ id }) => ({
        id,
        phrase: anchors.find((anchor) => String(anchor.id) === id && s.markdown.includes(anchor.anchor))?.anchor,
      }));
      b += mdToHtml(s.markdown, passages);
    }
  }
  for (const g of ch.goblinChecks || []) { if (g && g.markdown) b += mdToHtml(g.markdown); }
  if (Array.isArray(ch.recap) && ch.recap.length)
    b += `<h2>${fr ? "Récapitulatif" : "Recap"}</h2><ul>${ch.recap.map((r) => `<li>${inlineMd(r)}</li>`).join("")}</ul>`;
  if (Array.isArray(ch.sources) && ch.sources.length)
    b += `<h2>Sources</h2><ul>${ch.sources.map((s) => `<li>${inlineMd(s)}</li>`).join("")}</ul>`;
  return b ? `<article data-prerender-body>${b}</article>` : "";
}

// The guide and Map use the same regional chapter list from the localized book.
function chapterListHtml(lang, includeBookends) {
  const dir = lang === "fr" ? path.join(DIST, "content", "fr") : path.join(DIST, "content");
  let b;
  try { b = JSON.parse(fs.readFileSync(path.join(dir, "book.json"), "utf8")); } catch { return ""; }
  const fr = lang === "fr";
  const pfx = fr ? "/fr" : "";
  let h = includeBookends && b.subtitle ? `<p>${esc(b.subtitle)}</p>` : "";
  if (includeBookends && b.frontMatter) {
    h += `<p><a href="${pfx}/chapter/${b.frontMatter.number}">${esc(b.frontMatter.title)}</a></p>`;
  }
  for (const part of b.parts || []) {
    const label = [part.part, part.region].filter(Boolean).map(esc).join(" · ");
    if (label) h += `<h2>${label}</h2>`;
    h += "<ul>";
    for (const ch of part.chapters || []) {
      const t = String(ch.title || "").split(" — ")[0];
      const num = fr ? `Chapitre ${ch.number}` : `Chapter ${ch.number}`;
      h += `<li><a href="${pfx}/chapter/${ch.number}">${esc(num)}: ${esc(t)}</a></li>`;
    }
    h += "</ul>";
  }
  if (includeBookends && b.backMatter) {
    h += `<p><a href="${pfx}/chapter/${b.backMatter.number}">${esc(b.backMatter.title)}</a></p>`;
  }
  return h ? `<nav data-prerender-body aria-label="${fr ? "Chapitres" : "Chapters"}">${h}</nav>` : "";
}

// /loot — the glossary. 45 term/definition pairs as a real definition list.
function glossaryBodyHtml(lang) {
  const dir = lang === "fr" ? path.join(DIST, "content", "fr") : path.join(DIST, "content");
  let g;
  try { g = JSON.parse(fs.readFileSync(path.join(dir, "glossary.json"), "utf8")); } catch { return ""; }
  if (!Array.isArray(g) || !g.length) return "";
  const items = g.map((e) => `<dt>${esc(e.term)}</dt><dd>${inlineMd(e.def || "")}</dd>`).join("");
  return `<dl data-prerender-body>${items}</dl>`;
}

// /receipts — the source ledger. Each row's claim + detail (detail markdown carries
// the real source links), grouped under its section heading.
function receiptsBodyHtml(lang) {
  const otherLang = lang === "fr" ? "en-CA" : "fr-CA";
  const otherPath = lang === "fr" ? "/receipts" : "/fr/receipts";
  const otherLabel = lang === "fr" ? "English" : "Français";
  const permalinkLabel = lang === "fr" ? "Lien vers ce reçu" : "Link to this receipt";
  const dir = lang === "fr" ? path.join(DIST, "content", "fr") : path.join(DIST, "content");
  let r;
  try { r = JSON.parse(fs.readFileSync(path.join(dir, "receipts.json"), "utf8")); } catch { return ""; }
  if (!Array.isArray(r) || !r.length) return "";
  let h = "", lastSec = null;
  const occurrences = new Map();
  for (const row of r) {
    if (row.section && row.section !== lastSec) { h += `<h2>${esc(row.section)}</h2>`; lastSec = row.section; }
    const status = row.status ? ` <em>(${esc(row.status)})</em>` : "";
    const number = esc(String(row.id));
    const occurrence = (occurrences.get(row.id) || 0) + 1;
    occurrences.set(row.id, occurrence);
    const id = occurrence === 1 ? `receipt-${number}` : `receipt-${number}-${occurrence}`;
    const entry = receiptNotes[row.id];
    const note = entry?.[lang];
    const review = entry?.review;
    const links = note ? [[note.sourceLabel, note.url], ...(row.links || []).filter(([, url]) => url !== note.url)] : (row.links || []);
    h += `<div id="${id}" style="scroll-margin-top:12px"><p><strong>#${number} ${inlineMd(row.claim || "")}</strong>${status}</p>`;
    h += `<p><a href="#${id}">${permalinkLabel}</a> · <a href="${otherPath}#${id}" lang="${otherLang}" hreflang="${otherLang}">${otherLabel}</a></p>`;
    if (entry?.passage) {
      const { chapter, section } = entry.passage;
      const destination = review
        ? `?section=${encodeURIComponent(section)}&amp;receipt=${number}#receipt-passage-${number}`
        : `#${esc(section)}`;
      h += `<p><a href="${lang === "fr" ? "/fr" : ""}/chapter/${chapter}${destination}">${lang === "fr" ? "Lire le passage du guide" : "Read the passage in the guide"}</a></p>`;
    }
    if (note) h += mdToHtml(note.detail);
    if (row.detail) h += mdToHtml(review ? row.detail.replace(/\s+\|\s+\[[\s\S]*$/, "") : row.detail);
    if (review) {
      const date = new Intl.DateTimeFormat(`${lang}-CA`, { dateStyle: "long", timeZone: "UTC" }).format(new Date(review.date));
      h += `<p data-receipt-review><strong>${lang === "fr" ? "Historique de vérification" : "Review history"}</strong> · <time datetime="${esc(review.date)}">${esc(date)}</time><br>${esc(review[lang])}</p>`;
    }
    for (const [label, url] of links) {
      if (/^https?:\/\//.test(url)) h += `<p><a href="${esc(url)}">${esc(label)}</a></p>`;
    }
    h += "</div>";
  }
  return `<section data-prerender-body>${h}</section>`;
}

// /topic/* — theme hubs. Each lists the chapters that go deepest on that theme as
// real internal links, so the crawlable shell is a curated cluster, not just an H1.
// Keep in sync with src/topics.ts (primary chapter first, then `related`).
const TOPIC_CHAPTERS = {
  "sovereignty": [9, 6, 4, 7, 20],
  "data-centres": [6, 4, 8, 9],
  "environment": [8, 4, 6],
  "copyright": [11, 12, 3, 14],
  "film-media": [12, 11, 13, 16],
  "deepfakes": [13, 14, 17, 18],
  "privacy": [10, 3, 18, 17],
  "labour": [16, 7, 15, 20],
  "governance": [17, 5, 18, 9, 19, 20],
};
function bookChapterTitles(lang) {
  const dir = lang === "fr" ? path.join(DIST, "content", "fr") : path.join(DIST, "content");
  const map = {};
  try {
    const b = JSON.parse(fs.readFileSync(path.join(dir, "book.json"), "utf8"));
    for (const part of b.parts || []) for (const ch of part.chapters || []) map[ch.number] = String(ch.title || "").split(" — ")[0];
  } catch { /* empty map -> falls back to "Chapter N" */ }
  return map;
}
function topicExplainerHtml(explainer, lang, prefix) {
  const copy = explainer[lang];
  const { chapter, section, reviewedOn } = explainer;
  const marker = copy.provinces ? "data-data-centre-power" : "data-labour-hiring";
  const entries = (copy.provinces ?? copy.studies).map(({ name, text, receipts, source }) => {
    const links = receipts.map((receipt) =>
      `<li><a href="${prefix}/chapter/${chapter}?receipt=${receipt}#${esc(section)}">${esc(copy.passageLabel)} · ${esc(copy.receiptLabel.toLowerCase())} #${receipt}</a>` +
      ` · <a href="${prefix}/receipts#receipt-${receipt}">${esc(copy.receiptLabel)} #${receipt}</a></li>`
    );
    if (source) links.push(`<li><a href="${esc(source.url)}">${esc(source.label)}</a></li>`);
    return `<section><h3>${esc(name)}</h3><p>${esc(text)}</p><ul>${links.join("")}</ul></section>`;
  }).join("");
  return `<article data-prerender-body ${marker}><p><time datetime="${esc(reviewedOn)}">${esc(copy.reviewedLabel)}</time></p>` +
    `<p>${esc(copy.answer)}</p><h2>${esc(copy.comparisonTitle)}</h2>${entries}<h2>${esc(copy.checkTitle)}</h2><p>${esc(copy.check)}</p></article>`;
}
function topicBodyHtml(route, lang) {
  const m = route.match(/^\/topic\/([a-z-]+)$/);
  if (!m) return "";
  const chapters = TOPIC_CHAPTERS[m[1]];
  if (!chapters || !chapters.length) return "";
  const fr = lang === "fr";
  const pfx = fr ? "/fr" : "";
  const titles = bookChapterTitles(lang);
  const heading = fr ? "Dans ce guide" : "In this guide";
  const items = chapters.map((n) => {
    const num = fr ? `Chapitre ${n}` : `Chapter ${n}`;
    const t = titles[n] || num;
    return `<li><a href="${pfx}/chapter/${n}">${esc(num)}: ${esc(t)}</a></li>`;
  }).join("");
  let summary = "";
  if (m[1] === "data-centres") summary = topicExplainerHtml(dataCentrePower, lang, pfx);
  if (m[1] === "labour") summary = topicExplainerHtml(labourHiring, lang, pfx);
  if (m[1] === "governance") {
    const startHere = readChapter(lang, chapters[0])?.startHere;
    if (typeof startHere !== "string" || !startHere.trim()) {
      throw new Error(`Missing ${lang} Governance summary in ${localizedChapterPath(lang, chapters[0])}`);
    }
    summary = `<section data-prerender-topic-summary><h2>${fr ? "Commencez ici." : "Start here"}</h2>${mdToHtml(startHere)}</section>`;
  }
  return summary + `<nav data-prerender-body aria-label="${esc(heading)}"><h2>${esc(heading)}</h2><ul>${items}</ul></nav>`;
}

// Dispatch a route to its body builder. Other routes use the metadata shell.
function topicListHtml(lang) {
  const fr = lang === "fr";
  const heading = fr ? "Parcourir par sujet" : "Browse by topic";
  const prefix = fr ? "/fr" : "";
  const links = TOPICS.map(([slug, en, , french]) =>
    `<li><a href="${prefix}/topic/${slug}">${esc(fr ? french : en)}</a></li>`
  ).join("");
  return `<nav aria-label="${heading}"><h2>${heading}</h2><ul>${links}</ul></nav>`;
}

function routeBodyHtml(route, lang) {
  if (/^\/chapter\/\d+$/.test(route)) return chapterBodyHtml(route, lang);
  if (route === "/guide") return chapterListHtml(lang, true);
  if (route === "/map") return chapterListHtml(lang, false) + topicListHtml(lang);
  if (route === "/loot") return glossaryBodyHtml(lang);
  if (route === "/receipts") return receiptsBodyHtml(lang);
  if (route === "/updates") {
    const prefix = lang === "fr" ? "/fr" : "";
    const sourceChange = sourceChangeUpdate[lang];
    const editorial = editorialCorrectionUpdate[lang];
    const reader = readerCorrectionsUpdate[lang];
    const dataCentres = dataCentrePowerUpdate[lang];
    const labour = labourHiringUpdate[lang];
    const receiptReview = receiptReviewUpdate[lang];
    const entries = [
      [receiptReview, receiptReview.links],
      [labour, [[labour.linkLabel, labourHiringUpdate.topicPath]]],
      [dataCentres, [[dataCentres.linkLabel, dataCentrePowerUpdate.topicPath]]],
      [reader, [[reader.chapterLabel, readerCorrectionsUpdate.chapterPath]]],
      [editorial, editorialCorrectionUpdate.receiptIds.map((id, index) => [editorial.receiptLabels[index], `/receipts#receipt-${id}`])],
      [sourceChange, [[sourceChange.passageLabel, "/chapter/10#the-biometric-and-facial-recognition-layer"], [sourceChange.receiptLabel, "/receipts#receipt-70"]]],
      [latestUpdate[lang], [[latestUpdate[lang].passageLabel, "/chapter/13#the-working-test"], [latestUpdate[lang].receiptLabel, "/receipts#receipt-32"]]],
    ];
    return `<p>${esc(sourceChange.description)}</p>` + entries.map(([update, links]) =>
      `<section data-prerender-body><p>${esc(update.date)} · ${esc(update.tag)}</p><h2>${esc(update.title)}</h2>` +
      `<ul>${update.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` +
      `<p>${links.map(([label, href]) => `<a href="${prefix}${href}">${esc(label)}</a>`).join(" · ")}</p></section>`
    ).join("");
  }
  if (/^\/topic\//.test(route)) return topicBodyHtml(route, lang);
  return "";
}

// Crawlable fallback content placed inside #root. React's createRoot().render()
// replaces it on mount, so real users never see it, but raw-HTML crawlers and
// non-rendering AI bots get a real H1, an intro paragraph, internal links, and —
// for chapter routes — the full chapter body.
// Visible, styled homepage hero rendered into #root so first paint (and the LCP
// hero image) happen from raw HTML instead of waiting on the React bundle. React's
// createRoot replaces it on mount with the matching LandingHero, so the swap is
// near-invisible (same image URL, same layout). EN only; FR keeps the light
// crawler shell. Styling lives in index.html critical CSS (.dg-* classes).
function homeQuestionsHtml(lang) {
  const prefix = lang === "fr" ? "/fr" : "";
  const links = homeQuestions.links.map(({ href, [lang]: label }) =>
    `<li><a href="${prefix}${esc(href)}">${esc(label)}</a></li>`
  ).join("");
  return `<section class="dg-home-questions" aria-labelledby="home-questions-heading"><h2 id="home-questions-heading">${esc(homeQuestions.heading[lang])}</h2><ul>${links}</ul></section>`;
}

function homeHeroHtml() {
  const nav = NAV_EN.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join("") + `<a href="/fr" hreflang="fr-CA" lang="fr-CA">Édition française</a>`;
  const flagSet = "/art/panels/canada-flag-panel-400w.webp 400w, /art/panels/canada-flag-panel-640w.webp 640w, /art/panels/canada-flag-panel-960w.webp 960w, /art/panels/canada-flag-panel.webp 1024w";
  const heroSet = HERO_SRCSET;
  return `<div data-prerender-hero>` +
    `<nav class="dg-srnav" aria-label="Primary navigation">${nav}</nav>` +
    `<div class="dg-topbar"></div>` +
    `<main class="dg-heromain"><section class="dg-hero">` +
      `<div class="dg-hero-col">` +
        `<div class="dg-hero-eyebrow">Free interactive web book · June 2026</div>` +
        `<div class="dg-hero-titlerow">` +
          `<h1 class="dg-hero-title">Data Goblin</h1>` +
          `<img class="dg-hero-flag" src="/art/panels/canada-flag-panel-640w.webp" srcset="${flagSet}" sizes="(max-width: 720px) 150px, 210px" width="1024" height="1024" alt="" aria-hidden="true" decoding="async" />` +
        `</div>` +
        `<p class="dg-hero-subtitle">A Field Guide to AI, Power, and Data in Canada</p>` +
        `<p class="dg-hero-body">${esc(HOME_DESC_EN)}</p>` +
        `<div class="dg-hero-cta">` +
          `<a class="dg-hero-btn dg-hero-btn-primary" href="${readerEntry.introduction.href}">${esc(readerEntry.introduction.en)}</a>` +
          `<a class="dg-hero-btn dg-hero-btn-secondary" href="${readerEntry.guide.href}">${esc(readerEntry.guide.en)}</a>` +
        `</div>` +
      `</div>` +
      `<div class="dg-hero-card">` +
        `<img class="dg-hero-img" src="/art/panels/hero-panel-640w.webp" srcset="${heroSet}" sizes="(max-width: 720px) 92vw, (max-width: 1100px) 46vw, 650px" width="1024" height="1024" alt="Data Goblin inspecting a trail of receipts and glowing evidence crystals" fetchpriority="high" decoding="async" />` +
      `</div>` +
    `</section>${homeQuestionsHtml("en")}</main>` +
  `</div>`;
}

function seoShell(route, h1, desc, lang) {
  if (route === "" && lang === "en") return homeHeroHtml();
  const nav = (lang === "fr" ? NAV_FR : NAV_EN).map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join("");
  const altHref = lang === "fr" ? (route || "/") : "/fr" + route;
  const altLabel = lang === "fr" ? "English edition" : "Édition française";
  const altLanguage = lang === "fr" ? "en-CA" : "fr-CA";
  const navLabel = lang === "fr" ? "Navigation principale" : "Primary navigation";
  const body = route === "" ? homeQuestionsHtml(lang) : routeBodyHtml(route, lang);
  return `<div data-prerender-shell><h1>${esc(h1)}</h1><p>${esc(desc)}</p><nav aria-label="${navLabel}">${nav}<a href="${altHref}" hreflang="${altLanguage}" lang="${altLanguage}">${esc(altLabel)}</a></nav>${body}</div>`;
}

// Per-chapter Article JSON-LD. Each chapter route becomes independently
// rich-result / AI-citation eligible, linked back to the Book via isPartOf.
function articleJsonLd(route, headline, self, lang) {
  const m = route.match(/^\/chapter\/(\d+)$/);
  if (!m) return "";
  const obj = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    inLanguage: lang === "fr" ? "fr-CA" : "en-CA",
    url: self,
    isPartOf: { "@id": SITE + "/#book" },
    isAccessibleForFree: true,
    datePublished: PUBLISHED,
    dateModified: BUILD_DATE,
    author: { "@type": "Person", name: "Alex Yesilcimen" },
    publisher: { "@id": SITE + "/#org" },
    image: SITE + "/og-image.png",
  };
  return `\n    <script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n    </script>`;
}

// Per-page BreadcrumbList so chapters and topics show a crumb trail in search
// results and read as part of a hierarchy, not as orphaned pages.
function breadcrumbJsonLd(route, name, self, lang) {
  const fr = lang === "fr";
  const pfx = fr ? "/fr" : "";
  const crumbs = [[fr ? "Accueil" : "Home", SITE + (fr ? "/fr" : "/")]];
  if (/^\/chapter\/\d+$/.test(route)) crumbs.push([fr ? "Guide de terrain" : "Field Guide", SITE + pfx + "/guide"]);
  else if (/^\/topic\//.test(route)) crumbs.push([fr ? "Carte" : "Map", SITE + pfx + "/map"]);
  else if (route === "") return "";
  crumbs.push([name, self]);
  const obj = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c[0], item: c[1] })),
  };
  return `\n    <script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n    </script>`;
}

// /loot glossary as a DefinedTermSet — each term becomes a structured DefinedTerm,
// which search + AI engines can lift as a definition (fits the guide's plain-language aim).
function glossaryJsonLd(route, lang) {
  if (route !== "/loot") return "";
  const dir = lang === "fr" ? path.join(DIST, "content", "fr") : path.join(DIST, "content");
  let g;
  try { g = JSON.parse(fs.readFileSync(path.join(dir, "glossary.json"), "utf8")); } catch { return ""; }
  if (!Array.isArray(g) || !g.length) return "";
  const self = SITE + (lang === "fr" ? "/fr" : "") + "/loot";
  const obj = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": self + "#glossary",
    name: lang === "fr" ? "Glossaire Data Goblin" : "Data Goblin Glossary",
    url: self,
    hasDefinedTerm: g.map((e) => ({ "@type": "DefinedTerm", name: e.term, description: stripMd(e.def || ""), inDefinedTermSet: self + "#glossary" })),
  };
  return `\n    <script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n    </script>`;
}

function render(route, h1, fullTitle, desc, lang) {
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
  h = h.replace('<div id="root"></div>', `<div id="root">${seoShell(route, h1, desc, lang)}</div>`);
  const extras = [
    articleJsonLd(route, h1, self, lang),
    breadcrumbJsonLd(route, h1, self, lang),
    glossaryJsonLd(route, lang),
  ].filter(Boolean).join("");
  if (extras) h = h.replace("</head>", `${extras}\n  </head>`);
  // The hero panel is the LCP element on the home and about pages, and React inserts it after
  // the bundle runs; the preload lets the browser fetch it with the HTML. Lighthouse mobile
  // 2026-09-05: LCP 4.8 s with the image request starting ~2 s in. Same srcset/sizes as
  // LandingHero, so the browser reuses the fetch rather than downloading a second candidate.
  if (route === "" || route === "/about") {
    h = h.replace("</head>", `${heroPreload(route)}\n  </head>`);
  }
  return h;
}

const HERO_SRCSET = "/art/panels/hero-panel-480w.webp 480w, /art/panels/hero-panel-640w.webp 640w, /art/panels/hero-panel-720w.webp 720w, /art/panels/hero-panel-960w.webp 960w, /art/panels/hero-panel.webp 1024w";
function heroPreload(route) {
  const sizes = route === "/about" ? "(max-width: 760px) 92vw, 520px"
    : "(max-width: 720px) 92vw, (max-width: 1100px) 46vw, 650px";
  return '<link rel="preload" as="image" fetchpriority="high" ' +
    'href="/art/panels/hero-panel-960w.webp" ' +
    `imagesrcset="${HERO_SRCSET}" imagesizes="${sizes}" />`;
}

function write(relPath, html) {
  const dir = path.join(DIST, relPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

function writeNotFound(lang) {
  const fr = lang === "fr";
  const title = fr ? "404 — Page introuvable" : "404 — Page not found";
  const desc = fr ? "Cette page a peut-être été déplacée, ou son adresse est incorrecte."
    : "This page may have moved, or its address may be incorrect.";
  const prefix = fr ? "/fr" : "";
  const links = (fr ? [["/fr", "Accueil"], ["/fr/guide", "Le guide de terrain"], ["/fr/map", "Carte"]]
    : [["/", "Home"], ["/guide", "The Field Guide"], ["/map", "Map"]])
    .map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join("");
  const html = `<!doctype html>
<html lang="${lang}-CA">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${title} — Data Goblin</title>
  <style>
    body { margin: 0; background: #ece5d3; color: #23211a; font: 1.125rem/1.6 Georgia, serif; }
    main { max-width: 40rem; margin: 2rem auto; padding: 1.5rem; }
    h1 { color: #1a2e4a; line-height: 1.2; }
    a { color: #2d5a27; }
  </style>
</head>
<body>
  <main>
    <p>Data Goblin</p>
    <h1>${title}</h1>
    <p>${desc}</p>
    <nav aria-label="${fr ? "Navigation principale" : "Primary navigation"}"><ul>${links}</ul></nav>
  </main>
</body>
</html>
`;
  fs.writeFileSync(path.join(DIST, prefix.slice(1), "404.html"), html);
}

let count = 0;
// Home (both languages)
write("", render("", HOME_FULL_EN, HOME_FULL_EN, HOME_DESC_EN, "en")); // overwrites dist/index.html with hreflang
write("fr", render("", HOME_FULL_FR, HOME_FULL_FR, HOME_DESC_FR, "fr"));
writeNotFound("en");
writeNotFound("fr");
count += 2;
for (const [route, enTitle, enDesc, frTitle, frDesc] of ROUTE_META) {
  const rel = route.replace(/^\//, "");
  write(rel, render(route, enTitle, `${enTitle} — Data Goblin`, enDesc, "en"));
  write("fr/" + rel, render(route, frTitle, `${frTitle} — Data Goblin`, frDesc, "fr"));
  count += 2;
}
console.log(`prerender-meta: wrote ${count} per-route HTML shells (EN + FR)`);

// ---- Sitemap lastmod: when the route's sources last changed, not when the build ran ----
// Until 2026-09-05 every URL carried the build date, so each deploy told crawlers all 84
// pages had changed that day. A route's date is the last commit touching its page and its
// content file, read from git; on a shallow clone (Vercel) a boundary commit's date is not
// evidence, so those fall back to the committed route-lastmod.json, and only a route with
// no history at all gets the build date. Local builds rewrite that JSON; commit it.
const APP = path.resolve(__dirname, "..");
const REPO = path.resolve(APP, "..");
const LASTMOD_FILE = path.join(__dirname, "route-lastmod.json");
const ROUTE_SOURCES = {
  "": ["app/src/pages/LandingPage.tsx", "app/public/content/book.json"],
  "/guide": ["app/src/pages/FieldGuidePage.tsx", "app/public/content/book.json"],
  "/map": ["app/src/pages/MapPage.tsx", "app/scripts/prerender-meta.cjs"],
  "/loot": ["app/src/pages/LootPage.tsx", "app/public/content/glossary.json"],
  "/receipts": ["app/src/pages/ReceiptsPage.tsx", "app/src/components/ReceiptRows.tsx", "app/src/receiptNotes.json", "app/public/content/receipts.json"],
  "/about": ["app/src/pages/AboutPage.tsx", "app/public/content/stats.json"],
  "/contribute": ["app/src/pages/ContributePage.tsx"],
  "/updates": ["app/src/pages/UpdatesPage.tsx", "app/src/latestUpdate.json", "app/src/sourceChangeUpdate.json", "app/src/editorialCorrectionUpdate.json", "app/src/readerCorrectionsUpdate.json", "app/src/receiptReviewUpdate.json", ...chapterExplainers.map(({ file }) => file)],
  "/toolkit": ["app/src/pages/ToolkitPage.tsx"],
  "/privacy": ["app/src/pages/PrivacyPage.tsx"],
};
function routeSources(route, lang) {
  const chapter = route.match(/^\/chapter\/(\d+)$/);
  if (chapter) {
    const sources = [`app/public/${localizedChapterPath(lang, chapter[1])}`];
    const explainer = chapterExplainers.find((entry) => entry.chapter === Number(chapter[1]));
    if (explainer) sources.push(explainer.file);
    return sources;
  }
  if (route.startsWith("/topic/")) {
    const sources = ["app/src/pages/TopicPage.tsx", "app/scripts/prerender-meta.cjs", "app/public/content/book.json"];
    if (route === "/topic/governance") {
      sources.push(`app/public/${localizedChapterPath(lang, TOPIC_CHAPTERS.governance[0])}`);
    }
    if (route === "/topic/data-centres") sources.push("app/src/dataCentrePower.json");
    if (route === "/topic/labour") sources.push("app/src/labourHiring.json");
    return sources;
  }
  return ROUTE_SOURCES[route] || [];
}
function git(...args) {
  try {
    return execFileSync("git", args, { cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}
const shallowBoundary = (() => {
  if (git("rev-parse", "--is-shallow-repository") !== "true") return new Set();
  const file = git("rev-parse", "--git-path", "shallow");
  try {
    return new Set(fs.readFileSync(path.resolve(REPO, file || ""), "utf8").split(/\r?\n/).filter(Boolean));
  } catch {
    return new Set();
  }
})();
const previousLastMod = (() => {
  try {
    return JSON.parse(fs.readFileSync(LASTMOD_FILE, "utf8"));
  } catch {
    return {};
  }
})();
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
function lastModFor(loc, route, lang) {
  const sources = routeSources(route, lang);
  if (sources.length) {
    const dirty = git("status", "--porcelain", "--", ...sources);
    if (dirty) return BUILD_DATE;
    const committed = git("log", "-1", "--format=%cs %H", "--", ...sources);
    if (committed) {
      const [date, sha] = committed.split(" ");
      if (ISO_DAY.test(date) && !shallowBoundary.has(sha)) return date;
    }
  }
  if (ISO_DAY.test(previousLastMod[loc] || "")) return previousLastMod[loc];
  return BUILD_DATE;
}

// ---- Generate sitemap.xml (EN + FR, with hreflang alternates) ----
function smMeta(route) {
  if (route === "") return ["1.0", "monthly"];
  if (route.startsWith("/topic/")) return ["0.7", "monthly"];
  if (route === "/guide" || route === "/loot" || route === "/receipts") return ["0.8", "yearly"];
  return ["0.6", "yearly"];
}
const allRoutes = [""].concat(ROUTE_META.map((r) => r[0]));
let urlsXml = "";
const lastModOut = {};
for (const route of allRoutes) {
  const [prio, freq] = smMeta(route);
  const urlEn = SITE + (route || "/");
  const urlFr = SITE + "/fr" + route;
  const alts =
    `\n    <xhtml:link rel="alternate" hreflang="en-CA" href="${esc(urlEn)}"/>` +
    `\n    <xhtml:link rel="alternate" hreflang="fr-CA" href="${esc(urlFr)}"/>` +
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(urlEn)}"/>`;
  for (const [loc, lang] of [[urlEn, "en"], [urlFr, "fr"]]) {
    const lastmod = lastModFor(loc, route, lang);
    lastModOut[loc] = lastmod;
    urlsXml += `\n  <url>\n    <loc>${esc(loc)}</loc>${alts}\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`;
  }
}
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urlsXml}\n</urlset>\n`;
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemapXml);
fs.writeFileSync(LASTMOD_FILE, JSON.stringify(lastModOut, null, 2) + "\n");
console.log(`prerender-meta: wrote sitemap.xml with ${allRoutes.length * 2} URLs (EN + FR, hreflang)`);
