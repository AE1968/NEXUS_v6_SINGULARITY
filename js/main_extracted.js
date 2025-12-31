"use strict";

            // 🔑 API CONFIGURATION - All API calls routed through Flask backend
            // Backend endpoints: /api/chat, /api/tts, /api/search, /api/whisper
            // API keys are securely stored in Railway environment variables
            // No frontend API keys needed - all handled by backend (app.py)

            const state = {
                isLogged: false,
                isAdmin: false,
                user: "N/A",
                voice: true,
                language: 'en'  // English default
            };

            const $ = id => document.getElementById(id);

            // 📝 CHAT SYSTEM
            function write(who, text, isError = false) {
                const msg = document.createElement('div');
                msg.className = `message ${who} ${isError ? 'error' : ''}`;
                msg.textContent = text;
                $('chat-messages').appendChild(msg);
                $('chat-messages').scrollTop = $('chat-messages').scrollHeight;

                // 🔊 Sound Effect for bot messages
                if (who === 'bot' && !isError) {
                    try {
                        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                        const oscillator = audioCtx.createOscillator();
                        const gainNode = audioCtx.createGain();
                        oscillator.connect(gainNode);
                        gainNode.connect(audioCtx.destination);
                        oscillator.frequency.value = 800;
                        oscillator.type = 'sine';
                        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); // Very quiet
                        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                        oscillator.start(audioCtx.currentTime);
                        oscillator.stop(audioCtx.currentTime + 0.1);
                    } catch (e) { /* Sound disabled or not supported */ }
                }

                return msg;
            }

            // 🌐 REAL-TIME WEB SEARCH (via Backend /api/search)
            async function searchWeb(query) {
                console.log(`🌐 Searching web via backend for: ${query}`);
                try {
                    const response = await fetch("/api/search", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ query: query })
                    });

                    if (!response.ok) throw new Error("Search API Error");

                    const data = await response.json();

                    if (!data.success) {
                        return `Error: ${data.error || 'Search failed'}`;
                    }

                    let results = [];
                    if (data.results && data.results.length > 0) {
                        data.results.forEach((item, i) => {
                            results.push(`[${i + 1}] ${item.title}: ${item.snippet}`);
                        });
                    }

                    if (results.length === 0) return "No results found for this query.";

                    return "🌐 LIVE WEB SEARCH RESULTS:\n" + results.join("\n\n");

                } catch (err) {
                    console.error("Web Search Error:", err);
                    return "Error: Could not connect to search service.";
                }
            }

            // 🎤 VOICE SYSTEM (OPENAI TTS)
            let currentAudio = null;
            let audioCtx = null;
            let analyser = null;
            let dataArray = null;
            let visualizerID = null;

            async function speak(text) {
                if (!state.voice) return;

                // ===== ACCESSIBILITY: Show subtitles =====
                if (window.SubtitleSystem) {
                    const lang = state.lang || 'EN';
                    window.SubtitleSystem.showText(text, lang);
                }

                // ===== HOLOGRAM: Start lip sync + emotion detection =====
                if (window.HologramSystem) {
                    window.HologramSystem.startSpeaking();
                    window.HologramSystem.setColor('speaking');
                }
                if (window.EmotionDetector) {
                    window.EmotionDetector.applyToHologram(text);
                }

                // Stop previous audio if playing
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio = null;
                }
                if (visualizerID) {
                    cancelAnimationFrame(visualizerID);
                }

                // Cancel any browser synthesis
                window.speechSynthesis.cancel();

                try {
                    // Visual indicator start
                    document.body.classList.add('speaking');
                    const visualizer = $('voice-visualizer');
                    if (visualizer) visualizer.classList.add('active');

                    // Use backend /api/tts endpoint (has API key configured)
                    const response = await fetch("/api/tts", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            text: text,
                            gender: "male",
                            username: state.user
                        })
                    });

                    if (!response.ok) throw new Error("TTS API Error");

                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);

                    currentAudio = new Audio(url);
                    currentAudio.crossOrigin = "anonymous";

                    // Setup Audio Visualizer
                    if (!audioCtx) {
                        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                        analyser = audioCtx.createAnalyser();
                        analyser.fftSize = 32;
                        dataArray = new Uint8Array(analyser.frequencyBinCount);
                    }

                    if (audioCtx.state === 'suspended') {
                        audioCtx.resume();
                    }

                    const source = audioCtx.createMediaElementSource(currentAudio);
                    source.connect(analyser);
                    analyser.connect(audioCtx.destination);

                    function updateVisualizer() {
                        analyser.getByteFrequencyData(dataArray);
                        const bars = document.querySelectorAll('.voice-bar');
                        bars.forEach((bar, i) => {
                            // Map frequency data to height (10px to 60px)
                            const val = dataArray[i % dataArray.length];
                            const height = 10 + (val / 255) * 50;
                            bar.style.height = height + 'px';
                        });
                        visualizerID = requestAnimationFrame(updateVisualizer);
                    }

                    currentAudio.onplay = () => {
                        updateVisualizer();
                    };

                    currentAudio.onended = () => {
                        document.body.classList.remove('speaking');
                        if (visualizer) visualizer.classList.remove('active');
                        if (visualizerID) cancelAnimationFrame(visualizerID);

                        // ===== Stop hologram lip sync =====
                        if (window.HologramSystem) {
                            window.HologramSystem.stopSpeaking();
                            window.HologramSystem.setColor('default');
                        }
                        // ===== Clear subtitle animation =====
                        if (window.SubtitleSystem) {
                            window.SubtitleSystem.clear();
                        }
                    };

                    currentAudio.play();

                } catch (err) {
                    console.error("Backend TTS Failed. Using browser fallback:", err);
                    const utterance = new SpeechSynthesisUtterance(text);
                    const voices = window.speechSynthesis.getVoices();
                    // Try to find a male/romanian voice
                    utterance.voice = voices.find(v => v.lang.includes('ro') || v.name.includes('Male')) || voices[0];
                    utterance.onstart = () => {
                        document.body.classList.add('speaking');
                        const visualizer = $('voice-visualizer');
                        if (visualizer) visualizer.classList.add('active');
                    };
                    utterance.onend = () => {
                        document.body.classList.remove('speaking');
                        const visualizer = $('voice-visualizer');
                        if (visualizer) visualizer.classList.remove('active');

                        // ===== Stop hologram lip sync =====
                        if (window.HologramSystem) {
                            window.HologramSystem.stopSpeaking();
                        }
                        // ===== Clear subtitle animation =====
                        if (window.SubtitleSystem) {
                            window.SubtitleSystem.clear();
                        }
                    };
                    window.speechSynthesis.speak(utterance);
                }
            }


            // 🧠 AI PROCESSOR (INTELLIGENT RESOLVER v142 + WEB SEARCH via Backend)
            async function execute() {
                const input = $('chat-input');
                const msg = input.value.trim();
                if (!msg) return;

                write('user', msg);
                input.value = "";

                // Show typing indicator
                const typingInd = $('typing-indicator');
                if (typingInd) typingInd.style.display = 'flex';
                $('chat-messages').scrollTop = $('chat-messages').scrollHeight;

                try {
                    // START VISUAL PROCESSING
                    if (window.HologramSystem) {
                        window.HologramSystem.startProcessing();
                    }

                    // Use backend /api/chat endpoint (has API keys configured)
                    thinking.textContent = "Connecting to neural core...";

                    const response = await fetch("/api/chat", {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: msg,
                            username: state.user,
                            gender: "male",
                            conversation_id: state.user
                        })
                    });

                    // STOP VISUAL PROCESSING
                    if (window.HologramSystem) {
                        window.HologramSystem.stopProcessing();
                    }

                    if (!response.ok) throw new Error("Chat API Error");

                    const data = await response.json();

                    // Hide typing indicator
                    if (typingInd) typingInd.style.display = 'none';

                    // ===== CHECK IF USER IS BLOCKED =====
                    if (data.blocked) {
                        thinking.remove();
                        const blockedMsg = data.message || "Your access has expired. Please subscribe to continue.";
                        write('bot', `⚠️ ${blockedMsg}`);
                        speak(blockedMsg);

                        // Show subscription modal after 2 seconds
                        setTimeout(() => {
                            if (data.redirect) {
                                window.location.href = data.redirect;
                            }
                        }, 3000);
                        return;
                    }

                    if (data.success) {
                        const reply = data.response;
                        thinking.remove();
                        write('bot', reply);
                        speak(reply);

                        // Detect language from response for future use
                        if (data.lang) state.language = data.lang;
                    } else {
                        throw new Error(data.error || "Unknown error");
                    }

                } catch (err) {
                    console.error("AI Processor Error:", err);
                    thinking.remove();
                    const errStatus = "Neural Link unstable. Please try again.";
                    write('bot', errStatus);
                    speak(errStatus);
                }
            }


            // 🌌 BACKGROUND PARTICLES
            function starfield() {
                const canvas = $('bg-canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;

                const stars = [];
                for (let i = 0; i < 60; i++) {
                    stars.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        s: Math.random() * 2,
                        v: Math.random() * 0.3
                    });
                }

                function animate() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = "rgba(0, 243, 255, 0.2)";
                    stars.forEach(s => {
                        s.y -= s.v;
                        if (s.y < 0) s.y = canvas.height;
                        ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2); ctx.fill();
                    });
                    requestAnimationFrame(animate);
                }
                animate();
            }

            // ========== FLAT MAP + ADVANCED TRACKING ==========
            let mapRAF = null;
            let ipMarkers = [];

            function latLonToXY(lat, lon, width, height) {
                const x = ((lon + 180) / 360) * width;
                const y = ((90 - lat) / 180) * height;
                return { x, y };
            }

            function renderFlatMap() {
                const canvas = document.getElementById("traffic-canvas");
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                const width = canvas.width;
                const height = canvas.height;

                function frame() {
                    ctx.clearRect(0, 0, width, height);

                    ctx.strokeStyle = "rgba(0,243,255,0.3)";
                    ctx.lineWidth = 0.5;

                    for (let lat = -90; lat <= 90; lat += 15) {
                        ctx.beginPath();
                        const y = ((90 - lat) / 180) * height;
                        ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
                    }
                    for (let lon = -180; lon <= 180; lon += 15) {
                        ctx.beginPath();
                        const x = ((lon + 180) / 360) * width;
                        ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
                    }

                    ipMarkers.forEach(marker => {
                        const pos = latLonToXY(marker.lat, marker.lon, width, height);
                        ctx.shadowBlur = 15; ctx.shadowColor = marker.color;
                        ctx.beginPath(); ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
                        ctx.fillStyle = marker.color; ctx.fill();
                        ctx.shadowBlur = 0;
                        ctx.fillStyle = "#fff"; ctx.font = "10px 'Orbitron'";
                        ctx.fillText(marker.city || marker.ip, pos.x + 10, pos.y - 10);
                    });
                    mapRAF = requestAnimationFrame(frame);
                }
                frame();
            }

            function addIPMarker(ip, lat, lon, city, country, org, status) {
                const color = status.includes("YOU") ? "#00f3ff" : "#ff00ff";
                ipMarkers.push({ ip, lat, lon, city, country, color });
                const tbody = document.getElementById("ip-table-body");
                if (!tbody) return;
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td style="padding:10px; border-bottom:1px solid rgba(0,243,255,.1);">${ip}</td>
                    <td style="padding:10px; border-bottom:1px solid rgba(0,243,255,.1);">${city}, ${country}</td>
                    <td style="padding:10px; border-bottom:1px solid rgba(0,243,255,.1);">${org}</td>
                    <td style="padding:10px; border-bottom:1px solid rgba(0,243,255,.1); color:${color}">${status}</td>
                    <td style="padding:10px; border-bottom:1px solid rgba(0,243,255,.1);">${new Date().toLocaleTimeString()}</td>
                `;
                tbody.prepend(row);
            }

            async function detectRealIP() {
                const apis = ["https://ipapi.co/json/", "https://api.ipify.org?format=json"];
                for (const api of apis) {
                    try {
                        const res = await fetch(api);
                        const data = await res.json();
                        if (data.ip) return {
                            ip: data.ip, city: data.city || "Unknown", country: data.country_name || "Unknown",
                            lat: data.latitude || 0, lon: data.longitude || 0, org: data.org || "Unknown"
                        };
                    } catch (e) { continue; }
                }
                return null;
            }

            async function startTrafficTracking() {
                const tbody = document.getElementById("ip-table-body");
                if (tbody) tbody.innerHTML = "";
                ipMarkers = [];
                if (!mapRAF) renderFlatMap();

                const ipData = await detectRealIP();
                if (ipData) {
                    addIPMarker(ipData.ip, ipData.lat, ipData.lon, ipData.city, ipData.country, ipData.org, "ACTIVE (YOU)");
                }
            }

            // 🚀 INITIALIZATION
            document.addEventListener('DOMContentLoaded', () => {
                // 🔒 SECURITY: Sesiune persistenta v143 (Architect Override)
                // localStorage.clear(); // Dezactivat pentru a permite Personalizare / Welcome back
                // sessionStorage.clear();

                // 🚀 NEURAL INITIALIZATION SEQUENCE
                const initSequence = async () => {
                    const bar = $('load-bar');
                    const status = $('load-status');
                    const detail = $('load-detail');
                    const steps = [
                        { p: 10, s: "CONNECTING TO NEURAL HUB...", d: "> HANDSHAKE_REQUEST_SENT" },
                        { p: 30, s: "AUTHENTICATING BIO-SIGNATURES...", d: "> USER_RECOGNIZED: ARCHITECT" },
                        { p: 50, s: "LOADING CORE AI MATRICES...", d: "> GPT-4O_CORE_LOADED" },
                        { p: 80, s: "SYNCHRONIZING GLOBAL_EYES...", d: "> SATELLITE_UPLINK_STABLE" },
                        { p: 100, s: "SYSTEM READY", d: "> WELCOME TO KELION v143.0" }
                    ];

                    for (let step of steps) {
                        await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
                        bar.style.width = step.p + "%";
                        status.textContent = step.s;
                        detail.textContent = step.d;
                    }

                    await new Promise(r => setTimeout(r, 800));
                    $('loading-screen').style.opacity = '0';
                    setTimeout(() => {
                        $('loading-screen').style.visibility = 'hidden';
                        $('bg-image').classList.add('active');
                        document.body.classList.add('ready');

                        // 🗣️ Play welcome message AFTER robot appears (always visitor since we clear session)
                        setTimeout(() => {
                            showKelionaiWelcome();
                        }, 1500); // 1.5s after robot appears
                    }, 1000);
                };

                initSequence();

                // 🔓 PRE-POPULATE DEMO CREDENTIALS
                $('u-input').value = "demo";
                $('p-input').value = "demo2024";

                // No session restoration - user must login every time
                $('input-bar').style.display = 'none';

                // starfield(); // Disabled - using Matrix Rain (initThreeJS) instead

                function updatePart(id, val) {
                    const container = $(id);
                    if (!container) return;
                    const current = container.querySelector('span:last-child');
                    if (current && current.textContent === val) return;

                    const next = document.createElement('span');
                    next.textContent = val;
                    container.appendChild(next);

                    // Ensure transition is active
                    container.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';

                    // Force layout reflow
                    container.offsetHeight;

                    const offset = (container.children.length - 1) * 1.2;
                    container.style.transform = `translateY(-${offset}em)`;

                    setTimeout(() => {
                        if (container.children.length > 1) {
                            const last = container.lastElementChild;
                            container.style.transition = 'none';
                            container.style.transform = 'translateY(0)';
                            container.innerHTML = '';
                            container.appendChild(last);
                        }
                    }, 650);
                }

                function updateClock() {
                    const now = new Date();
                    const h = String(now.getHours()).padStart(2, '0');
                    const m = String(now.getMinutes()).padStart(2, '0');
                    const s = String(now.getSeconds()).padStart(2, '0');

                    updatePart('h-part', h);
                    updatePart('m-part', m);
                    updatePart('s-part', s);

                    const dateString = now.toLocaleDateString('en-US');
                    if ($('system-date').textContent !== dateString) {
                        $('system-date').textContent = dateString;
                    }
                }
                setInterval(updateClock, 1000);
                updateClock();

                // ⚙️ LOGIN HANDLERS
                $('login-btn').onclick = () => {
                    if (state.isLogged) {
                        // === LOGOUT PROTOCOL ===
                        state.isLogged = false;
                        state.user = "N/A";
                        state.isAdmin = false;
                        state.language = 'en'; // Reset to English default

                        // Clear all storage
                        sessionStorage.removeItem('kelion_user');
                        sessionStorage.removeItem('kelion_admin');
                        localStorage.removeItem('kelion_user');
                        localStorage.removeItem('kelion_admin');

                        // Reset all form fields
                        $('u-input').value = 'demo';
                        $('p-input').value = 'demo2024';

                        // Clear registration form if exists
                        const regFields = ['reg-email', 'reg-pass', 'reg-first', 'reg-last', 'reg-phone', 'reg-address', 'reg-city', 'reg-postal'];
                        regFields.forEach(id => { const el = $(id); if (el) el.value = ''; });

                        // Hard reset on logout
                        location.reload();
                    } else {
                        $('login-modal').style.display = 'flex';
                    }
                };

                $('do-login').onclick = async () => {
                    const username = $('u-input').value.trim();
                    const password = $('p-input').value.trim();

                    if (!username || !password) {
                        alert("⚠️ Please enter both Architect ID and Security Key.");
                        return;
                    }

                    $('do-login').textContent = "AUTHENTICATING...";
                    $('do-login').disabled = true;

                    try {
                        const response = await fetch("/api/login", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ username, password })
                        });

                        const data = await response.json();

                        if (data.success) {
                            state.user = data.username || username;
                            state.isLogged = true;
                            state.isAdmin = (data.role === 'admin');

                            // Storage (though we clear it on load, it helps within same session)
                            sessionStorage.setItem('kelion_user', state.user);
                            sessionStorage.setItem('kelion_admin', state.isAdmin);
                            localStorage.setItem('kelion_user', state.user);
                            localStorage.setItem('kelion_admin', state.isAdmin);

                            // UI UPDATE
                            $('login-modal').style.display = 'none';
                            $('user-name').textContent = state.user.toUpperCase();
                            $('sys-status').textContent = "CONNECTED";
                            $('sys-status').className = "stat-val online";
                            $('login-btn').textContent = "LOG OFF";
                            $('login-btn').classList.add('logged');
                            $('input-bar').style.display = 'flex';
                            $('chat-container').style.display = 'flex';

                            if (state.isAdmin) {
                                const tb = $('traffic-btn');
                                if (tb) {
                                    tb.style.display = 'inline-block';
                                    tb.style.opacity = '1';
                                    tb.style.pointerEvents = 'auto';
                                }
                            }

                            // 🕐 USAGE TIMER - Fetch and display remaining time
                            try {
                                const usageRes = await fetch('/api/usage', {
                                    headers: { 'Content-Type': 'application/json' },
                                    method: 'POST',
                                    body: JSON.stringify({ username: state.user })
                                });
                                const usageData = await usageRes.json();
                                if (usageData.success && usageData.remaining_seconds !== undefined) {
                                    const mins = Math.floor(usageData.remaining_seconds / 60);
                                    const secs = usageData.remaining_seconds % 60;
                                    $('usage-timer').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                                    $('usage-display').style.display = 'inline';

                                    // Color coding: green > 10min, yellow > 5min, red < 5min
                                    if (mins < 5) {
                                        $('usage-timer').style.color = '#ff0000';
                                    } else if (mins < 10) {
                                        $('usage-timer').style.color = '#ffff00';
                                    } else {
                                        $('usage-timer').style.color = '#00ff00';
                                    }
                                }
                            } catch (e) { console.log('Usage API not available'); }

                            // 🗣️ GREETING AFTER LOGIN
                            greetUser(state.user);
                        } else {
                            alert("⚠️ ACCESS DENIED: " + (data.error || "Invalid Credentials"));
                        }
                    } catch (err) {
                        console.error("Login Error:", err);
                        alert("⚠️ CONNECTION ERROR: Neural core unreachable.");
                    } finally {
                        $('do-login').textContent = "INITIALIZE";
                        $('do-login').disabled = false;
                    }
                };

                const tBtn = $('traffic-btn');
                if (tBtn) {
                    tBtn.onclick = () => {
                        $('admin-modal').style.display = 'flex';
                        startTrafficTracking();
                    };
                }

                // 🎙️ VOICE RECOGNITION (WHISPER)
                let mediaRecorder;
                let audioChunks = [];
                const micBtn = $('mic-btn');
                let isRecording = false;

                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    // CORRECT PROCEDURE: HOLD TO RECORD, RELEASE TO SEND

                    const startRecording = async (e) => {
                        // Prevent default text selection etc.
                        if (e.type !== 'mousedown') e.preventDefault();
                        if (isRecording) return;

                        try {
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            mediaRecorder = new MediaRecorder(stream);
                            audioChunks = [];

                            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

                            mediaRecorder.onstart = () => {
                                isRecording = true;
                                micBtn.classList.add('recording');
                                micBtn.innerHTML = "🔴";
                                micBtn.style.color = "#f00";
                                micBtn.style.textShadow = "0 0 15px #f00";
                                $('chat-input').placeholder = "Listening... (Release to Send)";
                            };

                            mediaRecorder.onstop = async () => {
                                isRecording = false; // Reset state immediately

                                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

                                // Visual: Processing
                                $('chat-input').placeholder = "Transcribing & Sending...";
                                micBtn.innerHTML = "⏳";
                                micBtn.style.color = "#00f3ff"; // Processing color
                                micBtn.style.textShadow = "";

                                const formData = new FormData();
                                formData.append("file", audioBlob, "voice.webm");
                                formData.append("model", "whisper-1");

                                try {
                                    // Use backend /api/whisper endpoint (has API key configured)
                                    const res = await fetch("/api/whisper", {
                                        method: "POST",
                                        body: formData
                                    });
                                    const data = await res.json();
                                    if (data.text) {
                                        $('chat-input').value = data.text;

                                        // AUTO-SEND ON RELEASE
                                        const finalMsg = $('chat-input').value.trim();
                                        if (finalMsg !== "") {
                                            console.log("Mic released. Auto-sending:", finalMsg);
                                            execute();
                                        }
                                    }
                                } catch (e) {
                                    console.error("Whisper Error:", e);
                                    $('chat-input').placeholder = "Error Transcribing";
                                }

                                // Cleanup UI
                                micBtn.classList.remove('recording');
                                micBtn.innerHTML = "🎤";
                                micBtn.style.color = "";
                                stream.getTracks().forEach(t => t.stop());
                            };

                            mediaRecorder.start();

                        } catch (err) {
                            console.error("Mic Access Error:", err);
                            alert("Microphone access denied.");
                        }
                    };

                    const stopRecording = (e) => {
                        if (e && e.cancelable) e.preventDefault();
                        if (mediaRecorder && mediaRecorder.state === "recording") {
                            mediaRecorder.stop();
                        }
                    };

                    // Add Event Listeners for HOLD Interaction
                    micBtn.addEventListener('mousedown', startRecording);
                    micBtn.addEventListener('touchstart', startRecording, { passive: false });

                    micBtn.addEventListener('mouseup', stopRecording);
                    micBtn.addEventListener('touchend', stopRecording, { passive: false });
                    micBtn.addEventListener('mouseleave', stopRecording); // Safety: Stop if mouse leaves button

                    // Prevent context menu on right click
                    micBtn.addEventListener('contextmenu', e => e.preventDefault());

                    // Clear any Click handlers
                    micBtn.onclick = null;
                }

                $('chat-input').onkeypress = e => { if (e.key === "Enter") execute(); };


                // Update Version
                const vTag = document.querySelector('.version-tag');
                if (vTag) vTag.textContent = "v143.0";

                // 🌓 THEME TOGGLE
                const themeBtn = document.getElementById('theme-toggle');
                if (themeBtn) {
                    // Check saved preference
                    if (localStorage.getItem('kelion_theme') === 'light') {
                        document.body.classList.add('light-mode');
                        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
                    }

                    themeBtn.onclick = () => {
                        document.body.classList.toggle('light-mode');
                        const isLight = document.body.classList.contains('light-mode');
                        themeBtn.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
                        localStorage.setItem('kelion_theme', isLight ? 'light' : 'dark');
                    };
                }

                // 📥 EXPORT CONVERSATION
                const exportBtn = $('export-btn');
                if (exportBtn) {
                    exportBtn.onclick = () => {
                        const messages = document.querySelectorAll('#chat-messages .message');
                        if (messages.length === 0) {
                            alert('No conversation to export.');
                            return;
                        }

                        let content = '=== KELION AI CONVERSATION EXPORT ===\n';
                        content += `Date: ${new Date().toLocaleString()}\n`;
                        content += `User: ${state.user || 'Unknown'}\n`;
                        content += '=====================================\n\n';

                        messages.forEach(msg => {
                            const who = msg.classList.contains('user') ? 'YOU' : 'KELION';
                            content += `[${who}]: ${msg.textContent}\n\n`;
                        });

                        content += '=====================================\n';
                        content += 'Exported from KELION AI v143.0\n';

                        // Create download
                        const blob = new Blob([content], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `kelion_conversation_${Date.now()}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                    };
                }

                // ♿ HIGH CONTRAST TOGGLE
                const contrastBtn = document.getElementById('contrast-toggle');
                if (contrastBtn) {
                    // Check saved preference
                    if (localStorage.getItem('kelion_contrast') === 'high') {
                        document.body.classList.add('high-contrast');
                        contrastBtn.textContent = '♿ Normal';
                    }

                    contrastBtn.onclick = () => {
                        document.body.classList.toggle('high-contrast');
                        const isHigh = document.body.classList.contains('high-contrast');
                        contrastBtn.textContent = isHigh ? '♿ Normal' : '♿ HC';
                        localStorage.setItem('kelion_contrast', isHigh ? 'high' : 'normal');
                    };
                }

                // initThreeJS(); // DISABLED - shows robot background instead
            });

            // Matrix effect removed - keeping clean background

            // 🌟 GREETING HELPER (After Login) - With Personalized Memory
            async function greetUser(username) {
                // Clear chat history - keep only the last message (this one)
                const chatMessages = $('chat-messages');
                if (chatMessages) {
                    chatMessages.innerHTML = ''; // Clear all previous messages
                }

                // Fetch personalized memories from backend
                let personalNote = '';
                try {
                    const memRes = await fetch('/api/memories', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: username })
                    });
                    const memData = await memRes.json();
                    if (memData.success && memData.memories && memData.memories.length > 0) {
                        // Pick a random memory to mention
                        const mem = memData.memories[Math.floor(Math.random() * memData.memories.length)];
                        if (mem.key && mem.value) {
                            personalNote = ` I remember that your ${mem.key} is ${mem.value}.`;
                        }
                    }
                } catch (e) {
                    console.log('Memory API not available');
                }

                // Time-based greeting
                const hour = new Date().getHours();
                let timeGreeting = 'Hello';
                if (hour >= 5 && hour < 12) timeGreeting = 'Good morning';
                else if (hour >= 12 && hour < 18) timeGreeting = 'Good afternoon';
                else if (hour >= 18 && hour < 22) timeGreeting = 'Good evening';
                else timeGreeting = 'Good night';

                const welcomeMsg = `${timeGreeting}, ${username}!${personalNote} How can I help you today?`;

                console.log("Greeting:", welcomeMsg);
                write('bot', welcomeMsg);
                speak(welcomeMsg);
            }

            // 📩 CONTACT FORM HANDLER v143
            document.getElementById('ae-contact-form')?.addEventListener('submit', async function (e) {
                e.preventDefault();
                const btn = this.querySelector('button');
                const origText = btn.textContent;

                btn.textContent = '🚀 SENDING...';
                btn.disabled = true;

                const formData = {
                    email: document.getElementById('ae-email').value,
                    name: document.getElementById('ae-name').value,
                    topic: document.getElementById('ae-topic').value,
                    message: document.getElementById('ae-message').value
                };

                try {
                    const res = await fetch('/api/contact', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });
                    const data = await res.json();

                    if (data.success) {
                        alert('✅ Message sent! Your ticket ID is: ' + (data.ticket_id || 'N/A'));
                        document.getElementById('ae-contact-modal').classList.remove('active');
                        this.reset();
                    } else {
                        alert('❌ Error: ' + data.error);
                    }
                } catch (err) {
                    alert('❌ Connection failed. Please try again.');
                } finally {
                    btn.textContent = origText;
                    btn.disabled = false;
                }
            });

            // ðŸŒŸ KELIONAI WELCOME MESSAGE (Page Load)
            function showKelionaiWelcome() {
                const hour = new Date().getHours();
                let greeting;

                if (hour >= 5 && hour < 12) greeting = "Good morning";
                else if (hour >= 12 && hour < 18) greeting = "Good afternoon";
                else greeting = "Good evening";

                const welcomeText = `${greeting}, visitor! Welcome to KELIONAI - Your Intelligent Assistant. Please click LOGIN to continue.`;

                write('bot', welcomeText);
                speak(welcomeText);
            }

            // =====================================================================
            // v143: NEW FEATURES - Password Reset, Register, Tracking, Security
            // =====================================================================

            // Track visitor on page load
            (function trackVisit() {
                fetch('/api/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ page: window.location.pathname, username: localStorage.getItem('username') || null })
                }).catch(() => { });
            })();

            // FORGOT PASSWORD MODAL
            document.getElementById('forgot-pass-link')?.addEventListener('click', function (e) {
                e.preventDefault();
                document.getElementById('login-modal').style.display = 'none';
                document.getElementById('forgot-modal').style.display = 'flex';
                document.getElementById('forgot-step1').style.display = 'block';
                document.getElementById('forgot-step2').style.display = 'none';
            });

            document.getElementById('forgot-back-link')?.addEventListener('click', function (e) {
                e.preventDefault();
                document.getElementById('forgot-modal').style.display = 'none';
                document.getElementById('login-modal').style.display = 'flex';
            });

            document.getElementById('forgot-send-btn')?.addEventListener('click', async function () {
                const email = document.getElementById('forgot-email').value.trim();
                if (!email) return alert('Please enter your email');

                this.textContent = 'â³ Sending...';
                this.disabled = true;

                try {
                    const res = await fetch('/api/forgot-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    const data = await res.json();

                    if (data.success) {
                        document.getElementById('forgot-step1').style.display = 'none';
                        document.getElementById('forgot-step2').style.display = 'block';
                    } else {
                        alert(data.error || 'Failed to send code');
                    }
                } catch (e) {
                    alert('Network error');
                }

                this.textContent = 'ðŸ“§ SEND CODE';
                this.disabled = false;
            });

            document.getElementById('forgot-reset-btn')?.addEventListener('click', async function () {
                const email = document.getElementById('forgot-email').value.trim();
                const code = document.getElementById('forgot-code').value.trim();
                const newPass = document.getElementById('forgot-newpass').value;

                if (!code || code.length !== 6) return alert('Please enter the 6-digit code');
                if (!newPass || newPass.length < 8) return alert('Password must be at least 8 characters');

                this.textContent = 'â³ Resetting...';
                this.disabled = true;

                try {
                    const res = await fetch('/api/reset-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, code, new_password: newPass })
                    });
                    const data = await res.json();

                    if (data.success) {
                        alert('âœ… Password reset! You can now login.');
                        document.getElementById('forgot-modal').style.display = 'none';
                        document.getElementById('login-modal').style.display = 'flex';
                    } else {
                        alert(data.error || 'Reset failed');
                    }
                } catch (e) {
                    alert('Network error');
                }

                this.textContent = 'ðŸ”“ RESET PASSWORD';
                this.disabled = false;
            });

            // REGISTER MODAL
            document.getElementById('register-link')?.addEventListener('click', function (e) {
                e.preventDefault();
                document.getElementById('login-modal').style.display = 'none';
                document.getElementById('register-modal').style.display = 'flex';
            });

            document.getElementById('register-back-link')?.addEventListener('click', function (e) {
                e.preventDefault();
                document.getElementById('register-modal').style.display = 'none';
                document.getElementById('login-modal').style.display = 'flex';
            });

            document.getElementById('do-register')?.addEventListener('click', async function () {
                const firstName = document.getElementById('reg-firstname').value.trim();
                const lastName = document.getElementById('reg-lastname').value.trim();
                const email = document.getElementById('reg-email').value.trim();
                const password = document.getElementById('reg-password').value;
                const country = document.getElementById('reg-country').value;
                const phone = document.getElementById('reg-phone').value.trim();
                const address = document.getElementById('reg-address').value.trim();
                const city = document.getElementById('reg-city').value.trim();
                const postal = document.getElementById('reg-postal').value.trim();
                const voucher = document.getElementById('reg-voucher').value.trim().toUpperCase();

                if (!firstName || !lastName) return alert('First and Last name required');
                if (!email) return alert('Email is required');
                if (!password || password.length < 8) return alert('Password must be at least 8 characters');

                this.textContent = 'â³ Creating...';
                this.disabled = true;

                try {
                    const res = await fetch('/api/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email, password, first_name: firstName, last_name: lastName,
                            country, phone, address_line1: address, city, postal_code: postal,
                            subscription: voucher ? 'voucher' : 'demo'
                        })
                    });
                    const data = await res.json();

                    if (data.success) {
                        // If voucher was provided, try to redeem it
                        if (voucher) {
                            // Login first to get token
                            const loginRes = await fetch('/api/login', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ username: data.username, password })
                            });
                            const loginData = await loginRes.json();

                            if (loginData.success && loginData.token) {
                                // Redeem voucher
                                await fetch('/api/voucher/redeem', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': 'Bearer ' + loginData.token
                                    },
                                    body: JSON.stringify({ code: voucher })
                                });
                            }
                        }

                        alert('âœ… Account created! You can now login.');
                        document.getElementById('register-modal').style.display = 'none';
                        document.getElementById('login-modal').style.display = 'flex';
                    } else {
                        alert(data.error || 'Registration failed');
                    }
                } catch (e) {
                    alert('Network error');
                }

                this.textContent = 'ðŸš€ CREATE ACCOUNT';
                this.disabled = false;
            });

            // ANTI-SCREENSHOT PROTECTION (Basic - can be bypassed but deters casual users)
            // Disable right-click
            document.addEventListener('contextmenu', function (e) {
                const isAdmin = localStorage.getItem('role') === 'admin';
                if (!isAdmin) {
                    e.preventDefault();
                    return false;
                }
            });

            // Disable Print Screen (limited effectiveness)
            document.addEventListener('keyup', function (e) {
                const isAdmin = localStorage.getItem('role') === 'admin';
                if (!isAdmin && e.key === 'PrintScreen') {
                    navigator.clipboard.writeText('');
                    alert('Screenshots are disabled for security.');
                }
            });

            // Disable keyboard shortcuts for screenshots
            document.addEventListener('keydown', function (e) {
                const isAdmin = localStorage.getItem('role') === 'admin';
                if (!isAdmin) {
                    // Ctrl+P (print), Ctrl+S (save), Ctrl+Shift+S
                    if (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'P' || e.key === 'S')) {
                        e.preventDefault();
                        return false;
                    }
                }
            });

            // =====================================================================
            // AUTO-VERSIONING: Preia versiunea de la backend și actualizează peste tot
            // =====================================================================
            (async function loadVersion() {
                try {
                    const res = await fetch('/api/version');
                    const data = await res.json();
                    const version = data.version || 'v143.0';

                    // Actualizează toate elementele cu versiunea
                    document.querySelectorAll('.version-tag, #version-tag').forEach(el => {
                        el.textContent = version;
                    });

                    // Actualizează titlul paginii
                    document.title = `KELION ${version} - ${data.codename || 'GLOBAL_EYE'} OS`;

                    // Actualizează NEURAL INTERFACE header
                    const chatHeader = document.querySelector('#chat-header span');
                    if (chatHeader && chatHeader.textContent.includes('NEURAL INTERFACE')) {
                        chatHeader.textContent = `NEURAL INTERFACE ${version}`;
                    }

                    console.log(`✅ Version loaded: ${version} (${data.codename})`);
                } catch (e) {
                    console.log('Version API unavailable, using fallback');
                }
            })();

            // =====================================================================
            // 3D HOLOGRAM SYSTEM - KELION AI AVATAR
            // =====================================================================
            const HologramSystem = {
                scene: null,
                camera: null,
                renderer: null,
                model: null,
                mixer: null,
                animations: {},
                morphTargets: {},
                clock: new THREE.Clock(),
                isSpeaking: false,

                // Mouse tracking for eye following
                mouseX: 0,
                mouseY: 0,
                targetLookX: 0,
                targetLookY: 0,

                init: function () {
                    const container = document.getElementById('hologram-container');
                    if (!container) return;

                    // Setup mouse tracking
                    document.addEventListener('mousemove', (e) => {
                        // Normalize mouse position to -1 to 1
                        this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
                        this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
                    });

                    // Scene setup with transparent background
                    this.scene = new THREE.Scene();

                    // Camera
                    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
                    this.camera.position.set(0, 0, 2.5);

                    // Renderer with transparency
                    this.renderer = new THREE.WebGLRenderer({
                        antialias: true,
                        alpha: true,
                        powerPreference: "high-performance"
                    });
                    this.renderer.setSize(600, 600);
                    this.renderer.setPixelRatio(window.devicePixelRatio);
                    this.renderer.setClearColor(0x000000, 0);
                    this.renderer.outputEncoding = THREE.sRGBEncoding;
                    container.appendChild(this.renderer.domElement);

                    // Holographic lighting
                    const ambientLight = new THREE.AmbientLight(0x00f3ff, 0.5);
                    this.scene.add(ambientLight);

                    const frontLight = new THREE.DirectionalLight(0x00f3ff, 1);
                    frontLight.position.set(0, 1, 2);
                    this.scene.add(frontLight);

                    const backLight = new THREE.DirectionalLight(0xff00ff, 0.5);
                    backLight.position.set(0, 0, -2);
                    this.scene.add(backLight);

                    const rimLight = new THREE.PointLight(0x00f3ff, 0.8, 10);
                    rimLight.position.set(2, 1, 0);
                    this.scene.add(rimLight);

                    // Load 3D model
                    this.loadModel();

                    // Create particle system
                    this.createParticles();

                    // Start animation loop
                    this.animate();

                    console.log('✅ Hologram System initialized');
                },

                // Particle system for processing effect
                particles: null,
                particleActive: false,

                createParticles: function () {
                    const particleCount = 100;
                    const geometry = new THREE.BufferGeometry();
                    const positions = new Float32Array(particleCount * 3);

                    for (let i = 0; i < particleCount; i++) {
                        // Sphere distribution around head
                        const theta = Math.random() * Math.PI * 2;
                        const phi = Math.random() * Math.PI;
                        const radius = 0.8 + Math.random() * 0.4;

                        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                        positions[i * 3 + 1] = radius * Math.cos(phi);
                        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
                    }

                    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

                    const material = new THREE.PointsMaterial({
                        color: 0x00f3ff,
                        size: 0.02,
                        transparent: true,
                        opacity: 0,
                        blending: THREE.AdditiveBlending
                    });

                    this.particles = new THREE.Points(geometry, material);
                    this.scene.add(this.particles);
                },

                // Start particles when processing
                startProcessing: function () {
                    this.particleActive = true;
                    if (this.particles) {
                        this.particles.material.opacity = 0.8;
                    }
                    this.setColor('processing');
                },

                // Stop particles
                stopProcessing: function () {
                    this.particleActive = false;
                    if (this.particles) {
                        this.particles.material.opacity = 0;
                    }
                    this.setColor('default');
                },

                // Color states for hologram
                colorStates: {
                    default: { color: 0x00f3ff, emissive: 0x003344 },
                    processing: { color: 0xff00ff, emissive: 0x440044 },
                    happy: { color: 0x00ff88, emissive: 0x004422 },
                    sad: { color: 0x4488ff, emissive: 0x112244 },
                    angry: { color: 0xff4444, emissive: 0x441111 },
                    speaking: { color: 0x00ffff, emissive: 0x004444 }
                },

                setColor: function (state) {
                    if (!this.model) return;
                    const colors = this.colorStates[state] || this.colorStates.default;

                    this.model.traverse((child) => {
                        if (child.isMesh && child.material) {
                            child.material.color.setHex(colors.color);
                            child.material.emissive.setHex(colors.emissive);
                        }
                    });
                },

                loadModel: function () {
                    const loader = new THREE.GLTFLoader();
                    const modelPath = 'assets/kelion_holo/uploads_files_4723651_HologramMaleHead3DModelAnimatedWithFacialExpressions.glb';

                    loader.load(
                        modelPath,
                        (gltf) => {
                            this.model = gltf.scene;

                            // Apply holographic material
                            this.model.traverse((child) => {
                                if (child.isMesh) {
                                    child.material = new THREE.MeshPhongMaterial({
                                        color: 0x00f3ff,
                                        emissive: 0x003344,
                                        transparent: true,
                                        opacity: 0.85,
                                        wireframe: false,
                                        side: THREE.DoubleSide
                                    });

                                    // Store morph targets for facial animations
                                    if (child.morphTargetInfluences) {
                                        this.morphTargets[child.name] = child;
                                        console.log('Morph targets found:', child.morphTargetDictionary);
                                    }
                                }
                            });

                            // Position and scale
                            this.model.position.set(0, -0.3, 0);
                            this.model.scale.set(1.5, 1.5, 1.5);

                            this.scene.add(this.model);

                            // Setup animations
                            if (gltf.animations && gltf.animations.length > 0) {
                                this.mixer = new THREE.AnimationMixer(this.model);
                                gltf.animations.forEach((clip) => {
                                    this.animations[clip.name] = this.mixer.clipAction(clip);
                                    console.log('Animation loaded:', clip.name);
                                });

                                // Play idle animation if exists
                                if (this.animations['idle']) {
                                    this.animations['idle'].play();
                                } else {
                                    // Play first animation
                                    const firstAnim = Object.values(this.animations)[0];
                                    if (firstAnim) firstAnim.play();
                                }
                            }

                            console.log('✅ 3D Model loaded successfully');
                        },
                        (progress) => {
                            const percent = (progress.loaded / progress.total * 100).toFixed(1);
                            console.log(`Loading model: ${percent}%`);
                        },
                        (error) => {
                            console.warn('Model loading error:', error);
                        }
                    );
                },

                animate: function () {
                    requestAnimationFrame(() => this.animate());

                    const delta = this.clock.getDelta();
                    const time = Date.now();

                    // Update animations
                    if (this.mixer) {
                        this.mixer.update(delta);
                    }

                    // ===== HUMAN-LIKE BEHAVIORS =====
                    if (this.model) {
                        // Gentle floating/breathing animation
                        this.model.position.y = -0.3 + Math.sin(time * 0.001) * 0.015;

                        // ===== EYE/HEAD TRACKING - Follow cursor =====
                        // Smooth interpolation towards mouse position
                        this.targetLookX += (this.mouseX * 0.15 - this.targetLookX) * 0.05;
                        this.targetLookY += (this.mouseY * 0.1 - this.targetLookY) * 0.05;

                        // Apply to head rotation (combine with subtle idle movement)
                        this.model.rotation.y = this.targetLookX + Math.sin(time * 0.0003) * 0.03;
                        this.model.rotation.x = -this.targetLookY + Math.sin(time * 0.0005) * 0.02;

                        // Natural blinking (every 3-5 seconds)
                        this.handleBlinking(time);

                        // Micro-expressions when idle
                        if (!this.isSpeaking) {
                            this.handleIdleExpressions(time);
                        }
                    }

                    // Lip sync simulation when speaking
                    if (this.isSpeaking && this.model) {
                        this.simulateLipSync();
                    }

                    this.renderer.render(this.scene, this.camera);
                },

                // Natural blinking behavior
                lastBlinkTime: 0,
                nextBlinkIn: 3000,

                handleBlinking: function (time) {
                    if (time - this.lastBlinkTime > this.nextBlinkIn) {
                        this.blink();
                        this.lastBlinkTime = time;
                        this.nextBlinkIn = 2500 + Math.random() * 3000; // 2.5-5.5 seconds
                    }
                },

                blink: function () {
                    this.model.traverse((child) => {
                        if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                            const leftEye = child.morphTargetDictionary['eyeBlinkLeft'] || child.morphTargetDictionary['eyesClosed'];
                            const rightEye = child.morphTargetDictionary['eyeBlinkRight'] || child.morphTargetDictionary['eyesClosed'];

                            if (leftEye !== undefined) {
                                // Quick blink animation
                                child.morphTargetInfluences[leftEye] = 1;
                                setTimeout(() => { if (child.morphTargetInfluences) child.morphTargetInfluences[leftEye] = 0; }, 150);
                            }
                            if (rightEye !== undefined && rightEye !== leftEye) {
                                child.morphTargetInfluences[rightEye] = 1;
                                setTimeout(() => { if (child.morphTargetInfluences) child.morphTargetInfluences[rightEye] = 0; }, 150);
                            }
                        }
                    });
                },

                // Subtle idle expressions - polite, attentive look
                handleIdleExpressions: function (time) {
                    this.model.traverse((child) => {
                        if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                            // Subtle friendly smile
                            const smile = child.morphTargetDictionary['mouthSmile'] || child.morphTargetDictionary['smile'];
                            if (smile !== undefined) {
                                child.morphTargetInfluences[smile] = 0.15 + Math.sin(time * 0.0002) * 0.05;
                            }

                            // Slight brow movement (attentive)
                            const browUp = child.morphTargetDictionary['browUpCenter'] || child.morphTargetDictionary['browInnerUp'];
                            if (browUp !== undefined) {
                                child.morphTargetInfluences[browUp] = Math.sin(time * 0.0003) * 0.1;
                            }
                        }
                    });
                },

                simulateLipSync: function () {
                    // Simulate mouth movement based on audio
                    Object.values(this.morphTargets).forEach(mesh => {
                        if (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0) {
                            const mouthIndex = mesh.morphTargetDictionary?.['mouthOpen'] ||
                                mesh.morphTargetDictionary?.['jawOpen'] || 0;
                            mesh.morphTargetInfluences[mouthIndex] =
                                Math.abs(Math.sin(Date.now() * 0.015)) * 0.5;
                        }
                    });
                },

                startSpeaking: function () {
                    this.isSpeaking = true;
                    document.body.classList.add('speaking');
                },

                stopSpeaking: function () {
                    this.isSpeaking = false;
                    document.body.classList.remove('speaking');

                    // Reset mouth
                    Object.values(this.morphTargets).forEach(mesh => {
                        if (mesh.morphTargetInfluences) {
                            mesh.morphTargetInfluences.fill(0);
                        }
                    });
                },

                setEmotion: function (emotion) {
                    if (!this.model) return;

                    // Emotion morph target mappings
                    const emotionMorphs = {
                        happy: ['smile', 'mouthSmile', 'eyeWideLeft', 'eyeWideRight', 'cheekPuff'],
                        sad: ['mouthFrown', 'frownLeft', 'frownRight', 'eyeSquintLeft', 'eyeSquintRight', 'browDownLeft', 'browDownRight'],
                        angry: ['browDownLeft', 'browDownRight', 'eyeSquintLeft', 'eyeSquintRight', 'mouthFrown', 'jawForward'],
                        surprised: ['eyeWideLeft', 'eyeWideRight', 'browUpLeft', 'browUpRight', 'jawOpen', 'mouthOpen'],
                        thinking: ['eyeSquintLeft', 'browUpRight', 'mouthPucker'],
                        neutral: []
                    };

                    const targetMorphs = emotionMorphs[emotion] || emotionMorphs.neutral;

                    // Apply morph targets to model
                    this.model.traverse((child) => {
                        if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                            // Reset all morphs first
                            child.morphTargetInfluences.fill(0);

                            // Apply emotion morphs
                            targetMorphs.forEach(morphName => {
                                const index = child.morphTargetDictionary[morphName];
                                if (index !== undefined) {
                                    child.morphTargetInfluences[index] = 0.7;
                                }
                            });
                        }
                    });

                    console.log(`🎭 Hologram emotion set: ${emotion}`);
                }
            };

            // =====================================================================
            // EMOTION DETECTOR - Analyze text and detect emotion
            // =====================================================================
            const EmotionDetector = {
                // Keywords for emotion detection
                patterns: {
                    happy: ['bun', 'excelent', 'perfect', 'frumos', 'super', 'minunat', 'fantastic', 'bucuros', 'fericit',
                        'good', 'great', 'excellent', 'wonderful', 'amazing', 'happy', 'glad', 'pleased', '😊', '😄', '🎉', '👍'],
                    sad: ['trist', 'rău', 'păcat', 'din păcate', 'regret', 'scuze', 'îmi pare rău',
                        'sad', 'sorry', 'unfortunately', 'regret', 'apologize', '😢', '😔', '💔'],
                    angry: ['greșit', 'incorect', 'eroare', 'nu se poate', 'blocat', 'interzis',
                        'error', 'wrong', 'invalid', 'blocked', 'forbidden', 'cannot', '😠', '❌'],
                    surprised: ['wow', 'uimitor', 'incredibil', 'serios', 'nu-mi vine să cred', 'impresionant',
                        'amazing', 'incredible', 'unbelievable', 'seriously', 'wow', '😮', '🤯', '!'],
                    thinking: ['hmm', 'interesant', 'lasă-mă să gândesc', 'procesez', 'analizez', 'caut',
                        'thinking', 'processing', 'analyzing', 'searching', 'let me', 'consider', '🤔']
                },

                detect: function (text) {
                    const lowerText = (text || '').toLowerCase();

                    // Check each emotion pattern
                    for (const [emotion, keywords] of Object.entries(this.patterns)) {
                        for (const keyword of keywords) {
                            if (lowerText.includes(keyword.toLowerCase())) {
                                return emotion;
                            }
                        }
                    }

                    // Default to neutral
                    return 'neutral';
                },

                // Apply detected emotion to hologram
                applyToHologram: function (text) {
                    const emotion = this.detect(text);
                    if (window.HologramSystem) {
                        window.HologramSystem.setEmotion(emotion);
                    }
                    return emotion;
                }
            };

            // Expose EmotionDetector globally
            window.EmotionDetector = EmotionDetector;

            // Initialize hologram when page ready
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    HologramSystem.init();
                }, 2000); // Wait for loading screen
            });

            // Expose to global for voice integration
            window.HologramSystem = HologramSystem;

            // =====================================================================
            // ACCESSIBILITY: Subtitle System for Hearing Impaired
            // =====================================================================
            const SubtitleSystem = {
                isOpen: false,
                currentLang: 'EN',

                init: function () {
                    const btn = document.getElementById('accessibility-btn');
                    const box = document.getElementById('subtitle-box');

                    if (!btn || !box) return;

                    btn.addEventListener('click', () => this.toggle());

                    // Load saved preference
                    const saved = localStorage.getItem('subtitles_enabled');
                    if (saved === 'true') {
                        this.open();
                    }

                    console.log('✅ Subtitle System initialized');
                },

                toggle: function () {
                    if (this.isOpen) {
                        this.close();
                    } else {
                        this.open();
                    }
                },

                open: function () {
                    this.isOpen = true;
                    document.getElementById('accessibility-btn')?.classList.add('active');
                    document.getElementById('subtitle-box')?.classList.add('active');
                    localStorage.setItem('subtitles_enabled', 'true');
                },

                close: function () {
                    this.isOpen = false;
                    document.getElementById('accessibility-btn')?.classList.remove('active');
                    document.getElementById('subtitle-box')?.classList.remove('active');
                    localStorage.setItem('subtitles_enabled', 'false');
                },

                // Main method to show subtitles - call this when AI speaks
                showText: function (text, lang = 'EN') {
                    const subtitleText = document.getElementById('subtitle-text');
                    const subtitleLang = document.getElementById('subtitle-lang');

                    if (!subtitleText) return;

                    this.currentLang = lang.toUpperCase();
                    if (subtitleLang) {
                        subtitleLang.textContent = this.currentLang;
                    }

                    // Animate text appearance
                    subtitleText.classList.add('speaking');
                    subtitleText.textContent = text;

                    // Auto-scroll to bottom
                    subtitleText.scrollTop = subtitleText.scrollHeight;
                },

                // Clear subtitles when speech ends
                clear: function () {
                    const subtitleText = document.getElementById('subtitle-text');
                    if (subtitleText) {
                        subtitleText.classList.remove('speaking');
                    }
                },

                // Append text (for streaming responses)
                appendText: function (text) {
                    const subtitleText = document.getElementById('subtitle-text');
                    if (subtitleText) {
                        subtitleText.textContent += text;
                        subtitleText.scrollTop = subtitleText.scrollHeight;
                    }
                }
            };

            // Initialize subtitle system
            document.addEventListener('DOMContentLoaded', () => {
                SubtitleSystem.init();
            });

            // Expose to global for integration
            window.SubtitleSystem = SubtitleSystem;

            // =====================================================================
            // v143.0: NEW INTERFACE LOGIC
            // =====================================================================

            // 1. USAGE TIMER & TRIAL TRACKING
            async function updateUsage() {
                try {
                    const response = await fetch(`/api/usage?username=${encodeURIComponent(state.user)}`);
                    if (!response.ok) return;
                    const data = await response.json();

                    const timerEl = $('remaining-time');
                    if (timerEl) {
                        if (data.type === 'paid') {
                            timerEl.textContent = "Unlimited Access";
                            $('usage-timer').classList.remove('low-time');
                        } else {
                            const minutes = Math.floor(data.remaining_seconds / 60);
                            const seconds = data.remaining_seconds % 60;
                            timerEl.textContent = `${minutes}m ${seconds}s left`;

                            if (minutes < 5) {
                                $('usage-timer').classList.add('low-time');
                            } else {
                                $('usage-timer').classList.remove('low-time');
                            }
                        }
                    }
                } catch (err) { console.warn("Usage check failed"); }
            }

            // 2. THEME TOGGLE
            function toggleTheme() {
                document.body.classList.toggle('light-theme');
                const isLight = document.body.classList.contains('light-theme');
                const icon = $('theme-toggle').querySelector('i');
                if (icon) {
                    icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
                }
                localStorage.setItem('kelion-theme', isLight ? 'light' : 'dark');
            }

            // 3. EXPORT CONVERSATION
            function exportChat() {
                const messages = Array.from(document.querySelectorAll('.message')).map(m => {
                    const who = m.classList.contains('user') ? 'USER' : 'KELION';
                    return `[${who}] ${m.textContent}`;
                }).join('\n\n');

                const blob = new Blob([`KELION AI v143.0 - CONVERSATION LOG\nDate: ${new Date().toLocaleString()}\n\n${messages}`], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `kelion_log_${new Date().toISOString().slice(0, 10)}.txt`;
                a.click();
                URL.revokeObjectURL(url);
            }

            // 5. SOUND EFFECTS
            function playNotificationSound() {
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(880, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.1);
                } catch (e) { /* Audio fallback */ }
            }

            // 6. PERSONALIZED WELCOME
            async function personalizedWelcome() {
                const welcomeMsg = state.user !== "N/A"
                    ? `Welcome back, ${state.user}. Neural link stable. How can I assist you today?`
                    : `Neural link initiated. I am KELION v143.0. Awaiting your command.`;

                setTimeout(() => {
                    write('bot', welcomeMsg);
                    speak(welcomeMsg);
                }, 1000);
            }

            // 7. INITIALIZATION & LISTENERS
            document.addEventListener('DOMContentLoaded', () => {
                SubtitleSystem.init();

                // Check saved theme
                if (localStorage.getItem('kelion-theme') === 'light') {
                    toggleTheme();
                }

                // Keyboard Shortcuts
                $('chat-input').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') execute();
                });

                // ESC to close modals
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        const modals = ['login-modal', 'forgot-modal', 'traffic-modal', 'admin-modal'];
                        modals.forEach(m => { if ($(m)) $(m).style.display = 'none'; });
                    }
                });

                // Control Listeners
                $('theme-toggle').addEventListener('click', toggleTheme);
                if ($('export-btn')) $('export-btn').addEventListener('click', exportChat);

                // Start Usage Polling
                updateUsage();
                setInterval(updateUsage, 30000);

                // Trigger Welcome
                personalizedWelcome();
            });