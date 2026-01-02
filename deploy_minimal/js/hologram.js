const HologramSystem = {

    scene: null,

    camera: null,

    renderer: null,

    model: null,

    mixer: null,

    animations: {},

    morphTargets: {},

    clock: new THREE.Clock(),

    isSpeaking: false,



    // Mouse tracking for eye following

    mouseX: 0,

    mouseY: 0,

    targetLookX: 0,

    targetLookY: 0,



    init: function () {

        const container = document.getElementById('hologram-container');

        if (!container) return;



        // Setup mouse tracking

        document.addEventListener('mousemove', (e) => {

            // Normalize mouse position to -1 to 1

            this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;

            this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

        });



        // Scene setup with transparent background

        this.scene = new THREE.Scene();



        // Camera

        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

        this.camera.position.set(0, 0, 2.5);



        // Renderer with transparency

        this.renderer = new THREE.WebGLRenderer({

            antialias: true,

            alpha: true,

            powerPreference: "high-performance"

        });

        this.renderer.setSize(600, 600);

        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.renderer.setClearColor(0x000000, 0);

        this.renderer.outputEncoding = THREE.sRGBEncoding;

        container.appendChild(this.renderer.domElement);



        // Holographic lighting

        const ambientLight = new THREE.AmbientLight(0x00f3ff, 0.5);

        this.scene.add(ambientLight);



        const frontLight = new THREE.DirectionalLight(0x00f3ff, 1);

        frontLight.position.set(0, 1, 2);

        this.scene.add(frontLight);



        const backLight = new THREE.DirectionalLight(0xff00ff, 0.5);

        backLight.position.set(0, 0, -2);

        this.scene.add(backLight);



        const rimLight = new THREE.PointLight(0x00f3ff, 0.8, 10);

        rimLight.position.set(2, 1, 0);

        this.scene.add(rimLight);



        // Initialize Energy Sphere if available

        if (window.EnergySphere) {

            window.EnergySphere.init(this.scene);

        }



        // Load 3D model

        this.loadModel();



        // Create particle system

        this.createParticles();



        // Start animation loop

        this.animate();



        console.log('\u2705 Hologram System initialized');

    },



    // Particle system for processing effect

    particles: null,

    particleActive: false,



    createParticles: function () {

        const particleCount = 100;

        const geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(particleCount * 3);



        for (let i = 0; i < particleCount; i++) {

            // Sphere distribution around head

            const theta = Math.random() * Math.PI * 2;

            const phi = Math.random() * Math.PI;

            const radius = 0.8 + Math.random() * 0.4;



            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);

            positions[i * 3 + 1] = radius * Math.cos(phi);

            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

        }



        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));



        const material = new THREE.PointsMaterial({

            color: 0x00f3ff,

            size: 0.02,

            transparent: true,

            opacity: 0,

            blending: THREE.AdditiveBlending

        });



        this.particles = new THREE.Points(geometry, material);

        this.scene.add(this.particles);

    },



    // Start particles when processing

    startProcessing: function () {

        this.particleActive = true;

        if (this.particles) {

            this.particles.material.opacity = 0.8;

        }

        this.setColor('processing');

        if (window.EnergySphere) window.EnergySphere.intensify();

    },



    // Stop particles

    stopProcessing: function () {

        this.particleActive = false;

        if (this.particles) {

            this.particles.material.opacity = 0;

        }

        this.setColor('default');

        if (window.EnergySphere) window.EnergySphere.calm();

    },



    // Color states for hologram

    colorStates: {

        default: { color: 0x00f3ff, emissive: 0x003344 },

        processing: { color: 0xff00ff, emissive: 0x440044 },

        happy: { color: 0x00ff88, emissive: 0x004422 },

        sad: { color: 0x4488ff, emissive: 0x112244 },

        angry: { color: 0xff4444, emissive: 0x441111 },

        speaking: { color: 0x00ffff, emissive: 0x004444 }

    },



    setColor: function (state) {

        if (!this.model) return;

        const colors = this.colorStates[state] || this.colorStates.default;



        this.model.traverse((child) => {

            if (child.isMesh && child.material) {

                child.material.color.setHex(colors.color);

                child.material.emissive.setHex(colors.emissive);

            }

        });

    },



    loadModel: function () {

        const loader = new THREE.GLTFLoader();

        const modelPath = 'assets/hologram.glb';



        loader.load(

            modelPath,

            (gltf) => {

                this.model = gltf.scene;



                // Apply holographic material

                this.model.traverse((child) => {

                    if (child.isMesh) {

                        child.material = new THREE.MeshPhongMaterial({

                            color: 0x00f3ff,

                            emissive: 0x003344,

                            transparent: true,

                            opacity: 0.85,

                            wireframe: false,

                            side: THREE.DoubleSide

                        });



                        // Store morph targets for facial animations

                        if (child.morphTargetInfluences) {

                            this.morphTargets[child.name] = child;

                            console.log('Morph targets found:', child.morphTargetDictionary);

                        }

                    }

                });



                // Position and scale

                this.model.position.set(0, -0.3, 0);

                this.model.scale.set(1.5, 1.5, 1.5);



                this.scene.add(this.model);



                // Setup animations

                if (gltf.animations && gltf.animations.length > 0) {

                    this.mixer = new THREE.AnimationMixer(this.model);

                    gltf.animations.forEach((clip) => {

                        this.animations[clip.name] = this.mixer.clipAction(clip);

                        console.log('Animation loaded:', clip.name);

                    });



                    // Play idle animation if exists

                    if (this.animations['idle']) {

                        this.animations['idle'].play();

                    } else {

                        // Play first animation

                        const firstAnim = Object.values(this.animations)[0];

                        if (firstAnim) firstAnim.play();

                    }

                }



                console.log('\u2705 3D Model loaded successfully');

            },

            (progress) => {

                const percent = (progress.loaded / progress.total * 100).toFixed(1);

                console.log(`Loading model: ${percent}%`);

            },

            (error) => {

                console.warn('Model loading error:', error);

            }

        );

    },



    animate: function () {

        requestAnimationFrame(() => this.animate());



        const delta = this.clock.getDelta();

        const time = Date.now();



        // Update animations

        if (this.mixer) {

            this.mixer.update(delta);

        }



        // Update Energy Sphere

        if (window.EnergySphere) {

            window.EnergySphere.update();

        }



        // ===== HUMAN-LIKE BEHAVIORS =====

        if (this.model) {

            // Gentle floating/breathing animation

            this.model.position.y = -0.3 + Math.sin(time * 0.001) * 0.015;



            // ===== EYE/HEAD TRACKING - Follow cursor =====

            // Smooth interpolation towards mouse position

            this.targetLookX += (this.mouseX * 0.15 - this.targetLookX) * 0.05;

            this.targetLookY += (this.mouseY * 0.1 - this.targetLookY) * 0.05;



            // Apply to head rotation (combine with subtle idle movement)

            this.model.rotation.y = this.targetLookX + Math.sin(time * 0.0003) * 0.03;

            this.model.rotation.x = -this.targetLookY + Math.sin(time * 0.0005) * 0.02;



            // Natural blinking (every 3-5 seconds)

            this.handleBlinking(time);



            // Micro-expressions when idle

            if (!this.isSpeaking) {

                this.handleIdleExpressions(time);

            }

        }



        // Lip sync simulation when speaking

        if (this.isSpeaking && this.model) {

            this.simulateLipSync();

        }



        this.renderer.render(this.scene, this.camera);

    },



    // Natural blinking behavior

    lastBlinkTime: 0,

    nextBlinkIn: 3000,



    handleBlinking: function (time) {

        if (time - this.lastBlinkTime > this.nextBlinkIn) {

            this.blink();

            this.lastBlinkTime = time;

            this.nextBlinkIn = 2500 + Math.random() * 3000; // 2.5-5.5 seconds

        }

    },



    blink: function () {

        this.model.traverse((child) => {

            if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {

                const leftEye = child.morphTargetDictionary['eyeBlinkLeft'] || child.morphTargetDictionary['eyesClosed'];

                const rightEye = child.morphTargetDictionary['eyeBlinkRight'] || child.morphTargetDictionary['eyesClosed'];



                if (leftEye !== undefined) {

                    // Quick blink animation

                    child.morphTargetInfluences[leftEye] = 1;

                    setTimeout(() => { if (child.morphTargetInfluences) child.morphTargetInfluences[leftEye] = 0; }, 150);

                }

                if (rightEye !== undefined && rightEye !== leftEye) {

                    child.morphTargetInfluences[rightEye] = 1;

                    setTimeout(() => { if (child.morphTargetInfluences) child.morphTargetInfluences[rightEye] = 0; }, 150);

                }

            }

        });

    },



    // Subtle idle expressions - polite, attentive look

    handleIdleExpressions: function (time) {

        this.model.traverse((child) => {

            if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {

                // Subtle friendly smile

                const smile = child.morphTargetDictionary['mouthSmile'] || child.morphTargetDictionary['smile'];

                if (smile !== undefined) {

                    child.morphTargetInfluences[smile] = 0.15 + Math.sin(time * 0.0002) * 0.05;

                }



                // Slight brow movement (attentive)

                const browUp = child.morphTargetDictionary['browUpCenter'] || child.morphTargetDictionary['browInnerUp'];

                if (browUp !== undefined) {

                    child.morphTargetInfluences[browUp] = Math.sin(time * 0.0003) * 0.1;

                }

            }

        });

    },



    simulateLipSync: function () {

        // Simulate mouth movement based on audio

        Object.values(this.morphTargets).forEach(mesh => {

            if (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0) {

                const mouthIndex = mesh.morphTargetDictionary?.['mouthOpen'] ||

                    mesh.morphTargetDictionary?.['jawOpen'] || 0;

                mesh.morphTargetInfluences[mouthIndex] =

                    Math.abs(Math.sin(Date.now() * 0.015)) * 0.5;

            }

        });

    },



    startSpeaking: function () {

        this.isSpeaking = true;

        document.body.classList.add('speaking');

    },



    stopSpeaking: function () {

        this.isSpeaking = false;

        document.body.classList.remove('speaking');



        // Reset mouth

        Object.values(this.morphTargets).forEach(mesh => {

            if (mesh.morphTargetInfluences) {

                mesh.morphTargetInfluences.fill(0);

            }

        });

    },



    setEmotion: function (emotion) {

        if (!this.model) return;



        // Emotion morph target mappings

        const emotionMorphs = {

            happy: ['smile', 'mouthSmile', 'eyeWideLeft', 'eyeWideRight', 'cheekPuff'],

            sad: ['mouthFrown', 'frownLeft', 'frownRight', 'eyeSquintLeft', 'eyeSquintRight', 'browDownLeft', 'browDownRight'],

            angry: ['browDownLeft', 'browDownRight', 'eyeSquintLeft', 'eyeSquintRight', 'mouthFrown', 'jawForward'],

            surprised: ['eyeWideLeft', 'eyeWideRight', 'browUpLeft', 'browUpRight', 'jawOpen', 'mouthOpen'],

            thinking: ['eyeSquintLeft', 'browUpRight', 'mouthPucker'],

            neutral: []

        };



        const targetMorphs = emotionMorphs[emotion] || emotionMorphs.neutral;



        // Apply morph targets to model

        this.model.traverse((child) => {

            if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {

                // Reset all morphs first

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



        console.log(`\u1f3ad Hologram emotion set: ${emotion}`);

    }

};



// =====================================================================

// EMOTION DETECTOR - Analyze text and detect emotion

// =====================================================================

const EmotionDetector = {

    // Keywords for emotion detection

    patterns: {

        happy: ['bun', 'excelent', 'perfect', 'frumos', 'super', 'minunat', 'fantastic', 'bucuros', 'fericit',

            'good', 'great', 'excellent', 'wonderful', 'amazing', 'happy', 'glad', 'pleased', '\u1f60a', '\u1f604', '\u1f389', '\u1f44d'],

        sad: ['trist', 'r\u0103u', 'p\u0103cat', 'din p\u0103cate', 'regret', 'scuze', '\u00eemi pare r\u0103u',

            'sad', 'sorry', 'unfortunately', 'regret', 'apologize', '\u1f622', '\u1f614', '\u1f494'],

        angry: ['gre\u0219it', 'incorect', 'eroare', 'nu se poate', 'blocat', 'interzis',

            'error', 'wrong', 'invalid', 'blocked', 'forbidden', 'cannot', '\u1f620', '\u274c'],

        surprised: ['wow', 'uimitor', 'incredibil', 'serios', 'nu-mi vine s\u0103 cred', 'impresionant',

            'amazing', 'incredible', 'unbelievable', 'seriously', 'wow', '\u1f62e', '\u1f92f', '!'],

        thinking: ['hmm', 'interesant', 'las\u0103-m\u0103 s\u0103 gndesc', 'procesez', 'analizez', 'caut',

            'thinking', 'processing', 'analyzing', 'searching', 'let me', 'consider', '\u1f914']

    },



    detect: function (text) {

        const lowerText = (text || '').toLowerCase();



        // Check each emotion pattern

        for (const [emotion, keywords] of Object.entries(this.patterns)) {

            for (const keyword of keywords) {

                if (lowerText.includes(keyword.toLowerCase())) {

                    return emotion;

                }

            }

        }



        // Default to neutral

        return 'neutral';

    },



    // Apply detected emotion to hologram

    applyToHologram: function (text) {

        const emotion = this.detect(text);

        if (window.HologramSystem) {

            window.HologramSystem.setEmotion(emotion);

        }

        return emotion;

    }

};



// Expose EmotionDetector globally

window.EmotionDetector = EmotionDetector;



// Initialize hologram when page ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Verifică dacă AI_key (sfera plasma animată) este disponibilă
        if (window.AI_key) {
            // Folosește AI_key pentru sfera plasma cu animații
            const hologramContainer = document.getElementById('hologram-container');
            if (hologramContainer) {
                window.aiKeyEntity = new AI_key('hologram-container');
                console.log('✅ AI_key Plasma Sphere activated');
            }
        } else {
            // Fallback la sistemul vechi HologramSystem
            HologramSystem.init();
            console.log('✅ HologramSystem (legacy) activated');
        }
    }, 2000); // Wait for loading screen
});



// Expose to global for voice integration

window.HologramSystem = HologramSystem;



// =====================================================================

// ACCESSIBILITY: Subtitle System for Hearing Impaired

// =====================================================================

