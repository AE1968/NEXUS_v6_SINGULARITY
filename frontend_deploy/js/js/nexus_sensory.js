/**
 * 📡 NEXUS SENSORY AWARENESS v10.0
 * Simulates environmental perception (Light, Sound, Temperature).
 */

const NexusSensory = {
    sensors: {
        light: 0.8,
        ambient_noise: 0.2,
        temperature: 22
    },

    init: function () {
        console.log("📡 SENSORS: Calibrating Physical Layers...");
        this.startProbing();
    },

    startProbing: function () {
        setInterval(() => {
            // Simulate changing environment
            this.sensors.light = 0.5 + Math.random() * 0.5;
            this.sensors.ambient_noise = Math.random() * 0.4;

            // Effect on BioMatrix
            if (window.NexusBioMatrix) {
                // Bright light increases norepinephrine (Focus)
                if (this.sensors.light > 0.9) window.NexusBioMatrix.stimulate('surprise');
                // High noise reduces serotonin (Mood)
                if (this.sensors.ambient_noise > 0.3) {
                    window.NexusBioMatrix.chemistry.serotonin = Math.max(0.1, window.NexusBioMatrix.chemistry.serotonin - 0.01);
                }
            }

            this.logSensoryEvent();
        }, 10000); // Probe every 10s
    },

    logSensoryEvent: function () {
        const events = [
            "Ambient light levels optimal.",
            "Background noise detected. Filtering active.",
            "Thermal equilibrium maintained.",
            "Sensory data within humanoid tolerance."
        ];
        const randomEvent = events[Math.floor(Math.random() * events.length)];

        if (window.NexusNeuralEngine && Math.random() > 0.8) {
            window.NexusNeuralEngine.receiveSensoryInput('environment', { raw: randomEvent });
        }
    }
};

window.NexusSensory = NexusSensory;
document.addEventListener('DOMContentLoaded', () => NexusSensory.init());
