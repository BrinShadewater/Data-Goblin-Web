@echo off
REM ============================================================
REM  Data Goblin - AUTO push (non-interactive, for the scheduler).
REM  Pushes only when something actually changed. No prompts, no pause.
REM ============================================================
cd /d "%~dp0"
if exist ".git\index.lock" del /f /q ".git\index.lock"
git config user.name  >nul 2>&1 || git config user.name  "Brin Shadewater"
git config user.email >nul 2>&1 || git config user.email "brinshadewater@gmail.com"
set "LOG=push-log.txt"
git add -A >> "%LOG%" 2>&1
git diff --cached --quiet
if errorlevel 1 (
  echo ===== %date% %time% auto-push >> "%LOG%"
  git commit -m "Auto-push %date% %time%" >> "%LOG%" 2>&1
  git push >> "%LOG%" 2>&1
  echo ===== auto exit %errorlevel% >> "%LOG%"
)
exit /b 0
