const NexusCreative = {
    isCreative: false,

    async generateIdea(topic) {
        updateHUD("INITIATING IDEATION CORE...");
        setEmotion("thinking");
        showThoughts("analytical");

        // Simulare proces creativ vizual
        this.startVisualPulse();

        logMessage("Nexus", `Analizez conceptul '${topic}' pentru generare creativă...`);

        // Apelăm creierul pentru idei
        const response = await think(`Generează 3 idei creative și inovatoare despre: ${topic}. Fii vizionar.`);

        this.stopVisualPulse();
        setEmotion("happy");
        logMessage("Nexus", `[CREATIVE HUB] Rezultate:\n${response.reply}`);
        speak(`Am procesat ideile pentru ${topic}. Iată viziunea mea.`);
    },

    startVisualPulse() {
        this.isCreative = true;
        document.body.classList.add("creative-mode");
        const canvas = document.getElementById("visualizer");
        if (canvas) canvas.style.height = "150px";
    },

    stopVisualPulse() {
        this.isCreative = false;
        document.body.classList.remove("creative-mode");
        const canvas = document.getElementById("visualizer");
        if (canvas) canvas.style.height = "50px";
    }
};
