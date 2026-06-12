# Refactor Baseline

This file captures the current behavior that refactor passes must preserve.
Refactors should change structure, naming, ownership, or duplication only; any
reader-facing behavior change belongs in a separate feature task.

## App Shape

- The app is a Vite, React 18, TypeScript single page app using hash routes.
- The landing page is served at `#/`.
- The reader is served at `#/guide` and `#/chapter/:num`.
- Secondary pages are served at `#/map`, `#/loot`, `#/receipts`, `#/about`,
  `#/contribute`, and `#/privacy`.
- Route-level lazy loading is used for secondary pages and search.
- `FieldGuidePage` remains in the main bundle because it is the primary product
  surface.

## Content Contract

- `../DataGoblin-Complete.md` is the source of truth for manuscript text.
- `site/content/*.json` and `site/content/chapters/*.json` are generated.
- `site/app/public/content/*` is the deploy copy of generated content.
- Do not hand-edit generated chapter JSON.
- `content/art-map.json` is the human-editable art control surface.
- The content pipeline should report zero VERIFY flags unless a new flag is
  intentional and documented.

## Reader Behavior

- Document numbers are stable:
  - `0` is Front Matter.
  - `1` through `19` are book chapters.
  - `20` is the Source Library Appendix.
- Desktop uses two-panel spreads.
- Phone and tablet use single-panel paging.
- ArrowLeft and ArrowRight turn pages unless focus is inside a form field.
- Phone and tablet support horizontal swipe page turns without hijacking
  vertical scrolling.
- Reading position persists per document in localStorage.
- The default reader entry resumes the last-read document when available.
- Previous/next navigation crosses document boundaries at the beginning and end.
- The bottom progress dots show chapter progress and the current chapter.

## Tools And Persistence

- Goblin Notes are stored locally and are private to the device.
- The notes copy button copies the current note text.
- Bookmarks are stored locally and can be toggled from the visible page.
- The bookmark control is visually red.
- Cookie choices are stored locally and affect the cookie notice state.
- Theme and reading settings persist locally.
- Search appears after at least two typed characters.

## Visual Contract

- The header logo/title links to the landing page.
- Header icons are intentionally larger than the original mockup.
- The landing page includes animated crystal-like particles.
- Particles are blue in light mode and green in dark mode.
- Reduced-motion users should not get particle animation.
- The map page shows the large Canada map/goblin art centered under the title.
- Callout and tool icons use the hand-drawn WebP assets in `public/art/icons`.
- Goblin Check icons are larger than ordinary inline icons.

## Refactor Rule

Each pass should name:

1. The current behavior being preserved.
2. The structural improvement being made.
3. The validation check proving behavior stayed stable.
