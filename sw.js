/**
 * Service Worker pour mode offline
 * Cache les assets statiques pour fonctionnement offline
 */

const CACHE_NAME = 'ev-queue-v3'; // Bump version pour forcer mise à jour
const BASE_PATH = '/ev-charging-queue';

const ASSETS_TO_CACHE = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/manifest.json`,
    `${BASE_PATH}/css/styles.css`,
    `${BASE_PATH}/js/main.js`,
    `${BASE_PATH}/js/app.js`,
    `${BASE_PATH}/js/config.js`,
    `${BASE_PATH}/js/logger.js`,
    `${BASE_PATH}/js/validation.js`,
    `${BASE_PATH}/js/toast.js`,
    `${BASE_PATH}/js/modal.js`,
    `${BASE_PATH}/js/discord.js`,
    `${BASE_PATH}/js/firestore.js`,
    `${BASE_PATH}/js/queue.js`,
    `${BASE_PATH}/js/render.js`,
    `${BASE_PATH}/js/reports.js`,
    `${BASE_PATH}/js/pwa-install.js`,
    `${BASE_PATH}/images/eclair.png`,
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Ne pas intercepter les requêtes Firebase/Discord
    if (url.hostname.includes('firebase') || 
        url.hostname.includes('firestore') ||
        url.hostname.includes('discord.com') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('gstatic.com') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) return cachedResponse;
                
                return fetch(event.request).then(response => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                }).catch(() => {
                    if (event.request.mode === 'navigate') {
                        return caches.match(`${BASE_PATH}/index.html`);
                    }
                });
            })
    );
});
