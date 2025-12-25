@echo off
title Get KELION Public URL
color 0A
cls

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║                                                    ║
echo ║        🌐 KELION URL PUBLIC - NGROK 🌐            ║
echo ║                                                    ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo ⏳ Obțin URL-ul public...
echo.

REM Verifică dacă ngrok rulează
curl -s http://localhost:4040/api/tunnels > temp_ngrok.json 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: ngrok nu rulează!
    echo.
    echo 💡 Soluție: Rulează mai întâi LAUNCH_KELIONAI_LIVE.bat
    echo.
    del temp_ngrok.json 2>nul
    pause
    exit /b 1
)

echo ✅ ngrok este activ!
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo  📍 URL-ul PUBLIC al site-ului KELIONAI:
echo.

REM Extrage URL-ul public din JSON (simplu)
findstr "https://" temp_ngrok.json | findstr "ngrok" | findstr -v "localhost"
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo 💡 Copiază URL-ul de mai sus și distribuie-l!
echo    Oricine cu acest link poate accesa KELION v1.0
echo.
echo 🔗 Pentru detalii complete despre tunnel:
echo    http://localhost:4040
echo.
echo 📊 Admin Panels:
echo    [URL]/ae_contact_admin.html
echo    [URL]/admin_analytics.html
echo.

del temp_ngrok.json 2>nul
pause
