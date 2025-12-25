/**
 * 🎮 NEXUS GAME SYSTEM
 * Gestionare jocuri, multiplayer, matchmaking și voice chat
 * Version: 1.0.0
 */

(function () {
    'use strict';

    if (window.NexusGameSystem) return;

    window.NexusGameSystem = {
        playerId: null,
        activeGame: null,
        isVoiceActive: false,

        // === INIȚIALIZARE ===
        init: function () {
            this.playerId = this.generateUniqueId();
            console.log(`[GAME] Init Player ID: ${this.playerId}`);
            this.restoreSession();
        },

        // === GENERARE ID UNIC (UUID v4) ===
        generateUniqueId: function () {
            let storedId = localStorage.getItem('nexus_player_id');
            if (!storedId) {
                storedId = 'P-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                }).toUpperCase();
                localStorage.setItem('nexus_player_id', storedId);
            }
            return storedId;
        },

        restoreSession: function () {
            // Reface starea dacă e necesar
        },

        // === START GAME LOGIC ===
        startGame: function (gameType) {
            const age = this.getUserAge();
            const minAgeForMultiplayer = 14;
            const canPlayMultiplayer = age >= minAgeForMultiplayer;

            console.log(`[GAME] Request: ${gameType}, Age: ${age}, Multi: ${canPlayMultiplayer}`);

            // Determină modul de joc
            if (canPlayMultiplayer) {
                // Întreabă utilizatorul (Simulat prin logică sau prompt)
                this.showGameModeSelection(gameType);
            } else {
                this.launchSinglePlayer(gameType);
            }
        },

        // === SELECTIE MOD JOC ===
        showGameModeSelection: function (gameType) {
            // În interfața reală ar fi un modal elegant. Aici folosim un wrapper peste alert/confirm sau logica Nexus.
            // Pentru simplificare, integrăm direct în fluxul Nexus Core.

            // Simulare UI Modal
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.9); z-index: 10000;
                display: flex; justify-content: center; align-items: center;
                font-family: 'Orbitron', sans-serif;
            `;

            modal.innerHTML = `
                <div style="background: linear-gradient(135deg, #1a0a2e, #0a2a0a); pading: 30px; border: 2px solid #00f3ff; border-radius: 20px; text-align: center; width: 90%; max-width: 400px;">
                    <h2 style="color: #00f3ff; margin-bottom: 20px;">🎮 ${gameType.toUpperCase()}</h2>
                    <p style="color: white; margin-bottom: 30px;">ID Tău: <span style="color: #ffd700;">${this.playerId}</span></p>
                    
                    <button id="btnSingle" style="width: 100%; padding: 15px; margin-bottom: 15px; background: rgba(0,243,255,0.2); border: 1px solid #00f3ff; color: white; cursor: pointer; border-radius: 10px;">
                        👤 SINGLE PLAYER
                    </button>
                    
                    <button id="btnMulti" style="width: 100%; padding: 15px; background: linear-gradient(90deg, #bc13fe, #00f3ff); border: none; color: black; font-weight: bold; cursor: pointer; border-radius: 10px;">
                        👥 MULTIPLAYER (Online)
                    </button>
                    
                    <button id="btnCancel" style="margin-top: 20px; background: none; border: none; color: #ff4444; cursor: pointer;">Anulează</button>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('btnSingle').onclick = () => {
                modal.remove();
                this.launchSinglePlayer(gameType);
            };

            document.getElementById('btnMulti').onclick = () => {
                modal.remove();
                this.launchMultiplayer(gameType);
            };

            document.getElementById('btnCancel').onclick = () => {
                modal.remove();
            };
        },

        // === SINGLE PLAYER ===
        launchSinglePlayer: function (gameType) {
            this.showGameInterface(gameType, 'single');
        },

        // === MULTIPLAYER & MATCHMAKING ===
        launchMultiplayer: function (gameType) {
            // Etape conectare
            this.showMatchmakingUI(gameType);

            // 1. Simulare Căutare
            setTimeout(() => {
                this.updateMatchmakingStatus('🔍 Caut oponenți în rețeaua globală...');
            }, 1000);

            // 2. Simulare Conectare
            setTimeout(() => {
                const opponentId = 'P-' + Math.floor(Math.random() * 1000000).toString(16).toUpperCase();
                this.updateMatchmakingStatus(`✅ Oponent găsit: ${opponentId}`);

                // 3. Activare Voice
                setTimeout(() => {
                    this.updateMatchmakingStatus(`🎙️ Conectare sistem voce securizat...`);
                    this.enableVoiceChat();

                    // 4. Start Joc
                    setTimeout(() => {
                        this.hideMatchmakingUI();
                        this.showGameInterface(gameType, 'multi', opponentId);
                    }, 1500);

                }, 1500);

            }, 3000);
        },

        // === UI HELPERS ===
        showMatchmakingUI: function (gameType) {
            const loader = document.createElement('div');
            loader.id = 'nexusMatchmaking';
            loader.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.95); z-index: 10001;
                display: flex; flex-direction: column; justify-content: center; align-items: center;
                font-family: 'Rajdhani', sans-serif;
            `;
            loader.innerHTML = `
                <div style="font-size: 3rem; animation: pulse 1s infinite;">🌐</div>
                <h2 style="color: #00f3ff; font-family: 'Orbitron', sans-serif; margin-top: 20px;">CONNECTING TO NEXUS NET</h2>
                <p id="mmStatus" style="color: #bc13fe; font-size: 1.2rem; margin-top: 10px;">Inițializare protocol...</p>
                <div style="margin-top: 30px; border: 1px solid #333; padding: 10px; border-radius: 5px;">
                    <p style="color: #888; margin: 0; font-size: 0.8rem;">YOUR ID: ${this.playerId}</p>
                </div>
                <style>@keyframes pulse { 0% { opacity: 0.5; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.5; transform: scale(0.9); } }</style>
            `;
            document.body.appendChild(loader);
        },

        updateMatchmakingStatus: function (text) {
            const el = document.getElementById('mmStatus');
            if (el) el.textContent = text;
        },

        hideMatchmakingUI: function () {
            const el = document.getElementById('nexusMatchmaking');
            if (el) el.remove();
        },

        // === INTERFAȚA DE JOC (Cyber Racer) ===
        showGameInterface: function (gameType, mode, opponentId = null) {
            const gameContainer = document.createElement('div');
            gameContainer.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: black; z-index: 9999;
                display: flex; flex-direction: column; overflow: hidden;
            `;

            const isMulti = mode === 'multi';
            const voiceStatus = isMulti ? '<span style="color: #00ff41;">● VOICE ACTIVE</span>' : '';
            const opponentInfo = isMulti ? `<div style="color: #ff4444;">VS: ${opponentId}</div>` : '';

            gameContainer.innerHTML = `
                <!-- HUD -->
                <div style="padding: 15px; background: rgba(0,20,40,0.9); border-bottom: 2px solid #00f3ff; display: flex; justify-content: space-between; align-items: center; font-family: 'Orbitron', sans-serif; z-index:10001;">
                    <div style="color: #00f3ff;">
                        🏎️ CYBER RACER <span style="font-size: 0.8rem; color: #888;">[${mode.toUpperCase()}]</span>
                    </div>
                    ${opponentInfo}
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <div id="gameScore" style="color: #ffd700; font-size: 1.2rem;">SCORE: 0</div>
                        ${voiceStatus}
                        <button id="exitGameBtn" style="background: red; border: none; color: white; padding: 5px 15px; cursor: pointer; border-radius: 5px; font-family: 'Orbitron', sans-serif;">EXIT</button>
                    </div>
                </div>

                <!-- GAME CANVAS -->
                <canvas id="gameCanvas" style="background: linear-gradient(180deg, #0a0a2a 0%, #2a0a3a 100%); width: 100%; height: 100%; display: block;"></canvas>
                
                <!-- CONTROLS HINT -->
                <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.5); font-family: 'Rajdhani', sans-serif; pointer-events: none;">
                    ⬅️ STÂNGA | DREAPTA ➡️
                </div>
            `;
            document.body.appendChild(gameContainer);

            // LOGICA JOCULUI
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');
            const scoreEl = document.getElementById('gameScore');
            let animationId;
            let score = 0;
            let gameOver = false;
            let xpAwarded = false;

            // Resize
            const resize = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - 60; // minus header
            };
            window.addEventListener('resize', resize);
            resize();

            // Player Car
            const car = {
                x: canvas.width / 2,
                y: canvas.height - 100,
                width: 50,
                height: 80,
                color: '#00f3ff'
            };

            // Obstacles
            const obstacles = [];
            const speed = 5;

            // Controls
            let leftPressed = false;
            let rightPressed = false;

            const keyDownHandler = (e) => {
                if (e.key == "Right" || e.key == "ArrowRight") rightPressed = true;
                else if (e.key == "Left" || e.key == "ArrowLeft") leftPressed = true;
            };
            const keyUpHandler = (e) => {
                if (e.key == "Right" || e.key == "ArrowRight") rightPressed = false;
                else if (e.key == "Left" || e.key == "ArrowLeft") leftPressed = false;
            };

            document.addEventListener("keydown", keyDownHandler, false);
            document.addEventListener("keyup", keyUpHandler, false);

            // TOUCH CONTROLS (MOBILE PWA)
            canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (e.touches[0].clientX < window.innerWidth / 2) leftPressed = true;
                else rightPressed = true;
            }, { passive: false });

            canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                leftPressed = false;
                rightPressed = false;
            });

            // Exit Handler
            document.getElementById('exitGameBtn').onclick = () => {
                cancelAnimationFrame(animationId);
                document.removeEventListener("keydown", keyDownHandler);
                document.removeEventListener("keyup", keyUpHandler);
                document.body.removeChild(gameContainer);
            };

            // Game Loop
            function draw() {
                if (gameOver) {
                    if (!xpAwarded && typeof NexusProfile !== 'undefined') {
                        const xpGain = Math.floor(score / 5);
                        NexusProfile.addXP(xpGain);
                        xpAwarded = true;
                        // Visual Feedback handled by Profile, but text ensures user knows
                    }
                    ctx.font = "40px Orbitron";
                    ctx.fillStyle = "red";
                    ctx.textAlign = "center";
                    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
                    ctx.font = "20px Rajdhani";
                    ctx.fillStyle = "white";
                    ctx.fillText("Click EXIT to leave", canvas.width / 2, canvas.height / 2 + 40);
                    return;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Grid effect (Road)
                ctx.strokeStyle = "rgba(0, 243, 255, 0.1)";
                ctx.lineWidth = 1;
                for (let i = 0; i < canvas.width; i += 40) {
                    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
                }
                for (let i = 0; i < canvas.height; i += 40) {
                    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
                }

                // Move Car
                if (rightPressed && car.x < canvas.width - car.width) car.x += 7;
                else if (leftPressed && car.x > 0) car.x -= 7;

                // Draw Car
                ctx.fillStyle = car.color;
                ctx.shadowBlur = 20;
                ctx.shadowColor = car.color;
                ctx.fillRect(car.x, car.y, car.width, car.height);
                ctx.shadowBlur = 0;

                // Spawn Obstacles
                if (Math.random() < 0.02) {
                    obstacles.push({
                        x: Math.random() * (canvas.width - 50),
                        y: -50,
                        width: 50,
                        height: 50,
                        color: Math.random() < 0.5 ? '#ff0055' : '#bc13fe'
                    });
                }

                // Update Obstacles
                for (let i = 0; i < obstacles.length; i++) {
                    let obs = obstacles[i];
                    obs.y += speed + (score / 100); // Speed up over time

                    // Draw Obstacle
                    ctx.fillStyle = obs.color;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = obs.color;
                    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                    ctx.shadowBlur = 0;

                    // Collision Detection
                    if (car.x < obs.x + obs.width &&
                        car.x + car.width > obs.x &&
                        car.y < obs.y + obs.height &&
                        car.height + car.y > obs.y) {
                        gameOver = true;
                    }

                    // Remove off-screen
                    if (obs.y > canvas.height) {
                        obstacles.splice(i, 1);
                        i--;
                        score += 10;
                        scoreEl.textContent = "SCORE: " + score;
                    }
                }

                animationId = requestAnimationFrame(draw);
            }

            draw();
        },

        // === UTILS ===
        getUserAge: function () {
            // Priority: Child Account > Demo > Adult Default
            const role = localStorage.getItem('nexus_role');
            if (role === 'child') {
                return parseInt(localStorage.getItem('nexus_child_age') || '10');
            }
            return 18; // Default adult for demo/subscriber if not specified
        },

        enableVoiceChat: function () {
            this.isVoiceActive = true;
            console.log('[GAME] Voice Chat Activated');
            // Aici ar fi logica WebRTC
        }
    };
})();
