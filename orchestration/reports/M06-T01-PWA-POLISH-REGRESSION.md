# M06-T01-PWA-POLISH-REGRESSION — offline shell and minimal polish report

Worker: OX Alpha (bounded implementation). Base checkpoint: M05-T01 automated
backup/restore checkpoint. Scope held to the task requirements; Copy to Notes,
the Apple Notes color limitation, PNG export, backup schema, row/table
behavior, and existing product decisions were not touched.

## Implementation

### Web App Manifest (`public/manifest.webmanifest`)

- Stable identity: `id: "/"`, `name`/`short_name` "Gym Log", `start_url: "/"`,
  `scope: "/"`, `display: "standalone"`, `orientation: "portrait"`.
- Dark-compatible: `theme_color: "#000000"` and `background_color: "#000000"`
  match the app's near-black Notes-like presentation.
- Local icons, dependency-free: a checked-in generator
  (`scripts/generate-icons.mjs`, Node built-ins only — hand-built PNG chunks,
  zlib from the standard library) emits `public/icons/icon-192.png`,
  `public/icons/icon-512.png`, and `public/apple-touch-icon.png` (a minimal
  #0a84ff barbell glyph on black; byte-deterministic output). The manifest
  declares 192/512 `any` plus 512 `maskable`.
- `index.html` links the manifest, favicon, and apple-touch-icon, and adds
  standalone web-app meta (`mobile-web-app-capable`,
  `apple-mobile-web-app-capable`, status-bar style `black`,
  `apple-mobile-web-app-title`). No remote assets are referenced.

### Service worker (`public/sw.js`) + registration

- Plain, dependency-free script registered from the app shell via
  `src/pwa/serviceWorkerRegistration.ts`: production builds only
  (`import.meta.env.PROD`), only when `navigator.serviceWorker` exists,
  deferred to the window `load` event, failures are console warnings. It never
  forces a reload, so an update can never interrupt editing; install uses
  `skipWaiting()` and activation claims clients immediately.
- Build stamping: a small Vite plugin in `vite.config.ts`
  (`gymLoggerServiceWorkerStamp`) rewrites `dist/sw.js` after each production
  build with a content-derived cache revision (`gym-logger-v-<fnv1a>`) and the
  exact list of emitted asset URLs, so one install pass precaches the HTML
  shell, hashed built JS/CSS, manifest, icons, and other local static files
  (17 assets in this build; sourcemaps and `sw.js` itself excluded).
- Fetch policy: same-origin GET only. Navigations are network-first with an
  offline fallback to the cached shell (then cached exact request, then a 503),
  giving offline navigation from the first successful load onward.
  Same-origin assets are cache-first with background fill. Non-GET requests,
  cross-origin requests, range requests, and `/sw.js` bypass the worker. There
  are no API/cloud endpoints and nothing remote is ever cached.
- Dev mode runs unstamped defaults (empty precache list) and relies on runtime
  fill; dev/HMR never registers the worker.

### Minimal polish / diagnostics

- Home footer gained one quiet truthful line (spec §17.3, §23): it reports
  what the Storage API actually says — "Persistent storage: granted/not
  granted" when known, measured usage when available — and always ends with
  "...your browser may still clear it." Unknown states render as best-effort;
  nothing ever claims permanence. Logic lives in `src/domain/storageInfo.ts`.
- Startup failure handling (spec §27.9): if the database cannot open or
  seeding fails, App now renders a non-destructive alert screen ("Storage
  unavailable ... Nothing was deleted") with a Try Again button that re-runs
  bootstrap in place, honest copy that local storage is not a permanent
  archive, and a pointer to Export Backup once storage recovers. The normal
  flow is untouched on success.

## Verification results (exact)

- `npm test -- --run --reporter=dot`: **passed — 315/315 tests, 26 files**
  (262 pre-existing + **53 new focused PWA tests**: pwaAssets 12,
  storageInfo 20, serviceWorkerRegistration 6, serviceWorkerRuntime 11,
  startupFailure 4).
- New coverage includes: manifest field/icon contract incl. real PNG signature +
  IHDR dimension checks against files on disk; index.html wiring; SW source
  contract (versioned cache, stamp markers, non-blocking skipWaiting/claim,
  GET-only/same-origin/no remote URLs); SW runtime behavior executed in a faked
  worker scope using the build-stamped source shape (precache install,
  tolerant partial install, stale-cache cleanup on activate, online shell
  refresh, offline shell fallback, 503 without cache, cache-first assets with
  network-count assertions, bypass matrix for POST/cross-origin/range/sw.js);
  registration gating and load-event deferral; storage diagnostic formatting/
  truthfulness; startup-failure UI including retry-without-deletion.
- `npm run build`: **passed** (`tsc && vite build`; stamp plugin logged
  `cache v-7de6ef7f precaches 17 assets`). A second build reproduced the same
  revision and byte-identical `dist/sw.js` (deterministic stamp).
- `git diff --check`: **clean** (only routine CRLF autocrlf warnings).
- Trusted HTTPS runtime smoke (`vite preview` over the project's local PFX,
  `https://localhost:4173`, `-SkipCertificateCheck`):
  - `/` → 200 text/html, contains manifest link + apple-touch-icon.
  - `/manifest.webmanifest` → 200 `application/manifest+json`; fields verified:
    name Gym Log, id/start/scope "/", display standalone, theme/bg #000000,
    3 icon entries (192 any, 512 any, 512 maskable).
  - `/sw.js` → 200 `text/javascript`; stamped revision + precache list present.
  - `/icons/icon-192.png`, `/icons/icon-512.png`, `/apple-touch-icon.png`,
    hashed `/assets/index-*.js/.css` → all 200 with correct sizes/PNG bytes.
  - Offline fallback asset contract: **all 17** precache URLs answered 200
    over HTTPS (HEAD sweep of the stamped list).
  - Deep-link navigation (`/some/deep/link`) → 200 SPA shell (server-side
    fallback consistent with the SW's navigation fallback).
- Not executable here (honest limits): no browser-based airplane-mode cold
  launch, no Home Screen install, no eviction test — see checklist below.

## Consolidated iPhone verification checklist (final human gate)

To be physically verified on the iPhone 14 Pro Max over trusted HTTPS before
any acceptance is claimed. **None of these are marked passed by this report.**

1. **Offline cold launch (NOT CLAIMED):** load the app once online, enable
   airplane mode, close and reopen the installed app — Home/session content
   must appear from cache; edits must still autosave to IndexedDB offline.
2. **Home Screen install (NOT CLAIMED):** Share → Add to Home Screen; confirm
   the Gym Log name, the barbell icon, standalone launch without Safari chrome,
   black status-bar blending, and direct resume into today's session.
3. **Update behavior (NOT CLAIMED):** after a redeploy, confirm the app keeps
   working mid-update and never interrupts an open session with a reload.
4. **Storage diagnostic truthfulness (NOT CLAIMED):** confirm the Home footer
   line renders (granted/not granted as applicable), reads well at a glance,
   and never suggests the data cannot be lost.
5. **Storage-unavailable path (NOT CLAIMED):** with site data blocked/cleared,
   confirm the non-destructive "Storage unavailable" screen appears, Try Again
   behaves, and nothing is silently dropped; Export Backup remains available
   once storage recovers.
6. **Storage eviction reality check (NOT CLAIMED):** confirm after iOS clears
   website data the app starts empty and recovery comes from Import Backup /
   Apple Notes, validating the "not a permanent archive" copy.
7. **Visual regression sweep (NOT CLAIMED):** dark Notes-like presentation
   unchanged; Home actions, Backup section, session table, color bar, image
   export sheet, and the recorded M03-T02 Home-overlap fix all render as
   before; no layout shift attributable to the new footer line.
8. Carried-forward deferred checks remain open: Apple Notes paste behavior
   (accepted v1 limitation), tall PNG export save/share, backup Files/share/
   restore round-trip, and the M01 FIX-05 touch/legend checks.

## Disposition

Automated scope of M06-T01 is complete and internally verified as above.
Offline cold launch, Home Screen installability, storage-eviction behavior,
and visual polish on the physical device remain deferred to the consolidated
final human gate and are explicitly not claimed by this report.
