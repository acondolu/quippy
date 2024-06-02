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
  console.log("fetch", event.request.url);
  if (isCacheable(event.request)) {
    event.respondWith(cacheFirstWithRefresh(event.request));
  }
});

self.addEventListener("install", (e) => {
  console.log("[Service Worker] Install");
});

self.addEventListener("message", (e) => {
  if (!e.data.type != "reload") return;
  console.log("service worker: reload");
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          return caches.delete(key);
        }),
      );
    }),
  );
});
