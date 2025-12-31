// ============================================================================
// KELION v143.0 - 3D VISUALIZATION SYSTEM
// Globe, Hologram, Energy Sphere, Lip Sync
// ============================================================================

/**
 * 3D Globe System
 * Creates an interactive 3D globe with IP location markers
 */
const GlobeSystem = {
    scene: null,
    camera: null,
    renderer: null,
    globe: null,
    markers: [],

    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !window.THREE) {
            console.warn('GlobeSystem: Container or THREE.js not found');
            return false;
        }

        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setClearColor(0x000000, 0);
        container.appendChild(this.renderer.domElement);

        // Globe geometry
        const geometry = new THREE.SphereGeometry(2, 64, 64);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00f3ff,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        this.globe = new THREE.Mesh(geometry, material);
        this.scene.add(this.globe);

        // Glow effect
        const glowGeometry = new THREE.SphereGeometry(2.1, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00f3ff,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.scene.add(glow);

        this.camera.position.z = 5;

        this.animate();
        return true;
    },

    addMarker(lat, lon, color = 0xff00ff) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);

        const x = -2 * Math.sin(phi) * Math.cos(theta);
        const y = 2 * Math.cos(phi);
        const z = 2 * Math.sin(phi) * Math.sin(theta);

        const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ color });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(x, y, z);

        this.globe.add(marker);
        this.markers.push(marker);
        return marker;
    },

    rotateTo(lat, lon, duration = 1000) {
        // Smooth rotation to coordinates
        const targetPhi = (90 - lat) * (Math.PI / 180);
        const targetTheta = (lon + 180) * (Math.PI / 180);

        // Animation implementation would go here
        console.log(`Globe rotating to: ${lat}, ${lon}`);
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        this.globe.rotation.y += 0.002;
        this.renderer.render(this.scene, this.camera);
    }
};

/**
 * Energy Sphere System  
 * Creates a pulsating energy sphere around the hologram
 */
const EnergySphere = {
    scene: null,
    sphere: null,
    particles: [],

    init(scene) {
        this.scene = scene;

        // Outer energy sphere
        const geometry = new THREE.SphereGeometry(1.5, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00f3ff,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);

        // Orbiting particles
        for (let i = 0; i < 50; i++) {
            const particleGeo = new THREE.SphereGeometry(0.02, 8, 8);
            const particleMat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0x00f3ff : 0xff00ff,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(particleGeo, particleMat);

            // Random orbital position
            const angle = Math.random() * Math.PI * 2;
            const radius = 1.3 + Math.random() * 0.4;
            particle.userData = { angle, radius, speed: 0.01 + Math.random() * 0.02 };

            this.particles.push(particle);
            this.scene.add(particle);
        }

        return true;
    },

    update() {
        if (!this.sphere) return;

        // Pulsate sphere
        const scale = 1 + Math.sin(Date.now() * 0.002) * 0.1;
        this.sphere.scale.set(scale, scale, scale);

        // Orbit particles
        this.particles.forEach(p => {
            p.userData.angle += p.userData.speed;
            p.position.x = Math.cos(p.userData.angle) * p.userData.radius;
            p.position.z = Math.sin(p.userData.angle) * p.userData.radius;
            p.position.y = Math.sin(p.userData.angle * 2) * 0.3;
        });
    },

    intensify() {
        // Called during AI processing
        if (this.sphere) {
            this.sphere.material.opacity = 0.3;
            this.sphere.material.color.setHex(0xff00ff);
        }
    },

    calm() {
        // Called when idle
        if (this.sphere) {
            this.sphere.material.opacity = 0.1;
            this.sphere.material.color.setHex(0x00f3ff);
        }
    }
};

/**
 * Lip Sync System
 * Animates mouth frames based on audio analysis
 */
const LipSyncSystem = {
    visemes: ['rest', 'aa', 'ee', 'oo', 'ch', 'mm'],
    currentViseme: 'rest',
    audioContext: null,
    analyser: null,

    init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        return true;
    },

    connectAudio(audioElement) {
        if (!this.audioContext) return;

        const source = this.audioContext.createMediaElementSource(audioElement);
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
    },

    getViseme() {
        if (!this.analyser) return 'rest';

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);

        // Calculate average amplitude
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;

        // Map amplitude to viseme
        if (avg < 10) return 'rest';
        if (avg < 40) return 'mm';
        if (avg < 80) return 'ee';
        if (avg < 120) return 'aa';
        if (avg < 160) return 'oo';
        return 'ch';
    },

    update(morphTargets) {
        const viseme = this.getViseme();
        if (viseme !== this.currentViseme) {
            this.currentViseme = viseme;
            // Apply morph target if available
            if (morphTargets && morphTargets[viseme] !== undefined) {
                // Reset all
                Object.keys(morphTargets).forEach(k => morphTargets[k] = 0);
                morphTargets[viseme] = 1;
            }
        }
    }
};

// Export systems
window.GlobeSystem = GlobeSystem;
window.EnergySphere = EnergySphere;
window.LipSyncSystem = LipSyncSystem;

console.log('🌐 KELION 3D Systems loaded: Globe, EnergySphere, LipSync');
