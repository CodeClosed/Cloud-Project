@echo off
setlocal
cd /d "%~dp0"

title Dual Branch AI for Chest X-Ray Analysis System Launcher

if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" run.py %*
) else (
    python run.py %*
)

endlocal
