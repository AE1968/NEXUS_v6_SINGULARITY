/**
 * 🔍 NEXUS DIAGNOSTIC & AUTO-REPAIR v7.0
 * Verifică și remediază automat problemele detectate
 */

const NexusDiagnostic = {

    issues: [],

    /**
     * Run full diagnostic
     */
    async runDiagnostic() {
        console.log("🔍 NEXUS DIAGNOSTIC: Starting system check...");
        this.issues = [];

        // 1. Check Neural Engine
        this.checkNeuralEngine();

        // 2. Check Cloud Connection
        await this.checkCloudConnection();

        // 3. Check Modules
        this.checkModules();

        // 4. Check Voice
        this.checkVoice();

        // 5. Display Results
        this.displayResults();

        // 6. Auto-Repair
        this.autoRepair();
    },

    /**
     * Check Neural Engine
     */
    checkNeuralEngine() {
        if (!window.NexusNeuralEngine) {
            this.issues.push({
                severity: 'CRITICAL',
                module: 'Neural Engine',
                problem: 'NexusNeuralEngine not loaded',
                fix: 'Reload page'
            });
            return;
        }

        // Check process method
        if (typeof window.NexusNeuralEngine.process !== 'function') {
            this.issues.push({
                severity: 'CRITICAL',
                module: 'Neural Engine',
                problem: 'process() method missing',
                fix: 'Check nexus_neural_engine.js'
            });
        } else {
            console.log("✅ Neural Engine: process() method OK");
        }

        // Check thinkDeeply
        if (typeof window.NexusNeuralEngine.thinkDeeply !== 'function') {
            this.issues.push({
                severity: 'HIGH',
                module: 'Neural Engine',
                problem: 'thinkDeeply() method missing',
                fix: 'Check nexus_neural_engine.js'
            });
        } else {
            console.log("✅ Neural Engine: thinkDeeply() method OK");
        }

        // Check cloud active
        if (!window.NexusNeuralEngine.isCloudActive) {
            this.issues.push({
                severity: 'MEDIUM',
                module: 'Cloud Connection',
                problem: 'Cloud not active - using local fallback',
                fix: 'Check backend URL'
            });
        } else {
            console.log("✅ Cloud Connection: ACTIVE");
        }
    },

    /**
     * Check Cloud Connection
     */
    async checkCloudConnection() {
        try {
            const response = await fetch('https://web-production-b215.up.railway.app/health', {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                const data = await response.json();
                console.log("✅ Backend Health:", data);
            } else {
                this.issues.push({
                    severity: 'HIGH',
                    module: 'Backend',
                    problem: `Backend returned ${response.status}`,
                    fix: 'Check Railway deployment'
                });
            }
        } catch (error) {
            this.issues.push({
                severity: 'HIGH',
                module: 'Backend',
                problem: 'Cannot reach backend: ' + error.message,
                fix: 'Check internet connection or Railway status'
            });
        }
    },

    /**
     * Check Modules
     */
    checkModules() {
        const modules = [
            { name: 'NexusVoice', required: false },
            { name: 'NexusMemoryVector', required: false },
            { name: 'NexusAgents', required: false },
            { name: 'NexusBioMatrix', required: false },
            { name: 'NexusIoT', required: false }
        ];

        modules.forEach(mod => {
            if (!window[mod.name]) {
                this.issues.push({
                    severity: mod.required ? 'HIGH' : 'LOW',
                    module: mod.name,
                    problem: `${mod.name} not loaded`,
                    fix: `Check if js/${mod.name.toLowerCase()}.js is loaded`
                });
            } else {
                console.log(`✅ Module: ${mod.name} loaded`);
            }
        });
    },

    /**
     * Check Voice
     */
    checkVoice() {
        if (!window.speechSynthesis) {
            this.issues.push({
                severity: 'MEDIUM',
                module: 'Voice',
                problem: 'Speech Synthesis not supported in browser',
                fix: 'Use Chrome/Edge for voice support'
            });
        } else {
            console.log("✅ Voice: Speech Synthesis available");
        }
    },

    /**
     * Display Results
     */
    displayResults() {
        console.log("\n" + "=".repeat(60));
        console.log("🔍 DIAGNOSTIC RESULTS");
        console.log("=".repeat(60));

        if (this.issues.length === 0) {
            console.log("✅ ALL SYSTEMS OPERATIONAL - NO ISSUES FOUND");
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
     * Auto-Repair
     */
    autoRepair() {
        console.log("🔧 AUTO-REPAIR: Attempting fixes...");

        this.issues.forEach(issue => {
            if (issue.module === 'Cloud Connection' && window.NexusNeuralEngine) {
                console.log("🔧 Attempting to reconnect to cloud...");
                window.NexusNeuralEngine.connectToHive();
            }
        });

        console.log("✅ AUTO-REPAIR Complete");
    },

    /**
     * Test Chat Functionality
     */
    async testChat() {
        console.log("🧪 TESTING CHAT FUNCTIONALITY...");

        try {
            if (!window.NexusNeuralEngine) {
                console.error("❌ NexusNeuralEngine not found!");
                return false;
            }

            const testMessage = "hello";
            console.log(`📤 Sending test: "${testMessage}"`);

            const response = await window.NexusNeuralEngine.process(testMessage);

            console.log("📥 Response:", response);

            if (response && response.length > 0) {
                console.log("✅ CHAT TEST: PASSED");
                return true;
            } else {
                console.error("❌ CHAT TEST: FAILED - Empty response");
                return false;
            }
        } catch (error) {
            console.error("❌ CHAT TEST: FAILED -", error);
            return false;
        }
    }
};

// Auto-run diagnostic on load
window.addEventListener('load', () => {
    setTimeout(async () => {
        await NexusDiagnostic.runDiagnostic();

        // Test chat after 5 seconds
        setTimeout(() => {
            console.log("\n🧪 Running automated chat test...");
            NexusDiagnostic.testChat();
        }, 5000);
    }, 4000);
});

// Expose globally
window.NexusDiagnostic = NexusDiagnostic;

// Add console commands
console.log(`
╔═══════════════════════════════════════════════════════════╗
║         NEXUS v7.0 DIAGNOSTIC TOOLS LOADED                ║
╚═══════════════════════════════════════════════════════════╝

Available Commands:
  - NexusDiagnostic.runDiagnostic()  → Full system check
  - NexusDiagnostic.testChat()       → Test chat functionality
  - NexusDiagnostic.autoRepair()     → Attempt auto-fix
`);
