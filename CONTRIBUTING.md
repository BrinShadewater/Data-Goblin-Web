# Contributing

Read `AGENTS.md` first. Its project guardrails override generic cleanup instincts.

## Content Pipeline

Regenerate content after manuscript or ledger edits:

```shell
.\update-content.bat
```

Then verify the app:

```shell
cd app
$env:NODE_ENV='development'
npm run verify
```

## Pull Requests

- Keep manuscript/content, pipeline, and UI changes clearly separated when possible.
- Do not hand-edit generated chapter JSON unless the pipeline contract changes.
- Include screenshots for reader, navigation, receipts, search, or theme changes.
- Preserve verification flags and source notes until they are resolved with evidence.
- Do not "simplify" the project's disclosure or receipts language without checking the source docs.

## Review Focus

Call out affected chapters, receipt rows, glossary terms, routes, and generated files in the pull request body.
