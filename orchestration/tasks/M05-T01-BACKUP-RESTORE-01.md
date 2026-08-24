# M05-T01-BACKUP-RESTORE-01 — local JSON backup and restore

## Role

You are OX Alpha, the bounded implementation worker. Implement the v1 backup
and restore requirement from spec §18. Codex will independently review the
diff, tests, build, and runtime. Physical iPhone Files/share behavior remains
deferred to the consolidated final device pass.

## Requirements

- Add an accessible v1 entry point for **Export Backup** and **Import Backup**
  without adding a generic fitness/settings system or cloud service. A small
  local Home section is acceptable if it preserves the sparse layout.
- Export JSON filename: `GymLog-Backup-YYYY-MM-DD.json`.
- Include a future-compatible schema version, sessions, rows, positions,
  arbitrary cell strings, highlights, summary overrides, notes, timestamps,
  provenance/copy metadata, and any existing local settings metadata.
- Export is a truthful browser download and, where supported, a standard file
  share path; do not claim iPhone Files success from desktop tests.
- Import must parse JSON, validate schema and every session/row shape without
  coercing free-form strings or inventing values, and show a summary before
  destructive replacement/merge.
- Provide an explicit user choice for replacement versus cancel. Preserve
  existing data on cancel or invalid input. If a safety export is practical,
  perform it before replacement; never silently destroy data.
- Restore all session IDs and row order exactly. Keep one-session-per-local-date
  behavior and existing Dexie lifecycle conventions intact.

## Scope boundaries

- No cloud sync, account, analytics, native packaging, or new product behavior.
- Do not alter Copy to Notes, image export, category mapping, or Apple Notes
  colour limitation.
- Do not mark physical iPhone Files/share/restore behavior as passed by jsdom.

## Required automated coverage

Add focused tests proving:

1. Export JSON is deterministic/valid and includes schema, sessions, rows,
   highlights, arbitrary strings, summary overrides, notes, and metadata.
2. Import validates malformed/wrong-schema/invalid-row input and leaves the
   database unchanged on rejection or cancel.
3. A valid replacement restores IDs, positions, order, strings, highlights,
   notes, and summary overrides exactly.
4. The pre-replacement summary and explicit confirmation are exposed without
   silent destructive behavior.
5. The Home entry points preserve existing Today/History/Copy Another Session
   navigation.

## Verification and report

Run:

- `npm test -- --run --reporter=dot`
- `npm run build`
- `git diff --check`
- trusted HTTPS runtime smoke for the backup controls/assets.

Produce `orchestration/reports/M05-T01-BACKUP-RESTORE-01.md` with results and
the exact consolidated iPhone Files/share/restore checklist. Do not claim
physical acceptance.
