// Kids Digital Hub - Bedtime Mode
// Restricts access during sleep hours

const KDH_Bedtime = {
    // Check if bedtime mode is active
    isActive() {
        const settings = this.getSettings();
        if (!settings.enabled) return false;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = settings.startTime.split(':').map(Number);
        const [endH, endM] = settings.endTime.split(':').map(Number);

        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        // Handle overnight bedtime (e.g., 20:00 to 07:00)
        if (startMinutes > endMinutes) {
            // Bedtime crosses midnight
            return currentMinutes >= startMinutes || currentMinutes < endMinutes;
        } else {
            // Bedtime within same day
            return currentMinutes >= startMinutes && currentMinutes < endMinutes;
        }
    },

    // Get settings
    getSettings() {
        const saved = localStorage.getItem('kdh_parent_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            return {
                enabled: settings.bedtimeMode !== false,
                startTime: settings.bedtimeStart || '22:00',
                endTime: settings.bedtimeEnd || '07:00'
            };
        }
        return {
            enabled: false,
            startTime: '22:00',
            endTime: '07:00'
        };
    },

    // Show bedtime overlay
    showOverlay() {
        if (document.getElementById('bedtime-overlay')) return;

        const settings = this.getSettings();

        const overlay = document.createElement('div');
        overlay.id = 'bedtime-overlay';
        overlay.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(180deg, #1a1a3a 0%, #0f0c29 100%);
                z-index: 99999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: 'Fredoka', sans-serif;
                color: white;
                text-align: center;
                padding: 20px;
            ">
                <div style="font-size: 8rem; margin-bottom: 20px; animation: float 3s ease-in-out infinite;">🌙</div>
                <h1 style="font-size: 2.5rem; margin-bottom: 10px;">Time for Bed!</h1>
                <p style="font-size: 1.2rem; opacity: 0.8; max-width: 400px; margin-bottom: 30px;">
                    It's sleepy time! The fun will be here waiting for you tomorrow. 
                    Sweet dreams! 💫
                </p>
                <div style="background: rgba(255,255,255,0.1); padding: 20px 40px; border-radius: 20px; margin-bottom: 30px;">
                    <div style="font-size: 0.9rem; opacity: 0.7;">Bedtime: ${settings.startTime} - ${settings.endTime}</div>
                    <div style="font-size: 1.5rem; margin-top: 10px;" id="bedtime-countdown"></div>
                </div>
                <div style="display: flex; gap: 15px; margin-top: 20px;">
                    <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.1); border-radius: 50%; animation: twinkle 2s infinite 0.2s;"></div>
                    <div style="width: 30px; height: 30px; background: rgba(255,255,255,0.1); border-radius: 50%; animation: twinkle 2s infinite 0.5s;"></div>
                    <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; animation: twinkle 2s infinite 0.8s;"></div>
                </div>
            </div>
            <style>
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.8; }
                }
            </style>
        `;

        document.body.appendChild(overlay);
        this.updateCountdown();
        setInterval(() => this.updateCountdown(), 1000);
    },

    // Update countdown to wake time
    updateCountdown() {
        const el = document.getElementById('bedtime-countdown');
        if (!el) return;

        const settings = this.getSettings();
        const [endH, endM] = settings.endTime.split(':').map(Number);

        const now = new Date();
        const wakeTime = new Date(now);
        wakeTime.setHours(endH, endM, 0, 0);

        // If wake time is earlier than now, it's tomorrow
        if (wakeTime <= now) {
            wakeTime.setDate(wakeTime.getDate() + 1);
        }

        const diff = wakeTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        el.textContent = `🌅 Wake up in: ${hours}h ${minutes}m ${seconds}s`;
    },

    // Initialize
    init() {
        // Handle admin trigger visibility (if exists)
        const updateAdminTrigger = () => {
            const trigger = document.getElementById('secret-admin-trigger');
            if (trigger) {
                trigger.style.display = this.isActive() ? 'inline-flex' : 'none';
            }
        };

        // Check on load
        if (this.isActive()) {
            this.showOverlay();
        }
        updateAdminTrigger();

        // Check periodically
        setInterval(() => {
            if (this.isActive() && !document.getElementById('bedtime-overlay')) {
                this.showOverlay();
            }
            updateAdminTrigger();
        }, 60000); // Check every minute
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    KDH_Bedtime.init();
});

window.KDH_Bedtime = KDH_Bedtime;
