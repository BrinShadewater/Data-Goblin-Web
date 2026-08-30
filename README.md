# Data Goblin — Interactive Edition Pipeline 🧾

![Licence](https://img.shields.io/badge/licence-CC%20BY--NC-green?style=flat-square) ![Live](https://img.shields.io/badge/live-datagoblin.ca-brightgreen?style=flat-square) ![Bilingual](https://img.shields.io/badge/EN%20%7C%20FR-bilingual-blueviolet?style=flat-square) ![Shadewater Labs](https://img.shields.io/badge/Shadewater%20Labs-%E2%9A%97%EF%B8%8F-6b4fa2?style=flat-square)

The bridge between the manuscript and the live reader at
**[datagoblin.ca](https://datagoblin.ca)**. One command turns the book, the Receipts
Ledger, and the Glossary into the JSON the reader consumes.

Data Goblin is an interactive field guide about AI, power, and data in Canada. The repo
is organized around one central promise: the manuscript and receipts remain the source of
truth, and the web app renders that evidence trail rather than inventing its own content.
It is playful at the edges, serious in the receipts drawer.

## 🚦 Repository Status

Live, in both languages. [datagoblin.ca](https://datagoblin.ca) serves the English and
French editions from this repo via Vercel. Content changes flow through the pipeline
below; code changes go through PRs like anywhere else. An earlier version of this README
described a launch-prep project wiring mockup components to placeholder data — that era
is over, and the reader is the real thing.

## 🧭 What This Project Does

- Converts manuscript, receipt, glossary, trap, and link material into structured JSON.
- Publishes a React reader with chapters, receipts, search, notes, bookmarks, data
  figures, a listen bar, and theme controls.
- Ships the French edition alongside the English one — machine-translated by the
  OPUS-MT pipeline, then corrected, with a hand-curated UI dictionary for the chrome.
- Preserves verification flags instead of hiding unfinished evidence work. An
  unverified claim wears an honest "open flag" badge in public, which *is* the brand.

```
python3 pipeline/build_content.py
```

Re-run it any time the manuscript changes. The manuscript stays the single source of
truth — nobody hand-edits chapter JSON, ever. (The goblin checked. Nobody.)

Chapter, receipt, and glossary counts are deliberately not recorded here — enumerated
counts rot the moment the book grows. The build prints its own counts every run; trust
the freshest output over any document, including this one.

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

## 📦 What It Produces

| File | Contents |
|---|---|
| `content/book.json` | Title, parts → regions (The Land / The Creatures / The Weather / The Map / The Tools), the TOC, front matter and appendix markdown |
| `content/chapters/chNN.json` | Per chapter: sections, goblin checks, recap bullets, bias label, sources, verify flags |
| `content/receipts.json` | The Receipts Ledger — every claim, its status, and its links |
| `content/glossary.json` | The Loot page's terms |
| `content/traps.json` | The Goblin Trap inventory, authored from the overstatement audit |
| `content/fr/` | The French edition, mirroring all of the above |

## 🗂️ Folder Layout

```
pipeline/       build_content.py, the FR resync and validation tools
content/        generated JSON — committed on purpose; receipts are the point
app/            the React reader, deployed to Vercel
docs/           project brief, maintenance, and the local-storage contract
```

The manuscript, the Receipts Ledger, and the private `Sources/` research captures live
in the separate (private) manuscript repo — never here. Generated JSON crosses over;
sources do not.

## 📚 Documentation

- `AGENTS.md`
- `ROADMAP.md`
- `docs/PROJECT-BRIEF.md`
- `docs/MAINTENANCE.md`
- `docs/local-storage-contract.md`
- `docs/refactor-baseline.md`
- `docs/visual-parity-checklist.md`


## Licence

This repo is dual-licensed. Full terms in [`LICENSE`](LICENSE) (code) and
[`LICENSE-CONTENT.md`](LICENSE-CONTENT.md) (book).

- **Code** — [MIT](LICENSE): the site source, build scripts, and content pipeline.
- **Text** — [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/): free to share and adapt for non-commercial purposes, with attribution to Data Goblin / Alex Yesilcimen and a link back.
- **Data figures** (`app/public/art/figures/`) — CC BY-NC 4.0, same as the text. They are authored editorial work built from the manuscript and the Receipts Ledger.
- **Illustrations** — AI-generated; no copyright is asserted over the generated images (see the in-book "note on the illustrations and marks").
- **Third-party material** — quotations, data, and cited sources remain the property of their original owners and are used under fair dealing with attribution.
- **Commercial use** — ask first. The answer is often yes.
