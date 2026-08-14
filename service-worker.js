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
// fix205: NO asset byte changed again — this stage is CSS, markup and JS only
// (the eight .train-hot medallions, the painted BACK hotspot, the three
// .train-slot figures and the trainHubGo()/trainComingSoon() pair). Bumped for
// the same './index.html' reason as fix204 above, and the stale-cache failure
// mode is the SAME ONE, one stage on: skip this and an installed PWA keeps the
// fix204 shell, in which trainDebugToggle() exists and works but paints a stage
// carrying nothing but the calibration grid. That reads as "fix205 did not
// land" rather than as "the cache is stale", and the natural response to it is
// to go and re-type coordinates that were already correct.
//
// assets/training-bg.jpg is BYTE-UNTOUCHED and its STATIC_ASSETS entry (added
// in fix201) is unchanged and was NOT duplicated. The fix204 caveat above still
// stands and is now load-bearing rather than advisory: every --hx/--hy pair
// this stage adds was measured against the 728x1568 source. If the deployed
// jpeg is still fix201's 768x1707 flat-band encode, the 102.825% crop is wrong
// and the whole hotspot set is offset by a constant. That is fix201's encode to
// redo, in its own stage with its own bump — do NOT nudge these coordinates.
// const CACHE_VERSION = 'cim-v3.8.21';   // fix204: training hub geometry stage + calibration overlay
// fix207: NO asset byte changed — this stage is CSS, markup and JS only (the
// gated #gear-stage / #gear-art / #gear-cal geometry stage and
// gearDebugToggle()). assets/gear-bg.jpg is BYTE-UNTOUCHED and its
// STATIC_ASSETS entry (added in fix201) is unchanged and was NOT duplicated.
// The bump is mandatory all the same, for the reason fix186 spells out above:
// './index.html' is in STATIC_ASSETS and the deployed HTML filename never
// changes between fixes.
//
// TWO STAGES ARE FOLDED INTO THIS ONE BUMP. The file series shipped fix206 —
// the Training section sheet, which is also the stage that UNGATED
// #train-stage — without a bump of its own; v3.8.22 is still labelled fix205
// above. So an installed PWA on v3.8.22 is serving a shell in which the eight
// training medallions are live and have nowhere to go. This bump carries both
// that shell and this one. Recorded rather than quietly corrected, because the
// gap is the evidence for why the rule exists.
//
// The stale-cache failure mode for THIS stage is mild by comparison and worth
// stating anyway: skip it and gearDebugToggle() is simply undefined in the
// console, which reads as "fix207 did not land" rather than as "the cache is
// stale" — and the natural response to that is to go and re-write a function
// that is already correct.
//
// The gear geometry itself is gated off (display:none until
// .gear-hub-preview), so nothing a player can reach changes on this stage.
// That is deliberate: the calibration pass has to be run on device against the
// deployed raster BEFORE fix208 welds hotspots to it, and it cannot be run
// against a cache still painting fix201's 768x1707 encode. Verify the crop
// with gearDebugToggle() on this shell first.
// const CACHE_VERSION = 'cim-v3.8.22';   // fix205: training hub hotspots, painted BACK, live stat slots
// const CACHE_VERSION = 'cim-v3.8.23';   // fix206+fix207: training section sheet; gear hub geometry stage
// fix209: NO asset byte changed — this stage is CSS, markup and JS only (the
// #gear-sheet section sheet, the gearSheetSet/gearHubBack/renderGearSheet
// funnels, and the display gate lifting off #gear-stage). The bump is mandatory
// all the same, for the reason fix186 spells out above: './index.html' is in
// STATIC_ASSETS and the deployed HTML filename never changes between fixes.
//
// It matters MORE than usual on this stage, in the same way fix203's did. The
// five #gear-section-* divs, #gear-nav and #gear-rider-scene-wrap are
// RE-PARENTED into #gear-sheet by this stage's markup. An installed PWA serving
// the fix208 shell out of the v3.8.24 cache would therefore get the new
// stylesheet with the old markup: those sections would sit outside any
// .gear-sheet-open subtree, so the Gear tab would paint its shop lists with no
// sheet chrome and no back bar while the stage stayed gated — the shop reachable
// but the hub not, which is the inverse of what shipped.
// const CACHE_VERSION = 'cim-v3.8.24';   // fix208: gear hub hotspots, painted BACK, banner slots (HTML only, no asset content change)
// const CACHE_VERSION = 'cim-v3.8.25';   // fix209: gear section sheet + stage ungated (HTML only, no asset content change)
// fix210+fix211+fix212: NO asset byte changed across any of the three — tasks
// geometry, the clipboard page re-parent and the PLAY routing are all CSS,
// markup and JS. The bump is mandatory all the same, for the reason fix186
// spells out above: './index.html' is in STATIC_ASSETS and the deployed HTML
// filename never changes between fixes.
//
// It matters MORE than usual on fix211+fix212, in the same way fix203's and
// fix209's did. fix211 RE-PARENTS #growth-nav and both #growth-section-* divs
// into #tasks-page inside #tasks-art; an installed PWA serving the fix209 shell
// out of the v3.8.25 cache would get the new stylesheet with the old markup and
// paint the task list outside the measured clipboard rect entirely.
//
// fix212's own stake is smaller but sharper: the four new .hub-play buttons and
// the re-pointed home PLAY are the only route this series gives a player to the
// race tab from a hub. A stale shell keeps home's PLAY opening Training and
// shows no PLAY at all on the other four hubs, so the stage reads as "nothing
// happened" rather than as a broken screen — which is the failure mode that
// gets shipped and not noticed.
// const CACHE_VERSION = 'cim-v3.8.26';   // fix212: hub PLAY -> race (real-DOM .hub-play on four hubs, home hotspot re-pointed)

// fix213 + fix214 — no asset CONTENT changed, so by the standing rule this bump
// is not mandatory. It is taken anyway, and deliberately.
//
// fix213 restores the LAZY_ASSET_GROUPS entry that binds --sheet-rider-scene to
// assets/rider-bg.jpg. That asset has been in STATIC_ASSETS and correctly cached
// since fix183 — the file was never the problem, the binding was. So a stale
// shell here fails in the most confusing way available: the jpeg is present in
// cache, the network is quiet, no request 404s, and the Rider tab still paints a
// flat sky. Nothing looks wrong except the screen. Bumping guarantees the fixed
// HTML is the shell that runs.
//
// fix214 removes a live Skills button and a paragraph of tombstone prose from
// the top of every tab. Same reasoning: leftover furniture on a stale shell
// reads as "the fix did not work" rather than as a caching artefact.
// const CACHE_VERSION = 'cim-v3.8.27';   // fix213+fix214: rider scene var restored; tombstone comment terminator repaired (HTML only, no asset content change)
// fix215: Training Log built out — the log medallion is a real sheet section now
// instead of a coming-soon pill. HTML ONLY: no file is added to or removed from
// STATIC_ASSETS and no asset byte changed. The bump is mandatory all the same,
// for the reason fix186 spells out above — './index.html' is in STATIC_ASSETS and
// the deployed HTML filename never changes between fixes, so without a new cache
// key every returning player keeps being served fix214 and the log stays a pill.
// const CACHE_VERSION = 'cim-v3.8.28';   // fix215: Training Log section (HTML only, no asset content change)
// fix216: a NEW asset ships — assets/calendar-bg.jpg, the 768x1707 re-cut of the
// Calendar painting — and it is appended to STATIC_ASSETS below. That makes the
// bump mandatory twice over, and both halves are worth stating because they fail
// differently:
//   1. cache.addAll() is all-or-nothing and runs at INSTALL. An installed PWA
//      sitting on the v3.8.28 cache never re-runs install, so it would never
//      fetch the new file at all — and #cal-art would fall back to flat sky on
//      a cold offline open, silently, with no error anywhere.
//   2. './index.html' is in STATIC_ASSETS and the deployed HTML filename never
//      changes between fixes (the fix186 reasoning above). Without a new key
//      every returning player keeps the fix215 shell, which has no #cal-stage,
//      so the asset would be cached and nothing would ever paint it.
// This stage is gated off in normal use, so neither failure is player-visible
// yet — which is exactly why it has to be caught HERE rather than at fix217,
// when it would present as hotspots welded to a picture the device is not
// showing. That is this project's most common deployment failure and its worst
// form (see the fix202 note above).
// const CACHE_VERSION = 'cim-v3.8.29';   // fix216: Calendar hub art + calibration (NEW asset: calendar-bg.jpg)
// const CACHE_VERSION = 'cim-v3.8.30';   // fix217: Calendar hotspots, slots, sheet, header retirement (HTML only, no asset content change)
// fix218: a NEW asset ships — assets/sponsor-bg.jpg, the 768x1707 re-cut of the
// Sponsor painting — and it is appended to STATIC_ASSETS below. Both halves of
// the fix216 reasoning apply again unchanged, and both still fail differently:
//   1. cache.addAll() is all-or-nothing and runs at INSTALL. An installed PWA
//      sitting on the previous cache never re-runs install, so it would never
//      fetch the new file at all — and #sponsor-art would fall back to flat sky
//      on a cold offline open, silently, with no error anywhere.
//   2. './index.html' is in STATIC_ASSETS and the deployed HTML filename never
//      changes between fixes (the fix186 reasoning above). Without a new key
//      every returning player keeps the fix217 shell, which has no
//      #sponsor-stage, so the asset would be cached and nothing would paint it.
// This stage is gated off in normal use, so neither failure is player-visible
// yet — which is exactly why it has to be caught HERE rather than at fix220,
// when it would present as hotspots welded to a picture the device is not
// showing. That is this project's most common deployment failure and its worst
// form (see the fix202 note above).
// fix220: no new asset this fix — sponsor-bg.jpg is unchanged and already in the
// manifest below. The bump is for index.html itself, which is precached and
// whose FILENAME is unchanged while its content changed: the stale-cache failure
// this project hits most often (see the fix202 note above) does not care whether
// the changed file is a picture or the page. Bumped every fix that changes a
// precached file, not only every fix that adds one.
// const CACHE_VERSION = 'cim-v3.8.32';   // fix220: Sponsor hotspots, switch confirm, sheet, header retirement
// fix221: a NEW asset ships — assets/skills-bg.jpg, the 768x1707 re-cut of the
// Skills painting — and it is appended to STATIC_ASSETS below. It is the LAST
// of plan v2's three, and both halves of the fix216/fix218 reasoning apply for
// the third time, still failing differently:
//   1. cache.addAll() is all-or-nothing and runs at INSTALL. An installed PWA
//      sitting on the previous cache never re-runs install, so it would never
//      fetch the new file at all — and #skills-art would fall back to flat sky
//      on a cold offline open, silently, with no error anywhere.
//   2. './index.html' is in STATIC_ASSETS and the deployed HTML filename never
//      changes between fixes (the fix186 reasoning above). Without a new key
//      every returning player keeps the fix220 shell, which has no
//      #skills-stage, so the asset would be cached and nothing would paint it.
// This stage is gated off in normal use, so neither failure is player-visible
// yet — which is exactly why it has to be caught HERE rather than at fix222,
// when it would present as hotspots welded to a picture the device is not
// showing. That is this project's most common deployment failure and its worst
// form (see the fix202 note above). It bites hardest on THIS tab of the three:
// four of fix222's five hotspots are painted circles placed by centre, and a
// centre read off the wrong raster is a miss with no visible cause.
// const CACHE_VERSION = 'cim-v3.8.33';   // fix221: Skills hub art + calibration (NEW asset: skills-bg.jpg)
// fix222: NO asset byte changed — skills-bg.jpg is unchanged and already in the
// manifest below. This stage is CSS, markup and JS only. The bump is mandatory
// all the same, for the reason fix186 spells out above: './index.html' is in
// STATIC_ASSETS and the deployed HTML filename never changes between fixes.
//
// It matters MORE than usual on this stage, in the way fix203's, fix209's,
// fix211's and fix220's did, and for a sharper reason than any of them.
// fix222 RE-PARENTS #rs-buff-wrap, the .section-lbl and #rs-hub-body into
// #skills-sheet. An installed PWA serving the fix221 shell out of the v3.8.33
// cache would get the new stylesheet with the OLD markup: those three nodes
// would sit outside any .skills-sheet-open subtree, so renderRiderSkillsCard()
// and renderRiderSkillsHub() would paint the buff bar and the drill list with
// no sheet chrome and no back bar, while the fix221 gate — which this fix lifts
// in the stylesheet, not the markup — would leave #skills-stage display:none.
// The result is the Skills tab as it looked in fix220 with a dead stylesheet
// over it: the drills reachable but the hub not, which is the inverse of what
// shipped.
//
// Second, smaller stake: 'skills' joins HUB_TABS in this fix, which is what
// retires .game-header from this tab. A stale shell keeps the header AND gets
// the new rules, which is the one combination where the tab has two exits and
// neither of them is the painted one.
// const CACHE_VERSION = 'cim-v3.8.34';   // fix222: Skills hotspots, buff bar re-parent, sheet, header retirement
// const CACHE_VERSION = 'cim-v3.8.35';   // fix223: sponsor whiteboard lines re-seated on painted rules; plaque font (HTML only, no asset content change)
// fix224 — gear hub: EXTRAS and ENERGY hotspot geometry exchanged. Two style
// attribute values, no asset byte changed. The bump is mandatory all the same,
// for the reason fix186 spells out above: './index.html' is in STATIC_ASSETS and
// the deployed HTML filename never changes between fixes. Skip it and every
// installed PWA keeps serving the fix223 shell — which on this stage means the
// two medallions still open each other's section, the exact defect this fix
// exists to close, while the file series says it was fixed.
// const CACHE_VERSION = 'cim-v3.8.36';   // fix224: gear EXTRAS/ENERGY hotspot swap (HTML only, no asset content change)
// const CACHE_VERSION = 'cim-v3.8.37';   // fix225: rider hub PLAY pill retired (HTML only, no asset content change)
// fix229: a NEW asset ships — assets/race-bg.jpg, the 768x1707 re-cut of the
// Race painting — and it is appended to STATIC_ASSETS below. It is the NINTH
// and last painted hub, and both halves of the fix216/fix218/fix221 reasoning
// apply for the fourth time, still failing differently:
//   1. cache.addAll() is all-or-nothing and runs at INSTALL. An installed PWA
//      sitting on the previous cache never re-runs install, so it would never
//      fetch the new file at all — and #race-art would fall back to flat sky on
//      a cold offline open, silently, with no error anywhere.
//   2. './index.html' is in STATIC_ASSETS and the deployed HTML filename never
//      changes between fixes (the fix186 reasoning above). Without a new key
//      every returning player keeps the previous shell, which has no
//      #race-stage, so the asset would be cached and nothing would paint it.
// This stage is gated off in normal use, so neither failure is player-visible
// yet — which is exactly why it has to be caught HERE rather than at fix231,
// when it would present as hotspots welded to a picture the device is not
// showing. That is this project's most common deployment failure and its worst
// form (see the fix202 note above). It bites hardest on THIS tab of the nine:
// SIX of fix231's seven medallions are painted circles placed by centre — one
// more than Skills — and a centre read off the wrong raster is a miss with no
// visible cause.
//
// ⚠ VERSION GAP, RECORDED NOT PAPERED OVER: the live constant below was
// 'cim-v3.8.37' (fix225) while the HTML series had reached fix228. fix226,
// fix227 and fix228 all changed './index.html' and each of them owed a bump by
// the rule above. This fix bumps ONE step, to v3.8.38, which is enough to
// invalidate the shell — the key only has to CHANGE, not to be consecutive —
// but the gap means installed clients may have been serving a stale shell
// across those three fixes. Worth confirming against the deployed service
// worker rather than assuming this file is current.
// const CACHE_VERSION = 'cim-v3.8.38';   // fix229: Race hub art + calibration (NEW asset: race-bg.jpg)
// fix230: CALIBRATION ONLY. No asset ships, no asset content changes, and the
// HTML change is a COMMENT BLOCK — the measured medallion, plate, BACK and
// crop/occlusion numbers fix231 will type. The bump is mandatory all the same,
// and for the fix186 / fix224 reason rather than the fix229 one: './index.html'
// is in STATIC_ASSETS and the deployed HTML filename never changes, so without
// a new key every installed PWA keeps serving the fix229 shell. On THIS stage
// that costs nothing a player can see — the stage is still gated off — but it
// would leave the deployed shell one behind going into fix231, which is the
// stage that welds hotspots to this art. STATIC_ASSETS is UNCHANGED: race-bg.jpg
// was appended at fix229 and no path is added or retired here.
// const CACHE_VERSION = 'cim-v3.8.39';   // fix230: Race hub calibration (comment-only HTML; no asset change)
// fix231: HTML-ONLY stage — no asset is added, removed or re-encoded, so
// STATIC_ASSETS below is untouched. The bump is still MANDATORY (plan §0 rule
// 4): './index.html' is in STATIC_ASSETS and the deployed filename never
// changes, so without a new version every installed PWA keeps serving the
// fix230 shell out of the v3.8.39 cache and the Race hub simply never appears —
// no error, no fallback, just the old tab. This stage in particular would fail
// invisibly, because the fix230 head is visually identical to fix228.
// const CACHE_VERSION = 'cim-v3.8.40';   // fix231: Race hub hotspots, slots, painted BACK, header retires
// fix232: HTML-ONLY stage — no asset is added, removed or re-encoded, so
// STATIC_ASSETS below is untouched. The bump is MANDATORY anyway (plan §0 rule
// 4): './index.html' is in STATIC_ASSETS and the deployed filename never
// changes, so without a new version every installed PWA keeps serving the
// fix231 shell out of the v3.8.40 cache. What that would look like on a device
// is worth spelling out, because it is not a blank screen: the seven medallions
// would still be there and still tappable, and every one of them would answer
// with the fix231 'coming soon' pill instead of opening its section — a hub
// that looks finished and does nothing.
// const CACHE_VERSION = 'cim-v3.8.41';   // fix232: Race section sheet + seven sections
// fix233: HTML-ONLY stage — no asset is added, removed or re-encoded, so
// STATIC_ASSETS below is untouched. The bump is MANDATORY anyway (plan §0 rule
// 4): './index.html' is in STATIC_ASSETS and the deployed filename never
// changes, so without a new version every installed PWA keeps serving the
// fix232 shell out of the v3.8.41 cache. What that costs is smaller than the
// last two stages and worth stating plainly rather than waving through: the
// Race Set-up section would simply have no route to Gear, and since fix231
// retired .game-header on this tab there is no other route the sheet offers.
// A missing row is invisible — nobody reports it, it just quietly never ships.
// const CACHE_VERSION = 'cim-v3.8.42';   // fix233: Race Set-up -> Gear link
// fix234: HTML-ONLY stage — no asset is added, removed or re-encoded, so
// STATIC_ASSETS below is untouched. The bump is MANDATORY anyway (plan §0 rule
// 4): './index.html' is in STATIC_ASSETS and the deployed filename never
// changes, so without a new version every installed PWA keeps serving the
// fix233 shell out of the v3.8.42 cache. The failure this one would produce is
// the quietest of the series and worth naming: the Progress medallion would go
// on opening and go on showing the single fix232 card, with no ladder, no
// points-to-next figure and no ⓘ. Nothing errors, nothing looks broken, and the
// stage would simply appear not to have shipped — which is exactly the class of
// miss that gets re-implemented on top of itself at fix235.
// const CACHE_VERSION = 'cim-v3.8.43';   // fix234: Race Progress build-out (category ladder)
// fix235: HTML-ONLY stage — no asset is added, removed or re-encoded, so
// STATIC_ASSETS below is untouched. The bump is MANDATORY anyway (plan §0 rule
// 4): './index.html' is in STATIC_ASSETS and the deployed filename never
// changes, so without a new version every installed PWA keeps serving the
// fix234 shell out of the v3.8.43 cache. This stage's failure mode is the same
// quiet class as the last one and is named for the same reason: the Your Club
// section would go on opening and go on showing an unlabelled list stacked over
// an unlabelled trophy card, with no ⓘ on either and — on a fresh save — a
// series wrap that renders nothing at all. Nothing errors. It simply looks like
// the stage was never written.
// const CACHE_VERSION = 'cim-v3.8.44';   // fix235: Your Club build-out (headings, ⓘ, series empty state)

// fix236 — the Race hub release pass. HTML-only stage: the only change to
// index.html is the release-pass record comment above #race-stage, and no
// asset is added or retired, so STATIC_ASSETS below is untouched and
// 'assets/race-bg.jpg' stays exactly where fix229 put it.
//
// WHAT WOULD BREAK WITHOUT THIS BUMP: nothing visible, which is precisely why
// it is easy to skip and why plan §0 rule 4 makes it unconditional.
// './index.html' is in STATIC_ASSETS and the deployed filename never changes
// between fixes, so a returning player with a warm cache would keep being
// served the fix235 HTML indefinitely. On a comment-only stage that costs no
// gameplay — but it means the release pass has certified a build that is not
// the one on anyone's phone, and the NEXT stage to touch this tab would ship
// on top of that same stale shell. The bump is what makes the pass mean
// something.
// const CACHE_VERSION = 'cim-v3.8.45';   // fix236: Race hub release pass (HTML comment only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.46';   // fix237: Train sub-tab isolation — HTML only, no asset change
// fix240: bumped because STATIC_ASSETS below GAINS four entries (the UCI
// race-type banners). Mandatory for two separate reasons this time, either of
// which alone would force it: './index.html' is in STATIC_ASSETS and the
// deployed HTML filename never changes between fixes, so returning players
// would otherwise keep the fix239 shell; and cache.addAll() only runs at
// install, so without a new version the four new files are never precached and
// an offline first open of the UCI section shows four empty boxes.
// const CACHE_VERSION = 'cim-v3.8.47';   // fix240: UCI race-type banners (NEW assets: rt-crit/rt-road/rt-tt/rt-hill.jpg)

// fix241: UCI race-type pill nav — HTML only, NO asset change. STATIC_ASSETS is
// byte-identical to fix240's. Bumped anyway, and the reason is plan §0 rule 7:
// './index.html' is in STATIC_ASSETS and the deployed HTML filename never
// changes between fixes, so a returning player with the old version installed
// keeps serving the fix240 shell from cache and never sees the nav at all. An
// HTML-only stage is precisely the stage where forgetting this bump produces a
// deployment that looks like a code bug.
// const CACHE_VERSION = 'cim-v3.8.48';   // fix241: UCI race-type pill nav (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.49';   // fix242: UCI big race card + two-tap Enter (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.50';   // fix243: legacy #race-list retired — UCI entry is the big card only (HTML only, no asset change)

// fix244: bumped because STATIC_ASSETS below GAINS two entries (the Bidon Toss
// hero banner and its win photo). Mandatory for the same two independent
// reasons fix240 recorded: './index.html' is in STATIC_ASSETS and the deployed
// HTML filename never changes, so returning players would otherwise keep the
// fix243 shell and never get the new RS_GAMES entry; and cache.addAll() runs
// only at install, so without a new version neither new file is ever precached
// and the drill's banner is empty on a first offline open.
// const CACHE_VERSION = 'cim-v3.8.51';   // fix244: Bidon Toss assets + registry entry (NEW assets: bidon-toss.jpg, bidon-toss-win.jpg)
// (no v3.8.52 — fix245 shipped the overlay shell with no asset change and its
//  own comment declined the bump; the number is skipped rather than reused.)

// fix246: HTML-ONLY stage — the Bidon Toss game loop. No file is added to or
// removed from STATIC_ASSETS below and no asset byte changed, so the list is
// identical to fix244's. The bump is mandatory all the same, for the reason
// plan §0 rule 7 gives: './index.html' is in STATIC_ASSETS and the deployed
// HTML filename never changes between fixes, so a returning player with a warm
// cache keeps being served the fix245 shell.
//
// WHAT THAT WOULD LOOK LIKE, and why it is the worst class of miss on this
// particular stage: the board would still open, the hero would still paint, the
// stat row would still read 0/10 — and the canvas would sit there dead with a
// button labelled "Start throwing" that closes the overlay. Every symptom points
// at the port having failed, and none of them points at the cache.
// const CACHE_VERSION = 'cim-v3.8.53';   // fix246: Bidon Toss game loop (HTML only, no asset change)

// fix247: HTML-ONLY stage — Bidon Toss rewards. STATIC_ASSETS below is
// byte-identical to fix246's; no file is added, retired or re-encoded. The bump
// is mandatory all the same (plan §0 rule 7): './index.html' is in
// STATIC_ASSETS and the deployed HTML filename never changes, so a returning
// player with a warm cache keeps being served the fix246 shell.
//
// WHAT THAT WOULD LOOK LIKE: a fully playable board that pays nothing. The run
// would end, the end panel would read "You landed 7 of 10." and no money, no
// buff pill and no medallion would ever appear — indistinguishable from
// btAward() having been written wrong, and the class of miss that gets
// re-implemented on top of itself at fix248.
// const CACHE_VERSION = 'cim-v3.8.54';   // fix247: Bidon Toss rewards (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.55';   // fix248: bt_hype wired into completeRace() prize (HTML only, no asset change)

// fix249: HTML-ONLY stage — the Bidon Toss medallion is connected. Two onclick
// strings' worth of change and one JS branch; STATIC_ASSETS below is
// byte-identical to fix248's, no file is added, retired or re-encoded. The bump
// is mandatory all the same (plan §0 rule 7): './index.html' is in
// STATIC_ASSETS and the deployed HTML filename never changes, so a returning
// player with a warm cache keeps being served the fix248 shell.
//
// WHAT THAT WOULD LOOK LIKE, and why this is the worst stage of the plan to
// miss it on: the player taps the fourth medallion and gets "Bidon Toss —
// coming soon". Six stages of work — assets, overlay, loop, rewards, buff
// consumer — are all present in the cached build and none of them is reachable
// by any route a player has. The one symptom points at the feature not having
// been built, and nothing points at the cache.
// const CACHE_VERSION = 'cim-v3.8.56';   // fix249: Bidon Toss medallion connected (HTML only, no asset change)
// fix250: HTML only, no asset content change — but the HTML itself is the thing
// that changed, and the shell is network-first, so this bump is belt-and-braces
// for installed PWAs whose runtime cache is holding the fix249 document.
// const CACHE_VERSION = 'cim-v3.8.57';   // fix250: Bidon Toss swipe fix + wind band (HTML only, no asset change)
// fix251: HTML only (one CSS block, one extracted predicate, one class write).
// No asset added, removed or re-encoded — the sponsor cue is painted entirely
// in CSS over art that is already cached. Bumped anyway, per the house rule:
// the shell is network-first but an installed PWA can be holding the fix250
// document, and a stale shell is still the most common deployment failure here.
// const CACHE_VERSION = 'cim-v3.8.58';   // fix251: sponsor hub collect cue (HTML only, no asset change)
// fix252: HTML only (one tombstoned block in renderSponsorHubSlots()).
// const CACHE_VERSION = 'cim-v3.8.59';   // fix252: SWITCH SPONSOR always tappable (HTML only, no asset change)
// fix253: HTML only — a registry field, one node in the drill card template and
// one new CSS rule. No asset byte changed. Bumped anyway, per the house rule:
// './index.html' is precached and the deployed filename never changes between
// fixes (the fix186 reasoning above), so without a new key a returning player
// keeps the fix252 document and never sees the reward lines at all.
// const CACHE_VERSION = 'cim-v3.8.60';   // fix253: drill cards state their payoff (HTML only, no asset change)
// fix254: HTML only — four pre-built overlay nodes in #skills-art, one new
// renderer, two existing call sites and one new CSS block. No asset byte
// changed. Bumped anyway for the same reason as the four fixes above:
// './index.html' is precached under a filename that never changes between
// fixes, so without a new key a returning player keeps the fix253 document and
// the painted medallions never report a running drill.
// const CACHE_VERSION = 'cim-v3.8.63';   // fix257: Settings sheet state + shell (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.64';   // fix258: reduced motion + race pace wired live (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.65';   // fix259: screen dimmer + number format (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.66';   // fix260: version readout + Help & Info cog (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.67';   // fix261: Victory Points currency + emission funnel (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.68';   // fix262: Shop sheet shell + inert stock (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.69';   // fix263: Tier 1 consumables live — two-tap buy, spend path, four use sites (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.70';   // fix264: Tier 2/3 live — extra bidon (escalating, MAX_ENERGY_CAP clamp) + early order / earlyOrders (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.71';   // fix265: Tier 4 identity live — four shop kit colours, two titles, Hall of Fame plaque (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.72';   // fix266: VP balance pass — daily ceiling scoped to grindable reasons only, measured price table (HTML only, no asset change)
// fix267 (profile-plan-v1 §5): Profile lands as the THIRD #home-sheet key —
// #home-profile-body, homeHubGo2Profile(), renderProfile(), hotspot 14
// repointed. Read-only, zero new state, HTML only: no asset content changes
// anywhere in this series. The bump is still MANDATORY, for the same reason
// fix186 onward gives — './index.html' is in STATIC_ASSETS and the deployed
// filename does not change, so an unbumped version keeps serving the old HTML
// to every installed PWA.
// const CACHE_VERSION = 'cim-v3.8.73';   // fix267: Profile sheet key + read-only identity/stat card (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.74';   // fix268: state.riderName — sanitising funnel, inline editor, textContent read sites (HTML only, no asset change)
// fix269: MANDATORY bump for the reason fix186 spells out above — './index.html'
// is in STATIC_ASSETS and the deployed HTML filename never changes, so without
// this the four fix269 changes (PLAY retired on train/gear/tasks, gear section
// nav locked out, carb intake in Gear > Energy, workshop cap modal on the tap
// that reaches the cap) would sit in the repo and never reach an installed PWA.
// No asset added, removed or re-encoded this stage: HTML only.
// const CACHE_VERSION = 'cim-v3.8.75';   // fix269: PLAY retired on 3 hubs, gear sub-nav lockout, carb intake in Energy, workshop cap modal on cap-reach (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.76';   // fix270: race telemetry ring buffer — instrumentation only, no gameplay change (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.77';   // fix271: Race Shape engine — roll/store/delta funnel, no UI yet (HTML only, no asset change)
// fix272: MANDATORY bump for the reason fix186 spells out above — './index.html'
// is in STATIC_ASSETS and the deployed HTML filename never changes, so without
// this every installed PWA keeps serving the fix271 shell. On THIS stage that
// failure is the whole stage: fix271 shipped the Race Shape engine live but
// invisible, so an unbumped cache leaves the shapes still silently bending
// every race outcome with nothing on screen to explain why — the exact
// "unfair rather than dramatic" risk §5 logs, caused by the deploy rather than
// the design. STATIC_ASSETS is UNCHANGED: HTML only, no asset added, removed
// or re-encoded this stage.
// const CACHE_VERSION = 'cim-v3.8.78';   // fix272: Race Shape surfacing — chip, pre-race row, INFO_TEXTS.raceShape (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.79';   // fix273: effectiveLegsCost shared funnel — arms costMod for attrition/tailwind (HTML only, no asset change)
//
// fix274 adds finishTerrainFor()/classifyFinishTerrain()/finishTerrainAudit()
// and nothing calls them, so for once the stale-cache failure mode is not a
// broken screen — it is worse in a quieter way. An installed PWA left on the
// fix273 shell has NO finishTerrainAudit() in its console, and the whole point
// of shipping this fix alone is that the audit table gets eyeballed on a real
// device BEFORE fix275 welds the finish kick to it. Skip the bump and the
// verification step silently cannot run; the natural reading is "the classifier
// didn't land" and the natural response is to go and re-write a function that
// is already correct and already deployed. Same shape of trap as fix204/fix207,
// one layer further in.
//
// STATIC_ASSETS is UNCHANGED: HTML only, no asset added, removed or re-encoded
// this stage. The bump is mandatory regardless, for the fix186 reason —
// './index.html' is in STATIC_ASSETS and the deployed HTML filename never
// changes between fixes.
// const CACHE_VERSION = 'cim-v3.8.80';   // fix274: finish terrain classifier — pure addition, zero callers until fix275
//
// fix275 welds the finish kick to fix274's classifier: the linear legs/25 line
// is tombstoned and finishKickFor() takes over. This is the first stage of the
// series where a stale cache changes RESULTS rather than pixels — an installed
// PWA left on the fix274 shell keeps handing out the old published linear kick,
// so two devices on the same save finish the same race in different places and
// the telemetry fix277 tunes against is polluted with a mix of both curves.
// Mandatory regardless for the fix186 reason: './index.html' is in
// STATIC_ASSETS and the deployed HTML filename never changes between fixes.
//
// STATIC_ASSETS is UNCHANGED: HTML only, no asset added, removed or re-encoded.
// const CACHE_VERSION = 'cim-v3.8.81';   // fix275: nonlinear terrain-dependent hidden finish kick (HTML only, no asset change)
//
// fix276: MANDATORY bump for the reason fix186 spells out above — './index.html'
// is in STATIC_ASSETS and the deployed HTML filename never changes, so an
// installed PWA left on the fix275 shell keeps the OLD gameTick fire loop and
// the OLD raceSkipFlushStages, neither of which calls resolveEventForLegs().
// The stale-cache failure mode here is silent and favours the player: every
// unaffordable choice keeps getting the `Math.max(0, legs - cost)` discount
// (§1.2), so the aggressive option stays free at exactly the moment fix276
// makes it ruinous. Worse, that device still WRITES fix270 telemetry, so its
// races land in state.raceTelemetry with a 0% empty-tank trigger rate and drag
// fix277's balance pass toward "the punishment never lands and fix276 was
// decorative" — a tuning conclusion drawn from a deployment fault rather than
// the design. STATIC_ASSETS is UNCHANGED: HTML only, no asset added, removed or
// re-encoded this stage.
// const CACHE_VERSION = 'cim-v3.8.82';   // fix276: Empty The Tank — shared resolveEventForLegs resolver on both fire paths (HTML only, no asset change)

// fix278: race stage asset cut — EIGHT new files, so STATIC_ASSETS gains eight
// entries below and this bump is mandatory twice over: the new art must be
// precached, and index.html itself changed (the LAZY_ASSET_GROUPS.racestage
// group). Without the bump an already-installed PWA keeps serving the fix276
// HTML, which has no 'racestage' group at all, and every later stage in this
// series lands on a device that cannot resolve its own art.
// const CACHE_VERSION = 'cim-v3.8.83';   // fix278: race stage art (NEW assets: race-shell.png, race-win-{road,tt,hill,crit}.jpg, pedal-sheet.png, racer-static.png, tt-static.png)
// fix279: race stage shell markup + CSS + calibration overlay, behind the
// raceStageDebugToggle() console flag. HTML ONLY — no asset added, removed or
// renamed, so STATIC_ASSETS below is untouched and the eight fix278 entries
// stay exactly as they were. The bump is still mandatory: the changed file is
// the HTML itself, and without a new cache name every already-installed PWA
// keeps serving the fix278 document indefinitely.
// const CACHE_VERSION = 'cim-v3.8.84';   // fix279: race stage shell markup/CSS (HTML only, no asset change)
// fix280: the four race-stage number slots wired to live race data, still
// behind the raceStageDebugToggle() console flag. HTML ONLY — no asset added,
// removed or renamed, so STATIC_ASSETS below is untouched and the eight fix278
// entries stay exactly as they were. The bump is still mandatory for the same
// reason as fix279: the changed file is the HTML itself.
// const CACHE_VERSION = 'cim-v3.8.85';   // fix280: race stage number slots wired (HTML only, no asset change)
// fix281: race-type -> window mapping. HTML only — all four window JPEGs
// shipped and were precached at fix278, so STATIC_ASSETS is unchanged. The
// bump exists because network-first only helps a client that asks; an
// installed PWA on 3.8.85 keeps serving the fix280 HTML until the cache key
// changes, and this stage would never land.
// const CACHE_VERSION = 'cim-v3.8.86';   // fix281: race stage race-type->window mapping (HTML only, no asset change)
// const CACHE_VERSION = 'cim-v3.8.87';   // fix282: race stage player sprite mounted, measured per-scene contact rect (HTML only, no asset change — pedal-sheet.png / tt-static.png shipped at fix278)
// const CACHE_VERSION = 'cim-v3.8.88';   // fix283: race stage sprite x driven by race position, eased (TAU=320ms). HTML only — no asset change, STATIC_ASSETS untouched
// fix287b: SPRITE RE-KEY ASSET RE-EMIT. assets/pedal-sheet.png,
// assets/racer-static.png and assets/tt-static.png are REPLACED with the
// re-keyed cut. No path added, removed or renamed, so STATIC_ASSETS is
// untouched and the fix287 note below still stands verbatim.
//
// WHY 287b AND NOT 289. The sprite re-emit is plan v2 §5's 'fix287' row, but
// that number was consumed by the race stage cutover (this file, v3.8.92 —
// plan §5's fix286 row). 288 is reserved by the fix287 note below for the
// STATIC_ASSETS racestage append, and 289 by plan §5 for the reduced-motion /
// dimmer / landscape polish. Both reservations are intact; this stage takes a
// suffix rather than displacing either.
//
// ASSET-ONLY. No HTML region edited, RC_PARTS untouched (spec v3 §4 step 6).
// The bump is mandatory anyway: the three files keep their names, so without a
// new cache key every installed PWA serves the old burnt-orange sprites from
// the runtime cache indefinitely.
// const CACHE_VERSION = 'cim-v3.8.94';   // fix288: race-stage rider sheets registered with the recolour engine (pedal-sheet / tt-static / racer-static); lazy-group writers tombstoned
// const CACHE_VERSION = 'cim-v3.8.95';   // fix289: race-stage polish — OS prefers-reduced-motion folded into the two JS motion gates, slot text halo (measured contrast deficit), isolation:isolate, landscape height cap. HTML only — no asset change, STATIC_ASSETS untouched
// const CACHE_VERSION = 'cim-v3.8.96';   // fix290: rider sprite unified on the v5 race art (.rider-sprite -> pedal-sheet.png; the three stills and the three front-on heroes -> racer-static.png), pedal-sheet.png RE-EMITTED with the row-0 cut anchor corrected (vertical jump), workshop cap modal two-tap dismiss. ASSET CHANGE: assets/pedal-sheet.png replaced in place — SAME PATH, so STATIC_ASSETS is untouched; this version bump is what forces installed PWAs to re-fetch the corrected sheet instead of serving the jumping one from cache forever.
// const CACHE_VERSION = 'cim-v3.9.01';   // fix295: CALENDAR ENTRY RATION REINSTATED, on a prestige ladder (CALENDAR_SLOTS_BY_PRESTIGE = 1/2/3/4/5/6/all by prestigeLevel, replacing fix291's uncapped getAvailableCalendarEvents().length). Four slots at Lv3 is the first level at which The Perfect Season - three Grand Tours plus a national championship in one 30-day calendar season - is attemptable, one rung below the Lv4 gear tier, so you get to try and lose before you get the kit to win. Slot denominator restored to the calendar header with the next rung named. NEW: 'The Perfect Season' achievement rewarding the Rainbow Bands kit colour; condition is byte-identical to the existing capstone Lifetime Goal statFn. fix294's prestige hint and ladder sheet rewritten - they stated prestige does NOT gate entry, true of fix294 and false as of this fix. HTML ONLY - no new or replaced assets, STATIC_ASSETS untouched.
// const CACHE_VERSION = 'cim-v3.9.02';   // fix296 (retired by fix297)
// const CACHE_VERSION = 'cim-v3.9.03';   // fix297: WORKSHOP + DRILL RETUNE, HTML ONLY. (1) Per-bench sub-ceiling: WS_MG_GAME_CAP = 180 MG per mini-game inside the existing rolling 30-min window, enforced in wsAwardMG (the single mutation funnel) and backed by state.workshop.mgWindowByGame, which expires with the window and has its own per-sub-key load guard. 3 x 180 = 540 against the unchanged global 500, so the 500 is still the real ceiling but now REQUIRES all three benches. Spent benches render dead individually in the selector; no new modal. (2) Pack Bearings: WS_BR_PER_AWARD 10 -> 1 and WS_BR_AWARD_MG 2 -> 1, so one traced revolution = 1 MG (~0.83 MG/sec at a perfect cadence, up from ~0.17). The N/10 counter becomes a per-visit tally. (3) Bidon Toss: CONSTANT throw power (BT_THROW_VY = 13) so flight time - and therefore the wind offset - is identical every throw and can be learned; BT_WIND_DRIFT 0.45 -> 0.32 against a longer flight = more drift than a hard flick used to see; BT_AIM_SCALE 0.15 -> 0.075 so an off-centre flick no longer throws the bidon clean off the board; wind ceiling 28 -> 18 km/h so a long streak is never handed an uncancellable throw. (4) Wind Tunnel: adjustment grace - the first 30 steps (0.5s) of any excursion out of the clean band still score as clean, refilled on every clean step, capped at 240 steps (4s) per run, so grace can add at most 13.3 percentage points and only to a player who is actively correcting. WT_THRESHOLD unchanged at 65. NO new or replaced assets, STATIC_ASSETS untouched.   // fix296: (1) the fix286 "Race screen preview" settings row retired now the calibration overlay is confirmed - tombstoned, settingsStageTap/_setStageArmAt/raceStageDebugToggle/_raceStageDebug all survive so the grid stays console-raisable. (2) GRAND TOUR GC BOARD FIXED: gcScoreStageForField() handed the rival field the stage points table from the top independently of the player, so a stage win paid first-place points TWICE - once to the player, once to the top rival - and a player winning stages could sit 2nd or 3rd on the board. The field is now scored AROUND the player's real finishing position, so every place is issued exactly once. NOT retroactive: tours already underway keep their banked rival totals. The gear tier is not implicated and is untouched. HTML ONLY - no new or replaced assets, STATIC_ASSETS untouched.
// const CACHE_VERSION = 'cim-v3.9.04';   // fix298: LIFETIME GOALS ARE COLLECTABLE FROM THE GROWTH TAB, HTML ONLY. The reward was never auto-granted - collectGoalTierReward() was already the single funnel and uncollectedGoalTiers already persisted across reloads via the boot re-enqueue - but the ONLY route to it from the tab was a pip that re-raised the ceremony overlay, so a player who dismissed the pop-up had no visible way to finish. (1) The unconditional ceremony teardown at the tail of collectGoalTierReward is now guarded on ceremonyShowing, so the funnel is safe to call with no modal open; unguarded it cleared ceremonyShowing and let processCeremonyQueue() pop an unrelated achievement or relic ceremony at the player. Ceremony path is byte-identical. (2) The goal tier pip calls collectGoalTierReward directly instead of enqueueCeremony. (3) New .goal-collect-btn on each goal track card, rendered only when that track has an uncollected tier, naming the lowest owed tier's reward and counting the rest; single tap, not two-tap armed (collecting is not destructive). (4) .goal-collect-btn CSS, amber token trio, 44px min tap target. WHEN a tier becomes collectable is unchanged: checkLifetimeGoals() still owns it and the boot re-enqueue is untouched, so the pop-up still lands. No state fields added, no save migration, no new or replaced assets, STATIC_ASSETS untouched.
// const CACHE_VERSION = 'cim-v3.9.05';   // fix299 (superseded by fix301) — full note retained on the line below
const CACHE_VERSION = 'cim-v3.9.06';   // fix301: CAREER GEAR UNLOCKS, HTML ONLY. Eleven new catalogue items across all four gear slots (4 road frames, 2 TT frames, 3 wheelsets, 2 suits) carrying price:null — NOT FOR SALE at any cash balance or prestige level. The only route is a Lifetime Goal tier whose reward.type is the new 'gear' type, granted through collectGoalTierReward() -> grantCareerGear(), THE single mutation funnel for career-gear ownership. Grants ownership only, never auto-equips (a backlog of three collected tiers must not swap a bike mid-Grand-Tour). Eight existing tracks gain a tier at INDEX 4 (wins/podiums/starts/gtfinished/gcpodiums/ttwins/mgbanked/sessions) — appended, never inserted, so every existing 'trackId:tierIndex' key still resolves to the tier it did before. Three NEW tracks appended (critwins/roadwins/hillwins) reading raceWinsByType.crit/.road/.hill, three lifetime counters that already existed; NO NEW SAVE FIELDS AT ALL, and therefore no load guard and no migration — ownership rides the existing ownedBikes/ownedTTBikes/ownedWheels/ownedKits sets and the gate reads claimedGoalTiers. Unlock sentences are DERIVED from LIFETIME_GOALS into CAREER_GEAR_SOURCE (same rule as KIT_COLOR_SOURCE) and back-tagged onto the catalogue objects by tagCareerGearUnlocks(), so a retuned threshold cannot leave the Gear tab telling players to do something the game no longer asks for; a reverse audit console.warns any price:null item with no unlock route. Hard lockouts: buyBike/buyTTBike/buyWheels/buyKit each gain an itemCashBlocked() guard placed BEFORE the affordability test (state.money < null is false, so the old guard would have sold a career frame for £0), buildEquipCard binds no buy handler when price!==null fails, and the career branch is evaluated ahead of the prestige branch. Tier VI badge (.tier-6, teal) + .equip-career-req added; stat-bar scales raised (bikes 46/42, TT 48, wheels climb 24, kit 19) so the new best-in-slot items do not paint identical full bars to tier 5. NO new or replaced assets, STATIC_ASSETS untouched.   // fix299: FIVE NEW DAILY TASKS, HTML ONLY. Four drill dailies - drill_fz / drill_sl / drill_wt / drill_bt, 15 XP each - marked at each drill's existing lastPlayed stamp, which is this file's definition of 'a drill was ridden', so the task and the hub's last-played display cannot disagree. Marked on COMPLETION, not on a win. A drill PASS (useDrillPass) deliberately does NOT mark, matching the existing rule that a pass never writes bestScores. One grease daily - collect_mg, 200 MG, 30 XP - backed by the new day-scoped counter state.dailyTasks.mgToday, incremented inside wsAwardMG (THE single MG mutation funnel) on `actual` rather than `gained` so the 9999 balance clamp and the fix297 per-bench sub-ceiling can never pay off a daily with MG the player did not receive. Threshold named once as DAILY_MG_TARGET; the task card shows a live n/200 tally. mgToday resets in dailyTaskReset alongside progress/claimed and has its OWN per-sub-key load guard that type-checks the number (the tourProgress lesson). NO SAVE MIGRATION: loadGame's existing defensive merge spreads defaultProgress/defaultClaimed under the saved object, so old saves gain the five keys as false on next load. Table entries APPENDED, never inserted. No new or replaced assets, STATIC_ASSETS untouched.
// const CACHE_VERSION = 'cim-v3.9.00';   // fix294: PRESTIGE MADE LEGIBLE — the prestige card gains a capstone hint stating what winning all three Grand Tours and a national championship actually requires, and an info sheet showing the FULL Lv0-Lv6 ladder rather than only one level ahead. Both are DERIVED from CARB_BASE_BY_PRESTIGE / WORKSHOP_CAP_BY_PRESTIGE / the minPrestige fields on the four gear registries, so a gear-ladder retune cannot leave the hint lying. IMPORTANT CORRECTION CARRIED IN THE COPY: prestige does NOT gate calendar entry - that is race category alone (isProTierUnlocked), and the per-season entry ration was removed in fix291. What prestige gates is the equipment you need to WIN. HTML ONLY - no new or replaced assets, STATIC_ASSETS untouched. NOTE the version scheme rolls 3.8.99 -> 3.9.00 here.
// const CACHE_VERSION = 'cim-v3.8.99';   // fix293: KIT COLOUR PICKER OVERHAUL — locked swatches are now grey + padlocked (was a 30%-opacity tint that read as "this colour, faded"), unlocked ones sort first behind a labelled divider with an "N of M unlocked" count, and tapping a locked swatch opens an explainer naming exactly what unlocks it. The unlock text is DERIVED at load from ACHIEVEMENTS / LIFETIME_GOALS / SHOP_STOCK / the new GT_JERSEYS table rather than hand-written, so a retuned threshold cannot leave the picker giving stale instructions. THREE NEW COLOURS: the Grand Tour leader's jerseys (Maillot Jaune / Maglia Rosa / Maillot Rojo), awarded on a first GC Champion finish of the matching tour, at the same site and on the same condition as the relic. HTML ONLY — no new or replaced assets, STATIC_ASSETS untouched.
// const CACHE_VERSION = 'cim-v3.8.98';   // fix292: INTRODUCTION OVERHAULED — the spotlight onboarding tour is retired (onboarding.done forced true on every load, boot launch tombstoned, startOnboarding/replayOnboarding neutered) and replaced by per-page guides: a PAGE_HELP entry for all ten pages, a fixed bottom-left ? button in the same viewport position on every page, and a first-visit auto-open per page tracked in the new helpSeen dictionary. The £20 welcome bonus moves off the retired tour onto its own one-shot welcomeBonusPaid flag (heals to true for existing saves, so nobody is paid twice). HTML ONLY — no new or replaced assets, STATIC_ASSETS untouched. The bump exists because installed PWAs would otherwise serve the fix291 HTML forever and keep showing the retired tour to new players.
// const CACHE_VERSION = 'cim-v3.8.97';   // fix291: difficulty levels (Amateur/Pro/Legendary; new games default to Pro, existing saves heal to Amateur so no in-progress balance moves), calendar per-season entry ration REMOVED, prestige now ends the calendar season and raises the difficulty picker. HTML ONLY — no new or replaced assets, STATIC_ASSETS untouched. The bump exists because installed PWAs would otherwise serve the fix290 HTML forever and never see the picker.
// const CACHE_VERSION = 'cim-v3.8.93';   // fix287b: sprite re-key asset re-emit (pedal-sheet / racer-static / tt-static replaced; no path change, STATIC_ASSETS untouched)
// const CACHE_VERSION = 'cim-v3.8.92';   // fix287: RACE STAGE CUTOVER — painted stage ungated, course-profile SVG + peloton strip retired. HTML only, STATIC_ASSETS untouched
// const CACHE_VERSION = 'cim-v3.8.91';   // fix286: race stage preview row in Settings (two-tap armed) — HTML only, no asset change
//
// fix287 NOTE — STATIC_ASSETS DELIBERATELY NOT TOUCHED. The eight 'racestage'
// paths (race-shell.png, the four race-win-*.jpg, pedal-sheet.png,
// racer-static.png, tt-static.png) are fetched at runtime by
// lazyLoadAssetGroup('racestage') and are NOT in the precache list. Online play
// is unaffected. Offline-launched play will paint an unpainted stage until they
// are appended — that append is fix288's job, APPENDED never inserted, and it
// is a separate fix because cache.addAll() is all-or-nothing at install and a
// single bad path there bricks updates for every installed PWA.
// const CACHE_VERSION = 'cim-v3.8.89';   // fix284: race stage pedal animation (19-frame strip, 40ms/frame) + reduced-motion hold, TT animated:false. HTML only — no asset change, STATIC_ASSETS untouched
// fix286: the race stage preview reaches the SETTINGS SHEET. HTML only — no
// asset added, removed or re-encoded, so STATIC_ASSETS below is untouched and
// the eight fix278 entries stay exactly as they were.
//
// The bump is mandatory for the fix186 reason ('./index.html' is in
// STATIC_ASSETS and the deployed filename never changes), and this stage has a
// sharper stake than most: fix286 EXISTS to make plan §5's hard-gate
// verification performable on a phone. An installed PWA left on the v3.8.90
// shell has no 'Race screen preview' row and no settingsStageTap() — so the
// tester opens Settings, finds nothing there, and the only available readings
// are "the fix did not land" or "there is no way to test this". Both are wrong,
// both cost a session, and the second one is how a hard gate quietly gets
// waived. Skip the bump and the verification step silently cannot run: same
// shape of trap as fix274, one layer further in.
//
// The four fix278 window JPEGs and pedal-sheet.png were precached at fix278 and
// are still only fetched when lazyLoadAssetGroup('racestage') runs, which this
// stage newly makes reachable without a console. Nothing about the group, the
// manifest, or the fetch strategy changes here — only who can trigger it.
// const CACHE_VERSION = 'cim-v3.8.90';   // fix285: raceCommentaryLine() commentary funnel + painted stage bubble wired; fix71 SVG bubble now reads the funnel (output unchanged). HTML only — no asset change, STATIC_ASSETS untouched


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
  // fix216: Calendar tab scene, the first of plan v2's three. Same reasoning as
  // the four above — bound lazily in showTab(), so a runtime-only cache would
  // miss on exactly the first open, the one time the placeholder sky would be
  // visible. APPENDED, never inserted.
  './assets/calendar-bg.jpg',
  // fix218: Sponsor tab scene, the second of plan v2's three. Same reasoning as
  // the five above — bound lazily in showTab(), so a runtime-only cache would
  // miss on exactly the first open, the one time the placeholder sky would be
  // visible. APPENDED, never inserted.
  './assets/sponsor-bg.jpg',
  // fix221: Skills tab scene, the third and last of plan v2's three. Same
  // reasoning as the six above — bound lazily in showTab(), so a runtime-only
  // cache would miss on exactly the first open, the one time the placeholder
  // sky would be visible. APPENDED, never inserted.
  './assets/skills-bg.jpg',
  // fix229: Race tab scene, the ninth and last painted hub. Same reasoning as
  // the seven above — bound lazily in showTab(), so a runtime-only cache would
  // miss on exactly the first open, the one time the placeholder sky would be
  // visible. APPENDED, never inserted.
  // NOT './assets/race-hero-bg.jpg', which is a different, still-live file
  // further down this list and is the small hero card's backdrop, not the hub's.
  // Both entries are correct and both stay.
  './assets/race-bg.jpg',
  // fix240: the four UCI race-type banners. Same reasoning as every scene above
  // — they are bound lazily in showTab(), so a runtime-only cache would miss on
  // exactly the first open, the one time the empty box would be visible.
  // APPENDED, never inserted.
  // NOT a replacement for './assets/race-bg.jpg' directly above (the hub
  // backdrop) or './assets/race-hero-bg.jpg' at the foot of this list (the hero
  // card's backdrop). All six entries are correct and all six stay.
  // cache.addAll() is all-or-nothing at install: a typo in ANY one of these four
  // filenames rejects the install promise and the SW never activates, so all
  // four were checked against the encoded files on disk, not against this plan.
  './assets/rt-crit.jpg',
  './assets/rt-road.jpg',
  './assets/rt-tt.jpg',
  './assets/rt-hill.jpg',
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
  // fix244: Bidon Toss, the fourth drill. Same split and the same reasoning as
  // the three pairs above — the hero is lazy via lazyLoadAssetGroup(
  // 'riderskills'), the win photo via the data-src promote in
  // rsShowSuccessPop() — so neither is fetched on page load, but both must be
  // precached here or the board opened offline shows an empty banner.
  // APPENDED, never inserted. cache.addAll() is all-or-nothing at install: a
  // typo in either filename rejects the install promise and the SW never
  // activates, so both were checked against the encoded files on disk rather
  // than against the plan.
  './assets/bidon-toss.jpg',
  './assets/bidon-toss-win.jpg',
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
  // fix278: the live race stage art (race-vis-overhaul-plan-v2 §5, stage 1 of
  // 12). APPENDED, never inserted. All eight are bound lazily via
  // lazyLoadAssetGroup('racestage') — which nothing calls until fix279 — so
  // none is fetched on page load, but every one must be precached here or a
  // race started offline paints an empty stage.
  //
  // ALL FOUR WINDOWS ARE PRECACHED even though only one is applied per race.
  // That is the deliberate opposite of the lazy-fetch behaviour: at runtime the
  // browser downloads only the window fix281 applies, but a player offline may
  // enter ANY of the four race types, and a missing window is a blank band in
  // the middle of the screen. Install-time cost is paid once on a connection
  // the install already required.
  //
  // cache.addAll() is all-or-nothing at install — one wrong filename rejects
  // the install promise and the SW never activates — so all eight names were
  // checked against the encoded files on disk, not against the plan. The plan
  // and the shipped files disagree on nothing here, but the check is the point.
  './assets/race-shell.png',
  './assets/race-win-road.jpg',
  './assets/race-win-tt.jpg',
  './assets/race-win-hill.jpg',
  './assets/race-win-crit.jpg',
  './assets/pedal-sheet.png',
  './assets/racer-static.png',
  './assets/tt-static.png',
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
