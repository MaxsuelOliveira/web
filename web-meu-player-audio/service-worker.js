const CACHE_NAME = "meu-player-audio-v4";
const APP_ASSETS = [
  "/",
  "/index.html",
  "/assets/css/app.css",
  "/assets/js/main.js",
  "/manifest.webmanifest",
  "/service-worker.js",
  "/assets/data/songs.json",
  "/assets/js/app.js",
  "/assets/js/audio-player.js",
  "/assets/js/catalog.js",
  "/assets/js/local-library-db.js",
  "/assets/js/ui.js",
  "/assets/js/utils.js",
  "/assets/js/youtube-player.js",
  "/assets/imgs/icon-192.svg",
  "/assets/imgs/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }

          return networkResponse;
        })
        .catch(() => caches.match("/index.html"));
    }),
  );
});
