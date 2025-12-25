/**
 * 🎤 NEXUS VOICE DIAGNOSTIC & FIX TOOL
 * Comprehensive voice/TTS testing and auto-repair
 */

const NexusVoiceDiagnostic = {

    issues: [],

    /**
     * Run complete voice diagnostic
     */
    async runDiagnostic() {
        console.log("🎤 VOICE DIAGNOSTIC: Starting comprehensive check...");
        this.issues = [];

        // 1. Check browser support
        this.checkBrowserSupport();

        // 2. Check voices availability
        await this.checkVoicesAvailable();

        // 3. Check NexusVoice module
        this.checkNexusVoiceModule();

        // 4. Test TTS output
        await this.testTTSOutput();

        // 5. Check language configuration
        this.checkLanguageConfig();

        // 6. Display results
        this.displayResults();

        // 7. Auto-repair if possible
        this.autoRepair();

        return this.issues.length === 0;
    },

    /**
     * Check browser support for Web Speech API
     */
    checkBrowserSupport() {
        if (!('speechSynthesis' in window)) {
            this.issues.push({
                severity: 'CRITICAL',
                module: 'Browser Support',
                problem: 'Web Speech API not supported',
                fix: 'Use Chrome, Edge, or Safari - Firefox has limited support'
            });
            return false;
        }
        console.log("✅ Web Speech API: Supported");
        return true;
    },

    /**
     * Check if voices are loaded
     */
    async checkVoicesAvailable() {
        return new Promise((resolve) => {
            let voices = speechSynthesis.getVoices();

            if (voices.length > 0) {
                console.log(`✅ Voices loaded: ${voices.length} available`);
                this.logAvailableVoices(voices);
                resolve(true);
            } else {
                // Voices might load async
                speechSynthesis.onvoiceschanged = () => {
                    voices = speechSynthesis.getVoices();
                    if (voices.length > 0) {
                        console.log(`✅ Voices loaded (async): ${voices.length} available`);
                        this.logAvailableVoices(voices);
                        resolve(true);
                    } else {
                        this.issues.push({
                            severity: 'HIGH',
                            module: 'Voice Loading',
                            problem: 'No voices available',
                            fix: 'Refresh page or check browser voice settings'
                        });
                        resolve(false);
                    }
                };

                // Timeout after 3 seconds
                setTimeout(() => {
                    if (voices.length === 0) {
                        this.issues.push({
                            severity: 'HIGH',
                            module: 'Voice Loading',
                            problem: 'Voices failed to load within 3 seconds',
                            fix: 'Reload page'
                        });
                        resolve(false);
                    }
                }, 3000);
            }
        });
    },

    /**
     * Log available voices for debugging
     */
    logAvailableVoices(voices) {
        console.log("\n📋 Available Voices:");
        const grouped = {};
        voices.forEach(v => {
            const lang = v.lang.split('-')[0];
            if (!grouped[lang]) grouped[lang] = [];
            grouped[lang].push(v.name);
        });

        Object.keys(grouped).forEach(lang => {
            console.log(`  ${lang}: ${grouped[lang].join(', ')}`);
        });
    },

    /**
     * Check NexusVoice module
     */
    checkNexusVoiceModule() {
        if (!window.NexusVoice) {
            this.issues.push({
                severity: 'CRITICAL',
                module: 'NexusVoice',
                problem: 'NexusVoice module not loaded',
                fix: 'Check if nexus_voice_core.js is loaded'
            });
            return false;
        }

        console.log("✅ NexusVoice module: Loaded");

        // Check methods
        if (typeof window.NexusVoice.speak !== 'function') {
            this.issues.push({
                severity: 'HIGH',
                module: 'NexusVoice',
                problem: 'speak() method missing',
                fix: 'Check nexus_voice_core.js implementation'
            });
            return false;
        }

        if (typeof window.NexusVoice.setLanguage !== 'function') {
            this.issues.push({
                severity: 'MEDIUM',
                module: 'NexusVoice',
                problem: 'setLanguage() method missing (v7.0 feature)',
                fix: 'Update nexus_voice_core.js'
            });
        }

        console.log("✅ NexusVoice methods: OK");
        return true;
    },

    /**
     * Test actual TTS output
     */
    async testTTSOutput() {
        if (!('speechSynthesis' in window)) return false;

        return new Promise((resolve) => {
            console.log("🧪 Testing TTS output...");

            const utterance = new SpeechSynthesisUtterance("Voice test successful");
            utterance.lang = 'en-US';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onstart = () => {
                console.log("✅ TTS test: STARTED");
            };

            utterance.onend = () => {
                console.log("✅ TTS test: COMPLETED");
                resolve(true);
            };

            utterance.onerror = (e) => {
                console.error("❌ TTS test: ERROR", e);
                this.issues.push({
                    severity: 'HIGH',
                    module: 'TTS Output',
                    problem: `TTS error: ${e.error}`,
                    fix: 'Check browser permissions and volume settings'
                });
                resolve(false);
            };

            try {
                speechSynthesis.speak(utterance);

                // Timeout after 5 seconds
                setTimeout(() => {
                    if (speechSynthesis.speaking) {
                        speechSynthesis.cancel();
                    }
                    resolve(true);
                }, 5000);
            } catch (error) {
                console.error("❌ TTS test: EXCEPTION", error);
                this.issues.push({
                    severity: 'HIGH',
                    module: 'TTS Output',
                    problem: `Exception: ${error.message}`,
                    fix: 'Browser may be blocking speech synthesis'
                });
                resolve(false);
            }
        });
    },

    /**
     * Check language configuration
     */
    checkLanguageConfig() {
        if (!window.NexusVoice) return;

        const currentLang = window.NexusVoice.config?.lang || 'unknown';
        console.log(`📍 Current voice language: ${currentLang}`);

        // Check if it matches user's expected language
        const userLang = window.NexusNeuralEngine?.memory?.userProfile?.language || 'en';
        const expectedLang = userLang === 'ro' ? 'ro-RO' : 'en-US';

        if (currentLang !== expectedLang) {
            this.issues.push({
                severity: 'LOW',
                module: 'Language Config',
                problem: `Voice language (${currentLang}) doesn't match user language (${expectedLang})`,
                fix: 'Run: NexusVoice.setLanguage("' + expectedLang + '")'
            });
        } else {
            console.log("✅ Language configuration: Matches user preference");
        }
    },

    /**
     * Display diagnostic results
     */
    displayResults() {
        console.log("\n" + "=".repeat(60));
        console.log("🎤 VOICE DIAGNOSTIC RESULTS");
        console.log("=".repeat(60));

        if (this.issues.length === 0) {
            console.log("✅ ALL VOICE SYSTEMS OPERATIONAL - NO ISSUES FOUND");
        } else {
            console.log(`⚠️  FOUND ${this.issues.length} ISSUE(S):\n`);

            this.issues.forEach((issue, index) => {
                console.log(`${index + 1}. [${issue.severity}] ${issue.module}`);
                console.log(`   Problem: ${issue.problem}`);
                console.log(`   Fix: ${issue.fix}\n`);
            });
        }

        console.log("=".repeat(60));
    },

    /**
     * Auto-repair voice issues
     */
    autoRepair() {
        console.log("🔧 AUTO-REPAIR: Attempting fixes...");

        // Fix 1: Reload voices if not loaded
        if (speechSynthesis.getVoices().length === 0) {
            console.log("🔧 Triggering voice reload...");
            speechSynthesis.getVoices();
        }

        // Fix 2: Set correct language
        if (window.NexusVoice && window.NexusVoice.setLanguage) {
            const userLang = window.NexusNeuralEngine?.memory?.userProfile?.language || 'en';
            const targetLang = userLang === 'ro' ? 'ro-RO' : 'en-US';
            console.log(`🔧 Setting voice language to: ${targetLang}`);
            window.NexusVoice.setLanguage(targetLang);
        }

        console.log("✅ AUTO-REPAIR Complete");
    },

    /**
     * Manual test command
     */
    testVoice(text = "This is a voice test", lang = 'en-US') {
        console.log(`🎤 Testing voice: "${text}" [${lang}]`);

        if (!('speechSynthesis' in window)) {
            console.error("❌ Speech Synthesis not supported");
            return false;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => console.log("✅ Voice playback started");
        utterance.onend = () => console.log("✅ Voice playback completed");
        utterance.onerror = (e) => console.error("❌ Voice error:", e);

        speechSynthesis.speak(utterance);
        return true;
    }
};

// Auto-run diagnostic on load
window.addEventListener('load', () => {
    setTimeout(async () => {
        console.log("\n🎤 Running Voice Diagnostic (auto)...");
        await NexusVoiceDiagnostic.runDiagnostic();
    }, 5000); // After other systems
});

// Expose globally
window.NexusVoiceDiagnostic = NexusVoiceDiagnostic;

// Add console commands
console.log(`
╔═══════════════════════════════════════════════════════════╗
║         NEXUS v7.0 VOICE DIAGNOSTIC LOADED                ║
╚═══════════════════════════════════════════════════════════╝

Available Commands:
  - NexusVoiceDiagnostic.runDiagnostic()  → Full voice check
  - NexusVoiceDiagnostic.testVoice()      → Test voice output
  - NexusVoiceDiagnostic.testVoice("Salut", "ro-RO")  → Test Romanian
`);
