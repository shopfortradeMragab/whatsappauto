@echo off


:check_server
tasklist | find /i "node.exe" | find /i "server.js" >nul
if errorlevel 1 (
    echo Starting server.js...
    start "server.js" "C:\Program Files\nodejs\node.exe" c:\sites\whatsappauto\server.js
) else (
    echo server.js is already running.
)

timeout /t 600 >nul
goto check_server