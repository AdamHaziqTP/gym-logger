# Gym Logger

An offline-first, iPhone-first personal workout log. Apple Notes remains the
canonical archive; this app is a local convenience layer for editing a session
and transferring it to Notes.

## Run and verify

```text
npm install
npm run dev
npm test -- --run --reporter=dot
npm run build
npm run preview -- --host 0.0.0.0
```

Use the seed fixture at `seed/latest-session.example.json` for regression work.
The app stores sessions and settings locally in IndexedDB. It does not require
an account, backend, cloud sync, analytics, remote fonts, or runtime network
requests.

## PWA and offline use

Installability and service-worker behavior require a trusted HTTPS origin (or
localhost during development). A static host must serve the built assets,
`manifest.webmanifest`, `sw.js`, icons, and the SPA fallback for application
routes. Open the app once while online so the shell can be cached, then verify
the installed app and editing flow in airplane mode on the target iPhone.

## Backup and Apple Notes

Settings provides a local JSON backup export and validated replacement restore;
the restore flow creates a safety export before replacing local sessions and
settings metadata atomically. Copy to
Notes uses the trusted HTTPS rich path when available and retains a plain-text
fallback. On iPhone, Apple Notes accepts the editable table and preserves the
values/order, but strips Gym Logger's category foreground/highlight colours.
That is the accepted v1 platform limitation; the colours remain in Gym Logger
and PNG export.

## Final device acceptance

Desktop tests and builds do not prove iPhone behavior. The one consolidated
target-device pass is recorded in
`orchestration/evidence/HUMAN-VERIFICATION-FINAL-IPHONE14-PROMAX.md` and must
cover installability/offline behavior, M01 touch/table behavior, Home layout,
theme/settings, PNG delivery, backup/restore, and the accepted Notes transfer.

Do not add generic fitness-tracker features or reopen the accepted Notes colour
limitation without a new product decision.
