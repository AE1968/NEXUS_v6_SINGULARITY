/**
 * 🔊 NEXUS BIO-AUDIO v10.0
 * Procedural ambient sound and UI feedback system.
 * Reacts to neurochemical states and cognitive triggers.
 */

const NexusAudio = {
    ctx: null,
    ambientGain: null,
    isMuted: false,

    init: function () {
        // AudioContext is initialized on first user interaction to comply with browser policies
        document.addEventListener('click', () => this.start(), { once: true });
        console.log("🔊 AUDIO: Bio-Acoustics System READY (Waiting for interaction).");
    },

    start: function () {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Setup Ambient Hum
        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.value = 0.05; // Very subtle
        this.ambientGain.connect(this.ctx.destination);

        this.startHum();
        this.playStartup();
    },

    startHum: function () {
        // Create a living ambient hum that varies with energy
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = 55; // Low frequency baseline

        filter.type = 'lowpass';
        filter.frequency.value = 400;

        osc.connect(filter);
        filter.connect(this.ambientGain);
        osc.start();

        // Modulation loop
        setInterval(() => {
            if (this.isMuted) return;
            const dopamine = window.NexusBioMatrix ? window.NexusBioMatrix.chemistry.dopamine : 0.5;
            const nrg = window.NexusBioMatrix ? window.NexusBioMatrix.energy.current / 100 : 1;

            // Energy affects volume, Dopamine affects resonance
            this.ambientGain.gain.setTargetAtTime(0.02 + (nrg * 0.05), this.ctx.currentTime, 0.5);
            filter.frequency.setTargetAtTime(200 + (dopamine * 600), this.ctx.currentTime, 1);
        }, 2000);
    },

    playStartup: function () {
        this.synthPulse(220, 0.5, 'triangle');
        setTimeout(() => this.synthPulse(440, 0.5, 'sine'), 200);
    },

    synthPulse: function (freq, duration, type = 'sine') {
        if (!this.ctx || this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + duration);

        g.gain.setValueAtTime(0.1, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(g);
        g.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    beep: function (type = 'info') {
        if (type === 'info') this.synthPulse(880, 0.1);
        if (type === 'error') this.synthPulse(110, 0.4, 'sawtooth');
        if (type === 'success') {
            this.synthPulse(523, 0.1);
            setTimeout(() => this.synthPulse(659, 0.1), 100);
        }
    },

    // Specific triggers
    beaming: function () {
        // Data processing sound
        if (!this.ctx) return;
        this.synthPulse(1760, 0.05, 'sine');
    }
};

window.NexusAudio = NexusAudio;
window.addEventListener('load', () => NexusAudio.init());
