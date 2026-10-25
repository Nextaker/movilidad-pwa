// sw.js - Service Worker optimizado para Overdrive PWA
self.addEventListener('install', (e) => {
    console.log('Service Worker instalado');
});

self.addEventListener('fetch', (e) => {
    // Ignorar por completo las peticiones a Mapbox para evitar que fallen los tiles del mapa
    if (e.request.url.includes('mapbox.com')) {
        return;
    }

    // Permite que la app cargue con normalidad
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});