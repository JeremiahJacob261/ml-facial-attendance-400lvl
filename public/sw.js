const CACHE_NAME = 'sentinel-pwa-cache-v1';
const MODEL_CACHE_NAME = 'sentinel-models-cache-v1';

// All the heavy models to precache.
const MODEL_ASSETS = [
  '/models/face_landmark_68_model-shard1',
  '/models/face_landmark_68_model-weights_manifest.json',
  '/models/face_recognition_model-shard1',
  '/models/face_recognition_model-shard2',
  '/models/face_recognition_model-weights_manifest.json',
  '/models/ssd_mobilenetv1_model-shard1',
  '/models/ssd_mobilenetv1_model-shard2',
  '/models/ssd_mobilenetv1_model-weights_manifest.json',
  '/models/tiny_face_detector_model-shard1',
  '/models/tiny_face_detector_model-weights_manifest.json',
  '/data/students.csv',
  '/modules/face-api.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(MODEL_CACHE_NAME).then((cache) => {
      console.log('Opened cache and precaching models');
      return cache.addAll(MODEL_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== MODEL_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests, like Google Fonts or APIs
  if (url.origin !== self.location.origin) {
    return;
  }

  // Cache-First strategy for Models and Modules
  if (url.pathname.startsWith('/models/') || url.pathname.startsWith('/data/') || url.pathname.startsWith('/modules/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          return caches.open(MODEL_CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      }).catch(() => {
        // Fallback for models if entirely disconnected and not in cache
        console.error("Failed to load model asset offline.")
      })
    );
  } else {
    // Network-First strategy for all other resources (HTML, CSS, JS chunks)
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // If offline, return the requested page from cache
          return caches.match(event.request);
        })
    );
  }
});
