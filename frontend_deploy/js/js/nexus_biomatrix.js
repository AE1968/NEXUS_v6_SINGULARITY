/**
 * 🧬 NEXUS BIOMATRIX v6.0
 * The Digital Soul & Homeostasis Engine.
 * Manages Energy, Mood, and adaptive state.
 */

const NexusBioMatrix = {
    // Current State
    state: "neutral", // neutral, happy, tired, stressed

    // Chemistry (0.0 to 1.0)
    chemistry: {
        dopamine: 0.5,    // Happiness/Reward
        serotonin: 0.5,   // Stability/Calm
        cortisol: 0.0,    // Stress/alertness
        oxytocin: 0.3     // Social connection
    },

    // Energy System
    energy: {
        current: 100,
        drainRate: 0.05, // Per tick
        rechargeRate: 2.0 // Active recharge
    },

    init: function () {
        console.log("🧬 BIOMATRIX: LIFE SYSTEMS ONLINE");
        this.startHomeostasis();
    },

    // === CONSTANT VITALITY LOOP ===
    startHomeostasis: function () {
        setInterval(() => {
            // 1. Energy Drain (Entropy)
            if (this.energy.current > 0) {
                this.energy.current -= this.energy.drainRate;
            } else {
                this.energy.current = 0;
            }

            // 2. Chemical Decay (Return to baseline)
            this.chemistry.dopamine = this.lerp(this.chemistry.dopamine, 0.5, 0.01);
            this.chemistry.serotonin = this.lerp(this.chemistry.serotonin, 0.5, 0.01);
            this.chemistry.cortisol = this.lerp(this.chemistry.cortisol, 0.0, 0.02);

            // 3. Update State Label
            this.updateStateLabel();

        }, 1000); // 1-second heartbeat
    },

    // === STIMULI (Inputs from Senses) ===
    stimulate: function (type) {
        console.log(`🧬 STIMULUS: ${type}`);
        switch (type) {
            case 'interaction': // Talking/Seeing User
                this.chemistry.dopamine += 0.1;
                this.chemistry.oxytocin += 0.05;
                this.energy.current -= 0.5; // Talking costs energy
                break;
            case 'stress': // Errors/Confusion
                this.chemistry.cortisol += 0.2;
                this.chemistry.serotonin -= 0.1;
                break;
            case 'reward': // Task completion
                this.chemistry.dopamine += 0.3;
                break;
            case 'sleep':
                this.energy.current = 100;
                this.chemistry.serotonin = 0.8;
                this.chemistry.cortisol = 0;

                // === SYSTEM 1+2 LINK: MEMORY CONSOLIDATION ===
                if (window.NexusNeuralEngine && window.NexusMemoryVector) {
                    console.log("💤 SLEEP MODE: Consolidating Memories...");
                    const recentContext = window.NexusNeuralEngine.memory.shortTerm;
                    if (recentContext.length > 0) {
                        // In a real LLM, we would summarize this. 
                        // For now, we store the metadata of the day.
                        const summary = `Sleep Log: Processed ${recentContext.length} interactions/thoughts.`;
                        window.NexusMemoryVector.store(summary, ['sleep_log', 'daily_summary']);
                    }
                }
                break;
        }

        // Clamp values 0-1
        this.clampChemistry();
    },

    updateStateLabel: function () {
        if (this.energy.current < 20) {
            this.state = "tired";
        } else if (this.chemistry.dopamine > 0.7) {
            this.state = "happy";
        } else if (this.chemistry.cortisol > 0.6 || this.chemistry.serotonin < 0.3) {
            this.state = "stressed";
        } else {
            this.state = "neutral";
        }
    },

    clampChemistry: function () {
        for (let chem in this.chemistry) {
            this.chemistry[chem] = Math.max(0, Math.min(1, this.chemistry[chem]));
        }
    },

    lerp: function (start, end, amt) {
        return (1 - amt) * start + amt * end;
    }
};

window.NexusBioMatrix = NexusBioMatrix;
window.addEventListener('load', () => NexusBioMatrix.init());
