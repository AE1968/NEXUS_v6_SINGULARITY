/**
 * 👁️ NEXUS VISION v6.0 (REAL)
 * Uses face-api.js for biometric analysis via webcam.
 */

const NexusVision = {
    video: null,
    canvas: null,
    isModelLoaded: false,
    isSeeing: false,

    config: {
        // Public CDN for models to keep Client Thin
        modelBaseUrl: "https://justadudewhohacks.github.io/face-api.js/models"
    },

    init: async function () {
        console.log("👁️ VISION: Initializing Optical Sensors...");
        // Updated ID to match what we put in HTML
        this.video = document.getElementById('nexus-eye');
        this.canvas = document.getElementById('nexus-vision-canvas');

        try {
            await this.loadModels();
            console.log("👁️ VISION: Models Loaded. Ready to open eyes.");

            // Auto-start for seamless experience (Policy Check: only if user allowed)
            // this.startEyes(); 
        } catch (e) {
            console.error("👁️ VISION ERROR: Model Load Failed", e);
        }
    },

    loadModels: async function () {
        console.log("👁️ VISION: Downloading Neural Weights...");
        // Load lightweight models for performance
        await faceapi.nets.tinyFaceDetector.loadFromUri(this.config.modelBaseUrl);
        await faceapi.nets.faceLandmark68Net.loadFromUri(this.config.modelBaseUrl);
        await faceapi.nets.faceRecognitionNet.loadFromUri(this.config.modelBaseUrl);
        await faceapi.nets.faceExpressionNet.loadFromUri(this.config.modelBaseUrl);
        this.isModelLoaded = true;
    },

    startEyes: async function () {
        if (!this.isModelLoaded) await this.init();
        if (this.isSeeing) return "Eyes already open.";

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            this.video.srcObject = stream;
            this.isSeeing = true;
            console.log("👁️ VISION: Webcam Stream Active.");

            // Start Loop
            this.loopAnalysis();

            return "Visual Sensors Online.";
        } catch (err) {
            console.error(err);
            return "Vision Error: Camera Access Denied.";
        }
    },

    stopEyes: function () {
        if (this.video && this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
            this.isSeeing = false;
        }
    },

    loopAnalysis: function () {
        setInterval(async () => {
            if (this.isSeeing) await this.recognizeFaces();
        }, 2000); // Check every 2 seconds
    },

    recognizeFaces: async function () {
        if (!this.isSeeing || !this.video) return;

        const detections = await faceapi.detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (detections.length > 0) {
            const face = detections[0];
            const expressions = face.expressions;
            // Get dominant emotion
            const emotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);

            // Normalize emotion confidence
            const confidence = expressions[emotion];

            if (confidence > 0.5) {
                const obs = `User detected. Emotion seems ${emotion}.`;
                console.log("👁️ SAW:", obs);

                // Send to Brain
                if (window.NexusNeuralEngine) {
                    window.NexusNeuralEngine.receiveSensoryInput('vision', {
                        found: true,
                        emotion: emotion,
                        raw: obs
                    });
                }
            }
        }
    },

    // Legacy mapping
    scan: function () { return this.isSeeing ? "Scanning Live Feed..." : "Offline"; }
};

window.NexusVision = NexusVision;
window.addEventListener('load', () => NexusVision.init());
