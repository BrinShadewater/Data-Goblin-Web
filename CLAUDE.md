# Claude Context: Data Goblin site repo

`AGENTS.md` in this folder is the full app guide and the source of truth for architecture,
layout, and commands. `../CLAUDE.md` and `../AGENTS.md` cover the manuscript, the content
rules, and the legal guardrails, and they take precedence on anything book-related.

Read `../AGENTS.md` first, then this file's parent `../CLAUDE.md`, then `AGENTS.md` here.
Launch priorities live in `ROADMAP.md`; it is vetted, so do not re-import findings from
external audit reports without checking against it.

## The environment trap that breaks builds silently

**This machine has `NODE_ENV=production` set globally.** A plain `npm install` skips
devDependencies and the build then fails in a way that looks unrelated. Always:

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
- **Leave committing and pushing to Alex** unless he says otherwise. `commit-and-push.bat`
  exists but is his to run. `push-to-github.bat` was first-time setup only; never re-run it.

## Definition of done

From `AGENTS.md`, reproduced because it is the gate rather than reference material:

1. `update-content.bat` runs clean, counts match root `AGENTS.md`, verify flags 0 unless
   you deliberately added one.
2. `sanity-pagination` passes: no block loss, no stub last page, no panel over twice budget.
3. `npm run build` exits 0.
4. Nothing from `../Sources/` entered the repo, and every art-map reference resolves.
5. Committing and pushing is Alex's call.

If pagination logic changed, recompile before testing. `AGENTS.md` has the exact `tsc`
invocation and the `.js` to `.cjs` rename step.

## Claude-specific

`deploy-web-edition` owns the build and ship procedure, and `data-goblin-manuscript-check`
gates it. Run the check before the content pipeline, not after.

Session close and the `WORK-LOG.md` append are covered in `../CLAUDE.md`.
