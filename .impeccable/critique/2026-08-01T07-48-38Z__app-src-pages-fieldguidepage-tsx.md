---
target: Data Goblin web reader site-wide
total_score: 29
max_score: 40
p0_count: 1
p1_count: 3
timestamp: 2026-08-01T07-48-38Z
slug: app-src-pages-fieldguidepage-tsx
---
Method: dual-agent (A: design review sub-agent · B: detector/browser sub-agent), both isolated, run in parallel. Not degraded.

# Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Position, folios, progress rail and a polite live region all present; a restored session drops you mid-book with no acknowledgement |
| 2 | Match System / Real World | 4 | Field-guide metaphor runs into the mechanics (folios, spine, Trailhead/Stormbelt/Hoard Vault); only gap is that it is monolingual |
| 3 | User Control and Freedom | 2 | Toggling type mode re-paginates and strands the reader at different text, no undo |
| 4 | Consistency and Standards | 3 | Token discipline real; reading measure swings 48→85→58→82 cpl across desktop; `<main>` on static pages but not the reader |
| 5 | Error Prevention | 3 | Pagination honest — 12 pages swept at 1280×800, zero clipped panels; but bookmarks store a raw panel index and silently rot |
| 6 | Recognition Rather Than Recall | 3 | Chapter names on turn buttons, bookmark snippets; but a bookmark's snippet and the page it opens can disagree |
| 7 | Flexibility and Efficiency | 3 | Arrows, swipe, edge nav, TOC, search, listen, dyslexia mode, persisted position; no skip link, ~38 chrome tab stops before prose |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained landing, hard 2px corners; three same-destination CTAs to /guide under three labels |
| 9 | Error Recovery | 2 | `FieldGuidePage.tsx:302` prints the raw error string, no retry, no route out |
| 10 | Help and Documentation | 3 | Best-in-class in-context help; but the Suspicion Meter formula is `title=`-only |
| **Total** | | **29/40** | **Good (72.5%)** |

Previous run 2026-07-30: 30/40. The drop is not a regression — every P0/P1 from that run is fixed and verified fixed here. A deeper structural issue surfaced once the surface defects were gone.

# Design Specificity Verdict

**Grounded in this product, not portable.** Content is *measured into pages*, so a page number is an ordinal rather than an address — a fact that cannot exist in a scrolling product and which generates the P0 below. The receipt marker renders a self-reported correction with live sources inline ("Corrected — Wrong date + missing appeal… OpenAI has appealed", with CBC/Carters/Sookman links). The Suspicion Meter publishes its own formula. The spread/single/compact split, `SPREAD_MIN_VW`, `SINGLE_MAX_PX` and `regionLabels.ts` are all specific to this book.

**Deterministic scan: CLI CLEAN** (exit 0, `[]`). Verified the detector actually fires by injecting a `transition: width` probe — caught as `layout-transition`, exit 2 — then deleting it. The `side-tab` waiver is **still active and still needed**: with the project config out of scope the same tree yields 10 real `side-tab` matches (the book's coloured left-rule callouts), so it suppresses real matches rather than being dead config.

Browser overlay per route at 1280×800 (injection succeeded): landing 26, guide/chapter 60, receipts 34, loot 24 — dominated by `undersized-ui-text` (9–45/route). Dark mode: **zero contrast failures across 43 combinations**. No horizontal overflow on any route × viewport × theme. Zero console errors or warnings; all network 200/304.

# Priority Issues

- **[P0] Reading position is an ordinal, not an anchor — it silently corrupts bookmarks.** `readerHooks.ts:84-91` stores position as a raw `panelIdx`; `readerHooks.ts:176` saves `panelIndex: aligned` alongside a `snippet`. Reproduced twice, independently: at 1280×800 on ch9 page 23 of 59, toggling dyslexia-friendly type re-paginates to 69 pages while `panelIndex` stays 22 — the prose moves from *"The federal government has… formally adopted OCAP"* to *"The FNIGC OCAP Principles…"*. A saved bookmark therefore advertises one passage in its snippet and delivers another. Same applies across any width change (ch9 paginates to 28/35/36/53/59/69 depending on viewport and type mode). This breaks a shipped, advertised feature in three clicks for anyone who reads on two devices or touches the type toggle. **Fix:** give each manuscript block a stable id in the pipeline; capture the first block id before re-pagination and restore to the page containing it; store `blockId` in bookmarks and resolve `panelIndex` at read time, keeping the integer as a fallback for existing records. Makes bookmarks device-portable for free.
- **[P1] The reading measure is unstable across desktop, and mostly too wide.** Measured cpl at identical type: 1025→48, 1280→79-82, 1440→**85**, 1600→58, 2200→82, 390→45. `DESIGN.md` names ~65 as the target. Crossing `SPREAD_MIN_VW` drops 85→58 in one pixel of resize, and 1440 — the commonest laptop width — is the worst measure in the system. Cause is structural: fixed 260+280px sidebars squeeze the low end while `SINGLE_MAX_PX`=720 lets the high end run wide, with type size never compensating. **Fix:** make measure the invariant — drive body size from the measured column, or cap `SINGLE_MAX_PX` nearer 600 and let sidebars absorb the surplus.
- **[P1] The reader is the one surface with no `<main>`, no skip link, and no heading.** `StaticPage.tsx:16` is the only `<main>` in the app; `/guide` and `/chapter/*` have none. No skip link anywhere. Interior reader pages have **zero** h1–h4 — only the chapter opener carries an `h1`, so 30 of chapter 2's 31 pages are headingless (independently confirmed: `querySelectorAll('h1,h2').length === 0` mid-chapter). First in-page control is tab stop **39 of 87**; 45 of those 87 are two redundant copies of the chapter list (22 TOC + 23 progress dots).
- **[P1] The evidence layer is mouse-only, or 50 tab stops away.** The receipt popover portals to `body`, so its trigger is focus index 37 while the source link inside its own popover is index 87 — reachable, but not findably. The Suspicion Meter's formula lives entirely in a `title=` attribute on a non-focusable element whose visible copy reads *"Hover for the formula"* — unreachable on touch and by keyboard. The meter's honesty is the point; the proof is the hidden part.
- **[P2] French edition: a broken sentence at the trust moment, plus untranslated chrome.** `/fr/chapter/9` renders `…dans ses 12 sources d'énergie (8Pourcentage. Plongez pour la formule.` — unclosed paren, "Pourcentage" spliced mid-number, and *Plongez* ("dive in") mistranslating "hover" (*survolez*). Cause: `GoblinToolCards.tsx:104` translates six sentence fragments around interpolated values. Also `LA MÉTÉO · CHAPTER 9 · 33 MIN READ` (`PageHeadings.tsx:86-87` hard-codes three strings without `tr()`), and `Page 1 des 36` should be `sur`. Separately, `regionLabels.ts` maps EN region names to the book's evocative set (The Land→The First Clearing); FR ships raw strings that pass unmapped, so Renée gets *La Terre / La Météo* where EN readers get *The First Clearing / The Stormbelt* — the French reader is reading a blander book.
- **[P2] Light-mode contrast failure, found independently by both assessments.** `Low Suspicion (8%)` at **4.02:1** (`rgb(90,138,58)` on `rgb(255,253,246)`, 12.5px) — `GoblinToolCards.tsx:85`. The dark half of the pair (`#74b85e`) passes. One further marginal case at 390px: glossary chip "Alignment" at 4.45:1.

# Persona Red Flags

- **Jordan (13" laptop):** 1440×900 gives the worst measure in the product (85 cpl). Three CTAs to `/guide` under three different labels, plus "Begin with Chapter 1" — four controls, two behaviours. The `104 · 0 · 21` numbers that sell the premise live one click away on `/receipts`.
- **Sam (SR/keyboard):** no `<main>`, no skip link, no heading on 30 of 31 pages, 38 chrome tab stops before prose. Quest Items are `<button>`s with no `role="checkbox"`/`aria-checked`, so done-state is visual only. Dark-mode toggle is the one header control missing `aria-pressed`. **Positive:** the polite live region announcing page turns is a thoughtful fix most readers miss.
- **Casey (mobile):** the strongest surface — 45 cpl, no clipping, no horizontal scroll, focus-trapped tools sheet. But the Suspicion Meter formula is hover-only and therefore permanently unreachable, and position won't survive moving between phone and desktop.
- **Renée (French):** the broken sentence sits inside the trust widget. Mixed-language kicker above every chapter title. The region naming — the field-guide voice `CLAUDE.md` explicitly protects — never reaches her. **Positives:** the machine-translation disclosure is honest and persistent, and receipt markers plus their status labels (`Vérifié`/`Corrigé`) render correctly in FR.

# Theme-Pair Check

Holds. Dark mode: 43 combinations, **zero failures**. Light mode: one real failure (4.02:1, above) and one marginal (4.45:1). For a six-face, four-accent system on a parchment stack this validates the `c(light, dark)` pairing rule in DESIGN.md.

# Minor Observations

- `inlineEmphasis` (`GoblinToolCards.tsx:118-122`) handles `**bold**` only, so single-asterisk emphasis prints literally in Quest Items: *"wired into loops that \*act\* through tools"*.
- Smallest live text is 8px ("Page 1 of 35", reader footer) and 8.5px ("Share", "Chs. 1, 2", the logo tagline).
- Sub-44px touch targets on 390×844: 58 on the reader, incl. 52 TOC rows at 259×33; also present at 1280 (59), so not mobile-only.
- `/guide` resumes mid-book with no acknowledgement — a one-line "Resuming Chapter 9" turns a confusing jump into a delightful one.
- Three names for one page: nav "Loot", aria-label and h1 "Loot (Glossary)", title "Glossary".
- The More overflow menu appears unreachable in EN at any desktop width — nine icons always fit above 1024. Headroom, not a bug, but it means the path ships untested by real use.
- All images have alt or aria-hidden on every route (0 missing). Focus-visible rules resolve correctly (2px outline, themed).

# Questions to Consider

1. If a page number is not a stable address, why is it the primary way the reader knows where they are? Every position affordance — folio, "Page 9 of 28", bookmark, progress rail — is denominated in a unit that changes meaning when the reader changes their type size. Naming a stable unit (section-and-paragraph? percentage?) fixes the P0 and bookmark portability in one move.
2. The reader shows one page of prose surrounded by 87 controls, 45 of which are two copies of the same chapter list. Is a chrome-light reading mode the missing default rather than a missing feature?
3. The Suspicion Meter is the thesis rendered as a widget, and its formula is in a `title` attribute. Which layer is the product — the claim, or the ability to check it — and does the interface currently rank them that way?
