/**
 * 🌦️ NEXUS WEATHER SYSTEM
 * Integrat cu OpenMeteo API pentru date meteorologice în timp real.
 * Funcționează global, fără API Key.
 */

const NexusWeather = {
    apiUrl: 'https://api.open-meteo.com/v1/forecast',

    // Default location (Bucharest) if geo fails
    defaultLat: 44.4268,
    defaultLon: 26.1025,

    init: function () {
        console.log('🌦️ Nexus Weather Module: ONLINE');
    },

    getWeather: async function (cityQuery = null) {
        let lat = this.defaultLat;
        let lon = this.defaultLon;
        let locationName = "Unknown Location";

        // 1. Determine Coordinates
        if (cityQuery) {
            // Geocoding simplu (simulat pentru demo sau folosim un api open)
            // Pentru simplitate și siguranță, dacă cere un oraș specific, încercăm să extragem coordonatele
            // Daca nu, folosim locatia curenta a utilizatorului
            const coords = await this.geocodeCity(cityQuery);
            if (coords) {
                lat = coords.lat;
                lon = coords.lon;
                locationName = coords.name;
            } else {
                return `Nu am reușit să localizez orașul "${cityQuery}".`;
            }
        } else {
            // Use GPS provided by NexusGeo if available
            if (window.NexusGeo && window.NexusGeo.currentPosition) {
                lat = window.NexusGeo.currentPosition.lat;
                lon = window.NexusGeo.currentPosition.lng;
                locationName = "Locația ta curentă";
            }
        }

        // 2. Fetch Weather Data
        try {
            const url = `${this.apiUrl}?latitude=${lat}&longitude=${lon}&current_weather=true&windspeed_unit=kmh`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.current_weather) {
                return this.formatReport(data.current_weather, locationName);
            } else {
                return "Senzorii meteorologici nu răspund momentan.";
            }

        } catch (error) {
            console.error(error);
            return "Eroare la conectarea cu sateliții meteo.";
        }
    },

    geocodeCity: async function (city) {
        // Folosim un serviciu gratuit de geocoding
        try {
            const resp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ro`);
            const data = await resp.json();
            if (data.results && data.results.length > 0) {
                return {
                    lat: data.results[0].latitude,
                    lon: data.results[0].longitude,
                    name: data.results[0].name
                };
            }
        } catch (e) {
            console.error('Geocode error', e);
        }
        return null;
    },

    formatReport: function (weather, location) {
        const temp = weather.temperature;
        const wind = weather.windspeed;
        const code = weather.weathercode;

        let condition = "Necunoscut";
        // WMO Weather interpretation codes (http://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM)
        if (code === 0) condition = "Cer senin ☀️";
        else if (code >= 1 && code <= 3) condition = "Parțial înnorat ⛅";
        else if (code >= 45 && code <= 48) condition = "Ceață 🌫️";
        else if (code >= 51 && code <= 67) condition = "Ploaie 🌧️";
        else if (code >= 71 && code <= 77) condition = "Zăpadă ❄️";
        else if (code >= 95) condition = "Furtună ⚡";

        return `Raport Meteo pentru ${location}:
        🌡️ Temperatură: ${temp}°C
        ☁️ Condiții: ${condition}
        💨 Vânt: ${wind} km/h`;
    },

    // Short helper for chat integration
    processRequest: async function (text) {
        const cmd = text.toLowerCase();
        if (cmd.includes('vreme') || cmd.includes('meteo') || cmd.includes('weather') || cmd.includes('prognoza')) {
            let city = null;
            // Extract potential city name: "vremea in Londra"
            const parts = text.toLowerCase().split(' în ');
            if (parts.length > 1) {
                city = parts[1].replace('?', '').trim();
            } else {
                const parts2 = text.toLowerCase().split(' la ');
                if (parts2.length > 1) city = parts2[1].replace('?', '').trim();
            }

            if (text.toLowerCase().includes('bucurești')) city = 'Bucharest'; // Hard match for common

            return await this.getWeather(city);
        }
        return null;
    }
};

window.NexusWeather = NexusWeather;
window.addEventListener('load', () => NexusWeather.init());
