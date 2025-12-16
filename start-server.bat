@echo off
echo Starting SR Compiler Local Execution Server...
cd /d "%~dp0"
if not exist "node_modules\express" (
    echo Installing server dependencies...
    call npm install express cors uuid
)
node server.js
pause
