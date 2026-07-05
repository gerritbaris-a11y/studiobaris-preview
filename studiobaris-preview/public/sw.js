// Minimale service worker — nodig zodat Chrome/Android de "Installeren"-melding toont.
// De fetch-handler laat verzoeken gewoon door (geen caching), dus geen stale content.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* passthrough; vereist voor installatie */ });
