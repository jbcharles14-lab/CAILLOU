// CAIRN service worker — coquille hors-ligne + cache des tuiles visitées.
const SHELL = 'cairn-shell-v1';
const TILES = 'cairn-tiles-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== SHELL && k !== TILES).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Tuiles carto : cache-first, stockées à part (utile en falaise sans réseau).
  if (url.includes('basemaps.cartocdn.com') || url.includes('tile.opentopomap.org')) {
    e.respondWith(caches.open(TILES).then(async cache => {
      const hit = await cache.match(e.request);
      if (hit) return hit;
      try { const res = await fetch(e.request); cache.put(e.request, res.clone()); return res; }
      catch { return hit || Response.error(); }
    }));
    return;
  }
  // Reste : cache-first avec repli réseau.
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
