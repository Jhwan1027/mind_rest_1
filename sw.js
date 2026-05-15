const CACHE = 'maeumsim-v4';
const ASSETS = [
  './', './index.html', './style.css', './app.js', './config.js', './icon.svg',
  './modules/state.js', './modules/firebase.js', './modules/auth.js', './modules/db.js',
  './modules/ui.js', './modules/audio.js', './modules/breathing.js', './modules/timer.js',
  './modules/stats.js', './modules/home.js', './modules/settings.js', './modules/bubbles.js',
  './firebase/firebase-app.js', './firebase/firebase-auth.js', './firebase/firebase-firestore.js',
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
