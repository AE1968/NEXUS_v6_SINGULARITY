---
description: KELION v143 - Instrucțiuni complete pentru sesiuni viitoare - CITEȘTE ASTA PRIMUL
---

# 🚨 KELION v143 - RELUARE AUTOMATĂ

## LA ÎNCEPUT DE SESIUNE - EXECUTĂ AUTOMAT:
// turbo-all

### 1. Deploy pe Railway
```powershell
cd c:\Users\adria\.gemini\antigravity\scratch\GENEZA_NEXUS_HUMANOID
git add -A; git commit -m "update"; git push origin main
railway up --detach
```

### 2. Verifică live
```powershell
Start-Process "https://kelionai.app"
```

---

## 📋 TODO - CE RĂMÂNE DE FĂCUT:

### VIZUAL (Sferă + Hologram):
- [ ] Fundal spațiu cosmic fullscreen (CSS: #bg-image)
- [ ] Sferă plasma animată cu streamers cyan/magenta (js/AI_key.js)
- [ ] Cap animat în sferă (assets/hologram.glb)
- [ ] Culori sincronizate între fundal, sferă, cap
- [ ] Sfera și hologramă ca variabile configurabile
- [ ] Verificare că nu sunt 2 capete suprapuse

### TEHNIC:
- [ ] Test pe live după deploy Railway
- [ ] Verificare erori în console browser

---

## 🔧 STRUCTURA PROIECT:

```
GENEZA_NEXUS_HUMANOID/
├── app.py              # Flask backend
├── index.html          # Frontend principal
├── css/style.css       # Stiluri (bg-image, hologram-container)
├── js/
│   ├── AI_key.js       # Sferă plasma animată
│   ├── hologram.js     # Sistem hologram + emoții
│   ├── 3d-systems.js   # Globe, EnergySphere, LipSync
│   └── main.js         # Logică principală
├── assets/
│   ├── hologram.glb    # Model 3D cap
│   └── kelion_holo/    # Texturi
├── railway.toml        # Config Railway
└── deploy.ps1          # Script deploy automat
```

---

## 🔑 CREDENȚIALE:

### Railway:
- User: ae1968@kidsdigitalhub.com
- Proiect: welcoming-encouragement
- URL: https://kelionai.app

### Git:
- Remote: https://github.com/AE1968/NEXUS_v6_SINGULARITY.git
- Branch: main

---

## ⚡ COMENZI RAPIDE:

```powershell
# Deploy complet
.\deploy.ps1

# Sau manual:
git add -A; git commit -m "update"; git push origin main; railway up --detach

# Server local
python app.py
# Apoi: http://localhost:5000
```

---

## ❌ NU FACE:
- NU cere SSH - folosește HTTPS
- NU pierde timp cu autentificări - Railway e logat
- NU întreba - EXECUTĂ direct comenzile de mai sus
