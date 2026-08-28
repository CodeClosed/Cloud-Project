@echo off
"%~dp0.venv\Scripts\uvicorn.exe" --reload-exclude ".venv" --reload-exclude "models" %*
