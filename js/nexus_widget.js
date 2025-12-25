/**
 * NEXUS SUPREME - UNIVERSAL FLOATING WIDGET
 * This allows Nexus to be present on every page of the Hub.
 */
(function () {
    const orb = document.createElement('div');
    orb.id = 'nexus-floating-orb';
    orb.innerHTML = '🤖';
    orb.style.cssText = `
        position: fixed;
        bottom: 50px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid #00f3ff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 0 20px rgba(0, 243, 255, 0.5);
        transition: transform 0.3s;
    `;

    orb.onmouseover = () => orb.style.transform = 'scale(1.2) rotate(10deg)';
    orb.onmouseout = () => orb.style.transform = 'scale(1)';
    orb.onclick = () => window.location.href = 'nexus_core.html';

    // Add tooltip
    const tooltip = document.createElement('div');
    tooltip.textContent = 'CALL NEXUS';
    tooltip.style.cssText = `
        position: absolute;
        top: -30px;
        background: #00f3ff;
        color: #000;
        padding: 2px 8px;
        border-radius: 5px;
        font-family: 'Orbitron', sans-serif;
        font-size: 0.6rem;
        display: none;
    `;
    orb.appendChild(tooltip);
    orb.onmouseenter = () => tooltip.style.display = 'block';
    orb.onmouseleave = () => tooltip.style.display = 'none';

    document.body.appendChild(orb);
})();
