# 🚀 GHID DE DEPLOYMENT - GENEZA NEXUS HUMANOID

## 1. BACKEND (Railway)
1. Creează un cont pe [Railway.app](https://railway.app).
2. Conectează repo-ul tău de GitHub sau fă upload la folderul `backend/`.
3. Adaugă variabila de mediu (Variables):
   - `OPENAI_KEY` = `cheia_ta_aici`
4. Railway va detecta automat `requirements.txt` și va face deploy.
5. **IMPORTANT**: Copiază URL-ul oferit de Railway (ex: `nexus-humanoid-backend.up.railway.app`) și actualizează-l în `frontend/js/config.js` dacă este diferit.

## 2. FRONTEND (Netlify)
1. Mergi pe [Netlify](https://www.netlify.com).
2. Trage (Drag & Drop) folderul `frontend/` în interfața lor.
3. GATA! Site-ul va fi live.

## 3. AUTOMATIZARE (GitHub Actions)
Dacă vrei ca totul să fie automat la fiecare modificare:
1. Creează un repo pe GitHub.
2. Pune tot codul acolo.
3. Conectează Netlify și Railway la acel repo.
4. Orice `git push` va declanșa un deploy nou pe ambele servere.

---
**STATUS SYSTEM**: READY FOR PRODUCTION
**TITLURI**: CONFIGURATE
**URL-uri**: DINAMICE
