---
description: OBLIGATORIU - Procedură Deploy KELION (Railway)
---

# 🚨 REGULĂ OBLIGATORIE PENTRU TOȚI AGENȚII AI 🚨

Această procedură TREBUIE urmată la fiecare deploy. Orice încălcare va cauza erori!

## REGULI DE AUR

### 1. ❌ NICIODATĂ chei API în cod!
API keys (OPENAI_API_KEY, SERPER_API_KEY, etc.) se scriu DOAR în:
**Railway Dashboard → Settings → Variables**

NU în:
- app.py
- config_kelion.py
- start_kelion.ps1
- Niciun alt fișier din repository!

### 2. ✅ Verifică ÎNAINTE de commit
```powershell
# Verifică că nu există chei în cod
Get-ChildItem -Recurse -Include *.py,*.html,*.txt,*.md,*.ps1 | Select-String -Pattern "sk-proj" | Select-Object -First 5
```
Dacă returnează ceva, ELIMINĂ cheile înainte de commit!

### 3. ✅ Procfile OBLIGATORIU
Fișierul `Procfile` TREBUIE să conțină:
```
web: gunicorn app:app --bind 0.0.0.0:$PORT
```
FĂRĂ asta, Railway nu știe pe ce port să asculte și dă "Healthcheck Failed"!

### 4. ✅ Secvența de Deploy
```powershell
# 1. Verifică sintaxa Python
python -m py_compile app.py

# 2. Stage changes
git add .

# 3. Commit
git commit -m "Deploy: <descriere>"

# 4. Push
git push origin main

# 5. Verifică deploy (asteapta 2 min)
Invoke-WebRequest -Uri "https://kelionai.app/debug-health" -Method GET
```

### 5. ✅ Verificare după Deploy
Endpoint-ul `/debug-health` TREBUIE să răspundă cu:
```json
{"status": "alive", "environment": {...}}
```
Dacă returnează HTML, deploy-ul NU s-a finalizat!

## VARIABILE DE MEDIU NECESARE (Railway)
Setează în Railway Dashboard → Variables:
- `OPENAI_API_KEY` = cheia ta OpenAI
- `SERPER_API_KEY` = cheia ta Serper
- `AZURE_SPEECH_KEY` = (opțional) pentru voce Azure
- `AZURE_SPEECH_REGION` = westeurope (dacă ai Azure)

## ORDINE DE PRIORITATE TTS (Voce)
1. Azure (dacă AZURE_SPEECH_KEY există)
2. Google TTS (gTTS) - gratuit, funcționează mereu
3. OpenAI TTS (fallback final)

## LIMBĂ
- Robotul detectează automat limba utilizatorului
- Răspunde în aceeași limbă
- Limba se păstrează până la logout
