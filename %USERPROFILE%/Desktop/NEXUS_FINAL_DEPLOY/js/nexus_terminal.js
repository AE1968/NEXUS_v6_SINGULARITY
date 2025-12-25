/**
 * 📟 NEXUS LIVE TERMINAL
 * Interfață vizuală pentru monitorizarea proceselor interne în timp real.
 * Afișează log-urile de sistem, diagnozele Doctorului și reparațiile Self-Healing.
 */

const NexusTerminal = {
    active: false,
    domElement: null,
    logHistory: [],
    maxLines: 50,

    init: function () {
        console.log('📟 Nexus Terminal UI: LOADED');
        this.createTerminalDOM();
        this.hookSystemLogs();
    },

    createTerminalDOM: function () {
        // Creare container terminal (ascuns initial)
        const term = document.createElement('div');
        term.id = 'nexus-terminal-layer';
        term.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(10, 10, 15, 0.95);
            z-index: 9999;
            color: #0f0;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            padding: 20px;
            box-sizing: border-box;
            overflow-y: auto;
            display: none;
            backdrop-filter: blur(5px);
            border: 2px solid #0f0;
            box-shadow: inset 0 0 20px #0f0;
        `;

        // Create Header
        const header = document.createElement('div');
        header.innerHTML = `
            <div style="border-bottom: 1px solid #0f0; padding-bottom: 10px; margin-bottom: 10px; display: flex; justify-content: space-between;">
                <span>> NEXUS_CORE_SYSTEM_LOGS // AUTH_LEVEL: OMEGA</span>
                <span id="term-clock">--:--:--</span>
                <button onclick="NexusTerminal.toggle()" style="background:none; border:1px solid #0f0; color:#0f0; cursor:pointer;">[ X ] CLOSE</button>
            </div>
        `;
        term.appendChild(header);

        // Content Area
        const content = document.createElement('div');
        content.id = 'nexus-terminal-content';
        term.appendChild(content);

        document.body.appendChild(term);
        this.domElement = term;
        this.contentElement = content;

        // Update ceas
        setInterval(() => {
            const now = new Date();
            document.getElementById('term-clock').innerText = now.toISOString().split('T')[1].split('.')[0];
        }, 1000);
    },

    hookSystemLogs: function () {
        // Interceptăm funcția globală addLog existentă
        const originalAddLog = window.addLog;

        window.addLog = (msg, type) => {
            // Apelăm originalul pentru chat-ul normal
            if (originalAddLog) originalAddLog(msg, type);

            // Adăugăm și în terminalul nostru, dar filtrăm mesajele de chat simple ale utilizatorului
            // Vrem doar mesaje de sistem, erori, sau răspunsuri AI tehnice
            if (type === 'system' || type === 'error' || type === 'warning' || msg.includes('Nexus')) {
                this.printLine(msg, type);
            }
        };

        // Capturăm și output-ul Doctorului și Self-Repair direct dacă folosesc console.log cu prefixe specifice
        const originalConsoleLog = console.log;
        console.log = function (...args) {
            originalConsoleLog.apply(console, args);
            // Convertim args la string
            const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');

            if (text.includes('👨‍⚕️') || text.includes('🛡️') || text.includes('⚠️') || text.includes('Link')) {
                NexusTerminal.printLine(text, 'console');
            }
        };
    },

    printLine: function (text, type) {
        const line = document.createElement('div');
        const timestamp = new Date().toLocaleTimeString();

        let color = '#0f0'; // Default Green
        if (type === 'error') color = '#f00'; // Red
        if (type === 'warning') color = '#fa0'; // Orange
        if (type === 'console') color = '#0ff'; // Cyan

        line.style.color = color;
        line.style.marginBottom = '4px';
        line.style.borderBottom = '1px dotted rgba(0,255,0,0.2)';

        // Efect de tastare rapidă sau afișare directă
        line.innerHTML = `<span style="opacity:0.6">[${timestamp}]</span> ${text}`;

        this.contentElement.appendChild(line);
        this.logHistory.push({ text, type, timestamp });

        // Auto-scroll
        this.domElement.scrollTop = this.domElement.scrollHeight;

        // Cleanup old lines
        if (this.contentElement.childElementCount > this.maxLines) {
            this.contentElement.removeChild(this.contentElement.firstChild);
        }
    },

    toggle: function () {
        this.active = !this.active;
        this.domElement.style.display = this.active ? 'block' : 'none';

        if (this.active) {
            this.printLine("SESSION RESTORED. VISUAL INTERFACE ONLINE.", "system");
            if (window.NexusAudio) window.NexusAudio.playSuccess();
        } else {
            if (window.NexusAudio) window.NexusAudio.playSuccess(); // Sau un sunet de 'close'
        }
    }
};

window.NexusTerminal = NexusTerminal;
window.addEventListener('load', () => NexusTerminal.init());
