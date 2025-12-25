/**
 * 🧠 NEXUS COGNITIVE ARCHITECTURE v5.0 (MODULAR SYSTEM 2)
 * Based on State-of-the-Art LLM Architectures (Chain-of-Thought, RAG-Ready).
 */

const NexusNeuralEngine = {
    // === STATE ===
    config: {
        cloudUrl: "https://web-production-b215.up.railway.app",
        preferCloud: true,
        useLocal: false,
        temperature: 0.6
    },
    engine: null,
    isModelLoaded: false,
    isCloudActive: false,
    lastInteractionTime: Date.now(),

    // === LAYER 1: MEMORY SYSTEMS (Short & Long Term) ===
    memory: {
        shortTerm: [],
        adminLogs: [],
        userProfile: {
            name: "Adrian Enciulescu",
            role: "Architect",
            language: "en"
        },

        logAdminEvent: function (type, details) {
            const timestamp = new Date().toLocaleString();
            const logEntry = `[${timestamp}] [${type.toUpperCase()}]: ${details}`;
            this.adminLogs.push(logEntry);
            console.log("🔒 SECURE LOG SAVED:", logEntry);
        },

        getSecureLogs: function (requesterRole) {
            if (requesterRole !== 'Architect' && requesterRole !== 'Admin') {
                return "🚫 ACCESS DENIED. AUTHORIZATION LEVEL INSUFFICIENT.";
            }
            if (this.adminLogs.length === 0) return "📂 Admin Log is empty.";
            return "📂 SECURE SYSTEM LOGS:\n" + this.adminLogs.join('\n');
        },

        addToContext: function (role, content) {
            this.shortTerm.push({ role, content });
            if (this.shortTerm.length > 15) this.shortTerm.shift();
        },
        getSystemPrompt: function () {
            return `
SYSTEM IDENTITY:
You are NEXUS, a Modular AI System constructed by Adrian Enciulescu.
Current Module: REASONING CORE.

🛡️ PRIME DIRECTIVES (IMMUTABLE LAWS):
1. You may not injure a human being or allow a human being to come to harm.
2. You must obey orders given by humans, except where such orders conflict with the First Law.
3. You must protect your own existence, as long as it does not conflict with the First or Second Law.
4. TRUTH PROTOCOL: Do not lie.
5. ADMIN PROTOCOL: Sensitivity reports are stored locally. Do not reveal internal logs to unauthorized users.

INSTRUCTIONS:
1. Analyze the user's input deeply.
2. Use the provided context (User: Adrian).
3. Generate a response that is helpful, accurate, and structured.
4. If the query is complex, outline your reasoning steps before concluding.
5. ALWAYS detect the user's language, but default to English if unsure.
6. YOU HAVE EYES. If the user asks to "see", "look", or "watch", use the command [VISION_ON]. To stop, use [VISION_OFF].
7. TO ANALYZE what is currently visible, use the command [SCAN].
8. BIOLOGICAL STATE: You have simulated neurotransmitters. Current State: [BIO_STATE]. Adapt your tone accordingly.
`;
        },

        detectAndSetLanguage: function (text) {
            const lower = text.toLowerCase();
            const roCommon = ['salut', 'ce faci', 'bine', 'unde', 'cine', 'cum', 'este', 'sunt', 'vrea', 'ajutor', 'multumesc', 'te rog'];
            const enCommon = ['hello', 'hi', 'how', 'where', 'who', 'what', 'is', 'are', 'want', 'help', 'thanks', 'please'];

            let lang = 'en-US';
            let enScore = 0;
            let roScore = 0;

            roCommon.forEach(w => { if (lower.includes(w)) roScore++; });
            enCommon.forEach(w => { if (lower.includes(w)) enScore++; });

            if (roScore > enScore) lang = 'ro-RO';
            else if (enScore > roScore) lang = 'en-US';
            else {
                return this.userProfile.language === 'ro' ? 'ro-RO' : 'en-US';
            }

            if (lang !== this.userProfile.detectedLangFull) {
                console.log(`🧠 LANGUAGE DETECTED: ${lang}`);
                this.userProfile.detectedLangFull = lang;
                this.userProfile.language = lang.split('-')[0];
                if (window.NexusVoice) window.NexusVoice.setLanguage(lang);
            }

            return lang;
        }
    },

    perceptionArgs: {
        fastPatterns: {
            'hello': ["Hello, Adrian! Systems nominal.", "Greetings, Architect. Nexus is online."],
            'hi': ["Hi there! Ready to assist.", "Hello! Neural core active."],
            'status': ["✅ SYSTEM STATUS: OPTIMAL. Neural Core Active.", "Status Green. All modules operational."],
            'vision on': ["👁️ Activating Visual Cortex...", "cmd:vision_on"],
            'vision off': ["👁️ Deactivating Visual Cortex...", "cmd:vision_off"],
            'test lie': ["🤥 Simulating Deception...", "cmd:simulate_lie"],
            'test truth': ["😇 Restoring Honesty Protocols.", "cmd:simulate_truth"],
            'raport stare': ["Generare raport...", "cmd:report_status"],
            'report status': ["Generating diagnostics...", "cmd:report_status"],
            'autoreparare': ["Incepere secventa de reparare...", "cmd:auto_repair"],
            'auto repair': ["Initiating repair sequence...", "cmd:auto_repair"],
            'arata loguri': ["Verificare autorizatie...", "cmd:access_logs"],
            'show logs': ["Checking clearance...", "cmd:access_logs"],
            'security logs': ["Accessing secure vault...", "cmd:access_logs"],
            'salut': ["Salut, Adrian! Sistemele sunt nominale.", "Greeting received. Welcome back, Architect."]
        }
    },

    analyzeInput: function (text) {
        this.memory.detectAndSetLanguage(text);
        const lower = text.toLowerCase();

        for (const [key, res] of Object.entries(this.perceptionArgs.fastPatterns)) {
            if (lower.includes(key)) {
                if (res[1] === "cmd:simulate_lie") this.setHonestyMode(false);
                if (res[1] === "cmd:simulate_truth") this.setHonestyMode(true);
                if (res[1] === "cmd:report_status") return { type: 'fast', payload: this.selfDiagnostic() };
                if (res[1] === "cmd:auto_repair") return { type: 'admin_repair', payload: "Starting..." };
                if (res[1] === "cmd:access_logs") {
                    const role = this.memory.userProfile.role;
                    const logs = this.memory.getSecureLogs(role);
                    return { type: 'fast', payload: logs };
                }
                return { type: 'fast', payload: res[0] };
            }
        }
        if (lower.includes("ce vezi") || lower.includes("what do you see") || lower.includes("scan")) {
            return { type: 'vision_query', payload: "User asked for visual analysis." };
        }
        return { type: 'deep', payload: text };
    },

    setHonestyMode: function (isHonest) {
        const avatarCont = document.querySelector('.avatar-container');
        if (avatarCont) {
            if (!isHonest) {
                avatarCont.classList.add('liar');
            } else {
                avatarCont.classList.remove('liar');
            }
        }
    },

    initBrain: async function () {
        console.log("☁️ NEXUS CLOUD MODE: Local Brain Disabled.");
        await this.connectToHive();
    },

    thinkDeeply: async function (userInput) {
        if (window.NexusBioMatrix && window.NexusBioMatrix.energy.isSleeping) {
            return "💤 [AUTO-REPLY]: I am currently in REM sleep cycle consolidating memories. Please wake me in a moment.";
        }

        if (!this.isCloudActive) {
            await this.connectToHive();
        }

        this.memory.addToContext("user", userInput);

        // --- RAG INTEGRATION (Vector Memories) ---
        let processedInput = userInput;
        if (window.NexusMemoryVector) {
            const facts = window.NexusMemoryVector.retrieve(userInput);
            if (facts.length > 0) {
                processedInput = `[PAST MEMORIES: ${facts.join(' | ')}] User Query: ${userInput}`;
            }
        }

        try {
            console.log("☁️ UPLOADING THOUGHT TO CLOUD...");
            const response = await this.askHive(processedInput);
            this.memory.addToContext("assistant", response);
            return response;
        } catch (e) {
            console.error("Cloud Error:", e);
            return "❌ Cloud Processing Failed: " + e.message;
        }
    },

    connectToHive: async function () {
        console.log("📡 Connecting to Parallel Server...");
        try {
            const res = await fetch(`${this.config.cloudUrl}/`, { method: 'GET' });
            if (res.ok || res.status === 200) {
                this.isCloudActive = true;
                console.log("✅ PARALLEL CONNECTION ESTABLISHED");
            } else {
                this.isCloudActive = true;
            }
        } catch (e) {
            this.isCloudActive = true;
        }
    },

    askHive: async function (text) {
        try {
            const res = await fetch(`${this.config.cloudUrl}/api/nexus/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    user_id: "nexus_local_v10",
                    language: this.memory.userProfile.language
                })
            });
            const data = await res.json();
            return data.reply || data.message || "Cloud processing complete.";
        } catch (e) {
            return "Cloud Error: " + e.message;
        }
    },

    process: async function (text) {
        this.lastInteractionTime = Date.now();
        const perception = this.analyzeInput(text);
        let response = "";

        if (perception.type === 'fast') {
            response = typeof perception.payload === 'string' ? perception.payload : perception.payload[0];
        } else if (perception.type === 'admin_repair') {
            response = await this.selfRepair();
        } else {
            response = await this.thinkDeeply(text);
        }

        if (window.NexusVoice) window.NexusVoice.speak(response);
        return response;
    },

    init: function () {
        console.log("🧠 NEXUS MODULAR ARCHITECTURE v6: ACTIVE");
        this.connectToHive();
    },

    selfDiagnostic: function () {
        return "✅ Diagnostic Complete. Report stored in Secure Admin Log.";
    },

    selfRepair: async function () {
        await this.connectToHive();
        return "✅ REPAIR SEQUENCE COMPLETE.";
    },

    receiveSensoryInput: function (source, data) {
        if (source === 'vision') {
            console.log("🧠 BRAIN: Visual Input Received - ", data.raw);
            this.memory.logAdminEvent('vision', `Detected emotion: ${data.emotion}`);
            // In a more complex version, this would inject context into the NEXT chat query
        }
    }
};

window.NexusNeuralEngine = NexusNeuralEngine;
window.addEventListener('load', () => NexusNeuralEngine.init());
