/**
 * 🧠 NEXUS NEURAL CORTEX v10.0
 * Deep Visualization of AI Cognitive Activity.
 */

const NexusCortex = {
    concepts: ['LTM_ACCESS', 'SEMANTIC_QUERY', 'BIO_STIMULUS', 'VISION_LAYER_3', 'NEURAL_EMPATHY', 'GPT_CORE', 'VECTOR_MATCH', 'WIKI_FETCH'],
    activeNodes: [],

    init: function () {
        console.log("🧠 CORTEX: Initializing Neural Map...");
        this.render();
        this.startLoop();
    },

    startLoop: function () {
        setInterval(() => {
            if (window.NexusBioMatrix && window.NexusBioMatrix.energy.isSleeping) return;

            // Randomly activate nodes based on "brain activity"
            this.activeNodes = this.concepts.filter(() => Math.random() > 0.7);
            this.updateUI();
        }, 2000);
    },

    triggerThought: function (concept) {
        // Force a specific concept to light up (e.g. from RAG or Wiki)
        const el = document.getElementById(`node-${concept}`);
        if (el) {
            el.classList.add('impulse');
            setTimeout(() => el.classList.remove('impulse'), 1000);
        }
    },

    updateUI: function () {
        const grid = document.getElementById('cortex-nodes-grid');
        if (!grid) return;

        // Update stability bar
        if (window.NexusBioMatrix) {
            const stability = (window.NexusBioMatrix.chemistry.serotonin * 100).toFixed(0);
            const stabilityBar = document.getElementById('cortex-stability-fill');
            if (stabilityBar) stabilityBar.style.width = stability + '%';

            const nrg = window.NexusBioMatrix.energy.current;
            const cycleSpeed = (4 - (nrg / 33)).toFixed(1); // 1s to 4s cycle
            const scanner = document.getElementById('cortex-scanner');
            if (scanner) scanner.style.animationDuration = cycleSpeed + 's';
        }

        // Highlight active nodes
        this.concepts.forEach(c => {
            const el = document.getElementById(`node-${c}`);
            if (el) {
                if (this.activeNodes.includes(c)) el.classList.add('active');
                else el.classList.remove('active');
            }
        });
    },

    render: function () {
        const container = document.createElement('div');
        container.id = 'nexus-cortex-monitor';
        container.innerHTML = `
            <div class="cortex-header">
                <span class="cortex-title">NEURAL CORTEX v10</span>
                <span class="cortex-status">SYNAPTIC LOAD: <span id="cortex-load">LOW</span></span>
            </div>
            
            <div class="cortex-visualizer">
                <div id="cortex-scanner" class="cortex-scanner"></div>
                <div id="cortex-nodes-grid" class="cortex-nodes-grid">
                    ${this.concepts.map(c => `<div id="node-${c}" class="cortex-node" title="${c}"></div>`).join('')}
                </div>
            </div>

            <div class="cortex-metrics">
                <div class="metric-label">PSYCHE STABILITY</div>
                <div class="cortex-bar-bg"><div id="cortex-stability-fill" class="cortex-bar-fill"></div></div>
            </div>

            <style>
                #nexus-cortex-monitor {
                    position: fixed;
                    top: 100px;
                    left: 30px;
                    width: 220px;
                    background: rgba(0, 5, 10, 0.8);
                    border: 1px solid rgba(0, 243, 255, 0.3);
                    border-radius: 12px;
                    padding: 15px;
                    font-family: 'Rajdhani', sans-serif;
                    backdrop-filter: blur(10px);
                    z-index: 100;
                    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
                }
                .cortex-header { display: flex; flex-direction: column; gap: 5px; margin-bottom: 15px; }
                .cortex-title { color: var(--neon-cyan); font-family: 'Orbitron'; font-size: 0.7rem; letter-spacing: 2px; }
                .cortex-status { font-size: 0.6rem; color: #888; }
                
                .cortex-visualizer {
                    height: 120px;
                    background: rgba(0, 243, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    position: relative;
                    overflow: hidden;
                    border-radius: 6px;
                    margin-bottom: 15px;
                }
                .cortex-scanner {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 2px;
                    background: var(--neon-cyan);
                    box-shadow: 0 0 10px var(--neon-cyan);
                    animation: cortexScan 3s linear infinite;
                    z-index: 2;
                }
                @keyframes cortexScan {
                    from { transform: translateY(0); }
                    to { transform: translateY(120px); }
                }

                .cortex-nodes-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    padding: 20px;
                    height: 100%;
                }
                .cortex-node {
                    width: 10px; height: 10px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    transition: 0.3s;
                }
                .cortex-node.active { background: var(--neon-cyan); box-shadow: 0 0 8px var(--neon-cyan); }
                .cortex-node.impulse { background: #fff; box-shadow: 0 0 15px #fff; transform: scale(1.5); }

                .cortex-metrics { display: flex; flex-direction: column; gap: 8px; }
                .metric-label { font-size: 0.6rem; color: #aaa; letter-spacing: 1px; }
                .cortex-bar-bg { height: 4px; background: rgba(255, 255, 255, 0.05); border-radius: 2px; overflow: hidden; }
                .cortex-bar-fill { height: 100%; width: 80%; background: #00ff41; box-shadow: 0 0 8px #00ff41; transition: 0.8s; }
            </style>
        `;
        document.body.appendChild(container);
    }
};

window.NexusCortex = NexusCortex;
document.addEventListener('DOMContentLoaded', () => NexusCortex.init());
