# GENEZA NEXUS – GITHUB AUTOMATION SCRIPT
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   NEXUS GITHUB DEPLOYMENT SYSTEM" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if Git is initialized
if (!(Test-Path .git)) {
    Write-Host "[SYSTEM] Initializing Git repository..." -ForegroundColor Yellow
    git init
}

# Add all files
Write-Host "[SYSTEM] Staging files..." -ForegroundColor Yellow
git add .

# Prompt for commit message
$msg = Read-Host "Introduceți mesajul pentru commit (default: 'Nexus v10.0 GOLD Release')"
if ($msg -eq "") { $msg = "Nexus v10.0 GOLD Release" }

git commit -m "$msg"

# Handle Remote
$remote = git remote get-url origin 2>$null
if (!$remote) {
    Write-Host "`n[ACTION REQUIRED] Nu am gasit un repository setat." -ForegroundColor Magenta
    $url = Read-Host "Introduceti URL-ul repository-ului GitHub (ex: https://github.com/user/repo.git)"
    if ($url -ne "") {
        git remote add origin $url
        git branch -M main
        Write-Host "[SYSTEM] Remote configurat cu succes." -ForegroundColor Green
    }
}

# Push
Write-Host "`n[SYSTEM] Se trimite codul către rețeaua globală (GitHub)..." -ForegroundColor Cyan
git push -u origin main

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "   DEPLOIEMENT COMPLET EXECUTAT." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
pause
