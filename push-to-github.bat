@echo off
REM Data Goblin -> GitHub: first push. Run by double-clicking, or from a terminal.
cd /d "%~dp0"
git init -b main
git add -A
git commit -m "Data Goblin interactive edition: app, content pipeline, generated content" -m "- Vite+React+TS field-guide app (book spread, goblin checks/traps, receipts, loot, computed suspicion meter, dark mode) per the Figma Make design" -m "- Content pipeline: manuscript markdown -> chapters/receipts/glossary/traps JSON" -m "- One-command revision flow (update-content) from the book to the site" -m "- 19 chapters, 50 receipt rows, 45 glossary terms, 19 traps wired"
git remote add origin https://github.com/BrinShadewater/Data-Goblin-Web.git
git push -u origin main
echo.
echo Done. Future updates: git add -A ^&^& git commit -m "message" ^&^& git push
pause
