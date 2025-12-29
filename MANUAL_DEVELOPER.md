# KELION v143.0 — Manual pentru Devoloperi

Acest document explică arhitectura internă a KELION v143.0 și ghidul de integrare pentru noile module.

## 1. Arhitectura Modulară
Sistemul nu mai este monolitic. Logica este distribuită în fișiere JS specializate, care comunică prin `state` global și `EventBus` (din `core.js`).

### Ordinea de încărcare (CRITICĂ)
1. **`core.js`**: Inițializează `state`, `KELION_CONFIG`, `EventBus`. Trebuie încărcat PRIMUL.
2. **`session.js`**: Citește `state`, gestionează autentificarea.
3. **`chat.js`**: Folosește `state.user`, `state.language`.
4. **`tts.js`**: Se leagă de `state.voice`.
5. **`admin.js`**: Verifică `state.isAdmin`.
6. **`network.js`**: (Independent) dar poate loga în Admin.
7. **`ui.js`**: Leagă toate elementele vizuale. Se încarcă ULTIMUL.

## 2. API-ul Intern
### State Global (`state`)
Accesibil oriunde după încărcarea `core.js`.
```javascript
state.isLogged      // boolean
state.isAdmin       // boolean
state.user          // string ("Architect", etc.)
state.voice         // boolean (TTS enabled?)
state.language      // string (detected "ro", "en", etc.)
state.isFirstMessage // boolean
```

### Funcții Utilitare
- `$(id)`: Selector rapid `document.getElementById`.
- `write(who, text, isError)`: Scrie mesaj în chat.
- `speak(text)`: Sintetizează voce (dacă e activată).
- `adminLog(text)`: Scrie în consola admin (dacă e deschisă).

## 3. Integrarea cu HTML
HTML-ul (`index.html`) trebuie să fie un schelet care conține ID-urile așteptate de module.
**Nu scrie logică JS inline în HTML!** Folosește `document.addEventListener("DOMContentLoaded")` în fișierele modulelor.

### ID-uri Cheie necesare în DOM:
- `#chat-container`, `#chat-messages`, `#chat-input`, `#send-btn`
- `#login-modal`, `#login-btn`, `#do-login`, `#u-input`, `#p-input`
- `#traffic-btn`, `#admin-modal`, `#admin-logs`, `#ip-table-body`, `#traffic-canvas`
- `#voice-toggle-btn`, `#ai-orb`

## 4. Extindere
Pentru a adăuga o funcționalitate nouă (ex: `memory.js`):
1. Creează `js/memory.js`.
2. Ascultă `core-ready` sau `DOMContentLoaded`.
3. Adaugă `<script src="js/memory.js"></script>` în `index.html` după `core.js`.

---
© 2025 KELION Dev Team. Confidențial.
