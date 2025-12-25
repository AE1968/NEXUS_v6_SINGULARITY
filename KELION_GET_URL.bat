@echo off
title KELION - Get Public URL
color 0A

echo ============================================================
echo   KELION AI - PUBLIC URL GENERATOR
echo ============================================================
echo.
echo Closing old tunnels...
taskkill /F /IM ssh.exe 2>nul

timeout /t 2 /nobreak >nul

echo.
echo Creating new tunnel...
echo.
echo ============================================================
echo   YOUR PUBLIC URL WILL APPEAR BELOW:
echo ============================================================
echo.

ssh -R 80:localhost:5000 nokey@localhost.run

pause
