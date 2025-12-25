class TimeManager {
    static get DEFAULT_FREE_START() { return 8; } // 8 AM
    static get DEFAULT_FREE_END() { return 21; } // 9 PM
    static get HARD_STOP_HOUR() { return 21; } // 9 PM for everyone (sleep time)

    static init() {
        this.checkAccess();
        // Check every minute
        setInterval(() => this.checkAccess(), 60000);
    }

    static getParentSettings() {
        const stored = localStorage.getItem('kdh_parent_settings');
        if (stored) return JSON.parse(stored);
        return {
            startHour: 8,
            endHour: 21,
            enabled: false
        };
    }

    static setParentSettings(start, end, enabled) {
        const settings = { startHour: start, endHour: end, enabled: enabled };
        localStorage.setItem('kdh_parent_settings', JSON.stringify(settings));
    }

    static isAdmin() {
        return localStorage.getItem('kdh_admin_mode') === 'true';
    }

    static isSleepTime() {
        const now = new Date();
        const hour = now.getHours();
        // Global hard stop at 21:00 (9 PM) until 6 AM? Or just strict 21 checks?
        // User said: "raportul ... la ora 21 ... copilul se presupune ca doarme"
        // "Platforma nu v-a lasa copilul ... sa stea peste ora 21"
        return hour >= this.HARD_STOP_HOUR || hour < 6;
    }

    static checkAccess() {
        // Admin always has full access
        if (this.isAdmin()) return;

        // Check if we are currently on the stories page
        const isStoriesPage = window.location.pathname.includes('gallery-stories.html');
        const isPaymentPage = window.location.pathname.includes('payment.html'); // Allow payment interaction? Maybe.

        const now = new Date();
        const hour = now.getHours();

        // 1. Check Hard Stop (Sleep Time) -> 21:00 PM
        if (hour >= this.HARD_STOP_HOUR) {
            if (!isStoriesPage) {
                // Redirect to stories with sleep mode
                window.location.href = 'gallery-stories.html?mode=sleep';
            }
            return;
        }

        // 2. Check Parent Defined Interval OR Free Tier Limits
        // Default Free Tier: 8 AM - 9 PM
        // If parent settings exist, use those, but they can't exceed 21:00 logically if we enforce the hard stop.

        let allowedStart = this.DEFAULT_FREE_START;
        let allowedEnd = this.DEFAULT_FREE_END;

        const parentSettings = this.getParentSettings();
        if (parentSettings.enabled) {
            allowedStart = parentSettings.startHour;
            allowedEnd = Math.min(parentSettings.endHour, 21); // Cap at 21
        }

        const isWithinActiveHours = hour >= allowedStart && hour < allowedEnd;

        if (!isWithinActiveHours) {
            // Outside active hours, only stories allowed
            if (!isStoriesPage) {
                console.log(`Outside active hours (${hour}:00). Redirecting to stories.`);
                window.location.href = 'gallery-stories.html?mode=quiet';
            }
        }
    }
}

// Expose to window
window.TimeManager = TimeManager;
