# M05-T01-BACKUP-RESTORE-01 — Codex review

## Disposition

**Automated engineering scope accepted.** The backup correction was limited to
type-safe test assembly; production backup behavior remains the bounded worker
implementation and passed independent verification.

## Independent verification

- Focused backup suites: **43/43 passed** across `backupDomain.test.ts` and
  `backupRestore.test.tsx`.
- Full suite: **262/262 passed** across 21 files.
- `npm run build`: **passed**; TypeScript and Vite build cleanly (56 modules).
- `git diff --check`: **passed**.
- Trusted HTTPS runtime smoke: `/`, `BackupSection.tsx`, `domain/backup.ts`,
  and `Home.tsx` all returned HTTP 200 from `https://192.168.1.49:5173`.

## Scope findings

The implementation covers deterministic JSON export, strict validation without
free-form coercion, session/row IDs and positions, highlights, notes, summary
overrides, timestamps/provenance, metadata export, truthful download/share
outcomes, pre-replacement summary, explicit Cancel/Replace All Data, and a
best-effort safety export before replacement. Existing Home navigation remains
covered by the component tests.

The restore path deliberately preserves device-local metadata rather than
replacing it, preventing a backup restore from silently reseeding or deleting
local device state. This is documented in the data-layer implementation and
does not alter the session restore contract.

## Human evidence still required

No physical acceptance is claimed. The consolidated final iPhone pass must
verify: Export Backup to Files/iCloud/On My iPhone, Import Backup file picker,
invalid-file messaging, summary and Cancel, safety export, explicit Replace All
Data, exact restored sessions/rows, and offline operation. Desktop tests cannot
prove those OS file/share behaviors.

## Next position

M05-T01 is accepted for automated scope. Continue to the bounded M06 PWA
polish/regression task; retain all real-device checks for the final human gate.
