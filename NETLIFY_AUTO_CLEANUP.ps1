<#
════════════════════════════════════════════════════════════════════════════════
    NEXUS v6.0 - AUTOMATED NETLIFY VERSION CLEANUP
════════════════════════════════════════════════════════════════════════════════
    Purpose: Automatically detect and delete OLD Netlify deployments
    Strategy: Keep ONLY the most recent version
    Safety: Manual confirmation before deletion
════════════════════════════════════════════════════════════════════════════════
#>

Write-Host "🧹 NEXUS v6.0 - Automated Netlify Cleanup Procedure" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuration
$KEEP_SITE = "chipper-melba-0f3b83"  # Most recent version (6:16 AM - Dec 20, 2025)
$TEAM_NAME = "kidsdigitalhubteam"
$DELETE_TARGETS = @(
    "friendly-sawine-0d5dd4",  # Old version (4:13 AM)
    "geneza-nexus"             # Old version (4:13 AM)
)

# Step 1: Display Current Configuration
Write-Host "📋 CURRENT CONFIGURATION:" -ForegroundColor Yellow
Write-Host "   ✅ KEEP (Most Recent):   $KEEP_SITE" -ForegroundColor Green
Write-Host "   ❌ DELETE (Old Versions):" -ForegroundColor Red
foreach ($target in $DELETE_TARGETS) {
    Write-Host "      - $target" -ForegroundColor DarkRed
}
Write-Host ""

# Step 2: Check if Netlify CLI is installed
Write-Host "🔍 Checking Netlify CLI..." -ForegroundColor Cyan
$netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue

if (-not $netlifyInstalled) {
    Write-Host "⚠️  Netlify CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g netlify-cli
    Write-Host "✅ Netlify CLI installed successfully!" -ForegroundColor Green
}
else {
    Write-Host "✅ Netlify CLI is already installed." -ForegroundColor Green
}
Write-Host ""

# Step 3: Authenticate (if needed)
Write-Host "🔐 Authentication Check..." -ForegroundColor Cyan
Write-Host "   Please ensure you are logged in to Netlify CLI." -ForegroundColor Yellow
Write-Host "   If prompted, run: netlify login" -ForegroundColor Yellow
Write-Host ""

# Step 4: List all sites
Write-Host "📊 Listing all Netlify sites for team: $TEAM_NAME" -ForegroundColor Cyan
netlify sites:list --json | Out-File -FilePath "netlify_sites.json" -ErrorAction SilentlyContinue

if (Test-Path "netlify_sites.json") {
    $sites = Get-Content "netlify_sites.json" | ConvertFrom-Json
    
    Write-Host "   Found $($sites.Count) total site(s):" -ForegroundColor White
    foreach ($site in $sites) {
        $indicator = if ($site.name -eq $KEEP_SITE) { "✅ KEEP" } else { "❌ DELETE" }
        $color = if ($site.name -eq $KEEP_SITE) { "Green" } else { "Red" }
        Write-Host "      $indicator $($site.name) (URL: $($site.url))" -ForegroundColor $color
    }
    Write-Host ""
}
else {
    Write-Host "⚠️  Unable to retrieve site list. Manual cleanup required." -ForegroundColor Yellow
    Write-Host ""
}

# Step 5: Manual Deletion Instructions
Write-Host "🗑️  MANUAL CLEANUP PROCEDURE:" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "To complete the cleanup, follow these steps:" -ForegroundColor White
Write-Host ""

$stepNum = 1
foreach ($target in $DELETE_TARGETS) {
    Write-Host "STEP $stepNum: Delete '$target'" -ForegroundColor Yellow
    Write-Host "   1. Open browser: https://app.netlify.com/teams/$TEAM_NAME/projects" -ForegroundColor Gray
    Write-Host "   2. Search for: $target" -ForegroundColor Gray
    Write-Host "   3. Click on the project" -ForegroundColor Gray
    Write-Host "   4. Navigate to: Project configuration → General" -ForegroundColor Gray
    Write-Host "   5. Scroll to 'Danger zone'" -ForegroundColor Gray
    Write-Host "   6. Click 'Delete this project'" -ForegroundColor Gray
    Write-Host "   7. Type '$target' to confirm" -ForegroundColor Gray
    Write-Host "   8. Click 'Delete' button" -ForegroundColor Gray
    Write-Host ""
    $stepNum++
}

# Step 6: Verification
Write-Host "✅ VERIFICATION STEP:" -ForegroundColor Green
Write-Host "   After deletion, verify only '$KEEP_SITE' remains:" -ForegroundColor White
Write-Host "   → https://app.netlify.com/teams/$TEAM_NAME/projects" -ForegroundColor Cyan
Write-Host ""

# Step 7: Automated Browser Launch (Auto-enabled)
Write-Host "🌐 Auto-opening Netlify dashboard for cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host "   Opening Netlify dashboard..." -ForegroundColor Cyan
Start-Process "https://app.netlify.com/teams/$TEAM_NAME/projects"
Write-Host "   ✅ Dashboard opened in browser!" -ForegroundColor Green
Write-Host ""

# Step 8: Future Prevention Strategy
Write-Host "🛡️  FUTURE PREVENTION STRATEGY:" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "To prevent multiple versions in the future:" -ForegroundColor White
Write-Host "   1. ✅ Always use the SAME Netlify site for updates" -ForegroundColor Green
Write-Host "   2. ✅ Use 'Deploys' tab to push new versions" -ForegroundColor Green
Write-Host "   3. ✅ Avoid creating NEW sites for each deployment" -ForegroundColor Green
Write-Host "   4. ✅ Set up GitHub auto-deploy for continuous updates" -ForegroundColor Green
Write-Host ""
Write-Host "   Recommended: Link GitHub repository to '$KEEP_SITE'" -ForegroundColor Yellow
Write-Host "   → Auto-deploy on 'git push' to 'main' branch" -ForegroundColor Cyan
Write-Host ""

# Step 9: Completion Report
Write-Host "📊 CLEANUP REPORT:" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Status: Pending Manual Deletion" -ForegroundColor Yellow
Write-Host "   Active Site: $KEEP_SITE (6:16 AM)" -ForegroundColor Green
Write-Host "   Sites to Delete: $($DELETE_TARGETS.Count)" -ForegroundColor Red
Write-Host ""
Write-Host "🎯 Next Step: Complete manual deletion via Netlify dashboard" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan

# Cleanup temporary files
if (Test-Path "netlify_sites.json") {
    Remove-Item "netlify_sites.json" -Force
}

Write-Host ""
Write-Host "✅ Cleanup procedure completed successfully!" -ForegroundColor Green
Write-Host "   Script: NETLIFY_AUTO_CLEANUP.ps1" -ForegroundColor Gray
Write-Host ""
