const cacheName = "MyCache_1";
// const precachedResources = ["/", "/app.js", "/style.css"];

// async function precache() {
//   const cache = await caches.open(cacheName);
//   return cache.addAll(precachedResources);
// }

// self.addEventListener("install", (event) => {
//   event.waitUntil(precache());
// });

function isCacheable(request) {
  const url = new URL(request.url);
  return !url.pathname.endsWith(".json");
}

async function cacheFirstWithRefresh(request) {
  const fetchResponsePromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  return (await caches.match(request)) || (await fetchResponsePromise);
}

self.addEventListener("fetch", (event) => {
  if (isCacheable(event.request)) {
    event.respondWith(cacheFirstWithRefresh(event.request));
  }
});