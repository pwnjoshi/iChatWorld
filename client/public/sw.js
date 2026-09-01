const CACHE_NAME = 'ichatworld-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through for real-time WebSocket and dynamic requests
  if (event.request.url.includes('/socket.io') || event.request.url.includes('/api/')) {
    return;
  }
});
