@echo off
REM Data Goblin — content update script (Windows).
REM Re-runs the manuscript->JSON pipeline and publishes the result into the app.
setlocal
set SITE_DIR=%~dp0
echo ── Data Goblin content update ──────────────────────────

echo [1/3] Running pipeline: site\pipeline\build_content.py
python "%SITE_DIR%pipeline\build_content.py"
if errorlevel 1 (
  py -3 "%SITE_DIR%pipeline\build_content.py"
  if errorlevel 1 (
    echo Pipeline failed — is Python installed?
    exit /b 1
  )
)

echo [2/3] Copying site\content -^> site\app\public\content
robocopy "%SITE_DIR%content" "%SITE_DIR%app\public\content" /E /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (
  echo Copy failed.
  exit /b 1
)

echo [3/3] Files copied (robocopy summary of newer files):
robocopy "%SITE_DIR%content" "%SITE_DIR%app\public\content" /E /L /XO /NDL /NJH /NJS /NP
echo Done. Reload the dev server page (npm run dev) or rebuild (npm run build) in site\app.
exit /b 0
