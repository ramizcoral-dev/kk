// KK Okuyucu çevrimdışı önbelleği. Yeni sürüm yayınlarken VERSION'ı artırın.
const VERSION = "kk-v13";
const FILES = ["./", "./index.html", "./zxing-reader.js", "./zxing_reader.wasm", "./manifest.json", "./icon-180.png", "./icon-512.png", "./xlsx.mini.min.js", "./urunler.json"];

self.addEventListener("install", e => {
  // tarayıcının eski kopyasını değil, sunucudaki güncel dosyaları kaydet
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(FILES.map(u => fetch(new Request(u, { cache: "reload" })).then(r => { if (r.ok) return c.put(u === "./" ? "./index.html" : u, r); })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === "navigate";
  // Önbellekten hemen aç; internet varsa arka planda sunucudan güncelini al (sonraki açılışta yeni sürüm gelir)
  e.respondWith(caches.open(VERSION).then(async c => {
    const key = isPage ? "./index.html" : new URL(req.url).pathname.split("/").pop() ? req : "./index.html";
    const hit = await c.match(key, { ignoreSearch: true });
    const net = fetch(req.url.split("?")[0], { cache: "no-cache" }).then(r => { if (r && r.ok) c.put(key, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response("Çevrimdışı ve önbellekte yok", { status: 503 });
  }));
});
