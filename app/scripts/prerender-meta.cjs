// Browser-free per-route meta prerender. Copies dist/index.html into
// dist/<route>/index.html with route-specific <title> / description / OG tags so
// social scrapers and crawlers get the right preview per page. Pure Node — runs
// in any build environment (including Vercel) with no headless browser.
const fs = require("fs");
const path = require("path");

const DIST = process.env.PRERENDER_DIST
  ? path.resolve(process.env.PRERENDER_DIST)
  : path.resolve(__dirname, "../dist");
const SITE = "https://datagoblin.ca";
const indexPath = path.join(DIST, "index.html");
if (!fs.existsSync(indexPath)) { console.error("prerender-meta: dist/index.html missing — skipping"); process.exit(0); }
const base = fs.readFileSync(indexPath, "utf8");

const DESC = "A free, open field guide to AI, data centres, and digital sovereignty, written for Canadians. Every claim comes with a receipt.";

const routes = [
  ["/guide", "Field Guide", DESC],
  ["/map", "Map", "Browse the field guide by region and question."],
  ["/loot", "Glossary", "Plain-language definitions for the AI, data, and sovereignty terms the guide uses."],
  ["/receipts", "Receipts", "The claim-by-claim source ledger behind the guide."],
  ["/about", "About", "About Data Goblin and Shadewater Labs."],
  ["/contribute", "Contribute", "Suggest a source, flag an error, or help improve the guide."],
  ["/updates", "Updates & Corrections", "A dated log of what changed and what was corrected in the guide."],
  ["/privacy", "Privacy", "What this site stores, and what it does not."],
];

try {
  const chDir = path.join(DIST, "content", "chapters");
  for (const f of fs.readdirSync(chDir).filter((n) => /^ch\d+\.json$/.test(n))) {
    const ch = JSON.parse(fs.readFileSync(path.join(chDir, f), "utf8"));
    const n = ch.number;
    const title = (ch.title || "").split(" — ")[0] || `Chapter ${n}`;
    const label = n === 0 ? "Front Matter" : n === 20 ? "Source Library Appendix" : `Chapter ${n}: ${title}`;
    routes.push([`/chapter/${n}`, label, DESC]);
  }
} catch (e) { console.warn("prerender-meta: chapter read warning —", e.message); }

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function render(route, title, desc) {
  const full = `${title} — Data Goblin`;
  const url = SITE + route;
  let h = base;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(full)}</title>`);
  h = h.replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
  h = h.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(full)}$2`);
  h = h.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
  h = h.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(url)}$2`);
  h = h.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(url)}$2`);
  h = h.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(full)}$2`);
  h = h.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
  return h;
}

let count = 0;
for (const [route, title, desc] of routes) {
  const dir = path.join(DIST, route.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), render(route, title, desc));
  count++;
}
console.log(`prerender-meta: wrote ${count} per-route HTML shells`);
