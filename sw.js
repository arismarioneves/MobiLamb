// MobiLamb service worker — offline cache (relative paths, subpath-safe)
const CACHE_NAME = 'mobilamb-v2.0.0';
const ASSETS = [
    './',
    'index.html',
    'styles.css',
    'script.js',
    'assets/theme.css',
    'assets/sketch.js',
    'assets/vendor/rough.js',
    'assets/icons/icons-data.js',
    'assets/fonts/fonts.css',
    'assets/fonts/gochi-hand-latin-400-normal.woff2',
    'assets/fonts/patrick-hand-latin-400-normal.woff2',
    'icons/favicon.svg',
    'icons/favicon-96x96.png',
    'icons/favicon.ico',
    'icons/apple-touch-icon.png',
    'icons/web-app-manifest-192x192.png',
    'icons/web-app-manifest-512x512.png',
    'icons/site.webmanifest'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                }
                return response;
            }).catch(() => {
                if (event.request.mode === 'navigate') return caches.match('index.html');
            });
        })
    );
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
