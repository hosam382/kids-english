// Kids English service worker: app shell on install, all sounds right after, cache-first.
const VER = "70a8191c";
const CACHE = "kids-english-" + VER;
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "font-kids.woff2", "img-animals.webp", "img-colors.webp", "img-fruits.webp", "img-body.webp", "img-family.webp", "img-abc.webp", "img-world.webp"];
const AUDIO = ["snd-misc.mp3", "snd-animals.mp3", "snd-colors.mp3", "snd-numbers.mp3", "snd-shapes.mp3", "snd-fruits.mp3", "snd-body.mp3", "snd-family.mp3", "snd-abc.mp3"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("kids-english-") && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
    // Fetch every sound in the background so the app works fully offline after the first visit.
    const c = await caches.open(CACHE);
    for (const a of AUDIO) {
      try { if (!(await c.match(a))) await c.add(a); } catch (_) {}
    }
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && res.status === 200) c.put(req, res.clone());
      return res;
    } catch (err) {
      if (req.mode === "navigate") return (await c.match("index.html")) || Response.error();
      throw err;
    }
  })());
});
