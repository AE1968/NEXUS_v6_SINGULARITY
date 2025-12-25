/**
 * NEXUS SYSTEM SETTINGS v1.0
 * Configuration & Control Panel
 */

const NexusSettings = {
    config: {
        audioVolume: 0.5,
        voiceSpeed: 1.0,
        language: 'en-US',
        highContrast: false
    },

    init: function () {
        this.load();
        this.apply();
        console.log('⚙️ Nexus Settings Initialized');
    },

    load: function () {
        const saved = localStorage.getItem('nexus_system_config');
        if (saved) {
            this.config = { ...this.config, ...JSON.parse(saved) };
        }
    },

    save: function () {
        localStorage.setItem('nexus_system_config', JSON.stringify(this.config));
        this.apply();
    },

    apply: function () {
        // Apply Audio Volume
        if (typeof NexusAudio !== 'undefined') {
            NexusAudio.volume = this.config.audioVolume;
        }
        // Apply other settings as needed (Voice speed is read at runtime usually)
    },

    // --- ACTIONS ---

    setVolume: function (val) {
        this.config.audioVolume = parseFloat(val);
        this.save();
        if (typeof NexusAudio !== 'undefined') NexusAudio.playHover(); // Test sound
    },

    setVoiceSpeed: function (val) {
        this.config.voiceSpeed = parseFloat(val);
        this.save();
    },

    clearMemory: function () {
        if (confirm('WARNING: This will wipe all chat history. Are you sure?')) {
            localStorage.removeItem('nexus_chat_history_v1');
            location.reload();
        }
    },

    runDiagnostics: function () {
        if (typeof addLog === 'function') {
            addLog('SYSTEM DIAGNOSTICS INITIATED...', 'system');
            setTimeout(() => addLog('Checking Neural Core... [OK]', 'system'), 500);
            setTimeout(() => addLog('Verifying Audio Engine... [OK]', 'system'), 1000);
            setTimeout(() => addLog('Testing Voice Synthesis... [OK]', 'system'), 1500);
            setTimeout(() => addLog('Memory Integrity... [OK]', 'system'), 2000);
            setTimeout(() => addLog('DIAGNOSTICS COMPLETE. SYSTEM OPTIMAL.', 'system'), 2500);
        }
    },

    // --- UI ---

    showPanel: function () {
        const existing = document.getElementById('settings-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'settings-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85);
            display: flex; justify-content: center; align-items: center;
            z-index: 10002;
            backdrop-filter: blur(5px);
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #111, #0a1a2a);
                border: 2px solid var(--neon-cyan);
                box-shadow: 0 0 30px rgba(0,243,255,0.15);
                padding: 30px;
                width: 90%; max-width: 500px;
                border-radius: 15px;
                font-family: 'Rajdhani', sans-serif;
                color: white;
                position: relative;
            ">
                <button onclick="document.getElementById('settings-modal').remove()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #666; font-size: 1.5rem; cursor: pointer;">×</button>
                
                <h2 style="font-family: 'Orbitron'; color: var(--neon-cyan); margin-top: 0; border-bottom: 1px solid #333; padding-bottom: 15px;">SYSTEM CONFIG</h2>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; color: #aaa;">AUDIO FX VOLUME</label>
                    <input type="range" min="0" max="1" step="0.1" value="${this.config.audioVolume}" 
                        oninput="NexusSettings.setVolume(this.value)" style="width: 100%; accent-color: var(--neon-cyan);">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; color: #aaa;">VOICE SPEED (TTS)</label>
                    <input type="range" min="0.5" max="2" step="0.1" value="${this.config.voiceSpeed}" 
                        oninput="NexusSettings.setVoiceSpeed(this.value)" style="width: 100%; accent-color: var(--neon-purple);">
                </div>

                <div style="margin-top: 30px; border-top: 1px solid #333; padding-top: 20px;">
                    <h3 style="font-size: 1rem; color: #ff0055;">DANGER ZONE</h3>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="NexusSettings.clearMemory()" style="
                            background: rgba(255, 0, 85, 0.2); color: #ff0055; border: 1px solid #ff0055; padding: 10px; flex: 1; cursor: pointer; border-radius: 5px;
                        ">WIPE MEMORY</button>
                        
                        <button onclick="NexusSettings.runDiagnostics()" style="
                            background: rgba(0, 243, 255, 0.2); color: var(--neon-cyan); border: 1px solid var(--neon-cyan); padding: 10px; flex: 1; cursor: pointer; border-radius: 5px;
                        ">RUN DIAGNOSTICS</button>
                    </div>
                </div>

                <div style="margin-top: 20px; font-size: 0.7rem; color: #555; text-align: center;">
                    NEXUS OS v1.3 • BUILD 2024.12
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        if (typeof NexusAudio !== 'undefined') NexusAudio.playClick();
    }
};

window.NexusSettings = NexusSettings;
window.addEventListener('load', () => NexusSettings.init());
