/**
 * NEXUS AUTO-ZOOM SYSTEM v1.0
 * Creat pentru a mentine incadrarea permanenta a interfetei indferent de rezolutie.
 */

(function () {
    // Configurare rezolutie tinta (Base Dashboard Design)
    const TARGET_WIDTH = 1920;
    const TARGET_HEIGHT = 1080;

    function updateViewportScale() {
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        // Calculam rapoartele de scalare pentru ambele dimensiuni
        const scaleX = winW / TARGET_WIDTH;
        const scaleY = winH / TARGET_HEIGHT;

        // Alegem cea mai mica scara pentru a ne asigura ca toata interfata incape (contain)
        // Daca am dori fill (stretch), am folosi scaleX si scaleY separat pe axe (nu e recomandat)
        const scale = Math.min(scaleX, scaleY);

        // Identificam elementul principal de scalare
        // Recomandat este un wrapper, dar putem aplica si pe body daca design-ul permite
        const body = document.body;

        if (!body) return;

        // Aplicam zoom-ul (metoda moderna si curata pentru HUD-uri)
        // Zoom-ul este suportat de majoritatea browserelor moderne (exceptand partial Firefox vetic, unde folosim transform)
        if (typeof body.style.zoom !== 'undefined') {
            body.style.zoom = scale;
        } else {
            // Fallback pentru browsere care nu suporta zoom (ex. Firefox)
            body.style.transform = `scale(${scale})`;
            body.style.transformOrigin = 'top center';
            body.style.width = `${TARGET_WIDTH}px`;
            body.style.height = `${TARGET_HEIGHT}px`;
            body.style.position = 'absolute';
            body.style.left = '50%';
            body.style.marginLeft = `-${(TARGET_WIDTH * scale) / 2}px`;
        }

        console.log(`[Nexus Viewport] Scalat la: ${Math.round(scale * 100)}% (${winW}x${winH})`);
    }

    // Initializare si event listeners
    window.addEventListener('resize', updateViewportScale);
    window.addEventListener('load', updateViewportScale);

    // Rulare imediata daca DOM-ul este deja gata
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        updateViewportScale();
    }

    // Export catre window pentru control manual daca e nevoie
    window.NexusViewport = {
        update: updateViewportScale,
        getTarget: () => ({ width: TARGET_WIDTH, height: TARGET_HEIGHT })
    };

    console.log("🚀 Nexus Auto-Zoom System Initialized");
})();
