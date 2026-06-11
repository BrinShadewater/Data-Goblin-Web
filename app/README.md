# Data Goblin — interactive field guide (web app)

A production React site for **Data Goblin — A Field Guide to AI, Power, and Data in Canada**.
Vite + React + TypeScript, printed-book aesthetic (warm parchment, deep goblin green,
Playfair Display / Source Serif 4 / JetBrains Mono / Inter, 2px radii), light and dark mode.

**No book content is hardcoded.** Everything renders at runtime from JSON in
`public/content/`, which is generated from the manuscript by the pipeline.

## Run it

```bash
cd site/app
npm install        # first time only
npm run dev        # dev server → http://localhost:5173
npm run build      # production build → dist/ (also type-checks)
npm run preview    # serve the production build locally
```

The router is hash-based (`/#/chapter/8`), so `dist/` can be served from any static host
with zero rewrite configuration.

## Updating the book content

The manuscript markdown is the single source of truth. After editing
`DataGoblin-Complete.md` (or `Receipts-Ledger.md` / `Glossary-Draft.md` /
`Goblin-Traps.md`):

```bash
# one-step (mac/linux):
site/update-content.sh

# one-step (windows):
site\update-content.bat

# or manually:
python3 site/pipeline/build_content.py        # regenerates site/content/*.json
cp -r site/content/. site/app/public/content/ # publish into the app
```

The update script runs the pipeline, copies `site/content` → `site/app/public/content`,
and prints a summary of which JSON files changed. Reload the page (dev) or re-run
`npm run build` (production) and the new content is live.

## Content contract (`public/content/`)

| File                  | Shape                                                                     |
| --------------------- | ------------------------------------------------------------------------- |
| `book.json`           | `{title, subtitle, asOf, parts[{part, region, chapters[]}], frontmatterMarkdown, appendixMarkdown}` |
| `chapters/chNN.json`  | `{number, title, part, region, startHere, sections[{heading, markdown}], goblinChecks[], recap[], biasLabel, sources[], verifyFlags[]}` |
| `traps.json`          | `{"<chapterNum>": {chapter, chapterTitle, trapTitle, text}}`               |
| `receipts.json`       | `[{id, section, claim, status: resolved|fixed|open, detail, links[[label,url]]}]` |
| `glossary.json`       | `[{term, def, chapters, letter}]`                                          |

Markdown is rendered with `react-markdown` + `remark-gfm`. Blockquotes whose first strong
text contains **🧌 GOBLIN CHECK** render as green goblin callout cards; **📦 CHAPTER
RECAP** blockquotes render as recap boxes.

## File map

```
site/app/
  index.html                     Google Fonts (Playfair, Source Serif 4, JetBrains Mono, Inter, Caveat)
  vite.config.ts                 default Vite + React
  public/content/                published JSON content (generated — do not edit by hand)
  src/
    main.tsx                     entry
    App.tsx                      router shell: TopNav + routes + SearchOverlay
    theme.ts                     design tokens (font stacks, light/dark colour pairs, 2px radius)
    ThemeContext.tsx             dark-mode context with c(light, dark) helper (persisted)
    types.ts                     TypeScript mirror of the content JSON schema
    useContent.ts                runtime JSON fetch with module-level cache
    useLocalStorage.ts           persisted state (notes, quest checkboxes, theme)
    sources.ts                   source-line tagging + Suspicion Meter computation
    assets/                      goblin mascot + head icon (cropped from the design mockup)
    components/
      Markdown.tsx               react-markdown wrapper + Goblin Check / Recap callout detection
      TopNav.tsx                 logo, nav links, search box, dark-mode toggle
      LeftSidebar.tsx            TOC grouped by region (from book.json)
      RightSidebar.tsx           Goblin Notes / Suspicion Meter / Quest Items / Show Receipts
      BottomBar.tsx              prev–next chapter + 19 progress dots
      LeftPage.tsx               chapter label, title, mascot, Start Here, Goblin Note
      RightPage.tsx              sections as markdown, Goblin Trap card, bias label
      SearchOverlay.tsx          searches chapter titles, section headings, glossary terms
      GoblinMascot.tsx           mascot + head icon images
    pages/
      FieldGuidePage.tsx         "/" and "/chapter/:num" — the book spread
      ReceiptsPage.tsx           "/receipts" — verification ledger with status badges
      LootPage.tsx               "/loot" — glossary with A–Z index + search
      MapPage.tsx                "/map" — five regions as chapter-link cards
      AboutPage.tsx              "/about" — real frontmatter excerpts
      ContributePage.tsx         "/contribute" — report form + "How revisions work"
```

## Notes

- **Suspicion Meter** is deterministic: `½·min(1, openVerifyFlags/4) + ½·(corporate-source share)`,
  computed per chapter from `verifyFlags` and keyword-tagged `sources`. The formula is shown in the
  card's tooltip.
- Goblin Notes and Quest Items persist to `localStorage` per chapter.
- The mascot images are crops from the recovered Figma Make mockup screenshot
  (`mockup-source/images/`).
