@echo off
title Geneza Nexus Launcher
color 0b
echo ========================================================
echo   GENEZA NEXUS AI - LAUNCHING SYSTEM...
echo ========================================================
echo.
echo   [1/3] Checking internet connection...
ping -n 1 8.8.8.8 >nul
if errorlevel 1 (
    color 0c
    echo   [ERROR] No internet connection detected!
    echo   Nexus requires internet to function correctly.
    pause
    exit
)
echo   [OK] Online.

echo   [2/3] Updating resources...
echo   [OK] Resources are auto-updated from cloud.

echo   [3/3] Opening Secure Interface...

:: Deschide in Chrome App Mode (fara address bar)
start chrome --app=https://geneza-nexus.netlify.app/nexus_core.html

:: Fallback pentru Edge daca nu e Chrome
if errorlevel 1 (
    start msedge --app=https://geneza-nexus.netlify.app/nexus_core.html
)

exit
