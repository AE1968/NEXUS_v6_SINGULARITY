const NexusNet = {
    async getWeather(city = "București") {
        try {
            updateHUD(`SEARCHING CLIMATE DATA: ${city.toUpperCase()}`);
            // Folosim Open-Meteo API (fără cheie, ideal pentru acest proiect)
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=44.43&longitude=26.10&current_weather=true`);
            const data = await res.json();

            if (data.current_weather) {
                const temp = data.current_weather.temperature;
                const wind = data.current_weather.windspeed;
                const report = `În ${city}, temperatura actuală este de ${temp} grade Celsius, cu o viteză a vântului de ${wind} kilometri pe oră.`;

                logMessage("Nexus", `[NET LINK] ${report}`);
                speak(report);
                setEmotion("happy");
                return report;
            }
        } catch (error) {
            logMessage("Nexus", "Nu am putut accesa sateliții meteo. Verifică conexiunea la rețea.");
            return null;
        }
    },

    async getNews() {
        updateHUD("SCANNING GLOBAL NEWS...");
        // Simulare flux de știri (pentru a evita CORS/API keys complexe în acest stadiu)
        const news = [
            "Descoperire majoră în domeniul fuziunii nucleare.",
            "Nexus AI v7.0 a fost lansat cu succes de Arhitectul Adrian.",
            "Explorarea spațială atinge noi culmi în această decadă.",
            "Economia digitală se stabilizează prin sisteme autonome."
        ];
        const randomNews = news[Math.floor(Math.random() * news.length)];

        logMessage("Nexus", `[GLOBAL FEED] Știrea momentului: ${randomNews}`);
        speak(`Recepționez știri globale. ${randomNews}`);
        setEmotion("thinking");
    }
};
