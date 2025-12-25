/**
 * NEXUS BRIDGE - Acces permanent la sistemul Nexus
 * Include acest fișier în orice pagină pentru a avea acces la Nexus
 */

(function () {
    'use strict';

    // Check if Bridge already exists
    if (window.NexusBridge) return;

    // === NEXUS BRIDGE CORE ===
    window.NexusBridge = {
        version: '5.0.0',
        status: 'ONLINE',
        lastCheck: new Date().toISOString(),

        // === AUTHENTICATION ===
        auth: {
            isLoggedIn: function () {
                return localStorage.getItem('nexus_authenticated') === 'true';
            },
            getUser: function () {
                return {
                    name: localStorage.getItem('nexus_user'),
                    role: localStorage.getItem('nexus_role'),
                    username: localStorage.getItem('nexus_username'),
                    subscription: localStorage.getItem('nexus_subscription')
                };
            },
            isAdmin: function () {
                return localStorage.getItem('nexus_role') === 'admin';
            },
            hasAccess: function (feature) {
                const accessStr = localStorage.getItem('nexus_access');
                if (!accessStr) return false;
                const access = JSON.parse(accessStr);
                return access.includes('all') || access.includes(feature);
            },
            logout: function () {
                localStorage.removeItem('nexus_authenticated');
                localStorage.removeItem('nexus_user');
                localStorage.removeItem('nexus_role');
                localStorage.removeItem('nexus_username');
                localStorage.removeItem('nexus_access');
                localStorage.removeItem('nexus_subscription');
                location.reload();
            }
        },

        // === MEMORY SYSTEM ===
        memory: {
            save: function (key, value) {
                try {
                    localStorage.setItem('nexus_mem_' + key, JSON.stringify({
                        value: value,
                        timestamp: new Date().toISOString()
                    }));
                    return true;
                } catch (e) {
                    console.error('Nexus Memory Error:', e);
                    return false;
                }
            },
            load: function (key) {
                try {
                    const data = localStorage.getItem('nexus_mem_' + key);
                    if (!data) return null;
                    return JSON.parse(data).value;
                } catch (e) {
                    return null;
                }
            },
            getAll: function () {
                const memories = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith('nexus_mem_')) {
                        memories[key.replace('nexus_mem_', '')] = this.load(key.replace('nexus_mem_', ''));
                    }
                }
                return memories;
            },
            clear: function () {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith('nexus_mem_')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
            }
        },

        // === REPORTING SYSTEM ===
        report: {
            logs: [],
            log: function (type, message, data) {
                const entry = {
                    type: type,
                    message: message,
                    data: data || null,
                    timestamp: new Date().toISOString(),
                    page: window.location.pathname
                };
                this.logs.push(entry);
                console.log(`[NEXUS ${type.toUpperCase()}]`, message, data || '');

                // Store last 100 logs
                if (this.logs.length > 100) {
                    this.logs.shift();
                }

                // Persist to localStorage
                try {
                    localStorage.setItem('nexus_logs', JSON.stringify(this.logs.slice(-50)));
                } catch (e) {
                    // Storage full, clear old logs
                    this.logs = this.logs.slice(-25);
                }
            },
            info: function (msg, data) { this.log('info', msg, data); },
            warn: function (msg, data) { this.log('warn', msg, data); },
            error: function (msg, data) { this.log('error', msg, data); },
            success: function (msg, data) { this.log('success', msg, data); },
            getLogs: function () {
                return this.logs;
            },
            exportLogs: function () {
                const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nexus_report_${Date.now()}.json`;
                a.click();
            }
        },

        // === AUTO-TEST SYSTEM ===
        test: {
            results: [],
            run: function (name, testFn) {
                const start = performance.now();
                try {
                    const result = testFn();
                    const duration = performance.now() - start;
                    this.results.push({
                        name: name,
                        status: result ? 'PASS' : 'FAIL',
                        duration: duration.toFixed(2) + 'ms',
                        timestamp: new Date().toISOString()
                    });
                    NexusBridge.report.log(result ? 'success' : 'error', `Test "${name}": ${result ? 'PASS' : 'FAIL'}`);
                    return result;
                } catch (e) {
                    this.results.push({
                        name: name,
                        status: 'ERROR',
                        error: e.message,
                        timestamp: new Date().toISOString()
                    });
                    NexusBridge.report.error(`Test "${name}": ERROR - ${e.message}`);
                    return false;
                }
            },
            runAll: function () {
                this.results = [];

                // Core Tests
                this.run('LocalStorage Available', () => {
                    localStorage.setItem('test', 'test');
                    localStorage.removeItem('test');
                    return true;
                });

                this.run('Speech Synthesis', () => {
                    return 'speechSynthesis' in window;
                });

                this.run('Speech Recognition', () => {
                    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
                });

                this.run('Face API Library', () => {
                    return typeof faceapi !== 'undefined';
                });

                this.run('Camera API', () => {
                    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
                });

                this.run('Fetch API', () => {
                    return typeof fetch === 'function';
                });

                return this.results;
            },
            getResults: function () {
                return this.results;
            }
        },

        // === NOTIFICATION SYSTEM ===
        notify: function (message, type = 'info', duration = 3000) {
            const colors = {
                info: '#00f3ff',
                success: '#00ff41',
                warning: '#ffd700',
                error: '#ff4444'
            };

            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(10, 20, 30, 0.95);
                border: 1px solid ${colors[type] || colors.info};
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                font-family: 'Rajdhani', sans-serif;
                z-index: 99999;
                animation: slideIn 0.3s ease;
                box-shadow: 0 5px 20px rgba(0,0,0,0.5);
            `;
            notification.innerHTML = `<span style="color: ${colors[type]}">[NEXUS]</span> ${message}`;

            // Add animation keyframes if not exists
            if (!document.getElementById('nexus-animations')) {
                const style = document.createElement('style');
                style.id = 'nexus-animations';
                style.textContent = `
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }, duration);
        },

        // === QUICK COMMANDS ===
        cmd: {
            goto: function (page) {
                window.location.href = page;
            },
            nexusCore: function () {
                window.location.href = 'nexus_core.html';
            },
            story: function () {
                window.location.href = 'nexus_story.html';
            },
            home: function () {
                window.location.href = 'index.html';
            },
            subscriptions: function () {
                window.location.href = 'abonamente.html';
            }
        },

        // === INITIALIZATION ===
        init: function () {
            this.report.info('Nexus Bridge initialized', {
                version: this.version,
                page: window.location.pathname,
                user: this.auth.getUser()
            });

            // Load stored logs
            try {
                const storedLogs = localStorage.getItem('nexus_logs');
                if (storedLogs) {
                    this.report.logs = JSON.parse(storedLogs);
                }
            } catch (e) { }

            // Run auto-tests if admin
            if (this.auth.isAdmin()) {
                setTimeout(() => {
                    this.test.runAll();
                }, 1000);
            }

            console.log('%c🌉 NEXUS BRIDGE ONLINE', 'color: #00f3ff; font-size: 16px; font-weight: bold;');
            console.log('Use NexusBridge.help() for available commands');
        },

        // === HELP ===
        help: function () {
            console.log(`
🌉 NEXUS BRIDGE - Available Commands:

=== Authentication ===
NexusBridge.auth.isLoggedIn()    - Check login status
NexusBridge.auth.getUser()       - Get current user info
NexusBridge.auth.isAdmin()       - Check admin status
NexusBridge.auth.logout()        - Logout

=== Memory ===
NexusBridge.memory.save(k, v)    - Save to memory
NexusBridge.memory.load(k)       - Load from memory
NexusBridge.memory.getAll()      - Get all memories
NexusBridge.memory.clear()       - Clear all memories

=== Reporting ===
NexusBridge.report.info(msg)     - Log info
NexusBridge.report.success(msg)  - Log success
NexusBridge.report.warn(msg)     - Log warning
NexusBridge.report.error(msg)    - Log error
NexusBridge.report.getLogs()     - Get all logs
NexusBridge.report.exportLogs()  - Download logs

=== Testing ===
NexusBridge.test.runAll()        - Run all tests
NexusBridge.test.getResults()    - Get test results

=== Navigation ===
NexusBridge.cmd.nexusCore()      - Go to Nexus Core
NexusBridge.cmd.story()          - Go to Story
NexusBridge.cmd.home()           - Go to Home
NexusBridge.cmd.subscriptions()  - Go to Subscriptions

=== Notifications ===
NexusBridge.notify(msg, type)    - Show notification
            `);
        }
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => NexusBridge.init());
    } else {
        NexusBridge.init();
    }
})();
