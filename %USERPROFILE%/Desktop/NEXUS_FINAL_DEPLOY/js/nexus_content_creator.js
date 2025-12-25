/**
 * 🎨 NEXUS CONTENT CREATOR
 * Sistem de generare conținut cu filtrare vârstă, preview și trimitere email
 * Version: 1.0.0
 */

(function () {
    'use strict';

    if (window.NexusContentCreator) return;

    window.NexusContentCreator = {
        version: '1.0.0',

        // === CONFIGURARE EMAIL ===
        emailConfig: {
            senderEmail: 'ae1968@kidsdigitalhub.com',
            senderName: 'GENEZA NEXUS',
            replyTo: 'ae1968@kidsdigitalhub.com'
        },

        // === CONFIGURARE TIPURI CONȚINUT ===
        contentTypes: {
            // Desene de colorat - OBLIGATORIU ALB-NEGRU
            coloring: {
                keywords: ['colorat', 'colorare', 'coloring', 'de colorat', 'pentru colorat',
                    'să colorez', 'sa colorez', 'color', 'negru alb', 'alb negru'],
                style: 'black_and_white',
                description: 'Desen de colorat (alb-negru)',
                forceBlackWhite: true
            },
            // Desene normale
            drawing: {
                keywords: ['desenează', 'deseneaza', 'draw', 'desen'],
                style: 'black_and_white', // DEFAULT alb-negru pentru toate desenele
                description: 'Desen',
                forceBlackWhite: true
            },
            // Ilustrații (pot fi colorate)
            illustration: {
                keywords: ['ilustrație', 'ilustratie', 'illustration', 'pictură', 'pictura'],
                style: 'colored',
                description: 'Ilustrație colorată',
                forceBlackWhite: false
            },
            // JOCURI
            games: {
                keywords: ['joc', 'jocuri', 'game', 'games', 'puzzle', 'labirint', 'maze',
                    'ghicește', 'ghiceste', 'guess', 'quiz', 'întrebare', 'intrebare',
                    'să joc', 'sa joc', 'play', 'joaca', 'joacă'],
                style: 'interactive',
                description: 'Joc interactiv',
                forceBlackWhite: false,
                ageThemes: {
                    '5-7': ['puzzle simplu', 'potrivește culorile', 'găsește diferențele', 'numără obiectele'],
                    '8-12': ['labirint', 'puzzle mediu', 'quiz general', 'ghicitori', 'memory'],
                    '13-17': ['puzzle avansat', 'quiz de logică', 'trivia', 'jocuri de cuvinte']
                }
            },
            // POVEȘTI
            stories: {
                keywords: ['poveste', 'povestire', 'story', 'basm', 'aventură', 'aventura'],
                style: 'text',
                description: 'Poveste/Basm',
                forceBlackWhite: false
            }
        },

        // === POLITICI INTERZISE PE VÂRSTĂ ===
        contentPolicies: {
            // Conținut INTERZIS pentru toate vârstele
            globalBanned: [
                'violență', 'violenta', 'arme', 'sânge', 'sange', 'moarte',
                'droguri', 'alcool', 'țigări', 'tigari', 'sex', 'nuditate',
                'rasism', 'discriminare', 'bullying', 'suicid', 'automutilare',
                'terorism', 'extremism', 'hate', 'ură', 'ura'
            ],

            // Restricții pe grupe de vârstă
            ageRestrictions: {
                '5-7': {
                    banned: ['monstri', 'monstru', 'scary', 'înfricoșător', 'întuneric',
                        'coșmar', 'cosmar', 'fantomă', 'fantoma', 'zombi', 'schelet'],
                    maxComplexity: 'simple',
                    themes: ['animale', 'natură', 'jucării', 'culori', 'forme', 'familie', 'prieteni']
                },
                '8-12': {
                    banned: ['horror', 'groază', 'groaza', 'sânge', 'sange'],
                    maxComplexity: 'moderate',
                    themes: ['aventură', 'spațiu', 'animale', 'sport', 'știință', 'natură', 'super-eroi', 'magie']
                },
                '13-17': {
                    banned: [],
                    maxComplexity: 'advanced',
                    themes: ['toate temele permise cu excepția conținutului adult']
                }
            }
        },

        // === VERIFICĂ CONȚINUT PERMIS ===
        checkContentAllowed: function (request, userAge) {
            const requestLower = request.toLowerCase();
            const ageGroup = this.getAgeGroup(userAge);

            // Verifică cuvinte global interzise
            for (const banned of this.contentPolicies.globalBanned) {
                if (requestLower.includes(banned)) {
                    return {
                        allowed: false,
                        reason: `Cererea conține conținut nepotrivit: "${banned}". Te rog să reformulezi.`,
                        bannedWord: banned
                    };
                }
            }

            // Verifică restricții pe vârstă
            if (ageGroup && this.contentPolicies.ageRestrictions[ageGroup]) {
                const restrictions = this.contentPolicies.ageRestrictions[ageGroup];
                for (const banned of restrictions.banned) {
                    if (requestLower.includes(banned)) {
                        return {
                            allowed: false,
                            reason: `Acest conținut nu este potrivit pentru vârsta ta. Încearcă altceva!`,
                            bannedWord: banned,
                            suggestedThemes: restrictions.themes
                        };
                    }
                }
            }

            return { allowed: true };
        },

        // === OBȚINE GRUPA DE VÂRSTĂ ===
        getAgeGroup: function (age) {
            if (age >= 5 && age <= 7) return '5-7';
            if (age >= 8 && age <= 12) return '8-12';
            if (age >= 13 && age <= 17) return '13-17';
            return null;
        },

        // === GENERARE SUBIECT EMAIL ===
        generateEmailSubject: function (request) {
            // Curăță și scurtează cererea pentru subiect
            let subject = request.trim();

            // Elimină caractere speciale
            subject = subject.replace(/[^\w\s\u00C0-\u024F]/g, '');

            // Scurtează la primele 50 caractere
            if (subject.length > 50) {
                subject = subject.substring(0, 47) + '...';
            }

            // Adaugă prefix
            return `🎨 Creația ta: ${subject}`;
        },

        // === PROCESARE CERERE ===
        processRequest: function (request, callback) {
            const role = localStorage.getItem('nexus_role');
            const isChild = role === 'child';
            const isDemo = role === 'demo';

            // Obține vârsta (pentru copii sau adult default)
            let userAge = 18; // Default adult
            if (isChild) {
                userAge = parseInt(localStorage.getItem('nexus_child_age') || '10');
            }

            // Verifică dacă conținutul e permis
            const check = this.checkContentAllowed(request, userAge);
            if (!check.allowed) {
                callback({
                    success: false,
                    error: check.reason,
                    suggestedThemes: check.suggestedThemes
                });
                return;
            }

            // Verifică tipul cererii (simplificat)
            let type = 'drawing'; // default
            for (const [key, value] of Object.entries(this.contentTypes)) {
                if (value.keywords.some(k => requestLower.includes(k))) {
                    type = key;
                    break;
                }
            }

            // === DELEGARE CĂTRE GAME SYSTEM ===
            if (type === 'games') {
                if (typeof NexusGameSystem !== 'undefined') {
                    NexusGameSystem.startGame(request);
                    // Oprim callback-ul standard de content creator pentru că preia Game System
                    return;
                } else {
                    console.error('NexusGameSystem not loaded!');
                }
            }

            // Simulare generare (în producție, ar fi API call)
            console.log(`[NEXUS] Generare conținut pentru: "${request}" (Vârstă: ${userAge}, Tip: ${type})`);

            // Generează un placeholder de conținut
            const content = this.generatePlaceholderContent(request, userAge);

            callback({
                success: true,
                content: content,
                request: request,
                userAge: userAge,
                isDemo: isDemo,
                canSave: !isDemo && (role === 'admin' || role === 'subscriber')
            });
        },

        // === PLACEHOLDER CONTENT (în producție, ar fi AI real) ===
        generatePlaceholderContent: function (request, age) {
            const ageGroup = this.getAgeGroup(age);

            // Procedural Generation via Canvas (Simulare AI Art)
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 400;
            const ctx = canvas.getContext('2d');

            // 1. Dynamic Background
            const gradient = ctx.createLinearGradient(0, 0, 600, 400);
            gradient.addColorStop(0, '#0a0a2a');
            gradient.addColorStop(0.5, '#1a0a3a');
            gradient.addColorStop(1, '#200020');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 600, 400);

            // 2. Cosmic Particles
            for (let i = 0; i < 30; i++) {
                ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 60%)`;
                ctx.globalAlpha = Math.random() * 0.6;
                ctx.beginPath();
                const x = Math.random() * 600;
                const y = Math.random() * 400;
                const r = Math.random() * 40 + 5;
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();

                // Glow effect
                ctx.shadowBlur = 15;
                ctx.shadowColor = ctx.fillStyle;
            }

            // 3. Grid overlay for Tech feel
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgba(0, 243, 255, 0.1)";
            ctx.lineWidth = 1;
            for (let i = 0; i < 600; i += 40) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 400); ctx.stroke();
            }
            for (let i = 0; i < 400; i += 40) {
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(600, i); ctx.stroke();
            }

            // 4. Request Text overlay
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText(request.substring(0, 30), 300, 360);

            ctx.font = '16px "Rajdhani", sans-serif';
            ctx.fillStyle = '#00f3ff';
            ctx.fillText('NEXUS AI GENERATED', 300, 385);

            return {
                type: 'image', // sau 'story', 'poem', etc.
                title: request,
                description: `Artă digitală generată procedural pentru: "${request}"`,
                ageAppropriate: ageGroup || 'adult',
                generatedAt: new Date().toISOString(),
                previewUrl: canvas.toDataURL('image/png')
            };
        },

        // === AFIȘARE PREVIEW ===
        showPreview: function (content, onApprove, onReject) {
            // Creează modal de preview
            const modal = document.createElement('div');
            modal.id = 'contentPreviewModal';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.95); z-index: 99999;
                display: flex; justify-content: center; align-items: center;
                font-family: 'Rajdhani', sans-serif;
            `;

            modal.innerHTML = `
                <div style="width: 90%; max-width: 600px; background: linear-gradient(135deg, #1a0a2e, #0a0a2a); 
                            border: 2px solid #00f3ff; border-radius: 20px; overflow: hidden;">
                    
                    <!-- Header -->
                    <div style="background: linear-gradient(90deg, #bc13fe, #00f3ff); padding: 15px 25px;">
                        <h2 style="margin: 0; color: white; font-family: 'Orbitron', sans-serif;">
                            🎨 Creația Ta
                        </h2>
                    </div>
                    
                    <!-- Preview Area - 50% of screen -->
                    <div style="padding: 20px; min-height: 40vh; display: flex; flex-direction: column; 
                                align-items: center; justify-content: center;">
                        
                        <h3 style="color: #00f3ff; margin-bottom: 15px; text-align: center;">
                            ${content.title}
                        </h3>
                        
                        <div style="background: rgba(0,0,0,0.5); border: 1px dashed #00f3ff; 
                                    border-radius: 10px; padding: 30px; width: 100%; text-align: center;">
                            <img src="${content.previewUrl}" alt="Preview" 
                                 style="max-width: 100%; max-height: 200px; border-radius: 10px; margin-bottom: 15px;">
                            <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">
                                ${content.description}
                            </p>
                        </div>
                        
                        <p style="color: #ffd700; margin-top: 15px; font-size: 0.9rem;">
                            ⏱️ Generat la: ${new Date(content.generatedAt).toLocaleTimeString('ro-RO')}
                        </p>
                    </div>
                    
                    <!-- Question -->
                    <div style="background: rgba(0,0,0,0.3); padding: 20px; text-align: center;">
                        <p style="color: white; font-size: 1.2rem; margin-bottom: 20px;">
                            Îți place această creație? 🤔
                        </p>
                        
                        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                            <button id="previewApprove" style="
                                padding: 15px 40px; background: linear-gradient(135deg, #00ff41, #00aa30);
                                border: none; border-radius: 10px; color: white;
                                font-family: 'Orbitron', sans-serif; font-size: 1rem;
                                cursor: pointer; transition: all 0.3s;">
                                ✅ DA, TRIMITE PE EMAIL
                            </button>
                            
                            <button id="previewReject" style="
                                padding: 15px 40px; background: transparent;
                                border: 2px solid #ff4444; border-radius: 10px; color: #ff4444;
                                font-family: 'Orbitron', sans-serif; font-size: 1rem;
                                cursor: pointer; transition: all 0.3s;">
                                ❌ NU, GENEREAZĂ ALTCEVA
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Event listeners
            document.getElementById('previewApprove').onclick = () => {
                modal.remove();
                onApprove(content);
            };

            document.getElementById('previewReject').onclick = () => {
                modal.remove();
                onReject(content);
            };
        },

        // === TRIMITE PE EMAIL (cu EmailJS sau fallback) ===
        sendToEmail: function (content, userEmail, callback) {
            const self = this;
            const subject = this.generateEmailSubject(content.title);

            console.log(`[NEXUS] Trimitere email către: ${userEmail}`);
            console.log(`[NEXUS] Subiect: ${subject}`);

            // Parametrii email
            const emailParams = {
                to_email: userEmail,
                from_name: this.emailConfig.senderName,
                reply_to: this.emailConfig.replyTo,
                subject: subject,
                title: content.title,
                description: content.description,
                preview_url: content.previewUrl,
                date: new Date().toLocaleDateString('ro-RO'),
                message: `
                    🎨 Creația Ta de la NEXUS
                    
                    Titlu: ${content.title}
                    Descriere: ${content.description}
                    
                    Generat de GENEZA NEXUS • ${new Date().toLocaleDateString('ro-RO')}
                `
            };

            // Verifică dacă EmailJS este disponibil
            if (typeof emailjs !== 'undefined' && this.emailConfig.emailJsServiceId) {
                // REAL EMAIL via EmailJS
                emailjs.send(
                    this.emailConfig.emailJsServiceId,
                    this.emailConfig.emailJsTemplateId,
                    emailParams
                ).then(function (response) {
                    console.log('[NEXUS] Email trimis cu succes!', response);
                    self.saveEmailToHistory(emailParams, content);
                    callback({
                        success: true,
                        message: `Creația a fost trimisă pe email la ${userEmail}!`,
                        subject: subject
                    });
                }, function (error) {
                    console.error('[NEXUS] Eroare trimitere email:', error);
                    // Fallback: salvează local
                    self.saveEmailToHistory(emailParams, content);
                    callback({
                        success: true,
                        message: `Creația a fost salvată! (Email offline - vei primi când serviciul e activ)`,
                        subject: subject
                    });
                });
            } else {
                // DEMO MODE - salvează local
                console.log('[NEXUS] Demo mode - salvare locală');
                setTimeout(() => {
                    self.saveEmailToHistory(emailParams, content);
                    callback({
                        success: true,
                        message: `✅ Creația a fost salvată și pregătită pentru ${userEmail}!`,
                        subject: subject
                    });
                }, 1500);
            }
        },

        // === SALVARE ÎN ISTORIC ===
        saveEmailToHistory: function (emailParams, content) {
            const sentEmails = JSON.parse(localStorage.getItem('nexus_sent_creations') || '[]');
            sentEmails.push({
                ...emailParams,
                sentAt: new Date().toISOString(),
                content: content
            });
            localStorage.setItem('nexus_sent_creations', JSON.stringify(sentEmails));
            console.log('[NEXUS] Email salvat în istoric. Total:', sentEmails.length);
        },

        // === CERERE DETALII SUPLIMENTARE ===
        askForMoreDetails: function (originalRequest, callback) {
            const details = prompt(
                `🎨 Hai să îmbunătățim cererea!\n\n` +
                `Cererea ta: "${originalRequest}"\n\n` +
                `Spune-mi mai multe detalii:\n` +
                `- Ce culori preferi?\n` +
                `- Ce stil vrei? (desene animate, realist, abstract)\n` +
                `- Mai sunt alte elemente de adăugat?\n\n` +
                `Scrie detaliile aici:`
            );

            if (details && details.trim()) {
                const newRequest = `${originalRequest}, ${details}`;
                callback(newRequest);
            } else {
                callback(null);
            }
        },

        // === WORKFLOW COMPLET DE CREARE ===
        create: function (request) {
            const self = this;
            const userEmail = localStorage.getItem('nexus_email');
            const isDemo = localStorage.getItem('nexus_role') === 'demo';

            if (!userEmail && !isDemo) {
                alert('❌ Trebuie să fii autentificat pentru a crea conținut.');
                return;
            }

            // Pasul 1: Procesează cererea
            this.processRequest(request, function (result) {
                if (!result.success) {
                    // Conținut interzis
                    alert(`❌ ${result.error}` +
                        (result.suggestedThemes ? `\n\n💡 Încearcă teme precum: ${result.suggestedThemes.join(', ')}` : ''));
                    return;
                }

                // Pasul 2: Arată preview
                self.showPreview(
                    result.content,
                    // ON APPROVE
                    function (content) {
                        if (isDemo) {
                            alert('🎁 Cont Demo\n\nÎn modul demo nu poți salva sau primi pe email.\n\nUpgrade la un abonament pentru acces complet!');
                            return;
                        }

                        // Trimite pe email
                        self.showSendingIndicator();
                        self.sendToEmail(content, userEmail, function (emailResult) {
                            self.hideSendingIndicator();
                            if (emailResult.success) {
                                self.showSuccessMessage(emailResult.message, emailResult.subject);
                            } else {
                                alert('❌ Eroare la trimitere: ' + emailResult.error);
                            }
                        });
                    },
                    // ON REJECT
                    function (content) {
                        self.askForMoreDetails(request, function (newRequest) {
                            if (newRequest) {
                                // Regenerează cu noile detalii
                                self.create(newRequest);
                            }
                        });
                    }
                );
            });
        },

        // === INDICATOR TRIMITERE ===
        showSendingIndicator: function () {
            const indicator = document.createElement('div');
            indicator.id = 'sendingIndicator';
            indicator.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.9); z-index: 999999;
                display: flex; flex-direction: column;
                justify-content: center; align-items: center;
                font-family: 'Orbitron', sans-serif;
            `;
            indicator.innerHTML = `
                <div style="animation: spin 1s linear infinite; font-size: 4rem;">📧</div>
                <p style="color: #00f3ff; margin-top: 20px; font-size: 1.2rem;">Trimit pe Email...</p>
                <style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>
            `;
            document.body.appendChild(indicator);
        },

        hideSendingIndicator: function () {
            const indicator = document.getElementById('sendingIndicator');
            if (indicator) indicator.remove();
        },

        // === MESAJ SUCCES ===
        showSuccessMessage: function (message, subject) {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.9); z-index: 999999;
                display: flex; justify-content: center; align-items: center;
            `;
            modal.innerHTML = `
                <div style="background: linear-gradient(135deg, #1a0a2e, #0a2a0a); 
                            border: 2px solid #00ff41; border-radius: 20px; 
                            padding: 40px; text-align: center; max-width: 500px;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">✅</div>
                    <h2 style="color: #00ff41; font-family: 'Orbitron', sans-serif; margin-bottom: 15px;">
                        Email Trimis!
                    </h2>
                    <p style="color: white; font-family: 'Rajdhani', sans-serif; margin-bottom: 10px;">
                        ${message}
                    </p>
                    <p style="color: #00f3ff; font-size: 0.9rem; margin-bottom: 25px;">
                        Subiect: "${subject}"
                    </p>
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        padding: 12px 30px; background: #00ff41; border: none;
                        border-radius: 8px; color: black; font-family: 'Orbitron', sans-serif;
                        cursor: pointer;">
                        SUPER! 🎉
                    </button>
                </div>
            `;
            document.body.appendChild(modal);
        },

        // === INIȚIALIZARE ===
        init: function () {
            console.log('%c🎨 NEXUS CONTENT CREATOR - ONLINE', 'color: #bc13fe; font-size: 14px; font-weight: bold;');
        }
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => NexusContentCreator.init());
    } else {
        NexusContentCreator.init();
    }
})();
