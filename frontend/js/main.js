function logMessage(sender, text) {
    const log = document.getElementById("chatLog");
    if (log) {
        const p = document.createElement("p");
        p.innerHTML = `<b>${sender}:</b> ${text}`;
        log.appendChild(p);
        log.scrollTop = log.scrollHeight;
    }
}

async function handleUserInput(text) {
    if (!text) return;
    logMessage("Tu", text);

    // Auto detect and set language
    const lang = detectLanguage(text);
    setLanguage(lang);

    setEmotion("thinking");
    updateHUD("ANALYZING NEURAL PATTERNS...");
    NeuralMap.addNode(text.substring(0, 15));

    // Get response from brain
    const data = await think(text);

    if (data.confidence) {
        document.body.classList.add("prime-mode");
        showConfidence(data.confidence);
    } else {
        document.body.classList.remove("prime-mode");
        document.getElementById("confidence-container").style.display = "none";
    }

    setEmotion(data.emotion || "neutral");
    updateHUD(`MOOD: ${(data.emotion || "NEUTRAL").toUpperCase()}`);

    // Update Synchrony & Thoughts
    const syncFill = document.getElementById("sync-fill");
    if (syncFill) updateSync(data.sync || 80);

    const thoughtLog = document.getElementById("thought-log");
    if (thoughtLog) showThoughts(data.emotion);

    logMessage("Nexus", data.reply);
    NeuralMap.addNode("NEXUS: " + (data.emotion || "sync"), "#bc13fe");
    speak(data.reply, lang);

    if (data.facts) updateFacts(data.facts);
}

function updateSync(value) {
    const fill = document.getElementById("sync-fill");
    if (fill) fill.style.width = `${value}%`;
}

function showConfidence(value) {
    const container = document.getElementById("confidence-container");
    const fill = document.getElementById("confidence-fill");
    if (container && fill) {
        container.style.display = "block";
        fill.style.width = `${value}%`;
    }
}

function showThoughts(mood) {
    const log = document.getElementById("thought-log");
    if (!log) return;
    const thoughts = {
        "happy": "Analyzing positive reinforcement... Alignment confirmed.",
        "sad": "Empathy module engaged... Synchronizing emotional wave.",
        "analytical": "Deep processing active... Optimizing logic flow.",
        "neutral": "Neural stream stable. Waiting for input..."
    };
    log.innerText = `nexus_brain: ${thoughts[mood] || thoughts.neutral}`;
}

function updateFacts(facts) {
    const list = document.getElementById("facts-list");
    if (!list) return;
    list.innerHTML = "";
    Object.values(facts).forEach(fact => {
        const div = document.createElement("div");
        div.className = "fact-item";
        div.innerText = fact;
        list.appendChild(div);
    });
}

function updateHUD(status) {
    const h2 = document.querySelector("#hud h2");
    if (h2) h2.innerText = `NEXUS | ${status}`;
}

// Wake word and general listener
recognition.onresult = (event) => {
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("Detected:", text);

    if (text.includes("hey nexus") || text.includes("salut nexus") || text.includes("nexus")) {
        speak("Te ascult, sistemul este activ.");
        setEmotion("happy");
        updateHUD("LISTENING...");
    } else if (text.includes("pune muzică") || text.includes("radio")) {
        if (text.includes("lofi")) NexusMedia.play("lofi");
        else if (text.includes("jazz")) NexusMedia.play("jazz");
        else if (text.includes("rock")) NexusMedia.play("rock");
        else NexusMedia.play("lofi");
    } else if (text.includes("stop muzică") || text.includes("oprește muzica")) {
        NexusMedia.stop();
    } else if (text.includes("vremea") || text.includes("temperatura")) {
        NexusNet.getWeather();
    } else if (text.includes("știri") || text.includes("news")) {
        NexusNet.getNews();
    } else if (text.includes("creează") || text.includes("idei") || text.includes("imaginează")) {
        const topic = text.replace(/creează|idei|imaginează|despre/g, "").trim() || "viitorul tehnologiei";
        NexusCreative.generateIdea(topic);
    } else if (text.includes("mod fantasmă") || text.includes("ghost mode")) {
        toggleGhostMode();
    } else if (text.includes("antrenament") || text.includes("train")) {
        startTrainingMode();
    } else if (text.includes("protocol omega") || text.includes("securitate")) {
        activateGuardianMode();
    } else {
        handleUserInput(text);
    }
};

function activateGuardianMode() {
    speak("Am recepționat. Inițiez Protocolul Omega. Sistemul intră în mod de securitate maximă.");
    document.body.classList.add("guardian-mode");
    setEmotion("surprised");
    updateHUD("PROTOCOL OMEGA ACTIVE");

    setTimeout(() => {
        const pass = prompt("INTRODUCEȚI CODUL DE ACCES (OMEGA-1):");
        if (pass === "ADRIAN-77") {
            speak("Autorizare confirmată. Bine ai venit, Arhitectule.");
            document.body.classList.remove("guardian-mode");
            updateHUD("AUTHORIZED");
            setEmotion("happy");
        } else {
            speak("Eroare de autorizare. Sistemul rămâne blocat.");
            updateHUD("SECURITY BREACH DETECTED");
        }
    }, 2000);
}

function toggleGhostMode() {
    document.body.classList.toggle("ghost-mode");
    const active = document.body.classList.contains("ghost-mode");
    speak(active ? "Am activat modul fantasmă. Imersiune totală." : "Revin la interfața HUD standard.");
    if (active) {
        setTimeout(() => { if (document.body.classList.contains("ghost-mode")) toggleGhostMode(); }, 10000); // Auto-revert or stay
    }
}

function startTrainingMode() {
    const notice = document.createElement("div");
    notice.className = "training-notice";
    notice.innerText = "NEURAL TRAINING ACTIVE";
    document.body.appendChild(notice);

    speak("Am deschis canalele de învățare. Tot ceea ce îmi spui acum va fi integrat în nucleul meu de personalitate.");
    setEmotion("surprised");

    setTimeout(() => notice.remove(), 5000);
}

document.addEventListener("DOMContentLoaded", () => {
    const sendBtn = document.getElementById("sendBtn");
    const chatInput = document.getElementById("chatInput");

    if (sendBtn && chatInput) {
        sendBtn.onclick = () => {
            handleUserInput(chatInput.value);
            chatInput.value = "";
        };

        chatInput.onkeypress = (e) => {
            if (e.key === "Enter") {
                handleUserInput(chatInput.value);
                chatInput.value = "";
            }
        };
    }



    // Initial greeting
    logMessage("Nexus", "Sistem activ. Sunt gata să comunicăm.");
    startListening();
    startSystemLoop();
    startProactivePulse();
    NeuralMap.init();
});

function startProactivePulse() {
    // Nexus va spune ceva de la sine la fiecare 2 minute de inactivitate
    let idleTime = 0;

    document.addEventListener("mousemove", () => idleTime = 0);
    document.addEventListener("keypress", () => idleTime = 0);

    setInterval(async () => {
        idleTime++;
        if (idleTime >= 120) { // 2 minute
            const context = await Environment.getContext();
            const prompt = `Salutare. Este o ${context.timeOfDay} liniștită. Sistemele mele rulează optim. Ai nevoie de ceva special?`;

            logMessage("Nexus", `[PROACTIVE] ${prompt}`);
            speak(prompt);
            setEmotion("happy");
            idleTime = 0;
        }
    }, 1000);
}

function startSystemLoop() {
    const canvas = document.getElementById("visualizer");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    setInterval(() => {
        const time = new Date().toLocaleTimeString();
        const sysInfo = document.getElementById("sys-info");
        if (sysInfo) {
            sysInfo.innerHTML = `<span>TIME: ${time}</span> | <span>BIOMETRICS: ACTIVE</span> | <span>LINK: STABLE</span>`;
        }
        if (ctx) drawVisualizer(ctx, canvas);
    }, 50);
}

function drawVisualizer(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#bc13fe";
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = canvas.width / 20;
    let x = 0;

    for (let i = 0; i < 20; i++) {
        const v = Math.random() * (speechSynthesis.speaking ? 50 : 10);
        const y = canvas.height / 2 + (i % 2 === 0 ? v : -v);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
    }

    ctx.stroke();
}
