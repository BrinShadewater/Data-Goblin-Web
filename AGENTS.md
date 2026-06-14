# Data Goblin — Site Repo Agent Guide

> This repo is the interactive web edition of the book. **Read ../AGENTS.md (project root,
> one level up) first** — it covers the manuscript, the content rules, and the legal
> guardrails. This file covers the app itself.
> Repo: github.com/BrinShadewater/Data-Goblin-Web · Last updated 2026-06-11.
> Launch priorities live in ROADMAP.md (vetted — don't re-import ideas from external
> audit reports without checking it; several of their findings were stale or already built).

## Layout

```
site/
  pipeline/build_content.py   <- manuscript markdown -> content JSON. Single source of truth
                                 is ../DataGoblin-Complete.md — NEVER hand-edit chapter JSON.
  content/                    <- generated JSON (committed on purpose; receipts are the point)
    art-map.json              <- HAND-EDITABLE. The one content file humans edit. See below.
  update-content.bat          <- run after ANY manuscript/ledger/glossary/trap edit
  commit-and-push.bat "msg"   <- add -A, commit, push (prompts for message if no arg)
  app/                        <- Vite + React 18 + TypeScript, plain inline styles (no Tailwind)
    public/content/           <- deploy copy of content/ (written by update-content.bat)
    public/art/               <- WebP art: icons/ (38), panels/ (27), medium/ (18), small/ (120)
    src/pagination.ts         <- book pagination engine (pure logic, no React)
    src/components/           <- TopNav, LeftSidebar (TOC), PagePanel (page renderer),
                                 RightSidebar (goblin tools), BottomBar, Markdown (callout
                                 detection), SearchOverlay, MobileDrawer, GoblinMascot (+NavIcon)
    src/pages/                <- FieldGuidePage (the reader), Map, Loot (glossary),
                                 Receipts, About, Contribute
    scripts/sanity-pagination.cjs  <- pagination invariant tests (run after pagination changes)
```

## How the reader works (the parts you'll touch)

- **Documents 0–21:** 0 = front matter, 1–20 = chapters, 21 = source appendix. All share one
  chapter JSON schema so the pagination engine treats them identically.
- **Pagination** (`src/pagination.ts`): flattens a chapter into blocks (heading / md / trap /
  bias / panel), packs them into page panels using a character-cost heuristic with balanced
  fill. Desktop = two-panel spreads; phone/tablet = single pages. Reading position persists
  per chapter in localStorage (`goblin-panel-ch{n}`).
- **art-map.json is the art control surface.** Per document: `opener` (chapter-title art),
  `accents` (small ornaments cycling beside section headings, cost charged in the packer),
  `panels` (near-full-page plates appended as the document's final pages, one page each,
  with optional `caption` — most plates have painted-in titles, so caption is usually null).
  Swapping art = edit this file + run update-content.bat. No code changes.
  Respect the `RESERVED` note on indigenous-data-panel (see root AGENTS.md, guardrail #4).
- **Markdown.tsx** detects manuscript blockquote markers (`🧌 GOBLIN CHECK`, `CHAPTER RECAP`)
  and renders callout cards; it also resolves `art/...` image paths through `artUrl()` —
  that's how the front-matter icon legend renders. The hand-drawn icons render via
  `NavIcon name="..."` (maps to `public/art/icons/{name}.webp`).
- **Icons in use:** head-nav = header logo + favicon set; search-nav = search boxes;
  book-nav = progress bar; check/alert/chapter-recap = callouts; key-takeaways, insight,
  note, journal = sidebar tool cards; trailmarker = Start Here; guidebook/map/chest/data/
  contact/community = nav links; crystal = Loot page; canadian-icon = TOC footer badge.
- **Suspicion Meter** (RightSidebar) is computed, not vibes: open VERIFY flags + corporate
  share of chapter sources (`src/sources.ts`). Currently all flags are 0 — keep it that way
  or flag honestly.

## Commands & environment gotchas (Windows, PowerShell)

- **This machine has `NODE_ENV=production` set globally.** Plain `npm install` will skip
  devDependencies and silently break the build. Always:
  `$env:NODE_ENV='development'; npm install --include=dev`
- Build: `$env:NODE_ENV='development'; npm run build` (tsc -b && vite build). tsc has
  `noUnusedLocals` — remove unused imports or the build fails.
- The rollup native binary (`@rollup/rollup-win32-x64-msvc`) is pinned in
  optionalDependencies — a known npm bug deletes it on some installs; if vite errors with
  "Cannot find module @rollup/rollup-win32-x64-msvc", reinstall it.
- Pagination tests: recompile first if pagination.ts changed —
  `node node_modules/typescript/bin/tsc src/pagination.ts --outDir scripts/.build --module commonjs --target es2020 --skipLibCheck`
  then rename the output .js to .cjs, then `node scripts/sanity-pagination.cjs`.
  All checks must pass (no block loss, no stub last page, no panel >2x budget).
- New raw art goes in ../assets/* (PNG), then run `python ../assets/convert-new-art.py`
  to emit WebP into app/public/art/. Pillow is installed.
- The art-map note about asset sizes is authoritative: icons 128px q90, panels 1200px q82,
  medium 880px, small 176px, alpha preserved.

## Definition of done for any change

1. `update-content.bat` runs clean (counts match root AGENTS.md, verify flags 0 unless
   you deliberately flagged something new).
2. sanity-pagination passes.
3. `npm run build` exits 0.
4. Nothing from ../Sources/ entered the repo; art-map references all resolve to real files.
5. Leave committing/pushing to Alex unless he says otherwise.
