const CACHE_NAME = 'mobilamb-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/icons/favicon-96x96.png',
    '/icons/favicon.svg',
    '/icons/favicon.ico',
    '/icons/apple-touch-icon.png',
    '/icons/web-app-manifest-192x192.png',
    '/icons/web-app-manifest-512x512.png',
    '/icons/site.webmanifest'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
    console.log('🐑 MobiLamb Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('🐑 MobiLamb Service Worker: Cache aberto');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('🐑 MobiLamb Service Worker: Todos os recursos em cache');
                return self.skipWaiting();
            })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
    console.log('🐑 MobiLamb Service Worker: Ativando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🐑 MobiLamb Service Worker: Removendo cache antigo', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('🐑 MobiLamb Service Worker: Ativo e pronto!');
            return self.clients.claim();
        })
    );
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Retorna do cache se encontrado
                if (response) {
                    return response;
                }

                // Faz uma cópia da requisição
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Verifica se a resposta é válida
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Faz uma cópia da resposta
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch(() => {
                    // Se offline e não encontrado no cache, retorna página offline
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// Mensagens do cliente
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Notificação de atualização disponível
self.addEventListener('controllerchange', () => {
    console.log('🐑 MobiLamb Service Worker: Nova versão disponível!');
});