/**
 * 🎄 QUANTUM & CHRONO COUNTDOWNS 🎆
 * Left: Quantum Monolith (Christmas)
 * Right: Chrono Capsule (New Year)
 * + Fireworks Logic at Midnight!
 */

(function () {

    // --- CONFIGURATION ---
    // Auto-detect current year for dynamic updates
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // If we're in January and New Year has passed, use next year for Christmas
    const TARGET_YEAR = (currentMonth === 0) ? currentYear : currentYear;

    const TARGETS = {
        christmas: new Date(`December 25, ${TARGET_YEAR} 00:00:00`).getTime(),
        newyear: new Date(`January 1, ${TARGET_YEAR + 1} 00:00:00`).getTime()
    };

    const TRANSLATIONS = {
        en: { christmas: 'Christmas', newyear: 'New Year 2026', days: 'd', hours: 'h', mins: 'm', secs: 's' },
        ro: { christmas: 'Crăciun', newyear: 'Anul Nou 2026', days: 'z', hours: 'o', mins: 'm', secs: 's' },
        fr: { christmas: 'Noël', newyear: 'Nouvel An 2026', days: 'j', hours: 'h', mins: 'm', secs: 's' },
        de: { christmas: 'Weihnachten', newyear: 'Neujahr 2026', days: 't', hours: 's', mins: 'm', secs: 's' },
        es: { christmas: 'Navidad', newyear: 'Año Nuevo 2026', days: 'd', hours: 'h', mins: 'm', secs: 's' }
    };

    // --- FIREWORKS SYSTEM ---
    let fireworksInterval = null;
    function startFireworks() {
        if (fireworksInterval) return; // Already running

        // Create Canvas Overlay
        const canvas = document.createElement('canvas');
        canvas.id = 'fireworks-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0'; canvas.style.left = '0';
        canvas.style.width = '100vw'; canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];

        function Particle(x, y, color) {
            this.x = x; this.y = y; this.color = color;
            this.velocity = { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 };
            this.alpha = 1; this.friction = 0.95;
        }

        Particle.prototype.draw = function () {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }

        Particle.prototype.update = function () {
            this.velocity.x *= this.friction;
            this.velocity.y *= this.friction;
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.alpha -= 0.01;
        }

        function createFirework(x, y) {
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#ffffff'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            for (let i = 0; i < 30; i++) {
                particles.push(new Particle(x, y, color));
            }
        }

        const animate = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, index) => {
                if (p.alpha > 0) { p.update(); p.draw(); } else { particles.splice(index, 1); }
            });
        };

        fireworksInterval = setInterval(() => {
            createFirework(Math.random() * canvas.width, Math.random() * canvas.height * 0.5);
            requestAnimationFrame(animate);
        }, 500); // New firework every 0.5s

        // Stop after 1 minute (60000ms)
        setTimeout(() => {
            clearInterval(fireworksInterval);
            fireworksInterval = null;
            canvas.remove();
        }, 60000);
    }


    // --- CREATE CLOCKS ---
    function createClocks() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        const styleSheet = document.createElement("style");
        styleSheet.innerText = `
            /* --- QUANTUM MONOLITH (Left) - OBSIDIAN GRADE --- */
            @keyframes scan-laser { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
            @keyframes pulse-gold { 0%, 100% { text-shadow: 0 0 5px #d4af37, 0 0 10px #d4af37; } 50% { text-shadow: 0 0 15px #ffd700, 0 0 25px #ffd700; } 100% { text-shadow: 0 0 5px #d4af37, 0 0 10px #d4af37; } }
            @keyframes holo-flicker { 0% { opacity: 0.9; } 5% { opacity: 0.8; } 10% { opacity: 0.9; } 100% { opacity: 0.9; } }

            .monolith-clock {
                position: absolute; top: 20px; width: 100px; height: 160px;
                background: linear-gradient(135deg, #222 0%, #000 100%);
                border-radius: 4px;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                box-shadow: 
                    0 0 0 1px #333, /* Edge */
                    10px 10px 20px rgba(0,0,0,0.8), /* Drop shadow */
                    inset 2px 2px 10px rgba(255,255,255,0.1); /* Inner light */
                overflow: hidden; z-index: 5;
                font-family: 'Share Tech Mono', monospace;
                transform: perspective(800px) rotateY(10deg); /* Slight 3D turn */
                transition: transform 0.3s ease;
            }
            .monolith-clock:hover { transform: perspective(800px) rotateY(0deg) scale(1.05); }

            .mono-surface {
                position: absolute; inset: 0;
                background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212, 175, 55, 0.05) 3px);
                pointer-events: none; z-index: 1;
            }
            .mono-screen { z-index: 2; width: 100%; text-align: center; display: flex; flex-direction: column; gap: 5px; }
            .mono-label { color: #888; font-size: 0.6rem; letter-spacing: 2px; text-transform: uppercase; }
            .mono-xmas { font-size: 1.8rem; margin: 0; filter: drop-shadow(0 0 5px rgba(255,0,0,0.5)); }
            .mono-text { 
                color: #d4af37; font-size: 0.9rem; font-weight: bold; letter-spacing: 1px; 
                animation: pulse-gold 3s infinite;
            }
            
            .mono-laser {
                position: absolute; left: 0; right: 0; height: 2px;
                background: #ffd700;
                box-shadow: 0 0 10px #ffd700, 0 0 20px #ffd700;
                animation: scan-laser 4s linear infinite;
                z-index: 3;
            }

            /* --- CHRONO CAPSULE (Right) - LABORATORY GRADE --- */
            @keyframes float-capsule { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }
            @keyframes plasma-spin { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.1); } 100% { transform: rotate(360deg) scale(1); } }
            @keyframes ring-gyro { 0% { transform: rotateX(60deg) rotateY(0deg) rotateZ(0deg); } 100% { transform: rotateX(60deg) rotateY(360deg) rotateZ(360deg); } }

            .capsule-clock {
                position: absolute; top: 10px; width: 100px; height: 160px;
                background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), rgba(255,255,255,0.05) 60%, rgba(0,229,255,0.1) 100%);
                border: 1px solid rgba(255,255,255,0.2); 
                border-top: 1px solid rgba(255,255,255,0.5); /* Highlight top */
                border-bottom: 1px solid rgba(0,229,255,0.5); /* Glow bottom */
                border-radius: 50px / 25px; /* Cylinder caps */
                display: flex; flex-direction: column; align-items: center; justify-content: space-between;
                padding: 15px 0;
                backdrop-filter: blur(3px);
                box-shadow: 
                    0 0 10px rgba(0,229,255,0.2), 
                    inset 5px 0 10px rgba(255,255,255,0.1),
                    inset -5px 0 10px rgba(0,0,0,0.3);
                z-index: 5;
                animation: float-capsule 6s ease-in-out infinite;
                font-family: 'Rajdhani', sans-serif;
            }
            .capsule-glass-shine {
                position: absolute; top: 10%; left: 10%; width: 20%; height: 80%;
                background: linear-gradient(to right, rgba(255,255,255,0.4), transparent);
                border-radius: 20px; filter: blur(2px); pointer-events: none;
            }

            /* Energy Core Plasma */
            .plasma-core {
                width: 50px; height: 50px; border-radius: 50%;
                background: radial-gradient(circle, #fff, #00e5ff, #004d40);
                box-shadow: 0 0 20px #00e5ff;
                position: relative;
                animation: pulse-gold 2s infinite alternate; /* Reusing pulse */
            }
            .plasma-layer {
                position: absolute; inset: -5px; border-radius: 50%;
                border: 2px dashed rgba(255,255,255,0.6);
                animation: plasma-spin 10s linear infinite;
            }
            
            /* Gyro Rings */
            .gyro-ring {
                position: absolute; top: 40%; left: -10%; width: 120%; height: 40px;
                border: 2px solid rgba(0,229,255,0.5); border-radius: 50%;
                transform-style: preserve-3d;
                animation: ring-gyro 5s linear infinite;
                box-shadow: 0 0 5px #00e5ff;
            }

            .capsule-data { text-align: center; z-index: 2; margin-bottom: 10px; }
            .capsule-label { font-size: 0.6rem; color: #00e5ff; text-transform: uppercase; letter-spacing: 1px; }
            .capsule-time { font-size: 0.9rem; font-weight: 800; color: #fff; text-shadow: 0 0 5px #00e5ff; }
        `;
        document.head.appendChild(styleSheet);


        // --- CHRISTMAS: OBSIDIAN MONOLITH ---
        const leftClock = document.createElement('div');
        leftClock.id = 'clock-christmas';
        leftClock.className = 'monolith-clock';
        leftClock.style.left = '30px';
        leftClock.innerHTML = `
            <div class="mono-surface"></div>
            <div class="mono-laser"></div>
            <div class="mono-screen">
                <div class="mono-label" data-i18n="countdown_target">TARGET ACQUIRED</div>
                <div class="mono-xmas">🎄</div>
                <div class="mono-label" data-i18n="countdown_xmas" style="color: #d4af37;">CHRISTMAS</div>
                <div class="mono-text" id="content-christmas">--:--:--</div>
            </div>
        `;

        // --- NEW YEAR: PLASMA CAPSULE ---
        const rightClock = document.createElement('div');
        rightClock.id = 'clock-newyear';
        rightClock.className = 'capsule-clock';
        rightClock.style.right = '30px';
        rightClock.innerHTML = `
            <div class="capsule-glass-shine"></div>
            <div class="gyro-ring"></div>
            
            <div class="plasma-core">
                <div class="plasma-layer"></div>
            </div>
            
            <div class="capsule-data">
                <div class="capsule-label" data-i18n="countdown_ny_seq">INIT_SEQ: NY26</div>
                <div class="capsule-time" id="content-newyear">--:--:--</div>
            </div>
        `;

        // Append
        hero.appendChild(leftClock);
        hero.appendChild(rightClock);

        // Initial Update
        updateClocks();
        setInterval(updateClocks, 1000);

        // Re-apply translations once elements exist in DOM
        const currentLang = 'en';
        if (typeof changeLanguage === 'function') {
            changeLanguage(currentLang);
        }
    }

    // --- UPDATE LOGIC ---
    function updateClocks() {
        const now = new Date();
        const currentTime = now.getTime();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Show clocks from November 1st through January 2nd
        // November = month 10, December = month 11, January = month 0
        const isFestiveSeason = (currentMonth === 10) || (currentMonth === 11) ||
            (currentMonth === 0 && now.getDate() <= 2);

        const leftClock = document.getElementById('clock-christmas');
        const rightClock = document.getElementById('clock-newyear');

        if (!leftClock || !rightClock) return;

        if (!isFestiveSeason) {
            leftClock.style.display = 'none';
            rightClock.style.display = 'none';
            return;
        } else {
            leftClock.style.display = 'flex';
            rightClock.style.display = 'flex';
        }

        // --- TARGET CALCULATIONS ---
        const xmasTarget = new Date(`December 25, ${currentYear} 00:00:00`).getTime();
        const nyTarget = new Date(`January 1, ${currentYear + 1} 00:00:00`).getTime();

        const currentLang = 'en';
        const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];

        // --- UPDATE CHRISTMAS (Left) ---
        if (currentTime > xmasTarget && currentTime < xmasTarget + (1000 * 60 * 60 * 24)) {
            // Is Christmas Day - Show festive message
            document.getElementById('content-christmas').innerHTML = "🎅🎁<br>MERRY<br>XMAS!";
        } else if (currentTime > xmasTarget + (1000 * 60 * 60 * 24)) {
            // After Christmas Day - hide clock
            leftClock.style.display = 'none';
        } else {
            // Counting down to Christmas
            const xmasDiff = xmasTarget - currentTime;
            updateClockContent('content-christmas', xmasDiff, t, false);
        }

        // --- UPDATE NEW YEAR (Right) ---
        const nyDiff = nyTarget - currentTime;

        // FIREWORKS TRIGGER
        if (nyDiff <= 0 && nyDiff > -60000) {
            // 00:00 to 00:01 -> FIREWORKS!
            rightClock.style.display = 'none'; // Hide clock during fireworks? Or keep it showing 00:00?
            // Requirement: "foc de artificii ... dupa care dezactivezi ceasul"
            // Let's hide clock and boom.
            rightClock.style.display = 'none';
            if (!fireworksInterval) startFireworks();
        } else if (nyDiff <= -60000) {
            // After 1 minute
            rightClock.style.display = 'none';
        } else {
            // Counting down
            updateClockContent('content-newyear', nyDiff, t, true);
        }
    }

    function updateClockContent(elementId, diff, t, isNewYear) {
        const el = document.getElementById(elementId);
        if (!el) return;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Standard formatting
        el.innerHTML = `
            ${days}${t.days} ${hours}${t.hours}<br>
            ${minutes}${t.mins} ${seconds}${t.secs}
        `;

        // Dynamic Label for New Year
        if (isNewYear) {
            const label = document.querySelector('#clock-newyear .capsule-label');
            if (label && label.getAttribute('data-i18n') === "countdown_ny_seq") {
                // If it has data-i18n, the changeLanguage will handle it.
                // But we need to make sure the "NY26" part is updated if it's dynamic.
                // For now, let's keep it simple.
            }
        }
    }

    document.addEventListener('DOMContentLoaded', createClocks);
    window.addEventListener('languageChanged', updateClocks);

})();
