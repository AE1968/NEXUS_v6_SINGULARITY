// ═══════════════════════════════════════════════════════════
// KELION VOICE SYSTEM v1.0
// Auto-detect language, male/female voice based on avatar
// ═══════════════════════════════════════════════════════════

class KelionVoice {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.currentGender = 'male'; // kelion = male, veona = female
        this.detectedLanguage = 'en-GB'; // default English
        this.isEnabled = false;

        // Voice preferences per gender per language - prioritize neural/natural voices
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
        // Load voices when available
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
        this.loadVoices();
        console.log('🔊 Kelion Voice System initialized');
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
        // Sort to prioritize Online/Neural voices
        this.voices.sort((a, b) => {
            const aOnline = a.name.includes('Online') || a.name.includes('Neural') ? -1 : 1;
            const bOnline = b.name.includes('Online') || b.name.includes('Neural') ? -1 : 1;
            return aOnline - bOnline;
        });
        console.log(`📢 Loaded ${this.voices.length} voices`);
    }

    // Detect language from text
    detectLanguage(text) {
        // Romanian specific patterns
        const romanianPatterns = /[ăîâșțĂÎÂȘȚ]|(\b(și|este|sunt|pentru|care|sau|dar|când|unde|cum|de|la|în|pe|cu|din|ce|nu|da|bine|salut|bună|mulțumesc|te rog)\b)/i;

        if (romanianPatterns.test(text)) {
            this.detectedLanguage = 'ro-RO';
        } else {
            // Default to English if no Romanian detected
            this.detectedLanguage = 'en-GB';
        }

        console.log(`🌍 Language detected: ${this.detectedLanguage}`);
        return this.detectedLanguage;
    }

    // Find best voice for current gender and language
    findVoice() {
        const preferences = this.voicePreferences[this.currentGender][this.detectedLanguage] ||
            this.voicePreferences[this.currentGender]['en-GB'];

        // Try to find preferred voice (prioritize neural/online voices)
        for (const pref of preferences) {
            const voice = this.voices.find(v => v.name.toLowerCase().includes(pref.toLowerCase()));
            if (voice) {
                console.log(`🎤 Selected voice: ${voice.name} (${voice.localService ? 'local' : 'cloud'})`);
                return voice;
            }
        }

        // Fallback: find any voice matching language
        const langCode = this.detectedLanguage.split('-')[0];
        const langVoices = this.voices.filter(v => v.lang.startsWith(langCode));

        if (langVoices.length > 0) {
            // Prefer cloud/online voices for better quality
            const cloudVoice = langVoices.find(v => !v.localService || v.name.includes('Online') || v.name.includes('Google'));
            if (cloudVoice) {
                console.log(`🎤 Fallback cloud voice: ${cloudVoice.name}`);
                return cloudVoice;
            }
            console.log(`🎤 Fallback local voice: ${langVoices[0].name}`);
            return langVoices[0];
        }

        // Ultimate fallback - first available
        console.log(`🎤 Ultimate fallback: ${this.voices[0]?.name}`);
        return this.voices[0];
    }

    // Set gender based on avatar switch
    setGender(gender) {
        this.currentGender = gender;
        console.log(`👤 Voice gender set to: ${gender === 'male' ? 'KELION (M)' : 'VEONA (F)'}`);
    }

    // Enable voice after login
    enable() {
        this.isEnabled = true;
        console.log('✅ Voice system ENABLED');
    }

    // Disable voice on logout
    disable() {
        this.isEnabled = false;
        this.synth.cancel();
        console.log('🔇 Voice system DISABLED');
    }

    // Speak text with auto-detection
    speak(text, options = {}) {
        if (!this.isEnabled) {
            console.log('⚠️ Voice not enabled (login required)');
            return;
        }

        if (!text || text.trim() === '') return;

        // Cancel any ongoing speech
        this.synth.cancel();

        // Detect language
        this.detectLanguage(text);

        // Add natural pauses - replace punctuation with slight delays
        let processedText = text
            .replace(/\./g, '... ')      // Longer pause after periods
            .replace(/,/g, ', ')          // Brief pause after commas
            .replace(/!/g, '! ')          // Pause after exclamations
            .replace(/\?/g, '? ');        // Pause after questions

        // Use locked gender if logged in
        const lockedGender = localStorage.getItem('kelion_avatar_gender');
        if (lockedGender) {
            this.currentGender = lockedGender;
        }

        // Create utterance with natural settings
        const utterance = new SpeechSynthesisUtterance(processedText);
        utterance.voice = this.findVoice();
        utterance.lang = this.detectedLanguage;
        utterance.rate = options.rate || 1.2;  // Same rate for M and F
        utterance.pitch = 1.0;                   // Natural pitch
        utterance.volume = options.volume || 1.0;

        // Events
        utterance.onstart = () => {
            console.log(`🗣️ Speaking: "${text.substring(0, 50)}..."`);
            document.body.classList.add('speaking');
        };

        utterance.onend = () => {
            document.body.classList.remove('speaking');
        };

        utterance.onerror = (e) => {
            console.error('❌ Speech error:', e.error);
            document.body.classList.remove('speaking');
        };

        // Speak
        this.synth.speak(utterance);
    }

    // Stop speaking
    stop() {
        this.synth.cancel();
        document.body.classList.remove('speaking');
    }

    // Get available voices for debugging
    listVoices() {
        console.table(this.voices.map(v => ({
            name: v.name,
            lang: v.lang,
            local: v.localService
        })));
    }
}

// Global instance
window.kelionVoice = new KelionVoice();

// Integration hooks
document.addEventListener('DOMContentLoaded', () => {
    // Hook into avatar switch
    const originalSwitchAvatar = window.switchAvatar;
    if (originalSwitchAvatar) {
        window.switchAvatar = function (gender) {
            originalSwitchAvatar(gender);
            window.kelionVoice.setGender(gender);
        };
    }

    // Check if already logged in
    const currentUser = localStorage.getItem('kelion_current_user');
    if (currentUser) {
        window.kelionVoice.enable();
        const gender = localStorage.getItem('kelion_avatar_gender') || 'male';
        window.kelionVoice.setGender(gender);
    }
});

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KelionVoice;
}
