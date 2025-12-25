/**
 * NEXUS MODULE: AVATAR
 * Variabila: NEXUS_MODULE_AVATAR
 * Scop: Interfața vizuală V1 GOLD (Robot futurist)
 */

const NEXUS_MODULE_AVATAR = {
    name: "Visual Interface v1.0",
    status: "ACTIVE",

    init: function () {
        console.log("🔵 Initializing NEXUS_MODULE_AVATAR...");
        this.injectAvatar();
        this.startAnimations();
        this.setupListeners();

        // Load current gender
        const storedGender = localStorage.getItem('nexus_avatar_gender') || 'male';
        this.applyGenderUI(storedGender);
    },

    injectAvatar: function () {
        const container = document.querySelector('.avatar-container');
        if (container) {
            container.style.backgroundImage = "url('assets/nexus_avatar.png')";
            console.log("✅ Avatar Base Image Loaded");
        }
    },

    setupListeners: function () {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'm') this.handleGenderSwitch('male');
            if (key === 'f') this.handleGenderSwitch('female');
        });
    },

    handleGenderSwitch: function (newGender) {
        const currentGender = localStorage.getItem('nexus_avatar_gender') || 'male';
        if (newGender !== currentGender) {
            console.log(`🔄 Switching gender to: ${newGender}. Triggering Auto-Logout...`);

            // Core Rule: Logout on change
            localStorage.removeItem('nexus_authenticated');
            localStorage.removeItem('token');
            localStorage.setItem('nexus_avatar_gender', newGender);

            // Redirect to login
            window.location.href = 'index.html?reason=gender_switch';
        }
    },

    applyGenderUI: function (gender) {
        const container = document.querySelector('.avatar-container');
        const color = (gender === 'female') ? '#f0f' : '#0ff';
        const filter = (gender === 'female') ? 'hue-rotate(280deg)' : 'none';

        if (container) {
            container.style.borderColor = color;
            container.style.boxShadow = `0 0 50px ${color}`;
            container.style.filter = filter;
        }
    },

    startAnimations: function () {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse-glow {
                0% { box-shadow: 0 0 20px currentColor; }
                50% { box-shadow: 0 0 60px currentColor, 0 0 100px rgba(0,255,255,0.3); }
                100% { box-shadow: 0 0 20px currentColor; }
            }
        `;
        document.head.appendChild(style);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    NEXUS_MODULE_AVATAR.init();
});
