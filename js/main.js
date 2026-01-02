"use strict";



// \u1f511 API CONFIGURATION - All API calls routed through Flask backend

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



// \u1f4dd CHAT SYSTEM

function write(who, text, isError = false) {

    const msg = document.createElement('div');

    msg.className = `message ${who} ${isError ? 'error' : ''}`;

    msg.textContent = text;

    $('chat-messages').appendChild(msg);

    $('chat-messages').scrollTop = $('chat-messages').scrollHeight;



    // \u1f50a Sound Effect for bot messages

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



// \u1f310 REAL-TIME WEB SEARCH (via Backend /api/search)

async function searchWeb(query) {

    console.log(`\u1f310 Searching web via backend for: ${query}`);

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



        return "\u1f310 LIVE WEB SEARCH RESULTS:\n" + results.join("\n\n");



    } catch (err) {

        console.error("Web Search Error:", err);

        return "Error: Could not connect to search service.";

    }

}



// \u1f3a4 VOICE SYSTEM (OPENAI TTS)

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





// \u1f9e0 AI PROCESSOR (INTELLIGENT RESOLVER v142 + WEB SEARCH via Backend)

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

        // 🎭 START HOLOGRAM PROCESSING MODE
        activateHologramResponse('Processing your request...', 'processing');



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



        // 🎭 HOLOGRAM WILL SWITCH TO SPEAKING MODE WHEN RESPONSE IS READY



        if (!response.ok) throw new Error("Chat API Error");



        const data = await response.json();



        // Hide typing indicator

        if (typingInd) typingInd.style.display = 'none';



        // ===== CHECK IF USER IS BLOCKED =====

        if (data.blocked) {

            thinking.remove();

            const blockedMsg = data.message || "Your access has expired. Please subscribe to continue.";

            write('bot', `\u26a0\ufe0f ${blockedMsg}`);

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

            // 🎭 ACTIVATE FULL HOLOGRAM RESPONSE - ALL FUNCTIONS
            activateHologramResponse(reply, 'speaking');

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



// =============================================================================
// 🎤 GREETING SYSTEM - Synchronized with Hologram Appearance
// =============================================================================

/**
 * Wait for AI_key (hologram) to be fully loaded
 * @returns {Promise} Resolves when AI_key is ready
 */
function waitForHologram(maxWaitMs = 5000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (window.aiKeyEntity || (Date.now() - startTime > maxWaitMs)) {
                clearInterval(checkInterval);
                resolve(!!window.aiKeyEntity);
            }
        }, 100);
    });
}

/**
 * Show welcome message for visitors (before login)
 * Synchronized with hologram appearance
 */
async function showKelionaiWelcome() {
    console.log('🎤 Showing KELIONAI welcome message...');

    // Wait for hologram to be ready
    await waitForHologram();

    const welcomeMsg = "Welcome to KELION AI. Please login to access the neural interface.";

    // 🎭 ACTIVATE FULL HOLOGRAM FOR WELCOME
    activateHologramResponse(welcomeMsg, 'speaking');

    // Write to chat
    write('bot', welcomeMsg);

    // Speak the message
    speak(welcomeMsg);
}

/**
 * Greet user after successful login
 * Synchronized with hologram + shows last conversation or personalized greeting
 * @param {string} username - The logged in username
 */
async function greetUser(username) {
    console.log(`🎤 Greeting user: ${username}`);

    // Wait for hologram to be ready
    const hologramReady = await waitForHologram();

    // Determine time-based greeting
    const hour = new Date().getHours();
    let timeGreeting = "Hello";
    if (hour >= 5 && hour < 12) {
        timeGreeting = "Good morning";
    } else if (hour >= 12 && hour < 18) {
        timeGreeting = "Good afternoon";
    } else {
        timeGreeting = "Good evening";
    }

    // Try to fetch last conversation from backend
    let greetingText = `${timeGreeting}, ${username}! I'm KELION, your AI assistant. How can I help you today?`;

    try {
        const response = await fetch('/api/last-conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.last_message) {
                // Personalized greeting with context
                greetingText = `${timeGreeting}, ${username}! Welcome back. Last time we talked about: "${data.last_message.substring(0, 50)}..." How can I continue to assist you?`;
            }
        }
    } catch (err) {
        console.log('Could not fetch last conversation, using default greeting');
    }

    // 🎭 ACTIVATE FULL HOLOGRAM FOR GREETING
    activateHologramResponse(greetingText, 'speaking');

    // Write to chat
    write('bot', greetingText);

    // Speak the message
    speak(greetingText);

    // Focus on input for immediate typing
    setTimeout(() => {
        const chatInput = $('chat-input');
        if (chatInput) chatInput.focus();
    }, 500);
}


// =============================================================================
// 🎭 HOLOGRAM FULL ACTIVATION - APLICĂ TOATE FUNCȚIILE LA FIECARE RĂSPUNS
// =============================================================================

/**
 * Activates ALL hologram functions for a response
 * This should be called EVERY time the AI responds
 * @param {string} text - The response text
 * @param {string} mode - 'speaking' | 'processing' | 'listening' | 'calm'
 */
function activateHologramResponse(text, mode = 'speaking') {
    // Ensure hologram-container is always visible
    const container = document.getElementById('hologram-container');
    if (container) {
        container.style.display = 'block';
        container.style.opacity = '1';
        container.style.visibility = 'visible';
    }

    // Use AI_key if available (plasma sphere)
    if (window.aiKeyEntity) {
        const hologram = window.aiKeyEntity;

        switch (mode) {
            case 'processing':
                // AI is thinking - show processing animation
                hologram.process();
                hologram.intensify();
                break;

            case 'listening':
                // Microphone is active
                hologram.listen();
                break;

            case 'speaking':
                // AI is responding
                // 1. Stop any processing animation
                if (hologram.stopProcessing) hologram.stopProcessing();

                // 2. Detect emotion from text and apply it
                if (window.EmotionDetector) {
                    const emotion = window.EmotionDetector.detect(text);
                    hologram.setEmotion(emotion);
                }

                // 3. Calculate speech duration based on text length
                const wordsPerSecond = 2.5; // Average speaking speed
                const wordCount = text.split(/\s+/).length;
                const duration = Math.max(3000, Math.min(15000, (wordCount / wordsPerSecond) * 1000));

                // 4. Activate speaking animation
                hologram.speak(text, duration);
                break;

            case 'calm':
            default:
                // Return to idle state
                hologram.calm();
                break;
        }

        console.log(`🎭 Hologram activated: mode=${mode}, text=${text.substring(0, 30)}...`);
        return true;
    }

    // Fallback to HologramSystem if AI_key not available
    if (window.HologramSystem) {
        const hologram = window.HologramSystem;

        switch (mode) {
            case 'processing':
                hologram.startProcessing();
                hologram.setColor('processing');
                break;

            case 'speaking':
                hologram.stopProcessing();
                hologram.startSpeaking();
                hologram.setColor('speaking');

                // Apply emotion
                if (window.EmotionDetector) {
                    window.EmotionDetector.applyToHologram(text);
                }
                break;

            case 'calm':
            default:
                hologram.stopSpeaking();
                hologram.stopProcessing();
                hologram.setColor('default');
                break;
        }

        console.log(`🎭 HologramSystem activated: mode=${mode}`);
        return true;
    }

    console.warn('⚠️ No hologram system available');
    return false;
}

/**
 * Stop all hologram animations and return to calm state
 */
function deactivateHologram() {
    if (window.aiKeyEntity) {
        window.aiKeyEntity.calm();
        if (window.aiKeyEntity.stopProcessing) {
            window.aiKeyEntity.stopProcessing();
        }
    }

    if (window.HologramSystem) {
        window.HologramSystem.stopSpeaking();
        window.HologramSystem.stopProcessing();
        window.HologramSystem.setColor('default');
    }
}

/**
 * Ensure hologram is visible on page resize
 */
function ensureHologramVisible() {
    const container = document.getElementById('hologram-container');
    if (container) {
        container.style.display = 'block';
        container.style.opacity = '1';
        container.style.visibility = 'visible';
    }
}

// Add resize listener to ensure hologram visibility
window.addEventListener('resize', ensureHologramVisible);
window.addEventListener('orientationchange', ensureHologramVisible);

// Ensure hologram is visible on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(ensureHologramVisible, 100);
    setTimeout(ensureHologramVisible, 2000); // Also after hologram loads
});

// \u1f30c BACKGROUND PARTICLES

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



// \u1f680 INITIALIZATION

document.addEventListener('DOMContentLoaded', () => {

    // \u1f512 SECURITY: Sesiune persistenta v143 (Architect Override)

    // localStorage.clear(); // Dezactivat pentru a permite Personalizare / Welcome back

    // sessionStorage.clear();



    // \u1f680 NEURAL INITIALIZATION SEQUENCE

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



            // \u1f5e3\ufe0f Play welcome message AFTER robot appears (always visitor since we clear session)

            setTimeout(() => {

                showKelionaiWelcome();

            }, 1500); // 1.5s after robot appears

        }, 1000);

    };



    initSequence();



    // \u1f513 PRE-POPULATE DEMO CREDENTIALS

    $('u-input').value = "demo";

    $('p-input').value = "demo123";



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



    // \u2699\ufe0f LOGIN HANDLERS

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

            $('p-input').value = 'demo123';



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

            alert("\u26a0\ufe0f Please enter both Architect ID and Security Key.");

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



                // \u1f550 USAGE TIMER - Fetch and display remaining time

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



                // \u1f5e3\ufe0f GREETING AFTER LOGIN

                greetUser(state.user);

            } else {

                alert("\u26a0\ufe0f ACCESS DENIED: " + (data.error || "Invalid Credentials"));

            }

        } catch (err) {

            console.error("Login Error:", err);

            alert("\u26a0\ufe0f CONNECTION ERROR: Neural core unreachable.");

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



    // \u1f399\ufe0f VOICE RECOGNITION (WHISPER)

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

                    micBtn.innerHTML = "\u1f534";

                    micBtn.style.color = "#f00";

                    micBtn.style.textShadow = "0 0 15px #f00";

                    $('chat-input').placeholder = "Listening... (Release to Send)";

                };



                mediaRecorder.onstop = async () => {

                    isRecording = false; // Reset state immediately



                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });



                    // Visual: Processing

                    $('chat-input').placeholder = "Transcribing & Sending...";

                    micBtn.innerHTML = "\u23f3";

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

                    micBtn.innerHTML = "\u1f3a4";

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



    // \u1f313 THEME TOGGLE

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



    // \u1f4e5 EXPORT CONVERSATION

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



    // \u267f HIGH CONTRAST TOGGLE

    const contrastBtn = document.getElementById('contrast-toggle');

    if (contrastBtn) {

        // Check saved preference

        if (localStorage.getItem('kelion_contrast') === 'high') {

            document.body.classList.add('high-contrast');

            contrastBtn.textContent = '\u267f Normal';

        }



        contrastBtn.onclick = () => {

            document.body.classList.toggle('high-contrast');

            const isHigh = document.body.classList.contains('high-contrast');

            contrastBtn.textContent = isHigh ? '\u267f Normal' : '\u267f HC';

            localStorage.setItem('kelion_contrast', isHigh ? 'high' : 'normal');

        };

    }


    // ==========================================================================
    // 📝 REGISTRATION SYSTEM - Multi-Step Flow with Email Verification
    // ==========================================================================

    // Registration state
    const regState = {
        emailVerified: false,
        verifiedEmail: '',
        currentStep: 1,
        paymentMethod: 'voucher' // 'voucher' or 'payment'
    };

    // Step navigation helper
    function gotoRegStep(stepNum) {
        $('reg-step-1').style.display = stepNum === 1 ? 'block' : 'none';
        $('reg-step-2').style.display = stepNum === 2 ? 'block' : 'none';
        $('reg-step-3').style.display = stepNum === 3 ? 'block' : 'none';

        // Update progress dots
        $('step-1-dot').style.background = stepNum >= 1 ? 'var(--pink)' : 'rgba(255,255,255,0.2)';
        $('step-2-dot').style.background = stepNum >= 2 ? 'var(--pink)' : 'rgba(255,255,255,0.2)';
        $('step-3-dot').style.background = stepNum >= 3 ? 'var(--pink)' : 'rgba(255,255,255,0.2)';

        regState.currentStep = stepNum;
    }

    // Open register modal from login
    const openRegisterLink = document.getElementById('register-link');
    if (openRegisterLink) {
        openRegisterLink.onclick = (e) => {
            e.preventDefault();
            $('login-modal').style.display = 'none';
            $('register-modal').style.display = 'flex';
            gotoRegStep(1); // Reset to step 1
            regState.emailVerified = false;
        };
    }

    // Back to login
    const registerBackLink = $('register-back-link');
    if (registerBackLink) {
        registerBackLink.onclick = (e) => {
            e.preventDefault();
            $('register-modal').style.display = 'none';
            $('login-modal').style.display = 'flex';
        };
    }

    // STEP 1: Send verification code
    const sendVerifyBtn = $('send-verify-code');
    if (sendVerifyBtn) {
        sendVerifyBtn.onclick = async () => {
            const email = $('reg-email').value.trim();

            if (!email || !email.includes('@')) {
                alert('⚠️ Please enter a valid email address.');
                return;
            }

            sendVerifyBtn.textContent = 'SENDING...';
            sendVerifyBtn.disabled = true;

            try {
                const response = await fetch('/api/send-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, type: 'registration' })
                });

                const data = await response.json();

                if (data.success) {
                    $('verify-code-section').style.display = 'block';
                    sendVerifyBtn.textContent = 'CODE SENT ✓';
                    sendVerifyBtn.style.background = '#00ff00';
                    sendVerifyBtn.style.color = '#000';
                    regState.verifiedEmail = email;
                } else {
                    alert('⚠️ ' + (data.error || 'Failed to send code'));
                    sendVerifyBtn.textContent = 'SEND VERIFICATION CODE';
                    sendVerifyBtn.disabled = false;
                }
            } catch (err) {
                console.error('Send code error:', err);
                alert('⚠️ Connection error. Please try again.');
                sendVerifyBtn.textContent = 'SEND VERIFICATION CODE';
                sendVerifyBtn.disabled = false;
            }
        };
    }

    // STEP 1: Verify code
    const verifyEmailBtn = $('verify-email-btn');
    if (verifyEmailBtn) {
        verifyEmailBtn.onclick = async () => {
            const code = $('reg-verify-code').value.trim();
            const email = regState.verifiedEmail;

            if (!code || code.length !== 6) {
                alert('⚠️ Please enter the 6-digit code.');
                return;
            }

            verifyEmailBtn.textContent = 'VERIFYING...';
            verifyEmailBtn.disabled = true;

            try {
                const response = await fetch('/api/verify-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, code: code })
                });

                const data = await response.json();

                if (data.success) {
                    regState.emailVerified = true;
                    gotoRegStep(2); // Proceed to step 2
                } else {
                    alert('⚠️ ' + (data.error || 'Invalid code'));
                    verifyEmailBtn.textContent = 'VERIFY EMAIL';
                    verifyEmailBtn.disabled = false;
                }
            } catch (err) {
                console.error('Verify code error:', err);
                alert('⚠️ Connection error. Please try again.');
                verifyEmailBtn.textContent = 'VERIFY EMAIL';
                verifyEmailBtn.disabled = false;
            }
        };
    }

    // STEP 2: Continue to payment
    const gotoStep3Btn = $('goto-step-3');
    if (gotoStep3Btn) {
        gotoStep3Btn.onclick = () => {
            // Validate required fields
            const firstname = $('reg-firstname').value.trim();
            const lastname = $('reg-lastname').value.trim();
            const password = $('reg-password').value;
            const phone = $('reg-phone').value.trim();
            const country = $('reg-country').value;
            const address = $('reg-address').value.trim();
            const city = $('reg-city').value.trim();
            const postal = $('reg-postal').value.trim();

            if (!firstname || !lastname) {
                alert('⚠️ First name and last name are required.');
                return;
            }
            if (!password || password.length < 8) {
                alert('⚠️ Password must be at least 8 characters.');
                return;
            }
            if (!phone) {
                alert('⚠️ Phone number is required.');
                return;
            }
            if (!address || !city || !postal) {
                alert('⚠️ Full address (street, city, postal code) is required.');
                return;
            }

            gotoRegStep(3);
        };
    }

    // STEP 3: Toggle between voucher and payment
    const toggleVoucherBtn = $('toggle-voucher');
    const togglePaymentBtn = $('toggle-payment');
    const voucherSection = $('voucher-section');
    const paymentSection = $('payment-section');

    if (toggleVoucherBtn) {
        toggleVoucherBtn.onclick = () => {
            regState.paymentMethod = 'voucher';
            voucherSection.style.display = 'block';
            paymentSection.style.display = 'none';
            toggleVoucherBtn.style.background = 'rgba(0,255,0,0.4)';
            togglePaymentBtn.style.background = 'rgba(255,0,255,0.2)';
        };
    }

    if (togglePaymentBtn) {
        togglePaymentBtn.onclick = () => {
            regState.paymentMethod = 'payment';
            voucherSection.style.display = 'none';
            paymentSection.style.display = 'block';
            toggleVoucherBtn.style.background = 'rgba(0,255,0,0.2)';
            togglePaymentBtn.style.background = 'rgba(255,0,255,0.4)';

            // Note: PayPal SDK should be loaded here if needed
            // For now, registration will proceed without pay
        };
    }

    // STEP 3: Final registration
    const doRegisterBtn = $('do-register');
    if (doRegisterBtn) {
        doRegisterBtn.onclick = async () => {
            const regStatus = $('reg-status');

            // Verify email was completed
            if (!regState.emailVerified) {
                alert('⚠️ Please verify your email first (Step 1).');
                gotoRegStep(1);
                return;
            }

            // Collect all data
            const regData = {
                email: regState.verifiedEmail,
                password: $('reg-password').value,
                first_name: $('reg-firstname').value.trim(),
                last_name: $('reg-lastname').value.trim(),
                phone: $('reg-phone').value.trim(),
                country: $('reg-country').value,
                address: $('reg-address').value.trim(),
                city: $('reg-city').value.trim(),
                postal_code: $('reg-postal').value.trim(),
                subscription: 'basic'
            };

            // Check payment method
            if (regState.paymentMethod === 'voucher') {
                const voucherCode = $('reg-voucher').value.trim().toUpperCase();
                if (!voucherCode) {
                    alert('⚠️ Please enter a voucher code or switch to payment.');
                    return;
                }
                regData.voucher_code = voucherCode;
            } else {
                // Payment selected - get selected plan
                const selectedPlan = document.querySelector('input[name="plan"]:checked');
                if (selectedPlan) {
                    regData.subscription = selectedPlan.value;
                }
                // Note: PayPal integration would add paypal_order_id here
            }

            doRegisterBtn.textContent = 'CREATING ACCOUNT...';
            doRegisterBtn.disabled = true;
            if (regStatus) regStatus.textContent = '';

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(regData)
                });

                const data = await response.json();

                if (data.success) {
                    if (regStatus) {
                        regStatus.style.color = '#00ff00';
                        regStatus.textContent = '✅ Account created! You can now login.';
                    }

                    // Auto-fill login form
                    $('u-input').value = data.username || regData.email.split('@')[0];
                    $('p-input').value = regData.password;

                    // Switch to login after 2 seconds
                    setTimeout(() => {
                        $('register-modal').style.display = 'none';
                        $('login-modal').style.display = 'flex';
                        alert('🎉 Welcome to KELION AI! Please login with your new account.');
                    }, 2000);
                } else {
                    if (regStatus) {
                        regStatus.style.color = '#ff4444';
                        regStatus.textContent = '❌ ' + (data.error || 'Registration failed');
                    }
                    doRegisterBtn.textContent = 'CREATE ACCOUNT';
                    doRegisterBtn.disabled = false;
                }
            } catch (err) {
                console.error('Registration error:', err);
                if (regStatus) {
                    regStatus.style.color = '#ff4444';
                    regStatus.textContent = '❌ Connection error. Please try again.';
                }
                doRegisterBtn.textContent = 'CREATE ACCOUNT';
                doRegisterBtn.disabled = false;
            }
        };
    }


    // ==========================================================================
    // 🛡️ ADMIN PANEL - Full Control (only for admin user)
    // ==========================================================================

    // Open admin panel (only if admin)
    const trafficBtn = $('traffic-btn');
    if (trafficBtn) {
        trafficBtn.onclick = () => {
            if (!state.isAdmin) {
                alert('⛔ ACCESS DENIED: Admin privileges required.');
                return;
            }
            $('admin-modal').style.display = 'flex';
            loadAdminData();
        };
    }

    // Close admin panel
    const closeAdminBtn = $('close-admin');
    if (closeAdminBtn) {
        closeAdminBtn.onclick = () => {
            $('admin-modal').style.display = 'none';
        };
    }

    // Admin tab switching
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.onclick = () => {
            const tabName = tab.getAttribute('data-tab');

            // Update tab styles
            document.querySelectorAll('.admin-tab').forEach(t => {
                t.style.background = 'rgba(255,255,255,0.1)';
                t.style.color = '#fff';
                t.style.fontWeight = 'normal';
            });
            tab.style.background = 'var(--pink)';
            tab.style.color = '#000';
            tab.style.fontWeight = 'bold';

            // Show selected content
            document.querySelectorAll('.admin-content').forEach(c => c.style.display = 'none');
            $('admin-' + tabName).style.display = 'block';
        };
    });

    // Load admin data
    async function loadAdminData() {
        // Load users
        try {
            const usersRes = await fetch('/api/admin/users', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('kelion_token') || ''}` }
            });
            if (usersRes.ok) {
                const data = await usersRes.json();
                if (data.users) {
                    const tbody = $('users-list');
                    tbody.innerHTML = data.users.map(u => `
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                            <td style="padding:12px;">${u.id}</td>
                            <td style="padding:12px; color:var(--cyan);">${u.username}</td>
                            <td style="padding:12px;">${u.email}</td>
                            <td style="padding:12px;"><span style="background:${u.role === 'admin' ? 'var(--pink)' : 'rgba(255,255,255,0.2)'}; padding:3px 10px; border-radius:10px; color:${u.role === 'admin' ? '#000' : '#fff'};">${u.role}</span></td>
                            <td style="padding:12px;">${u.subscription || 'free'}</td>
                            <td style="padding:12px;">${u.subscription_end || '-'}</td>
                            <td style="padding:12px;">
                                <button onclick="deleteUser(${u.id})" style="background:#ff4444; color:#fff; border:none; padding:5px 10px; border-radius:3px; cursor:pointer; font-size:0.8rem;">DELETE</button>
                            </td>
                        </tr>
                    `).join('');
                }
            }
        } catch (e) { console.log('Could not load users'); }

        // Load stats
        try {
            const statsRes = await fetch('/api/admin/stats');
            if (statsRes.ok) {
                const stats = await statsRes.json();
                $('stat-today').textContent = stats.today_visitors || 0;
                $('stat-total').textContent = stats.total_visitors || 0;
                $('stat-users').textContent = stats.total_users || 0;
                $('stat-active').textContent = stats.active_subscriptions || 0;
            }
        } catch (e) { console.log('Could not load stats'); }

        // Load vouchers
        try {
            const vouchersRes = await fetch('/api/admin/vouchers');
            if (vouchersRes.ok) {
                const data = await vouchersRes.json();
                if (data.vouchers) {
                    const tbody = $('vouchers-list');
                    tbody.innerHTML = data.vouchers.map(v => `
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                            <td style="padding:12px; font-family:monospace; color:var(--cyan);">${v.code}</td>
                            <td style="padding:12px;">${v.value_months} month(s)</td>
                            <td style="padding:12px;"><span style="background:${v.is_used ? '#ff4444' : '#00ff00'}; padding:3px 10px; border-radius:10px; color:#000;">${v.is_used ? 'USED' : 'AVAILABLE'}</span></td>
                            <td style="padding:12px;">${v.used_by || '-'}</td>
                            <td style="padding:12px;">${v.created_at || '-'}</td>
                        </tr>
                    `).join('');
                }
            }
        } catch (e) { console.log('Could not load vouchers'); }
    }

    // Generate vouchers
    const generateVouchersBtn = $('generate-vouchers');
    if (generateVouchersBtn) {
        generateVouchersBtn.onclick = async () => {
            const months = parseInt($('voucher-months').value);
            const quantity = parseInt($('voucher-quantity').value);

            generateVouchersBtn.textContent = 'GENERATING...';
            generateVouchersBtn.disabled = true;

            try {
                const res = await fetch('/api/admin/vouchers/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ months, quantity })
                });

                const data = await res.json();
                if (data.success && data.codes) {
                    $('generated-vouchers').style.display = 'block';
                    $('voucher-codes').innerHTML = data.codes.map(c =>
                        `<div style="padding:5px 0; border-bottom:1px solid rgba(255,255,255,0.1);">${c}</div>`
                    ).join('');
                    loadAdminData(); // Refresh voucher list
                } else {
                    alert('Failed to generate vouchers: ' + (data.error || 'Unknown error'));
                }
            } catch (e) {
                alert('Error generating vouchers');
            }

            generateVouchersBtn.textContent = 'GENERATE';
            generateVouchersBtn.disabled = false;
        };
    }

    // Refresh users
    const refreshUsersBtn = $('admin-refresh-users');
    if (refreshUsersBtn) {
        refreshUsersBtn.onclick = loadAdminData;
    }


    // initThreeJS(); // DISABLED - shows robot background instead

});



// Matrix effect removed - keeping clean background



// \u1f31f GREETING HELPER (After Login) - With Personalized Memory

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



// \u1f4e9 CONTACT FORM HANDLER v143

document.getElementById('ae-contact-form')?.addEventListener('submit', async function (e) {

    e.preventDefault();

    const btn = this.querySelector('button');

    const origText = btn.textContent;



    btn.textContent = '\u1f680 SENDING...';

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

            alert('\u2705 Message sent! Your ticket ID is: ' + (data.ticket_id || 'N/A'));

            document.getElementById('ae-contact-modal').classList.remove('active');

            this.reset();

        } else {

            alert('\u274c Error: ' + data.error);

        }

    } catch (err) {

        alert('\u274c Connection failed. Please try again.');

    } finally {

        btn.textContent = origText;

        btn.disabled = false;

    }

});



// \u1f31f KELIONAI WELCOME MESSAGE (Page Load)

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



    this.textContent = '\u23f3 Sending...';

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



    this.textContent = '\u1f4e7 SEND CODE';

    this.disabled = false;

});



document.getElementById('forgot-reset-btn')?.addEventListener('click', async function () {

    const email = document.getElementById('forgot-email').value.trim();

    const code = document.getElementById('forgot-code').value.trim();

    const newPass = document.getElementById('forgot-newpass').value;



    if (!code || code.length !== 6) return alert('Please enter the 6-digit code');

    if (!newPass || newPass.length < 8) return alert('Password must be at least 8 characters');



    this.textContent = '\u23f3 Resetting...';

    this.disabled = true;



    try {

        const res = await fetch('/api/reset-password', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ email, code, new_password: newPass })

        });

        const data = await res.json();



        if (data.success) {

            alert('\u2705 Password reset! You can now login.');

            document.getElementById('forgot-modal').style.display = 'none';

            document.getElementById('login-modal').style.display = 'flex';

        } else {

            alert(data.error || 'Reset failed');

        }

    } catch (e) {

        alert('Network error');

    }



    this.textContent = '\u1f513 RESET PASSWORD';

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



    this.textContent = '\u23f3 Creating...';

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



            alert('\u2705 Account created! You can now login.');

            document.getElementById('register-modal').style.display = 'none';

            document.getElementById('login-modal').style.display = 'flex';

        } else {

            alert(data.error || 'Registration failed');

        }

    } catch (e) {

        alert('Network error');

    }



    this.textContent = '\u1f680 CREATE ACCOUNT';

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

// AUTO-VERSIONING: Preia versiunea de la backend \u0219i actualizeaz\u0103 peste tot

// =====================================================================

(async function loadVersion() {

    try {

        const res = await fetch('/api/version');

        const data = await res.json();

        const version = data.version || 'v143.0';



        // Actualizeaz\u0103 toate elementele cu versiunea

        document.querySelectorAll('.version-tag, #version-tag').forEach(el => {

            el.textContent = version;

        });



        // Actualizeaz\u0103 titlul paginii

        document.title = `KELION ${version} - ${data.codename || 'GLOBAL_EYE'} OS`;



        // Actualizeaz\u0103 NEURAL INTERFACE header

        const chatHeader = document.querySelector('#chat-header span');

        if (chatHeader && chatHeader.textContent.includes('NEURAL INTERFACE')) {

            chatHeader.textContent = `NEURAL INTERFACE ${version}`;

        }



        console.log(`\u2705 Version loaded: ${version} (${data.codename})`);

    } catch (e) {

        console.log('Version API unavailable, using fallback');

    }

})();



// =====================================================================

// 3D HOLOGRAM SYSTEM - KELION AI AVATAR

// =====================================================================



// --- RESUMED MAIN LOGIC ---

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



        console.log('\u2705 Subtitle System initialized');

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



    // AE Contact Form Listener

    const contactForm = $('ae-contact-form');

    if (contactForm) {

        contactForm.addEventListener('submit', async (e) => {

            e.preventDefault();

            const btn = contactForm.querySelector('.ae-submit-btn');

            const originalText = btn.textContent;

            btn.textContent = "Sending...";

            btn.disabled = true;



            const data = {

                email: $('ae-email').value,

                name: $('ae-name').value,

                subject: $('ae-topic').value,

                message: $('ae-message').value

            };



            try {

                const res = await fetch('/api/contact', {

                    method: 'POST',

                    headers: { 'Content-Type': 'application/json' },

                    body: JSON.stringify(data)

                });

                const result = await res.json();

                if (result.success) {

                    alert("Message sent successfully!");

                    document.getElementById('ae-contact-modal').classList.remove('active');

                    contactForm.reset();

                } else {

                    alert("Error: " + (result.error || "Failed to send message"));

                }

            } catch (err) {

                console.error(err);

                alert("Network error occurred.");

            } finally {

                btn.textContent = originalText;

                btn.disabled = false;

            }

        });

    }



    // Trigger Welcome
    personalizedWelcome();

    // ==============================================================================
    // v143.0 INITIALIZATION PROTOCOL
    // ==============================================================================
    console.log("\u1f6a2 Initializing KELION v143.0 Neural Core...");

    // Initialize 3D Hologram
    if (window.HologramSystem) {
        window.HologramSystem.init();
        window.HologramSystem.animate();
        console.log("\u2705 Hologram System: ACTIVE");

        // Initialize Energy Sphere inside Hologram scene
        if (window.EnergySphere && window.HologramSystem.scene) {
            window.EnergySphere.init(window.HologramSystem.scene);
            console.log("\u2705 Energy Sphere: ACTIVE");
        }
    }

    // Initialize 3D Globe system if container exists
    if (window.GlobeSystem && document.getElementById('globe-container')) {
        window.GlobeSystem.init('globe-container');
        window.GlobeSystem.animate();
        console.log("\u2705 Globe System: ACTIVE");
    }

    // Accessibility: Initialize LipSync
    if (window.LipSyncSystem) {
        window.LipSyncSystem.init();
    }

});