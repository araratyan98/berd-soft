@echo off
rem BERD SOFT admin: opens http://127.0.0.1:5179 in the browser. Close this window to stop it.
cd /d "%~dp0"
node admin\server.js
pause
