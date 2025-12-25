@echo off
echo ==========================================
echo    NEXUS v10 SUPREME - URL CONFIGURATOR
echo ==========================================
echo.
set /p railway_url="Introdu URL-ul Railway (ex: https://nexus-backend.up.railway.app): "
echo.
echo Actualizez config.js...
echo.

powershell -Command "(Get-Content 'frontend\js\config.js') -replace 'https://nexus-humanoid-backend.up.railway.app', '%railway_url%' | Set-Content 'frontend\js\config.js'"

echo.
echo [SUCCESS] Config actualizat!
echo.
echo Trimit modificarile pe GitHub...
git add frontend/js/config.js
git commit -m "Update production backend URL"
git push origin main
echo.
echo [DONE] Netlify va redeploya automat in 1-2 minute!
echo.
pause
