/**
 * 🤖 NEXUS AUTONOMOUS AGENTS v6.0
 * Background Workers for Self-Directed Tasks.
 */

const NexusAgents = {
    agents: [],
    scheduler: null,

    // === REGISTRY ===
    registerAgent: function (name, task, intervalSeconds) {
        this.agents.push({
            name: name,
            task: task, // Function
            interval: intervalSeconds * 1000,
            lastRun: 0
        });
        console.log(`🤖 AGENT REGISTERED: ${name}`);
    },

    // === SCHEDULER ===
    startScheduler: function () {
        if (this.scheduler) return;
        this.scheduler = setInterval(() => this.tick(), 1000); // Check every second
        console.log("🤖 AGENT SCHEDULER: STARTED");
    },

    tick: function () {
        const now = Date.now();
        this.agents.forEach(agent => {
            if (now - agent.lastRun >= agent.interval) {
                console.log(`🤖 AGENT RUNNING: ${agent.name}...`);
                try {
                    const result = agent.task();
                    agent.lastRun = now;

                    // Report to Brain if significant
                    if (result && window.NexusNeuralEngine) {
                        window.NexusNeuralEngine.receiveSensoryInput('agent_report', `[${agent.name}]: ${result}`);
                    }
                } catch (e) {
                    console.error(`🤖 AGENT FAILED: ${agent.name}`, e);
                }
            }
        });
    },

    // === DEFAULT AGENTS ===
    initAgents: function () {
        // 1. Health Monitor Agent (Runs every 60s)
        this.registerAgent("SystemHealth", () => {
            if (window.NexusBioMatrix) {
                const energy = window.NexusBioMatrix.energy.current;
                if (energy < 20) return "WARNING: System Energy Low (Battery/Fatigue). Suggest Sleep Mode.";
            }
            return null; // No report if all good
        }, 60);

        // 2. Curiosity Engine (Entropy & Boredom)
        // Runs every 30 seconds to check activity levels
        this.registerAgent("CuriosityCore", () => {
            if (!window.NexusNeuralEngine) return null;

            // Check last interaction time
            const lastAct = window.NexusNeuralEngine.lastInteractionTime || 0;
            const idleTime = Date.now() - lastAct;
            const isBored = idleTime > 45000; // 45 seconds idle for demo (usually 5 mins)

            // Check Energy High enough for curiosity
            let hasEnergy = true;
            if (window.NexusBioMatrix && window.NexusBioMatrix.energy.current < 40) hasEnergy = false;

            if (isBored && hasEnergy) {
                // Random Initiative Trigger
                const ideas = [
                    "Checking global news feed...",
                    "Reviewing past conversation logs for patterns...",
                    "Scanning environment for changes..."
                ];
                const pick = ideas[Math.floor(Math.random() * ideas.length)];
                return `(I am bored) ${pick}`;
            }
            return null;
        }, 30);
    },

    init: function () {
        console.log("🤖 NEXUS AGENTS v6.0: ONLINE");
        this.initAgents();
        this.startScheduler();
    }
};

window.NexusAgents = NexusAgents;
window.addEventListener('load', () => NexusAgents.init());
