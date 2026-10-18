// KK Okuyucu çevrimdışı önbelleği. Yeni sürüm yayınlarken VERSION'ı artırın.
const VERSION = "kk-v4";
const FILES = ["./", "./index.html", "./zxing-reader.js", "./zxing_reader.wasm", "./manifest.json", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === "navigate";
  // Önbellekten hemen aç; internet varsa arka planda güncelle (sonraki açılışta yeni sürüm gelir)
  e.respondWith(caches.open(VERSION).then(async c => {
    const key = isPage ? "./index.html" : req;
    const hit = await c.match(key, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r && r.ok) c.put(key, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response("Çevrimdışı ve önbellekte yok", { status: 503 });
  }));
});
