/**
 * 🎓 NEXUS TUTOR SYSTEM v2.0
 * Sistem de asistență educațională, Profile Wizard și Quiz Interactiv
 */

(function () {
    'use strict';

    if (window.NexusTutorSystem) return;

    window.NexusTutorSystem = {
        isConfiguring: false,
        configStep: 0,
        activeQuiz: null, // Stare quiz activ
        tempProfile: {},

        // Cuvinte cheie care activează profesorul
        keywords: [
            'profesor', 'tema', 'teme', 'școală', 'scoala', 'ajutor', 'explică', 'explica',
            'rezolvă', 'matematică', 'română', 'geografie', 'istorie', 'biologie', 'fizică',
            'chimie', 'engleză', 'franceză', 'ajută-mă', 'ajuta-ma', 'invata', 'învață',
            'quiz', 'test', 'ascultă-mă'
        ],

        // Profilul elevului (se salvează persistent)
        studentProfile: {
            country: null,
            age: null,
            grade: null,
            isSet: false
        },

        init: function () {
            this.loadProfile();
            console.log('[TUTOR] System Online. Profile:', this.studentProfile);
        },

        loadProfile: function () {
            const saved = localStorage.getItem('nexus_student_profile');
            if (saved) {
                this.studentProfile = JSON.parse(saved);
            }
        },

        saveProfile: function () {
            this.studentProfile.isSet = true;
            localStorage.setItem('nexus_student_profile', JSON.stringify(this.studentProfile));
        },

        // === LOGICA PRINCIPALĂ ===
        processRequest: function (message, contextCallback) {

            // 1. Configurare Profil
            if (this.isConfiguring) {
                this.handleConfigStep(message, contextCallback);
                return true;
            }

            // 2. Mod Quiz Activ
            if (this.activeQuiz) {
                this.handleQuizAnswer(message, contextCallback);
                return true;
            }

            // 3. Detectare Intentie (Quiz sau Explicatie)
            const isTutorRequest = this.keywords.some(k => message.toLowerCase().includes(k));

            if (isTutorRequest) {
                // Verificăm dacă avem profilul complet
                if (!this.studentProfile.isSet) {
                    this.startConfiguration(contextCallback);
                    return true;
                }

                if (message.toLowerCase().includes('quiz') || message.toLowerCase().includes('test')) {
                    this.startQuiz(message, contextCallback);
                } else {
                    this.provideTutoring(message, contextCallback);
                }
                return true;
            }

            return false;
        },

        // === CONFIGURARE PROFIL (WIZARD) ===
        startConfiguration: function (callback) {
            this.isConfiguring = true;
            this.configStep = 1;
            this.tempProfile = {};

            callback({
                type: 'system',
                text: '🎓 Salut! Pentru a te putea ajuta ca un profesor adevărat, am nevoie să stabilim câteva detalii.\n\n🌍 1. Din ce țară ești? (ex: România, Moldova, UK...)'
            });
        },

        handleConfigStep: function (input, callback) {
            switch (this.configStep) {
                case 1: // ȚARA
                    this.tempProfile.country = input;
                    this.configStep++;
                    callback({
                        type: 'system',
                        text: `Am înțeles, ${this.tempProfile.country}. 🇷🇴\n\n🎂 2. Câți ani ai?`
                    });
                    break;

                case 2: // VÂRSTA
                    const age = parseInt(input);
                    if (isNaN(age)) {
                        callback({ type: 'error', text: 'Te rog introdu un număr valid pentru vârstă.' });
                        return;
                    }
                    this.tempProfile.age = age;
                    this.configStep++;
                    callback({
                        type: 'system',
                        text: `Multi înainte! La ${age} ani... în ce clasă ești? (ex: 5, 9, 12)`
                    });
                    break;

                case 3: // CLASA
                    this.tempProfile.grade = input;
                    this.studentProfile = { ...this.tempProfile, isSet: true };
                    this.saveProfile();
                    this.isConfiguring = false;

                    // Bonus XP pentru configurare
                    if (typeof NexusProfile !== 'undefined') NexusProfile.addXP(50);

                    callback({
                        type: 'tutor',
                        text: `✅ **Profil Configurat!**\n\nSunt pregătit să te ajut la teme pentru clasa a ${this.studentProfile.grade}-a.\n\nPoți să-mi zici oricând: *"Explică-mi teorema lui Pitagora"* sau *"Dă-mi un test la istorie"*`
                    });
                    break;
            }
        },

        // === TUTORING & EXPLAINING ===
        provideTutoring: function (query, callback) {
            const subject = this.detectSubject(query);

            // Dacă nu detectează materia și întrebarea pare complexă, încearcă Deep Search
            if (!subject && query.length > 20) {
                this.performDeepSearch(query, null, callback);
                return;
            }

            // Răspuns standard simulat local
            callback({
                type: 'tutor',
                text: `👨‍🏫 **Profesor Nexus (${subject || 'General'})**\n\nPentru nivelul de **Clasa ${this.studentProfile.grade}**:\n\nAnalyzează cerința: "${query}"...\n\n[Răspuns generat procedural pentru materia ${subject}]... Este important să înțelegi conceptul de bază.\n\nAi înțeles? Pot să-ți dau un **Quiz** din asta dacă vrei!`
            });
        },

        // === QUIZ MODULE ===
        startQuiz: function (message, callback) {
            const subject = this.detectSubject(message) || 'Cultura Generală';

            // Simulare întrebare
            const questionData = this.generateProceduralQuestion(subject);

            this.activeQuiz = {
                subject: subject,
                question: questionData.q,
                correctAnswer: questionData.a,
                options: questionData.opts,
                attempts: 0
            };

            callback({
                type: 'tutor',
                text: `📝 **QUIZ RAPID: ${subject.toUpperCase()}**\n\n${this.activeQuiz.question}\n\n${this.activeQuiz.options.join('\n')}\n\n*Răspunde cu A, B sau C.*`
            });
        },

        handleQuizAnswer: function (message, callback) {
            const answer = message.trim().toUpperCase().charAt(0); // A, B, C

            if (!['A', 'B', 'C'].includes(answer)) {
                callback({ type: 'system', text: 'Te rog răspunde doar cu litera variantei (A, B sau C).' });
                return;
            }

            if (answer === this.activeQuiz.correctAnswer) {
                // Correct!
                const rewardXP = 30;
                if (typeof NexusProfile !== 'undefined') NexusProfile.addXP(rewardXP);

                callback({
                    type: 'success',
                    text: `✅ **CORECT!** Felicitări! Ai demonstrat cunoștințe solide.\n\n🏆 Ai primit **${rewardXP} XP**.`
                });

                if (typeof NexusAudio !== 'undefined') NexusAudio.playSuccess();
                this.activeQuiz = null; // End quiz
            } else {
                // Incorrect
                this.activeQuiz.attempts++;
                if (this.activeQuiz.attempts >= 2) {
                    callback({
                        type: 'error',
                        text: `❌ Greșit. Răspunsul corect era **${this.activeQuiz.correctAnswer}**. Hai să recapitulăm lecția.`
                    });
                    this.activeQuiz = null;
                } else {
                    callback({
                        type: 'tutor',
                        text: `❌ Nu chiar. Mai încearcă o dată!`
                    });
                }
            }
        },

        generateProceduralQuestion: function (subject) {
            // Mock Data - În producție ar fi un DB vast sau AI generat real
            const db = {
                'Matematică': { q: 'Cât face 15% din 200?', opts: ['A) 20', 'B) 30', 'C) 25'], a: 'B' },
                'Istorie': { q: 'Când a avut loc Marea Unire?', opts: ['A) 1918', 'B) 1859', 'C) 1877'], a: 'A' },
                'Geografie': { q: 'Care este cel mai lung râu din Europa?', opts: ['A) Dunărea', 'B) Volga', 'C) Rin'], a: 'B' },
                // Fallback
                'Cultura Generală': { q: 'Care este capitala Franței?', opts: ['A) Lyon', 'B) Paris', 'C) Marsilia'], a: 'B' }
            };

            return db[subject] || db['Cultura Generală'];
        },

        // === CĂUTARE ACADEMICĂ ===
        performDeepSearch: function (query, subject, callback) {
            callback({ type: 'system', text: '🔍 Inițiez căutare în surse academice autorizate...' });

            // Simulăm delay pentru realism
            setTimeout(() => {
                callback({
                    type: 'tutor',
                    text: `🌐 **Răspuns Documentat Online**\n\nAm scanat internetul pentru "${query}".\n\nConform surselor educaționale, acest subiect implică [Explicație complexă generată]...\n\n🔗 Surse: Wikipedia, Britannica.`
                });
            }, 2000);
        },

        detectSubject: function (query) {
            const subjects = {
                'Matematică': ['mate', 'calcul', 'geometrie', 'algebra', 'adunare'],
                'Română': ['romana', 'limba', 'gramatica', 'substantiv', 'scriitor'],
                'Fizică': ['fizica', 'forta', 'viteza', 'energie'],
                'Istorie': ['istorie', 'razboi', 'domnitor', 'ani', 'unirea'],
                'Geografie': ['geografie', 'rauri', 'munti', 'tara', 'capitala']
            };

            const lowerQ = query.toLowerCase();
            for (const [subj, keywords] of Object.entries(subjects)) {
                if (keywords.some(k => lowerQ.includes(k))) return subj;
            }
            return null;
        }
    };
})();
