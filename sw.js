const CACHE_NAME = 'kontaktbuch-shell-v1';
const SHELL_FILES = [
  './kontaktbuch-app.html',
  './manifest.json',
  './icon.svg',
  './supabase.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Nur eigene Dateien (App-Hülle) über den Cache ausliefern.
// Anfragen an Supabase (Kontaktdaten) laufen unverändert direkt übers Netz,
// damit die bestehende Offline-Logik der App (lokaler Datencache) greift.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request)
        .then(res => {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
