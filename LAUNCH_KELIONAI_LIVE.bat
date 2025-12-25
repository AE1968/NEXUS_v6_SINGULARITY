@echo off
title 🚀 KELIONAI.APP - LIVE DEPLOYMENT
color 0A
cls

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║              🚀 KELION v1.0 - GENESIS EDITION 🚀              ║
echo ║                                                               ║
echo ║              Launching LIVE on kelionai.app                   ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo [1/5] Verificare Python...
python --version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python nu este instalat!
    pause
    exit /b 1
)
echo      ✅ Python OK
echo.

echo [2/5] Verificare dependențe...
pip show flask >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo      ⚙️  Instalare Flask...
    pip install flask flask-cors anthropic openai
)
echo      ✅ Dependențe OK
echo.

echo [3/5] Inițializare bază de date...
if not exist "kelion_mainframe.db" (
    echo      📊 Creare bază de date nouă...
    python -c "from app import init_db; init_db()"
)
echo      ✅ Database OK
echo.

echo [4/5] Pornire Backend Server (Flask)...
echo      🔧 Server va rula pe http://localhost:5000
echo      ⏳ Așteptați 3 secunde...
start "KELION Backend" cmd /k "python app.py"
timeout /t 3 /nobreak >nul
echo      ✅ Backend Started
echo.

echo [5/5] Pornire ngrok (Public Access)...
echo      🌐 Creare tunel securizat pentru kelionai.app...
start "KELION ngrok" cmd /k "ngrok http 5000 --domain=kelionai.app"
timeout /t 5 /nobreak >nul
echo      ✅ ngrok Started
echo.

echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║                  ✅ KELION v1.0 ESTE LIVE! ✅                 ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo 🌍 ACCES PUBLIC:
echo    https://kelionai.app
echo.
echo 📊 ADMIN PANEL:
echo    https://kelionai.app/ae_contact_admin.html
echo.
echo 📈 ANALYTICS:
echo    https://kelionai.app/admin_analytics.html
echo.
echo ⚙️  ngrok Dashboard:
echo    http://localhost:4040
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo 💡 INSTRUCȚIUNI:
echo    - Site-ul este accesibil GLOBAL la https://kelionai.app
echo    - Nu închide acest terminal sau ferestrele deschise
echo    - Pentru a opri: Închide toate terminalele
echo.
echo 🎉 FELICITĂRI! KELION GENESIS ESTE ONLINE! 🚀
echo.
pause
