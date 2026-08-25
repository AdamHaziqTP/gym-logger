# M06-T04 backup/settings restore report

Date: 2026-08-25
Status: `AUTOMATED_SCOPE_ACCEPTED`; final iPhone gate remains pending

## Finding and correction

The autonomous readiness sweep found that backup export already serialized the
metadata table containing theme and default image style, but confirmed restore
called `replaceAllSessions` and left existing device metadata untouched. A
restore could therefore show new workout data with stale appearance settings.

The correction adds an atomic `replaceAllData` transaction for sessions and
metadata, uses it from the confirmed restore flow, rejects duplicate metadata
keys instead of silently collapsing them, and refreshes App-level settings and
the document theme after restore.

## Verification

- Focused backup suites: **45/45 passed**.
- Full suite: **352/352 passed** across 29 files, with no unhandled errors.
- `npm run build`: **passed**; 61 modules and service-worker stamp
  `v-550b2f10` with 17 precache assets.
- `git diff --check`: **passed**; only normal line-ending warnings.
- Trusted HTTPS runtime smoke: shell, manifest, service worker, icon, and
  hashed JavaScript asset all returned HTTP 200. Manifest is standalone with
  `/` scope/start URL; service-worker stamp matched the build.
- Component coverage confirms restored `light` theme and `faithful` image style
  are visible in the running Settings view and the document has
  `data-theme="light"` after restore.

## Worker record

M06-T04 was dispatched once through the configured Desktop DSH/OX Alpha
wrapper. The worker session remained silent and produced no report or file
delta, so it was stopped under the bounded infrastructure policy. The narrow
correction was then completed locally from the authoritative task file and
accepted only after the independent evidence above.

## Boundary

The iOS Files/share/restore interaction is still deferred to the consolidated
iPhone 14 Pro Max checklist. No device behavior is marked passed here.
