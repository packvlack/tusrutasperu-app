/* ============================================================
   TUSRUTASPERU — SERVICE WORKER (v1.3)
   La app funciona sin conexión: el armazón se pre-cachea,
   las fotos/videos se cachean al usarse.
   ============================================================ */
const CACHE = "trp-v2.12";

const SHELL = [
  "./",
  "./index.html",
  "./lugares.html",
  "./lugar.html",
  "./circuito.html",
  "./competencia.html",
  "./prueba.html",
  "./ranking.html",
  "./manifest.webmanifest",
  "./assets/css/style.css",
  "./assets/fonts/fonts.css",
  "./assets/fonts/ArchivoBlack-400-normal-latin.woff2",
  "./assets/fonts/ArchivoBlack-400-normal-latin-ext.woff2",
  "./assets/fonts/SpaceGrotesk-400-normal-latin.woff2",
  "./assets/fonts/SpaceGrotesk-400-normal-latin-ext.woff2",
  "./assets/fonts/SpaceGrotesk-500-normal-latin.woff2",
  "./assets/fonts/SpaceGrotesk-500-normal-latin-ext.woff2",
  "./assets/fonts/SpaceGrotesk-700-normal-latin.woff2",
  "./assets/fonts/SpaceGrotesk-700-normal-latin-ext.woff2",
  "./assets/fonts/SpaceMono-400-normal-latin.woff2",
  "./assets/fonts/SpaceMono-400-normal-latin-ext.woff2",
  "./assets/fonts/SpaceMono-700-normal-latin.woff2",
  "./assets/fonts/SpaceMono-700-normal-latin-ext.woff2",
  "./assets/js/data.js",
  "./assets/js/app.js",
  "./assets/js/contrarreloj.js",
  "./assets/js/share.js",
  "./assets/js/track.js",
  "./assets/js/config.js",
  "./assets/js/global.js",
  "./assets/img/icon-192.png",
  "./assets/img/icon-512.png",
  "./assets/img/icon-512-maskable.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(SHELL.map((url) => cache.add(url).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  let url;
  try { url = new URL(request.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return; // no tocar CDNs ni terceros

  // Navegación: red primero, caché como respaldo (para recibir updates)
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Assets: caché primero, red como respaldo (fotos y videos se cachean al usarse)
  e.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((res) => {
        if (res && (res.status === 200 || res.status === 0)) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
