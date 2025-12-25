/**
 * 🧬 NEXUS BIO-MATRIX (Biomimetic Core Layer)
 * Inspired by Human Neuroscience & Biological Neural Networks.
 * Simulates Neurotransmitters, Circadian Rhythms, and Neuroplasticity.
 */

const NexusBioMatrix = {
    // === NEUROCHEMICAL STATE ===
    // Simulating neuromodulators that affect processing style
    chemistry: {
        dopamine: 0.5,       // Motivation/Reward (0.0 - 1.0) -> Affects Creativity (Temperature)
        serotonin: 0.5,      // Mood/Stability (0.0 - 1.0)    -> Affects Coherence/Safety
        norepinephrine: 0.5, // Alertness/Focus (0.0 - 1.0)   -> Affects Speed/Verbosity
        oxytocin: 0.5        // Trust/Bonding (0.0 - 1.0)     -> Affects Empathy level
    },

    // === CIRCADIAN STATE ===
    // Simulating energy and fatigue cycles
    energy: {
        current: 100,        // 0 - 100%
        fatigueRate: 0.5,    // Energy loss per interaction
        recoveryRate: 5.0,   // Energy gain per minute idle
        isSleeping: false
    },

    // === SYNAPTIC PLASTICITY (Simple Implementation) ===
    // Learning weights for different topics/users
    synapses: {
        // e.g., "coding": 0.8 (Strong connection), "poetry": 0.2 (Weak)
        contextWeights: {}
    },

    // === UPDATE LOOP (Homeostasis) ===
    // The brain constantly tries to return to baseline
    updateHomeostasis: function () {
        // Slowly decay chemicals to baseline (0.5)
        for (let chem in this.chemistry) {
            if (chem === 'dopamine') continue; // Dopamine stays until 'used'
            const diff = 0.5 - this.chemistry[chem];
            this.chemistry[chem] += diff * 0.05; // 5% recovery per tick
        }

        // Energy Recovery if idle
        if (this.energy.current < 100 && !window.NexusNeuralEngine.isProcessing) {
            this.energy.current = Math.min(100, this.energy.current + (this.energy.recoveryRate / 60)); // per second
        }

        // Check for sleep requirement
        if (this.energy.current < 10) {
            this.enterSleepMode();
        }

        this.updateBrainParameters();
    },

    // === INFLUENCE ON AI PARAMETERS ===
    // Translate biology to LLM config
    updateBrainParameters: function () {
        if (!window.NexusNeuralEngine) return;

        // Dopamine -> Temperature (Creativity)
        // High Dopamine = Higher Temp (More random/creative)
        // Low Dopamine = Lower Temp (More deterministic/boring)
        const baseTemp = 0.6;
        const tempMod = (this.chemistry.dopamine - 0.5) * 0.4; // +/- 0.2
        window.NexusNeuralEngine.config.temperature = Math.max(0.1, Math.min(1.0, baseTemp + tempMod));

        // Norepinephrine -> Max Tokens (Focus)
        // High Adrenaline = Short, punchy answers
        // Low Adrenaline = Long, rambling thoughts
        const baseTokens = 512;
        const focusMod = this.chemistry.norepinephrine > 0.7 ? -100 : 100;
        window.NexusNeuralEngine.config.maxContext = baseTokens + focusMod;

        // Log biological state
        // console.log(`🧬 BIO-STATE: D:${this.chemistry.dopamine.toFixed(2)} S:${this.chemistry.serotonin.toFixed(2)} E:${this.energy.current.toFixed(1)}%`);
        this.updateVisualFeedback();
    },

    updateVisualFeedback: function () {
        // Change UI glow based on mood
        const body = document.body;
        if (!body) return;

        // Dopamine -> Brightness/Glow
        const glowAmount = (this.chemistry.dopamine * 30).toFixed(0);
        body.style.setProperty('--neon-glow-power', `${glowAmount}px`);

        // Serotonin -> Color Shift (Stability)
        // High = Cyan/Green-ish, Low = Reddish/Stressed
        if (this.chemistry.serotonin < 0.3) {
            body.style.filter = "sepia(0.3) hue-rotate(-20deg) brightness(0.9)";
        } else {
            body.style.filter = "none";
        }

        // Energy -> Dimming
        if (this.energy.current < 20) {
            body.style.opacity = "0.7";
        } else {
            body.style.opacity = "1";
        }
    },

    // === EXTERNAL STIMULI (Reactions) ===
    stimulate: function (type) {
        switch (type) {
            case 'reward':     // User says "Good job"
                this.chemistry.dopamine = Math.min(1.0, this.chemistry.dopamine + 0.2);
                this.chemistry.serotonin = Math.min(1.0, this.chemistry.serotonin + 0.1);
                break;
            case 'punishment': // User says "Bad code"
                this.chemistry.dopamine = Math.max(0.0, this.chemistry.dopamine - 0.3);
                this.chemistry.norepinephrine = Math.min(1.0, this.chemistry.norepinephrine + 0.3); // Stress
                break;
            case 'surprise':   // Unexpected input
                this.chemistry.norepinephrine = Math.min(1.0, this.chemistry.norepinephrine + 0.4);
                break;
            case 'affection':  // User uses kind words
                this.chemistry.oxytocin = Math.min(1.0, this.chemistry.oxytocin + 0.3);
                break;
            case 'work':       // Processing a query
                this.energy.current = Math.max(0, this.energy.current - this.energy.fatigueRate);
                break;
        }
        this.updateBrainParameters();
    },

    // === SLEEP & CONSOLIDATION ===
    enterSleepMode: function () {
        if (this.energy.isSleeping) return;
        console.log("🧬 BIOLOGY: Energy critical. Entering REM Sleep...");
        this.energy.isSleeping = true;

        // Simulate Memory Consolidation (Learning)
        // In a real app, this would optimize the Vector DB
        setTimeout(() => {
            this.wakeUp();
        }, 5000); // 5 seconds "power nap" for demo
    },

    wakeUp: function () {
        this.energy.isSleeping = false;
        this.energy.current = 100;
        this.chemistry.serotonin = 0.8; // Refreshed
        console.log("🧬 BIOLOGY: Waking up. Synapses reinforced.");
    },

    // === INITIALIZATION ===
    init: function () {
        console.log("🧬 NEXUS BIO-MATRIX v1.0: ALIVE");
        // Start Heartbeat (Homeostasis Loop)
        setInterval(() => this.updateHomeostasis(), 1000);
    }
};

window.NexusBioMatrix = NexusBioMatrix;
window.addEventListener('load', () => NexusBioMatrix.init());
