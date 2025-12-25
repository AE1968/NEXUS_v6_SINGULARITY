<#
════════════════════════════════════════════════════════════════════════════════
    KELION v14.0 GENESIS - AUTOMATED CLOUD DEPLOYMENT
════════════════════════════════════════════════════════════════════════════════
    PROCEDURA AUTOMATA DE DEPLOY CLOUD:
    1. Update Versiune la v14.0.0
    2. Git commit + push to GitHub (AE1968/NEXUS_v6_SINGULARITY)
    3. Railway auto-deploy (backend)
    4. Netlify auto-deploy (frontend)
    5. Verificare LIVE
════════════════════════════════════════════════════════════════════════════════
#>

Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   KELION v14.0 GENESIS - Cloud Deployment            ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuration
$VERSION = "14.0.0"
$CODENAME = "RELION GENESIS"
$GITHUB_REPO = "https://github.com/AE1968/NEXUS_v6_SINGULARITY"
$NETLIFY_URL = "https://chipper-melba-0f3b83.netlify.app" 
$RAILWAY_URL = "https://web-production-b215.up.railway.app"

Write-Host "🚀 KELION v$VERSION - $CODENAME" -ForegroundColor Yellow
Write-Host ""

# ═══════════════════════════════════════════════════════════
# STEP 1: GIT COMMIT & PUSH
# ═══════════════════════════════════════════════════════════
Write-Host "📦 STEP 1: Git Commit & Push to GitHub" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan

try {
    # Check if we're in a git repo
    git status 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Not a git repository"
    }
    
    Write-Host "   📝 Staging all changes..." -ForegroundColor White
    git add .
    
    Write-Host "   💾 Committing v$VERSION..." -ForegroundColor White
    $commitMsg = "feat: KELION v$VERSION $CODENAME - Full Autonomous Deployment"
    git commit -m $commitMsg
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Commit successful" -ForegroundColor Green
        
        Write-Host "   🌐 Pushing to GitHub..." -ForegroundColor White
        git push -u origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Push successful to: $GITHUB_REPO" -ForegroundColor Green
        }
        else {
            Write-Host "   ⚠️  Push failed. Trying to pull rebase first..." -ForegroundColor Yellow
            git pull --rebase origin main
            git push -u origin main
        }
    }
    else {
        Write-Host "   ℹ️  No changes to commit" -ForegroundColor Gray
    }
}
catch {
    Write-Host "   ❌ Git operation failed: $_" -ForegroundColor Red
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# STEP 2: CLOUD SYNC WAIT
# ═══════════════════════════════════════════════════════════
Write-Host "☁️  STEP 2: Waiting for Cloud Sync" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🔄 Railway & Netlify are detecting changes..." -ForegroundColor White
Write-Host "   ⏳ Waiting 30 seconds for build initiation..." -ForegroundColor Gray

Start-Sleep -Seconds 30

# ═══════════════════════════════════════════════════════════
# STEP 3: FINAL STATUS
# ═══════════════════════════════════════════════════════════
Write-Host "✅ STEP 3: Deployment Triggered" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Monitorizeaza statusul aici:" -ForegroundColor Yellow
Write-Host "   Frontend (Netlify): $NETLIFY_URL" -ForegroundColor Green
Write-Host "   Backend (Railway):  $RAILWAY_URL" -ForegroundColor Green
Write-Host ""
Write-Host "   GitHub Repo: $GITHUB_REPO" -ForegroundColor Gray
Write-Host ""
Write-Host "   Daca deploy-ul reuseste, site-ul va fi actualizat in 1-2 minute." -ForegroundColor White
Write-Host ""

Write-Host "🎯 Open Frontend now? (Y/N)" -ForegroundColor Yellow
$openFrontend = Read-Host "   Enter choice"

if ($openFrontend -eq 'Y' -or $openFrontend -eq 'y') {
    Start-Process $NETLIFY_URL
}
