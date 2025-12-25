@echo off
echo ============================================================
echo   GETTING PUBLIC URL - PLEASE WAIT...
echo ============================================================
echo.
echo Opening new PowerShell window...
echo The PUBLIC URL will appear there!
echo.
echo ============================================================

REM Opresc tunelul vechi
taskkill /F /IM ssh.exe 2>nul

REM Wait 2 seconds
timeout /t 2 /nobreak >nul

REM Deschid PowerShell NOU care va afisa URL-ul
start powershell -NoExit -Command "Write-Host '============================================================' -ForegroundColor Cyan; Write-Host '  CONNECTING TO LOCALHOST.RUN...' -ForegroundColor Cyan; Write-Host '  YOUR PUBLIC URL WILL APPEAR BELOW:' -ForegroundColor Green; Write-Host '============================================================' -ForegroundColor Cyan; Write-Host ''; ssh -R 80:localhost:5000 nokey@localhost.run"

echo.
echo ============================================================
echo   CHECK THE NEW POWERSHELL WINDOW!
echo ============================================================
echo.
echo A new blue window opened with your PUBLIC URL!
echo.
echo Look for a line like:
echo   https://abc123.lhr.life
echo.
echo That's your PUBLIC URL!
echo Share it with anyone!
echo.
echo ============================================================
pause
