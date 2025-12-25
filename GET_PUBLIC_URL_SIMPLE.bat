@echo off
title KELION - OBTINERE URL PUBLIC
color 0E
cls

echo.
echo ════════════════════════════════════════════════
echo    KELION - URL PUBLIC CHECKER
echo ════════════════════════════════════════════════
echo.

echo [1/3] Verificare ngrok...
curl -s http://localhost:4040/api/tunnels > ngrok_check.json 2>nul

if %ERRORLEVEL% EQU 0 (
    echo      ✅ ngrok RĂSPUNDE
    echo.
    
    echo [2/3] Extragere URL...
    type ngrok_check.json | findstr "https://"
    echo.
    
    echo [3/3] Instrucțiuni pentru kelionai.app:
    echo.
    echo ════════════════════════════════════════════════
    echo CONFIGURARE NAMECHEAP:
    echo ════════════════════════════════════════════════
    echo.
    echo 1. Deschide: https://ap.www.namecheap.com
    echo 2. Login: ae1968@kidsdigitalhub.com
    echo 3. kelionai.app ^> Manage ^> Advanced DNS
    echo 4. Add URL Redirect Record:
    echo    - Host: @
    echo    - Value: [URL-ul HTTPS de mai sus]
    echo    - Redirect Type: Permanent (301)
    echo 5. Save All Changes
    echo 6. Așteaptă 10-30 minute
    echo 7. Test: https://kelionai.app
    echo.
    
) else (
    echo      ❌ ngrok NU RULEAZĂ
    echo.
    echo Pentru a porni ngrok:
    echo    ngrok http 5000
    echo.
)

del ngrok_check.json 2>nul
pause
