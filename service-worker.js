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
// fix157: bumped for the six Rider Skills drill images added below. Without
// this bump the old cache survives activation and the new files are never
// precached, so they would 404 offline despite being listed.
// fix157: rider skills art
// const CACHE_VERSION = 'cim-v3.8.00';
// const CACHE_VERSION = 'cim-v3.8.01';   // fix159: sprint.png re-keyed to alpha
// const CACHE_VERSION = 'cim-v3.8.02';   // fix161: assets/rider-front.png added
// const CACHE_VERSION = 'cim-v3.8.03';   // fix162: assets/race-hero-bg.jpg added
// const CACHE_VERSION = 'cim-v3.8.04';   // fix168: sprint.png/pedal.png re-keyed
// NOTE (fix169): the copy of this file in the project snapshot was still on
// 'cim-v3.8.03', but the fix168 handover records it shipping 'cim-v3.8.04'.
// The .04 rung is tombstoned above so the ladder stays honest either way.
// VERIFY the deployed service worker is on .04 before shipping .05 — if the
// fix168 bump was lost in transit, clients are still serving the pre-fix168
// sprint.png out of the .03 cache and this bump is what finally clears it.
// fix169: bumped because STATIC_ASSETS below loses two entries. The manifest
// is only read at install, so without a bump the old cache survives activation
// and both retired files stay resident.
// const CACHE_VERSION = 'cim-v3.8.05';   // fix169: portrait.png + race-hero.jpg retired
// const CACHE_VERSION = 'cim-v3.8.06';   // fix170: assets/home-bg.jpg added
// fix172: bumped again. home-bg.jpg keeps its FILENAME but its CONTENTS changed
// (corrected caption, re-cut to 768x1707). A same-name asset swap is the one
// case where forgetting this bump fails silently — the old image just keeps
// being served from the previous cache forever.
// const CACHE_VERSION = 'cim-v3.8.07';   // fix172: home-bg.jpg re-cut
// const CACHE_VERSION = 'cim-v3.8.08';   // fix177: splash colour -> #7fb8d4 (forces new manifest.json)
// fix179: same reason as fix172 — home-bg.jpg keeps its FILENAME but its
// CONTENTS changed (new artwork, identical geometry). Without a bump every
// installed PWA keeps repainting the old art out of the v3.8.08 cache.
const CACHE_VERSION = 'cim-v3.8.11';   // fix179: home-bg.jpg artwork swapped


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
  // fix170: home hub art. Loads on every cold start (home is the landing tab),
  // so it is precached rather than left to the runtime handler.
  './assets/home-bg.jpg',
  './assets/workshop-hero.jpg',
  // fix169: assets/race-hero.jpg retired — 'raceHero' is out of
  // RC_SHEET_NAMES / RC_VAR_NAMES / _rcSheetSources, so nothing fetches it
  // any more. Tombstoned, not deleted, per house style. NOT to be confused
  // with './assets/race-hero-bg.jpg' further down, which is the opaque
  // backdrop scene read by .race-hero-bg and MUST stay.
  // './assets/race-hero.jpg',
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
  // fix169: assets/portrait.png retired — 'portrait' is out of the recolour
  // lists and no CSS rule reads --sheet-portrait since fix163.
  // './assets/portrait.png',
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
  // fix157: Rider Skills drill art — three hero banners shown at the top of the
  // fz/sl/wt overlay boards, and three win photos shown inside the shared
  // #rs-success-pop medallion. Both sets are lazy at runtime (the heroes via
  // lazyLoadAssetGroup('riderskills'), the win photos via a data-src promote in
  // rsShowSuccessPop), so they are never fetched on page load — but they must
  // still be precached here or a drill opened offline shows an empty banner.
  './assets/feedzone-scramble.jpg',
  './assets/feedzone-scramble-win.jpg',
  './assets/slipstream.jpg',
  './assets/slipstream-win.jpg',
  './assets/wind-tunnel.jpg',
  './assets/wind-tunnel-win.jpg',
  './assets/rider-photo.png',
  // fix161: front-on rider still, added to the recolour sheet set this fix.
  // Always-on, so it is fetched on the first recolour pass and must be here or
  // an offline load falls back to a missing url() and the hero shows nothing.
  './assets/rider-front.png',
  // fix162: Race tab hero backdrop. Opaque scene, never recoloured, bound by a
  // plain CSS url() rather than a --sheet-* var, so nothing else fetches it —
  // if it is missing from this manifest the hero is a bare --bg3 box offline.
  // SUPERSEDED (fix169): this note used to say './assets/race-hero.jpg' above
  // stayed precached deliberately because 'raceHero' was still in
  // RC_SHEET_NAMES. fix169 retired it, so that entry is now tombstoned too.
  './assets/race-hero-bg.jpg',
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
