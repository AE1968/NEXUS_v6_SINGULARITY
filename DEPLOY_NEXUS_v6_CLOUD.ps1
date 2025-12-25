# 🚀 DEPLOY_NEXUS_v6_CLOUD.ps1
# Automated Cloud Deployment Script for NEXUS v6.0 SINGULARITY

param(
    [Parameter(Mandatory = $false)]
    [string]$GitHubRepoUrl = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NEXUS v6.0 CLOUD DEPLOYMENT WIZARD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Repository URL
if ($GitHubRepoUrl -eq "") {
    Write-Host "[STEP 1/5] GitHub Repository Setup" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "IMPORTANT: I cannot create GitHub repositories automatically." -ForegroundColor Red
    Write-Host "Please follow these steps:" -ForegroundColor White
    Write-Host "  1. Open: https://github.com/new" -ForegroundColor Green
    Write-Host "  2. Repository name: NEXUS_v6_SINGULARITY" -ForegroundColor Green
    Write-Host "  3. Visibility: Public or Private (your choice)" -ForegroundColor Green
    Write-Host "  4. DO NOT initialize with README" -ForegroundColor Green
    Write-Host "  5. Click 'Create repository'" -ForegroundColor Green
    Write-Host ""
    
    $GitHubRepoUrl = Read-Host "Enter the NEW repository URL (e.g., https://github.com/AE1968/NEXUS_v6_SINGULARITY.git)"
    
    if ($GitHubRepoUrl -eq "") {
        Write-Host "ERROR: No repository URL provided. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "[STEP 2/5] Updating Git Remote..." -ForegroundColor Yellow
git remote set-url origin $GitHubRepoUrl
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to update remote URL." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Remote updated to: $GitHubRepoUrl" -ForegroundColor Green

Write-Host ""
Write-Host "[STEP 3/5] Adding deployment reports..." -ForegroundColor Yellow
git add DEPLOYMENT_FINAL_REPORT.md GIT_REPAIR_REPORT.md CLOUD_STATUS_AUDIT_v6.md
git commit -m "docs: add deployment and audit reports"
Write-Host "✓ Reports committed" -ForegroundColor Green

Write-Host ""
Write-Host "[STEP 4/5] Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Push failed. Check your GitHub credentials." -ForegroundColor Red
    Write-Host "TIP: You may need to authenticate via browser or personal access token." -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Code pushed successfully!" -ForegroundColor Green

Write-Host ""
Write-Host "[STEP 5/5] Deployment Instructions" -ForegroundColor Yellow
Write-Host ""
Write-Host "BACKEND (Railway):" -ForegroundColor Cyan
Write-Host "  1. Go to: https://railway.app/dashboard" -ForegroundColor White
Write-Host "  2. Select your existing project (or create new)" -ForegroundColor White
$repoName = $GitHubRepoUrl.Replace('.git', '')
Write-Host "  3. Settings -> Connect to GitHub -> Select: $repoName" -ForegroundColor White
Write-Host "  4. Railway will auto-detect backend.py and deploy" -ForegroundColor White
Write-Host ""
Write-Host "FRONTEND (Netlify):" -ForegroundColor Cyan
Write-Host "  1. Go to: https://app.netlify.com/" -ForegroundColor White
Write-Host "  2. 'New site from Git' -> GitHub -> Select: $repoName" -ForegroundColor White
Write-Host "  3. Build settings: None (leave empty)" -ForegroundColor White
Write-Host "  4. Publish directory: / (root)" -ForegroundColor White
Write-Host "  5. Deploy!" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT PREPARATION COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your code is now on GitHub. Follow the instructions above to deploy to Railway and Netlify." -ForegroundColor Yellow
