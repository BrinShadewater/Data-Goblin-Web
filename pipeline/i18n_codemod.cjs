// UI i18n codemod (Windows-native). Uses the TypeScript AST so it only touches
// real JSX text and whitelisted JSX string attributes — never code.
//   node pipeline/i18n_codemod.cjs extract           -> pipeline/_uikeys.json
//   node pipeline/i18n_codemod.cjs apply <frdict.json>
const fs = require("fs"), path = require("path");
const SRC = path.join(__dirname, "..", "app", "src");
const ts = require(path.join(SRC, "..", "node_modules", "typescript"));
const TARGETS = [
  "pages/AboutPage.tsx","pages/ContributePage.tsx","pages/FieldGuidePage.tsx",
  "pages/LandingPage.tsx","pages/LootPage.tsx","pages/MapPage.tsx",
  "pages/NotFoundPage.tsx","pages/PrivacyPage.tsx","pages/ReceiptsPage.tsx",
  "pages/ToolkitPage.tsx","pages/TopicPage.tsx","pages/UpdatesPage.tsx",
  "components/BottomBar.tsx","components/ReaderChrome.tsx","components/SearchOverlay.tsx",
  "components/CookieNotice.tsx","components/GoblinTools.tsx","components/GoblinToolCards.tsx",
  "components/LandingSections.tsx","components/LandingQuickLinks.tsx",
  "components/ContributeSections.tsx","components/ContributionForm.tsx",
  "components/TableOfContents.tsx","components/RightSidebar.tsx","components/LeftSidebar.tsx",
  "components/ToolCard.tsx","components/ChapterReceiptsCard.tsx","components/ReceiptRows.tsx",
  "components/StaticPage.tsx","components/MobileDrawerSections.tsx","components/PageHeadings.tsx",
];
const PROPS = new Set(["placeholder","aria-label","title","alt","label","description","eyebrow","kicker","subtitle"]);
const ENT = { "&amp;":"&","&ldquo;":"“","&rdquo;":"”","&lsquo;":"‘","&rsquo;":"’","&mdash;":"—","&ndash;":"–","&hellip;":"…","&nbsp;":" ","&times;":"×","&rarr;":"→","&larr;":"←" };
const decode = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&[a-z]+;/gi, (m) => ENT[m] || m);
const norm = (s) => decode(s).replace(/\s+/g, " ").trim();
const eligible = (s) => s.length >= 2 && /[A-Za-z]/.test(s) && s !== "Data Goblin" && s !== "DATA GOBLIN";

function collect(code, dict, mode) {
  const sf = ts.createSourceFile("f.tsx", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const keys = new Set(), edits = [];
  (function walk(node) {
    if (node.kind === ts.SyntaxKind.JsxText) {
      const raw = code.slice(node.getFullStart(), node.getEnd());
      const key = norm(raw);
      if (eligible(key)) {
        keys.add(key);
        if (mode === "apply" && key in dict) {
          const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
          edits.push({ s: node.getFullStart(), e: node.getEnd(), t: lead + "{t(" + JSON.stringify(key) + ")}" + trail });
        }
      }
    } else if (node.kind === ts.SyntaxKind.JsxAttribute && node.name && node.initializer &&
               node.initializer.kind === ts.SyntaxKind.StringLiteral && PROPS.has(node.name.getText(sf))) {
      const key = norm(node.initializer.text);
      if (eligible(key)) {
        keys.add(key);
        if (mode === "apply" && key in dict) {
          edits.push({ s: node.initializer.getStart(sf), e: node.initializer.getEnd(), t: "{t(" + JSON.stringify(key) + ")}" });
        }
      }
    }
    node.forEachChild(walk);
  })(sf);
  edits.sort((a, b) => b.s - a.s);
  let out = code;
  for (const ed of edits) out = out.slice(0, ed.s) + ed.t + out.slice(ed.e);
  return { keys, out, n: edits.length };
}
function ensureImport(code, rel) {
  if (/from ["']\.{1,2}\/i18n["']/.test(code)) return code;
  const lines = code.split("\n");
  let last = -1;
  for (let i = 0; i < lines.length; i++) if (/^import /.test(lines[i])) last = i;
  lines.splice(last + 1, 0, `import { t } from "${rel}/i18n";`);
  return lines.join("\n");
}

const mode = process.argv[2];
if (mode === "extract") {
  const set = new Set();
  for (const f of TARGETS) { const p = path.join(SRC, f); if (fs.existsSync(p)) collect(fs.readFileSync(p, "utf8"), {}, "extract").keys.forEach((k) => set.add(k)); }
  const arr = [...set].sort();
  fs.writeFileSync(path.join(__dirname, "_uikeys.json"), JSON.stringify(arr), "utf8");
  console.log("extracted", arr.length, "strings -> pipeline/_uikeys.json");
} else if (mode === "apply") {
  const dict = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
  let files = 0, total = 0;
  for (const f of TARGETS) {
    const p = path.join(SRC, f); if (!fs.existsSync(p)) continue;
    const { out, n } = collect(fs.readFileSync(p, "utf8"), dict, "apply");
    if (n > 0) {
      const rel = (f.includes("/")) ? ".." : ".";
      fs.writeFileSync(p, ensureImport(out, rel), "utf8");
      files++; total += n; console.log(`  ${f}: ${n}`);
    }
  }
  console.log(`applied ${total} wraps across ${files} files`);
} else console.log("usage: extract | apply <frdict.json>");
