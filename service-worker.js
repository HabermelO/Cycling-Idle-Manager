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
// const CACHE_VERSION = 'cim-v3.8.09';   // fix179: home-bg.jpg artwork swapped
// fix184: same reason as fix172/fix179, this time for the Rider art —
// rider-bg.jpg keeps its FILENAME but its CONTENTS changed (the fix183
// mirror-padded recut is replaced by a straight 640x1422 q50 downscale of the
// source, because the art turned out to be a painted UI screen rather than a
// backdrop). Without a bump every installed PWA keeps painting the padded
// version out of the v3.8.10 cache, and its duplicated top/bottom bands sit
// exactly where the medallion geometry is being calibrated. The STATIC_ASSETS
// entry below is unchanged and was NOT duplicated — fix183 already listed it.
// const CACHE_VERSION = 'cim-v3.8.10';   // fix183: assets/rider-bg.jpg added
// const CACHE_VERSION = 'cim-v3.8.11';   // fix184: rider-bg.jpg re-encoded (hub geometry)
// fix185b: rider-bg.jpg keeps its FILENAME again but its CONTENTS changed — the
// mirrored pad bands (139px top / 151px bottom, reflection axes at rows 139 and
// 1276 of the 644x1428 recut) are repainted flat in the room's wall colour
// rgb(210,199,195). Same 640x1422 raster, same 0.4501 aspect, so no geometry
// moved; but a stale cache would keep serving the mirrored bands indefinitely,
// which is exactly the failure this version line exists to prevent.
// RENUMBERED: this stage originally shipped as 'fix186'. It was an unplanned
// art repair discovered between stages, not the rider-hub plan's fix186 (the
// section sheet), and it took that number by accident. Relabelled fix185b so
// the file series stays aligned with the plan's stage list; the CACHE_VERSION
// string itself is left at 3.8.12 because that value is already live in
// installed PWAs and rewriting a shipped version line would strand them.
// const CACHE_VERSION = 'cim-v3.8.12';   // fix185b: rider-bg.jpg pad bands -> flat room colour
// fix186: no asset changed — this stage is CSS, markup and JS only. The bump is
// still mandatory, because './index.html' is in STATIC_ASSETS below and the
// deployed HTML filename does not change between fixes. Without it every
// installed PWA keeps serving the fix185b shell out of the v3.8.12 cache and
// the section sheet simply never appears, which is the single most common
// deployment failure in this project.
// const CACHE_VERSION = 'cim-v3.8.13';   // fix186: rider hub section sheet (#rider-sheet)
// fix187: no asset changed either — this stage is CSS, markup and JS only, and
// assets/rider-bg.jpg is BYTE-UNTOUCHED (the live stat values go into blank wall
// the art already paints, so plan §8.1's regeneration was not needed). The bump
// is mandatory all the same, for exactly the reason fix186 spells out above:
// './index.html' is in STATIC_ASSETS and the deployed HTML filename does not
// change between fixes. Skip it and every installed PWA keeps serving the fix186
// shell, the painted CASH / FTP / ENERGY row stays decorative, and the defect
// this stage exists to close is still on screen — while the file series says it
// was fixed. That is the trap this project hits most often.
// const CACHE_VERSION = 'cim-v3.8.14';   // fix187: rider hub live stat slots (.rider-slot)

// fix188 — chrome reconciliation: .game-header hidden on the Rider tab, and the
// ENERGY slot gains its gauge fill. No asset byte changed AGAIN, and the bump is
// mandatory AGAIN, for the same reason as fix186 and fix187: './index.html' is in
// STATIC_ASSETS and the deployed HTML filename never changes between fixes. Skip
// it and installed PWAs keep the fix187 shell — which on this stage means a
// duplicate header strip sitting over art that already paints one.
// const CACHE_VERSION = 'cim-v3.8.15';   // fix188: rider hub chrome reconciliation

// fix189 — polish: medallion badges, the #rider-toast pill and the Save Data
// race lockout. No asset byte changed for the SIXTH stage running, and the bump
// is mandatory for the sixth time, for the reason fix186 spells out above:
// './index.html' is in STATIC_ASSETS and the deployed HTML filename never
// changes between fixes. Skip it and installed PWAs keep the fix188 shell,
// which means the Save Data section stays reachable mid-race — the one thing
// this stage exists to prevent — while the file series says it was fixed.
// const CACHE_VERSION = 'cim-v3.8.16';   // fix189: rider hub polish (badges, pill, save lockout)
// fix197 — Lifetime Goals expansion. No asset byte changed, and the bump is
// mandatory all the same, for the reason fix186 spells out above: './index.html'
// is in STATIC_ASSETS and the deployed HTML filename never changes between
// fixes. Skip it and every installed PWA keeps serving the fix189 shell, which
// on this stage means ten new goal tracks that exist in the file and never
// appear on the Growth tab, plus save files still being written without the new
// counters — so the counters read zero even after the shell finally updates.
// fix201: rider-bg.jpg keeps its FILENAME and its CONTENTS change again — the
// 640x1422 flat-band recut is superseded by the shared 768x1707 canvas that
// plan v1 sec.0 measured across all four painted arts. Three new files are
// added below in the same stage. Both reasons make this bump MANDATORY: without
// it every installed PWA keeps painting the fix185b rider raster out of the
// v3.8.17 cache, and fix202 would then be calibrating hotspots against a
// canvas the device is not actually showing.
// const CACHE_VERSION = 'cim-v3.8.17';   // fix197: lifetime goals expansion + perfect season capstone
// fix202: rider-bg.jpg keeps its FILENAME for the FOURTH time and its CONTENTS
// changed again — the art was redrawn at higher resolution after fix200 and the
// live file is 728x1568 (708x1568 content, 20px white margin on the right),
// superseding the 768x1707 re-cut fix201 describes. Every medallion coordinate,
// the three stat-slot boxes and the new painted-BACK hotspot are all measured
// against THIS raster, so an installed PWA still painting the v3.8.18 art would
// show seven hotspots welded to a picture that is no longer underneath them.
// That is the worst form this project's most common deployment failure can
// take, so the bump is mandatory, not optional.
// The STATIC_ASSETS entry is unchanged and was NOT duplicated — fix183 already
// lists assets/rider-bg.jpg.
// const CACHE_VERSION = 'cim-v3.8.18';   // fix201: 768x1707 re-cut + training/gear/tasks art
// fix203: NO asset byte changed — this stage is CSS, markup and JS only (the
// generic .hub-stage/.hub-art/.hub-hot/.hub-slot class set, one hubGo() funnel,
// one renderHubBanner(tab), and HUB_TABS). The bump is mandatory all the same,
// for the reason fix186 spells out above: './index.html' is in STATIC_ASSETS
// and the deployed HTML filename never changes between fixes.
//
// It matters MORE than usual on this stage, not less. fix203 moves shared
// declarations OUT of #home-stage / #rider-stage / .home-hot / .rider-hot and
// into classes that only the NEW markup carries. An installed PWA serving the
// fix202 shell out of the v3.8.19 cache would therefore get the new stylesheet
// with the old markup — no .hub-hot on any button — and every hotspot on both
// hubs would lose its position, size and centre anchor at once. That is a
// harder failure than a stale picture: the two painted hubs become untappable.
// const CACHE_VERSION = 'cim-v3.8.19';   // fix202: rider-bg.jpg redrawn 728x1568
// fix204: NO asset byte changed — this stage is CSS, markup and JS only (the
// #train-stage / #train-art geometry stage, the #train-cal calibration overlay
// and trainDebugToggle()). The bump is mandatory all the same, for the reason
// fix186 spells out above: './index.html' is in STATIC_ASSETS and the deployed
// HTML filename never changes between fixes.
//
// The failure it prevents here is a quiet one rather than a loud one, which is
// why it is worth naming. Skip the bump and an installed PWA keeps the fix203
// shell, so trainDebugToggle() is simply not defined — the calibration pass
// returns "undefined" in the console and looks like a broken build, when in
// fact the build is fine and the cache is stale. Worse, if the pass is instead
// run against a device that DID update while the art file did not, fix205 would
// be measuring hotspot coordinates against a picture no other device is
// showing. Calibration stages are the ones where a stale cache does the most
// damage, because their whole output is a set of numbers taken on trust.
//
// assets/training-bg.jpg is BYTE-UNTOUCHED by this stage and its STATIC_ASSETS
// entry (added in fix201) is unchanged and was NOT duplicated. Note that fix204
// re-measured the SOURCE art at 728x1568 rather than fix201's 768x1707; if the
// deployed jpeg does not match that, it is fix201's encode that needs redoing,
// and that will be its own stage with its own bump.
// const CACHE_VERSION = 'cim-v3.8.20';   // fix203: generic hub class set + hubGo/renderHubBanner
const CACHE_VERSION = 'cim-v3.8.21';   // fix204: training hub geometry stage + calibration overlay


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
  // fix183: Rider tab scene. Precached rather than left to the runtime handler
  // so the tab is painted on a cold, offline first visit — it is bound lazily
  // in showTab(), which means a runtime-only cache would miss on exactly the
  // first open, the one time the placeholder sky would be visible.
  './assets/rider-bg.jpg',
  // fix201: the three new painted tab scenes. Precached on the same reasoning
  // as rider-bg.jpg — they are bound lazily in showTab(), so a runtime-only
  // cache would miss on exactly the first open of each tab, the one time the
  // placeholder would be visible. Appended, never inserted.
  './assets/training-bg.jpg',
  './assets/gear-bg.jpg',
  './assets/tasks-bg.jpg',
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
