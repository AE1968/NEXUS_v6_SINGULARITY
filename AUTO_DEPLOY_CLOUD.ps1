# KELIONAI.APP - AUTO DEPLOYMENT SCRIPT
# Deployment complet pe Railway + Netlify

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "║     🚀 KELIONAI.APP - CLOUD AUTO DEPLOYMENT 🚀        ║" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "║     Independent de PC - 24/7 ONLINE                   ║" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ProjectPath = $PSScriptRoot

# ═══════════════════════════════════════════════════════════
# STEP 1: VERIFICARE FIȘIERE
# ═══════════════════════════════════════════════════════════
Write-Host "[1/6] Verificare fișiere necesare..." -ForegroundColor Yellow

$requiredFiles = @(
    "app.py",
    "index.html",
    "requirements.txt",
    "Procfile",
    "runtime.txt"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path "$ProjectPath\$file") {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file MISSING!" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "❌ Lipsesc fișiere necesare! Deployment oprit." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "   ✅ Toate fișierele există!" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════
# STEP 2: CREARE FOLDER FRONTEND
# ═══════════════════════════════════════════════════════════
Write-Host "[2/6] Pregătire frontend pentru Netlify..." -ForegroundColor Yellow

$frontendPath = "$ProjectPath\frontend_deploy"

if (Test-Path $frontendPath) {
    Remove-Item $frontendPath -Recurse -Force
}

New-Item -ItemType Directory -Path $frontendPath | Out-Null

# Copiază fișiere frontend
$frontendFiles = @("index.html", "ae_contact_admin.html", "admin_analytics.html")
foreach ($file in $frontendFiles) {
    if (Test-Path "$ProjectPath\$file") {
        Copy-Item "$ProjectPath\$file" -Destination $frontendPath -Force
        Write-Host "   ✅ $file copiat" -ForegroundColor Green
    }
}

# Copiază directoare
$frontendDirs = @("assets", "css", "js")
foreach ($dir in $frontendDirs) {
    if (Test-Path "$ProjectPath\$dir") {
        Copy-Item "$ProjectPath\$dir" -Destination "$frontendPath\$dir" -Recurse -Force
        Write-Host "   ✅ $dir copiat" -ForegroundColor Green
    }
}

# Creează _redirects pentru Netlify SPA routing
@"
/*    /index.html   200
"@ | Set-Content -Path "$frontendPath\_redirects"

Write-Host "   ✅ Frontend pregătit în: frontend_deploy\" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════
# STEP 3: DESCHIDE RAILWAY PENTRU BACKEND
# ═══════════════════════════════════════════════════════════
Write-Host "[3/6] Deschidere Railway pentru Backend deployment..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   📋 INSTRUCȚIUNI RAILWAY:" -ForegroundColor Cyan
Write-Host "   1. Login cu GitHub (ae1968@kidsdigitalhub.com)" -ForegroundColor White
Write-Host "   2. Click 'New Project' → 'Deploy from GitHub repo'" -ForegroundColor White
Write-Host "   3. SAU: 'Empty Project' → Deploy from local files" -ForegroundColor White
Write-Host "   4. Selectează folder: $ProjectPath" -ForegroundColor White
Write-Host "   5. Railway va detecta automat Python app" -ForegroundColor White
Write-Host "   6. Adaugă Environment Variables:" -ForegroundColor White
Write-Host "      - ANTHROPIC_API_KEY" -ForegroundColor Gray
Write-Host "      - OPENAI_API_KEY" -ForegroundColor Gray
Write-Host "      - SECRET_KEY = kelion-secret-2025" -ForegroundColor Gray
Write-Host "      - FLASK_ENV = production" -ForegroundColor Gray
Write-Host "   7. Deploy!" -ForegroundColor White
Write-Host ""

Start-Sleep -Seconds 2
Start-Process "https://railway.app/new"

Write-Host "   ⏳ Aștept 10 secunde să te loghezi în Railway..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host ""

# ═══════════════════════════════════════════════════════════
# STEP 4: DESCHIDE NETLIFY PENTRU FRONTEND
# ═══════════════════════════════════════════════════════════
Write-Host "[4/6] Deschidere Netlify pentru Frontend deployment..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   📋 INSTRUCȚIUNI NETLIFY:" -ForegroundColor Cyan
Write-Host "   1. Login cu GitHub (ae1968@kidsdigitalhub.com)" -ForegroundColor White
Write-Host "   2. Drag & Drop folder: $frontendPath" -ForegroundColor White
Write-Host "   3. SAU: Click 'Add new site' → Deploy manually" -ForegroundColor White
Write-Host "   4. Așteaptă deployment să se termine" -ForegroundColor White
Write-Host "   5. Notează URL-ul: https://[random].netlify.app" -ForegroundColor White
Write-Host ""

Start-Sleep -Seconds 2
Start-Process "https://app.netlify.com/drop"

Write-Host "   💡 Folder pregătit: $frontendPath" -ForegroundColor Green
Write-Host "   ⏳ Aștept 10 secunde să faci drag-drop..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host ""

# ═══════════════════════════════════════════════════════════
# STEP 5: CONFIGURARE DNS NAMECHEAP
# ═══════════════════════════════════════════════════════════
Write-Host "[5/6] Instrucțiuni DNS pentru Namecheap..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   🌐 DESCHID NAMECHEAP DNS PANEL..." -ForegroundColor Cyan

Start-Process "https://ap.www.namecheap.com/domains/domaincontrolpanel/kelionai.app/advancedns"

Write-Host ""
Write-Host "   📋 CONFIGURARE DNS în Namecheap:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   A. Pentru Backend (api.kelionai.app → Railway):" -ForegroundColor White
Write-Host "      1. În Railway: Settings → Domains → Add 'api.kelionai.app'" -ForegroundColor Gray
Write-Host "      2. Railway îți dă un CNAME (copiază-l)" -ForegroundColor Gray
Write-Host "      3. În Namecheap Advanced DNS:" -ForegroundColor Gray
Write-Host "         Type: CNAME" -ForegroundColor Gray
Write-Host "         Host: api" -ForegroundColor Gray
Write-Host "         Target: [CNAME de la Railway]" -ForegroundColor Gray
Write-Host "         TTL: Automatic" -ForegroundColor Gray
Write-Host ""
Write-Host "   B. Pentru Frontend (kelionai.app → Netlify):" -ForegroundColor White
Write-Host "      1. În Netlify: Domain Settings → Add 'kelionai.app'" -ForegroundColor Gray
Write-Host "      2. În Namecheap Advanced DNS:" -ForegroundColor Gray
Write-Host "         Type: A Record" -ForegroundColor Gray
Write-Host "         Host: @" -ForegroundColor Gray
Write-Host "         Target: 75.2.60.5 (Netlify IP)" -ForegroundColor Gray
Write-Host "         TTL: Automatic" -ForegroundColor Gray
Write-Host ""
Write-Host "         Type: CNAME" -ForegroundColor Gray
Write-Host "         Host: www" -ForegroundColor Gray
Write-Host "         Target: [your-site].netlify.app" -ForegroundColor Gray
Write-Host "         TTL: Automatic" -ForegroundColor Gray
Write-Host ""

# ═══════════════════════════════════════════════════════════
# STEP 6: ACTUALIZARE API_URL ÎN FRONTEND
# ═══════════════════════════════════════════════════════════
Write-Host "[6/6] IMPORTANT: Actualizare API_URL..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   ⚠️  DUPĂ CE OBȚII URL-ul RAILWAY:" -ForegroundColor Red
Write-Host ""
Write-Host "   1. Copiază URL-ul Railway (ex: https://kelion.up.railway.app)" -ForegroundColor White
Write-Host "   2. Editează $frontendPath\index.html" -ForegroundColor White
Write-Host "   3. Caută: const API_URL = " -ForegroundColor White
Write-Host "   4. Înlocuiește cu: const API_URL = '[URL-ul Railway]';" -ForegroundColor White
Write-Host "   5. Salvează și RE-DEPLOY pe Netlify!!!" -ForegroundColor White
Write-Host ""

# ═══════════════════════════════════════════════════════════
# FINAL: REZUMAT
# ═══════════════════════════════════════════════════════════
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║           ✅ DEPLOYMENT PREGĂTIT! ✅                   ║" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📋 CHECKLIST FINAL:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Backend (Railway):" -ForegroundColor White
Write-Host "   [ ] Deploy app.py pe Railway" -ForegroundColor Gray
Write-Host "   [ ] Setează Environment Variables" -ForegroundColor Gray
Write-Host "   [ ] Obține URL backend" -ForegroundColor Gray
Write-Host "   [ ] Adaugă custom domain: api.kelionai.app" -ForegroundColor Gray
Write-Host ""
Write-Host "   Frontend (Netlify):" -ForegroundColor White
Write-Host "   [ ] Drag folder frontend_deploy/ pe Netlify" -ForegroundColor Gray
Write-Host "   [ ] Actualizează API_URL cu Railway URL" -ForegroundColor Gray
Write-Host "   [ ] Re-deploy după actualizare" -ForegroundColor Gray
Write-Host "   [ ] Adaugă custom domain: kelionai.app" -ForegroundColor Gray
Write-Host ""
Write-Host "   DNS (Namecheap):" -ForegroundColor White
Write-Host "   [ ] CNAME: api → Railway domain" -ForegroundColor Gray
Write-Host "   [ ] A Record: @ → 75.2.60.5" -ForegroundColor Gray
Write-Host "   [ ] CNAME: www → Netlify domain" -ForegroundColor Gray
Write-Host ""
Write-Host "   Testare:" -ForegroundColor White
Write-Host "   [ ] https://api.kelionai.app funcționează" -ForegroundColor Gray
Write-Host "   [ ] https://kelionai.app se încarcă" -ForegroundColor Gray
Write-Host "   [ ] Chat AI funcționează" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 DUPĂ FINALIZARE, KELIONAI.APP VA FI LIVE 24/7!" -ForegroundColor Green
Write-Host "   Independent de PC, GRATIS, SSL inclus!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Frontend folder: $frontendPath" -ForegroundColor Cyan
Write-Host "📝 Environment Variables: Vezi .env.example" -ForegroundColor Cyan
Write-Host ""
pause
