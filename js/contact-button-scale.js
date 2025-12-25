// Auto-scale Contact Button to fit within footer
function scaleContactButton() {
    const contactBtn = document.querySelector('a[href="contact.html"]');
    if (!contactBtn) return;

    // DETECT BODY ZOOM (for responsive scaling)
    const bodyStyle = window.getComputedStyle(document.body);
    const bodyZoom = parseFloat(bodyStyle.zoom) || 1;

    // CALCULATE FOOTER HEIGHT AND AVAILABLE SPACE
    const footer = document.querySelector('footer');
    let footerHeight = footer ? footer.offsetHeight : 80;

    // Adjust for body zoom
    footerHeight = footerHeight * bodyZoom;

    const margin = 7; // 2mm margin
    const availableHeight = footerHeight - (margin * 2);

    // CALCULATE SCALE FACTOR
    const baseButtonHeight = 48; // Base button height (padding + text + icon)
    const scaleFactor = Math.min(1, availableHeight / baseButtonHeight);

    // Apply scaling
    const fontSize = Math.max(0.7, 1 * scaleFactor);
    const iconSize = Math.max(1, 1.5 * scaleFactor);
    const padding = `${Math.max(6, Math.floor(12 * scaleFactor))}px ${Math.max(12, Math.floor(24 * scaleFactor))}px`;

    // Update button styles
    contactBtn.style.fontSize = `${fontSize}rem`;
    contactBtn.style.padding = padding;
    contactBtn.querySelector('span:first-child').style.fontSize = `${iconSize}rem`;

    console.log('Contact button auto-scaled:', {
        footerHeight,
        availableHeight,
        scaleFactor: scaleFactor.toFixed(2),
        bodyZoom
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(scaleContactButton, 500);
});

// Rescale on window resize
window.addEventListener('resize', () => {
    setTimeout(scaleContactButton, 100);
});
