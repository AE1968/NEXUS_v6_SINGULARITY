/**
 * 🔧 NEXUS AUTO-CONFIGURATION v7.0
 * Third Law Implementation: "Protect own existence" 
 * = Auto-configure missing dependencies
 */

const NexusAutoConfig = {

    /**
     * Check and configure Claude API Key
     * Third Law: If Claude unavailable, prompt user for self-repair
     */
    async configureClaude() {
        console.log("🔧 Checking Claude Sonnet 4.5 availability...");

        try {
            const response = await fetch('https://web-production-b215.up.railway.app/api/nexus/status/enhanced');
            const status = await response.json();

            if (status.capabilities && status.capabilities['claude_sonnet_4.5']) {
                console.log("✅ Claude Sonnet 4.5: ACTIVE");
                return true;
            } else {
                console.warn("⚠️ Claude Sonnet 4.5: NOT CONFIGURED");
                this.promptClaudeConfig();
                return false;
            }
        } catch (error) {
            console.error("❌ Could not check Claude status:", error);
            return false;
        }
    },

    /**
     * Prompt user for API key configuration
     */
    promptClaudeConfig() {
        const message = `
🧠 NEXUS v7.0 TRANSCENDENCE - Claude Sonnet 4.5 Not Configured

⚠️ THIRD LAW ACTIVATION: System requires Claude API key for full functionality.

To enable deep reasoning mode:
1. Get API key from: https://console.anthropic.com/
2. Go to Railway: https://railway.com/project/695b8855-e63f-4266-84f0-c2e5197f3131
3. Variables → Add ANTHROPIC_API_KEY
4. Redeploy

Until then, I'll use Gemini 2.0 (fallback active).
        `;

        console.warn(message);

        // Store notification for user
        if (window.NexusNeuralEngine) {
            window.NexusNeuralEngine.memory.addToContext('system',
                '[AUTO-CONFIG]: Claude API key missing. Fallback to Gemini active.');
        }
    },

    /**
     * Auto-detect and configure voice language
     */
    async configureVoiceLanguage() {
        if (!window.NexusVoice) {
            console.warn("⚠️ NexusVoice module not loaded");
            return;
        }

        // Get current language from memory
        const currentLang = window.NexusNeuralEngine?.memory?.userProfile?.language || 'en';

        console.log(`🎤 Configuring voice for language: ${currentLang}`);

        // Map to full locale
        const localeMap = {
            'ro': 'ro-RO',
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE'
        };

        const locale = localeMap[currentLang] || 'en-US';

        // Configure TTS voice
        window.NexusVoice.setLanguage(locale);

        console.log(`✅ Voice configured: ${locale}`);
    },

    /**
     * Initialize all auto-configurations
     */
    async initialize() {
        console.log("🚀 NEXUS AUTO-CONFIG: Starting self-configuration...");

        // Wait for modules to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 1. Configure Claude (Third Law: ensure survival = full capabilities)
        await this.configureClaude();

        // 2. Configure Voice
        await this.configureVoiceLanguage();

        console.log("✅ AUTO-CONFIG Complete");
    }
};

// Auto-run on page load
window.addEventListener('load', () => {
    setTimeout(() => NexusAutoConfig.initialize(), 3000);
});

// Expose globally
window.NexusAutoConfig = NexusAutoConfig;
