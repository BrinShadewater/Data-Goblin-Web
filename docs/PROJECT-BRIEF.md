# Project Brief

## Purpose

Data Goblin Web turns a manuscript and evidence ledger into an interactive public reader. It is not just a website around a book; it is the book's verification method expressed as interface.

## Audience

- Readers exploring AI, power, and data in Canada
- People checking claims through receipts and source links
- Maintainers updating manuscript, generated content, and reader behavior
- Search engines and public discovery surfaces that need stable metadata

## Product Principles

- The manuscript is the source of truth.
- Receipts are part of the reading experience.
- Verification flags stay visible until resolved.
- The interface can be playful, but the evidence trail must stay serious.
- Generated JSON is committed because it is public content, not throwaway build output.

## Core Workflows

- Regenerate content from source files.
- Read chapters through the interactive reader.
- Search and browse glossary/loot, receipts, map, and updates.
- Track reading state, notes, and quest items locally.
- Verify built output before deployment.

## High-Risk Areas

- Hand-editing generated JSON.
- Losing or weakening verification flags.
- Overwriting source-backed content with stale summaries.
- Breaking pagination across viewport/dyslexia modes.
- Treating launch-roadmap findings as current without checking existing implementation.
