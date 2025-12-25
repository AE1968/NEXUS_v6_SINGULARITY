const NEXUS_CONFIG = {
    // Titlurile oficiale
    TITLE: "GENEZA KELION – HUMANOID AI",
    SUBTITLE: "KELION ONLINE",
    VERSION: "v1.0 GOLD",

    // Configurație API (Auto-detect)
    get API_URL() {
        // LOCAL FALLBACK MODE
        return "http://localhost:8000";
    },

    // Setări Ambientale
    THEME_COLOR: "#00f3ff",
    EMOTION_SPEED: 0.002
};

console.log(`[SYSTEM] ${NEXUS_CONFIG.TITLE} Initialized. Mode: ${window.location.hostname === "localhost" ? "LOCAL" : "PRODUCTION"}`);
