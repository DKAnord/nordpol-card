/* Nordpol Web Service Worker — caches lightweight UI shell & font ONLY.
   MP4 clips (/media/ or *.mp4) and cross-origin requests are strictly bypassed. */
const CACHE_NAME = "nordpol-shell-v7";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./storage.js",
  "./i18n.js",
  "./tz-cities.js",
  "./audio.js",
  "./qr.js",
  "./pulse.js",
  "./extras.js",
  "./nordpol-card.js",
  "./manifest.webmanifest",
  "./fonts/mountains-of-christmas-700.woff2",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(SHELL_ASSETS.map(url => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Bypass cross-origin APIs (Open-Meteo geocoding, GitHub Pages media from another origin)
  if (url.origin !== self.location.origin) return;

  // Never cache video clips or /media/ so HTTP 206 range requests work natively
  if (url.pathname.endsWith(".mp4") || url.pathname.includes("/media/")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put("./index.html", copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
