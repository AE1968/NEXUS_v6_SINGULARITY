@echo off
title KELION - BACKEND FLASK
color 0E
cls

echo.
echo ════════════════════════════════════════════════
echo    KELION BACKEND - Flask Server Starting...
echo ════════════════════════════════════════════════
echo.

cd /d "%~dp0"

echo [1] Checking Python...
python --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found!
    pause
    exit /b 1
)
echo.

echo [2] Starting Flask Backend...
echo Port: 5000
echo.
echo ════════════════════════════════════════════════
echo    Backend is starting - DO NOT CLOSE!
echo ════════════════════════════════════════════════
echo.

python app.py

echo.
echo ════════════════════════════════════════════════
echo    Backend STOPPED
echo ════════════════════════════════════════════════
pause
