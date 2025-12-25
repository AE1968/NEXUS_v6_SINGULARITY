// Kids Digital Hub - Daily Challenges System
// New challenges every day to keep kids engaged

const KDH_Challenges = {
    // Challenge templates
    templates: [
        { id: 'draw_1', type: 'drawing', task: 'Create a drawing of your favorite animal', reward: 50, icon: '🎨' },
        { id: 'draw_2', type: 'drawing', task: 'Draw a rainbow with all 7 colors', reward: 50, icon: '🌈' },
        { id: 'draw_3', type: 'drawing', task: 'Create a family portrait', reward: 75, icon: '👨‍👩‍👧' },
        { id: 'game_1', type: 'game', task: 'Score 500+ points in Math Blaster', reward: 75, icon: '🔢' },
        { id: 'game_2', type: 'game', task: 'Complete Memory Match in under 2 minutes', reward: 60, icon: '🧠' },
        { id: 'game_3', type: 'game', task: 'Reach Level 3 in Space Maze', reward: 80, icon: '🚀' },
        { id: 'quiz_1', type: 'quiz', task: 'Get 8/10 or better in Fun Quiz', reward: 70, icon: '📚' },
        { id: 'quiz_2', type: 'quiz', task: 'Complete a quiz without losing a life', reward: 100, icon: '❤️' },
        { id: 'story_1', type: 'story', task: 'Read any story from start to finish', reward: 40, icon: '📖' },
        { id: 'story_2', type: 'story', task: 'Read 2 different stories today', reward: 60, icon: '📚' },
        { id: 'explore_1', type: 'explore', task: 'Visit all 4 gallery sections', reward: 50, icon: '🗺️' },
        { id: 'time_1', type: 'time', task: 'Play for 30 minutes today', reward: 30, icon: '⏰' },
        { id: 'streak_1', type: 'streak', task: 'Get a 5 answer streak in any game', reward: 45, icon: '🔥' },
        { id: 'color_1', type: 'drawing', task: 'Use the Magic Coloring canvas', reward: 35, icon: '🖌️' }
    ],

    // Get today's date string
    getTodayKey() {
        return new Date().toISOString().split('T')[0];
    },

    // Get saved state
    getState() {
        return JSON.parse(localStorage.getItem('kdh_challenges') || '{}');
    },

    // Save state
    saveState(state) {
        localStorage.setItem('kdh_challenges', JSON.stringify(state));
    },

    // Generate daily challenges (3 per day)
    generateDaily() {
        const today = this.getTodayKey();
        const state = this.getState();

        // Already generated for today?
        if (state.date === today && state.challenges) {
            return state.challenges;
        }

        // Use date as seed for consistent daily challenges
        const seed = today.replace(/-/g, '');
        const shuffled = [...this.templates].sort((a, b) => {
            const hashA = (parseInt(seed) * a.id.charCodeAt(0)) % 1000;
            const hashB = (parseInt(seed) * b.id.charCodeAt(0)) % 1000;
            return hashA - hashB;
        });

        // Pick 3 different types
        const types = ['drawing', 'game', 'quiz'];
        const challenges = [];

        for (const type of types) {
            const match = shuffled.find(t => t.type === type && !challenges.includes(t));
            if (match) challenges.push({ ...match, completed: false });
        }

        // Save
        state.date = today;
        state.challenges = challenges;
        state.completedToday = 0;
        this.saveState(state);

        return challenges;
    },

    // Get today's challenges
    getToday() {
        return this.generateDaily();
    },

    // Complete a challenge
    complete(id) {
        const state = this.getState();
        if (!state.challenges) return false;

        const challenge = state.challenges.find(c => c.id === id);
        if (!challenge || challenge.completed) return false;

        challenge.completed = true;
        state.completedToday = (state.completedToday || 0) + 1;
        state.totalCompleted = (state.totalCompleted || 0) + 1;
        state.totalRewards = (state.totalRewards || 0) + challenge.reward;
        this.saveState(state);

        // Award coins
        this.awardCoins(challenge.reward);

        // Show notification
        this.showNotification(challenge);

        // Check for daily hero achievement
        if (state.completedToday >= 3 && window.KDH_Achievements) {
            window.KDH_Achievements.unlock('daily_hero');
        }

        return true;
    },

    // Award coins
    awardCoins(amount) {
        const current = parseInt(localStorage.getItem('kdh_coins') || '0');
        localStorage.setItem('kdh_coins', current + amount);
    },

    // Show completion notification
    showNotification(challenge) {
        const existing = document.getElementById('challenge-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.id = 'challenge-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #4CAF50, #8BC34A);
                color: white;
                padding: 20px 40px;
                border-radius: 25px;
                box-shadow: 0 10px 40px rgba(76, 175, 80, 0.4);
                z-index: 10000;
                animation: bounceIn 0.5s ease-out;
                font-family: 'Fredoka', sans-serif;
                text-align: center;
            ">
                <div style="font-size: 2.5rem; margin-bottom: 5px;">${challenge.icon}</div>
                <div style="font-size: 1.2rem; font-weight: bold;">Challenge Complete!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">+${challenge.reward} coins earned!</div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes bounceIn {
                0% { transform: translateX(-50%) scale(0); }
                50% { transform: translateX(-50%) scale(1.1); }
                100% { transform: translateX(-50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    },

    // Get stats
    getStats() {
        const state = this.getState();
        return {
            completedToday: state.completedToday || 0,
            totalCompleted: state.totalCompleted || 0,
            totalRewards: state.totalRewards || 0
        };
    }
};

window.KDH_Challenges = KDH_Challenges;
