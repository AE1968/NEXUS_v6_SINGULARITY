# 📖 NEXUS v7.0 - COMENZI UTILIZATOR (READ-ONLY)

**Acces:** UTILIZATOR STANDARD  
**Permisiuni:** Citire comenzi, execuție comenzi standard (fără modificări sistem)  
**Versiune:** 7.0.0 TRANSCENDENCE

---

## ⚙️ **COMENZI GENERALE**

| Comandă | Descriere | Categorie |
|---------|-----------|-----------|
| `hello` / `hi` / `salut` | Salut simplu, răspuns rapid | Fast Response |
| `status` | Verificare status sistem | Fast Response |

---

## 🧠 **COMENZI ÎNVĂȚARE**

| Comandă | Descriere | Exemplu |
|---------|-----------|---------|
| `learn: <fact>` | Învățare explicită (EN) | `learn: The sky is blue` |
| `invata: <fact>` | Învățare explicită (RO) | `invata: Adrian iubeste AI` |
| `memoreaza: <fact>` | Memorare (RO) | `memoreaza: Pizza e favorita` |
| _Implicit learning_ | Detectare automată | "I like pizza" → auto-stored |

**Exemple pattern-uri detectate automat:**
- "I like..." / "Imi place..."
- "My name is..." / "Numele meu este..."
- "I am..." / "Sunt..."

---

## 👁️ **COMENZI VEDERE (VISION)**

| Comandă | Descriere | Necesită |
|---------|-----------|----------|
| `vision on` | Activează webcam | Permisiune cameră |
| `vision off` | Dezactivează webcam | - |
| `ce vezi` / `what do you see` | Analiză vizuală | Vision ON |
| `scan` | Scanare facială | Vision ON |

**Note:**
- Necesită permisiune browser pentru cameră
- Face-api.js v0.22.2 pentru recunoaștere facială
- Detectare emoții: happy, sad, neutral

---

## 🏠 **COMENZI IoT (SMART HOME)**

| Comandă | Descriere | Dispozitiv |
|---------|-----------|------------|
| `turn on light` | Aprinde lumina | light_1 |
| `turn off light` | Stinge lumina | light_1 |
| `turn on music` / `audio` | Pornește difuzor | speaker_1 |
| `turn off music` / `audio` | Oprește difuzor | speaker_1 |

**Extindere dispozitive:**
- Adaugă dispozitive prin `window.NexusIoT.registerDevice()`
- Suportă: lights, speakers, thermostats, locks

---

## 🧬 **COMENZI v7.0 (DEEP THINKING)**

### **Activare Claude Sonnet 4.5:**

| Comandă | Descriere | Brain Folosit |
|---------|-----------|---------------|
| `nexus:think <question>` | Raționament profund | Claude Sonnet 4.5 ⚡ |
| `nexus:analyze <data>` | Analiză de date | Claude Sonnet 4.5 ⚡ |
| `nexus:code <task>` | Coding autonom | Claude Sonnet 4.5 ⚡ |

### **Auto-Routing la Claude:**

Următoarele pattern-uri activează automat Claude:
- `explain how...` → Explicație complexă
- `why does...` → Raționament cauzal
- `compare...` → Analiză comparativă
- `evaluate...` → Evaluare critică
- `design...` → Design thinking

**⚠️ Important:** 
- Claude Sonnet 4.5 necesită API key (configurat de admin)
- Fallback automat la Gemini 2.0 dacă Claude indisponibil
- Extended thinking: 5000 tokeni pentru raționament profund

---

## 📊 **STATUS MODULE (READ-ONLY)**

| Modul | Fișier | Status |
|-------|--------|--------|
| 👁️ Vision | `nexus_vision.js` | ✅ ACTIV |
| 🎤 Voice | `nexus_voice_core.js` | ✅ ACTIV |
| 🧠 Memory | `nexus_memory_vector.js` | ✅ ACTIV |
| 🧬 BioMatrix | `nexus_biomatrix.js` | ✅ ACTIV |
| 🤖 Agenți | `nexus_agents.js` | ✅ ACTIV |
| 🏠 IoT | `nexus_iot.js` | ✅ ACTIV |
| ☁️ Claude | `backend.py` | ⚠️ API KEY NEEDED |
| ☁️ Gemini | `backend.py` | ✅ ACTIV |

---

## 🎯 **EXEMPLE DE UTILIZARE**

### **1. Conversație simplă:**
```
User: hello
Nexus: Hello, Adrian! Systems nominal.
```

### **2. Învățare explicită:**
```
User: learn: Paris is the capital of France
Nexus: 🧠 ACQUIRED KNOWLEDGE: "Paris is the capital of France"
```

### **3. Activare vedere:**
```
User: vision on
Nexus: 👁️ Visual Cortex activated
User: what do you see
Nexus: I see: {"name": "Adrian", "emotion": "happy"}
```

### **4. Control IoT:**
```
User: turn on light
Nexus: Executing Home Control: Device light_1 → ON
```

### **5. Deep Thinking (v7.0):**
```
User: nexus:think How does consciousness emerge?
Nexus: 🧠 ACTIVATING CLAUDE EXTENDED THINKING MODE...
[Răspuns profund cu 5000 tokeni thinking budget]
```

---

## ⚠️ **RESTRICȚII UTILIZATOR**

### **NU AI ACCES LA:**
- ❌ Comenzi admin (`raport stare`, `autoreparare`, `arata loguri`)
- ❌ Modificare parametri sistem
- ❌ Acces loguri securitate (doar Architect)
- ❌ Test lie/truth protocols
- ❌ Configurare API keys

### **AI ACCES LA:**
- ✅ Toate comenzile de conversație
- ✅ Învățare și memorare
- ✅ Control IoT (dispozitive autorizate)
- ✅ Activare vision/voice
- ✅ Deep thinking cu Claude (dacă configurat)
- ✅ Vizualizare status module (read-only)

---

## 📝 **NOTE IMPORTANTE**

1. **Permisiuni Browser:**
   - Cameră: necesară pentru `vision on`
   - Microfon: opțional pentru voice input (viitor)

2. **Privacy:**
   - Face recognition local (nu se trimite în cloud)
   - Memoriile tale sunt private în localStorage
   - Cloud sync opțional (configurat de admin)

3. **Fallback Systems:**
   - Claude indisponibil → Gemini 2.0
   - Cloud offline → Processing local (limitat)
   - Energy low → Reduced responsiveness

4. **BioMatrix:**
   - Nexus simulează stări biologice (dopamine, serotonin)
   - Poate "adormi" dacă energy scade prea mult
   - Reactivare cu comandă sau interacțiune

---

## 🆘 **HELP & SUPPORT**

### **În caz de probleme:**

1. **Nexus nu răspunde:**
   - Verifică status: `status`
   - Cloud connection: Verifică internet
   - Refresh page dacă blocat

2. **Vision nu funcționează:**
   - Verifică permisiune cameră în browser
   - `vision off` → `vision on` pentru restart
   - Face-api.js loading time: wait 5-10s

3. **Claude returns error:**
   - Fallback automat la Gemini 2.0
   - Admin trebuie să configureze API key
   - Verifică în console: "⚠️ Claude unavailable"

---

**Ultima actualizare:** 2025-12-20T07:10:00Z  
**Versiune:** v7.0.0 TRANSCENDENCE  
**Nivel acces:** UTILIZATOR STANDARD
