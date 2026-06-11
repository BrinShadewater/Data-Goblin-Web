# 🧌 Data Goblin — Interactive Edition Pipeline

The bridge between the manuscript and the Figma Make mockup. One command turns the book, the Receipts Ledger, and the Glossary into the JSON your components consume.

```
python3 pipeline/build_content.py
```

Re-run it any time the manuscript changes. The manuscript stays the single source of truth — nobody hand-edits chapter JSON, ever. (The goblin checked. Nobody.)

## What it produces

| File | Contents | Feeds mockup component |
|---|---|---|
| `content/book.json` | Title, parts → regions (The Land / The Creatures / The Weather / The Map / The Tools), TOC with per-chapter goblin-check and open-flag counts, front matter + appendix markdown | `LeftSidebar` (TOC), `TopNav`, `AboutPage` |
| `content/chapters/ch01–ch19.json` | Per chapter: `title`, `part`, `region`, `startHere`, `sections[{heading, markdown}]`, `goblinChecks[]`, `recap[]`, `biasLabel`, `sources[]`, `verifyFlags[]` | `LeftPage` (title + Start Here + Goblin Note), `RightPage` (sections), `BottomBar` (prev/next) |
| `content/receipts.json` | All 50 ledger rows: `{id, section, claim, status: resolved/fixed/open, detail, links[]}` | `ReceiptsPage` accordions + the **Show Receipts** sidebar panel |
| `content/glossary.json` | 45 terms: `{term, def, chapters, letter}` | `LootPage` |

## Current validated counts (2026-06-10)

19 chapters · 20 goblin checks · 17 recap boxes (110 bullets) · 19 bias labels · 17 chapter source-blocks · 50 receipt rows (14 resolved / 23 fixed / 13 open) · 45 glossary terms · 18 inline verify flags still open in chapter text.

## Mapping notes for the wiring step

- **Goblin Note callout (LeftPage)** ← `goblinChecks[0]` of the chapter; remaining checks render inline in `RightPage` at their section anchors.
- **Goblin Trap callout (RightPage)** ← no manuscript device yet. Trap inventory to be authored from the overstatement audit (danger phrases, "publicly available," per-query vs aggregate). Until then, hide the Trap card rather than faking one.
- **Quest Items (RightSidebar)** ← `recap[]` bullets, checkbox state in localStorage.
- **Suspicion Meter (RightSidebar)** ← proposal: drive it from real data — the chapter's source-mix (share of corporate self-disclosure vs independent sources in `sources[]`) or `verifyFlags` count. Not vibes. The meter should be the bias-mapping method as UI.
- **Show Receipts (RightSidebar)** ← chapter `sources[]` + `receipts.json` rows filtered to that chapter.
- **Chapter count fix:** the mockup's `CHAPTER_TITLES` had 18 chapters — **Chapter 11 (IP & Copyright) was missing** and everything after shifted up one. `book.json` is canonical: 19 chapters, real titles, real part boundaries (I: 1–4, II: 5–7, III: 8–14, IV: 15–16, V: 17–19).
- **Part colours (ReceiptsPage `PART_COLORS`)**: rebuild from `book.json` parts, not hardcoded ranges.
- **Mascot provenance:** current mascot is an AI-generated PNG. For a book about AI disclosure, either commission the goblin or disclose the generation — decide before public launch. (The goblin box about it writes itself.)

## Folder layout

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

## Next build steps

1. Wire the extracted mockup components to `content/` (replace placeholder data imports).
2. Author the Goblin Trap inventory (one per chapter, from the overstatement audit).
3. Receipts deep-links: every `<!-- VERIFY -->` flag surfaces in the UI as an honest "open flag" badge — unverified claims wear it in public, which *is* the brand.
4. Repo init + licence decision (CC BY-SA for text? MIT for code?) before the open-source release.
