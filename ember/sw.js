// naveed.io/ember — keeps the fire lit with no signal.
// Network first (so a fresh deploy wins when there's a connection), cache as the
// fallback, and a short timeout so one bar at a campsite doesn't hang the page.
const CACHE = 'ember-v1';
const SHELL = ['./', 'manifest.webmanifest', 'icon-180.png?v=1', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('ember-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !url.pathname.startsWith('/ember/')) return;
  e.respondWith(networkFirst(req, url));
});

async function networkFirst(req, url) {
  const cache = await caches.open(CACHE);
  const key = req.mode === 'navigate' ? './' : req;
  // a navigation Request can't be re-issued with new init options, so fetch its URL instead
  const net = fetch(req.mode === 'navigate' ? url.pathname : req, { cache: 'no-cache', credentials: 'same-origin' })
    .then(res => { if (res && res.ok) cache.put(key, res.clone()); return res; });
  try {
    return await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 3500))]);
  } catch (_) {
    const hit = await cache.match(key, { ignoreSearch: req.mode === 'navigate' });
    if (hit) return hit;
    return net;
  }
}
