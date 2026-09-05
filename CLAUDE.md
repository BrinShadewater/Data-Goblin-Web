# Claude Context: Data Goblin site repo

`AGENTS.md` in this folder is the full app guide and the source of truth for architecture,
layout, and commands. `../CLAUDE.md` and `../AGENTS.md` cover the manuscript, the content
rules, and the legal guardrails, and they take precedence on anything book-related.

Read `../AGENTS.md` first, then this file's parent `../CLAUDE.md`, then `AGENTS.md` here.
Launch priorities live in `ROADMAP.md`; it is vetted, so do not re-import findings from
external audit reports without checking against it.

## Stack: React 19, react-router 8

Upgraded 2026-07-31 from React 18.3 / `react-router-dom` 7.18.1.

- **There is no `react-router-dom` any more.** v8 folds it into `react-router`; import
  `BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`, `useLocation`, `useNavigate`,
  `useParams` from `react-router` directly. `i18nNav.tsx` wraps `Link`/`NavLink`/`useNavigate`
  for the FR prefix — keep importing from there, not the router, for anything internal.
- **Why the upgrade happened:** Dependabot #20 (high, RSC Mode CSRF) is patched only in
  `react-router` 8.3.0, which peer-requires React ≥19.2.7. So the router fix and the React
  upgrade are one change, not two. `npm audit` is now clean.
- **`fetchPriority` works natively.** React 18's runtime silently dropped the camelCase prop, so
  the code used lowercase `fetchpriority` plus a typings augmentation in `vite-env.d.ts`. Both
  are gone — verified the attribute still reaches the hero images.
- **Cost, measured on production builds:** the `react-vendor` chunk went 171 kB raw / 56 kB gzip
  → 216 kB / 69 kB. Budgets still pass with room. Do not compare against a
  `NODE_ENV=development` build — dev React is roughly twice the size and will look alarming.

## The environment trap that breaks builds silently

**Corrected 2026-07-28: `NODE_ENV` is no longer set to `production`.** Checked at both User and
Machine scope and it is unset at both, so the original justification for this section is gone.
The commands below are still the right habit — being explicit costs nothing and survives the
variable coming back — but do not spend time debugging a `NODE_ENV` that is not set.

Two related facts also changed, both found by running the commands rather than trusting the note:

- **`node`, `npm` and `npx` are on PATH now** (`v22.23.1`, from `AppData\Local\hermes\node\`).
  Earlier notes say the only Node is the one bundled with OpenAI Codex. That is stale.
- **`npx tsc` fails here, and that does not mean TypeScript is missing.** It is installed at
  `app\node_modules\typescript\bin\tsc` and passes; Hermes's `npx` just does not resolve the
  project-local binary. Call it by path:
  `node node_modules\typescript\bin\tsc --noEmit -p .`

**Corrected 2026-07-31: the bundle build now runs on this host.** This section previously said
it could not, because `rolldown` shipped only `binding-linux-x64-gnu`/`musl` with no win32
binding. `npm run build` completes locally today — exit 0, 2063 modules, ~800ms, followed by
`prerender-meta` writing 84 route shells and the sitemap.

**`node scripts/verify.cjs` now exits 0 end to end**, browser smoke included. That needs
Playwright's browser present — `npx playwright install chromium` — which is a one-time local
setup step, not a repo change.

Verify before relying on either claim: `npm run build` (leave `NODE_ENV` unset — an explicit
`development` builds dev React and fails `check:budgets`), then
`node scripts/verify.cjs`.

The original guidance follows.

```
$env:NODE_ENV='development'; npm install --include=dev
$env:NODE_ENV='development'; npm run build
```

`tsc` runs with `noUnusedLocals`, so an unused import fails the build. If vite reports
"Cannot find module @rollup/rollup-win32-x64-msvc", reinstall that pinned optional
dependency; a known npm bug removes it on some installs.

## Never

- **Never hand-edit chapter JSON.** `../DataGoblin-Complete.md` is the single source of
  truth. Edit it, then `update-content.bat`. The one exception is `content/art-map.json`,
  which is the hand-editable art control surface.
- **Nothing from `../Sources/` enters this repo.** No file, no link, no reference.
- Respect the `RESERVED` note on `indigenous-data-panel` (root `AGENTS.md`, guardrail 4).
- **Never commit to `main` or push to it.** Work on a `claude/*` (or `codex/*`) task
  branch, push that branch, open a PR, and Alex merges. Pushing the branch and opening the
  PR is the approved path, not a violation of it — this is how every change since #31 has
  landed. `commit-and-push.bat` is Alex's direct-to-`main` shortcut and is his alone to run.
  `push-to-github.bat` was first-time setup only; never re-run it.

## Definition of done

From `AGENTS.md`, reproduced because it is the gate rather than reference material:

1. `update-content.bat` runs clean, counts match root `AGENTS.md`, verify flags 0 unless
   you deliberately added one.
2. `sanity-pagination` passes: no block loss, no stub last page, no panel over twice budget.
3. `npm run build` exits 0.
4. Nothing from `../Sources/` entered the repo, and every art-map reference resolves.
5. Changes land by PR from a task branch; merging is Alex's call.

If pagination logic changed, recompile before testing. `AGENTS.md` has the exact `tsc`
invocation and the `.js` to `.cjs` rename step.

## Claude-specific

`deploy-web-edition` owns the build and ship procedure, and `data-goblin-manuscript-check`
gates it. Run the check before the content pipeline, not after.

Session close and the `WORK-LOG.md` append are covered in `../CLAUDE.md`.
