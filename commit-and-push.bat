@echo off
setlocal
REM ============================================================
REM  Data Goblin - commit + push (self-healing, honest status)
REM  Usage:  commit-and-push.bat "your message"
REM  Double-click = prompts for a message (Enter = dated default).
REM ============================================================
cd /d "%~dp0"

REM --- 1. Clear any stale git lock from a previous crash ---
if exist ".git\index.lock" (
  echo Clearing stale .git\index.lock ...
  del /f /q ".git\index.lock"
)

REM --- 2. Ensure git has an identity (only sets it if missing) ---
git config user.name  >nul 2>&1 || git config user.name  "Brin Shadewater"
git config user.email >nul 2>&1 || git config user.email "brinshadewater@gmail.com"

REM --- 3. Commit message: capture all args, then STRIP quotes so the
REM        message can't break git's -m parsing (the old bug). ---
set "MSG=%*"
if defined MSG set MSG=%MSG:"=%
if not defined MSG set /p MSG="Commit message (Enter for default): "
if not defined MSG set "MSG=Site update %date% %time%"

set "LOG=push-log.txt"
echo ===== %date% %time% - %MSG% > "%LOG%"

REM --- 4. Stage everything ---
git add -A >> "%LOG%" 2>&1

REM --- 5. Commit only if something is staged; FAIL LOUDLY if commit errors ---
set "DIDCOMMIT=0"
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "%MSG%" >> "%LOG%" 2>&1
  if errorlevel 1 goto fail
  set "DIDCOMMIT=1"
) else (
  echo No new changes to commit. Will still push any unpushed commits.>> "%LOG%"
)

REM --- 6. Push; FAIL LOUDLY if push errors ---
git push >> "%LOG%" 2>&1
if errorlevel 1 goto fail

echo.
echo  ============================================
if "%DIDCOMMIT%"=="1" (
  echo   SUCCESS - committed and pushed.
  echo   Vercel auto-deploys in ~1-2 minutes.
) else (
  echo   OK - already up to date, nothing new to push.
)
echo  ============================================
echo.
pause
endlocal
exit /b 0

:fail
echo.
echo  ============================================
echo   FAILED - nothing was pushed.
echo   Open push-log.txt in this folder for the exact error.
echo   ^(If it mentions sign-in/auth, push once from GitHub
echo    Desktop or VS Code to re-authenticate, then re-run.^)
echo  ============================================
echo.
pause
endlocal
exit /b 1
