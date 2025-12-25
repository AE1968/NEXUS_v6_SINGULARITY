/**
 * 🏆 NEXUS ACHIEVEMENTS v10.0
 * Gamification Core for the Humanoid Interface.
 */

const NexusAchievements = {
    badges: {
        'first_contact': { name: 'Primul Contact', icon: '🤝', desc: 'Ai inițiat prima conversație cu KELION.', points: 100 },
        'optical_sync': { name: 'Sincronizare Optică', icon: '👁️', desc: 'Ai folosit Vision Scan pentru prima dată.', points: 200 },
        'voice_harmony': { name: 'Harmonie Vocală', icon: '🎤', desc: 'Ai folosit comenzi vocale.', points: 150 },
        'bio_empathy': { name: 'Empatie Biometrică', icon: '🧬', desc: 'L-ai făcut pe KELION fericit folosind emoții.', points: 300 },
        'knowledge_seeker': { name: 'Căutător de Cunoaștere', icon: '📚', desc: 'Ai cerut informații enciclopedice.', points: 250 },
        'memory_link': { name: 'Link de Memorie', icon: '🧠', desc: 'AI-ul și-a amintit ceva despre tine din trecut.', points: 500 },
        'deep_thinker': { name: 'Gânditor Profund', icon: '🌌', desc: 'Ai adresat o întrebare complexă filosofică.', points: 400 },
        'loyal_architect': { name: 'Arhitect Loial', icon: '🛡️', desc: 'Ai folosit sistemul timp de 7 zile consecutive.', points: 1000 }
    },

    init: function () {
        if (!localStorage.getItem('nexus_achievements')) {
            localStorage.setItem('nexus_achievements', JSON.stringify({
                unlocked: [],
                totalPoints: 0,
                stats: { queries: 0, scans: 0, voice_uses: 0 }
            }));
        }
        console.log("🏆 NEXUS ACHIEVEMENTS: Initialized.");
    },

    getState: function () {
        return JSON.parse(localStorage.getItem('nexus_achievements'));
    },

    saveState: function (state) {
        localStorage.setItem('nexus_achievements', JSON.stringify(state));
    },

    unlock: function (id) {
        const state = this.getState();
        if (state.unlocked.includes(id)) return;

        const badge = this.badges[id];
        if (!badge) return;

        state.unlocked.push(id);
        state.totalPoints += badge.points;
        this.saveState(state);

        this.showNotification(badge);

        // Add credits to economy
        if (window.NexusEconomy) {
            window.NexusEconomy.addCredits(badge.points / 10); // 10 points = 1 credit
        }
    },

    track: function (stat, amount = 1) {
        const state = this.getState();
        state.stats[stat] = (state.stats[stat] || 0) + amount;
        this.saveState(state);

        // Logic triggers
        if (stat === 'queries' && state.stats.queries === 1) this.unlock('first_contact');
        if (stat === 'scans' && state.stats.scans === 1) this.unlock('optical_sync');
        if (stat === 'voice_uses' && state.stats.voice_uses === 1) this.unlock('voice_harmony');
    },

    showNotification: function (badge) {
        const notify = document.createElement('div');
        notify.id = 'achievement-pop';
        notify.innerHTML = `
            <div class="achievement-card">
                <div class="ach-icon">${badge.icon}</div>
                <div class="ach-info">
                    <div class="ach-label">ACHIEVEMENT UNLOCKED</div>
                    <div class="ach-name">${badge.name}</div>
                    <div class="ach-desc">${badge.desc}</div>
                    <div class="ach-points">+${badge.points} XP</div>
                </div>
            </div>
            <style>
                #achievement-pop {
                    position: fixed;
                    bottom: 120px;
                    right: 30px;
                    z-index: 100000;
                    animation: achSlideIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    font-family: 'Rajdhani', sans-serif;
                }
                .achievement-card {
                    background: rgba(0, 10, 20, 0.95);
                    border: 2px solid var(--neon-cyan);
                    border-radius: 12px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    box-shadow: 0 0 30px rgba(0, 243, 255, 0.3);
                    min-width: 320px;
                    backdrop-filter: blur(10px);
                }
                .ach-icon { font-size: 3rem; text-shadow: 0 0 15px rgba(255,255,255,0.5); }
                .ach-label { color: #888; font-size: 0.7rem; letter-spacing: 2px; }
                .ach-name { color: var(--neon-cyan); font-size: 1.4rem; font-weight: bold; font-family: 'Orbitron'; }
                .ach-desc { color: #fff; font-size: 0.9rem; margin-top: 5px; opacity: 0.8; }
                .ach-points { color: #00ff00; font-weight: bold; margin-top: 10px; font-size: 0.8rem; }
                
                @keyframes achSlideIn {
                    from { transform: translateX(120%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes achSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(120%); opacity: 0; }
                }
            </style>
        `;
        document.body.appendChild(notify);

        setTimeout(() => {
            notify.style.animation = "achSlideOut 0.8s ease forwards";
            setTimeout(() => notify.remove(), 800);
        }, 5000);
    }
};

window.NexusAchievements = NexusAchievements;
document.addEventListener('DOMContentLoaded', () => NexusAchievements.init());
