// Kids Digital Hub - Leaderboard System
// Tracks high scores and displays rankings

const KDH_Leaderboard = {
    // Get all scores
    getScores() {
        return JSON.parse(localStorage.getItem('kdh_leaderboard') || '{}');
    },

    // Save scores
    saveScores(scores) {
        localStorage.setItem('kdh_leaderboard', JSON.stringify(scores));
    },

    // Submit a score
    submitScore(game, playerName, score) {
        const scores = this.getScores();

        if (!scores[game]) {
            scores[game] = [];
        }

        // Add new score
        scores[game].push({
            name: playerName || 'Anonymous',
            score: score,
            date: new Date().toISOString()
        });

        // Sort by score (descending)
        scores[game].sort((a, b) => b.score - a.score);

        // Keep top 10
        scores[game] = scores[game].slice(0, 10);

        this.saveScores(scores);

        // Check if it's a new high score
        const rank = this.getRank(game, score);
        if (rank === 1) {
            this.celebrateHighScore();
        }

        return rank;
    },

    // Get rank for a score
    getRank(game, score) {
        const scores = this.getScores();
        if (!scores[game]) return 1;

        const rank = scores[game].findIndex(s => s.score <= score) + 1;
        return rank === 0 ? scores[game].length + 1 : rank;
    },

    // Get top scores for a game
    getTopScores(game, limit = 10) {
        const scores = this.getScores();
        return (scores[game] || []).slice(0, limit);
    },

    // Get player's best score
    getPersonalBest(game, playerName) {
        const scores = this.getScores();
        if (!scores[game]) return 0;

        const playerScores = scores[game].filter(s => s.name === playerName);
        return playerScores.length > 0 ? playerScores[0].score : 0;
    },

    // Celebrate new high score
    celebrateHighScore() {
        const celebration = document.createElement('div');
        celebration.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.8);
                z-index: 100000;
                animation: fadeIn 0.3s;
            ">
                <div style="
                    text-align: center;
                    color: white;
                    font-family: 'Fredoka', sans-serif;
                    animation: bounceIn 0.5s;
                ">
                    <div style="font-size: 8rem; animation: pulse 0.5s infinite;">🏆</div>
                    <h1 style="font-size: 3rem; color: #FFD700; text-shadow: 0 0 20px #FFD700;">NEW HIGH SCORE!</h1>
                    <p style="font-size: 1.5rem; opacity: 0.8;">You're #1 on the leaderboard!</p>
                </div>
            </div>
            <style>
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes bounceIn {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            </style>
        `;
        document.body.appendChild(celebration);

        // Play sound
        if (window.KDH_Sounds) {
            KDH_Sounds.playAchievement();
        }

        setTimeout(() => celebration.remove(), 3000);
    },

    // Create leaderboard HTML
    renderLeaderboard(game, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const scores = this.getTopScores(game);

        container.innerHTML = `
            <div style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 15px; color: #333; display: flex; align-items: center; gap: 10px;">
                    🏆 Leaderboard
                </h3>
                ${scores.length === 0 ? '<p style="color: #888; text-align: center;">No scores yet. Be the first!</p>' : ''}
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${scores.map((s, i) => `
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 15px;
                            padding: 12px 15px;
                            background: ${i === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' : i === 1 ? 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' : i === 2 ? 'linear-gradient(135deg, #CD7F32, #B87333)' : '#f5f5f5'};
                            border-radius: 12px;
                            color: ${i < 3 ? 'white' : '#333'};
                        ">
                            <span style="font-size: 1.5rem; font-weight: bold; width: 30px;">${i < 3 ? ['🥇', '🥈', '🥉'][i] : '#' + (i + 1)}</span>
                            <span style="flex: 1; font-weight: 600;">${s.name}</span>
                            <span style="font-weight: bold; font-size: 1.2rem;">${s.score.toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};

window.KDH_Leaderboard = KDH_Leaderboard;
