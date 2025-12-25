/**
 * 🖥️ NEXUS MAINFRAME CONSOLE v10.0
 * The Central Command Interface for System Administrators.
 */

const NexusMainframe = {
    isActive: false,
    logs: [],

    init: function () {
        console.log("🖥️ MAINFRAME: System Core Ready.");
        this.render();
        this.startHeartbeat();
    },

    render: function () {
        const container = document.createElement('div');
        container.id = 'nexus-mainframe-modal';
        container.innerHTML = `
            <div class="mainframe-box">
                <div class="mainframe-header">
                    <div class="mainframe-title">NEXUS_MAINFRAME // ROOT_ACCESS</div>
                    <button class="mainframe-close" onclick="NexusMainframe.close()">TERMINATE_SESSION</button>
                </div>
                
                <div class="mainframe-layout">
                    <!-- SYSTEM STATS SIDEBAR -->
                    <div class="mainframe-sidebar">
                        <div class="stat-group">
                            <label>COGNITIVE_LOAD</label>
                            <div class="stat-val" id="mf-load">0.0%</div>
                        </div>
                        <div class="stat-group">
                            <label>MEMORY_VECTORS</label>
                            <div class="stat-val" id="mf-memory">0</div>
                        </div>
                        <div class="stat-group">
                            <label>CREDITS_CIRCULATION</label>
                            <div class="stat-val" id="mf-credits">0 NC</div>
                        </div>
                        <div class="stat-group">
                            <label>SYNAPTIC_HEALTH</label>
                            <div class="stat-val" id="mf-health">100%</div>
                        </div>
                        <div class="stat-group">
                            <label>ENVIRONMENT_TEMP</label>
                            <div class="stat-val" id="mf-temp">22°C</div>
                        </div>
                    </div>

                    <!-- TERMINAL OUTPUT -->
                    <div class="mainframe-terminal">
                        <div id="mf-terminal-out" class="terminal-content"></div>
                        <div class="terminal-input-row">
                            <span class="prompt">ARCHITECT@NEXUS:~$</span>
                            <input type="text" id="mf-cmd-input" placeholder="Enter command..." autocomplete="off">
                        </div>
                    </div>
                </div>
            </div>

            <style>
                #nexus-mainframe-modal {
                    display: none;
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 10000;
                    justify-content: center; align-items: center;
                    backdrop-filter: blur(20px);
                    font-family: 'Consolas', 'Courier New', monospace;
                }
                #nexus-mainframe-modal.active { display: flex; }
                
                .mainframe-box {
                    width: 90%; max-width: 1100px;
                    height: 80vh;
                    background: #000;
                    border: 1px solid #00ff41;
                    box-shadow: 0 0 40px rgba(0, 255, 65, 0.2);
                    display: flex; flex-direction: column;
                    color: #00ff41;
                }
                
                .mainframe-header {
                    padding: 20px;
                    border-bottom: 1px solid #00ff41;
                    display: flex; justify-content: space-between;
                    background: rgba(0, 255, 65, 0.1);
                }
                .mainframe-title { font-weight: bold; letter-spacing: 2px; }
                .mainframe-close { 
                    background: transparent; border: 1px solid #00ff41; color: #00ff41;
                    padding: 5px 15px; cursor: pointer; transition: 0.3s;
                }
                .mainframe-close:hover { background: #00ff41; color: #000; }

                .mainframe-layout { display: flex; flex: 1; overflow: hidden; }
                
                .mainframe-sidebar {
                    width: 250px;
                    border-right: 1px solid #00ff41;
                    padding: 20px;
                    display: flex; flex-direction: column; gap: 25px;
                    background: rgba(0, 0, 0, 0.5);
                }
                .stat-group label { font-size: 0.7rem; opacity: 0.6; display: block; margin-bottom: 5px; }
                .stat-val { font-size: 1.2rem; font-weight: bold; color: #fff; text-shadow: 0 0 10px #00ff41; }

                .mainframe-terminal { flex: 1; display: flex; flex-direction: column; padding: 20px; }
                .terminal-content { 
                    flex: 1; overflow-y: auto; 
                    font-size: 0.9rem; line-height: 1.5;
                    padding-bottom: 20px;
                }
                .terminal-line { margin-bottom: 5px; }
                .terminal-line.info { color: #00ff41; }
                .terminal-line.warn { color: #ffcc00; }
                .terminal-line.cmd { color: #fff; }

                .terminal-input-row { display: flex; gap: 10px; align-items: center; border-top: 1px solid #333; padding-top: 15px; }
                .prompt { font-weight: bold; }
                #mf-cmd-input {
                    flex: 1; background: transparent; border: none; color: #fff; outline: none;
                    font-family: inherit; font-size: 1rem;
                }
            </style>
        `;
        document.body.appendChild(container);

        // Input handler
        const input = document.getElementById('mf-cmd-input');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand(input.value);
                input.value = '';
            }
        });
    },

    open: function () {
        document.getElementById('nexus-mainframe-modal').classList.add('active');
        this.log("SYSTEM_INITIALIZED: Kernel v10.0.1 successfully loaded.");
        this.log("AUTH_SUCCESS: Architect level permissions granted.");
        this.isActive = true;
    },

    close: function () {
        document.getElementById('nexus-mainframe-modal').classList.remove('active');
        this.isActive = false;
    },

    log: function (msg, type = 'info') {
        const out = document.getElementById('mf-terminal-out');
        if (!out) return;

        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        out.appendChild(line);
        out.scrollTop = out.scrollHeight;
    },

    executeCommand: function (cmd) {
        this.log(`ARCHITECT@NEXUS:~$ ${cmd}`, 'cmd');
        const c = cmd.toLowerCase().trim();

        if (c === 'help') {
            this.log("AVAILABLE COMMANDS: clear, status, reboot, economy --fix, memory --wipe, exit");
        } else if (c === 'clear') {
            document.getElementById('mf-terminal-out').innerHTML = '';
        } else if (c === 'status') {
            this.log("--- SYSTEM STATUS REPORT ---");
            this.log(`Bio-Matrix: ${window.NexusBioMatrix ? 'ACTIVE' : 'OFFLINE'}`);
            this.log(`Cortex Link: ${window.NexusCortex ? 'SYNCED' : 'ERR'}`);
            this.log(`Economy Integrity: 100%`);
        } else if (c === 'reboot') {
            this.log("INITIATING SYSTEM REBOOT...", 'warn');
            setTimeout(() => location.reload(), 2000);
        } else if (c === 'exit') {
            this.close();
        } else {
            this.log(`COMMAND_NOT_FOUND: ${cmd}`, 'warn');
        }
    },

    startHeartbeat: function () {
        setInterval(() => {
            if (!this.isActive) return;

            // Sync UI stats
            if (window.NexusBioMatrix) {
                const dopamine = (window.NexusBioMatrix.chemistry.dopamine * 100).toFixed(1);
                document.getElementById('mf-load').textContent = `${dopamine}%`;

                const serotonin = (window.NexusBioMatrix.chemistry.serotonin * 100).toFixed(0);
                document.getElementById('mf-health').textContent = `${serotonin}%`;
            }

            if (window.NexusMemoryVector) {
                document.getElementById('mf-memory').textContent = window.NexusMemoryVector.facts.length;
            }

            if (window.NexusEconomy) {
                document.getElementById('mf-credits').textContent = `${window.NexusEconomy.getCredits()} NC`;
            }

            if (window.NexusSensory) {
                document.getElementById('mf-temp').textContent = `${window.NexusSensory.sensors.temperature.toFixed(1)}°C`;
            }

            // Periodic logs
            if (Math.random() > 0.9) {
                this.log("HEARTBEAT_SYNC: All neural layers responding within nominal range.");
            }
        }, 3000);
    }
};

window.NexusMainframe = NexusMainframe;
document.addEventListener('DOMContentLoaded', () => NexusMainframe.init());
