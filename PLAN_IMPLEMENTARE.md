# 📋 PLAN IMPLEMENTARE MODULARĂ - NEXUS V1 GOLD RECONSTRUCT

Am salvat toate rutinele vechi în folderul `LIBRARY_MODULES`.
Acum reconstruim robotul pas cu pas, verificând fiecare piesă.

## 📂 ARHIVA DE MODULE (SALVATE)

| Nume Fișier Arhivă | Scop Original | Status Implementare |
|--------------------|---------------|---------------------|
| `LIB_MODUL_CREIER_FRONTEND.js` | Logica de chat, procesare text, state management | ❌ ÎN AȘTEPTARE |
| `LIB_MODUL_VOCE_TTS.js` | Text-to-Speech (Azure/Native Browser) | ❌ ÎN AȘTEPTARE |
| `LIB_MODUL_VIZUAL.js` | Procesare cameră web, recunoaștere facială | ❌ ÎN AȘTEPTARE |
| `LIB_MODUL_BACKEND_AI.py` | Logica server, conexiuni OpenAI/Gemini/Claude | ❌ ÎN AȘTEPTARE |
| `LIB_MODUL_AGENTI.js` | Agenți autonomi (bucla infinită de gândire) | ❌ ÎN AȘTEPTARE |

---

## 🛠️ ORDINE DE IMPLEMENTARE (PROPUSĂ)

Pentru a evita "varza", propun să le implementăm exact în această ordine:

### 1. MODULUL VOCE (TTS) 🗣️
**De ce primul?** Pentru că e cel mai vizibil/audibil și cel mai ușor de testat independent. Putem face robotul să salute.
- [ ] Adaptare cod din `LIB_MODUL_VOCE_TTS.js`
- [ ] Testare (să zică "Salut")

### 2. MODULUL BACKEND (CONNECTION) 🔌
**De ce al doilea?** Avem nevoie de server stabil înainte să punem inteligența.
- [ ] Adaptare cod din `LIB_MODUL_BACKEND_AI.py` (Curățat de erori vechi)
- [ ] Configurare rute corecte

### 3. MODULUL CREIER (AI) 🧠
**Miezul sistemului.**
- [ ] Conectare Backend la OpenAI/Gemini (cu chei valide)
- [ ] Conectare Frontend la Backend

### 4. MODULUL VIZUAL (OPTIONAL) 👁️
- [ ] Adăugare suport cameră

---

**Suntem în stadiul "SHELL" (Carapace Goală).**
Site-ul ar trebui să se încarce instantaneu, fără erori, doar cu avatarul.

Aștept comanda: **"IMPLEMENTEAZĂ MODULUL X"**
