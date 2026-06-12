@echo off
REM Data Goblin content update script for Windows.
REM Re-runs the manuscript->JSON pipeline and publishes the result into the app.
setlocal EnableExtensions
set "SITE_DIR=%~dp0"
set "CONTENT_DIR=%SITE_DIR%content"
set "APP_CONTENT_DIR=%SITE_DIR%app\public\content"
set "PY_CMD=python"
if exist "%SITE_DIR%JSON" del /q "%SITE_DIR%JSON" >nul 2>nul
echo -- Data Goblin content update --------------------------

echo [1/4] Running pipeline: site\pipeline\build_content.py
%PY_CMD% "%SITE_DIR%pipeline\build_content.py"
if errorlevel 1 (
  py -3 "%SITE_DIR%pipeline\build_content.py"
  if errorlevel 1 (
    echo Pipeline failed. Is Python installed?
    exit /b 1
  )
  set "PY_CMD=py -3"
)

echo [2/4] Copying site\content -^> site\app\public\content
robocopy "%CONTENT_DIR%" "%APP_CONTENT_DIR%" /E /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (
  echo Copy failed.
  exit /b 1
)

echo [3/4] Verifying generated content sync
%PY_CMD% "%SITE_DIR%pipeline\check_content_sync.py" "%CONTENT_DIR%" "%APP_CONTENT_DIR%"
if errorlevel 1 (
  echo Content sync failed.
  exit /b 1
)

if exist "%SITE_DIR%JSON" del /q "%SITE_DIR%JSON" >nul 2>nul
echo [4/4] Done. Reload the dev server page or rebuild in site\app.
exit /b 0
