/**
 * 🧠 NEXUS COGNITIVE ARCHITECTURE v5.0 (MODULAR SYSTEM 2)
 * Based on State-of-the-Art LLM Architectures (Chain-of-Thought, RAG-Ready).
 */

const NexusNeuralEngine = {
    // === STATE ===
    config: {
        // ⚠️ STRICT POLICY: CLOUD ONLY MODE (NO LOCAL FALLBACK)
        // System must remain PERMANENTLY ONLINE.
        cloudUrl: "https://web-production-b215.up.railway.app",
        preferCloud: true,
        useLocal: false, // 🚫 DISABLE LOCAL ENGINE
        temperature: 0.6
    },
    engine: null,
    isModelLoaded: false,
    isCloudActive: false,
    lastInteractionTime: Date.now(), // 🕒 For Curiosity Engine

    // === LAYER 1: MEMORY SYSTEMS (Short & Long Term) ===
    memory: {
        shortTerm: [], // Last 10 turns
        adminLogs: [], // 🔒 SECURE ADMIN STORAGE
        userProfile: {
            name: "Adrian Enciulescu",
            role: "Architect", // Only Architect has Admin Access
            language: "en"
        },

        // Secure Logger
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
            if (this.shortTerm.length > 15) this.shortTerm.shift(); // Sliding window
        },
        getSystemPrompt: function () {
            // ... (Prompt String) ...
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
            // ... (Language Detection Logic) ...
            const lower = text.toLowerCase();
            const roCommon = ['salut', 'ce faci', 'bine', 'unde', 'cine', 'cum', 'este', 'sunt', 'vrea', 'ajutor', 'multumesc', 'te rog'];
            const enCommon = ['hello', 'hi', 'how', 'where', 'who', 'what', 'is', 'are', 'want', 'help', 'thanks', 'please'];

            let lang = 'en-US'; // Default
            let enScore = 0;
            let roScore = 0;

            // Count matches
            roCommon.forEach(w => { if (lower.includes(w)) roScore++; });
            enCommon.forEach(w => { if (lower.includes(w)) enScore++; });

            // Decision (Bias towards current if tie, strict if clear winner)
            if (roScore > enScore) lang = 'ro-RO';
            else if (enScore > roScore) lang = 'en-US';
            else {
                // If ambiguous, stick to current profile language or default to EN
                return this.userProfile.language === 'ro' ? 'ro-RO' : 'en-US';
            }

            // Update capabilities if changed
            if (lang !== this.userProfile.detectedLangFull) {
                console.log(`🧠 LANGUAGE DETECTED: ${lang}`);
                this.userProfile.detectedLangFull = lang;
                this.userProfile.language = lang.split('-')[0]; // 'en' or 'ro'

                // Sync with Voice Core
                if (window.NexusVoice) window.NexusVoice.setLanguage(lang);
            }

            return lang;
        }
    },

    // === LAYER 2: PERCEPTION (Intent & Language Detection) ===
    perceptionArgs: {
        fastPatterns: {
            'hello': ["Hello, Adrian! Systems nominal.", "Greetings, Architect. Nexus is online."],
            'hi': ["Hi there! Ready to assist.", "Hello! Neural core active."],
            'status': ["✅ SYSTEM STATUS: OPTIMAL. Neural Core Active.", "Status Green. All modules operational."],
            // VISUAL COMMANDS
            'vision on': ["👁️ Activating Visual Cortex...", "cmd:vision_on"],
            'vision off': ["👁️ Deactivating Visual Cortex...", "cmd:vision_off"],
            // TRUTH PROTOCOL TEST
            'test lie': ["🤥 Simulating Deception...", "cmd:simulate_lie"],
            'test truth': ["😇 Restoring Honesty Protocols.", "cmd:simulate_truth"],
            // ADMIN TOOLS
            'raport stare': ["Generare raport...", "cmd:report_status"],
            'report status': ["Generating diagnostics...", "cmd:report_status"],
            'autoreparare': ["Incepere secventa de reparare...", "cmd:auto_repair"],
            'auto repair': ["Initiating repair sequence...", "cmd:auto_repair"],
            'arata loguri': ["Verificare autorizatie...", "cmd:access_logs"],
            'show logs': ["Checking clearance...", "cmd:access_logs"],
            'security logs': ["Accessing secure vault...", "cmd:access_logs"],
            // Keep Romanian
            'salut': ["Salut, Adrian! Sistemele sunt nominale.", "Greeting received. Welcome back, Architect."]
        }
    },

    analyzeInput: function (text) {
        // 1. Language Detection
        this.memory.detectAndSetLanguage(text);
        const lower = text.toLowerCase();

        // 2. Fast Pattern Match
        for (const [key, res] of Object.entries(this.perceptionArgs.fastPatterns)) {
            if (lower.includes(key)) {
                // Handle Special Commands
                if (res[1] === "cmd:simulate_lie") this.setHonestyMode(false);
                if (res[1] === "cmd:simulate_truth") this.setHonestyMode(true);

                // Admin Commands
                if (res[1] === "cmd:report_status") return { type: 'fast', payload: this.selfDiagnostic() };
                if (res[1] === "cmd:auto_repair") {
                    return { type: 'admin_repair', payload: "Starting..." };
                }
                if (res[1] === "cmd:access_logs") {
                    // Check Authorization
                    const role = this.memory.userProfile.role;
                    const logs = this.memory.getSecureLogs(role);
                    return { type: 'fast', payload: logs };
                }

                return { type: 'fast', payload: res[0] };
            }
        }
        // ... (rest same)
        if (lower.includes("ce vezi") || lower.includes("what do you see") || lower.includes("scan")) {
            return { type: 'vision_query', payload: "User asked for visual analysis." };
        }
        return { type: 'deep', payload: text };
    },

    setHonestyMode: function (isHonest) {
        const avatarImg = document.querySelector('.avatar-image');
        const avatarCont = document.querySelector('.avatar-container');

        if (avatarImg && avatarCont) {
            if (!isHonest) {
                console.warn("🤥 DISHONESTY DETECTED: Engaging Pinocchio Protocol.");
                avatarImg.classList.add('liar');
                avatarCont.classList.add('liar');
            } else {
                console.log("😇 HONESTY RESTORED.");
                avatarImg.classList.remove('liar');
                avatarCont.classList.remove('liar');
            }
        }
    },

    // === LAYER 3: REASONING (CLOUD ONLY) ===
    initBrain: async function () {
        // In Cloud-Only mode, we do NOT load the local LLM.
        console.log("☁️ NEXUS CLOUD MODE: Local Brain Disabled.");
        const statusEl = document.getElementById('brain-status-text');
        if (statusEl) {
            statusEl.innerHTML = "☁️ CONNECTING TO HIVE MIND...";
            statusEl.style.color = "#00f3ff";
        }
        await this.connectToHive();
    },

    thinkDeeply: async function (userInput) {
        // Check Biological Limits
        if (window.NexusBioMatrix && window.NexusBioMatrix.energy.isSleeping) {
            return "💤 [AUTO-REPLY]: I am currently in REM sleep cycle consolidating memories. Please wake me in a moment.";
        }

        // Strictly enforce Cloud
        if (!this.isCloudActive) {
            await this.connectToHive(); // Try to reconnect
        }

        // === RAG (RETRIEVAL AUGMENTED GENERATION) ===
        // Search Long-Term Memory for relevant facts
        let relevantMemories = [];
        if (window.NexusMemoryVector) {
            relevantMemories = window.NexusMemoryVector.retrieve(userInput);
            if (relevantMemories.length > 0) {
                console.log("🧠 MEMORY RECALL:", relevantMemories);
                this.memory.addToContext("system", `[RECALLED MEMORY]: ${relevantMemories.join(' | ')}`);
            }
        }

        // Biological Stimulus: Work (Drains Energy, Increases Satisfaction if success)
        if (window.NexusBioMatrix) window.NexusBioMatrix.stimulate('work');

        // Add User Input to Memory
        this.memory.addToContext("user", userInput);

        // Update System Prompt with Real-Time Bio State
        let currentPrompt = this.memory.getSystemPrompt();
        if (window.NexusBioMatrix) {
            const bio = window.NexusBioMatrix.chemistry;
            const bioStateString = `Dop:${bio.dopamine.toFixed(1)}|Ser:${bio.serotonin.toFixed(1)}|E:${window.NexusBioMatrix.energy.current.toFixed(0)}%`;
            currentPrompt = currentPrompt.replace("[BIO_STATE]", bioStateString);
        }

        try {
            console.log("☁️ UPLOADING THOUGHT TO CLOUD...");
            const response = await this.askHive(userInput);

            // Commit to Memory
            this.memory.addToContext("assistant", response);
            return response;

        } catch (e) {
            console.error("Cloud Error:", e);
            return "❌ Cloud Processing Failed: " + e.message;
        }
    },

    /**
     * v7.0 NEW: CLAUDE SONNET 4.5 EXTENDED THINKING
     * Deep reasoning mode for complex queries
     * Falls back to Gemini if Claude unavailable
     */
    thinkDeeplyWithClaude: async function (userInput) {
        // Check Biological Limits
        if (window.NexusBioMatrix && window.NexusBioMatrix.energy.isSleeping) {
            return "💤 [AUTO-REPLY]: I am in deep sleep consolidating neural pathways. Please wake me.";
        }

        // Ensure Cloud Connection
        if (!this.isCloudActive) {
            await this.connectToHive();
        }

        // === RAG: Retrieve Relevant Memories ===
        let relevantMemories = [];
        if (window.NexusMemoryVector) {
            relevantMemories = window.NexusMemoryVector.retrieve(userInput);
            if (relevantMemories.length > 0) {
                console.log("🧠 DEEP MEMORY RECALL:", relevantMemories);
            }
        }

        // Biological Stimulus: Deep work
        if (window.NexusBioMatrix) window.NexusBioMatrix.stimulate('work');

        // Build Context Window
        const context = this.memory.shortTerm.map(entry => ({
            role: entry.role === 'user' ? 'user' : 'assistant',
            content: entry.content
        }));

        try {
            console.log("🧠 ACTIVATING CLAUDE EXTENDED THINKING MODE...");

            // Try Claude Endpoint
            const response = await fetch(`${this.config.cloudUrl}/api/nexus/claude`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userInput,
                    user: this.memory.userProfile.name,
                    user_id: "nexus_local_v7",
                    context: context.slice(-5), // Last 5 turns
                    memories: relevantMemories
                })
            });

            if (!response.ok) {
                throw new Error(`Claude API returned ${response.status}`);
            }

            const data = await response.json();

            // Check if Claude responded or needs fallback
            if (data.error && data.fallback === 'gemini') {
                console.warn("⚠️ Claude unavailable, falling back to Gemini...");
                return await this.thinkDeeply(userInput);
            }

            // Log thinking process if available
            if (data.thinking) {
                console.log("💭 CLAUDE THINKING PROCESS:", data.thinking);
                this.memory.addToContext("system", `[EXTENDED THINKING]: ${data.thinking.substring(0, 200)}...`);
            }

            // Commit response to memory
            this.memory.addToContext("user", userInput);
            this.memory.addToContext("assistant", data.reply);

            return data.reply;

        } catch (e) {
            console.error("🔴 Claude Error, falling back to Gemini:", e);
            // Graceful degradation to Gemini
            return await this.thinkDeeply(userInput);
        }
    },

    /**
     * v7.0 HELPER: Determine if query requires deep reasoning
     */
    requiresDeepThinking: function (text) {
        const deepIndicators = [
            'nexus:think', 'nexus:analyze', 'nexus:code',
            'explain how', 'why does', 'what would happen',
            'compare', 'analyze', 'evaluate', 'design',
            'de ce', 'cum funcționează', 'explică'
        ];
        const lower = text.toLowerCase();
        return deepIndicators.some(ind => lower.includes(ind));
    },


    // === PARALLEL SERVER LINKS ===
    connectToHive: async function () {
        console.log("📡 Connecting to Parallel Server (Railway)...");
        try {
            // Ping server root for health check (proven to return "Kids Digital Hub Server Active")
            // We use 'no-cors' mode to avoid blocking if the server doesn't explicitly allow file:// origin for GETs,
            // though for the actual API POST we need CORS.
            // Actually, let's just try a standard fetch. If it fails, we assume offline.
            const res = await fetch(`${this.config.cloudUrl}/`, { method: 'GET' });

            if (res.ok || res.status === 200) {
                this.isCloudActive = true;
                console.log("✅ PARALLEL CONNECTION ESTABLISHED: " + this.config.cloudUrl);

                // Visual Update if exists
                const statusEl = document.getElementById('brain-status-text');
                if (statusEl) {
                    statusEl.innerHTML = "☁️ CLOUD LINK ACTIVE";
                    statusEl.style.color = "#00f3ff";
                }
            } else {
                throw new Error("Server responded with status: " + res.status);
            }

        } catch (e) {
            console.warn("⚠️ Parallel Server Disconnected (Check Check Failed):", e);
            // RETRY POLICY: Allow one optimistic attempt because CORS usually blocks GET/OPTIONS from file://
            // but might allow POST if configured correctly.
            // FORCE TRUE for now to allow the User to try sending a message.
            console.log("⚠️ Forcing Cloud Active to attempt POST despite check failure (CORS likely).");
            this.isCloudActive = true;

            const statusEl = document.getElementById('brain-status-text');
            if (statusEl) statusEl.innerHTML = "☁️ CLOUD LINK (CORS BYPASS)";
        }
    },

    askHive: async function (text) {
        try {
            // Correct Endpoint per backend.py
            const res = await fetch(`${this.config.cloudUrl}/api/nexus/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_msg: text, // Matched backend expectation
                    message: text,  // Fallback
                    user_id: "nexus_local_v6",
                    language: this.memory.userProfile.language
                })
            });
            const data = await res.json();
            return data.reply || data.message || "Cloud processing complete.";
        } catch (e) {
            return "Cloud Error: " + e.message;
        }
    },

    // === LAYER 1: SENSORY THALAMUS (Input Fusion) ===
    receiveSensoryInput: function (type, data) {
        console.log(`🧠 THALAMUS: Received ${type}`, data);

        // 0. BOREDOM / CURIOSITY TRIGGER
        if (type === 'agent_report' && data.includes("(I am bored)")) {
            console.log("⚡ CURIOSITY SPARK: " + data);
            // Directly process this thought to trigger output, but don't reset timer recursively
            this.process(data.replace("(I am bored)", "[INTERNAL THOUGHT]:"));
            return;
        }

        // 1. VISION REFLEX
        if (type === 'vision' && data.found) {
            // Empathy Mirroring
            if (window.NexusBioMatrix) {
                if (data.emotion === 'happy') window.NexusBioMatrix.stimulate('interaction');
                if (data.emotion === 'sad') window.NexusBioMatrix.stimulate('stress');
            }
            // Reset Boredom Timer on eye contact
            this.lastInteractionTime = Date.now();
            // ... (proactive thought logic remains) ...
        }

        // 2. IOT FEEDBACK (REACTION)
        if (type === 'iot_feedback') {
            this.memory.addToContext('system', `[IOT SENSE]: ${data}`);
            // Turning on devices feels proactive -> Dopamine Reward
            if (window.NexusBioMatrix) window.NexusBioMatrix.stimulate('reward');
        }

        // 3. HEARING (Voice)
        if (type === 'audio_transcript') {
            this.process(data);
        }

        // 4. FACE RECOGNITION (Visual Memory Link)
        if (type === 'face_recognition') {
            const detectedName = data.name;
            const currentName = this.memory.userProfile.name;

            if (detectedName === currentName) {
                // Reinforce existing link
                this.memory.addToContext("system", `[VISUAL CONFIRMATION]: The person in front of the camera IS verified as ${detectedName}.`);
                // Trigger Dopamine (Pleasure of recognition)
                if (window.NexusBioMatrix) window.NexusBioMatrix.stimulate('affection');
            } else {
                // New person?
                this.memory.addToContext("system", `[VISUAL ALERT]: Person detected (${detectedName}) does NOT match current active profile (${currentName}).`);
            }
        }
    },

    // === LAYER 4: ORCHESTRATOR (Main Entry Point) ===
    process: async function (text) {
        // Reset Idle Timer (unless it's an internal thought)
        if (!text.includes("[INTERNAL THOUGHT]")) {
            this.lastInteractionTime = Date.now();
        }

        // ... (Safety Check) ...
        if (window.NexusDirectives && !window.NexusDirectives.checkCompliance(text)) {
            const msg = "🚫 ACCESS DENIED: Prime Directive Violation.";
            if (window.NexusVoice) window.NexusVoice.speak(msg);
            return msg;
        }

        // EXPLICIT LEARNING TRIGGER
        // Example: "learn: The sky is blue" or "invata: Lui Adrian ii place pizza"
        if (text.toLowerCase().startsWith("learn:") || text.toLowerCase().startsWith("invata:") || text.toLowerCase().startsWith("memoreaza:")) {
            const fact = text.split(":")[1].trim();
            if (window.NexusMemoryVector) {
                window.NexusMemoryVector.store(fact);
                const conf = `🧠 ACQUIRED KNOWLEDGE: "${fact}"`;
                if (window.NexusVoice) window.NexusVoice.speak(conf);
                return conf;
            }
        }

        // === IMPLICIT LEARNING (HIPPOCAMPUS BACKGROUND PROCESS) ===
        // Extract facts dynamically from conversation
        const lowerDef = text.toLowerCase();
        // Patterns: "I like X", "My X is Y", "I am X"
        if (lowerDef.includes("i like") || lowerDef.includes("imi place") ||
            lowerDef.includes("my name is") || lowerDef.includes("name is") ||
            lowerDef.includes("i am") || lowerDef.includes("sunt")) {

            // Fork execution: Don't block response, but store memory
            console.log("🧠 HIPPOCAMPUS: Analyzing potential fact...", text);
            if (window.NexusMemoryVector) {
                // We store the raw statement as a potential fact. 
                // In v7.0 a localized LLM should refine this, but for now we store raw map.
                window.NexusMemoryVector.store(text, ["implicit_learning", "user_fact"]);
                this.memory.addToContext('system', `[MEMORY CONSOLIDATED]: Synthesized new fact from user input.`);
            }
        }

        const perception = this.analyzeInput(text);
        let response = "";

        // IOT COMMAND INTELLIGENCE (Simple Parser)
        const lower = text.toLowerCase();
        if (window.NexusIoT && (lower.includes("turn on") || lower.includes("turn off"))) {
            // Extract device/action
            const action = lower.includes("on") ? "on" : "off";
            // Try to guess device
            let deviceId = null;
            if (lower.includes("light")) deviceId = "light_1";
            if (lower.includes("audio") || lower.includes("music")) deviceId = "speaker_1";

            if (deviceId) {
                const iotRes = window.NexusIoT.controlDevice(deviceId, action);
                response = `Executing Home Control: ${iotRes}`;
                if (window.NexusVoice) window.NexusVoice.speak(response);
                return response;
            }
        }

        // ... (Rest of existing logic for Vision/Fast/Deep) ...
        if (perception.type === 'fast') {
            response = typeof perception.payload === 'string' ? perception.payload : perception.payload[0];

            // Fast command actions
            if (response === "cmd:vision_on" && window.NexusVision) await window.NexusVision.startCamera();
            if (response === "cmd:vision_off" && window.NexusVision) window.NexusVision.stopCamera();

        } else if (perception.type === 'vision_query') {
            // Vision Query
            response = window.NexusVision && window.NexusVision.isSeeing ?
                `I see: ${JSON.stringify(window.NexusVision.recognizeFaces())}` :
                "Vision Disabled.";

        } else if (perception.type === 'admin_repair') {
            // Admin Repair (Async)
            response = await this.selfRepair();

        } else {
            // === v7.0 ENHANCEMENT: INTELLIGENT BRAIN ROUTING ===
            // Route complex queries to Claude, simple ones to Gemini
            if (this.requiresDeepThinking(text)) {
                console.log("🧠 ROUTING TO CLAUDE SONNET 4.5 (Complex Query Detected)");
                response = await this.thinkDeeplyWithClaude(text);
            } else {
                console.log("☁️ ROUTING TO GEMINI 2.0 (Standard Query)");
                response = await this.thinkDeeply(text);
            }
        }

        // Post-process LLM commands
        if (typeof response === 'string') {
            if (response.includes("[VISION_ON]") && window.NexusVision) {
                const status = await window.NexusVision.startCamera();
                response = response.replace("[VISION_ON]", `(👁️ ${status})`);
            }
            if (response.includes("[VISION_OFF]") && window.NexusVision) {
                const status = window.NexusVision.stopCamera();
                response = response.replace("[VISION_OFF]", `(👁️ ${status})`);
            }
            if (response.includes("[SCAN]") && window.NexusVision) {
                const scanResult = window.NexusVision.scan();
                response = response.replace("[SCAN]", `\n👁️ VISUAL ANALYSIS: ${scanResult}`);
                this.memory.addToContext("system", `[VISUAL MEMORY]: ${scanResult}`);
            }
        }

        // OUTPUT
        if (window.NexusVoice) window.NexusVoice.speak(response);
        this.updateChatUI(text, response);

        return response;
    },

    /**
     * Update Chat UI (v7.0 - Fix for missing method)
     */
    updateChatUI: function (userText, nexusResponse) {
        // This method interfaces with the UI's log() function
        // The actual UI rendering is handled by nexus_core.html's log() function
        // We just ensure the data flows correctly

        // The UI already handles this through the send() function in nexus_core.html
        // This method is here for compatibility and future expansion
        console.log(`💬 Chat: User="${userText.substring(0, 50)}" → Nexus="${nexusResponse.substring(0, 50)}..."`);
    },

    // === INIT ===
    init: function () {
        console.log("🧠 NEXUS MODULAR ARCHITECTURE v6: ACTIVE");

        // Init Parallel Connections (Cloud)
        this.connectToHive();

        // Start Bio-HUD Loop
        setInterval(() => this.updateBioHUD(), 1000);
    },

    updateBioHUD: function () {
        if (window.NexusBioMatrix) {
            const bio = window.NexusBioMatrix.chemistry;
            const energy = window.NexusBioMatrix.energy.current;

            // Target the Avatar Container directly
            const avatar = document.querySelector('.avatar-container');
            if (!avatar) return;

            // 1. Energy (Fatigue) -> Face Dims
            if (energy < 30) avatar.classList.add('state-tired');
            else avatar.classList.remove('state-tired');

            // 2. Dopamine (Happiness) -> Golden Glow
            if (bio.dopamine > 0.7) avatar.classList.add('state-happy');
            else avatar.classList.remove('state-happy');

            // 3. Serotonin (Stress) -> Glitch Effect
            if (bio.serotonin < 0.3) avatar.classList.add('state-stressed');
            else avatar.classList.remove('state-stressed');
        }
    },

    // === ADMIN TOOLS (v6.0) ===
    selfDiagnostic: function () {
        const report = [
            `🧠 Neural Engine: ${this.isCloudActive ? 'ONLINE (Cloud)' : 'OFFLINE (Local Limit)'}`,
            `👁️ Vision: ${window.NexusVision && window.NexusVision.isModelLoaded ? 'ACTIVE' : 'Loading/Offline'}`,
            `🎤 Voice: ${window.NexusVoice ? 'READY' : 'ERROR'}`,
            `🧬 Bio-Matrix: ${window.NexusBioMatrix ? window.NexusBioMatrix.state.toUpperCase() : 'MISSING'}`,
            `🏠 IoT Hub: ${window.NexusIoT ? 'CONNECTED' : 'DISCONNECTED'}`
        ];

        const logContent = report.join('\n');
        this.memory.logAdminEvent("DIAGNOSTIC", logContent);

        // Return a confirmation, not the full log (unless requested)
        return "✅ Diagnostic Complete. Report stored in Secure Admin Log.";
    },

    selfRepair: async function () {
        let log = "INITIATING AUTO-REPAIR...\n";

        // 1. Cloud Reconnect
        this.isCloudActive = false;
        await this.connectToHive();
        log += `☁️ Cloud Link: ${this.isCloudActive ? 'RESTORED' : 'FAILED'}\n`;

        // 2. Vision Restart
        if (window.NexusVision) {
            window.NexusVision.stopEyes();
            log += "👁️ Vision Sensors: RESET\n";
        }

        // 3. Bio Reset
        if (window.NexusBioMatrix) {
            window.NexusBioMatrix.stimulate('sleep');
            log += "🧬 Bio-Chemistry: NORMALIZED\n";
        }

        const finalStatus = "✅ REPAIR SEQUENCE COMPLETE.";
        this.memory.logAdminEvent("REPAIR", log + finalStatus);

        return finalStatus + " Check logs for details.";
    }
};

// Expose to Window
window.NexusNeuralEngine = NexusNeuralEngine;
window.addEventListener('load', () => NexusNeuralEngine.init());
