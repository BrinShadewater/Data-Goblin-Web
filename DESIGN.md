---
name: Data Goblin Web Edition
description: Field-guide reader — warm parchment and goblin green by day, navy-charcoal ink by night
colors:
  parchment-app: "#d8d2c4"
  parchment-page: "#faf8f0"
  parchment-card: "#fffdf6"
  night-app: "#080c12"
  night-page: "#161a24"
  night-card: "#141720"
  ink: "#23211a"
  ink-night: "#c8c2b0"
  goblin-green: "#2d5a27"
  goblin-green-night: "#74b85e"
  navy: "#1a2e4a"
  navy-night: "#7ab4e8"
  flag-red: "#a8321f"
  caution-amber: "#9a6510"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
  body:
    fontFamily: "Source Serif 4, Georgia, serif"
  body-dyslexic:
    fontFamily: "Atkinson Hyperlegible, Verdana, sans-serif"
  mono:
    fontFamily: "JetBrains Mono, Courier New, monospace"
  ui:
    fontFamily: "Inter, sans-serif"
  hand:
    fontFamily: "Caveat, cursive"
rounded:
  sm: "2px"
---

# Data Goblin Web Edition — Design System

> Recorded 2026-07-29 in scan mode from `app/src/theme.ts` and components, during
> impeccable rollout. Tokens extracted from shipped code. The Creative North Star is
> **provisional (inferred)** — confirm or rename it.

## Overview

**Creative North Star (provisional): The Field Guide.** `theme.ts` names it in its own
first line — "Data Goblin field guide." A well-made naturalist's handbook: warm paper,
ink you can read for an hour, marginal annotations in a human hand, a green for the
subject and a navy for the measurements. Dark mode is the same book read at night.

Everything serves sustained reading. A flourish that costs legibility is a regression.

## Colors

`app/src/theme.ts` is the single source of truth. Every colour is a **light/dark pair**
in `P`, consumed through ThemeContext's `c(light, dark)` helper. Never hard-code a
colour, and never add a light value without its dark partner.

- **Surfaces** step app → panel → page → card (parchment `#d8d2c4`→`#fffdf6`; night
  `#080c12`→`#141720`).
- **Ink** has three weights (`ink`, `body`, `muted`/`faint`) plus `titleInk` at full
  contrast for chapter openers.
- **Goblin green** is the subject accent; **navy** carries progress and measurement;
  **red** flags; **amber** cautions. Each has `Bg` and `Border` companions.
- `TOKENS.color` holds the progress/crystal ramp used by the reading-progress chrome.

## Typography

Six faces, each with a job — do not repurpose them:

- **Playfair Display** — display and chapter openers.
- **Source Serif 4** — body. The reading face.
- **Atkinson Hyperlegible** — body in dyslexia-friendly mode, which also disables
  italics. Any new body-level styling must respect `italicsOff`.
- **JetBrains Mono** — data, measurements, labels.
- **Inter** — UI chrome only. *(Note: impeccable flags Inter as an overused face. It is
  chrome here, never body, so it does not carry the book's voice — but if the UI is ever
  redesigned, this is a free axis worth reconsidering.)*
- **Caveat** — the hand. Annotations only; it is the marginalia voice.

The reader type scale (`TypeScale`) varies by viewport mode **and** reading mode. Size
changes go through the scale, never as one-off font sizes in components.

## Layout

Paginated reader — content is measured into pages, so layout changes can cause block
loss or stub pages. `sanity-pagination` is a real gate: no block loss, no stub last
page, no panel over twice budget. If pagination logic changes, recompile before testing.

**THE MEASURE IS THE INVARIANT.** The text column is held at ~494px — about 65
characters a line — at *every* desktop width from 1025px to 2560px. The window grows;
the line does not. Three constants in `reader.tsx` enforce it, and they only make sense
together:

| Constant | Value | Job |
|---|---|---|
| `SINGLE_MAX_PX` | 560 | caps the single page so a wide window cannot stretch the line |
| `SPREAD_MAX_PX` | 1120 | caps the spread, which is two of those columns |
| `SPREAD_MIN_VW` | 1720 | the spread waits until *half* a well is still a full measure |
| `SIDEBAR_NARROW_VW` | 1200 | below this the sidebars shrink 260/280 → 196/208 so chrome yields to prose |

Before 2026-08-01 the same chapter rendered at **48 / 83 / 87 / 58 / 85** characters a
line across that range — the least stable thing in the layout was the one thing a
reading product most needs to hold steady, and 1440px, the commonest laptop width, was
the worst of them. It is flat now.

Two consequences worth knowing. **The width-scale budget is 1.0 across all of desktop**,
because the column no longer changes — so `sanity-pagination` tests the `MIN_WIDTH_SCALE`
floor instead of a "narrow desktop" case that no longer exists. And **`readerChrome()` in
`reader.tsx` must stay in step with the grid in `FieldGuidePage`** — it models the same
sidebar widths so the character budget sizes for the column actually rendered.

**The two-page spread is a wide-desktop treatment, not the desktop treatment.** Below
`SPREAD_MIN_VW` the reader shows **one wide page** in the same desktop chrome and turns
one page at a time. The spread splits the well in half however narrow the window gets, so
at 1280px it used to give two ~275px columns — about 33 characters a line. One wide page
beat it on *both* axes (31 pages vs 35, 616px column vs 275px), because per-page vertical
space is identical either way. Changed 2026-07-31, threshold raised 2026-08-01.

**Reading position anchors on content, never on a page index.** A panel index is an
ordinal: the same chapter paginates to 16 / 31 / 57 / 72 panels depending on width and
reading mode. Position and bookmarks store a **character offset** into the chapter
(`anchorForPanel` / `panelForAnchor`), resolved back to whichever panel holds it after a
repack. Do not replace this with a hash of the block that starts a page — that was tried
twice, whole-text and prefix, and both break because `splitRecap` splits long prose at
different points for different budgets. Offsets survive because repagination regroups the
same characters, which `sanity-pagination` already asserts.

Three separate ideas, easy to conflate — keep them apart:

- `compact` — phone/tablet chrome (no sidebars, swipe, tools sheet)
- `spread` — the two-page book, wide desktop only
- a narrow desktop is **neither**: full desktop chrome, single page

**The page budget is an area: lines × characters-per-line.** `heightScale` carries the
first term and `widthScale` the second, both in `reader.tsx`. A width-blind budget
over-packs narrow columns — that is what silently clipped 800+px off every page before
2026-07-31. `textColumnWidth()` must track `FieldGuidePage`'s `maxWidth` caps (1400px
spread, `SINGLE_MAX_PX` = 720px single) or the budget sizes for a column that is not
rendered. Change them together.

The tightest desktop budget is the **narrowest spread** (1500px, ~386px column), not the
narrowest desktop — everything below 1500px gets a *wider* column, not a narrower one.
That is the case `sanity-pagination` pins as `desktop@1500-spread`.

## Shapes

`RADIUS = "2px"` throughout. This is a deliberately hard-edged, printed-page feel. Do
not round things to look friendlier.

## Motion

Progress indicators (reader chrome, listen bar, suspicion meter) animate with
`transform: scaleX()` from a `left` origin inside an `overflow: hidden` track. They
previously animated `width`, which thrashes layout on every tick — the listen bar
updates continuously during playback. Changed 2026-07-29. **Do not reintroduce
width/height/padding/margin animation.**

## Components

- **Callouts** — Goblin Check, Goblin Trap, Chapter Recap, Trailmarker — carry a 3–4px
  coloured left rule. This is the book's editorial vocabulary and a documentation
  convention, waived from the `side-tab` detector rule in `.impeccable/config.json`.
  It is *earned* here by the reading context; do not export the treatment to cards.
- **Figures** ship in four variants (light/dark × EN/FR) and are wired through
  `content/art-map.json` — the one hand-editable content surface.
- **Icon sizes are tokenised** in `TOKENS.icon`, per usage. Use the token, not a number.

## Do's and Don'ts

- **Do** add every colour as a light/dark pair in `P`.
- **Do** route type changes through `TypeScale`, respecting dyslexic mode.
- **Do** run the typecheck gate locally; the bundle build only works on Vercel.
- **Do** re-run `sanity-pagination` after anything that affects measured content.
- **Don't** hand-edit chapter JSON — the manuscript is the source of truth.
- **Don't** let anything from `Sources/` enter this repo, in any form.
- **Don't** use or restore `indigenous-data-panel` — it is RESERVED.
- **Don't** animate layout properties.
- **Don't** trade legibility for style. This is a book first.
