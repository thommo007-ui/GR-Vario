// Glide Vario — offline service worker
// Strategy: on first successful load, cache this page. From then on,
// try the network first (to pick up updates), but if that fails
// (no signal in flight) fall back to the cached copy instantly.
var CACHE = "glide-vario-cache-v30";
var ASSETS = [
  "./",
  "./index.html"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request, { cache: "no-cache" })   // revalidate: never serve stale HTTP cache when online
      .then(function (networkResponse) {
        var copy = networkResponse.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return networkResponse;
      })
      .catch(function () {
        return caches.match(e.request).then(function (cached) {
          return cached || caches.match("./index.html");
        });
      })
  );
});
