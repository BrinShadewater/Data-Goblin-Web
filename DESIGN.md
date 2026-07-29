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
