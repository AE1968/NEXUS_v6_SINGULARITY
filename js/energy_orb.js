/**
 * ENERGY ORB - Standalone Power Core
 * 
 * Represents the pure energy source: Neuro-connections, Lightning, Pulse.
 */

class EnergyOrb {
    constructor(containerId) {
        this.containerId = containerId;
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        // Sphere Components
        this.sphere = null;
        this.neuroNet = null;
        this.glowSphere = null;
        this.particleSystem = null;
        this.lightningBolts = [];
        this.lightningGroup = null;
        this.model = null; // Hologram
        this.mixer = null;

        this.clock = new THREE.Clock();

        // Colors
        this.colors = {
            base: 0x00f3ff, // Cyan
            core: 0xffffff, // White
            energy: 0x00ffff,
            surge: 0xff00ff // Magenta for surges
        };

        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Visual Setup
        this.setupScene(container);
        this.createOrbStructure();

        // Load Core Identity (Hologram Head)
        this.loadHologram();

        // Start Loop
        this.animate();
        console.log("⚡ Energy Orb initialized with Core Identity.");
    }

    setupScene(container) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505); // Dark background

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.camera.position.z = 4.5;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        container.appendChild(this.renderer.domElement);

        // Lighting
        const ambient = new THREE.AmbientLight(0x000000);
        this.scene.add(ambient);

        const coreLight = new THREE.PointLight(this.colors.base, 2, 10);
        coreLight.position.set(0, 0, 0);
        this.scene.add(coreLight);

        // Handle Resize
        window.addEventListener('resize', () => {
            const container = document.getElementById(this.containerId);
            if (!container) return;
            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }

    createOrbStructure() {
        // 1. Core Shell (Glass-like)
        const geometry = new THREE.IcosahedronGeometry(1.5, 4);
        const material = new THREE.MeshPhongMaterial({
            color: this.colors.base,
            wireframe: true,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide,
            emissive: 0x001133
        });
        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);

        // 2. Neuro-Network (Outer connections)
        const neuroGeo = new THREE.IcosahedronGeometry(1.55, 2);
        const wireMat = new THREE.LineBasicMaterial({
            color: this.colors.energy,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        this.neuroNet = new THREE.LineSegments(new THREE.WireframeGeometry(neuroGeo), wireMat);
        this.scene.add(this.neuroNet);

        // 3. Lightning Container
        this.lightningGroup = new THREE.Group();
        this.scene.add(this.lightningGroup);

        // 4. Inner Glow (Volumetric Source)
        const glowGeo = new THREE.SphereGeometry(1.4, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: this.colors.base,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        this.glowSphere = new THREE.Mesh(glowGeo, glowMat);
        this.scene.add(this.glowSphere);

        // 5. High-Energy Particles
        const pGeo = new THREE.BufferGeometry();
        const count = 400;
        const positions = new Float32Array(count * 3);
        const speeds = [];

        for (let i = 0; i < count; i++) {
            const r = 1.6 + Math.random() * 1.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.cos(phi);
            positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

            speeds.push({
                val: 0.01 + Math.random() * 0.03,
                axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
            });
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const pMat = new THREE.PointsMaterial({
            color: this.colors.core,
            size: 0.04,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.particleSystem = new THREE.Points(pGeo, pMat);
        this.particleSystem.userData = { speeds: speeds };
        this.scene.add(this.particleSystem);
    }

    loadHologram() {
        const loader = new THREE.GLTFLoader();
        const modelPath = 'assets/hologram.glb';

        loader.load(modelPath, (gltf) => {
            this.model = gltf.scene;

            // Material: Electric/Cybernetic look to blend with Orb
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: this.colors.base,
                        emissive: 0x000022,
                        metalness: 0.8,
                        roughness: 0.2,
                        transparent: true,
                        opacity: 0.9,
                        wireframe: false
                    });
                }
            });

            // Position inside the orb
            this.model.position.set(0, -0.4, 0);
            this.model.scale.set(1.3, 1.3, 1.3);
            this.scene.add(this.model);

            // Mixer for idle animation
            if (gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.model);
                const clip = gltf.animations[0];
                if (clip) this.mixer.clipAction(clip).play();
            }

        }, undefined, (e) => console.warn(e));
    }

    createLightning() {
        if (this.lightningBolts.length > 8) return;

        // Generate a random arc on the surface/inside
        const r = 1.45;
        const phi1 = Math.random() * Math.PI;
        const theta1 = Math.random() * 2 * Math.PI;
        const start = new THREE.Vector3().setFromSphericalCoords(r, phi1, theta1);

        // End point is somewhere opposite or nearby
        const end = start.clone().multiplyScalar(-0.8).add(
            new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(2)
        ).normalize().multiplyScalar(r);

        // Build Jagged Line
        const points = [];
        const segments = 12;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const pt = new THREE.Vector3().lerpVectors(start, end, t);
            if (i > 0 && i < segments) {
                // Jitter
                pt.add(new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4));
            }
            points.push(pt);
        }

        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending });
        const bolt = new THREE.Line(geo, mat);

        bolt.userData = { life: 1.0, decay: 2.0 + Math.random() * 3.0 };
        this.lightningGroup.add(bolt);
        this.lightningBolts.push(bolt);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        const time = Date.now() * 0.001;

        // 1. Core Rotation
        if (this.sphere) {
            this.sphere.rotation.y += 0.002;
            this.sphere.rotation.z = Math.sin(time * 0.1) * 0.1;
        }

        // 2. Neuro Net Counter-Rotation
        if (this.neuroNet) {
            this.neuroNet.rotation.y -= 0.003;
            this.neuroNet.rotation.x = Math.cos(time * 0.2) * 0.1;
        }

        // 3. Heartbeat Pulse
        const pulse = Math.sin(time * 3) * 0.05 + Math.sin(time * 12) * 0.02;
        const scale = 1 + pulse;

        if (this.glowSphere) {
            this.glowSphere.scale.set(scale, scale, scale);
            this.glowSphere.material.opacity = 0.2 + Math.max(0, pulse * 0.4);
        }

        // 4. Lightning Handling
        if (Math.random() < 0.08) this.createLightning();

        for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
            const bolt = this.lightningBolts[i];
            bolt.userData.life -= delta * bolt.userData.decay;
            bolt.material.opacity = bolt.userData.life;
            if (bolt.userData.life <= 0) {
                this.lightningGroup.remove(bolt);
                bolt.geometry.dispose();
                this.lightningBolts.splice(i, 1);
            }
        }

        // 5. Particle Swarm
        if (this.particleSystem) {
            // this.particleSystem.rotation.y += 0.001;
            this.particleSystem.rotation.x = Math.sin(time * 0.1) * 0.05;

            // Move particles?? For now just rotation
            this.particleSystem.rotation.y = time * 0.05;
        }

        // 6. Hologram Animation
        if (this.mixer) this.mixer.update(delta);
        if (this.model) {
            // Subtle "alive" float
            this.model.position.y = -0.4 + Math.sin(time * 1.5) * 0.02;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

window.EnergyOrb = EnergyOrb;
