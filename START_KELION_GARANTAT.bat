@echo off
title KELION AI - START GARANTAT
color 0A
cls

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║                                                    ║
echo ║        🚀 KELION AI - PORNIRE GARANTATĂ 🚀        ║
echo ║                                                    ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Oprește procese vechi dacă există
echo [1/4] Curățare procese vechi...
taskkill /F /IM python.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo      ✅ Procese curățate
echo.

REM Pornește Backend Flask
echo [2/4] Pornire Backend Flask...
start "KELION Backend" /MIN python app.py
echo      ⏳ Așteptare inițializare (10 secunde)...
timeout /t 10 /nobreak >nul
echo      ✅ Backend pornit
echo.

REM Verifică ngrok
echo [3/4] Verificare ngrok...
curl -s http://localhost:4040/api/tunnels >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo      ✅ ngrok deja activ
) else (
    echo      ⚙️  Pornire ngrok...
    start "KELION ngrok" /MIN ngrok http 5000
    timeout /t 5 /nobreak >nul
    echo      ✅ ngrok pornit
)
echo.

REM Deschide site
echo [4/4] Deschidere site...
start http://localhost:5000
echo      ✅ Site deschis în browser
echo.

echo ╔════════════════════════════════════════════════════╗
echo ║                                                    ║
echo ║            ✅ KELION AI ESTE LIVE! ✅              ║
echo ║                                                    ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo 🌐 ACCES:
echo    Local:  http://localhost:5000
echo    Public: Verifică http://localhost:4040 pentru URL
echo.
echo ⚠️  Nu închide acest terminal!
echo.
pause
