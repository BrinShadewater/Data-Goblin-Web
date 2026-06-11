@echo off
cd /d "%~dp0"
echo ===== %date% %time% > push-log.txt
git add -A >> push-log.txt 2>&1
git commit -m "Book pagination: page spreads, arrow-key nav, Next Page/Chapter logic, larger spread" >> push-log.txt 2>&1
git push >> push-log.txt 2>&1
echo ===== exit code %errorlevel% >> push-log.txt
