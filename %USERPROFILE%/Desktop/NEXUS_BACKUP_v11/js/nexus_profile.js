/**
 * NEXUS CITIZEN PROFILE v1.0
 * Gamification, Stats & Progress Tracking
 */

const NexusProfile = {
    // Config
    LEVEL_THRESHOLDS: [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000],
    BADGES: {
        'founder': { icon: '🚀', name: 'Founder', desc: 'One of the first users.' },
        'chat_novice': { icon: '💬', name: 'Chatterbox', desc: 'Sent 50 messages.' },
        'polyglot': { icon: '🌍', name: 'Polyglot', desc: 'Spoke in multiple languages.' },
        'night_owl': { icon: '🦉', name: 'Night Owl', desc: 'Active after midnight.' },
        'explorer': { icon: '🧭', name: 'Explorer', desc: 'Discovered all features.' }
    },

    data: {
        xp: 0,
        level: 1,
        badges: ['founder'],
        joined: new Date().toISOString(),
        stats: {
            messagesSent: 0,
            commandsUsed: 0,
            voiceTime: 0
        }
    },

    init: function () {
        this.load();
        this.renderMiniWidget();
        console.log('👤 Nexus Profile Initialized. Level:', this.data.level);
    },

    load: function () {
        const saved = localStorage.getItem('nexus_user_profile');
        if (saved) {
            this.data = { ...this.data, ...JSON.parse(saved) };
        } else {
            this.save();
        }
    },

    save: function () {
        localStorage.setItem('nexus_user_profile', JSON.stringify(this.data));
        this.updateMiniWidget();
    },

    // --- PROGRESS LOGIC ---

    addXP: function (amount) {
        const oldLevel = this.data.level;
        this.data.xp += amount;

        // Check Level Up
        const nextLevelXP = this.LEVEL_THRESHOLDS[this.data.level];
        if (this.data.xp >= nextLevelXP && this.data.level < this.LEVEL_THRESHOLDS.length) {
            this.data.level++;
            this.triggerLevelUp();
        }

        this.save();
    },

    triggerLevelUp: function () {
        if (typeof NexusAudio !== 'undefined') NexusAudio.playSuccess();
        if (typeof addLog === 'function') addLog(`🎉 LEVEL UP! You are now Level ${this.data.level}!`, 'system');
        this.showWidgetBriefly(10000);
    },

    incrementStat: function (stat, amount = 1) {
        if (!this.data.stats[stat]) this.data.stats[stat] = 0;
        this.data.stats[stat] += amount;

        // Badge Checks
        if (stat === 'messagesSent' && this.data.stats.messagesSent >= 50 && !this.data.badges.includes('chat_novice')) {
            this.awardBadge('chat_novice');
        }

        this.save();
    },

    awardBadge: function (badgeId) {
        if (!this.BADGES[badgeId]) return;
        if (this.data.badges.includes(badgeId)) return;

        this.data.badges.push(badgeId);
        if (typeof NexusAudio !== 'undefined') NexusAudio.playSuccess();
        if (typeof addLog === 'function') addLog(`🏆 BADGE UNLOCKED: ${this.BADGES[badgeId].name} - ${this.BADGES[badgeId].desc}`, 'system');
        this.save();
        this.showWidgetBriefly(10000);
    },

    // --- UI ---

    renderMiniWidget: function () {
        // Create or update the mini profile in top-right corner
        let widget = document.getElementById('nexus-profile-widget');
        if (!widget) {
            widget = document.createElement('div');
            widget.id = 'nexus-profile-widget';
            // Start Hidden (Stealth Mode)
            widget.style.cssText = `
                position: fixed; top: 15px; right: 15px;
                background: rgba(0, 0, 0, 0.6);
                border: 1px solid var(--neon-cyan);
                border-radius: 10px;
                padding: 5px 15px;
                display: none; 
                align-items: center;
                gap: 10px;
                cursor: pointer;
                z-index: 10000;
                font-family: 'Rajdhani', sans-serif;
                backdrop-filter: blur(5px);
                transition: opacity 0.5s;
                opacity: 0;
            `;
            widget.onclick = () => this.showModal();
            document.body.appendChild(widget);
        }
        this.updateMiniWidget();
    },

    showWidgetBriefly: function (duration = 5000) {
        const w = document.getElementById('nexus-profile-widget');
        if (w) {
            w.style.display = 'flex';
            // Small delay to allow display change to register before opacity transition
            setTimeout(() => { w.style.opacity = '1'; }, 50);

            if (this.hideTimer) clearTimeout(this.hideTimer);
            this.hideTimer = setTimeout(() => {
                w.style.opacity = '0';
                setTimeout(() => { w.style.display = 'none'; }, 500);
            }, duration);
        }
    },

    updateMiniWidget: function () {
        const widget = document.getElementById('nexus-profile-widget');
        if (!widget) return;

        const nextLevelXP = this.LEVEL_THRESHOLDS[this.data.level] || 99999;
        const prevLevelXP = this.LEVEL_THRESHOLDS[this.data.level - 1] || 0;
        const progress = ((this.data.xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;

        // User Name from Session or Guest
        const userName = sessionStorage.getItem('nexus_user_name') || 'Citizen';

        widget.innerHTML = `
            <div style="font-weight: bold; color: white;">${userName}</div>
            <div style="font-size: 0.8em; color: var(--neon-cyan);">Lvl ${this.data.level}</div>
            <div style="width: 50px; height: 4px; background: #333; border-radius: 2px; overflow: hidden;">
                <div style="width: ${progress}%; height: 100%; background: var(--matrix-green);"></div>
            </div>
        `;
    },

    showModal: function () {
        // Remove existing modal if any
        const existing = document.getElementById('profile-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'profile-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85);
            display: flex; justify-content: center; align-items: center;
            z-index: 10001;
            backdrop-filter: blur(8px);
        `;

        const badgesHTML = this.data.badges.map(b => {
            const badge = this.BADGES[b];
            return `
                <div style="text-align: center; background: rgba(0,243,255,0.1); padding: 10px; border-radius: 8px; border: 1px solid #333;">
                    <div style="font-size: 2rem;">${badge.icon}</div>
                    <div style="font-weight: bold; color: var(--neon-cyan); margin-top: 5px;">${badge.name}</div>
                    <div style="font-size: 0.8rem; color: #aaa;">${badge.desc}</div>
                </div>
            `;
        }).join('');

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(10,20,30,0.95), rgba(5,5,10,0.95));
                border: 2px solid var(--neon-cyan);
                border-radius: 15px;
                padding: 30px;
                width: 90%; max-width: 600px;
                box-shadow: 0 0 50px rgba(0,243,255,0.2);
                position: relative;
                font-family: 'Orbitron', sans-serif;
            ">
                <button onclick="document.getElementById('profile-modal').remove()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">×</button>
                
                <h2 style="color: var(--neon-cyan); text-align: center; margin-bottom: 5px;">DIGITAL CITIZEN ID</h2>
                <div style="text-align: center; color: #666; font-size: 0.8rem; margin-bottom: 20px;">ID: ${localStorage.getItem('nexus_user_id') || 'GUEST-001'}</div>

                <div style="display: flex; gap: 20px; margin-bottom: 30px; justify-content: space-around; text-align: center;">
                    <div>
                        <div style="font-size: 2rem; color: var(--matrix-green);">${this.data.level}</div>
                        <div style="font-size: 0.8rem; color: #aaa;">LEVEL</div>
                    </div>
                    <div>
                        <div style="font-size: 2rem; color: var(--neon-purple);">${this.data.xp}</div>
                        <div style="font-size: 0.8rem; color: #aaa;">TOTAL XP</div>
                    </div>
                    <div>
                        <div style="font-size: 2rem; color: #ff0055;>${this.data.badges.length}</div>
                        <div style="font-size: 0.8rem; color: #aaa;">BADGES</div>
                    </div>
                </div>

                <h3 style="border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 15px; font-size: 1rem;">BADGE COLLECTION</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; max-height: 200px; overflow-y: auto;">
                    ${badgesHTML}
                </div>

                <div style="margin-top: 30px; text-align: center;">
                    <button onclick="document.getElementById('profile-modal').remove()" style="
                        background: var(--neon-cyan); color: black; border: none; padding: 10px 30px; border-radius: 20px; font-weight: bold; cursor: pointer;
                    ">CLOSE IDENTITY PANEL</button>
                    ${this.data.level >= 5 ? '<div style="margin-top:10px; color:#ffd700; font-size:0.8rem;">✨ ELITE STATUS ACTIVE</div>' : ''}
                </div>
            </div>
        `;

        if (typeof NexusAudio !== 'undefined') NexusAudio.playClick();
        document.body.appendChild(modal);
    }
};

// Hook into system
window.NexusProfile = NexusProfile;
window.addEventListener('load', () => NexusProfile.init());
