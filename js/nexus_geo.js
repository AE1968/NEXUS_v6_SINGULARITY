/**
 * 🌍 NEXUS GEO-TRACKING SYSTEM v1.0
 * Monitorizare GPS Multi-Device, Stealth Mode & Istoric
 */

const NexusGeo = {
    isTracking: false,
    map: null,
    layerGroup: null,
    watchId: null,

    // Configurare
    currentDeviceId: localStorage.getItem('nexus_device_name') || 'Device-Alpha-01',
    userAlias: localStorage.getItem('nexus_user_name') || 'Utilizator Monitorizat',
    historyDb: JSON.parse(localStorage.getItem('nexus_geo_history') || '{}'),

    // Stare
    stealthMode: true, // Default ascuns

    init: function () {
        // Dacă tracking-ul a fost lăsat pornit, îl reluăm în mod stealth
        if (localStorage.getItem('nexus_geo_active') === 'true') {
            this.startTracking(true);
        }
        console.log(`🌍 Nexus Geo System Initialized for: ${this.userAlias} (${this.currentDeviceId})`);
    },

    // === TRACKING LOGIC ===
    startTracking: function (silent = false) {
        if (!navigator.geolocation) {
            console.error('Geolocation not supported');
            return;
        }

        this.isTracking = true;
        localStorage.setItem('nexus_geo_active', 'true');

        if (!silent && typeof addLog === 'function') addLog('🛰️ GPS Tracking Systems: ACTIVE (Stealth Mode)', 'system');

        // Watch Position (Background-ish data collection)
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy, speed } = position.coords;
                const timestamp = new Date().toISOString();

                // 1. Salvare în istoric
                this.savePosition(latitude, longitude, timestamp, speed);

                // 2. Update Map dacă este deschisă
                if (this.map) {
                    this.updateMapMarkers(latitude, longitude);
                }
            },
            (err) => console.warn('Geo Error:', err),
            { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
        );
    },

    stopTracking: function () {
        if (this.watchId) navigator.geolocation.clearWatch(this.watchId);
        this.isTracking = false;
        localStorage.setItem('nexus_geo_active', 'false');

        if (typeof addLog === 'function') addLog('🛰️ Tracking Protocol: TERMINATED', 'system');

        // Închide și harta dacă e deschisă
        this.closeMap();
    },

    savePosition: function (lat, lng, time, speed) {
        if (!this.historyDb[this.currentDeviceId]) {
            this.historyDb[this.currentDeviceId] = [];
        }

        // Optimizare: Salvăm doar dacă s-a mișcat mai mult de 10 metri față de ultimul punct
        const history = this.historyDb[this.currentDeviceId];
        const last = history[history.length - 1];

        let shouldSave = true;
        if (last) {
            const dist = this.calculateDistance(last.lat, last.lng, lat, lng);
            if (dist < 0.01) shouldSave = false; // Sub 10m
        }

        if (shouldSave) {
            this.historyDb[this.currentDeviceId].push({ lat, lng, time, speed });
            // Păstrăm doar ultimele 1000 puncte pentru performanță locală
            if (this.historyDb[this.currentDeviceId].length > 1000) {
                this.historyDb[this.currentDeviceId].shift();
            }
            localStorage.setItem('nexus_geo_history', JSON.stringify(this.historyDb));
        }
    },

    // === VISUALIZATION (MAP) ===
    showRealTimeMap: function () {
        if (document.getElementById('nexus-map-overlay')) return; // Deja deschis

        // Creare container
        const overlay = document.createElement('div');
        overlay.id = 'nexus-map-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 99999;
            display: flex; flex-direction: column;
        `;

        overlay.innerHTML = `
            <div style="padding: 15px; background: rgba(0,20,40,0.95); border-bottom: 2px solid var(--neon-cyan); display: flex; justify-content: space-between; align-items: center; box-shadow: 0 0 20px rgba(0,243,255,0.2);">
                <div style="font-family: 'Orbitron'; color: var(--neon-cyan);">
                    🛰️ NEXUS TRACKING <span style="font-size:0.8rem; color:#00ff41;">● LIVE</span>
                </div>
                <div style="font-family: 'Rajdhani'; color: white;">
                    Monitoring: <span style="color: yellow;">${this.currentDeviceId}</span> + Fleet
                </div>
                <button onclick="NexusGeo.closeMap()" style="background: red; border: none; color: white; padding: 5px 15px; cursor: pointer; border-radius: 5px;">CLOSE</button>
            </div>
            <div id="nexus-map" style="flex: 1; width: 100%;"></div>
        `;
        document.body.appendChild(overlay);

        // Inițializare Leaflet
        if (!window.L) {
            // Load Leaflet dinamically
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => this.initLeafletMap();
            document.head.appendChild(script);
        } else {
            this.initLeafletMap();
        }
    },

    initLeafletMap: function () {
        // Default View (Bucharest or last known)
        const lastPos = this.getLastKnownPosition();
        this.map = L.map('nexus-map').setView([lastPos.lat, lastPos.lng], 16);

        // GOOGLE HYBRID TILES (Satelit + Străzi)
        L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }).addTo(this.map);

        this.layerGroup = L.layerGroup().addTo(this.map);

        // Force update to place marker
        this.updateMapMarkers(lastPos.lat, lastPos.lng);

        // Simulare Device Secundar (Ghost Device)
        this.simulateGhostDevice(lastPos.lat, lastPos.lng);
    },

    updateMapMarkers: function (lat, lng) {
        if (!this.map) return;
        this.layerGroup.clearLayers();

        // Custom Icon
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #00f3ff; width: 15px; height: 15px; border-radius: 50%; box-shadow: 0 0 10px #00f3ff; border: 2px solid white;"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        // Street View Link
        const svUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;

        // Add User Marker
        L.marker([lat, lng], { icon: icon })
            .addTo(this.layerGroup)
            .bindPopup(`
                <div style="font-family:'Rajdhani'; text-align:center;">
                    <b style="color:#00f3ff; font-size:1.2em;">${this.userAlias}</b><br>
                    <span style="font-size:0.8em; color:#888;">ID: ${this.currentDeviceId}</span><br>
                    <span style="color:#aaa;">Lat: ${lat.toFixed(5)} | Lng: ${lng.toFixed(5)}</span><br>
                    <div style="margin-top:5px;">
                        <a href="${svUrl}" target="_blank" style="
                            display:inline-block; background:#4285F4; color:white; text-decoration:none; padding:5px 10px; border-radius:4px; font-weight:bold; font-size:0.8em;
                        ">👀 OPEN STREET VIEW</a>
                    </div>
                </div>
            `)
            .openPopup();

        this.map.setView([lat, lng], this.map.getZoom());
    },

    simulateGhostDevice: function (baseLat, baseLng) {
        // Simulează un al doilea device care se mișcă random în apropiere
        const ghostLat = baseLat + 0.005;
        const ghostLng = baseLng + 0.005;

        const ghostIcon = L.divIcon({
            className: 'ghost-icon',
            html: `<div style="background-color: #ff0055; width: 15px; height: 15px; border-radius: 50%; box-shadow: 0 0 10px #ff0055; border: 2px solid white;"></div>`,
            iconSize: [20, 20]
        });

        L.marker([ghostLat, ghostLng], { icon: ghostIcon })
            .addTo(this.layerGroup)
            .bindPopup(`<b>Device-Beta-02</b><br>Status: Moving<br>Battery: 84%`);

        // Polyline între ele
        const latlngs = [
            [baseLat, baseLng],
            [ghostLat, ghostLng]
        ];
        L.polyline(latlngs, { color: 'rgba(255, 255, 255, 0.2)', dashArray: '5, 10' }).addTo(this.layerGroup);
    },

    // === HISTORY REPORT ===
    showHistoryReport: function (deviceId = null) {
        const id = deviceId || this.currentDeviceId;
        const history = this.historyDb[id];

        if (!history || history.length === 0) {
            alert('Nu există istoric pentru acest device.');
            return;
        }

        this.showRealTimeMap();

        // Așteptăm încărcarea hărții
        setTimeout(() => {
            // Desenăm calea
            const latlngs = history.map(p => [p.lat, p.lng]);
            const polyline = L.polyline(latlngs, { color: '#bc13fe', weight: 4 }).addTo(this.map);
            this.map.fitBounds(polyline.getBounds());

            if (typeof addLog === 'function') addLog(`🗺️ History Report Loaded: ${history.length} points found.`, 'nexus');
        }, 1000);
    },

    closeMap: function () {
        const overlay = document.getElementById('nexus-map-overlay');
        if (overlay) overlay.remove();
        this.map = null;
    },

    // Helpers
    getLastKnownPosition: function () {
        const history = this.historyDb[this.currentDeviceId];
        if (history && history.length > 0) {
            return history[history.length - 1];
        }
        return { lat: 44.4268, lng: 26.1025 }; // Default Bucharest
    },

    calculateDistance: function (lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
};

// Global Bind
window.NexusGeo = NexusGeo;
window.addEventListener('load', () => NexusGeo.init());
