@echo off
title START GENEZA NEXUS AI
echo ==========================================
echo    GENEZA NEXUS – HUMANOID AI v10.0
echo ==========================================
echo.
echo [1] Incarcare Creier Neural (Backend)...
cd backend
start /min python app.py
timeout /t 3 >nul

echo [2] Incarcare Interfata (Frontend)...
cd ../frontend
start index.html

echo.
echo [SISTEM] Nexus este acum ONLINE.
echo [INFO] Inchide acest terminal pentru a opri sistemul.
echo ==========================================
pause >nul
