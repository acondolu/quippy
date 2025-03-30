const RUNTIME = 'runtime-v4';

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter(
          (cacheName) => cacheName != RUNTIME
        );
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

function cacheOkay(request) {
  var url = request.url;
  if (url.startsWith("https://acondolu.me/quippy") || url.startsWith("https://quippy.it/")) return true;
  return false;
}

async function myfetch(request) {
  if (!cacheOkay(request)) {
    return await fetch(request);
  }
  const cache = await caches.open(RUNTIME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) =>
  event.respondWith(myfetch(event.request))
);

async function refreshCache() {
  const cache = await caches.open(RUNTIME);
  for (let req of await cache.keys()) {
    let req2 = req.clone();
    const resp = await fetch(req2);
    await cache.put(req2, resp);
  }
}

self.addEventListener('message', function(event) {
  if (event.data.type == "reload") {
    console.log("worker.reload: refreshCache");
    event.waitUntil(refreshCache());
  }
});
