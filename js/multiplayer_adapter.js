// --- REAL-TIME GAME SYNC ADAPTER (PeerJS) ---
// This file handles the networking for multiplayer games

let peer = null;
let conn = null;

function initGameMultiplayer() {
    const urlParams = new URLSearchParams(window.location.search);
    const peerId = urlParams.get('peerId');

    if (typeof Peer === 'undefined') {
        console.warn("PeerJS not loaded. Multiplayer disabled.");
        return;
    }

    if (peerId) {
        console.log("Connecting to Game Host:", peerId);
        // Initialize PeerJS as 'guest'
        peer = new Peer(null, { debug: 2 });
        peer.on('open', (id) => {
            conn = peer.connect(peerId);
            setupGameConnection();
        });
    } else {
        // We are likely the host
        peer = new Peer(null, { debug: 2 });
        peer.on('open', () => {
            console.log("Game Host Ready. ID: " + peer.id);
        });
        peer.on('connection', (c) => {
            conn = c;
            setupGameConnection();
            alert("🎮 Opponent Joined! Let's play!");
        });
    }
}

function setupGameConnection() {
    conn.on('data', (data) => {
        if (data.type === 'move') {
            console.log("Opponent Moved:", data);
            // Dispatch event for game logic to pick up
            const event = new CustomEvent('remote-game-move', { detail: data });
            window.dispatchEvent(event);
        }
    });
}

function sendGameMove(moveData) {
    if (conn) {
        conn.send({ type: 'move', ...moveData });
    }
}

// Auto-init if we are in multiplayer mode
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'multi') {
        initGameMultiplayer();
    }
});
