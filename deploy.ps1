# KELION AUTO-DEPLOY SCRIPT
# Rulează: .\deploy.ps1

Write-Host "🚀 KELION AUTO-DEPLOY v143" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# 1. Git add, commit, push
Write-Host "`n[1/3] Git push..." -ForegroundColor Yellow
git add -A
git commit -m "Auto-deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')" 2>$null
git push origin main

# 2. Railway deploy
Write-Host "`n[2/3] Railway deploy..." -ForegroundColor Yellow
railway up --detach

# 3. Wait and verify
Write-Host "`n[3/3] Waiting 60s for deploy..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# 4. Test live
Write-Host "`n✅ Testing live site..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "https://kelionai.app" -UseBasicParsing -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ SITE LIVE! https://kelionai.app" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Site may still be deploying. Check: https://kelionai.app" -ForegroundColor Yellow
}

Write-Host "`n🎉 DEPLOY COMPLETE!" -ForegroundColor Cyan
