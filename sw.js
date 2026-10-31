// Network-first with a short timeout: fresh page when the connection is good, saved copy when slow/offline.
const CACHE = 'reach100-v2';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(()=> self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET' || new URL(req.url).origin !== location.origin) return; // Firebase etc. go straight to network
  const fromNet = fetch(req).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
    return res;
  });
  const timeout = new Promise((_, rej) => setTimeout(rej, 3000));
  e.respondWith(
    Promise.race([fromNet, timeout]).catch(() => caches.match(req).then(r => r || fromNet))
  );
});
