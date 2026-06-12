@echo off
REM Commit + push. Use: commit-and-push.bat "your message"
REM Double-clicking prompts for a message (Enter = dated default).
cd /d "%~dp0"
set "MSG=%~1"
if not defined MSG set /p MSG="Commit message (Enter for default): "
if not defined MSG set "MSG=Site update %date% %time%"
echo ===== %date% %time% — %MSG% > push-log.txt
git add -A >> push-log.txt 2>&1
git commit -m "%MSG%" >> push-log.txt 2>&1
git push >> push-log.txt 2>&1
echo ===== exit code %errorlevel% >> push-log.txt
echo Pushed: %MSG%
