@echo off
echo ============================================================
echo   GENEZA NEXUS KELION - Auto Deploy Setup
echo ============================================================
echo.

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed!
    echo.
    echo Please install Git from: https://git-scm.com/download/win
    echo After installation, run this script again.
    echo.
    pause
    exit /b 1
)

echo [1/5] Initializing Git repository...
git init

echo [2/5] Adding all files...
git add .

echo [3/5] Creating initial commit...
git commit -m "GENEZA NEXUS KELION v12 - Production Ready"

echo.
echo ============================================================
echo   Git repository initialized successfully!
echo ============================================================
echo.
echo NEXT STEPS:
echo.
echo 1. Create a new repository on GitHub:
echo    https://github.com/new
echo.
echo 2. Copy the repository URL (e.g., https://github.com/username/repo.git)
echo.
echo 3. Run these commands:
echo    git remote add origin YOUR_GITHUB_URL
echo    git branch -M main
echo    git push -u origin main
echo.
echo 4. Deploy on Render.com:
echo    - Go to: https://render.com
echo    - Sign up with GitHub
echo    - Click "New +" -^> "Web Service"
echo    - Connect your repository
echo    - Add environment variable: OPENAI_API_KEY
echo    - Click "Create Web Service"
echo.
echo ============================================================
pause
