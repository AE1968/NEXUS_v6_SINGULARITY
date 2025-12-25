// ═══════════════════════════════════════════════════════════
// KELION VOICE SYSTEM v10.0 - SENTIENT UPDATE
// Auto-detect language, OpenAI Neural TTS with Browser Fallback
// ═══════════════════════════════════════════════════════════

class KelionVoice {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.currentGender = 'male'; // kelion = male, veona = female
        this.detectedLanguage = 'en-GB'; // default English
        this.isEnabled = false;

        // Voice preferences for Browser Fallback
        this.voicePreferences = {
            male: {
                'ro-RO': ['Microsoft Andrei Online', 'Google română', 'Andrei'],
                'en-US': ['Microsoft Guy Online', 'Microsoft Mark Online', 'Google US English', 'David'],
                'en-GB': ['Microsoft Ryan Online', 'Microsoft George Online', 'Google UK English Male', 'George', 'Daniel']
            },
            female: {
                'ro-RO': ['Microsoft Ioana Online', 'Google română', 'Ioana'],
                'en-US': ['Microsoft Aria Online', 'Microsoft Jenny Online', 'Google US English', 'Zira'],
                'en-GB': ['Microsoft Sonia Online', 'Microsoft Libby Online', 'Google UK English Female', 'Hazel', 'Amy']
            }
        };

        this.init();
    }

    init() {
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
        this.loadVoices();
        console.log('🔊 Kelion Voice System initialized');
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
        this.voices.sort((a, b) => {
            const aOnline = a.name.includes('Online') || a.name.includes('Neural') ? -1 : 1;
            const bOnline = b.name.includes('Online') || b.name.includes('Neural') ? -1 : 1;
            return aOnline - bOnline;
        });
    }

    detectLanguage(text) {
        const romanianPatterns = /[ăîâșțĂÎÂȘȚ]|(\b(și|este|sunt|pentru|care|sau|dar|când|unde|cum|de|la|în|pe|cu|din|ce|nu|da|salut|bună|mulțumesc)\b)/i;
        this.detectedLanguage = romanianPatterns.test(text) ? 'ro-RO' : 'en-GB';
        return this.detectedLanguage;
    }

    findVoice() {
        const prefs = this.voicePreferences[this.currentGender][this.detectedLanguage] || this.voicePreferences[this.currentGender]['en-GB'];
        for (const pref of prefs) {
            const voice = this.voices.find(v => v.name.toLowerCase().includes(pref.toLowerCase()));
            if (voice) return voice;
        }
        return this.voices.find(v => v.lang.startsWith(this.detectedLanguage.split('-')[0])) || this.voices[0];
    }

    setGender(gender) {
        this.currentGender = gender;
        console.log(`👤 Voice gender set to: ${gender}`);
    }

    enable() { this.isEnabled = true; }
    disable() {
        this.isEnabled = false;
        this.synth.cancel();
    }

    stop() {
        this.synth.cancel();
        document.body.classList.remove('speaking');
        if (window.NexusEngine) window.NexusEngine.speak(false);
    }

    // MAIN SPEAK METHOD
    async speak(text, options = {}) {
        // Handle legacy function passing
        if (typeof options === 'function') options = { onEnd: options };

        if (!this.isEnabled || !text) {
            if (options.onEnd) options.onEnd();
            return;
        }

        this.stop();
        this.detectLanguage(text);

        // Lock to current avatar gender
        const lockedGender = localStorage.getItem('kelion_avatar_gender');
        if (lockedGender) this.currentGender = lockedGender;

        // Try OpenAI AI TTS (Voice 2.0)
        await this.speakAI(text, options);
    }

    async speakAI(text, options = {}) {
        const body = document.body;
        body.classList.add('speaking');
        if (window.NexusEngine) window.NexusEngine.speak(true);

        try {
            const api_url = window.SYSTEM_CONFIG?.API_URL || '';
            const res = await fetch(`${api_url}/api/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    gender: this.currentGender,
                    provider: localStorage.getItem('kelion_tts_provider') || 'openai',
                    username: sessionStorage.getItem('kelion_current_user') || 'Utilizator'
                })
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audio.onended = () => {
                    body.classList.remove('speaking');
                    if (window.NexusEngine) window.NexusEngine.speak(false);
                    URL.revokeObjectURL(url);
                    if (options.onEnd) options.onEnd();
                };
                audio.play();
                return;
            }
        } catch (e) {
            console.warn('OpenAI TTS Error, falling back...', e);
        }

        this.speakBrowser(text, options);
    }

    speakBrowser(text, options = {}) {
        const processedText = text.replace(/\./g, '... ').replace(/,/g, ', ');
        const utterance = new SpeechSynthesisUtterance(processedText);
        utterance.voice = this.findVoice();
        utterance.lang = this.detectedLanguage;
        utterance.rate = 1.1;

        utterance.onstart = () => {
            document.body.classList.add('speaking');
            if (window.NexusEngine) window.NexusEngine.speak(true);
        };
        utterance.onend = () => {
            document.body.classList.remove('speaking');
            if (window.NexusEngine) window.NexusEngine.speak(false);
            if (options.onEnd) options.onEnd();
        };
        this.synth.speak(utterance);
    }
}

// Global instance
window.kelionVoice = new KelionVoice();

// Integration hooks
document.addEventListener('DOMContentLoaded', () => {
    // Hook into avatar switch if it exists
    const originalSwitchAvatar = window.switchAvatar;
    if (originalSwitchAvatar) {
        window.switchAvatar = function (gender) {
            originalSwitchAvatar(gender);
            window.kelionVoice.setGender(gender);
        };
    }

    // Restore state
    const currentUser = sessionStorage.getItem('kelion_current_user') || localStorage.getItem('kelion_current_user');
    if (currentUser) {
        window.kelionVoice.enable();
        const gender = localStorage.getItem('kelion_avatar_gender') || 'male';
        window.kelionVoice.setGender(gender);
    }
});
