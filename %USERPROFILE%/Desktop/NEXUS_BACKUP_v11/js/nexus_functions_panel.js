/**
 * 📋 NEXUS ON-SCREEN FUNCTIONS PANEL v7.0
 * Display basic functions directly on screen
 */

const NexusFunctionsPanel = {

    isVisible: false,

    /**
     * Toggle functions panel visibility
     */
    toggle() {
        this.isVisible = !this.isVisible;
        const panel = document.getElementById('functions-panel');
        if (panel) {
            panel.style.display = this.isVisible ? 'block' : 'none';
        }
    },

    /**
     * Create and inject functions panel into DOM
     */
    create() {
        const panel = document.createElement('div');
        panel.id = 'functions-panel';
        panel.className = 'functions-panel';

        panel.innerHTML = `
            <div class="functions-header">
                <h3>⚡ FUNCȚII DE BAZĂ</h3>
                <button onclick="NexusFunctionsPanel.toggle()">✕</button>
            </div>
            
            <div class="functions-body">
                <!-- AI Brain -->
                <div class="function-group">
                    <h4>🧠 Inteligență AI</h4>
                    <div class="function-item">
                        <span class="icon">💬</span>
                        <span class="label">Chat AI</span>
                        <span class="status active">ACTIV</span>
                    </div>
                    <div class="function-item">
                        <span class="icon">🧬</span>
                        <span class="label">Deep Thinking (Claude)</span>
                        <span class="status pending">API KEY</span>
                    </div>
                </div>
                
                <!-- Learning -->
                <div class="function-group">
                    <h4>📚 Învățare</h4>
                    <div class="function-item">
                        <span class="icon">📝</span>
                        <span class="label">Memory Storage</span>
                        <span class="status active">ACTIV</span>
                    </div>
                    <div class="function-item">
                        <span class="icon">🔄</span>
                        <span class="label">Auto-Learn</span>
                        <span class="status active">ACTIV</span>
                    </div>
                </div>
                
                <!-- Senses -->
                <div class="function-group">
                    <h4>👁️ Simțuri</h4>
                    <div class="function-item">
                        <span class="icon">📷</span>
                        <span class="label">Vision (Webcam)</span>
                        <span class="status inactive">OFFLINE</span>
                    </div>
                    <div class="function-item">
                        <span class="icon">🎤</span>
                        <span class="label">Voice (TTS)</span>
                        <span class="status active">ACTIV</span>
                    </div>
                </div>
                
                <!-- Systems -->
                <div class="function-group">
                    <h4>⚙️ Sisteme</h4>
                    <div class="function-item">
                        <span class="icon">🤖</span>
                        <span class="label">Agenți Autonomi</span>
                        <span class="status active">3 ACTIVI</span>
                    </div>
                    <div class="function-item">
                        <span class="icon">🧬</span>
                        <span class="label">BioMatrix</span>
                        <span class="status active">HEALTHY</span>
                    </div>
                    <div class="function-item">
                        <span class="icon">🏠</span>
                        <span class="label">IoT Control</span>
                        <span class="status active">READY</span>
                    </div>
                </div>
                
                <!-- Quick Commands -->
                <div class="function-group">
                    <h4>⚡ Comenzi Rapide</h4>
                    <button class="quick-cmd" onclick="NexusFunctionsPanel.runCommand('status')">
                        📊 Status
                    </button>
                    <button class="quick-cmd" onclick="NexusFunctionsPanel.runCommand('vision on')">
                        👁️ Activează Vedere
                    </button>
                    <button class="quick-cmd" onclick="NexusFunctionsPanel.runCommand('learn: ')">
                        📝 Învață Ceva
                    </button>
                    <button class="quick-cmd" onclick="NexusFunctionsPanel.runCommand('nexus:think ')">
                        🧠 Deep Thinking
                    </button>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .functions-panel {
                position: fixed;
                top: 80px;
                right: 20px;
                width: 320px;
                max-height: calc(100vh - 100px);
                background: linear-gradient(135deg, rgba(10,20,40,0.95), rgba(20,10,40,0.95));
                border: 2px solid rgba(0,243,255,0.5);
                border-radius: 15px;
                padding: 0;
                z-index: 999;
                overflow-y: auto;
                box-shadow: 0 0 30px rgba(0,243,255,0.3);
                display: none;
            }
            
            .functions-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: rgba(0,243,255,0.1);
                border-bottom: 1px solid rgba(0,243,255,0.3);
                position: sticky;
                top: 0;
                z-index: 10;
            }
            
            .functions-header h3 {
                margin: 0;
                color: #00f3ff;
                font-size: 16px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .functions-header button {
                background: none;
                border: none;
                color: #ff00de;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s;
            }
            
            .functions-header button:hover {
                transform: rotate(90deg);
            }
            
            .functions-body {
                padding: 15px;
            }
            
            .function-group {
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid rgba(0,243,255,0.2);
            }
            
            .function-group:last-child {
                border-bottom: none;
            }
            
            .function-group h4 {
                margin: 0 0 10px 0;
                color: #ff00de;
                font-size: 14px;
                text-transform: uppercase;
            }
            
            .function-item {
                display: flex;
                align-items: center;
                padding: 8px;
                margin-bottom: 5px;
                background: rgba(0,0,0,0.3);
                border-radius: 8px;
                font-size: 13px;
            }
            
            .function-item .icon {
                font-size: 18px;
                margin-right: 10px;
                min-width: 25px;
            }
            
            .function-item .label {
                flex: 1;
                color: #afeeee;
            }
            
            .function-item .status {
                padding: 3px 10px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .function-item .status.active {
                background: rgba(0,255,0,0.2);
                color: #00ff00;
                border: 1px solid #00ff00;
            }
            
            .function-item .status.inactive {
                background: rgba(128,128,128,0.2);
                color: #999;
                border: 1px solid #999;
            }
            
            .function-item .status.pending {
                background: rgba(255,200,0,0.2);
                color: #ffc800;
                border: 1px solid #ffc800;
            }
            
            .quick-cmd {
                width: 100%;
                margin: 5px 0;
                padding: 10px;
                background: linear-gradient(135deg, rgba(0,243,255,0.2), rgba(255,0,222,0.2));
                border: 1px solid rgba(0,243,255,0.4);
                border-radius: 8px;
                color: #fff;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.3s;
                text-align: left;
            }
            
            .quick-cmd:hover {
                background: linear-gradient(135deg, rgba(0,243,255,0.4), rgba(255,0,222,0.4));
                transform: translateX(5px);
                box-shadow: 0 0 15px rgba(0,243,255,0.5);
            }
            
            /* Toggle Button */
            .functions-toggle {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #00f3ff, #ff00de);
                border: none;
                padding: 12px 20px;
                border-radius: 25px;
                color: #000;
                font-weight: bold;
                cursor: pointer;
                font-size: 14px;
                z-index: 1000;
                box-shadow: 0 0 20px rgba(0,243,255,0.5);
                transition: all 0.3s;
            }
            
            .functions-toggle:hover {
                transform: scale(1.05);
                box-shadow: 0 0 30px rgba(0,243,255,0.8);
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(panel);

        // Update status dinamically
        this.updateStatus();
    },

    /**
     * Update module status in real-time
     */
    updateStatus() {
        // This will be called periodically to refresh status
        setInterval(() => {
            const panel = document.getElementById('functions-panel');
            if (!panel || !this.isVisible) return;

            // Update Vision status
            const visionStatus = panel.querySelector('.function-item:nth-child(1) .status');
            if (window.NexusVision && window.NexusVision.isSeeing) {
                if (visionStatus) {
                    visionStatus.className = 'status active';
                    visionStatus.textContent = 'ACTIV';
                }
            }

            // Update Claude status (check if configured)
            const claudeStatus = panel.querySelectorAll('.function-item')[1]?.querySelector('.status');
            // This would need to check actual Claude availability

        }, 2000);
    },

    /**
     * Execute quick command
     */
    runCommand(cmd) {
        const input = document.getElementById('neuralMsg');
        if (input) {
            input.value = cmd;
            input.focus();
            // Optionally auto-send
            if (!cmd.endsWith(' ')) {
                const sendBtn = document.getElementById('sendBtn');
                if (sendBtn) sendBtn.click();
            }
        }
    },

    /**
     * Initialize
     */
    init() {
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'functions-toggle';
        toggleBtn.textContent = '📋 FUNCȚII';
        toggleBtn.onclick = () => this.toggle();
        document.body.appendChild(toggleBtn);

        // Create panel
        this.create();

        // Auto-show on first load
        setTimeout(() => {
            this.toggle(); // Show by default
        }, 2000);

        console.log('✅ Functions Panel initialized');
    }
};

// Auto-initialize
window.addEventListener('load', () => {
    setTimeout(() => NexusFunctionsPanel.init(), 1000);
});

window.NexusFunctionsPanel = NexusFunctionsPanel;
