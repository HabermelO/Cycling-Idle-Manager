// ═══════════════════════════════════════════════════════════
// Cycling Idle Manager — Service Worker
// Strategy: network-first for the HTML (so players always
// get the latest game version when online), cache-first for
// all static assets (icons, manifest). Falls back to cached
// HTML when offline so the game still runs without a connection.
// ═══════════════════════════════════════════════════════════

// Bump this version string whenever you push a new game build.
// The old cache is deleted automatically on the next SW activation.
// fix150 (release pass): bumped for the v26 release build. Also carries the
// two asset corrections found by the offline-reload test — see below.
const CACHE_VERSION = 'cim-v3.7.00';   // fix150: release build

// fix135 — the 16 game images now live in ./assets/ rather than as base64
// inside the HTML. cache.addAll() is all-or-nothing: if ANY path below 404s
// the install promise rejects and the SW never activates. Every entry here
// must exist in the deploy.
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon.png',
  './assets/workshop-hero.jpg',
  './assets/race-hero.jpg',
  // fix144: sprint-pose.png retired — the static final-10s pose is replaced
  // by the animated assets/sprint.png sheet and is no longer referenced by
  // any CSS var or rule, so it is dropped from the precache manifest.
  // './assets/sprint-pose.png',
  './assets/sprint.png',   // fix144: 1568x308, 6-frame sprint sheet
  // fix150: tt.png was added to the CSS and the recolour sheet list by fix145
  // but never reached this manifest, so it was the one rider sheet that was
  // not precached. Offline, a TT stage fell back to the CSS url() default,
  // which also missed, and the rider vanished for the whole stage. Caught by
  // the release-pass offline reload.
  './assets/tt.png',       // fix145: 1568x308, 6-frame TT sheet
  './assets/pedal.png',
  './assets/ws-bearings.jpg',
  './assets/portrait.png',
  './assets/ws-bleed.jpg',
  './assets/gt-drinks.jpg',
  './assets/gt-carbs.jpg',
  './assets/ws-drivetrain.jpg',
  './assets/peloton-bg.png',
  './assets/exhausted.png',
  './assets/idle.png',
  // fix143: bike-tier idle stills (tier 1 uses idle.png above;
  // tiers 2-3 -> idle-mid, tiers 4-5 -> idle-top).
  './assets/idle-mid.png',
  './assets/idle-top.png',
  './assets/victory.png',
  './assets/gut-success.jpg',
  './assets/rider-photo.png',
];

// ── Install: pre-cache everything ───────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())   // activate immediately
  );
});

// ── Activate: remove old cache versions ─────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())  // take control of open tabs
  );
});

// ── Fetch: network-first for HTML, cache-first for assets ───
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  const isHTML = event.request.destination === 'document'
    || url.pathname.endsWith('.html')
    || url.pathname === '/'
    || url.pathname.endsWith('/');

  if (isHTML) {
    // Network-first: players get the newest game version when online.
    // Falls back to the cached copy when offline.
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Update cache with fresh copy
          const clone = networkResponse.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'))
    );
  } else {
    // Cache-first for icons, manifest, etc.
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(networkResponse => {
          const clone = networkResponse.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          return networkResponse;
        });
      })
    );
  }
});
