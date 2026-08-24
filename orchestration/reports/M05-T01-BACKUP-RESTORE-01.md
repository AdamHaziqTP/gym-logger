# M05-T01-BACKUP-RESTORE-01 — backup/restore report

## Implementation

Added local JSON Export Backup / Import Backup controls on Home. The export
contains schema/version, sessions, rows and positions, arbitrary cell strings,
highlights, notes, summary overrides, timestamps/provenance, and existing local
metadata. Import validates before touching Dexie, shows a file summary, requires
explicit Replace All Data, preserves data on Cancel/invalid input, attempts a
best-effort safety export, and replaces sessions transactionally without
regenerating IDs/order or values.

## Codex verification

- Focused backup suites: **43/43 passed**.
- Full suite: **262/262 passed** across 21 files.
- `npm run build`: **passed**; TypeScript and Vite build cleanly.
- `git diff --check`: **passed**.
- Trusted HTTPS smoke: app shell, `BackupSection.tsx`, `domain/backup.ts`, and
  `Home.tsx` returned HTTP 200 from `https://192.168.1.49:5173`.
- OX test-typing correction is recorded in
  `orchestration/reports/M05-T01-BACKUP-RESTORE-02-CORRECTION.md`.

## Consolidated iPhone verification checklist

On the final trusted HTTPS/Home Screen build, verify on the iPhone 14 Pro Max:

1. Export Backup opens the normal iOS share/file workflow; save to Files (both
   iCloud Drive or On My iPhone if available) and confirm the exact JSON file
   name `GymLog-Backup-YYYY-MM-DD.json`.
2. Import Backup opens the Files picker and accepts the saved JSON.
3. Invalid JSON shows a useful error and leaves the current session untouched.
4. A valid import shows session/row/date summary before any replacement.
5. Cancel and backdrop dismissal leave current data untouched.
6. Replace All Data requires the explicit button; if offered, confirm the
   pre-restore safety backup is delivered before replacement.
7. After replacement, confirm session dates, row order/IDs as observable,
   arbitrary values, highlights, notes, summary overrides, and copied metadata
   are preserved; confirm the app remains usable after reload.

These are deferred human checks. No physical Files/share/restore behavior is
claimed by the automated checkpoint.
