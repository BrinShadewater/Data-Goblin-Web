# Maintenance

## Required Reading

Read `AGENTS.md` before changing project behavior. It contains project-specific guardrails that should override generic cleanup instincts.

## Regenerate Content

```shell
.\update-content.bat
```

This runs the pipeline and copies generated JSON into the app's public content directory.

## Verify

```shell
cd app
$env:NODE_ENV='development'
npm run verify
```

The verify script covers content sync, pagination sanity, contribution mailto checks, production build, image audit, performance budgets, built-site smoke checks, and browser smoke checks.

## Content Rules

- Do not hand-edit generated chapter JSON unless changing the pipeline contract.
- Keep receipt/source changes traceable.
- Preserve unresolved verification flags.
- Call out affected chapters and receipt rows in pull requests.
- Treat dates and legal/compliance notes carefully.

## App QA

Check these after reader changes:

- Desktop/tablet/phone pagination
- Dyslexia-friendly mode
- Search overlay
- Mobile drawer
- Receipts page
- Map page
- Notes/bookmarks/local storage behavior
- Dark/light theme contrast

## Deployment Notes

The app is a static Vite build under `app/`. The roadmap identifies canonical domain, prerendered metadata, sitemap/robots, JSON-LD, and brand disambiguation as launch-critical surfaces.
