---
description: Deploy automat KELION pe Railway - folosește la fiecare sesiune
---

# KELION AUTO-DEPLOY WORKFLOW

## La început de sesiune:
// turbo-all

### 1. Verifică starea proiectului
```powershell
cd c:\Users\adria\.gemini\antigravity\scratch\GENEZA_NEXUS_HUMANOID
git status
```

### 2. Deploy rapid (după modificări cod)
```powershell
git add -A; git commit -m "update"; git push origin main; railway up --detach
```

### 3. Verifică site-ul live
```powershell
Start-Process "https://kelionai.app"
```

## Credențiale Railway:
- User: ae1968@kidsdigitalhub.com
- Proiect: welcoming-encouragement
- Serviciu: flask
- URL: https://kelionai.app

## Git Remote:
- origin: https://github.com/AE1968/NEXUS_v6_SINGULARITY.git
- branch: main

## Note importante:
- Railway CLI e instalat via scoop
- Railway login e deja făcut
- Proiectul e linkat la Railway
- NU mai cere SSH - folosește HTTPS
