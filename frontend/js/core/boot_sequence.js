const BootSequence = {
    overlay: null,
    steps: [
        "INITIALIZING NEURAL CORE...",
        "LOADING BIOMETRIC SENSORS...",
        "ESTABLISHING WORLD LINK...",
        "DETERMINING PSYCHOLOGICAL STATE...",
        "ACTIVATING OMEGA PROTOCOLS...",
        "NEXUS v10.0 GOLD ONLINE."
    ],

    async start() {
        this.overlay = document.getElementById('boot-overlay');
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
        // Immediate start without "report"
        speak("Sistem activ.");
    },

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Only boot if we just arrived
    if (!sessionStorage.getItem('booted')) {
        BootSequence.start();
        sessionStorage.setItem('booted', 'true');
    }
});
