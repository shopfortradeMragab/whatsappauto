@echo off
setlocal
cd /d "%~dp0"

set CLIENTID=%1

echo Killing Node.js processes for client %CLIENTID%...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM chrome.exe >nul 2>&1
taskkill /F /IM msedge.exe >nul 2>&1

echo Cleaning session folder for %CLIENTID%...
rmdir /S /Q ".wwebjs_auth\session-%CLIENTID%"

echo Restarting WhatsAppAuto server...
timeout /t 2 >nul
start /wait node server.js

endlocal
