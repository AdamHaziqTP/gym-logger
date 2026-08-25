# M06-T06 — Actual Tuesday session migration

Implement one bounded, idempotent live-data migration for the personal Gym Logger PWA.

Authoritative source: `references/ACTUAL_SESSION_2026-08-25.json`.

Requirements:

- Insert/update its stable Tuesday 2026-08-25 session in the existing IndexedDB without overwriting unrelated data.
- Use a migration/meta marker so startup is safe to repeat and never duplicates the Tuesday record.
- Preserve the Sunday 2026-08-23 history record, settings, metadata, backups, and any unrelated sessions. Do not delete an unidentified Wednesday/test session.
- Preserve every source string, row order, highlight, and the explicit 40/40 summary.
- Make normal `startTodaySession` cloning use the Tuesday session when it is the newest source, while keeping the existing Skip/notes clearing policy.
- Add focused tests for once-only migration, no duplicate, exact 40-row data, 40/40 summary, Sunday preservation, unrelated metadata preservation, and Thursday cloning from Tuesday.

Keep the existing Canvg PNG correction unchanged. Use the existing data/seed/clone conventions. Do not invent product scope. Return a concise implementation report with files changed and tests run.
