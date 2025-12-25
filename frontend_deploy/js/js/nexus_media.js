/**
 * 🎵 NEXUS MEDIA SYSTEM
 * Modul pentru redarea stream-urilor audio online (Radio & Ambient).
 * Suportă comenzi vocale și control UI.
 */

const NexusMedia = {
    audioPlayer: null,
    isPlaying: false,
    currentStation: null,
    volume: 0.5,

    // Lista de posturi radio (Stream-uri publice MP3)
    stations: {
        'lofi': { name: 'LoFi Hip Hop', url: 'https://stream.zeno.fm/0r0xa792kwzuv' },
        'chill': { name: 'Chillout Lounge', url: 'https://stream.zeno.fm/f3wvbbqmdg8uv' },
        'pop': { name: 'Top Hits Radio', url: 'https://stream.zeno.fm/sq62q4366wzuv' },
        'rock': { name: 'Rock Classics', url: 'https://stream.zeno.fm/h229r6276wzuv' },
        'jazz': { name: 'Smooth Jazz', url: 'https://stream.zeno.fm/20628292kwzuv' },
        'news': { name: 'News International', url: 'https://media-ice.musicradio.com/LBCUK' }, // Example news stream
        'classical': { name: 'Classical FM', url: 'https://media-ice.musicradio.com/ClassicFMMP3' }
    },

    init: function () {
        console.log('🎵 Nexus Media System: ONLINE');
        this.createPlayerDOM();
    },

    createPlayerDOM: function () {
        // Element Audio ascuns (sau controlabil)
        this.audioPlayer = new Audio();
        this.audioPlayer.crossOrigin = "anonymous";
        this.audioPlayer.volume = this.volume;

        // Evenimente
        this.audioPlayer.addEventListener('play', () => this.updateUI(true));
        this.audioPlayer.addEventListener('pause', () => this.updateUI(false));
        this.audioPlayer.addEventListener('error', (e) => {
            console.error('Media Error:', e);
            if (typeof addLog === 'function') addLog('⚠️ Eroare la redarea stream-ului audio.', 'error');
            this.stop();
        });

        // UI Vizual (Mini-Widget)
        const widget = document.createElement('div');
        widget.id = 'nexus-media-widget';
        widget.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: rgba(0, 20, 40, 0.9);
            border: 1px solid #0ff;
            border-radius: 10px;
            padding: 10px;
            display: none;
            align-items: center;
            gap: 10px;
            z-index: 1000;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
            font-family: 'Segoe UI', sans-serif;
            color: #0ff;
        `;
        widget.innerHTML = `
            <div id="media-visualizer" style="width: 20px; height: 20px; border-radius: 50%; background: #0f0; animation: pulse 1s infinite;"></div>
            <div style="display:flex; flex-direction:column;">
                <span id="media-station-name" style="font-size: 12px; font-weight:bold;">Nexus Radio</span>
                <span style="font-size: 10px; opacity: 0.7;">LIVE STREAM</span>
            </div>
            <button onclick="NexusMedia.stop()" style="background:none; border:none; color:#f00; font-size:16px; cursor:pointer;">⬛</button>
        `;
        document.body.appendChild(widget);
        this.uiWidget = widget;
    },

    play: function (genre = 'lofi') {
        // Normalizare key
        let key = Object.keys(this.stations).find(k => genre.includes(k));
        if (!key) key = 'lofi'; // Default

        const station = this.stations[key];

        if (this.currentStation === station.name && this.isPlaying) {
            return `Deja rulează postul ${station.name}.`;
        }

        this.stop(); // Oprește precedentul

        console.log(`🎵 Tuning into: ${station.name}`);
        this.audioPlayer.src = station.url;

        // Promisiune de play pentru a prinde erorile de autoplay policy
        const playPromise = this.audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                this.isPlaying = true;
                this.currentStation = station.name;
                this.updateUI(true, station.name);
                if (typeof addLog === 'function') addLog(`🎵 Acum asculți: ${station.name}`, 'nexus');
            }).catch(error => {
                console.warn('Autoplay prevented:', error);
                if (typeof speakText === 'function') speakText('Nu pot porni muzica automat. Apasă pe ecran mai întâi.');
            });
        }

        return `Am pornit postul radio: ${station.name}.`;
    },

    stop: function () {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
            this.audioPlayer.src = ""; // Detach stream
        }
        this.isPlaying = false;
        this.currentStation = null;
        this.updateUI(false);
        return "Am oprit redarea audio.";
    },

    updateUI: function (active, name) {
        if (this.uiWidget) {
            this.uiWidget.style.display = active ? 'flex' : 'none';
            if (name) document.getElementById('media-station-name').innerText = name;
        }
    },

    processCommand: function (text) {
        const lower = text.toLowerCase();

        if (lower.includes('stop muzică') || lower.includes('oprește muzica') || lower.includes('stop radio')) {
            return this.stop();
        }

        if (lower.includes('pune muzică') || lower.includes('radio') || lower.includes('play')) {
            // Detectare gen
            let genre = 'lofi';
            if (lower.includes('rock')) genre = 'rock';
            else if (lower.includes('pop') || lower.includes('party')) genre = 'pop';
            else if (lower.includes('jazz')) genre = 'jazz';
            else if (lower.includes('clasică') || lower.includes('simfonică')) genre = 'classical';
            else if (lower.includes('știri') || lower.includes('news')) genre = 'news';
            else if (lower.includes('chill') || lower.includes('relax')) genre = 'chill';

            return this.play(genre);
        }

        return null;
    }
};

window.NexusMedia = NexusMedia;
window.addEventListener('load', () => NexusMedia.init());
