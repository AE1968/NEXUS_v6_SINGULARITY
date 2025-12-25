/**
 * ✨ NEXUS NEURAL PARTICLES v10.0
 * High-performance particle system reacting to AI cognitive load.
 */

const NexusParticles = {
    canvas: null,
    ctx: null,
    particles: [],
    count: 30,
    isActive: true,

    init: function () {
        this.canvas = document.getElementById('bg-equipment-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        for (let i = 0; i < this.count; i++) {
            this.particles.push(this.createParticle());
        }

        this.animate();
        console.log("✨ PARTICLES: Neural Network Visualizer ACTIVE.");
    },

    resize: function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    createParticle: function () {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 2 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.2
        };
    },

    animate: function () {
        if (!this.isActive) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Get Bio-state for reactivity
        const dopamine = window.NexusBioMatrix ? window.NexusBioMatrix.chemistry.dopamine : 0.5;
        const nrg = window.NexusBioMatrix ? window.NexusBioMatrix.energy.current / 100 : 1;
        const color = getComputedStyle(document.documentElement).getPropertyValue('--neon-cyan').trim() || '#00f3ff';

        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;

        this.particles.forEach((p, i) => {
            p.x += p.speedX * (1 + dopamine);
            p.y += p.speedY * (1 + dopamine);

            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            this.ctx.globalAlpha = p.opacity * nrg;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Link particles (Neural Connections)
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 150) {
                    this.ctx.lineWidth = 0.5;
                    this.ctx.globalAlpha = (1 - dist / 150) * 0.2 * nrg;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        });

        requestAnimationFrame(() => this.animate());
    },

    pulse: function () {
        // Trigger a visual burst of activity (e.g. on response)
        this.particles.forEach(p => {
            p.speedX *= 3;
            p.speedY *= 3;
            setTimeout(() => {
                p.speedX /= 3;
                p.speedY /= 3;
            }, 1000);
        });
    }
};

window.NexusParticles = NexusParticles;
document.addEventListener('DOMContentLoaded', () => NexusParticles.init());
