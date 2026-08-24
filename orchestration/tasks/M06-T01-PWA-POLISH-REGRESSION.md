# M06-T01-PWA-POLISH-REGRESSION — offline shell and minimal polish

## Role

You are OX Alpha, the bounded implementation worker. Implement the existing
M06 PWA polish/regression requirements only. Codex will independently audit the
diff, tests, build, and runtime. Do not claim iPhone acceptance.

## Requirements

- Add a valid Web App Manifest for Gym Logger with stable app identity, name,
  standalone display, dark-compatible theme/background, and usable local app
  icons sourced from existing project assets or a small dependency-free asset.
- Add a dependency-free service worker and register it from the app shell. Cache
  the HTML shell, built JS/CSS, manifest, icons, and local static assets using a
  versioned cache. Do not cache API/cloud data because the app is local-only.
- Provide an offline navigation fallback after the first successful load and
  keep service-worker installation/update behavior non-blocking for editing.
- Add only the minimal settings/polish needed by the spec: preserve the current
  dark Notes-like presentation, expose a small truthful local-only/storage
  diagnostic if practical, and avoid a settings maze or generic fitness
  behavior. Do not redesign the product.
- Add non-destructive user-visible handling for storage/unavailable-startup
  failures where the existing app can safely detect them; never claim local
  storage is permanent and keep Backup available.
- Add automated coverage for manifest/service-worker registration or generated
  asset contract, cache version/fallback behavior, and any settings/diagnostic
  logic added. Keep tests deterministic and dependency-free.
- Do not alter Copy to Notes, Apple Notes color limitation, PNG export, backup
  schema, row/table behavior, or the existing full-auto product decisions.

## Required verification and report

- `npm test -- --run --reporter=dot`
- `npm run build`
- `git diff --check`
- Trusted HTTPS runtime smoke for the app shell, manifest, service worker, and
  offline fallback assets.
- Produce `orchestration/reports/M06-T01-PWA-POLISH-REGRESSION.md` with exact
  results and a consolidated iPhone checklist. Do not mark offline cold launch,
  Home Screen install, storage eviction, or visual polish as physically passed.
