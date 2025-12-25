/**
 * Nexus PWA Installer
 * Gestionează instalarea aplicației pe Desktop și Mobile
 */

let deferredPrompt;

window.addEventListener('load', () => {
    // Înregistrare Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('[PWA] Service Worker Registered', reg))
            .catch(err => console.error('[PWA] SW Registration Failed', err));
    }
});

// Capturare eveniment install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
});

function showInstallButton() {
    const btn = document.getElementById('btnInstallApp');
    if (btn) {
        btn.style.display = 'inline-block';
        btn.onclick = installApp;
    }
}

async function installApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    console.log('[PWA] User response:', result.outcome);
    deferredPrompt = null;

    // Ascunde butonul după instalare
    const btn = document.getElementById('btnInstallApp');
    if (btn) btn.style.display = 'none';
}

// Check if app is already installed
window.addEventListener('appinstalled', () => {
    console.log('[PWA] Nexus App Installed');
});
