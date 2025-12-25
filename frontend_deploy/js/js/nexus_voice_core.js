/**
 * 🎤 NEXUS VOICE CORE v4.0 (TTS & STT)
 * Optimized for natural speech patterns and multi-language support.
 */

const NexusVoice = {
    config: {
        lang: 'en-US',
        rate: 1.0,
        pitch: 1.0,
        voiceName: null
    },

    synth: window.speechSynthesis,

    init: function () {
        console.log("🎤 Voice Core Active");
        // Load Voices
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
    },

    // === NEXUS VOICE v6.0 (Premium & Animated) ===
    isSpeaking: false,

    loadVoices: function () {
        const voices = this.synth.getVoices();
        const targetLang = this.config.lang.split('-')[0]; // 'en', 'ro'

        // Priority List: Authentic/Premium voices first
        // Microsoft voices often have better quality on Windows
        let voice = voices.find(v => v.lang.startsWith(targetLang) && v.name.includes('Microsoft')) ||
            voices.find(v => v.lang.startsWith(targetLang) && v.name.includes('Google')) ||
            voices.find(v => v.lang === this.config.lang) ||
            voices.find(v => v.lang.includes('en'));

        if (voice) {
            this.config.voiceName = voice.name;
            console.log(`🗣️ Voice Active: ${voice.name} [${voice.lang}]`);
        }
    },

    speak: function (text) {
        if (!this.synth) return;
        if (this.synth.speaking) this.synth.cancel();

        // Strip code blocks or logs from speech
        const cleanText = text.replace(/cmd:[a-z_]*/g, "")
            .replace(/\[.*?\]/g, ""); // Remove [SYSTEM] tags

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = this.config.lang;
        utterance.rate = this.config.rate;
        utterance.pitch = 1.0; // Normalized

        // Apply Voice
        if (this.config.voiceName) {
            utterance.voice = this.synth.getVoices().find(v => v.name === this.config.voiceName);
        }

        // === LIP SYNC ANIMATION ===
        utterance.onstart = () => {
            this.isSpeaking = true;
            document.body.classList.add('nexus-speaking'); // Global Hook for CSS animations
            // If BioMatrix exists, stimulate
            if (window.NexusBioMatrix) window.NexusBioMatrix.stimulate('interaction');
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            document.body.classList.remove('nexus-speaking');
        };

        this.synth.speak(utterance);
    },

    /**
     * v7.0 NEW: Dynamic Language Switching
     * Auto-configure voice based on detected language
     */
    setLanguage: function (lang) {
        // Normalize language code
        const fullLang = lang.includes('-') ? lang : `${lang}-${lang.toUpperCase()}`;

        console.log(`🌐 Switching voice language: ${this.config.lang} → ${fullLang}`);

        this.config.lang = fullLang;
        this.loadVoices(); // Reload voices for new language

        // Also update SpeechRecognition if available
        if (this.recognition) {
            this.recognition.lang = fullLang;
        }

        console.log(`✅ Voice language updated: ${fullLang}`);
    },

    listen: function (callback) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const r = new SpeechRecognition();
        r.lang = this.config.lang;
        r.continuous = false; // Capture commands one by one
        r.interimResults = false;

        r.onstart = () => console.log("🎤 EARS OPEN");

        r.onresult = (e) => {
            const txt = e.results[0][0].transcript;
            console.log("🎤 HEARD:", txt);

            // 🧠 CONNECTION TO BRAIN
            if (window.NexusNeuralEngine) {
                window.NexusNeuralEngine.receiveSensoryInput('audio_transcript', txt);
            }

            if (callback) callback(txt);
        };

        r.onerror = (e) => console.warn("🎤 Hearing Error:", e.error);

        r.start();
    }
};

// Global Adapter & Auto-Init
window.NexusVoice = NexusVoice;
window.addEventListener('load', () => NexusVoice.init());

NexusVoice.init();
