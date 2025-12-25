const memory = JSON.parse(localStorage.getItem("nexus_memory")) || {
    userName: null,
    interactions: []
};

function saveMemory() {
    localStorage.setItem("nexus_memory", JSON.stringify(memory));
}

async function think(text) {
    console.log("Transmitting to backend:", text);

    try {
        const res = await fetch(`${NEXUS_CONFIG.API_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: memory.userName || "adrian",
                text: text
            })
        });

        if (!res.ok) throw new Error("Backend offline");

        const data = await res.json();
        return data;
    } catch (error) {
        console.warn("Backend error, falling back to local logic:", error);

        // Fallback logic
        if (!memory.userName && (text.toLowerCase().includes("numele meu este") || text.toLowerCase().includes("mă numesc"))) {
            const parts = text.toLowerCase().split(/este|numesc/);
            if (parts.length > 1) {
                memory.userName = parts[1].trim();
                saveMemory();
                return { reply: `Încântat de cunoștință, ${memory.userName}. (Mod Local)`, emotion: "happy" };
            }
        }

        if (text.toLowerCase().includes("cum mă cheamă") || text.toLowerCase().includes("cine sunt")) {
            const nameReply = memory.userName
                ? `Te numești ${memory.userName}. (Mod Local)`
                : "Încă nu mi-ai spus numele tău. (Mod Local)";
            return { reply: nameReply, emotion: "neutral" };
        }

        return { reply: "Sistemul este în mod local. Procesez: " + text, emotion: "neutral" };
    }
}
