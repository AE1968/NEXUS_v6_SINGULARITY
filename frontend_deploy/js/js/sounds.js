// Kids Digital Hub - Sound Effects Manager
// Fun sounds for interactions

const KDH_Sounds = {
    // Audio context
    ctx: null,

    // Initialize audio context on first interaction
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    // Play a beep sound (success)
    playSuccess() {
        this.init();
        this.playTone(523.25, 0.1); // C5
        setTimeout(() => this.playTone(659.25, 0.1), 100); // E5
        setTimeout(() => this.playTone(783.99, 0.15), 200); // G5
    },

    // Play error sound
    playError() {
        this.init();
        this.playTone(200, 0.2, 'square');
        setTimeout(() => this.playTone(150, 0.3, 'square'), 150);
    },

    // Play click sound
    playClick() {
        this.init();
        this.playTone(800, 0.05);
    },

    // Play coin sound
    playCoin() {
        this.init();
        this.playTone(987.77, 0.08); // B5
        setTimeout(() => this.playTone(1318.51, 0.1), 80); // E6
    },

    // Play achievement sound
    playAchievement() {
        this.init();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15), i * 100);
        });
    },

    // Play level up sound
    playLevelUp() {
        this.init();
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.playTone(400 + i * 100, 0.1), i * 80);
        }
    },

    // Play countdown tick
    playTick() {
        this.init();
        this.playTone(1000, 0.03);
    },

    // Play game over
    playGameOver() {
        this.init();
        this.playTone(400, 0.2, 'sawtooth');
        setTimeout(() => this.playTone(300, 0.2, 'sawtooth'), 200);
        setTimeout(() => this.playTone(200, 0.4, 'sawtooth'), 400);
    },

    // Play whoosh
    playWhoosh() {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    },

    // Core tone player
    playTone(frequency, duration, type = 'sine') {
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = frequency;

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    // Check if sounds are enabled
    isEnabled() {
        return localStorage.getItem('kdh_sounds') !== 'off';
    },

    // Toggle sounds
    toggle() {
        if (this.isEnabled()) {
            localStorage.setItem('kdh_sounds', 'off');
        } else {
            localStorage.removeItem('kdh_sounds');
            this.playSuccess();
        }
    }
};

// Export
window.KDH_Sounds = KDH_Sounds;

// Auto-play success on achievement
document.addEventListener('DOMContentLoaded', () => {
    // Hook into achievement system
    if (window.KDH_Achievements) {
        const originalUnlock = KDH_Achievements.unlock.bind(KDH_Achievements);
        KDH_Achievements.unlock = function (id) {
            const result = originalUnlock(id);
            if (result && KDH_Sounds.isEnabled()) {
                KDH_Sounds.playAchievement();
            }
            return result;
        };
    }
});
