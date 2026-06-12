# Visual Parity Checklist

Use this checklist before and after structural refactors that touch layout,
responsive behavior, art, routing, persistence, or pagination.

## Viewports

- Mobile: 390 x 844
- Tablet: 768 x 1024
- Desktop: 1440 x 900
- Wide desktop: 1920 x 1080

## Routes

- `http://127.0.0.1:5173/#/`
- `http://127.0.0.1:5173/#/guide`
- `http://127.0.0.1:5173/#/chapter/0`
- `http://127.0.0.1:5173/#/chapter/1`
- `http://127.0.0.1:5173/#/chapter/12`
- `http://127.0.0.1:5173/#/map`
- `http://127.0.0.1:5173/#/loot`
- `http://127.0.0.1:5173/#/receipts`
- `http://127.0.0.1:5173/#/privacy`

## Checks

- Header logo, title, and subtitle fit without clipping.
- Header logo and title navigate to the landing page.
- Header navigation icons are readable and aligned.
- Search opens only after two or more characters.
- Mobile drawer opens, closes, and highlights the active route.
- Desktop reader shows left TOC, two-page spread, right tools, and bottom bar.
- Mobile/tablet reader shows one page and the compact bottom controls.
- Arrow-key navigation works outside form fields.
- Mobile/tablet swipe turns pages while vertical scroll remains usable.
- Bookmarks can be toggled and appear in the tools panel.
- Goblin Notes save locally and the copy button works.
- Suspicion Meter, Quest Items, Goblin Notes, and Your Progress labels are bold.
- Progress dots use the dark table-of-contents blue and active-dot glow.
- Landing particles drift slowly, react to mouse proximity, and do not animate
  under reduced-motion settings.
- Map art is centered, transparent, and not oversized.
- Front Matter, callouts, icon legend, and Goblin Check cards keep their icon
  sizing.
- Dark mode and light mode both remain legible.

## Commands

Run these after each behavior-preserving refactor pass:

```powershell
cd C:\Users\Alex\Desktop\Project Goblin\site
.\update-content.bat
cd app
$env:NODE_ENV='development'
npm run build
```

Run the pagination sanity check after editing `app/src/pagination.ts`.
See `site/AGENTS.md` for the compile step needed before
`scripts/sanity-pagination.cjs`.
