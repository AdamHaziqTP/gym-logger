# M05-T01-BACKUP-RESTORE-02-CORRECTION — repair backup verification typing

## Role

Bounded correction after Codex verification of `M05-T01-BACKUP-RESTORE-01`.
Do not broaden backup/restore behavior or change product decisions.

## Codex findings

The focused domain suite passes **26/26**, but `npm run build` fails in
`src/tests/backupDomain.test.ts`:

- `validJson` is declared but unused (`TS6133`). Remove it or use it in the
  intended valid-import assertion.
- `parseBackupJson` returns a discriminated union; the tests access `.error`
  without narrowing the `ok: false` branch (`TS2339`). Add a small assertion or
  branch helper that preserves the real union type; do not cast away errors.
- The tests parse arbitrary JSON as `unknown` and then access
  `doc.sessions` (`TS18046`). Narrow parsed data through the exported backup
  type/validator or use the typed result already returned by the domain helper.

## Required acceptance

- Preserve strict schema validation, arbitrary string fidelity, exact IDs/order,
  summary overrides, cancel/no-change behavior, and explicit replacement
  confirmation.
- Focused backup tests pass.
- `npm test -- --run --reporter=dot` passes.
- `npm run build` passes with no TypeScript errors.
- `git diff --check` passes.
- Produce `orchestration/reports/M05-T01-BACKUP-RESTORE-02-CORRECTION.md`.
- Do not claim physical iPhone Files/share/restore acceptance.
