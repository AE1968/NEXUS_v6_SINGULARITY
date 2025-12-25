@echo off
REM ============================================================
REM   GENEZA NEXUS KELION - Complete Auto-Deploy Script
REM   Run this after restarting your terminal
REM ============================================================

echo.
echo ============================================================
echo   GENEZA NEXUS KELION - Auto Deploy
echo ============================================================
echo.

REM Set Git path explicitly
set PATH=%PATH%;C:\Program Files\Git\bin

REM Check Git installation
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git not found in PATH
    echo Please restart your terminal and run this script again
    pause
    exit /b 1
)

echo [Step 1/6] Configuring Git...
git config --global user.name "GENEZA_NEXUS"
git config --global user.email "nexus@geneza.ai"
echo   ✓ Git configured

echo.
echo [Step 2/6] Initializing repository...
git init
echo   ✓ Repository initialized

echo.
echo [Step 3/6] Adding files...
git add .
echo   ✓ Files staged

echo.
echo [Step 4/6] Creating commit...
git commit -m "GENEZA NEXUS KELION v12 - Production Ready - Single Avatar Edition"
echo   ✓ Commit created

echo.
echo ============================================================
echo   LOCAL SETUP COMPLETE!
echo ============================================================
echo.
echo NEXT: Deploy to Render.com (FREE)
echo.
echo 1. Go to: https://github.com/new
echo    - Repository name: geneza-nexus-kelion
echo    - Make it Public
echo    - Click "Create repository"
echo.
echo 2. Copy the HTTPS URL shown (e.g., https://github.com/username/geneza-nexus-kelion.git)
echo.
echo 3. Run these commands in a NEW terminal:
echo    cd "%CD%"
echo    git remote add origin YOUR_GITHUB_URL_HERE
echo    git branch -M main
echo    git push -u origin main
echo.
echo 4. Deploy on Render:
echo    - Go to: https://render.com
echo    - Sign up with GitHub
echo    - Click "New +" -^> "Web Service"
echo    - Select "geneza-nexus-kelion" repository
echo    - Name: geneza-nexus-kelion
echo    - Build Command: pip install -r requirements.txt
echo    - Start Command: gunicorn app:app
echo    - Add Environment Variable:
echo      * Key: OPENAI_API_KEY
echo      * Value: [Your OpenAI API Key]
echo    - Click "Create Web Service"
echo.
echo 5. Wait 5-10 minutes for deployment
echo    Your app will be live at: https://geneza-nexus-kelion.onrender.com
echo.
echo ============================================================
echo.
pause
