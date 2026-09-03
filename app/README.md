# Data Goblin — the reader (web app)

The production React site for **Data Goblin — A Field Guide to AI, Power, and Data in Canada**,
served at [datagoblin.ca](https://datagoblin.ca) in English and French. Vite + React +
TypeScript, printed-book aesthetic, light and dark mode.

**The project README lives one level up: [`../README.md`](../README.md)** — start there for
what Data Goblin is, the content pipeline, and the licence. This file covers the app itself.

**No book content is hardcoded.** Everything renders at runtime from JSON in
`public/content/`, which the pipeline generates from the manuscript. Nobody hand-edits that
JSON — it is overwritten on the next build.

## Run it

```bash
cd app
npm ci             # first time, and after any lockfile change
npm run dev        # dev server
npm run build      # type-check, production build, pre-rendered meta, IndexNow submit
npm run preview    # serve the production build locally
```

Routing is path-based (`/chapter/8`, `/fr/chapter/8`) with `BrowserRouter`. `vercel.json`
rewrites every non-asset path to `index.html`, so the app is not portable to a static host
without an equivalent rewrite.

## Updating the book content

The manuscript is the single source of truth and lives in the separate, private manuscript
repo. From this repo's root:

```powershell
.\update-content.bat      # Windows
./update-content.sh       # mac/linux
```

Either runs `pipeline/build_content.py`, copies `content/` into `app/public/content/`,
checks the two stayed in sync, and prints which JSON files changed. Then reload the dev
server or rebuild.

## Verify before shipping

```bash
npm run verify
```

`scripts/verify.cjs` checks generated content matches the published copy, runs the
pagination and contribution-form sanity checks, and then runs the production build. CI
runs the build on every pull request and every push to `main`.

Other checks worth knowing: `check:anchors` (claim anchors still resolve), `check:budgets`
(performance budgets), `check:built-site` and `check:browser` (smoke tests against the
built output), `audit:images`, and `fix:fr` (applies the hand-curated French corrections).

## Routes

| Path | Page |
|---|---|
| `/` | Landing page |
| `/guide`, `/chapter/:num` | The book spread — the reader itself |
| `/receipts` | The Receipts Ledger with status badges |
| `/loot` | Glossary with A–Z index and search |
| `/map` | The five regions as chapter-link cards |
| `/topic/:slug` | Topic pages that cut across chapters |
| `/toolkit` | The claim-testing toolkit |
| `/updates` | Changelog and corrections |
| `/about`, `/contribute`, `/privacy` | Static pages |

Every route has a `/fr` twin. Unknown paths render a real 404.

## Content contract

`src/types.ts` is the TypeScript mirror of the content JSON and is the authoritative shape —
read it rather than any table here. The files are `book.json`, `chapters/chNN.json`,
`receipts.json`, `glossary.json`, `traps.json`, and the `fr/` mirror of all of them.

Markdown renders through `react-markdown` + `remark-gfm`. Goblin Check and Chapter Recap
blockquotes render as callout cards; see `components/MarkdownCallouts.tsx`.

## File map

```text
app/
  index.html                 Shell and metadata
  vercel.json                SPA rewrite plus security headers and CSP
  api/contribute.ts          Serverless handler for the contribute form (Resend); validates
                             report type, lengths, and request origin server-side
  public/content/            Published JSON content — generated, do not edit by hand
  public/art/figures/        Data figures, four variants each (light/dark × EN/FR)
  scripts/                   Build-time and verification scripts (see above)
  src/
    main.tsx, App.tsx        Entry and router shell
    lazyRoutes.ts            The route table — every page is code-split
    types.ts                 Content contract
    useContent.ts            Runtime JSON fetch with a module-level cache
    i18n.ts, ui-fr.ts        UI strings and the hand-curated French dictionary
    LanguageContext.tsx      EN/FR switching
    ThemeContext.tsx         Light/dark, persisted
    ListenContext.tsx        The listen bar (read-aloud) state
    search.ts, topics.ts     Search index and topic definitions
    sources.ts               Source-line tagging behind the per-chapter receipts card
    useLocalStorage.ts       Persisted reader state (notes, bookmarks, quest checkboxes)
    pages/                   One file per route above
    components/              Reader chrome, sidebars, callouts, tool cards, drawers
```

## Notes

- Goblin Notes, bookmarks, and Quest Items persist to `localStorage` per chapter; the
  contract is documented in `../docs/local-storage-contract.md`.
- The French edition is machine-translated by the pipeline and then corrected; UI chrome
  comes from `ui-fr.ts`, never from the translation pass.
- Analytics load only behind the consent gate (`components/AnalyticsConsentGate.tsx`).
