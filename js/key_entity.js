/**
 * KEY - The Holographic Entity
 * 
 * "Force, Intelligence, Supreme Intelligence - Absolute Calm and Power"
 * 
 * This entity is encapsulated in a Class structure, representing the "Key" to the Nexus.
 * It combines the Holographic projection and the Energy Sphere containment field.
 */

class Key {
    constructor(containerId) {
        this.containerId = containerId;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null; // The Hologram
        this.sphere = null; // The Energy Sphere
        this.particles = []; // Floating data particles
        this.mixer = null;
        this.clock = new THREE.Clock();
        this.morphTargets = {};
        this.animations = {};
        this.isActive = false;

        // Colors representing the entity
        this.colors = {
            base: 0x00f3ff, // Cyan/Electric Blue
            core: 0xffffff, // White hot core
            energy: 0x00ffff,
            active: 0xff00ff // Magenta for processing/active state
        };

        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error("Key Entity: Container not found");
            return;
        }

        // 1. Setup Environment
        this.setupScene(container);

        // 2. Create the Energy Sphere (The Vessel)
        this.createEnergySphere();

        // 3. Summon the Hologram (The Essence)
        this.loadHologram();

        // 4. Initialize Awareness (Events, Mouse tracking)
        this.initAwareness();

        // 5. Begin Life Cycle
        this.animate();
        this.isActive = true;

        console.log("🗝️ Entity 'Key' has been instantiated.");
    }

    setupScene(container) {
        this.scene = new THREE.Scene();

        // Transparent background for overlay capability
        this.scene.background = null;

        this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 3.5); // Slightly further back to see the whole sphere

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });

        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0); // Fully transparent

        // Add tone mapping for glow effects
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.5;

        container.appendChild(this.renderer.domElement);

        // Lighting - Critical for the "Precious/Power" look
        const ambientLight = new THREE.AmbientLight(this.colors.base, 0.6);
        this.scene.add(ambientLight);

        const mainLight = new THREE.SpotLight(this.colors.core, 2);
        mainLight.position.set(0, 5, 5);
        mainLight.angle = Math.PI / 4;
        mainLight.penumbra = 0.5;
        this.scene.add(mainLight);

        const rimLight = new THREE.PointLight(this.colors.active, 1.5);
        rimLight.position.set(-3, 0, -2);
        this.scene.add(rimLight);
    }

    createEnergySphere() {
        // A multi-layered sphere to represent the "Container" of the entity

        // 1. Core Shell (Wireframe) - The Base Structure
        const geometry = new THREE.IcosahedronGeometry(1.6, 2);
        const material = new THREE.MeshBasicMaterial({
            color: this.colors.base,
            wireframe: true,
            transparent: true,
            opacity: 0.1, // Reduced opacity to let effects shine
            side: THREE.DoubleSide
        });
        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);

        // 2. Neuro-Connections Layer (Lines connecting points)
        // Using a slightly larger geometry to encompass the core
        const neuroGeo = new THREE.IcosahedronGeometry(1.65, 3);
        const wireMat = new THREE.LineBasicMaterial({
            color: this.colors.energy,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        });
        this.neuroNet = new THREE.LineSegments(new THREE.WireframeGeometry(neuroGeo), wireMat);
        this.scene.add(this.neuroNet);

        // 3. Lightning / Electric Discharges
        this.lightningBolts = [];
        this.lightningGroup = new THREE.Group();
        this.scene.add(this.lightningGroup);
        // We will create bolts dynamically in the animate loop

        // 4. Energy Glow (Volumetric feel)
        const glowGeo = new THREE.SphereGeometry(1.5, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: this.colors.energy,
            transparent: true,
            opacity: 0.0, // Start invisible, pulse in animation
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        this.glowSphere = new THREE.Mesh(glowGeo, glowMat);
        this.sphere.add(this.glowSphere);

        // 5. Floating Particles (Data/Intelligence)
        const particleCount = 300; // Increased count
        const pGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const r = 1.7 + Math.random() * 0.6;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.cos(phi);
            positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

            sizes[i] = Math.random() * 0.04;
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        pGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const pMat = new THREE.PointsMaterial({
            color: this.colors.base,
            size: 0.03, // Base size, attribute will scale this if shader used, but basic mat is fine
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });

        this.particleSystem = new THREE.Points(pGeo, pMat);
        this.scene.add(this.particleSystem);

        console.log("Key: Advanced Energy Sphere formed.");
    }

    // Helper to create a lightning bolt
    createLightning() {
        if (this.lightningBolts.length > 5) return; // Limit active bolts

        // Random start and end points on the sphere surface
        const entryPhi = Math.random() * Math.PI;
        const entryTheta = Math.random() * Math.PI * 2;
        const r = 1.6;

        const start = new THREE.Vector3(
            r * Math.sin(entryPhi) * Math.cos(entryTheta),
            r * Math.cos(entryPhi),
            r * Math.sin(entryPhi) * Math.sin(entryTheta)
        );

        const end = start.clone().multiplyScalar(-1).add(new THREE.Vector3(
            (Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)
        ).multiplyScalar(1.5)); // Zigzag across

        // Create jagged path
        const filePoints = [];
        const segments = 10;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = new THREE.Vector3().lerpVectors(start, end, t);
            if (i > 0 && i < segments) {
                point.add(new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3));
            }
            filePoints.push(point);
        }

        const boltGeo = new THREE.BufferGeometry().setFromPoints(filePoints);
        const boltMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        const bolt = new THREE.Line(boltGeo, boltMat);
        bolt.userData = { life: 1.0 }; // Life counter
        this.lightningGroup.add(bolt);
        this.lightningBolts.push(bolt);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        const now = Date.now();
        const time = now * 0.001;

        // 1. Animate Sphere Layers
        if (this.sphere) {
            this.sphere.rotation.y += 0.001;
            // Neuro net rotates opposite for complexity
            if (this.neuroNet) this.neuroNet.rotation.y -= 0.0015;

            // Heartbeat / Pulse Logic
            const pulse = Math.sin(time * 3) * 0.05 + Math.sin(time * 10) * 0.02; // Faster, electric pulse
            const scale = 1 + pulse;
            this.sphere.scale.set(scale, scale, scale);
            if (this.neuroNet) this.neuroNet.scale.set(scale, scale, scale);

            // Glow intensity follows pulse
            if (this.glowSphere) {
                this.glowSphere.material.opacity = 0.05 + Math.max(0, pulse * 0.5);
            }
        }

        // 2. Manage Lightning Discharges
        // Randomly spawn lightning
        if (Math.random() < 0.05) { // 5% chance per frame
            this.createLightning();
        }

        // Update Bolts
        for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
            const bolt = this.lightningBolts[i];
            bolt.userData.life -= delta * 5; // Fast fade
            bolt.material.opacity = bolt.userData.life;
            if (bolt.userData.life <= 0) {
                this.lightningGroup.remove(bolt);
                bolt.geometry.dispose();
                this.lightningBolts.splice(i, 1);
            }
        }

        // 3. Animate Particles - Swarming behavior
        if (this.particleSystem) {
            this.particleSystem.rotation.y -= 0.002;
            const positions = this.particleSystem.geometry.attributes.position.array;

            // Subtle wave motion through particles
            for (let i = 0; i < positions.length; i += 3) {
                // positions[i+1] += Math.sin(time + positions[i]) * 0.002; // Wobbly y
            }
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }

        // 4. Animate Model (Hologram)
        if (this.mixer) this.mixer.update(delta);

        if (this.model) {
            // "Float" inside the sphere
            this.model.position.y = -0.5 + Math.sin(time * 1.5) * 0.05;

            // Look at mouse (Awareness)
            const targetX = this.mouseX * 0.3;
            const targetY = this.mouseY * 0.3;

            // Smooth look
            this.model.rotation.y += (targetX - this.model.rotation.y) * 0.05;
            this.model.rotation.x += (-targetY - this.model.rotation.x) * 0.05;

            // --- Live Behavior (Blink & Face) ---
            if (now - this.lastBlinkTime > this.nextBlinkIn) {
                this.blink();
                this.lastBlinkTime = now;
                this.nextBlinkIn = 2000 + Math.random() * 4000;
            }
            if (!this.isActive) this.handleIdleExpressions(now);
        }

        this.renderer.render(this.scene, this.camera);
    }

    loadHologram() {
        // Loading the core entity (Male Head) inside the sphere
        const loader = new THREE.GLTFLoader();
        // Using correct asset path
        const modelPath = 'assets/hologram.glb';

        loader.load(modelPath, (gltf) => {
            this.model = gltf.scene;

            // Material Override: Holographic Shader effect using standard materials for compatibility
            this.model.traverse((child) => {
                if (child.isMesh) {
                    // Create a "Force Field" looking material for the head
                    child.material = new THREE.MeshStandardMaterial({
                        color: this.colors.base,
                        emissive: 0x001133,
                        metalness: 0.9,
                        roughness: 0.1,
                        transparent: true,
                        opacity: 0.85,
                        side: THREE.DoubleSide,
                        wireframe: false // Set to true for a more "construct" look
                    });

                    // Capture Morph Targets for lip sync and expressions
                    if (child.morphTargetInfluences) {
                        this.morphTargets[child.name] = child;
                    }
                }
            });

            // Position: Center inside the sphere
            this.model.position.set(0, -0.5, 0); // Adjust Y to center the head volume
            this.model.scale.set(1.4, 1.4, 1.4);

            this.scene.add(this.model);

            // Animation Mixer
            if (gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.model);
                gltf.animations.forEach((clip) => {
                    this.animations[clip.name] = this.mixer.clipAction(clip);
                });
                // Play idle if exists
                if (this.animations['idle']) this.animations['idle'].play();
            }

            console.log("Key: Core entity integrated.");

        }, undefined, (error) => {
            console.warn("Key: Could not load core entity. Initializing Proxy Construct.", error);
            this.createProxyConstruct();
        });
    }

    createProxyConstruct() {
        // Fallback if model doesn't load: A geometric core representing pure intelligence
        const geo = new THREE.OctahedronGeometry(0.8, 1);
        const mat = new THREE.MeshStandardMaterial({
            color: this.colors.base,
            emissive: this.colors.base,
            emissiveIntensity: 0.5,
            wireframe: true
        });
        this.model = new THREE.Mesh(geo, mat);
        this.scene.add(this.model);
    }

    initAwareness() {
        // Mouse interaction
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastMouseMoveTime = Date.now();
        this.idleLookTarget = { x: 0, y: 0 };
        this.lastBlinkTime = 0;
        this.nextBlinkIn = 3000;

        document.addEventListener('mousemove', (e) => {
            this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
            this.lastMouseMoveTime = Date.now();
        });

        // Resize handler
        window.addEventListener('resize', () => {
            const container = document.getElementById(this.containerId);
            if (!container || !this.camera || !this.renderer) return;

            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        const now = Date.now();
        const time = now * 0.001;

        // 1. Animate Sphere (Heartbeat & Rotation)
        if (this.sphere) {
            this.sphere.rotation.y += 0.002;
            this.sphere.rotation.z = Math.sin(time * 0.2) * 0.1;

            // Heartbeat Pulse
            const pulse = Math.sin(time * 2) * 0.05 + Math.sin(time * 8) * 0.02; // Complex pulse
            const scale = 1 + pulse;
            this.sphere.scale.set(scale, scale, scale);

            // Pulse Glow opacity (if accessible)
            if (this.sphere.children[0] && this.sphere.children[0].material) {
                this.sphere.children[0].material.opacity = 0.05 + Math.abs(pulse) * 0.1;
            }
        }

        // 2. Animate Particles
        if (this.particleSystem) {
            this.particleSystem.rotation.y -= 0.001;
            this.particleSystem.rotation.x = Math.sin(time * 0.1) * 0.1;
        }

        // 3. Animate Model (Hologram)
        if (this.mixer) this.mixer.update(delta);

        if (this.model) {
            // "Float" inside the sphere
            this.model.position.y = -0.5 + Math.sin(time * 1.5) * 0.05;

            // --- Live Behavior ---

            // Blinking
            if (now - this.lastBlinkTime > this.nextBlinkIn) {
                this.blink();
                this.lastBlinkTime = now;
                this.nextBlinkIn = 2000 + Math.random() * 4000;
            }

            // Idle Expressions
            if (!this.isActive) {
                this.handleIdleExpressions(now);
            }

            // Look Logic (Mouse vs Autonomous)
            const timeSinceMove = now - this.lastMouseMoveTime;
            let targetX, targetY;

            if (timeSinceMove < 3000) {
                // Look at mouse
                targetX = this.mouseX * 0.3;
                targetY = this.mouseY * 0.3;
            } else {
                // Drift/Look around randomly
                if (Math.random() < 0.01) {
                    this.idleLookTarget.x = (Math.random() - 0.5) * 0.5;
                    this.idleLookTarget.y = (Math.random() - 0.5) * 0.3;
                }
                targetX = this.idleLookTarget.x + Math.sin(time * 0.5) * 0.05;
                targetY = this.idleLookTarget.y + Math.cos(time * 0.3) * 0.05;
            }

            // Smooth look
            this.model.rotation.y += (targetX - this.model.rotation.y) * 0.05;
            this.model.rotation.x += (-targetY - this.model.rotation.x) * 0.05;
        }

        this.renderer.render(this.scene, this.camera);
    }

    // --- Entity Behavior Methods ---

    blink() {
        if (!this.model) return;
        this.model.traverse((child) => {
            if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                const leftEye = child.morphTargetDictionary['eyeBlinkLeft'] || child.morphTargetDictionary['eyesClosed'];
                const rightEye = child.morphTargetDictionary['eyeBlinkRight'] || child.morphTargetDictionary['eyesClosed'];

                if (leftEye !== undefined) {
                    child.morphTargetInfluences[leftEye] = 1;
                    setTimeout(() => { if (child.morphTargetInfluences) child.morphTargetInfluences[leftEye] = 0; }, 150);
                }
                if (rightEye !== undefined && rightEye !== leftEye) {
                    child.morphTargetInfluences[rightEye] = 1;
                    setTimeout(() => { if (child.morphTargetInfluences) child.morphTargetInfluences[rightEye] = 0; }, 150);
                }
            }
        });
    }

    handleIdleExpressions(time) {
        if (!this.model) return;
        this.model.traverse((child) => {
            if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                // Subtle smile
                const smile = child.morphTargetDictionary['mouthSmile'] || child.morphTargetDictionary['smile'];
                if (smile !== undefined) {
                    child.morphTargetInfluences[smile] = 0.1 + Math.sin(time * 0.002) * 0.05;
                }
                // Micro-brow movement
                const brow = child.morphTargetDictionary['browUpCenter'];
                if (brow !== undefined) {
                    child.morphTargetInfluences[brow] = Math.sin(time * 0.001) * 0.1;
                }
            }
        });
    }

    speak(text) {
        console.log(`Key says: "${text}"`);
        this.isActive = true;

        // Mock speaking animation
        let speakInt = setInterval(() => {
            if (!this.model) return;
            this.model.traverse(c => {
                if (c.isMesh && c.morphTargetDictionary && c.morphTargetInfluences) {
                    const mouth = c.morphTargetDictionary['mouthOpen'] || c.morphTargetDictionary['jawOpen'];
                    if (mouth !== undefined) c.morphTargetInfluences[mouth] = Math.random() * 0.4;
                }
            });
        }, 100);

        setTimeout(() => {
            clearInterval(speakInt);
            if (this.model) {
                this.model.traverse(c => {
                    if (c.isMesh && c.morphTargetDictionary && c.morphTargetInfluences) {
                        const mouth = c.morphTargetDictionary['mouthOpen'] || c.morphTargetDictionary['jawOpen'];
                        if (mouth !== undefined) c.morphTargetInfluences[mouth] = 0;
                    }
                });
            }
            this.isActive = false;
        }, 3000);
    }

    intensify() {
        // Change color to active state (Processing/Thinking)
        if (this.sphere) {
            this.sphere.material.color.setHex(this.colors.active);
        }
        if (this.model) {
            this.model.traverse(c => {
                if (c.isMesh) c.material.emissive.setHex(0xff00ff);
            });
        }
    }

    calm() {
        // Return to base state
        if (this.sphere) {
            this.sphere.material.color.setHex(this.colors.base);
        }
        if (this.model) {
            this.model.traverse(c => {
                if (c.isMesh) c.material.emissive.setHex(0x003344);
            });
        }
    }
}

// Make accessible globally
window.KeyEntity = Key;
