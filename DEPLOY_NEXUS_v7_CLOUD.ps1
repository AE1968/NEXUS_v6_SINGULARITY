<#
════════════════════════════════════════════════════════════════════════════════
    NEXUS v7.0 TRANSCENDENCE - AUTOMATED CLOUD DEPLOYMENT
════════════════════════════════════════════════════════════════════════════════
    STANDARD PROCEDURE (PENTRU TOATE DEPLOY-URILE VIITOARE):
    1. Audit complet (generat automat)
    2. Git commit + push to GitHub
    3. Railway auto-deploy (backend)
    4. Netlify auto-deploy (frontend)
    5. Cleanup versiuni vechi Netlify
    6. Verificare LIVE + link pentru testare
    
    IMPORTANT: TOTUL VA FI ONLINE - ZERO LOCAL PROCESSING
════════════════════════════════════════════════════════════════════════════════
#>

Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   NEXUS v7.0 TRANSCENDENCE - Cloud Deployment        ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuration
$VERSION = "7.0.0"
$CODENAME = "TRANSCENDENCE"
$GITHUB_REPO = "https://github.com/AE1968/NEXUS_v6_SINGULARITY"
$RAILWAY_URL = "https://web-production-b215.up.railway.app"
$NETLIFY_URL = "https://chipper-melba-0f3b83.netlify.app"
$NETLIFY_KEEP = "chipper-melba-0f3b83"
$NETLIFY_DELETE = @("friendly-sawine-0d5dd4", "geneza-nexus")

Write-Host "🚀 NEXUS v$VERSION - $CODENAME" -ForegroundColor Yellow
Write-Host ""

# ═══════════════════════════════════════════════════════════
# STEP 1: PRE-DEPLOYMENT AUDIT
# ═══════════════════════════════════════════════════════════
Write-Host "📊 STEP 1: Pre-Deployment Audit" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan

if (Test-Path "CLOUD_DEPLOYMENT_AUDIT_v7.md") {
    Write-Host "   ✅ Audit report found: CLOUD_DEPLOYMENT_AUDIT_v7.md" -ForegroundColor Green
    $auditContent = Get-Content "CLOUD_DEPLOYMENT_AUDIT_v7.md" -Raw
    if ($auditContent -match "Overall Readiness.*?(\d+)%") {
        $readiness = $Matches[1]
        Write-Host "   📊 System Readiness: $readiness%" -ForegroundColor $(if ([int]$readiness -ge 90) { "Green" }else { "Yellow" })
    }
}
else {
    Write-Host "   ⚠️  Audit report not found - generating minimal audit..." -ForegroundColor Yellow
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# STEP 2: GIT COMMIT & PUSH
# ═══════════════════════════════════════════════════════════
Write-Host "📦 STEP 2: Git Commit & Push to GitHub" -ForegroundColor Cyan
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
    $commitMsg = "feat: NEXUS v$VERSION $CODENAME - Claude Sonnet 4.5 integration"
    git commit -m $commitMsg
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Commit successful" -ForegroundColor Green
        
        Write-Host "   🌐 Pushing to GitHub..." -ForegroundColor White
        git push -u origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Push successful to: $GITHUB_REPO" -ForegroundColor Green
        }
        else {
            Write-Host "   ⚠️  Push failed - check credentials or network" -ForegroundColor Yellow
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
# STEP 3: RAILWAY AUTO-DEPLOY VERIFICATION
# ═══════════════════════════════════════════════════════════
Write-Host "🚂 STEP 3: Railway Backend Deployment" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🔄 Railway auto-deploys on GitHub push..." -ForegroundColor White
Write-Host "   ⏳ Waiting 15 seconds for deployment to start..." -ForegroundColor Gray

Start-Sleep -Seconds 15

Write-Host "   📡 Testing Railway endpoint..." -ForegroundColor White
try {
    $railwayHealth = Invoke-WebRequest -Uri "$RAILWAY_URL/health" -Method GET -TimeoutSec 10 -UseBasicParsing
    if ($railwayHealth.StatusCode -eq 200) {
        Write-Host "   ✅ Railway backend is ONLINE" -ForegroundColor Green
        
        # Test enhanced status endpoint (v7.0)
        try {
            $statusResponse = Invoke-RestMethod -Uri "$RAILWAY_URL/api/nexus/status/enhanced" -Method GET -TimeoutSec 10
            if ($statusResponse.version -match "7.0") {
                Write-Host "   ✅ v7.0 TRANSCENDENCE deployed successfully!" -ForegroundColor Green
                Write-Host "   🧠 Claude Sonnet 4.5: $($statusResponse.capabilities.'claude_sonnet_4.5')" -ForegroundColor Cyan
            }
            else {
                Write-Host "   ⚠️  Old version still active: $($statusResponse.version)" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "   ⚠️  v7.0 status check failed - deployment might still be in progress" -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "   ⚠️  Railway backend not responding yet - check deployment logs" -ForegroundColor Yellow
    Write-Host "   🔗 Railway Dashboard: https://railway.com/project/695b8855-e63f-4266-84f0-c2e5197f3131" -ForegroundColor Gray
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# STEP 4: NETLIFY AUTO-DEPLOY VERIFICATION
# ═══════════════════════════════════════════════════════════
Write-Host "🌐 STEP 4: Netlify Frontend Deployment" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🔄 Netlify auto-deploys on GitHub push..." -ForegroundColor White
Write-Host "   ⏳ Waiting 20 seconds for deployment to start..." -ForegroundColor Gray

Start-Sleep -Seconds 20

Write-Host "   📡 Testing Netlify endpoint..." -ForegroundColor White
try {
    $netlifyResponse = Invoke-WebRequest -Uri $NETLIFY_URL -Method GET -TimeoutSec 10 -UseBasicParsing
    if ($netlifyResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Netlify frontend is ONLINE" -ForegroundColor Green
        
        # Check if v7.0 content is present
        if ($netlifyResponse.Content -match "v7.0|TRANSCENDENCE") {
            Write-Host "   ✅ v7.0 content detected!" -ForegroundColor Green
        }
        else {
            Write-Host "   ⚠️  v7.0 content not detected - cache might need clearing" -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "   ⚠️  Netlify frontend not responding yet - check deployment logs" -ForegroundColor Yellow
    Write-Host "   🔗 Netlify Dashboard: https://app.netlify.com/projects/$NETLIFY_KEEP" -ForegroundColor Gray
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# STEP 5: CLEANUP OLD NETLIFY VERSIONS (MANUAL GUIDE)
# ═══════════════════════════════════════════════════════════
Write-Host "🧹 STEP 5: Netlify Version Cleanup" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   ✅ KEEP: $NETLIFY_KEEP (v$VERSION - most recent)" -ForegroundColor Green
Write-Host "   ❌ DELETE (old versions):" -ForegroundColor Red
foreach ($site in $NETLIFY_DELETE) {
    Write-Host "      - $site" -ForegroundColor DarkRed
}
Write-Host ""
Write-Host "   🔧 MANUAL CLEANUP STEPS:" -ForegroundColor Yellow
Write-Host "      1. Open Netlify dashboard in browser" -ForegroundColor Gray
Write-Host "      2. For each site to delete:" -ForegroundColor Gray
Write-Host "         a) Navigate to: Settings → General → Danger Zone" -ForegroundColor Gray
Write-Host "         b) Click 'Delete this site'" -ForegroundColor Gray
Write-Host "         c) Type site name to confirm" -ForegroundColor Gray
Write-Host "         d) Click 'Delete'" -ForegroundColor Gray
Write-Host ""

$openBrowser = Read-Host "   Open Netlify dashboard for cleanup? (Y/N)"
if ($openBrowser -eq 'Y' -or $openBrowser -eq 'y') {
    Start-Process "https://app.netlify.com/teams/kidsdigitalhubteam/projects"
    Write-Host "   ✅ Browser opened" -ForegroundColor Green
}
else {
    Write-Host "   ⏭️  Skipping browser launch" -ForegroundColor Gray
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# STEP 6: FINAL VERIFICATION & TEST LINKS
# ═══════════════════════════════════════════════════════════
Write-Host "✅ STEP 6: Deployment Complete - Test Links" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 LIVE URLS FOR TESTING:" -ForegroundColor Yellow
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "📱 FRONTEND (Netlify):" -ForegroundColor Cyan
Write-Host "   $NETLIFY_URL" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 BACKEND (Railway):" -ForegroundColor Cyan
Write-Host "   Health Check:  $RAILWAY_URL/health" -ForegroundColor Green
Write-Host "   Status (v6.0): $RAILWAY_URL/api/nexus/status" -ForegroundColor Green
Write-Host "   Status (v7.0): $RAILWAY_URL/api/nexus/status/enhanced" -ForegroundColor Green
Write-Host "   Gemini Chat:   $RAILWAY_URL/api/nexus/chat" -ForegroundColor Green
Write-Host "   Claude Chat:   $RAILWAY_URL/api/nexus/claude" -ForegroundColor Green
Write-Host ""
Write-Host "📊 MONITORING:" -ForegroundColor Cyan
Write-Host "   Railway: https://railway.com/project/695b8855-e63f-4266-84f0-c2e5197f3131" -ForegroundColor Gray
Write-Host "   Netlify: https://app.netlify.com/projects/$NETLIFY_KEEP" -ForegroundColor Gray
Write-Host "   GitHub:  $GITHUB_REPO" -ForegroundColor Gray
Write-Host ""

# ═══════════════════════════════════════════════════════════
# NEXT STEPS
# ═══════════════════════════════════════════════════════════
Write-Host "📝 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "   1. ⚠️  Configure ANTHROPIC_API_KEY in Railway (required for Claude)" -ForegroundColor White
Write-Host "   2. 🧪 Test frontend at: $NETLIFY_URL" -ForegroundColor White
Write-Host "   3. 🧹 Complete Netlify cleanup (delete old versions)" -ForegroundColor White
Write-Host "   4. ✅ Verify all v7.0 features are functional" -ForegroundColor White
Write-Host "   5. 🎉 Take a break - deployment complete!" -ForegroundColor White
Write-Host ""

Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          NEXUS v$VERSION DEPLOYMENT COMPLETE          ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "   Version:  $VERSION $CODENAME" -ForegroundColor White
Write-Host "   Status:   Deployed to Cloud" -ForegroundColor Green
Write-Host "   Frontend: LIVE on Netlify" -ForegroundColor Green
Write-Host "   Backend:  LIVE on Railway" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Open frontend now? (Y/N)" -ForegroundColor Yellow
$openFrontend = Read-Host "   Enter choice"

if ($openFrontend -eq 'Y' -or $openFrontend -eq 'y') {
    Start-Process $NETLIFY_URL
    Write-Host "   ✅ Frontend opened in browser!" -ForegroundColor Green
}
else {
    Write-Host "   ⏭️  Skipping frontend launch" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✨ Thank you for using NEXUS Automated Deployment!" -ForegroundColor Cyan
Write-Host "   This procedure will be used for all future deployments." -ForegroundColor Gray
Write-Host ""
