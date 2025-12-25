// Kids Digital Hub - Theme System
// Multiple colorful themes for personalization

const KDH_Themes = {
    themes: {
        default: {
            name: 'Rainbow',
            icon: '🌈',
            colors: {
                primary: '#667eea',
                secondary: '#764ba2',
                accent: '#f5576c',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                card: '#ffffff',
                text: '#333333'
            }
        },
        ocean: {
            name: 'Ocean',
            icon: '🌊',
            colors: {
                primary: '#0077b6',
                secondary: '#00b4d8',
                accent: '#90e0ef',
                background: 'linear-gradient(135deg, #0077b6 0%, #00b4d8 100%)',
                card: '#ffffff',
                text: '#333333'
            }
        },
        forest: {
            name: 'Forest',
            icon: '🌲',
            colors: {
                primary: '#2d6a4f',
                secondary: '#40916c',
                accent: '#95d5b2',
                background: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)',
                card: '#ffffff',
                text: '#333333'
            }
        },
        sunset: {
            name: 'Sunset',
            icon: '🌅',
            colors: {
                primary: '#f94144',
                secondary: '#f8961e',
                accent: '#f9c74f',
                background: 'linear-gradient(135deg, #f94144 0%, #f8961e 100%)',
                card: '#ffffff',
                text: '#333333'
            }
        },
        candy: {
            name: 'Candy',
            icon: '🍬',
            colors: {
                primary: '#ff6b9d',
                secondary: '#c44569',
                accent: '#ffc8dd',
                background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)',
                card: '#ffffff',
                text: '#333333'
            }
        },
        space: {
            name: 'Space',
            icon: '🚀',
            colors: {
                primary: '#240046',
                secondary: '#5a189a',
                accent: '#9d4edd',
                background: 'linear-gradient(135deg, #240046 0%, #5a189a 100%)',
                card: '#1a1a2e',
                text: '#ffffff'
            }
        },
        dark: {
            name: 'Dark Mode',
            icon: '🌙',
            colors: {
                primary: '#1a1a2e',
                secondary: '#16213e',
                accent: '#0f3460',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                card: '#0f0f1a',
                text: '#ffffff'
            }
        }
    },

    // Get current theme
    getCurrent() {
        return localStorage.getItem('kdh_theme') || 'default';
    },

    // Set theme
    set(themeId) {
        if (!this.themes[themeId]) return;

        localStorage.setItem('kdh_theme', themeId);
        this.apply(themeId);

        if (window.KDH_Sounds) {
            KDH_Sounds.playClick();
        }
    },

    // Apply theme to page
    apply(themeId) {
        const theme = this.themes[themeId || this.getCurrent()];
        if (!theme) return;

        const root = document.documentElement;
        root.style.setProperty('--theme-primary', theme.colors.primary);
        root.style.setProperty('--theme-secondary', theme.colors.secondary);
        root.style.setProperty('--theme-accent', theme.colors.accent);
        root.style.setProperty('--theme-card', theme.colors.card);
        root.style.setProperty('--theme-text', theme.colors.text);

        // Apply to body
        document.body.style.background = theme.colors.background;
        document.body.style.color = theme.colors.text;
    },

    // Create theme picker UI
    renderPicker(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const current = this.getCurrent();

        container.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
                ${Object.entries(this.themes).map(([id, theme]) => `
                    <button onclick="KDH_Themes.set('${id}')" style="
                        padding: 15px 20px;
                        border: 3px solid ${id === current ? '#333' : 'transparent'};
                        border-radius: 15px;
                        background: ${theme.colors.background};
                        color: white;
                        cursor: pointer;
                        font-family: 'Fredoka', sans-serif;
                        font-size: 1rem;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: transform 0.2s;
                    ">
                        <span style="font-size: 1.5rem;">${theme.icon}</span>
                        ${theme.name}
                    </button>
                `).join('')}
            </div>
        `;
    },

    // Initialize
    init() {
        this.apply();
    }
};

// Apply on load
document.addEventListener('DOMContentLoaded', () => {
    KDH_Themes.init();
});

window.KDH_Themes = KDH_Themes;
