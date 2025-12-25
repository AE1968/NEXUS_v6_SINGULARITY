@echo off
echo ============================================================
echo   GENEZA NEXUS KELION - INSTANT DEPLOY
echo ============================================================
echo.
echo Opening Railway.app for instant deployment...
echo.
start https://railway.app
echo.
echo ============================================================
echo   FOLLOW THESE STEPS IN THE BROWSER:
echo ============================================================
echo.
echo 1. Click "Start a New Project"
echo.
echo 2. Click "Deploy from GitHub repo"
echo    (Login with GitHub if needed)
echo.
echo 3. Click "Create a New Repo" or select existing
echo    - Name: geneza-nexus-kelion
echo    - Make it Public
echo.
echo 4. Railway will auto-detect:
echo    - Python app
echo    - requirements.txt
echo    - Procfile
echo.
echo 5. Add Environment Variable:
echo    - Click "Variables"
echo    - Click "New Variable"
echo    - Key: OPENAI_API_KEY
echo    - Value: [Paste your OpenAI key]
echo.
echo 6. Click "Deploy"
echo.
echo 7. Wait 3-5 minutes...
echo.
echo 8. Click "Settings" -^> "Generate Domain"
echo.
echo 9. Your app will be live at:
echo    https://geneza-nexus-kelion.up.railway.app
echo.
echo ============================================================
echo   BACKUP SAVED TO DESKTOP: NEXUS_FINAL_DEPLOY
echo ============================================================
echo.
echo Your code is ready! Just follow the steps above.
echo.
pause
