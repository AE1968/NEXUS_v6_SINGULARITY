@echo off
title START GENEZA NEXUS v10 GOLD
color 0b
echo ==========================================
echo    GENEZA NEXUS – HUMANOID AI v10.0 GOLD
echo          SUPREME EDITION
echo ==========================================
echo.
echo [1] Curatare procese anterioare...
taskkill /f /im python.exe >nul 2>&1

echo [2] Pornire Server Backend & Frontend...
cd backend
start /min "Nexus Backend" python app.py
cd ..\frontend
start /min "Nexus Frontend" python -m http.server 8080

echo [3] Lansare Interfata...
echo Deschide manual: http://localhost:8080

cd ..

echo.
echo [STATUS] SISTEM REPORNIT COMPLET.
echo Verifica browserul pentru noua sesiune (Refresh automat realizat).
echo.
pause >nul
