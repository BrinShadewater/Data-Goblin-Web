# Data Goblin — Interactive Edition Pipeline 🧾

The bridge between the manuscript and the Figma Make mockup. One command turns the book, the Receipts Ledger, and the Glossary into the JSON your components consume.

Data Goblin is an interactive field guide about AI, power, and data in Canada. The repo is organized around one central promise: the manuscript and receipts remain the source of truth, and the web app renders that evidence trail rather than inventing its own content. It is playful at the edges, serious in the receipts drawer.

## 🧭 What This Project Does

- Converts manuscript, receipt, glossary, trap, and link material into structured JSON.
- Publishes a React reader with chapters, routes, receipts, search, notes, bookmarks, and theme controls.
- Preserves verification flags instead of hiding unfinished evidence work.
- Ships generated public content into the app so the reader can be built and deployed as a static site.
- Keeps launch planning and guardrails close to the code.

```
python3 pipeline/build_content.py
```

Re-run it any time the manuscript changes. The manuscript stays the single source of truth — nobody hand-edits chapter JSON, ever. (The goblin checked. Nobody.)

## ✅ Validation

On Windows, regenerate content and verify the app with:

```powershell
.\update-content.bat
cd app
$env:NODE_ENV='development'
npm run verify
```

`npm run verify` checks that generated content matches the deployed public
copy, runs pagination sanity checks, and then runs the production build.

## 🚦 Repository Status

Launch-prep project. The app is functional, but the roadmap still calls out deployment, metadata, accessibility, and public-update surfaces before/around launch.

## 📦 What It Produces

| File | Contents | Feeds mockup component |
|---|---|---|
| `content/book.json` | Title, parts → regions (The Land / The Creatures / The Weather / The Map / The Tools), TOC with per-chapter goblin-check and open-flag counts, front matter + appendix markdown | `LeftSidebar` (TOC), `TopNav`, `AboutPage` |
| `content/chapters/ch01–ch19.json` | Per chapter: `title`, `part`, `region`, `startHere`, `sections[{heading, markdown}]`, `goblinChecks[]`, `recap[]`, `biasLabel`, `sources[]`, `verifyFlags[]` | `LeftPage` (title + Start Here + Goblin Note), `RightPage` (sections), `BottomBar` (prev/next) |
| `content/receipts.json` | All 50 ledger rows: `{id, section, claim, status: resolved/fixed/open, detail, links[]}` | `ReceiptsPage` accordions + the **Show Receipts** sidebar panel |
| `content/glossary.json` | 45 terms: `{term, def, chapters, letter}` | `LootPage` |

## 🔢 Current Validated Counts (2026-06-10)

20 chapters · 25 goblin checks · 19 recap boxes (127 bullets) · 20 bias labels · 18 chapter source-blocks · 56 receipt rows · 45 glossary terms · 0 inline verify flags open in chapter text.

## 🧷 Mapping Notes For The Wiring Step

- **Goblin Note callout (LeftPage)** ← `goblinChecks[0]` of the chapter; remaining checks render inline in `RightPage` at their section anchors.
- **Goblin Trap callout (RightPage)** ← no manuscript device yet. Trap inventory to be authored from the overstatement audit (danger phrases, "publicly available," per-query vs aggregate). Until then, hide the Trap card rather than faking one.
- **Quest Items (RightSidebar)** ← `recap[]` bullets, checkbox state in localStorage.
- **Suspicion Meter (RightSidebar)** ← proposal: drive it from real data — the chapter's source-mix (share of corporate self-disclosure vs independent sources in `sources[]`) or `verifyFlags` count. Not vibes. The meter should be the bias-mapping method as UI.
- **Show Receipts (RightSidebar)** ← chapter `sources[]` + `receipts.json` rows filtered to that chapter.
- **Chapter count fix:** the mockup's `CHAPTER_TITLES` had 18 chapters — **Chapter 11 (IP & Copyright) was missing** and everything after shifted up one. `book.json` is canonical: 20 chapters, real titles, real part boundaries (I: 1–4, II: 5–7, III: 8–15, IV: 16–17, V: 18–20).
- **Part colours (ReceiptsPage `PART_COLORS`)**: rebuild from `book.json` parts, not hardcoded ranges.
- **Mascot provenance:** current mascot is an AI-generated PNG. For a book about AI disclosure, either commission the goblin or disclose the generation — decide before public launch. (The goblin box about it writes itself.)

## 🗂️ Folder Layout

```
Project Goblin/
  DataGoblin-Complete.md        ← single source of truth
  Receipts-Ledger.md
  Glossary-Draft.md
  Sources/                      ← the receipt drawer
  mockup-source/extracted-src/  ← components recovered from the .make file
  site/
    pipeline/build_content.py   ← this pipeline
    content/                    ← generated JSON (gitignore later? no — commit it, receipts are the point)
```

## 🛠️ Next Build Steps

1. Wire the extracted mockup components to `content/` (replace placeholder data imports).
2. Author the Goblin Trap inventory (one per chapter, from the overstatement audit).
3. Receipts deep-links: every `<!-- VERIFY -->` flag surfaces in the UI as an honest "open flag" badge — unverified claims wear it in public, which *is* the brand.
4. Repo init + licence decision (CC BY-SA for text? MIT for code?) before the open-source release.

## 📚 Documentation

- `AGENTS.md`
- `ROADMAP.md`
- `docs/PROJECT-BRIEF.md`
- `docs/MAINTENANCE.md`
- `docs/local-storage-contract.md`
- `docs/refactor-baseline.md`
- `docs/visual-parity-checklist.md`
