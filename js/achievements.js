// Kids Digital Hub - Achievements System
// Tracks and rewards user accomplishments

const KDH_Achievements = {
    // Achievement definitions
    badges: {
        'first_steps': { name: 'First Steps', icon: '⭐', description: 'Complete your first activity', points: 10 },
        'artist': { name: 'Artist', icon: '🎨', description: 'Create 5 drawings', points: 25 },
        'bookworm': { name: 'Bookworm', icon: '📚', description: 'Read 5 stories', points: 25 },
        'memory_master': { name: 'Memory Master', icon: '🧠', description: 'Complete Memory Match', points: 20 },
        'math_wizard': { name: 'Math Wizard', icon: '🔢', description: 'Score 100+ in Math Blaster', points: 30 },
        'maze_runner': { name: 'Maze Runner', icon: '🚀', description: 'Complete 3 maze levels', points: 25 },
        'quiz_champion': { name: 'Quiz Champion', icon: '🏆', description: 'Get 8/10 in Fun Quiz', points: 30 },
        'streak_king': { name: 'Streak King', icon: '🔥', description: 'Get a 10 answer streak', points: 50 },
        'daily_hero': { name: 'Daily Hero', icon: '📅', description: 'Play 7 days in a row', points: 100 },
        'explorer': { name: 'Explorer', icon: '🗺️', description: 'Visit all sections', points: 40 },
        'time_keeper': { name: 'Time Keeper', icon: '⏰', description: 'Use site for 1 hour total', points: 20 },
        'super_star': { name: 'Super Star', icon: '🌟', description: 'Earn 500 total points', points: 75 }
    },

    // Initialize or load saved achievements
    init() {
        if (!localStorage.getItem('kdh_achievements')) {
            localStorage.setItem('kdh_achievements', JSON.stringify({
                unlocked: [],
                progress: {},
                totalPoints: 0,
                lastActivity: null
            }));
        }
        this.checkProgressAchievements();
    },

    // Get current state
    getState() {
        return JSON.parse(localStorage.getItem('kdh_achievements') || '{}');
    },

    // Save state
    saveState(state) {
        localStorage.setItem('kdh_achievements', JSON.stringify(state));
    },

    // Check if achievement is unlocked
    isUnlocked(id) {
        const state = this.getState();
        return state.unlocked && state.unlocked.includes(id);
    },

    // Unlock an achievement
    unlock(id) {
        if (this.isUnlocked(id)) return false;

        const badge = this.badges[id];
        if (!badge) return false;

        const state = this.getState();
        state.unlocked.push(id);
        state.totalPoints = (state.totalPoints || 0) + badge.points;
        this.saveState(state);

        // Show notification
        this.showNotification(badge);

        // Check for super_star
        if (state.totalPoints >= 500 && !this.isUnlocked('super_star')) {
            this.unlock('super_star');
        }

        return true;
    },

    // Increment progress counter
    addProgress(type, amount = 1) {
        const state = this.getState();
        state.progress[type] = (state.progress[type] || 0) + amount;
        this.saveState(state);

        // Check for milestone achievements
        this.checkMilestone(type, state.progress[type]);
    },

    // Check milestone achievements
    checkMilestone(type, value) {
        switch (type) {
            case 'drawings':
                if (value >= 5 && !this.isUnlocked('artist')) this.unlock('artist');
                break;
            case 'stories':
                if (value >= 5 && !this.isUnlocked('bookworm')) this.unlock('bookworm');
                break;
            case 'maze_levels':
                if (value >= 3 && !this.isUnlocked('maze_runner')) this.unlock('maze_runner');
                break;
            case 'activities':
                if (value >= 1 && !this.isUnlocked('first_steps')) this.unlock('first_steps');
                break;
        }
    },

    // Check time-based achievements
    checkProgressAchievements() {
        const seconds = parseInt(localStorage.getItem('kdh_today_seconds') || '0');
        if (seconds >= 3600 && !this.isUnlocked('time_keeper')) {
            this.unlock('time_keeper');
        }
    },

    // Show achievement notification
    showNotification(badge) {
        // Remove existing notification
        const existing = document.getElementById('achievement-notification');
        if (existing) existing.remove();

        // Create notification
        const notification = document.createElement('div');
        notification.id = 'achievement-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #FFD700, #FFA500);
                color: white;
                padding: 20px 30px;
                border-radius: 20px;
                box-shadow: 0 10px 40px rgba(255, 165, 0, 0.4);
                z-index: 10000;
                animation: slideIn 0.5s ease-out, slideOut 0.5s ease-in 3.5s forwards;
                font-family: 'Fredoka', sans-serif;
            ">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 3rem;">${badge.icon}</span>
                    <div>
                        <div style="font-size: 0.8rem; opacity: 0.9;">🏆 Achievement Unlocked!</div>
                        <div style="font-size: 1.3rem; font-weight: bold;">${badge.name}</div>
                        <div style="font-size: 0.9rem;">+${badge.points} points</div>
                    </div>
                </div>
            </div>
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);

        // Remove after animation
        setTimeout(() => notification.remove(), 4000);
    },

    // Get total points
    getTotalPoints() {
        return this.getState().totalPoints || 0;
    },

    // Get unlocked count
    getUnlockedCount() {
        return (this.getState().unlocked || []).length;
    },

    // Get all unlocked achievements
    getUnlocked() {
        const state = this.getState();
        return (state.unlocked || []).map(id => ({
            id,
            ...this.badges[id]
        }));
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    KDH_Achievements.init();

    // Track activity
    KDH_Achievements.addProgress('activities');
});

// Export for use in other files
window.KDH_Achievements = KDH_Achievements;
