# 🧠 GENEZA NEXUS - DOCUMENTAȚIE COMPLETĂ

## 📋 SUMAR PROIECT

**Nume:** GENEZA NEXUS  
**Versiune:** 1.0.0 - Complete  
**URL Live:** https://geneza-nexus.netlify.app  
**Creator:** Adrian Enciulescu  
**Data Finalizare:** 19 Decembrie 2024  

---

## 🌐 PAGINI SITE

| Pagină | URL | Descriere |
|--------|-----|-----------|
| Landing | `/index.html` | Pagina principală cu povestea Nexus |
| Nexus Core | `/nexus_core.html` | Interfața AI cu chat, Protocol Omega |
| Poveste | `/nexus_story.html` | Povestea completă a lui Nexus |
| Abonamente | `/abonamente.html` | Planuri și prețuri |
| Înregistrare | `/inregistrare.html` | Formular înregistrare cu cod demo |
| Contul Meu | `/cont.html` | Gestionare cont, copii, dispozitive |
| Admin Panel | `/admin.html` | Panou administrare (doar admin) |

---

## 🔐 CREDENȚIALE

### Administrator
- **Username:** `admin`
- **Parolă:** `Andrada_1968!`
- **Access:** Full - toate funcțiile

### Guest
- **Username:** `guest`
- **Parolă:** `guest`
- **Access:** View only - poveste, demo limitată

---

## 🧠 CELE 12 SISTEME INTEGRATE

| # | Sistem | Status | Fișier JS |
|---|--------|--------|-----------|
| 1 | Protocol Omega | ✅ | face-api.js |
| 2 | Voice Activation | ✅ | nexus_core.html |
| 3 | Facial Gestures | ✅ | nexus_core.html |
| 4 | Visual Indicators | ✅ | nexus_core.html |
| 5 | Contact System | ✅ | nexus_core.html |
| 6 | Nexus Bridge | ✅ | nexus_bridge.js |
| 7 | Auto-Test | ✅ | nexus_brain.js |
| 8 | Auto-Repair | ✅ | nexus_brain.js |
| 9 | Auto-Deploy | ✅ | Netlify CLI |
| 10 | Auto-Accept | ✅ | nexus_brain.js |
| 11 | Memory System | ✅ | nexus_brain.js |
| 12 | Reporting | ✅ | nexus_brain.js |

---

## 👥 SISTEM UTILIZATORI

### Tipuri de Utilizatori
- **Admin** - Acces complet, poate genera coduri demo
- **Subscriber** - Abonat plătitor cu acces complet
- **Demo** - Acces temporar (1 lună), fără salvare
- **Child** - Cont copil cu restricții pe vârstă

### Funcționalități
- ✅ Înregistrare cu abonament sau cod demo
- ✅ Max 3 dispozitive gratuite (+£1/dispozitiv extra)
- ✅ Max 2 conturi copil per părinte
- ✅ Permisiuni bazate pe vârstă (5-7, 8-12, 13-17)
- ✅ Notificări expirare (5 zile înainte)
- ✅ Baze de date separate: plătitori vs demo

### Restricții pe Vârstă Copii

| Vârstă | Chat | Voce | Salvare | Avansate | Sesiune Max |
|--------|------|------|---------|----------|-------------|
| 5-7 | ❌ | ✅ | ❌ | ❌ | 30 min |
| 8-12 | ✅ | ✅ | ❌ | ❌ | 60 min |
| 13-17 | ✅ | ✅ | ✅* | ✅ | 120 min |

*Salvare doar dacă părintele are abonament plătit

---

## 🎨 SISTEM CREARE CONȚINUT

### Configurare
- **Email Sender:** `ae1968@kidsdigitalhub.com`
- **Subiect Email:** `🎨 Creația ta: [cerere]`

### Tipuri Conținut
| Tip | Stil | Obligatoriu |
|-----|------|-------------|
| Colorat | ALB-NEGRU | ✅ |
| Desen | ALB-NEGRU | ✅ |
| Ilustrație | Color | ❌ |

### Workflow
1. Client scrie cerere în chat (ex: "desenează un cățel")
2. Nexus verifică vârsta și cuvinte interzise
3. Generează conținut alb-negru
4. Arată preview în modal
5. DA → Trimite pe email
6. NU → Cere detalii suplimentare

### Cuvinte Interzise (Global)
violență, arme, sânge, moarte, droguri, alcool, sex, rasism, bullying, suicid, extremism

### Cuvinte Interzise pe Vârstă
- **5-7 ani:** monstri, scary, coșmar, fantomă, zombi
- **8-12 ani:** horror, groază

---

## 💎 PLANURI ABONAMENT

| Plan | Preț | Caracteristici |
|------|------|----------------|
| Basic | 9.99€/lună | Acces Nexus, Poveste, Suport email |
| Premium | 19.99€/lună | +Protocol Omega, Voice, Prioritar |
| Enterprise | Contact | +API, Custom, Dedicated |

### Dispozitive
- 3 incluse gratuit
- £1 per dispozitiv suplimentar
- Cod QR pentru adăugare device nou

---

## 🎁 SISTEM CODURI DEMO (Admin)

### Generare
1. Login ca admin
2. Accesează `/admin.html`
3. Tab "Coduri Demo" → Generează
4. Introdu email-ul clientului
5. Copiază codul generat

### Format Cod
`DEMO-NXXXXXXXXXX` (ex: DEMO-NXM1ABC2D)

### Valabilitate
- 30 zile de la generare
- 1 utilizare per cod
- Acces complet FĂRĂ salvare

---

## 📧 CONFIGURARE EMAIL

### Sender
- **Email:** `ae1968@kidsdigitalhub.com`  
- **Nume:** GENEZA NEXUS

### În Producție
Necesită integrare cu:
- EmailJS
- SendGrid
- sau alt serviciu email

---

## 🚀 DEPLOYMENT

### Platformă
- **Hosting:** Netlify
- **Site ID:** geneza-nexus

### Comenzi
```bash
# Deploy production
npx netlify-cli deploy --prod --dir=.

# Git commit și deploy
git add -A
git commit -m "message"
npx netlify-cli deploy --prod --dir=.
```

---

## 📁 STRUCTURA FIȘIERE

```
GENEZA_NEXUS/
├── index.html              # Landing page
├── nexus_core.html         # AI Interface & Core Modules
├── nexus_story.html        # Poveste
├── abonamente.html         # Subscription plans
├── inregistrare.html       # Registration
├── cont.html               # Account management
├── admin.html              # Admin panel (Security Dashboard)
├── js/
│   ├── nexus_brain.js      # Core AI brain
│   ├── nexus_bridge.js     # Cross-page access
│   ├── nexus_user_system.js # User management
│   ├── nexus_content_creator.js # Content (Art/Games/Stories)
│   ├── nexus_game_system.js # Multiplayer & Game Logic
│   ├── nexus_tutor_system.js # Educational AI
│   ├── nexus_guardian.js   # Safety & Legal Protocol
│   ├── nexus_gdpr.js       # Privacy & Data Rights
│   └── translations.js     # i18n
├── assets/
│   └── images/
├── css/
└── netlify.toml
```

---

## 🔧 COMENZI NEXUS

### În Chat/Voice
- `status` - Status sistem
- `help` - Lista comenzi
- `desenează [ceva]` - Content Creator
- `start joc [tip]` - Game System
- `șterge datele` - GDPR (Amnesia)
- `vreau ajutor la [materie]` - Tutor System

---

## ✅ CHECKLIST FINAL

- [x] Landing page cu poveste
- [x] Nexus Core cu chat
- [x] Protocol Omega (facial recognition)
- [x] Voice activation (multi-limbă)
- [x] Facial gestures (5 tipuri)
- [x] Login system (admin/guest/subscriber)
- [x] Sistem înregistrare & Abonamente
- [x] Coduri demo admin & Statistici
- [x] Gestionare dispozitive & Conturi copii
- [x] **Nexus Content Creator** (Desene, Povești)
- [x] **Nexus Game System** (ID, Multiplayer, Cyber Racer)
- [x] **Nexus Tutor System** (Sursă Academică, Profilare)
- [x] **Nexus Guardian** (Filtru Ilegal/Medical, Raportare)
- [x] **Nexus GDPR** (Export, Ștergere)
- [x] **Safety Logic** (Force B&W, Zero Tolerance)
- [x] All Systems Live on Netlify

---

## 📞 CONTACT

- **Email:** ae1968@kidsdigitalhub.com
- **Website:** www.kidsdigitalhub.com
- **GitHub:** github.com/AE1968

---

**🧠 NEXUS BRAIN CORE - LIVE PERMANENT**

*Creat de Adrian Enciulescu & Nexus AI*  
*Decembrie 2024*
