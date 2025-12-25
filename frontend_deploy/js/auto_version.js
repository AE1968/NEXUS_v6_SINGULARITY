// Auto-fetch version from VERSION.md and display
(async function () {
    try {
        const response = await fetch('/VERSION.md');
        const text = await response.text();

        // Extract version from first line: "# GENEZA NEXUS v7.0 - TRANSCENDENCE"
        const match = text.match(/v(\d+\.\d+\.\d+)\s*-\s*(\w+)/i);

        if (match) {
            const version = match[1]; // "7.0.0"
            const codename = match[2]; // "TRANSCENDENCE"

            // Update version display
            const versionEl = document.querySelector('.version-display');
            if (versionEl) {
                versionEl.textContent = `v${version} ${codename}`;
            }

            // Update title
            document.title = `NEXUS v${version} ${codename} | Dual-Brain AI`;

            console.log(`✅ Version loaded: v${version} ${codename}`);
        }
    } catch (error) {
        console.warn('⚠️ Could not fetch VERSION.md:', error);
        // Fallback to hardcoded version
        const versionEl = document.querySelector('.version-display');
        if (versionEl && !versionEl.textContent.includes('v')) {
            versionEl.textContent = 'v7.0 TRANSCENDENCE';
        }
    }
})();
