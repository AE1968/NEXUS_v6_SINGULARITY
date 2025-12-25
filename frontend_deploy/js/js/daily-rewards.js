// Kids Digital Hub - Daily Login Rewards
// Encourages daily engagement with escalating rewards

const KDH_DailyRewards = {
    rewards: [
        { day: 1, coins: 10, icon: '🎁', bonus: null },
        { day: 2, coins: 15, icon: '🎁', bonus: null },
        { day: 3, coins: 20, icon: '🎁', bonus: null },
        { day: 4, coins: 25, icon: '🎁', bonus: null },
        { day: 5, coins: 35, icon: '🎁', bonus: null },
        { day: 6, coins: 45, icon: '🎁', bonus: null },
        { day: 7, coins: 100, icon: '🏆', bonus: 'Weekly Bonus!' }
    ],

    getState() {
        return JSON.parse(localStorage.getItem('kdh_daily_rewards') || '{}');
    },

    saveState(state) {
        localStorage.setItem('kdh_daily_rewards', JSON.stringify(state));
    },

    getTodayKey() {
        return new Date().toISOString().split('T')[0];
    },

    // Check if reward is available today
    canClaimToday() {
        const state = this.getState();
        return state.lastClaim !== this.getTodayKey();
    },

    // Get current streak day (1-7)
    getCurrentDay() {
        const state = this.getState();
        if (!state.lastClaim) return 1;

        const lastClaim = new Date(state.lastClaim);
        const today = new Date(this.getTodayKey());
        const diffDays = Math.floor((today - lastClaim) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Consecutive day
            return Math.min((state.streak || 0) + 1, 7);
        } else if (diffDays > 1) {
            // Streak broken
            return 1;
        }
        return state.streak || 1;
    },

    // Claim today's reward
    claim() {
        if (!this.canClaimToday()) return null;

        const day = this.getCurrentDay();
        const reward = this.rewards[day - 1];

        // Update state
        const state = this.getState();
        state.lastClaim = this.getTodayKey();
        state.streak = day === 7 ? 1 : day; // Reset after 7 days
        state.totalClaimed = (state.totalClaimed || 0) + 1;
        this.saveState(state);

        // Add coins
        const currentCoins = parseInt(localStorage.getItem('kdh_coins') || '0');
        localStorage.setItem('kdh_coins', currentCoins + reward.coins);

        return reward;
    },

    // Show reward popup
    showRewardPopup() {
        if (!this.canClaimToday()) return;

        const day = this.getCurrentDay();
        const reward = this.rewards[day - 1];

        const popup = document.createElement('div');
        popup.id = 'daily-reward-popup';
        popup.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100000;
                font-family: 'Fredoka', sans-serif;
            ">
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 30px;
                    padding: 40px;
                    text-align: center;
                    color: white;
                    max-width: 400px;
                    animation: popIn 0.5s;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
                ">
                    <div style="font-size: 5rem; margin-bottom: 20px; animation: bounce 1s infinite;">${reward.icon}</div>
                    <h2 style="font-size: 1.8rem; margin-bottom: 10px;">Daily Reward!</h2>
                    <p style="opacity: 0.9; margin-bottom: 20px;">Day ${day} of 7</p>
                    
                    <div style="
                        display: flex;
                        justify-content: center;
                        gap: 10px;
                        margin-bottom: 20px;
                    ">
                        ${this.rewards.map((r, i) => `
                            <div style="
                                width: 35px;
                                height: 35px;
                                border-radius: 50%;
                                background: ${i < day - 1 ? '#4CAF50' : i === day - 1 ? '#FFD700' : 'rgba(255,255,255,0.2)'};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 0.8rem;
                            ">${i < day - 1 ? '✓' : i + 1}</div>
                        `).join('')}
                    </div>

                    <div style="
                        background: rgba(255, 215, 0, 0.3);
                        padding: 20px;
                        border-radius: 15px;
                        margin-bottom: 20px;
                    ">
                        <div style="font-size: 2.5rem; font-weight: bold;">+${reward.coins} 💰</div>
                        ${reward.bonus ? `<div style="margin-top: 10px; color: #FFD700;">${reward.bonus}</div>` : ''}
                    </div>

                    <button onclick="KDH_DailyRewards.claimAndClose()" style="
                        padding: 15px 50px;
                        background: #FFD700;
                        color: #333;
                        border: none;
                        border-radius: 25px;
                        font-size: 1.2rem;
                        font-weight: bold;
                        cursor: pointer;
                        font-family: 'Fredoka', sans-serif;
                    ">Claim Reward!</button>
                </div>
            </div>
            <style>
                @keyframes popIn {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            </style>
        `;
        document.body.appendChild(popup);
    },

    claimAndClose() {
        const reward = this.claim();

        if (window.KDH_Sounds) {
            KDH_Sounds.playCoin();
        }

        const popup = document.getElementById('daily-reward-popup');
        if (popup) {
            popup.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100000;
                    font-family: 'Fredoka', sans-serif;
                ">
                    <div style="text-align: center; color: white; animation: celebrate 0.5s;">
                        <div style="font-size: 8rem;">🎉</div>
                        <h2 style="font-size: 2rem;">+${reward.coins} Coins!</h2>
                        <p>Come back tomorrow for more!</p>
                    </div>
                </div>
                <style>
                    @keyframes celebrate {
                        0% { transform: scale(0); }
                        100% { transform: scale(1); }
                    }
                </style>
            `;
            setTimeout(() => popup.remove(), 2000);
        }
    },

    // Check on page load
    init() {
        // Small delay to let page load
        setTimeout(() => {
            if (this.canClaimToday()) {
                this.showRewardPopup();
            }
        }, 1000);
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    KDH_DailyRewards.init();
});

window.KDH_DailyRewards = KDH_DailyRewards;
