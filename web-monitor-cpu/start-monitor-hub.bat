@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo Ambiente Python nao encontrado em .venv\Scripts\python.exe
  exit /b 1
)

if /I "%~1"=="--server-only" goto server_only

start "Monitor Hub Server" "%~f0" --server-only
start "Monitor Hub" "%~dp0index.html"
exit /b 0

:server_only
"%~dp0.venv\Scripts\python.exe" "%~dp0server\app.py"
exit /b %errorlevel%