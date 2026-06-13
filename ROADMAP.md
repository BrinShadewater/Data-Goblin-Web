# Data Goblin — Launch Roadmap (vetted)

> Distilled 2026-06-11 from two external "deep research" reports (ChatGPT), cross-checked
> against the actual codebase and the legal/verification audits. The external reports never
> reached the live site, so roughly a third of their findings described features that already
> exist and a third were stale. This file is the validated remainder. Read AGENTS.md first;
> its guardrails override anything here.

## Do NOT rebuild what exists

The reports flagged these as "missing/unverified" — they are all built and working:
in-app Search, Map page, Receipts page + per-chapter Show Receipts panels, computed
Suspicion Meter, Glossary (Loot), Goblin Notes, Bookmarks, reading-progress tracking,
dark mode, dyslexia-friendly type mode, swipe + arrow-key navigation, mobile drawer,
44px touch targets, favicon set, icon legend in the front matter. The appendix is already
a separate document from Chapter 19 in the web edition (that critique applies to a future
print edition only).

Also: do not "correct" factual figures based on the external reports. Every number in the
manuscript was verified against primary sources on 2026-06-11 (see
../Legal-Risk-Audit-2026-06-11.md addendum). The reports' summaries differ from the
verified record in places.

## P0 — Before/at launch

1. **Deployment + reachability.** Confirm datagoblin.ca is registered, deployed, on HTTPS,
   with one canonical host (apex vs www) and proper redirects. The external audits could not
   fetch the domain at all. (Alex has a Vercel account; a static deploy of `app/dist` is the
   obvious path. `vite.config.ts` BASE_URL must match the hosting path.)
2. **SEO/meta for a client-rendered SPA.** Currently `index.html` has title + description
   only. Add: Open Graph + Twitter card tags (use head-nav/canadian-icon art for the OG
   image), `robots.txt`, `sitemap.xml` (one URL per document 0–20 plus the five pages),
   canonical link tags, and JSON-LD (`Book` with chapters as `hasPart`, `Organization` for
   Shadewater Labs, `BreadcrumbList` on interior views). Skip `SearchAction`/sitelinks
   markup — Google retired that rich result in 2024. Since the app is a SPA, consider
   per-route static HTML stubs or prerendering for the chapter routes so crawlers see real
   titles per chapter (e.g. vite-plugin-prerender or a small build step emitting static
   shells). This is the single highest-value technical task in this file.
3. **Brand disambiguation.** "Data Goblins" (data-goblins.com, Kurt Buhler) is an
   established Power BI brand. Pair every title/meta/OG/H1 with the differentiator phrase:
   **"Data Goblin — a Canadian field guide to AI, power, and data."** Consistent pairing in
   `<title>`, hero copy, OG snippets, and any social handles (clean handles are taken;
   prefer e.g. `datagoblinbook`).
4. **Author TODO (not Codex's):** name the image-generation tools in the front-matter
   illustrations note (`<!-- TODO -->` in ../DataGoblin-Complete.md, line ~123).

## P1 — Shortly after launch

5. **"What changed since the book" changelog page.** The manuscript time-stamps itself
   (June 2026) and several claims are date-stamped ("as of June 2026"). A dated, public
   updates/corrections log is cheap, on-brand (receipts ethos), and solves the freshness
   problem. Could be a new markdown file parsed by the pipeline into a `/updates` route.
6. **First-visit entry experience.** Front matter is long (by design, but heavy as a landing
   experience). Options that preserve the content: default first-time visitors to a
   lightweight "Start here" interstitial or straight to Chapter 1 with the front matter one
   click away; or make the front-matter notes collapsible sections. Do not delete or
   compress the positionality/Indigenous-frameworks/illustrations notes — they are legal
   and ethical commitments (see AGENTS.md).
7. **Accessibility formal pass.** The app has real a11y work already (aria labels, focus
   handling, dyslexia mode, touch targets); run an actual WCAG 2.2 AA check on the reader,
   drawer, search overlay, and receipts page, and fix what surfaces. Verify colour contrast
   in BOTH themes, especially the small mono labels.

## P2 — When capacity allows

8. **Claim-level receipts in the reading flow.** Best idea in the external reports:
   unobtrusive inline receipt markers beside load-bearing claims, expanding to the source +
   its bias category. Chapter-level plumbing exists (sources[], links.json, autolinker in
   `src/links.ts`); this extends it to claim level. Significant pipeline + manuscript markup
   work — design the marker syntax with Alex before building.
9. **Topic landing pages / shareable summaries.** HTML pages per theme (sovereignty, data
   centres, copyright, labour, environment, deepfakes) built from each chapter's "Start
   here" text — these exist in the JSON already (`startHere` field). Good SEO surface
   without writing new content.
10. **Newsletter/updates funnel.** If/when email capture is added: CASL compliance is
    mandatory (express opt-in, no pre-checked boxes, sender identification, unsubscribe in
    every email, keep consent records). Needs a privacy policy page at the same time.
11. **Print/ebook edition prep** (commercial step — triggers the audit's "LAWYER" items:
    CIPO/USPTO trademark search, ITK quote permission, KDP AI-image disclosure, CC licence
    decision for text vs AI art).

## Explicitly rejected from the external reports

- "If you only remember one thing" recurring box — the book already has Chapter Recaps and
  Quest Items; a third recurring device tips signature style into formula.
- Stack rebuild / static-site-generator migration — the Vite+React app works, is fast, and
  carries a lot of custom reader behaviour. Prerender for SEO instead.
- Their KPI tables / 8-week gantt — generic; sequence above instead.
- Their factual summaries of *AI for All* — superseded by the verified manuscript record.
