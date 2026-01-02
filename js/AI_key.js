/**
 * AI_key - REAL PLASMA GLOBE PHYSICS (FINAL)
 * 
 * Visual Target: High-voltage electrostatic plasma lamp.
 * - Glass Sphere (Dielectric barrier).
 * - Central Electrode (Hologram Head).
 * - Plasma Streamers: Sinuous, waving filaments connecting center to shell.
 * - Noble Gas Glow: Volumetric background illumination.
 * 
 * UPGRADED: Uses TubeGeometry for volumetric persistent streamers.
 */

class AI_key {
    constructor(containerId) {
        this.containerId = containerId;
        this.scene = null;
        this.camera = null;
        this.renderer = null;

        this.streamers = []; // The plasma filaments
        this.glassSphere = null;
        this.coreModel = null;
        this.mixer = null;

        this.clock = new THREE.Clock();

        // Colors strict: Cyan & Magenta Plasma
        this.colors = {
            cyan: new THREE.Color(0x00f3ff),
            magenta: new THREE.Color(0xff00ff)
        };

        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        this.setupScene(container);
        this.createGlassShell();
        this.loadElectrode(); // Capul animat în sferă
        this.animate();

        console.log("AI_key: Plasma Sphere + Animated Head Active.");
    }

    setupScene(container) {
        this.scene = new THREE.Scene();
        // Background transparent pentru a folosi fundalul din CSS
        // this.scene.background = null; // Transparent

        this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
        this.camera.position.z = 4.2;

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Post-processing glow sim via tone mapping
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.5;

        container.appendChild(this.renderer.domElement);
    }

    createGlassShell() {
        // 1. The Physical Glass
        const geometry = new THREE.SphereGeometry(1.6, 64, 64);
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.0,
            metalness: 0.1,
            transmission: 0.9, // Glass
            thickness: 0.5,
            transparent: true,
            opacity: 0.3,
            side: THREE.FrontSide
        });
        this.glassSphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.glassSphere);

        // 2. The Gas Glow (Inner Atmosphere)
        const gasGeo = new THREE.SphereGeometry(1.5, 64, 64);
        const gasMat = new THREE.ShaderMaterial({
            uniforms: {
                viewVector: { value: this.camera.position }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vView = normalize(normalMatrix * viewVector);
                    intensity = pow(0.7 - dot(vNormal, vView), 3.0);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying float intensity;
                void main() {
                    // Deep Purple/Blue gas background
                    vec3 gas = vec3(0.1, 0.0, 0.3);
                    gl_FragColor = vec4(gas, intensity * 0.8);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        });
        const gasSphere = new THREE.Mesh(gasGeo, gasMat);
        this.scene.add(gasSphere);
    }

    loadElectrode() {
        const loader = new THREE.GLTFLoader();
        loader.load('assets/hologram.glb', (gltf) => {
            this.coreModel = gltf.scene;
            this.coreModel.position.set(0, -0.6, 0);
            this.coreModel.scale.set(1.4, 1.4, 1.4);

            // Conductive Material (The Source)
            const electrodeMat = new THREE.MeshBasicMaterial({
                color: 0xffffff, // Hot white center
            });

            this.coreModel.traverse((o) => {
                if (o.isMesh) {
                    o.material = electrodeMat;
                }
            });

            this.scene.add(this.coreModel);

            // Initialize Streamers AFTER electrode is ready
            this.initPlasmaStreamers();

            if (gltf.animations.length) {
                this.mixer = new THREE.AnimationMixer(this.coreModel);
                this.mixer.clipAction(gltf.animations[0]).play();
            }
        });
    }

    initPlasmaStreamers() {
        // Create N persistent streamers that dance
        const streamerCount = 8;

        for (let i = 0; i < streamerCount; i++) {
            this.createStreamer();
        }
    }

    createStreamer() {
        // A streamer is distinct Mesh (Tube) for volumetric thickness
        const segmentCount = 20;
        const curve = new THREE.CatmullRomCurve3(new Array(segmentCount).fill(new THREE.Vector3(0, 0, 0)));

        const geometry = new THREE.TubeGeometry(curve, segmentCount, 0.02, 3, false);
        const material = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? this.colors.cyan : this.colors.magenta,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        const streamer = new THREE.Mesh(geometry, material);

        // Metadata for animation
        streamer.userData = {
            target: this.generateRandomSurfacePoint(),
            phase: Math.random() * Math.PI * 2,
            speed: 1.5 + Math.random() * 2.0,
            amplitude: 0.15 + Math.random() * 0.15,
            segments: segmentCount
        };

        this.streamers.push(streamer);
        this.scene.add(streamer);
    }

    generateRandomSurfacePoint() {
        const r = 1.55; // Touch inner glass
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        return new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
    }

    updateStreamers(time) {
        // Update physics of each streamer
        this.streamers.forEach(streamer => {

            // Start Point: Center of Head
            const start = new THREE.Vector3(0, 0.1, 0);
            const end = streamer.userData.target;

            // Wandering target logic
            if (Math.random() < 0.03) {
                streamer.userData.target.lerp(this.generateRandomSurfacePoint(), 0.3).normalize().multiplyScalar(1.55);
            }

            // Calculate new curve points
            const points = [];
            const segments = streamer.userData.segments;

            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                // Base Path (Linear interpolation)
                const base = new THREE.Vector3().lerpVectors(start, end, t);

                // Plasma Wiggle (Sine waves)
                const wiggleX = Math.sin(t * 12 + time * streamer.userData.speed + streamer.userData.phase) * streamer.userData.amplitude * Math.sin(t * Math.PI);
                const wiggleY = Math.cos(t * 9 + time * streamer.userData.speed) * streamer.userData.amplitude * Math.sin(t * Math.PI);
                const wiggleZ = Math.sin(t * 15 + time) * streamer.userData.amplitude * 0.5 * Math.sin(t * Math.PI);

                base.add(new THREE.Vector3(wiggleX, wiggleY, wiggleZ));
                points.push(base);
            }

            // Update Geometry
            const newCurve = new THREE.CatmullRomCurve3(points);
            streamer.geometry.dispose();
            streamer.geometry = new THREE.TubeGeometry(newCurve, segments, 0.015, 3, false); // Thick bolts (0.015 radius)

            // Pulse opacity
            streamer.material.opacity = 0.7 + Math.sin(time * 15 + streamer.userData.phase) * 0.3;
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        // 1. Update Plasma Physics
        this.updateStreamers(time);

        // 2. Rotate Glass slightly
        if (this.glassSphere) {
            this.glassSphere.rotation.y = time * 0.05;
        }

        // 3. Animation Mixer (Head)
        if (this.mixer) this.mixer.update(delta);

        this.renderer.render(this.scene, this.camera);
    }

    // =====================================================
    // API INTERFACE - Full Implementation
    // =====================================================

    /**
     * SPEAK - Animează gura și schimbă culoarea în speaking mode
     * @param {string} text - Textul care va fi "spus"
     * @param {number} duration - Durata animației în ms (default 3000)
     */
    speak(text, duration = 3000) {
        console.log(`🔊 AI_key speaking: "${text}"`);
        this.isSpeaking = true;

        // Schimbă culoarea streamers în cyan intens
        this.streamers.forEach(s => {
            s.material.color.setHex(0x00ffff);
        });

        // Animație gură
        const speakInterval = setInterval(() => {
            if (!this.coreModel) return;
            this.coreModel.traverse(child => {
                if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                    const mouthOpen = child.morphTargetDictionary['mouthOpen'] ||
                        child.morphTargetDictionary['jawOpen'] || 0;
                    if (mouthOpen !== undefined) {
                        // Simulare vorbire cu variație
                        child.morphTargetInfluences[mouthOpen] = Math.random() * 0.5 + 0.1;
                    }
                }
            });
        }, 80);

        // Oprire după durată
        setTimeout(() => {
            clearInterval(speakInterval);
            this.isSpeaking = false;

            // Reset gură
            if (this.coreModel) {
                this.coreModel.traverse(child => {
                    if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                        const mouthOpen = child.morphTargetDictionary['mouthOpen'] ||
                            child.morphTargetDictionary['jawOpen'] || 0;
                        if (mouthOpen !== undefined) {
                            child.morphTargetInfluences[mouthOpen] = 0;
                        }
                    }
                });
            }

            // Reset culori streameri
            this.streamers.forEach((s, i) => {
                s.material.color = i % 2 === 0 ? this.colors.cyan.clone() : this.colors.magenta.clone();
            });

            console.log('🔇 AI_key finished speaking');
        }, duration);
    }

    /**
     * LISTEN - Mod de ascultare (microfon activ)
     */
    listen() {
        console.log('👂 AI_key listening...');
        this.isListening = true;

        // Pulsație subtilă pe sferă
        if (this.glassSphere) {
            this.glassSphere.material.emissive = new THREE.Color(0x00ff00);
            this.glassSphere.material.emissiveIntensity = 0.3;
        }

        // Streameri verzi pentru listening
        this.streamers.forEach(s => {
            s.material.color.setHex(0x00ff88);
        });
    }

    /**
     * STOP LISTENING - Oprește modul de ascultare
     */
    stopListening() {
        console.log('🔇 AI_key stopped listening');
        this.isListening = false;

        if (this.glassSphere) {
            this.glassSphere.material.emissive = new THREE.Color(0x000000);
            this.glassSphere.material.emissiveIntensity = 0;
        }

        // Reset culori
        this.streamers.forEach((s, i) => {
            s.material.color = i % 2 === 0 ? this.colors.cyan.clone() : this.colors.magenta.clone();
        });
    }

    /**
     * CALM - Stare de repaus, culori normale, animații subtile
     */
    calm() {
        console.log('😌 AI_key calm mode');
        this.isProcessing = false;
        this.isSpeaking = false;
        this.isListening = false;

        // Reset glass sphere
        if (this.glassSphere) {
            this.glassSphere.material.opacity = 0.3;
            this.glassSphere.material.emissive = new THREE.Color(0x000000);
        }

        // Reset streameri la culori originale
        this.streamers.forEach((s, i) => {
            s.material.color = i % 2 === 0 ? this.colors.cyan.clone() : this.colors.magenta.clone();
            s.material.opacity = 0.9;
        });

        // Reset cap la alb
        if (this.coreModel) {
            this.coreModel.traverse(child => {
                if (child.isMesh) {
                    child.material.color.setHex(0xffffff);
                }
            });
        }
    }

    /**
     * INTENSIFY - Mod intens de procesare (culori magenta, pulsație rapidă)
     */
    intensify() {
        console.log('⚡ AI_key INTENSIFY mode');
        this.isProcessing = true;

        // Sferă cu opacity mai mare și emissive
        if (this.glassSphere) {
            this.glassSphere.material.opacity = 0.5;
            this.glassSphere.material.emissive = new THREE.Color(0xff00ff);
            this.glassSphere.material.emissiveIntensity = 0.5;
        }

        // Toți streamerii devin magenta intens
        this.streamers.forEach(s => {
            s.material.color.setHex(0xff00ff);
            s.material.opacity = 1.0;
        });

        // Capul devine magenta/roz
        if (this.coreModel) {
            this.coreModel.traverse(child => {
                if (child.isMesh) {
                    child.material.color.setHex(0xff88ff);
                }
            });
        }
    }

    /**
     * PROCESS - Indicator de procesare (pentru "thinking" state)
     */
    process() {
        console.log('🤔 AI_key processing...');
        this.isProcessing = true;

        // Alternare culori pe streameri
        let colorToggle = true;
        const processInterval = setInterval(() => {
            this.streamers.forEach(s => {
                s.material.color.setHex(colorToggle ? 0x00f3ff : 0xff00ff);
            });
            colorToggle = !colorToggle;
        }, 200);

        // Salvăm intervalul pentru a-l putea opri
        this.processInterval = processInterval;
    }

    /**
     * STOP PROCESSING - Oprește animația de procesare
     */
    stopProcessing() {
        console.log('✅ AI_key stop processing');
        this.isProcessing = false;

        if (this.processInterval) {
            clearInterval(this.processInterval);
            this.processInterval = null;
        }

        // Reset la calm
        this.calm();
    }

    /**
     * SET EMOTION - Setează emoția capului (happy, sad, angry, surprised, thinking)
     */
    setEmotion(emotion) {
        if (!this.coreModel) return;
        console.log(`🎭 AI_key emotion: ${emotion}`);

        const emotionMorphs = {
            happy: ['smile', 'mouthSmile', 'eyeWideLeft', 'eyeWideRight'],
            sad: ['mouthFrown', 'browDownLeft', 'browDownRight'],
            angry: ['browDownLeft', 'browDownRight', 'mouthFrown'],
            surprised: ['eyeWideLeft', 'eyeWideRight', 'browUpLeft', 'browUpRight', 'mouthOpen'],
            thinking: ['eyeSquintLeft', 'browUpRight'],
            neutral: []
        };

        const targetMorphs = emotionMorphs[emotion] || emotionMorphs.neutral;

        this.coreModel.traverse(child => {
            if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                // Reset all
                child.morphTargetInfluences.fill(0);

                // Apply emotion morphs
                targetMorphs.forEach(morphName => {
                    const index = child.morphTargetDictionary[morphName];
                    if (index !== undefined) {
                        child.morphTargetInfluences[index] = 0.7;
                    }
                });
            }
        });
    }

    /**
     * DESTROY - Cleanup pentru când entitatea nu mai e necesară
     */
    destroy() {
        console.log('💀 AI_key destroyed');

        // Stop all intervals
        if (this.processInterval) clearInterval(this.processInterval);

        // Dispose geometries și materials
        this.streamers.forEach(s => {
            s.geometry.dispose();
            s.material.dispose();
            this.scene.remove(s);
        });

        if (this.glassSphere) {
            this.glassSphere.geometry.dispose();
            this.glassSphere.material.dispose();
        }

        if (this.coreModel) {
            this.scene.remove(this.coreModel);
        }

        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

window.AI_key = AI_key;
