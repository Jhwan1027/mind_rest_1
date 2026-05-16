const CACHE = 'maeumsim-v6';
const ASSETS = [
  './', './index.html', './style.css', './bundle.js', './icon.svg',
  './firebase/firebase-app-compat.js',
  './firebase/firebase-auth-compat.js',
  './firebase/firebase-firestore-compat.js',
  './audio/rain.ogg',
  './audio/forest.ogg',
  './audio/ocean.ogg',
  './audio/campfire.ogg',
  './audio/bowl.ogg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  ));

self.addEventListener('fetch', e => {
  if (e.request.url.includes('googleapis.com')) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
