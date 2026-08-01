# Product

<!-- impeccable:product-schema 1 -->

> Provenance: drafted 2026-07-29 from repository evidence (AGENTS.md, CLAUDE.md,
> app/src/theme.ts, WORK-LOG.md) during impeccable rollout. Extracted, not interviewed —
> items marked *(inferred)* await confirmation.

## Platform

web

## Users

Primary: readers of the Data Goblin book — people who want to understand what happens to
their data and can check the working. The reader is built for sustained reading, not
skimming: paginated, themed light and dark, with a dyslexia-friendly type mode.

Secondary: readers who arrive to verify a specific claim via the Receipts Ledger, the
Glossary, or the Map. *(inferred from the page set)*

Tertiary: French-language readers — the site ships a full FR content edition plus a
hand-curated FR UI dictionary.

## Product Purpose

The web edition of Data Goblin: a book-length, claim-by-claim field guide to the data
economy, published as a reader with its own sourcing apparatus. Success is a reader
finishing a chapter and being able to trace any claim in it back to a source.

## Positioning

**Every claim carries a receipt.** The Receipts Ledger, the per-chapter bias labels, the
`VERIFY` flag mechanism that publicly counts unverified claims, and the date-stamped
legal hedging are the product — not decoration on top of it. A neighbouring explainer
site can copy the prose; it cannot copy an auditable claim ledger.

## Operating Context

- Vite + React + TypeScript. Deployed via Vercel. Nested repo: `site/` inside the
  manuscript repo `Project Goblin`.
- **Content pipeline is the only route for book text**: edit `DataGoblin-Complete.md`,
  then `update-content.bat`. Chapter JSON is generated and must never be hand-edited.
  The one hand-editable surface is `content/art-map.json`.
- Six skills cover this project (`data-goblin-manuscript-check` gates deploys;
  `deploy-web-edition` owns shipping; plus figures, receipts, i18n, voice).
- `WORK-LOG.md` is the cross-agent handoff trail — read before starting, append after.
- **Corrected 2026-08-01: the bundle build runs locally now.** This said it could not
  (rolldown shipping no win32 binding). `npm run build` exits 0 in ~800ms, and
  `node scripts/verify.cjs` runs the whole chain green — content sync, pagination, claim
  anchors, FR corrections, mailto, build, image audit, budgets, built-site smoke, browser
  smoke. Browser smoke needs `npx playwright install chromium` once. Typecheck remains
  `node node_modules/typescript/bin/tsc --noEmit -p .` from `app/`. Do not measure bundle
  size from a `NODE_ENV=development` build — dev React is roughly double.

## Capabilities and Constraints

- Paginated reader with light/dark themes, a dyslexia-friendly reading mode, listen
  mode (audio with a progress bar), bookmarks, search, glossary linking, and figures
  in four variants (light/dark × EN/FR).
- EN and FR content editions; FR UI strings are hand-curated in `ui-fr.ts`.
- **Hard prohibitions** (full rationale in `AGENTS.md`):
  - `Sources/` never ships — no file, no link, no reference. It holds full-text article
    copies that cannot be redistributed. Cite live URLs instead.
  - `assets/large-assets/indigenous-data-panel.png` is RESERVED — never used or shipped.
  - Never ship an unverifiable factual claim silently; add a `<!-- VERIFY -->` flag,
    which the pipeline counts and the site displays.
  - Never weaken the legal hedging: active litigation stays "alleged", absence claims
    stay date-stamped, OCAP® keeps its mark on first use per chapter, motive claims
    stay unresolved.
- Committing and pushing are Alex's call in this repo unless he says otherwise.

## Brand Commitments

- Voice: clear, direct, slightly witty, Canadian, accessible, structurally analytical.
  Recurring devices — "Start here" openers, Goblin Check callouts, Goblin Traps,
  Chapter Recap boxes, per-chapter bias labels, the Receipts Ledger. Never corporate,
  academic, or bland. Canadian spelling and CAD throughout.
- The warm-parchment / goblin-green / charcoal-ink identity, with a deep navy-charcoal
  dark mode.

## Evidence on Hand

- The Receipts Ledger — real, claim-by-claim, with a public open-flag count.
- `Legal-Risk-Audit-2026-06-11.md` lists sentences deliberately softened; read before
  editing claims.
- Real figures in four variants, wired through `art-map.json`.
- VERIFY flags stood at 0 as of the 2026-06-11 audit — verify via `update-content.bat`.

## Product Principles

1. **Receipts or a flag.** No claim ships unverified and unmarked.
2. The manuscript is the single source of truth; the site is a rendering of it.
3. Readable over impressive — pagination, dyslexia mode, and contrast are features.
4. Hedging is accuracy, not timidity. Never sand it off for punchiness.
5. Bilingual parity: FR is a real edition, not a translation afterthought.
