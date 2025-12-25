const NexusMedia = {
    currentStation: null,
    audio: new Audio(),
    stations: {
        "lofi": "https://icecast2.play.cz/radio1.mp3", // Exemplu de stream
        "jazz": "https://jazz.stream.publicradio.org/jazz.mp3",
        "rock": "https://icecast.abradio.cz/rockradio128.mp3",
        "news": "https://bbcmedia.ic.llnwd.net/stream/bbcmedia_radio4fm_mf_p"
    },

    play(type) {
        if (this.stations[type]) {
            this.audio.src = this.stations[type];
            this.audio.play();
            this.currentStation = type;
            updateHUD(`PLAYING: ${type.toUpperCase()}`);
            logMessage("Nexus", `Am activat frecvența ${type.toUpperCase()}. Audiție plăcută.`);
            setEmotion("happy");
        } else {
            logMessage("Nexus", "Nu am găsit stația radio solicitată.");
        }
    },

    stop() {
        this.audio.pause();
        this.currentStation = null;
        updateHUD("MEDIA PAUSED");
        logMessage("Nexus", "Am oprit transmisia audio.");
    }
};
