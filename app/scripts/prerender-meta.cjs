// Browser-free per-route meta prerender. Writes English shells at
// dist/<route>/index.html and French shells at dist/fr/<route>/index.html, each
// with route- and language-specific <title>/description/OG tags, a
// self-referencing canonical, and hreflang alternates (en-CA / fr-CA /
// x-default) so crawlers index each language at its own URL. Pure Node.
const fs = require("fs");
const path = require("path");

const DIST = process.env.PRERENDER_DIST ? path.resolve(process.env.PRERENDER_DIST) : path.resolve(__dirname, "../dist");
const SITE = "https://datagoblin.ca";
const BUILD_DATE = new Date().toISOString().slice(0, 10); // dateModified for Article freshness
const PUBLISHED = "2026-06-04"; // first edition / AI for All launch
const indexPath = path.join(DIST, "index.html");
if (!fs.existsSync(indexPath)) { console.error("prerender-meta: dist/index.html missing — skipping"); process.exit(0); }
const base = fs.readFileSync(indexPath, "utf8");

const DESC_EN = "A free, open field guide to AI, data centres, and digital sovereignty, written for Canadians. Every claim comes with a receipt.";
const DESC_FR = "Un guide de terrain gratuit sur l'IA, les centres de données et la souveraineté numérique au Canada. Chaque affirmation a son reçu.";
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
  ["data-centres", "Canada's AI Data Centres", "Where Canada's AI data centres are being built, who funds them, and what they cost in power, water, and land. The chapters that follow the buildout.", "Les centres de données d'IA du Canada", "Où se construisent les centres de données d'IA au Canada, qui les finance, et ce qu'ils coûtent en énergie, en eau et en terrain."],
  ["environment", "AI's Environmental Footprint", "The energy, water, and emissions behind AI in Canada: what the numbers say, what is still contested, and where each figure comes from.", "L'empreinte environnementale de l'IA", "L'énergie, l'eau et les émissions derrière l'IA au Canada : ce que disent les chiffres, ce qui reste contesté, et d'où vient chaque donnée."],
  ["copyright", "AI, Copyright & Creators in Canada", "How AI training uses creators' work, what Canadian copyright law says, and the fights over consent and pay. The chapters for artists and writers.", "IA, droit d'auteur et créateurs au Canada", "Comment l'entraînement de l'IA utilise le travail des créateurs, ce que dit le droit d'auteur canadien, et les débats sur le consentement et la rémunération."],
  ["film-media", "AI, Film & Media in Canada", "AI in Canadian film, TV, and media: synthetic actors, dubbing, and the labour questions behind them. The chapters on screens and storytelling.", "IA, cinéma et médias au Canada", "L'IA dans le cinéma, la télévision et les médias canadiens : acteurs synthétiques, doublage et les questions de travail qui les accompagnent."],
  ["deepfakes", "Deepfakes & Misinformation", "How deepfakes and synthetic media spread in Canada, how to spot them, and what the law can and cannot do. The chapters on trust and evidence.", "Hypertrucages et désinformation", "Comment les hypertrucages et les médias synthétiques se propagent au Canada, comment les repérer, et ce que la loi peut ou ne peut pas faire."],
  ["privacy", "AI, Privacy & Surveillance", "What AI systems collect, how surveillance works in Canada, and the privacy rights you actually have. The chapters on the data kept about you.", "IA, vie privée et surveillance", "Ce que collectent les systèmes d'IA, comment fonctionne la surveillance au Canada, et les droits à la vie privée que vous avez réellement."],
  ["labour", "AI, Jobs & the Canadian Economy", "What AI is doing to Canadian jobs and wages, which claims hold up, and which are just hype. The chapters on work, automation, and who benefits.", "IA, emploi et économie canadienne", "Ce que l'IA fait aux emplois et aux salaires au Canada, quelles affirmations tiennent la route, et lesquelles ne sont que du battage."],
  ["governance", "How AI Is Governed in Canada", "The bills, agencies, and rules shaping AI in Canada, from Bill C-16 to the CRTC and the Privacy Commissioner. The chapters on who sets the guardrails.", "Comment l'IA est gouvernée au Canada", "Les projets de loi, les organismes et les règles qui encadrent l'IA au Canada, de C-16 au CRTC et au Commissariat à la vie privée."],
];
for (const [slug, en, enDesc, fr, frDesc] of TOPICS) ROUTE_META.push([`/topic/${slug}`, en, enDesc, fr, frDesc]);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Primary navigation rendered into the crawlable shell. This is the internal-link
// surface non-JS crawlers (and AI engines) see; React replaces #root on mount.
const NAV_EN = [["/", "Home"], ["/guide", "The Field Guide"], ["/chapter/1", "Start reading"], ["/map", "Map"], ["/loot", "Glossary"], ["/receipts", "Receipts"], ["/toolkit", "Toolkit"], ["/about", "About"], ["/contribute", "Contribute"]];
const NAV_FR = [["/fr", "Accueil"], ["/fr/guide", "Le guide de terrain"], ["/fr/chapter/1", "Commencer la lecture"], ["/fr/map", "Carte"], ["/fr/loot", "Glossaire"], ["/fr/receipts", "Reçus"], ["/fr/toolkit", "Boîte à outils"], ["/fr/about", "À propos"], ["/fr/contribute", "Contribuer"]];

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
function mdToHtml(md) {
  const out = [];
  for (const block of String(md).split(/\n{2,}/)) {
    const t = block.trim();
    if (!t) continue;
    const h = t.match(/^(#{1,6})\s+([\s\S]*)$/);
    if (h) { const lvl = Math.min(6, h[1].length + 2); out.push(`<h${lvl}>${inlineMd(h[2])}</h${lvl}>`); continue; }
    if (/^\s*[-*]\s+/.test(t)) {
      const items = t.split(/\n/).filter((l) => /^\s*[-*]\s+/.test(l)).map((l) => `<li>${inlineMd(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("");
      out.push(`<ul>${items}</ul>`); continue;
    }
    if (/^>\s?/.test(t)) { out.push(`<blockquote>${inlineMd(t.replace(/^>\s?/gm, ""))}</blockquote>`); continue; }
    out.push(`<p>${inlineMd(t.replace(/\n/g, " "))}</p>`);
  }
  return out.join("");
}
// Build the inlined body for a /chapter/N route in the given language. Returns ""
// for non-chapter routes or if the source JSON is missing/unparseable.
function chapterBodyHtml(route, lang) {
  const m = route.match(/^\/chapter\/(\d+)$/);
  if (!m) return "";
  const n = Number(m[1]);
  const dir = lang === "fr" ? path.join(DIST, "content", "fr", "chapters") : path.join(DIST, "content", "chapters");
  let ch;
  try { ch = JSON.parse(fs.readFileSync(path.join(dir, `ch${String(n).padStart(2, "0")}.json`), "utf8")); }
  catch { return ""; }
  const fr = lang === "fr";
  let b = "";
  if (ch.startHere) b += `<p>${inlineMd(ch.startHere)}</p>`;
  for (const s of ch.sections || []) {
    if (s && s.heading) b += `<h2>${esc(s.heading)}</h2>`;
    if (s && s.markdown) b += mdToHtml(s.markdown);
  }
  for (const g of ch.goblinChecks || []) { if (g && g.markdown) b += mdToHtml(g.markdown); }
  if (Array.isArray(ch.recap) && ch.recap.length)
    b += `<h2>${fr ? "Récapitulatif" : "Recap"}</h2><ul>${ch.recap.map((r) => `<li>${inlineMd(r)}</li>`).join("")}</ul>`;
  if (Array.isArray(ch.sources) && ch.sources.length)
    b += `<h2>Sources</h2><ul>${ch.sources.map((s) => `<li>${inlineMd(s)}</li>`).join("")}</ul>`;
  return b ? `<article data-prerender-body>${b}</article>` : "";
}

// /guide — the table of contents, built from book.json parts so crawlers see every
// part, region, and chapter link, not just an empty index shell.
function guideBodyHtml(lang) {
  const dir = lang === "fr" ? path.join(DIST, "content", "fr") : path.join(DIST, "content");
  let b;
  try { b = JSON.parse(fs.readFileSync(path.join(dir, "book.json"), "utf8")); } catch { return ""; }
  const fr = lang === "fr";
  const pfx = fr ? "/fr" : "";
  let h = b.subtitle ? `<p>${esc(b.subtitle)}</p>` : "";
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
  const dir = lang === "fr" ? path.join(DIST, "content", "fr") : path.join(DIST, "content");
  let r;
  try { r = JSON.parse(fs.readFileSync(path.join(dir, "receipts.json"), "utf8")); } catch { return ""; }
  if (!Array.isArray(r) || !r.length) return "";
  let h = "", lastSec = null;
  for (const row of r) {
    if (row.section && row.section !== lastSec) { h += `<h2>${esc(row.section)}</h2>`; lastSec = row.section; }
    const status = row.status ? ` <em>(${esc(row.status)})</em>` : "";
    h += `<div><p><strong>${inlineMd(row.claim || "")}</strong>${status}</p>`;
    if (row.detail) h += mdToHtml(row.detail);
    h += "</div>";
  }
  return `<section data-prerender-body>${h}</section>`;
}

// Dispatch a route to its body builder. Chapters, the guide TOC, the glossary, and
// the receipts ledger all get full inlined content; everything else stays shell-only.
function routeBodyHtml(route, lang) {
  if (/^\/chapter\/\d+$/.test(route)) return chapterBodyHtml(route, lang);
  if (route === "/guide") return guideBodyHtml(lang);
  if (route === "/loot") return glossaryBodyHtml(lang);
  if (route === "/receipts") return receiptsBodyHtml(lang);
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
function homeHeroHtml() {
  const nav = NAV_EN.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join("") + `<a href="/fr">Édition française</a>`;
  const flagSet = "/art/panels/canada-flag-panel-640w.webp 640w, /art/panels/canada-flag-panel-960w.webp 960w, /art/panels/canada-flag-panel.webp 1024w";
  const heroSet = "/art/panels/hero-panel-640w.webp 640w, /art/panels/hero-panel-960w.webp 960w, /art/panels/hero-panel.webp 1024w";
  return `<div data-prerender-hero>` +
    `<div class="dg-topbar"></div>` +
    `<main class="dg-heromain"><section class="dg-hero">` +
      `<div class="dg-hero-col">` +
        `<div class="dg-hero-eyebrow">Free interactive web book · June 2026</div>` +
        `<div class="dg-hero-titlerow">` +
          `<h1 class="dg-hero-title">Data Goblin</h1>` +
          `<img class="dg-hero-flag" src="/art/panels/canada-flag-panel-640w.webp" srcset="${flagSet}" sizes="(max-width: 720px) 150px, 210px" width="1024" height="1024" alt="" aria-hidden="true" decoding="async" />` +
        `</div>` +
        `<p class="dg-hero-subtitle">A Field Guide to AI, Power, and Data in Canada</p>` +
        `<p class="dg-hero-body">A plain-language guide for reading AI claims in Canada: who counted what, who benefits, what is still contested, and where the receipts live.</p>` +
        `<div class="dg-hero-cta">` +
          `<a class="dg-hero-btn dg-hero-btn-primary" href="/chapter/1">Begin with Chapter 1</a>` +
          `<a class="dg-hero-btn dg-hero-btn-secondary" href="/guide">Open the guide</a>` +
        `</div>` +
      `</div>` +
      `<div class="dg-hero-card">` +
        `<img class="dg-hero-img" src="/art/panels/hero-panel-640w.webp" srcset="${heroSet}" sizes="(max-width: 720px) 92vw, (max-width: 1100px) 46vw, 650px" width="1024" height="1024" alt="Data Goblin inspecting a trail of receipts and glowing evidence crystals" fetchpriority="high" decoding="async" />` +
      `</div>` +
    `</section></main>` +
    `<nav class="dg-srnav" aria-label="Primary navigation">${nav}</nav>` +
  `</div>`;
}

function seoShell(route, h1, desc, lang) {
  if (route === "" && lang === "en") return homeHeroHtml();
  const nav = (lang === "fr" ? NAV_FR : NAV_EN).map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join("");
  const altHref = lang === "fr" ? (route || "/") : "/fr" + route;
  const altLabel = lang === "fr" ? "English edition" : "Édition française";
  const navLabel = lang === "fr" ? "Navigation principale" : "Primary navigation";
  const body = routeBodyHtml(route, lang);
  return `<div data-prerender-shell><h1>${esc(h1)}</h1><p>${esc(desc)}</p><nav aria-label="${navLabel}">${nav}<a href="${altHref}">${esc(altLabel)}</a></nav>${body}</div>`;
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
  const extra = articleJsonLd(route, h1, self, lang);
  if (extra) h = h.replace("</head>", `${extra}\n  </head>`);
  return h;
}

function write(relPath, html) {
  const dir = path.join(DIST, relPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

let count = 0;
// Home (both languages)
write("", render("", HOME_FULL_EN, HOME_FULL_EN, DESC_EN, "en")); // overwrites dist/index.html with hreflang
write("fr", render("", HOME_FULL_FR, HOME_FULL_FR, DESC_FR, "fr"));
count += 2;
for (const [route, enTitle, enDesc, frTitle, frDesc] of ROUTE_META) {
  const rel = route.replace(/^\//, "");
  write(rel, render(route, enTitle, `${enTitle} — Data Goblin`, enDesc, "en"));
  write("fr/" + rel, render(route, frTitle, `${frTitle} — Data Goblin`, frDesc, "fr"));
  count += 2;
}
console.log(`prerender-meta: wrote ${count} per-route HTML shells (EN + FR)`);

// ---- Generate sitemap.xml (EN + FR, with hreflang alternates) ----
function smMeta(route) {
  if (route === "") return ["1.0", "monthly"];
  if (route.startsWith("/topic/")) return ["0.7", "monthly"];
  if (route === "/guide" || route === "/loot" || route === "/receipts") return ["0.8", "yearly"];
  return ["0.6", "yearly"];
}
const today = BUILD_DATE;
const allRoutes = [""].concat(ROUTE_META.map((r) => r[0]));
let urlsXml = "";
for (const route of allRoutes) {
  const [prio, freq] = smMeta(route);
  const urlEn = SITE + (route || "/");
  const urlFr = SITE + "/fr" + route;
  const alts =
    `\n    <xhtml:link rel="alternate" hreflang="en-CA" href="${esc(urlEn)}"/>` +
    `\n    <xhtml:link rel="alternate" hreflang="fr-CA" href="${esc(urlFr)}"/>` +
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(urlEn)}"/>`;
  for (const loc of [urlEn, urlFr]) {
    urlsXml += `\n  <url>\n    <loc>${esc(loc)}</loc>${alts}\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`;
  }
}
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urlsXml}\n</urlset>\n`;
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemapXml);
console.log(`prerender-meta: wrote sitemap.xml with ${allRoutes.length * 2} URLs (EN + FR, hreflang)`);
