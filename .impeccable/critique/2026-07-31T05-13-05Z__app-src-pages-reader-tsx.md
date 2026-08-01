---
target: Data Goblin web reader site-wide
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-07-31T05-13-05Z
slug: app-src-pages-reader-tsx
---
Method: dual-agent (A: design review sub-agent · B: detector/browser sub-agent)

# Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Page x/y, progress crystals, listen bar good; page turns invisible to assistive tech |
| 2 | Match System / Real World | 3 | Book metaphor superb; "Loot"/"Quest Items" cost first-timers a beat |
| 3 | User Control and Freedom | 3 | Resume/bookmarks/Esc; no jump-to-page within a chapter |
| 4 | Consistency and Standards | 3 | Token discipline exemplary; three next-page affordances in two styles; Quest Items leak raw **markdown** |
| 5 | Error Prevention | 4 | NaN/negative guards, storage try/catch, legacy migration, editable-target guards |
| 6 | Recognition Rather Than Recall | 2 | Nav is icon-only below 1880px viewport — 9 unlabelled icons at every real laptop size |
| 7 | Flexibility and Efficiency | 4 | Arrows/swipe/edge/bar/TOC/search/bookmarks/listen/dyslexic/two languages |
| 8 | Aesthetic and Minimalist Design | 3 | Page spare and beautiful; desktop right rail stacks 6 tools in one 280px column |
| 9 | Error Recovery | 2 | Errors are italic one-liners exposing raw internals, no retry |
| 10 | Help and Documentation | 3 | Start Here openers, self-explaining meters; glossary dual behaviour explained only inside the popover |
| **Total** | | **30/40** | **Good (75%)** |

# Design Specificity Verdict

**Authored, unmistakably.** Five-region map, folio-and-spine spread, balanced-fill packer that refuses stub pages and orphaned headings, a suspicion meter that prints its own formula, the FR "blue mode" marking the machine-translated edition. **The receipts apparatus reads as product**: the Verification Log publicly admits corrected confabulations ("#7 Mason v. Canada (2019) (likely confabulated) — FIXED"); inline ReceiptMarkers put status popovers on claims in the reading flow. One inversion: the headline stat "104 ledger entries · 0 still open" is 9px mono fine print at the page bottom.

**Deterministic scan: CLI CLEAN (exit 0, zero findings)** — only site in the family. Side-tab waiver verified active (4 real callout patterns suppressed by config, not absent); all three scaleX layout-transition fixes from adoption verified in place (ListenBar:59, ReaderChrome:97, GoblinToolCards:97). Browser overlay per route: landing 61, chapter 46–47, receipts 65, loot 50 — dominated by undersized-ui-text (36–58/route; e.g. 8.5px "Table of Contents" label vs 11px floor), chrome-level dark-glow/tiny-text. Overlay's side-tab and overused-font hits are config-waived (overlay doesn't read config). em-dash hits are in rendered manuscript content, out of app scope.

# Priority Issues

- **[P0] Desktop reader clips 800+px of every page's text at 1280×800 with no scroll.** FieldGuidePage.tsx spread grid has an implicit auto row: row sizes to content (1451px) so PagePanel's height:100% resolves against the row, not the 636px container — scroller believes it fits (scrollHeight==clientHeight) and DESIGN.md's overflow fallback never engages. Compounding: PANEL_BUDGET=1650 chars calibrated for wide columns; at 1280w the 268px column (~33 chars/line) over-packs ~2.3×. Fix: gridTemplateRows: "minmax(0, 1fr)" (restores scroll fallback), then add a width term to budgetsFor and re-run the pagination sanity gate. Command: /impeccable adapt + /impeccable harden
- **[P1] Primary nav icon-only for essentially every visitor** — TopNav.tsx:126 hides .dg-navlabel below 1880px; "Receipts", the headline concept, is invisible in the chrome. Fix: labels at ≥1280px and/or trim 9 top-level items. Command: /impeccable clarify
- **[P1] Pagination silent for SR users; closed MobileDrawer haunts the tree** — no aria-live anywhere; drawer stays mounted at x=−336 with role="dialog" aria-modal and ~40 tabbable buttons; no focus trap when open (tools sheet has one). Fix: visually-hidden polite live region "Page X of Y"; render drawer null when closed; reuse useFocusTrap. Command: /impeccable harden
- **[P2] Theme-pair discipline breaks ×3** — hard-coded white on accents that flip light in dark mode: LootPage.tsx:90 (2.4:1), SearchOverlay.tsx:109 (2.2:1), ContributionForm.tsx:206 (2.4:1). Fix: use the established c("#f4f0e0","#0d1018") pair as six sibling components do. Command: /impeccable harden
- **[P2] Trust surface undersells; Quest Items leak markdown** — promote the ledger tally to a stat under the Receipts H1; render or strip ** in quest text. Command: /impeccable clarify
- **[P3] fetchPriority React warning** on every landing render (LandingSections.tsx, MapPage.tsx) — should be fetchpriority.

# Persona Red Flags

- **Jordan:** strong hero, then nine unlabelled icons; on a 13" laptop the P0 makes page 1 appear to end mid-thought — indistinguishable from a broken site.
- **Sam (SR/keyboard):** ArrowRight works but announces nothing; Tab reaches 40 invisible off-screen drawer controls; duplicate "Previous page" names. Positives: aria-pressed bookmark, focus-trapped tools sheet, keyboard-operable receipt markers.
- **Casey (mobile commuter):** genuinely well served (swipe edge-guard, 44px targets, position saved); flags: ~146px silent below-fold content on some pages, 56px FAB over the page corner.
- **Renée (French reader):** blue-edition + MT banner honest and original; but hand-curated FR hero mistranslates ("demandes d'AI" for claims, "qui a compté ce qui"), title/hero disagree (puissance vs pouvoir), and **receipt markers no-op in FR — the apparatus itself is EN-only.**

# Theme-Pair Check

Holds across ~40 components incl. shadows/gradients. Three breaks listed in P2. AboutPage sparkles + shareCard are deliberate unpaired exemptions — worth a comment so the next audit doesn't re-flag.

# Minor Observations

- FR blue remap doesn't remap dark surfaces — the edition cue is weaker at night.
- Dyslexic font loads from Google Fonts at runtime; self-host like the other faces.
- Glossary search: no visible label, no clear affordance; letter rail vanishes while searching.
- Suspicion meter uses near-duplicate greens (#5a8a3a) instead of P.green.
- TOC could show per-chapter page counts (22-min read = 14 spreads is guesswork).
- hasAnySavedPosition() sending returning readers straight into the book is a lovely default.

# Questions to Consider

1. If the ledger is the product, why is it a page instead of the spine? An ambient "0 open flags" seal in the chapter chrome would make the apparatus ambient rather than visited.
2. Is the two-page spread earning its cost below 1600px? A single wider page at 1025–1500px might serve "readable over impressive" better.
3. What's the plan for FR to graduate out of blue? Receipts don't exist in French — bilingual parity is a stated principle and the product itself is EN-only today.
