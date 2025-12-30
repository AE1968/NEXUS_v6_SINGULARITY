---
description: KELION v142 - Lista Completă de Implementare și Roadmap
---

# 🚀 KELION v142 - ROADMAP COMPLET DE DEZVOLTARE

**Ultima actualizare:** 30 Decembrie 2025  
**Status General:** 🔴 SITE OFFLINE (DNS nu rezolvă kelionai.app)

---

## 🔴 PROBLEMA CRITICĂ #0: SITE OFFLINE

### Diagnostic:
- **Eroare:** `dial tcp: lookup kelionai.app: no such host`
- **Cauză posibilă:** 
  1. Railway nu mai servește aplicația (deployment inactiv/șters)
  2. DNS Cloudflare nu mai pointează către Railway
  3. Contul Railway a expirat sau a fost suspendat

### Acțiuni Necesare:
1. [ ] Verifică statusul deployment-ului în Railway Dashboard
2. [ ] Verifică înregistrările DNS în Cloudflare pentru `kelionai.app`
3. [ ] Re-deploy aplicația dacă e necesar
4. [ ] Testează accesul după remediere

---

## 📋 LISTA COMPLETĂ DE CERINȚE

### 1. 🗄️ Bază de Date Client (COMPLETĂ)
- [ ] Formular de înregistrare complet:
  - Nume, Prenume (validare)
  - Adresă completă în funcție de țară
  - Prefix țară (selectabil dinamic)
  - Număr de telefon (format internațional)
- [ ] Verificare/Validare identitate:
  - Prin bancă (3D Secure / Open Banking)
  - Prin SMS (OTP la numărul de telefon)
- [ ] Recuperare parolă uitată (email + cod securitate)
- [ ] Securitate maximă a bazei de date (hashing, encryption)

### 2. 📧 Integrare Email Admin
- [ ] Legare `contact@kelionai.app` de aplicație
- [ ] Configurare SMTP sub contul admin
- [ ] Notificări automate pentru mesaje noi
- [ ] Template-uri email profesionale

### 3. 🧪 Testare Funcționalități KELION AI
- [ ] Teste automate pentru API-uri:
  - `/api/chat` - răspunsuri corecte
  - `/api/search` - căutare internet funcțională
- [ ] Detectare automată a limbii (scris și vorbit)
- [ ] Schimbare dinamică a limbii în conversație
- [ ] Validare răspunsuri multilingve

### 4. 📊 Panou Admin - Trafic Live
- [ ] Vizualizare timp real a vizitatorilor
- [ ] Bază de date calendristică:
  - An / Lună / Zi / Oră
  - IP, Locație, Browser
- [ ] Grafice și statistici
- [ ] Export date (CSV/Excel)

### 5. 💳 Sistem Abonamente

#### Planuri de Prețuri:
| Plan | Preț/Lună | Mod Plată |
|------|-----------|-----------|
| 1 Lună | £10 | Plată integrală |
| 6 Luni | £7/lună | Plată integrală (£42 total) |
| 12 Luni | £5/lună | Plată integrală (£60 total) |

- [ ] Implementare sistem de planuri
- [ ] Calcul automat discount
- [ ] Afișare economie la planuri lungi

### 6. 🎟️ Sistem Coduri Voucher
- [ ] Generare coduri unice cu valoare de 1 lună
- [ ] Câmp de introducere cod pe pagina de plăți
- [ ] Validare cod în timp real
- [ ] Activare automată abonament după cod valid

### 7. 📝 Evidență Coduri Voucher
- [ ] Bază de date pentru coduri:
  - Cod generat
  - Data creării
  - Cui a fost alocat
  - Status (folosit/neutilizat)
- [ ] Limită: MAX 3 vouchere per user
- [ ] Raport admin pentru coduri

### 8. 💰 Integrare PayPal
- [ ] Activare PayPal payments (avem datele salvate)
- [ ] Sandbox → Live switch
- [ ] Webhook-uri pentru confirmare plată
- [ ] Gestionare subscripții recurente

### 9. 🔒 Plăți Online Securizate
- [ ] Integrare gateway plăți 100% securizat
- [ ] SSL/TLS obligatoriu
- [ ] PCI DSS compliance
- [ ] Opțiuni multiple: Card, PayPal, etc.

### 10. ✉️ Email Confirmare Plată
- [ ] Trimitere automată email când banii sunt încasați
- [ ] Detalii incluse:
  - Sumă plătită
  - Perioadă abonament
  - Data expirării
  - Factura/Receipt

### 11. ⏰ Sistem Avertizare Expirare
- [ ] Notificare email cu 2 zile înainte de expirare
- [ ] Opțiune reactivare abonament expirat
- [ ] Link direct către pagina de plăți
- [ ] Reminder pentru subscripții oprite

### 12. ⚖️ Conformitate Legală AI
- [ ] Respectare legi protecție copii (COPPA, UK Online Safety)
- [ ] Blocarea materialelor interzise
- [ ] AI NU furnizează informații personale
- [ ] Conformitate GDPR (UE) și legislație internațională
- [ ] Blocarea ajutorului pentru activități de hacking
- [ ] Termeni și Condiții actualizați
- [ ] Politică de Confidențialitate

### 13. 🤖 Animație Facială Robot
- [ ] Cercetare funcție lip-sync (modulare față în ritmul vocii)
- [ ] Integrare librărie de animație (ex: Three.js, Lottie)
- [ ] Sincronizare mișcare buze cu output audio TTS

### 14. 🛡️ Securitate Avansată Site
- [ ] Protecție împotriva copierii conținutului
- [ ] Dezactivare click-dreapta (context menu)
- [ ] Blocarea capturilor de ecran pentru useri normali
- [ ] Admin: poate face capturi pentru mentenanță
- [ ] Watermarking dinamic (opțional)
- [ ] Rate limiting pentru API-uri
- [ ] Protecție DDoS

---

## 📅 ORDINE PRIORITARĂ DE IMPLEMENTARE

### Sprint 1: URGENT (Restaurare Site)
1. Fix DNS/Railway - site online
2. Testare funcționare curentă

### Sprint 2: Fundament (Bază & Securitate)
3. Bază de date client completă
4. Sistem autentificare robust
5. Conformitate legală de bază

### Sprint 3: Monetizare
6. Sistem abonamente
7. Integrare PayPal live
8. Sistem voucher-coduri
9. Email-uri automate plăți

### Sprint 4: Admin & Monitorizare
10. Panou admin trafic live
11. Statistici și rapoarte
12. Sistem notificări expirare

### Sprint 5: Polish & Avansate
13. Animație lip-sync robot
14. Securitate anti-copiere
15. Optimizări finale

---

## 🔧 NOTIȚE TEHNICE

### Fișiere Cheie:
- `app.py` - Backend Flask principal
- `index.html` / `KELION_v142_STABLE.html` - Frontend
- `nexus.db` - Bază de date SQLite actuală

### Environment Variables Necesare (Railway):
```
SECRET_KEY=...
OPENAI_API_KEY=...
SERPER_API_KEY=...
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
SMTP_EMAIL=contact@kelionai.app
SMTP_PASSWORD=...
SMTP_SERVER=smtp.gmail.com (sau alt server)
```

### Dependințe de Adăugat:
- `stripe` sau alt gateway de plăți (opțional, pe lângă PayPal)
- `phonenumbers` - validare numere telefon internaționale
- `pycountry` - lista țărilor și prefixe

---

**Document creat pentru tracking și implementare progresivă.**
