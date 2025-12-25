/**
 * 💰 NEXUS ECONOMY v6.0
 * Handles "Nexus Credits" (NC) and Daily Rewards.
 */

const NexusEconomy = {
    init: function () {
        if (!localStorage.getItem('nexus_credits')) {
            localStorage.setItem('nexus_credits', '500'); // Starting balance
        }
        this.checkDailyReward();
        this.updateUI();
    },

    getCredits: function () {
        return parseInt(localStorage.getItem('nexus_credits') || '0');
    },

    setCredits: function (amount) {
        localStorage.setItem('nexus_credits', amount.toString());
        this.updateUI();
    },

    addCredits: function (amount) {
        const current = this.getCredits();
        this.setCredits(current + Math.round(amount));
        console.log(`💰 ECONOMY: Added ${amount} NC. New Balance: ${this.getCredits()}`);
    },

    subtractCredits: function (amount) {
        const current = this.getCredits();
        if (current < amount) return false;
        this.setCredits(current - amount);
        return true;
    },

    checkDailyReward: function () {
        const last = localStorage.getItem('nexus_last_daily');
        const today = new Date().toISOString().split('T')[0];

        if (last !== today) {
            // Can claim
            this.showDailyPopup();
        }
    },

    claimDaily: function () {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('nexus_last_daily', today);
        this.addCredits(50); // Daily 50 credits

        const popup = document.getElementById('daily-popup-container');
        if (popup) {
            popup.style.animation = "achSlideOut 0.5s ease forwards";
            setTimeout(() => popup.remove(), 500);
        }
    },

    showDailyPopup: function () {
        const container = document.createElement('div');
        container.id = 'daily-popup-container';
        container.innerHTML = `
            <div class="daily-card">
                <div class="daily-glow"></div>
                <h2>DAILY REWARD</h2>
                <div class="daily-reward-val">+50 NC</div>
                <p>Welcome back, Architect.</p>
                <button onclick="NexusEconomy.claimDaily()">CLAIM CREDITS</button>
            </div>
            <style>
                #daily-popup-container {
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.8);
                    z-index: 200000;
                    display: flex; align-items: center; justify-content: center;
                    backdrop-filter: blur(8px);
                    font-family: 'Rajdhani', sans-serif;
                }
                .daily-card {
                    background: #000;
                    border: 2px solid var(--neon-cyan);
                    border-radius: 20px;
                    padding: 40px;
                    text-align: center;
                    position: relative;
                    box-shadow: 0 0 50px rgba(0, 243, 255, 0.4);
                    min-width: 300px;
                }
                .daily-card h2 { font-family: 'Orbitron'; color: var(--neon-cyan); letter-spacing: 5px; margin-bottom: 20px; }
                .daily-reward-val { font-size: 3rem; font-weight: bold; color: #fff; text-shadow: 0 0 20px var(--neon-cyan); margin-bottom: 20px; }
                .daily-card p { color: #888; margin-bottom: 30px; }
                .daily-card button {
                    background: var(--neon-cyan); color: #000; border: none;
                    padding: 15px 40px; border-radius: 30px; font-weight: bold;
                    font-family: 'Orbitron'; cursor: pointer; transition: 0.3s;
                }
                .daily-card button:hover { transform: scale(1.1); box-shadow: 0 0 20px var(--neon-cyan); }
            </style>
        `;
        document.body.appendChild(container);
    },

    updateUI: function () {
        const el = document.getElementById('nexus-credits-display');
        if (el) {
            el.innerHTML = `💰 ${this.getCredits()} <span style="font-size: 0.6rem; color: #888;">NC</span>`;
            el.style.animation = "pulseNC 0.5s ease";
            setTimeout(() => el.style.animation = "", 500);
        }
    }
};

window.NexusEconomy = NexusEconomy;
document.addEventListener('DOMContentLoaded', () => NexusEconomy.init());
