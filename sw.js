const CACHE_NAME = 'geneza-kelion-dynamic-stream';
// NETWORK FIRST STRATEGY
// Aceasta configuratie va incerca INTOTDEAUNA sa ia versiunea de pe net.
// Daca netul pica, abia atunci foloseste cache-ul.
// Astfel, orice deploy nou va fi vazut imediat.

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Activeaza imediat
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    // Sterge TOATE cache-urile vechi pentru a fi sigur
                    return caches.delete(key);
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Ignora request-urile care nu sunt GET (POST, etc.)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Daca raspunsul e valid, il clonam in cache si il returnam
                // Astfel avem mereu ultima versiune in cache pentru offline
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Daca retianua pica, folosim cache-ul
                return caches.match(event.request);
            })
    );
});
