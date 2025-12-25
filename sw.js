const CACHE_NAME = 'geneza-kelion-v1.1';
const ASSETS = [
    '/',
    '/index.html',
    '/kelion_core.html',
    '/kelion_story.html',
    '/download.html',
    '/404.html',
    '/css/style.css',
    '/js/kelion_brain.js',
    '/js/kelion_guardian.js',
    '/js/kelion_tutor_system.js',
    '/js/kelion_game_system.js',
    '/js/kelion_content_creator.js',
    '/js/kelion_user_system.js',
    '/js/kelion_bridge.js',
    '/js/kelion_gdpr.js',
    '/js/pwa_installer.js',
    '/assets/kelion_icon_192.png',
    '/assets/kelion_icon_512.png',
    '/manifest.json',
    '/version.json'
];

// Install Event
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force activate new SW immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    return self.clients.claim();
});

// Fetch Event - Network First, fallback to Cache (Better for fresh content)
self.addEventListener('fetch', (event) => {
    // Strategy: Network First for JSON/API, Cache First for static assets
    if (event.request.url.includes('version.json')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
    } else {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                return cachedResponse || fetch(event.request);
            })
        );
    }
});
