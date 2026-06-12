# Local Storage Contract

The app intentionally stores reader state locally in the browser. Refactors may
move helper code, but they should not rename keys or change stored shapes unless
there is a separate migration task.

## Expected State

- Last reader location is used to resume the guide.
- Per-document panel positions are restored and clamped to the live page count.
- Bookmarks are saved by document and panel index.
- Goblin Notes are saved locally and are never sent to a server.
- Cookie notice preferences are saved locally.
- Theme and reader options are saved locally.

## Refactor Checks

- Existing saved progress still resumes to the same document and page.
- Existing bookmarks still appear in the Bookmarks tool card.
- Existing notes still appear in Goblin Notes.
- Cookie notice remains dismissed after a stored choice.
- Theme remains stable across reloads.
