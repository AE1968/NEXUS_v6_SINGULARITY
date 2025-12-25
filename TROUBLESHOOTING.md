# 🔧 KELION AI - TROUBLESHOOTING RAPID

## ❌ PROBLEMĂ: Site-ul nu se deschide

### ✅ SOLUȚIE AUTOMATĂ (Folosește scriptul):

**Rulează:**
```batch
START_KELION_GARANTAT.bat
```

Acest script face automat:
1. ✅ Opreşte procese vechi
2. ✅ Pornește backend-ul Flask
3. ✅ Verifică/pornește ngrok
4. ✅ Deschide site-ul în browser

---

## 🔍 DIAGNOSTIC MANUAL

### **1. Verifică Backend (Port 5000)**

```powershell
# Test conexiune
Test-NetConnection -ComputerName localhost -Port 5000

# SAU
curl http://localhost:5000
```

**Dacă NU funcționează:**
```powershell
# Pornește manual
python app.py
```

**Erori comune:**
- ❌ `config_kelion.py` syntax error → **REPARAT AUTOMAT**
- ❌ Port 5000 ocupat → Rulează: `taskkill /F /IM python.exe`
- ❌ Python nu găsit → Verifică instalare Python

---

### **2. Verifică ngrok (Port 4040)**

```powershell
curl http://localhost:4040/api/tunnels
```

**Dacă NU funcționează:**
```batch
ngrok http 5000
```

---

### **3. Verifică Procese**

```powershell
Get-Process python, ngrok -ErrorAction SilentlyContinue
```

**Trebuie să vezi:**
- ✅ python.exe (Backend Flask)
- ✅ ngrok.exe (Public tunnel)

---

## 🚀 QUICK FIX - 3 COMENZI

```batch
REM 1. Opreşte tot
taskkill /F /IM python.exe /T
taskkill /F /IM ngrok.exe /T

REM 2. Pornește backend
start python app.py

REM 3. Pornește ngrok (după 5 secunde)
timeout /t 5
start ngrok http 5000
```

---

## 🌐 URL-URI DE ACCES

### **LOCAL (de pe PC):**
```
http://localhost:5000
```

### **PUBLIC (de oriunde):**
Verifică ngrok dashboard:
```
http://localhost:4040
```
Caută linia: `Forwarding https://...ngrok-free.dev -> localhost:5000`

**SAU folosește URL-ul cunoscut:**
```
https://raddled-joline-overfruitful.ngrok-free.dev
```
(Acest URL funcționează cât timp ngrok rulează)

---

## ⚠️ PROBLEME FRECVENTE

### **1. "This site can't be reached"**
**Cauză:** Backend-ul nu rulează  
**Soluție:** Rulează `START_KELION_GARANTAT.bat`

### **2. "ERR_CONNECTION_REFUSED"**
**Cauză:** Port 5000 nu e deschis  
**Soluție:** `python app.py` manual

### **3. "ngrok not found"**
**Cauză:** ngrok.exe nu e în PATH  
**Soluție:** Rulează din folder:
```batch
cd C:\Users\adria\.gemini\antigravity\scratch\GENEZA_NEXUS_HUMANOID
.\ngrok.exe http 5000
```

### **4. "Module not found" (Python)**
**Cauză:** Dependencies lipsă  
**Soluție:**
```batch
pip install flask flask-cors anthropic openai
```

### **5. "config_kelion.py SyntaxError"**
**Cauză:** Fișier corupt  
**Soluție:** **DEJA REPARAT AUTOMAT!**

---

## ✅ VERIFICARE COMPLETĂ

Rulează acest script pentru diagnostic:

```powershell
Write-Host "🔍 KELION AI - DIAGNOSTIC" -ForegroundColor Cyan
Write-Host ""

# 1. Backend
Write-Host "[1/3] Backend Flask (port 5000)..." -ForegroundColor Yellow
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:5000" -TimeoutSec 3 -UseBasicParsing
    Write-Host "   ✅ Backend ONLINE" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend OFFLINE" -ForegroundColor Red
    Write-Host "   Soluție: python app.py" -ForegroundColor Yellow
}

# 2. ngrok
Write-Host "[2/3] ngrok tunnel..." -ForegroundColor Yellow
try {
    $ngrok = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 3
    $url = $ngrok.tunnels[0].public_url
    Write-Host "   ✅ ngrok ACTIV: $url" -ForegroundColor Green
} catch {
    Write-Host "   ❌ ngrok OFFLINE" -ForegroundColor Red
    Write-Host "   Soluție: ngrok http 5000" -ForegroundColor Yellow
}

# 3. Procese
Write-Host "[3/3] Procese active..." -ForegroundColor Yellow
$python = Get-Process python -ErrorAction SilentlyContinue
$ngrokProc = Get-Process ngrok -ErrorAction SilentlyContinue

if ($python) { Write-Host "   ✅ Python rulează" -ForegroundColor Green }
else { Write-Host "   ❌ Python NU rulează" -ForegroundColor Red }

if ($ngrokProc) { Write-Host "   ✅ ngrok rulează" -ForegroundColor Green }
else { Write-Host "   ❌ ngrok NU rulează" -ForegroundColor Red }

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
```

---

## 🎯 RECOMANDARE

**Pentru pornire garantată, MEREU folosește:**
```
START_KELION_GARANTAT.bat
```

Acest script:
- ✅ Curăță procese vechi
- ✅ Pornește tot în ordine corectă
- ✅ Verifică că totul merge
- ✅ Deschide site-ul automat

---

**Document creat:** 23 Decembrie 2025  
**Ultima actualizare:** 09:56 UTC  
**Status:** ✅ PROBLEME REZOLVATE
