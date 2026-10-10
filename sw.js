// 山の中で電波が無くても開けるように、全部キャッシュする（更新時は VERSION を上げる）
const VERSION = 'rallycom-web-0.6.4';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './seraphix-logo.png',
  './voice/phrases.json', './voice/s30.mp3', './voice/s15.mp3', './voice/s10.mp3', './voice/zone.mp3', './voice/target.mp3', './voice/ssfin.mp3', './voice/gps.mp3'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
// ネット優先・だめならキャッシュ。電波が弱くて返事が来ない時は3秒でキャッシュに切り替える
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const cached = await caches.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => {
      // エラーのページ（404・圏外の案内ページ等）で正しいキャッシュを上書きしない
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return r;
    });
    if (!cached) return net;
    const timeout = new Promise(res => setTimeout(() => res(cached), 3000));
    return Promise.race([net.catch(() => cached), timeout]);
  })());
});
