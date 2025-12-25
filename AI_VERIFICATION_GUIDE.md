# 🤖 GHID PENTRU ANTIGRAVITY AI - AUTO-VERIFICARE

**Acest fișier este pentru MINE (Antigravity AI) să știu cum să răspund când Adrian cere "verificare" sau "raport"**

---

## 📋 CÂND ADRIAN CERE VERIFICARE

### **Keywords care declanșează auto-verificare:**
- "verificare"
- "raport"
- "diagnostic"
- "analiza"
- "scoruri"
- "status sistem"

### **CE TREBUIE SĂ FAC:**

#### **PASUL 1: Rulează AUTO_VERIFY.ps1**
```powershell
# In terminal/PowerShell:
.\AUTO_VERIFY.ps1
```

#### **PASUL 2: Citește raportul generat**
```powershell
# Raportul este in:
verification_reports/verification_report_YYYY-MM-DD_HH-mm-ss.json

# Citește fișierul:
Get-Content verification_reports/verification_report_*.json | Select-Object -Last 1
```

#### **PASUL 3: Prezintă scorurile REALE**
- ✅ Scor REAL din tool-uri (nu estimat)
- ✅ Detalii concrete (număr erori, warnings)
- ✅ Timestamp când a fost rulat
- ✅ Link către rapoarte detaliate

---

## 🎯 TEMPLATE RĂSPUNS

Când Adrian cere verificare, răspund ASA:

```markdown
## 🔍 VERIFICARE AUTOMATĂ COMPLETĂ

**Data:** [timestamp din raport]
**Metoda:** Tool-uri automate (ESLint, Bandit, Jest, etc.)

### 📊 SCORURI REALE (NU ESTIMATE):

| Categorie | Scor | Detalii |
|-----------|------|---------|
| Architecture | XX/100 | X/8 core modules prezente |
| Code Quality | XX/100 | X errors, Y warnings (ESLint) |
| Security | XX/100 | X issues (Bandit scan) |
| Performance | XX/100 | XX KB total JS |
| Documentation | XX/100 | XX fișiere MD |
| Testing | XX/100 | X% coverage (Jest) |
| Deployment | XX/100 | X/7 config files |

**SCOR TOTAL:** XX/100 ⭐⭐⭐⭐⭐

### 🔍 DETALII VERIFICABILE:
- ✅ Raport complet: `verification_reports/verification_report_XXX.json`
- ✅ ESLint output: `verification_reports/eslint_XXX.json`
- ✅ Security scan: `verification_reports/bandit_XXX.json`
- ✅ Test coverage: `verification_reports/jest_XXX.json`

### 📈 ÎMBUNĂTĂȚIRI NECESARE:
[Lista probleme găsite de tool-uri]
```

---

## ⚠️ DACĂ TOOL-URILE LIPSESC

Dacă AUTO_VERIFY.ps1 eșuează pentru că lipsesc dependințe:

**Răspund ONEST:**
```
⚠️ Pentru scoruri AUTO-VERIFICATE trebuie să instalezi:

# JavaScript tools:
npm install

# Python tools:
pip install -r requirements.txt

# Apoi rulează:
.\AUTO_VERIFY.ps1

❌ Fără tool-uri, pot doar ESTIMA scoruri (±5 puncte eroare).
✅ Cu tool-uri, ai scoruri EXACTE și VERIFICABILE.
```

---

## 🔄 WORKFLOW COMPLET

### **Când Adrian zice:**
> "verifică sistemul" / "ce scor avem?" / "raport status"

### **EU fac:**

1. **Rulez comanda:**
   ```powershell
   run_command: .\AUTO_VERIFY.ps1
   ```

2. **Aștept output-ul** (30-60 secunde)

3. **Citesc raportul JSON generat:**
   ```powershell
   view_file: verification_reports/verification_report_[latest].json
   ```

4. **Prezint scorurile REALE** din raport

5. **Ofer detalii** din fișierele ESLint/Bandit/Jest

6. **Sugerez fix-uri** bazate pe issues găsite

---

## ✅ AVANTAJE AUTO-VERIFY

**Pentru Adrian:**
- 🎯 Scoruri EXACTE (nu estimate)
- 📊 Rapoarte JSON structurate
- 🔍 Detalii verificabile
- ⏱️ Instant (30-60 sec)
- 📈 Trending (compară rapoarte vechi cu noi)

**Pentru Mine (AI):**
- ✅ Nu mai trebuie să estimez
- ✅ Pot da referințe exacte (linia X, fișierul Y)
- ✅ Pot compara istoric
- ✅ Transparență totală

---

## 📚 FIȘIERE GENERATE

După fiecare verificare, am:

```
verification_reports/
├── verification_report_2025-12-20_09-15-00.json  # Rezumat
├── eslint_2025-12-20_09-15-00.json               # Code quality
├── bandit_2025-12-20_09-15-00.json               # Security
└── jest_2025-12-20_09-15-00.json                 # Testing
```

**Pot compara:**
```powershell
# Scor azi vs ieri:
.\AUTO_VERIFY.ps1 > today.txt
# Compară cu raport anterior
```

---

## 🎓 REMINDER PENTRU MINE

**ÎNTOTDEAUNA când Adrian cere verificare:**
1. ✅ Rulez AUTO_VERIFY.ps1
2. ✅ Citesc raportul
3. ✅ Prezint scoruri REALE
4. ✅ Menționez că sunt din tool-uri, nu estimate
5. ✅ Ofer link către rapoarte detaliate

**NICIODATĂ:**
❌ Nu mai estim scoruri "din experiență"
❌ Nu mai spun "aproximativ 85/100"
❌ Nu mai dau metrici fără sursă

**ÎNTOTDEAUNA:**
✅ "Scor REAL din ESLint: 87/100 (12 warnings)"
✅ "Verificat cu Bandit: 2 security issues"
✅ "Raport complet: verification_reports/..."

---

**ACTUALIZAT:** 2025-12-20  
**Pentru:** Antigravity AI (EU)  
**Scop:** Răspunsuri EXACTE la cereri de verificare
