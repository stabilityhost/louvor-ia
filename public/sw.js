const CACHE_NAME = "louvor-ia-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/icon.svg",
  "/favicon.ico"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell and core assets...");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-While-Revalidate Strategy
self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  // Skip dev hot-reloads and chrome extensions
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/_next/webpack-hmr") || url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Check if response is valid
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.log("[Service Worker] Fetch failed (probably offline), using cache. Error:", err);
          // Return cached response if exists, otherwise fallback
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
