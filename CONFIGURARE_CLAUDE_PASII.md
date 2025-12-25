# 🔑 CONFIGURARE CLAUDE API KEY - GHID PAS-CU-PAS

## ⏱️ Timp necesar: 3-5 minute

---

## 📍 **PASUL 1: Obține API Key de la Anthropic**

### Tab 1 (Anthropic Console):
**URL:** https://console.anthropic.com/settings/keys

1. ✅ **Login sau Sign Up:**
   - Dacă nu ai cont → Click "Sign Up" (gratuit)
   - Dacă ai cont → Login

2. ✅ **Navighează la API Keys:**
   - Sidebar → "API Keys"
   - SAU direct la: https://console.anthropic.com/settings/keys

3. ✅ **Creează Key Nou:**
   - Click buton: **"+ Create Key"**
   - Name: `NEXUS v7.0`
   - Workspace: (default)
   - Click: **"Create Key"**

4. ✅ **Copiază Key-ul:**
   - ⚠️ **IMPORTANT:** Va fi afișat o singură dată!
   - Format: `sk-ant-api03-xxxxxxxxxxxx...`
   - Click: **"Copy"** sau selectează tot textul
   - Salvează temporar în Notepad

**⚠️ CRITICAL:** Nu închide tab-ul până nu configurezi și Railway!

---

## 📍 **PASUL 2: Adaugă API Key în Railway**

### Tab 2 (Railway Variables):
**URL:** https://railway.com/project/695b8855-e63f-4266-84f0-c2e5197f3131/service/.../variables

1. ✅ **Verifică că ești în "Variables" tab:**
   - Ar trebui să vezi lista de variabile existente
   - Exemplu: `GOOGLE_API_KEY`, `PORT`, etc.

2. ✅ **Adaugă Variabilă Nouă:**
   - Click buton: **"+ New Variable"** (top-right)
   - SAU: Click în câmpul de jos unde scrie "Variable name"

3. ✅ **Completează:**
   ```
   Variable name:  ANTHROPIC_API_KEY
   Value:          [paste API key from Anthropic]
   ```
   - **Name:** Scrie EXACT `ANTHROPIC_API_KEY` (case sensitive!)
   - **Value:** Paste key-ul copiat (sk-ant-api03-...)

4. ✅ **Salvează:**
   - Click: **"Add"** sau **"Save"**
   - Railway va afișa: "Variable added successfully"

5. ✅ **Redeploy Automatic:**
   - Railway va detecta schimbarea
   - Va apărea notificare: "Deploying..."
   - Așteaptă 30-60 secunde

6. ✅ **Verifică Deployment:**
   - Status: ar trebui să fie "Active" (verde)
   - Logs: verifică că nu sunt erori
   - Dacă vezi "✅ Claude Sonnet 4.5 ONLINE" în logs → SUCCESS!

---

## 📍 **PASUL 3: Testează Claude pe NEXUS**

### Test în NEXUS Live:
**URL:** https://chipper-melba-0f3b83.netlify.app

1. ✅ **Deschide NEXUS:**
   - Refresh page (Ctrl + Shift + R)
   - Așteaptă 5 secunde pentru auto-config

2. ✅ **Verifică Console (F12):**
   ```
   Ar trebui să vezi:
   🔧 Checking Claude Sonnet 4.5 availability...
   ✅ Claude Sonnet 4.5: ACTIVE  ← ACEST MESAJ!
   ```

3. ✅ **Test Comandă Claude:**
   - Scrie în chat: `nexus:think How does consciousness emerge from neural networks?`
   - Ar trebui să vezi:
     ```
     🧠 ROUTING TO CLAUDE SONNET 4.5 (Complex Query Detected)
     ```
   - Răspuns mai detaliat și profund decât Gemini

4. ✅ **Alternative Test Commands:**
   ```
   nexus:analyze What is the meaning of life?
   explain how quantum computing works
   compare AI vs human intelligence
   ```

---

## ✅ **VERIFICARE FINALĂ:**

### Toate acestea ar trebui să fie TRUE:

- [x] API Key creat la Anthropic
- [x] API Key adăugat în Railway Variables
- [x] Railway redeployed (status: Active)
- [x] Console arată "Claude Sonnet 4.5: ACTIVE"
- [x] Comenzile `nexus:think` funcționează

---

## 🐛 **TROUBLESHOOTING:**

### Problem: "Claude not available"
**Fix:**
1. Verifică Railway Variables → ANTHROPIC_API_KEY există
2. Verifică că key-ul e correct (sk-ant-api03-...)
3. Railway → Manual redeploy (click "Deploy" button)
4. Așteaptă 60 secunde
5. Refresh NEXUS

### Problem: "Invalid API key"
**Fix:**
1. Anthropic Console → Regenerate key
2. Copy new key
3. Railway Variables → Edit ANTHROPIC_API_KEY → Paste new key
4. Wait 60s

### Problem: Railway nu se redeployuiește
**Fix:**
1. Railway Dashboard → Click pe service
2. Deployments tab
3. Click "Redeploy" manual

---

## 💰 **COSTURI (INFORMATIV):**

Claude Sonnet 4.5:
- Input: $3 / 1M tokens
- Output: $15 / 1M tokens
- Thinking (extended): la cost de input

**Exemplu query `nexus:think`:**
- ~5000 thinking tokens + 500 input + 1000 output
- Cost: ~$0.02 per query complexă
- Free tier: $5 credit la început

---

## 📞 **NEED HELP?**

Dacă întâmpini probleme:
1. Verifică Railway logs pentru erori
2. Verifică Anthropic Console pentru usage/limits
3. Run: `python configure_claude.py` pentru diagnostic local

---

**După configurare, Claude va funcționa automat pentru toate comenzile complexe!** ✨

**Data configurării:** 2025-12-20  
**NEXUS Version:** v7.0 TRANSCENDENCE
