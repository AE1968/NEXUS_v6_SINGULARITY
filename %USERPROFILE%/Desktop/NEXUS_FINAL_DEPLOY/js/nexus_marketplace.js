/**
 * 🛒 NEXUS MARKETPLACE v10.0
 * The Central Customization Hub for the Humanoid Interface.
 */

const NexusMarketplace = {
    items: [
        { id: 'skin_cyber', name: 'Neon Cyber Skin', category: 'visual', price: 200, icon: '🌟', desc: 'Activează o aură neon pulsantă în jurul avatarului.' },
        { id: 'voice_premium', name: 'ElevenLabs Voice', category: 'voice', price: 500, icon: '🎙️', desc: 'Deblochează sinteza vocală de înaltă fidelitate.' },
        { id: 'brain_turbo', name: 'Neural Turbo-Link', category: 'brain', price: 1000, icon: '⚡', desc: 'Răspunsuri mai rapide și context extins.' },
        { id: 'theme_dark_gold', name: 'Royal Gold UI', category: 'visual', price: 300, icon: '👑', desc: 'O interfață premium cu accente aurii.' }
    ],

    init: function () {
        if (!localStorage.getItem('nexus_inventory')) {
            localStorage.setItem('nexus_inventory', JSON.stringify([]));
        }
        console.log("🛒 MARKETPLACE: Initialized.");
    },

    getInventory: function () {
        return JSON.parse(localStorage.getItem('nexus_inventory'));
    },

    isOwned: function (id) {
        return this.getInventory().includes(id);
    },

    buyItem: function (id) {
        if (this.isOwned(id)) {
            alert("Deții deja acest upgrade.");
            return;
        }

        const item = this.items.find(i => i.id === id);
        if (!item) return;

        if (window.NexusEconomy && window.NexusEconomy.subtractCredits(item.price)) {
            const inv = this.getInventory();
            inv.push(id);
            localStorage.setItem('nexus_inventory', JSON.stringify(inv));

            this.applyItem(id);
            this.render(); // Refresh UI
            if (window.NexusAudio) window.NexusAudio.beep('success');

            if (window.addMessageToChat) {
                window.addMessageToChat('robot', `Sistemul a fost actualizat cu succes: ${item.name}. [[ACTION:AVATAR_SWITCH]]`);
            }
        } else {
            alert("Credite insuficiente! (NC)");
        }
    },

    applyItem: function (id) {
        const bodyValue = document.body;
        if (id === 'skin_cyber') {
            document.body.classList.add('cyber-skin');
        }
        if (id === 'voice_premium') {
            localStorage.setItem('kelion_tts_provider', 'eleven');
            // Update UI switch if exists
            const btn = document.getElementById('tts-eleven');
            if (btn) btn.click();
        }
        if (id === 'theme_dark_gold') {
            document.documentElement.style.setProperty('--neon-cyan', '#FFD700');
            document.documentElement.style.setProperty('--neon-pink', '#FFA500');
        }
    },

    open: function () {
        const modal = document.getElementById('market-modal');
        if (modal) {
            modal.classList.add('active');
            this.render();
        }
    },

    close: function () {
        const modal = document.getElementById('market-modal');
        if (modal) modal.classList.remove('active');
    },

    render: function () {
        const container = document.getElementById('market-items-grid');
        if (!container) return;

        const credits = window.NexusEconomy ? window.NexusEconomy.getCredits() : 0;
        document.getElementById('market-user-credits').textContent = credits;

        let html = '';
        this.items.forEach(item => {
            const owned = this.isOwned(item.id);
            html += `
                <div class="market-item ${owned ? 'owned' : ''}">
                    <div class="item-icon">${item.icon}</div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-desc">${item.desc}</div>
                    <div class="item-footer">
                        <span class="item-price">${owned ? 'OWNED' : item.price + ' NC'}</span>
                        <button class="buy-btn" onclick="NexusMarketplace.buyItem('${item.id}')" ${owned ? 'disabled' : ''}>
                            ${owned ? 'INSTALLED' : 'PURCHASE'}
                        </button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
};

window.NexusMarketplace = NexusMarketplace;
document.addEventListener('DOMContentLoaded', () => NexusMarketplace.init());
