/**
 * 🔐 NEXUS USER MANAGEMENT SYSTEM
 * Sistem complet de gestionare utilizatori, abonamente, dispozitive și coduri demo
 * Version: 1.0.0
 */

(function () {
    'use strict';

    if (window.NexusUserSystem) return;

    // === NEXUS USER MANAGEMENT SYSTEM ===
    window.NexusUserSystem = {
        version: '1.0.0',

        // === CONFIGURARE PREȚURI ===
        pricing: {
            basic: { price: 9.99, currency: 'EUR', name: 'Basic' },
            premium: { price: 19.99, currency: 'EUR', name: 'Premium' },
            enterprise: { price: 0, currency: 'EUR', name: 'Enterprise' },
            extraDevice: { price: 1.00, currency: 'GBP', name: 'Device Suplimentar' }
        },

        // === LIMITE DISPOZITIVE ===
        deviceLimits: {
            freeDevices: 3,
            extraDevicePrice: 1.00 // GBP per device
        },

        // === LIMITE CONTURI COPIL ===
        childLimits: {
            maxChildren: 2, // Maximum 2 conturi copil per părinte
            minAge: 5,
            maxAge: 17
        },

        // === RESTRICȚII DEMO ===
        demoRestrictions: {
            canSave: false,          // Nu poate salva
            canExport: false,        // Nu poate exporta
            canAccessAllFeatures: true, // Acces la toate funcțiile
            watermark: true          // Watermark pe conținut
        },

        // === TIPURI UTILIZATORI ===
        userTypes: {
            ADMIN: 'admin',
            SUBSCRIBER: 'subscriber',
            DEMO: 'demo',
            CHILD: 'child'
        },

        // === BAZE DE DATE (localStorage pentru demo, în producție ar fi backend) ===
        databases: {
            // Clienți plătitori
            getPayingClients: function () {
                return JSON.parse(localStorage.getItem('nexus_paying_clients') || '{}');
            },
            savePayingClients: function (data) {
                localStorage.setItem('nexus_paying_clients', JSON.stringify(data));
            },

            // Clienți demo
            getDemoClients: function () {
                return JSON.parse(localStorage.getItem('nexus_demo_clients') || '{}');
            },
            saveDemoClients: function (data) {
                localStorage.setItem('nexus_demo_clients', JSON.stringify(data));
            },

            // Coduri demo active
            getDemoCodes: function () {
                return JSON.parse(localStorage.getItem('nexus_demo_codes') || '{}');
            },
            saveDemoCodes: function (data) {
                localStorage.setItem('nexus_demo_codes', JSON.stringify(data));
            },

            // Dispozitive înregistrate
            getDevices: function () {
                return JSON.parse(localStorage.getItem('nexus_devices') || '{}');
            },
            saveDevices: function (data) {
                localStorage.setItem('nexus_devices', JSON.stringify(data));
            }
        },

        // === GENERARE ID UNIC ===
        generateId: function (prefix = 'NX') {
            return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
        },

        // === GENERARE COD DEMO (pentru admin) ===
        generateDemoCode: function (adminEmail, targetEmail, duration = 30) {
            // Verifică dacă e admin
            if (localStorage.getItem('nexus_role') !== 'admin') {
                return { success: false, error: 'Doar adminul poate genera coduri demo' };
            }

            const code = 'DEMO-' + this.generateId('');
            const demoCodes = this.databases.getDemoCodes();

            demoCodes[code] = {
                code: code,
                createdBy: adminEmail,
                targetEmail: targetEmail,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
                duration: duration,
                used: false,
                usedBy: null,
                usedAt: null
            };

            this.databases.saveDemoCodes(demoCodes);

            console.log(`[NEXUS] Cod demo generat: ${code} pentru ${targetEmail}`);
            return {
                success: true,
                code: code,
                expiresAt: demoCodes[code].expiresAt,
                message: `Cod demo generat cu succes pentru ${targetEmail}`
            };
        },

        // === VALIDARE COD DEMO ===
        validateDemoCode: function (code) {
            const demoCodes = this.databases.getDemoCodes();
            const demoCode = demoCodes[code];

            if (!demoCode) {
                return { valid: false, error: 'Cod inexistent' };
            }

            if (demoCode.used) {
                return { valid: false, error: 'Cod deja utilizat' };
            }

            if (new Date(demoCode.expiresAt) < new Date()) {
                return { valid: false, error: 'Cod expirat' };
            }

            return { valid: true, demoCode: demoCode };
        },

        // === ÎNREGISTRARE UTILIZATOR NOU ===
        registerUser: function (userData, paymentData = null, demoCode = null) {
            const { email, password, firstName, lastName, phone, country } = userData;

            // Validări
            if (!email || !password || !firstName || !lastName) {
                return { success: false, error: 'Completează toate câmpurile obligatorii' };
            }

            if (password.length < 8) {
                return { success: false, error: 'Parola trebuie să aibă minim 8 caractere' };
            }

            // Verifică dacă email-ul există deja
            const payingClients = this.databases.getPayingClients();
            const demoClients = this.databases.getDemoClients();

            if (payingClients[email] || demoClients[email]) {
                return { success: false, error: 'Email-ul este deja înregistrat' };
            }

            // Generează username unic
            const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 4);
            const userId = this.generateId('USR');
            const deviceId = this.generateDeviceId();

            // Creare obiect utilizator
            const user = {
                id: userId,
                username: username,
                email: email,
                password: this.hashPassword(password), // În producție, hash pe server
                firstName: firstName,
                lastName: lastName,
                phone: phone || '',
                country: country || '',
                createdAt: new Date().toISOString(),
                subscription: null,
                subscriptionExpires: null,
                devices: [deviceId],
                maxDevices: 3,
                extraDevices: 0,
                isDemo: false,
                demoCode: null,
                lastLogin: null,
                loginHistory: []
            };

            // Dacă e înregistrare cu cod demo
            if (demoCode) {
                const validation = this.validateDemoCode(demoCode);
                if (!validation.valid) {
                    return { success: false, error: validation.error };
                }

                // Marchează codul ca folosit
                const demoCodes = this.databases.getDemoCodes();
                demoCodes[demoCode].used = true;
                demoCodes[demoCode].usedBy = email;
                demoCodes[demoCode].usedAt = new Date().toISOString();
                this.databases.saveDemoCodes(demoCodes);

                // Setează ca utilizator demo
                user.isDemo = true;
                user.demoCode = demoCode;
                user.subscription = 'demo';
                user.subscriptionExpires = validation.demoCode.expiresAt;

                // Salvează în baza de date demo
                demoClients[email] = user;
                this.databases.saveDemoClients(demoClients);

                return {
                    success: true,
                    user: { ...user, password: undefined },
                    message: 'Cont demo creat cu succes! Valabil până la ' + new Date(user.subscriptionExpires).toLocaleDateString('ro-RO'),
                    isDemo: true
                };
            }

            // Dacă e înregistrare cu plată
            if (paymentData && paymentData.plan) {
                user.subscription = paymentData.plan;
                user.subscriptionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                user.paymentHistory = [{
                    id: this.generateId('PAY'),
                    plan: paymentData.plan,
                    amount: this.pricing[paymentData.plan].price,
                    currency: this.pricing[paymentData.plan].currency,
                    date: new Date().toISOString(),
                    status: 'pending' // Va fi actualizat după validare plată
                }];

                // Salvează în baza de date plătitori
                payingClients[email] = user;
                this.databases.savePayingClients(payingClients);

                return {
                    success: true,
                    user: { ...user, password: undefined },
                    message: 'Cont creat! Te rugăm să finalizezi plata.',
                    requiresPayment: true,
                    paymentDetails: {
                        amount: this.pricing[paymentData.plan].price,
                        currency: this.pricing[paymentData.plan].currency,
                        plan: paymentData.plan
                    }
                };
            }

            return { success: false, error: 'Selectează un plan sau introdu un cod demo' };
        },

        // === LOGIN ===
        login: function (email, password) {
            const payingClients = this.databases.getPayingClients();
            const demoClients = this.databases.getDemoClients();

            let user = payingClients[email] || demoClients[email];

            if (!user) {
                return { success: false, error: 'Email sau parolă incorectă' };
            }

            if (user.password !== this.hashPassword(password)) {
                return { success: false, error: 'Email sau parolă incorectă' };
            }

            // Verifică expirare abonament
            if (user.subscriptionExpires && new Date(user.subscriptionExpires) < new Date()) {
                return {
                    success: false,
                    error: 'Abonamentul tău a expirat. Te rugăm să reînnoiești.',
                    expired: true,
                    user: { email: user.email, firstName: user.firstName }
                };
            }

            // Generează cod pentru device nou
            const currentDeviceId = this.generateDeviceId();
            const deviceCode = this.generateDeviceCode(user.id, currentDeviceId);

            // Verifică dacă device-ul e nou
            if (!user.devices.includes(currentDeviceId)) {
                if (user.devices.length >= user.maxDevices + user.extraDevices) {
                    return {
                        success: false,
                        error: `Ai atins limita de ${user.maxDevices + user.extraDevices} dispozitive. Adaugă un dispozitiv suplimentar pentru £${this.deviceLimits.extraDevicePrice}.`,
                        needsExtraDevice: true,
                        deviceCode: deviceCode,
                        user: { email: user.email, firstName: user.firstName }
                    };
                }

                // Adaugă device-ul nou
                user.devices.push(currentDeviceId);
            }

            // Actualizează login
            user.lastLogin = new Date().toISOString();
            user.loginHistory.push({
                deviceId: currentDeviceId,
                timestamp: new Date().toISOString(),
                ip: 'client-side' // În producție, ar fi IP-ul real
            });

            // Salvează
            if (user.isDemo) {
                demoClients[email] = user;
                this.databases.saveDemoClients(demoClients);
            } else {
                payingClients[email] = user;
                this.databases.savePayingClients(payingClients);
            }

            // Verifică dacă expiră în curând (5 zile)
            let expirationWarning = null;
            if (user.subscriptionExpires) {
                const daysLeft = Math.ceil((new Date(user.subscriptionExpires) - new Date()) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 5 && daysLeft > 0) {
                    expirationWarning = `Abonamentul tău expiră în ${daysLeft} zile. Reînnoiește acum pentru a nu pierde accesul!`;
                }
            }

            // Setează localStorage pentru sesiune
            localStorage.setItem('nexus_authenticated', 'true');
            localStorage.setItem('nexus_user', user.firstName);
            localStorage.setItem('nexus_role', user.isDemo ? 'demo' : 'subscriber');
            localStorage.setItem('nexus_username', user.username);
            localStorage.setItem('nexus_email', user.email);
            localStorage.setItem('nexus_subscription', user.subscription);
            localStorage.setItem('nexus_expires', user.subscriptionExpires);

            return {
                success: true,
                user: { ...user, password: undefined },
                deviceCode: deviceCode,
                expirationWarning: expirationWarning,
                message: `Bine ai venit, ${user.firstName}!`
            };
        },

        // === GENERARE DEVICE ID ===
        generateDeviceId: function () {
            // Creează un ID unic bazat pe browser fingerprint
            const nav = window.navigator;
            const screen = window.screen;
            const fingerprint = [
                nav.userAgent,
                nav.language,
                screen.width + 'x' + screen.height,
                screen.colorDepth,
                new Date().getTimezoneOffset()
            ].join('|');

            // Hash simplu
            let hash = 0;
            for (let i = 0; i < fingerprint.length; i++) {
                const char = fingerprint.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return 'DEV' + Math.abs(hash).toString(36).toUpperCase();
        },

        // === GENERARE COD QR/BARE PENTRU DEVICE ===
        generateDeviceCode: function (userId, deviceId) {
            const code = btoa(JSON.stringify({
                userId: userId,
                deviceId: deviceId,
                timestamp: Date.now(),
                signature: this.generateId('SIG')
            }));
            return code;
        },

        // === VALIDARE COD DEVICE (pentru scanare) ===
        validateDeviceCode: function (code, userEmail) {
            try {
                const data = JSON.parse(atob(code));
                const payingClients = this.databases.getPayingClients();
                const demoClients = this.databases.getDemoClients();
                const user = payingClients[userEmail] || demoClients[userEmail];

                if (!user) {
                    return { valid: false, error: 'Utilizator inexistent' };
                }

                if (user.id !== data.userId) {
                    return { valid: false, error: 'Cod invalid pentru acest utilizator' };
                }

                // Verifică dacă codul nu e prea vechi (max 5 minute)
                if (Date.now() - data.timestamp > 5 * 60 * 1000) {
                    return { valid: false, error: 'Codul a expirat. Generează unul nou.' };
                }

                // Adaugă device-ul
                const newDeviceId = this.generateDeviceId();

                if (user.devices.length >= user.maxDevices + user.extraDevices) {
                    return {
                        valid: false,
                        error: 'Limită dispozitive atinsă',
                        needsExtraDevice: true
                    };
                }

                user.devices.push(newDeviceId);

                // Salvează
                if (user.isDemo) {
                    demoClients[userEmail] = user;
                    this.databases.saveDemoClients(demoClients);
                } else {
                    payingClients[userEmail] = user;
                    this.databases.savePayingClients(payingClients);
                }

                return {
                    valid: true,
                    message: 'Dispozitiv adăugat cu succes!',
                    devicesUsed: user.devices.length,
                    maxDevices: user.maxDevices + user.extraDevices
                };
            } catch (e) {
                return { valid: false, error: 'Cod invalid' };
            }
        },

        // === ADAUGĂ DEVICE SUPLIMENTAR (cu plată) ===
        addExtraDevice: function (userEmail) {
            const payingClients = this.databases.getPayingClients();
            const user = payingClients[userEmail];

            if (!user) {
                return { success: false, error: 'Utilizator inexistent sau demo' };
            }

            // Returnează informații pentru plată
            return {
                success: true,
                requiresPayment: true,
                amount: this.deviceLimits.extraDevicePrice,
                currency: 'GBP',
                message: `Adaugă un dispozitiv suplimentar pentru £${this.deviceLimits.extraDevicePrice}`
            };
        },

        // === CONFIRMARE PLATĂ DEVICE SUPLIMENTAR ===
        confirmExtraDevicePayment: function (userEmail, paymentId) {
            const payingClients = this.databases.getPayingClients();
            const user = payingClients[userEmail];

            if (!user) {
                return { success: false, error: 'Utilizator inexistent' };
            }

            user.extraDevices = (user.extraDevices || 0) + 1;
            user.paymentHistory = user.paymentHistory || [];
            user.paymentHistory.push({
                id: paymentId || this.generateId('PAY'),
                type: 'extra_device',
                amount: this.deviceLimits.extraDevicePrice,
                currency: 'GBP',
                date: new Date().toISOString(),
                status: 'completed'
            });

            payingClients[userEmail] = user;
            this.databases.savePayingClients(payingClients);

            return {
                success: true,
                message: 'Dispozitiv suplimentar adăugat!',
                totalDevices: user.maxDevices + user.extraDevices
            };
        },

        // === VALIDARE PLATĂ ABONAMENT ===
        confirmSubscriptionPayment: function (userEmail, paymentId) {
            const payingClients = this.databases.getPayingClients();
            const user = payingClients[userEmail];

            if (!user) {
                return { success: false, error: 'Utilizator inexistent' };
            }

            // Actualizează statusul plății
            if (user.paymentHistory && user.paymentHistory.length > 0) {
                const lastPayment = user.paymentHistory[user.paymentHistory.length - 1];
                lastPayment.status = 'completed';
                lastPayment.confirmedAt = new Date().toISOString();
                lastPayment.transactionId = paymentId;
            }

            // Setează/prelungește abonamentul
            const currentExpiry = user.subscriptionExpires ? new Date(user.subscriptionExpires) : new Date();
            const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()) + 30 * 24 * 60 * 60 * 1000);
            user.subscriptionExpires = newExpiry.toISOString();

            payingClients[userEmail] = user;
            this.databases.savePayingClients(payingClients);

            return {
                success: true,
                message: 'Plată confirmată! Abonament activ.',
                expiresAt: user.subscriptionExpires
            };
        },

        // === UPGRADE DE LA DEMO LA PLĂTITOR ===
        upgradeDemoToSubscriber: function (email, plan, paymentData) {
            const demoClients = this.databases.getDemoClients();
            const payingClients = this.databases.getPayingClients();

            const demoUser = demoClients[email];
            if (!demoUser) {
                return { success: false, error: 'Utilizator demo inexistent' };
            }

            // Convertește la plătitor
            const payingUser = { ...demoUser };
            payingUser.isDemo = false;
            payingUser.subscription = plan;
            payingUser.subscriptionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            payingUser.upgradedAt = new Date().toISOString();
            payingUser.paymentHistory = [{
                id: this.generateId('PAY'),
                plan: plan,
                amount: this.pricing[plan].price,
                currency: this.pricing[plan].currency,
                date: new Date().toISOString(),
                status: 'pending'
            }];

            // Mută în baza de date plătitori
            payingClients[email] = payingUser;
            this.databases.savePayingClients(payingClients);

            // Șterge din demo
            delete demoClients[email];
            this.databases.saveDemoClients(demoClients);

            return {
                success: true,
                message: 'Upgrade efectuat! Finalizează plata.',
                requiresPayment: true,
                paymentDetails: {
                    amount: this.pricing[plan].price,
                    currency: this.pricing[plan].currency,
                    plan: plan
                }
            };
        },

        // === VERIFICARE EXPIRARE (rulează periodic) ===
        checkExpirations: function () {
            const warnings = [];
            const payingClients = this.databases.getPayingClients();
            const demoClients = this.databases.getDemoClients();

            const checkUser = (user, isDemo) => {
                if (user.subscriptionExpires) {
                    const daysLeft = Math.ceil((new Date(user.subscriptionExpires) - new Date()) / (1000 * 60 * 60 * 24));

                    if (daysLeft <= 0) {
                        warnings.push({
                            email: user.email,
                            type: 'expired',
                            message: `Abonamentul ${isDemo ? 'demo' : ''} a expirat.`,
                            daysLeft: daysLeft
                        });
                    } else if (daysLeft <= 5) {
                        warnings.push({
                            email: user.email,
                            type: 'expiring_soon',
                            message: `Abonamentul expiră în ${daysLeft} zile.`,
                            daysLeft: daysLeft
                        });
                    }
                }
            };

            Object.values(payingClients).forEach(u => checkUser(u, false));
            Object.values(demoClients).forEach(u => checkUser(u, true));

            return warnings;
        },

        // === HASH SIMPLU PENTRU PAROLĂ (în producție, folosește bcrypt pe server) ===
        hashPassword: function (password) {
            let hash = 0;
            for (let i = 0; i < password.length; i++) {
                const char = password.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return 'H' + Math.abs(hash).toString(16).toUpperCase();
        },

        // === ADMIN: LISTEAZĂ TOȚI UTILIZATORII ===
        adminListUsers: function () {
            if (localStorage.getItem('nexus_role') !== 'admin') {
                return { success: false, error: 'Acces interzis' };
            }

            return {
                payingClients: Object.values(this.databases.getPayingClients()).map(u => ({
                    ...u, password: undefined
                })),
                demoClients: Object.values(this.databases.getDemoClients()).map(u => ({
                    ...u, password: undefined
                })),
                demoCodes: this.databases.getDemoCodes()
            };
        },

        // === ADMIN: TRIMITE COD DEMO PE EMAIL ===
        adminSendDemoCode: function (targetEmail, customMessage = '') {
            if (localStorage.getItem('nexus_role') !== 'admin') {
                return { success: false, error: 'Acces interzis' };
            }

            const adminEmail = localStorage.getItem('nexus_email') || 'admin@geneza-nexus.com';
            const result = this.generateDemoCode(adminEmail, targetEmail, 30);

            if (result.success) {
                // În producție, ar trimite email real
                // Pentru acum, returnează codul pentru copiere manuală
                return {
                    success: true,
                    code: result.code,
                    targetEmail: targetEmail,
                    expiresAt: result.expiresAt,
                    emailContent: `
Salut!

Ai primit un cod de acces demo pentru GENEZA NEXUS!

Codul tău: ${result.code}

Acest cod îți oferă acces gratuit timp de 1 lună la platforma noastră.

Pentru a-l activa:
1. Accesează https://geneza-nexus.netlify.app
2. Click pe LOGIN
3. Introdu codul în rubrica "Cod Acces Demo"
4. Completează datele de înregistrare

Codul expiră la: ${new Date(result.expiresAt).toLocaleDateString('ro-RO')}

${customMessage ? '\nMesaj personalizat: ' + customMessage : ''}

Cu respect,
Echipa GENEZA NEXUS
                    `.trim()
                };
            }

            return result;
        },

        // === INIȚIALIZARE ===
        init: function () {
            console.log('%c🔐 NEXUS USER SYSTEM - ONLINE', 'color: #bc13fe; font-size: 14px; font-weight: bold;');

            // Verifică expirări la încărcare
            const warnings = this.checkExpirations();
            if (warnings.length > 0) {
                console.log('[NEXUS] Atenție expirări:', warnings);
            }

            // Verifică dacă utilizatorul curent are warning
            const currentEmail = localStorage.getItem('nexus_email');
            if (currentEmail) {
                const userWarning = warnings.find(w => w.email === currentEmail);
                if (userWarning && userWarning.type === 'expiring_soon') {
                    setTimeout(() => {
                        if (typeof NexusBrain !== 'undefined' && NexusBrain.notify) {
                            NexusBrain.notify(userWarning.message + ' Reînnoiește pentru a păstra accesul!', 'warning');
                        } else {
                            alert('⚠️ ' + userWarning.message);
                        }
                    }, 3000);
                }
            }
        },

        // === REGULI PERMISIUNI PE VÂRSTĂ PENTRU COPII ===
        childPermissions: {
            // 5-7 ani - Foarte restricționat
            getPermissionsForAge5to7: function () {
                return {
                    ageGroup: '5-7',
                    canChat: false,           // Nu poate chata
                    canVoice: true,           // Poate folosi voce (comandă vocală simplă)
                    canSave: false,           // Nu poate salva
                    canViewStory: true,       // Poate vedea povestea
                    canUseGames: true,        // Poate juca jocuri
                    canAccessAdvanced: false, // Nu poate accesa funcții avansate
                    canContactAdmin: false,   // Nu poate contacta admin
                    maxSessionMinutes: 30,    // Max 30 minute pe sesiune
                    contentFilter: 'strict',  // Filtrare conținut strictă
                    parentalNotify: true      // Notifică părintele
                };
            },

            // 8-12 ani - Moderat restricționat
            getPermissionsForAge8to12: function () {
                return {
                    ageGroup: '8-12',
                    canChat: true,            // Poate chata (monitorizat)
                    canVoice: true,           // Poate folosi voce
                    canSave: false,           // Nu poate salva (demo) / poate (abonat)
                    canViewStory: true,       // Poate vedea povestea
                    canUseGames: true,        // Poate juca jocuri
                    canAccessAdvanced: false, // Nu poate accesa funcții avansate
                    canContactAdmin: false,   // Nu poate contacta admin
                    maxSessionMinutes: 60,    // Max 60 minute pe sesiune
                    contentFilter: 'moderate', // Filtrare conținut moderată
                    parentalNotify: true      // Notifică părintele
                };
            },

            // 13-17 ani - Restricții ușoare
            getPermissionsForAge13to17: function () {
                return {
                    ageGroup: '13-17',
                    canChat: true,            // Poate chata
                    canVoice: true,           // Poate folosi voce
                    canSave: true,            // Poate salva (dacă abonament permite)
                    canViewStory: true,       // Poate vedea povestea
                    canUseGames: true,        // Poate juca jocuri
                    canAccessAdvanced: true,  // Poate accesa funcții avansate
                    canContactAdmin: false,   // Nu poate contacta admin direct
                    maxSessionMinutes: 120,   // Max 2 ore pe sesiune
                    contentFilter: 'light',   // Filtrare conținut ușoară
                    parentalNotify: false     // Nu notifică părintele (opțional)
                };
            },

            // Obține permisiuni în funcție de vârstă
            getPermissionsByAge: function (age) {
                if (age >= 5 && age <= 7) {
                    return this.getPermissionsForAge5to7();
                } else if (age >= 8 && age <= 12) {
                    return this.getPermissionsForAge8to12();
                } else if (age >= 13 && age <= 17) {
                    return this.getPermissionsForAge13to17();
                }
                return null; // Vârstă invalidă
            }
        },

        // === ADAUGĂ CONT COPIL ===
        addChildAccount: function (parentEmail, childData) {
            const { name, age, nickname } = childData;

            // Validări
            if (!name || !age) {
                return { success: false, error: 'Completează numele și vârsta copilului' };
            }

            const ageNum = parseInt(age);
            if (ageNum < this.childLimits.minAge || ageNum > this.childLimits.maxAge) {
                return {
                    success: false,
                    error: `Vârsta trebuie să fie între ${this.childLimits.minAge} și ${this.childLimits.maxAge} ani`
                };
            }

            // Găsește părintele
            const payingClients = this.databases.getPayingClients();
            const demoClients = this.databases.getDemoClients();
            let parent = payingClients[parentEmail] || demoClients[parentEmail];
            let isParentDemo = !!demoClients[parentEmail];

            if (!parent) {
                return { success: false, error: 'Contul părinte nu a fost găsit' };
            }

            // Inițializează array de copii dacă nu există
            if (!parent.children) {
                parent.children = [];
            }

            // Verifică limita de copii
            if (parent.children.length >= this.childLimits.maxChildren) {
                return {
                    success: false,
                    error: `Ai atins limita maximă de ${this.childLimits.maxChildren} conturi de copil`
                };
            }

            // Obține permisiunile pentru vârsta copilului
            const permissions = this.childPermissions.getPermissionsByAge(ageNum);

            // Creează contul copilului
            const childId = this.generateId('CHD');
            const child = {
                id: childId,
                name: name,
                nickname: nickname || name.split(' ')[0],
                age: ageNum,
                ageGroup: permissions.ageGroup,
                parentEmail: parentEmail,
                parentId: parent.id,
                createdAt: new Date().toISOString(),
                permissions: permissions,
                isDemo: isParentDemo,
                sessionHistory: [],
                lastActive: null
            };

            // Dacă părintele e demo, copilul moștenește restricțiile demo
            if (isParentDemo) {
                child.permissions.canSave = false;
                child.permissions.canExport = false;
            }

            // Adaugă copilul la părinte
            parent.children.push(child);

            // Salvează
            if (isParentDemo) {
                demoClients[parentEmail] = parent;
                this.databases.saveDemoClients(demoClients);
            } else {
                payingClients[parentEmail] = parent;
                this.databases.savePayingClients(payingClients);
            }

            console.log(`[NEXUS] Cont copil creat: ${name} (${ageNum} ani) pentru ${parentEmail}`);

            return {
                success: true,
                child: child,
                message: `Cont creat pentru ${name}! Permisiuni setate pentru grupa de vârstă ${permissions.ageGroup} ani.`,
                permissions: permissions
            };
        },

        // === LOGIN COPIL ===
        loginChild: function (parentEmail, childId) {
            const payingClients = this.databases.getPayingClients();
            const demoClients = this.databases.getDemoClients();
            let parent = payingClients[parentEmail] || demoClients[parentEmail];

            if (!parent || !parent.children) {
                return { success: false, error: 'Cont negăsit' };
            }

            const child = parent.children.find(c => c.id === childId);
            if (!child) {
                return { success: false, error: 'Contul copilului nu a fost găsit' };
            }

            // Verifică expirare abonament părinte
            if (parent.subscriptionExpires && new Date(parent.subscriptionExpires) < new Date()) {
                return {
                    success: false,
                    error: 'Abonamentul părintelui a expirat'
                };
            }

            // Actualizează ultima activitate
            child.lastActive = new Date().toISOString();
            child.sessionHistory.push({
                start: new Date().toISOString(),
                deviceId: this.generateDeviceId()
            });

            // Salvează
            if (parent.isDemo) {
                demoClients[parentEmail] = parent;
                this.databases.saveDemoClients(demoClients);
            } else {
                payingClients[parentEmail] = parent;
                this.databases.savePayingClients(payingClients);
            }

            // Setează sesiune copil
            localStorage.setItem('nexus_authenticated', 'true');
            localStorage.setItem('nexus_user', child.nickname);
            localStorage.setItem('nexus_role', 'child');
            localStorage.setItem('nexus_child_id', child.id);
            localStorage.setItem('nexus_parent_email', parentEmail);
            localStorage.setItem('nexus_child_age', child.age);
            localStorage.setItem('nexus_child_permissions', JSON.stringify(child.permissions));

            return {
                success: true,
                child: child,
                permissions: child.permissions,
                message: `Bine ai venit, ${child.nickname}! 🎉`,
                sessionLimit: child.permissions.maxSessionMinutes
            };
        },

        // === VERIFICĂ PERMISIUNE COPIL ===
        checkChildPermission: function (permission) {
            const isChild = localStorage.getItem('nexus_role') === 'child';
            if (!isChild) return true; // Nu e copil, are acces

            try {
                const permissions = JSON.parse(localStorage.getItem('nexus_child_permissions') || '{}');
                return permissions[permission] === true;
            } catch (e) {
                return false;
            }
        },

        // === LISTEAZĂ COPIII UNUI PĂRINTE ===
        listChildren: function (parentEmail) {
            const payingClients = this.databases.getPayingClients();
            const demoClients = this.databases.getDemoClients();
            const parent = payingClients[parentEmail] || demoClients[parentEmail];

            if (!parent) {
                return { success: false, error: 'Cont negăsit' };
            }

            return {
                success: true,
                children: parent.children || [],
                maxChildren: this.childLimits.maxChildren,
                canAddMore: (parent.children || []).length < this.childLimits.maxChildren
            };
        },

        // === ȘTERGE CONT COPIL ===
        removeChild: function (parentEmail, childId) {
            const payingClients = this.databases.getPayingClients();
            const demoClients = this.databases.getDemoClients();
            let parent = payingClients[parentEmail] || demoClients[parentEmail];
            let isParentDemo = !!demoClients[parentEmail];

            if (!parent || !parent.children) {
                return { success: false, error: 'Cont negăsit' };
            }

            const childIndex = parent.children.findIndex(c => c.id === childId);
            if (childIndex === -1) {
                return { success: false, error: 'Contul copilului nu a fost găsit' };
            }

            const removedChild = parent.children.splice(childIndex, 1)[0];

            // Salvează
            if (isParentDemo) {
                demoClients[parentEmail] = parent;
                this.databases.saveDemoClients(demoClients);
            } else {
                payingClients[parentEmail] = parent;
                this.databases.savePayingClients(payingClients);
            }

            return {
                success: true,
                message: `Contul lui ${removedChild.name} a fost șters`
            };
        },

        // === VERIFICĂ DACĂ POATE SALVA (demo sau copil mic) ===
        canSave: function () {
            const role = localStorage.getItem('nexus_role');

            // Admin poate întotdeauna
            if (role === 'admin') return true;

            // Demo nu poate salva
            if (role === 'demo') return false;

            // Copil - verifică permisiunile
            if (role === 'child') {
                return this.checkChildPermission('canSave');
            }

            // Abonat poate salva
            if (role === 'subscriber') return true;

            return false;
        }
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => NexusUserSystem.init());
    } else {
        NexusUserSystem.init();
    }
})();
