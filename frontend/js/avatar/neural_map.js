const NeuralMap = {
    canvas: null,
    ctx: null,
    nodes: [],
    connections: [],

    init() {
        this.canvas = document.getElementById('neural-map');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    },

    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    },

    addNode(label, color = "#00f3ff") {
        if (!this.canvas) return;
        const node = {
            id: Date.now(),
            label: label,
            color: color,
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            life: 1.0
        };
        this.nodes.push(node);
        if (this.nodes.length > 15) this.nodes.shift();
    },

    animate() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Connections First
        this.ctx.beginPath();
        this.ctx.strokeStyle = "rgba(0, 243, 255, 0.15)";
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const dist = Math.hypot(this.nodes[i].x - this.nodes[j].x, this.nodes[i].y - this.nodes[j].y);
                if (dist < 150) {
                    this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
                    this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
                }
            }
        }
        this.ctx.stroke();

        // Move and Draw nodes
        this.nodes.forEach(n => {
            n.x += n.vx;
            n.y += n.vy;
            if (n.x < 0 || n.x > this.canvas.width) n.vx *= -1;
            if (n.y < 0 || n.y > this.canvas.height) n.vy *= -1;

            // Fading life for older nodes
            n.life -= 0.0005;
            if (n.life < 0.3) n.life = 0.3;

            // Draw Node Glow
            this.ctx.beginPath();
            this.ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = n.color + "22"; // 13% opacity
            this.ctx.fill();

            // Draw Core
            this.ctx.beginPath();
            this.ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = n.color;
            this.ctx.globalAlpha = n.life;
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;

            this.ctx.font = "700 9px 'Orbitron', sans-serif";
            this.ctx.fillStyle = n.color;
            this.ctx.globalAlpha = n.life;
            this.ctx.fillText(n.label.toUpperCase(), n.x + 8, n.y + 3);
            this.ctx.globalAlpha = 1.0;
        });

        requestAnimationFrame(() => this.animate());
    }
};
