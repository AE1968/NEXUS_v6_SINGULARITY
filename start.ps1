# ═══════════════════════════════════════════════════════════
# KELION AI - AUTOMATIC STARTUP SCRIPT
# ═══════════════════════════════════════════════════════════

Write-Host "🚀 KELION SYSTEM - STARTING..." -ForegroundColor Cyan
Write-Host ""

# Function to kill processes on specific port
function Stop-ProcessOnPort {
    param([int]$Port)
    
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($connection) {
            $processId = $connection.OwningProcess
            Write-Host "⚠️  Killing old process on port $Port (PID: $processId)..." -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
    }
    catch {
        # Port not in use, continue
    }
}

# Kill old processes if they exist
Write-Host "🧹 Cleaning old processes..." -ForegroundColor Yellow
Stop-ProcessOnPort -Port 8000
Stop-ProcessOnPort -Port 3000

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""

# Start Backend (Port 8000)
Write-Host "🔧 Starting Backend Server (Port 8000)..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "backend\app.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; python backend/app.py" -WindowStyle Normal

Start-Sleep -Seconds 3

# Verify backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/status" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend ONLINE!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Backend failed to start!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Start Frontend (Port 3000)
Write-Host "🌐 Starting Frontend Server (Port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; python -m http.server 3000" -WindowStyle Normal

Start-Sleep -Seconds 2

# Verify frontend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Frontend ONLINE!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Frontend failed to start!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ KELION SYSTEM FULLY OPERATIONAL" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Backend:  http://localhost:8000/status" -ForegroundColor White
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to open the application in browser..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open browser
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "🎯 Application launched successfully!" -ForegroundColor Green
Write-Host "💡 Tip: Keep both server windows open while using the app." -ForegroundColor Yellow
Write-Host ""
