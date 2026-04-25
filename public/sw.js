const CACHE_NAME = "bun-line-t3-calendar-v1";
const urlsToCache = [
  "/calendar/mobile",
  "/api/holidays",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

// Routes that should never be cached (auth, API calls with side effects)
const EXCLUDED_ROUTES = [
  "/api/auth/",
  "/api/logout",
  "/login",
  "/sign-in",
  "/callback",
  "/logout",
];

const EXCLUDED_ASSET_PREFIXES = [
  "/@fs/",
  "/@id/",
  "/@react-refresh",
  "/@vite/",
  "/node_modules/",
  "/src/",
  "/~partytown/",
];

const EXCLUDED_ASSET_EXTENSIONS = [
  ".css",
  ".js",
  ".json",
  ".map",
  ".mjs",
  ".tsx",
  ".ts",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Check if route should be excluded from caching
  const isExcluded = EXCLUDED_ROUTES.some((route) =>
    url.pathname.startsWith(route),
  );
  const isExcludedAsset =
    EXCLUDED_ASSET_PREFIXES.some((route) => url.pathname.startsWith(route)) ||
    EXCLUDED_ASSET_EXTENSIONS.some((extension) =>
      url.pathname.endsWith(extension),
    );

  // SSR documents contain auth-derived state, so always fetch them fresh.
  const isNavigation =
    request.mode === "navigate" || request.destination === "document";

  // Don't cache non-GET requests, auth routes, HTML navigations, or JS/CSS
  // assets. Stale client bundles can hydrate against fresh SSR HTML.
  if (request.method !== "GET" || isExcluded || isNavigation || isExcludedAsset) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone the request
      const fetchRequest = request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    }),
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
