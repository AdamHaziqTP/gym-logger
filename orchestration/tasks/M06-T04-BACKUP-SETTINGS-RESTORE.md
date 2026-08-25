# M06-T04 — restore backed-up settings metadata exactly

## Role

You are OX Alpha, the bounded implementation worker. Correct one verified v1
release-readiness gap: backup files already include the local metadata/settings
records, but restore currently replaces sessions only. Codex will independently
verify the diff and all acceptance criteria.

## Requirements

- Preserve the existing JSON backup format and strict validation.
- During an explicitly confirmed restore, replace both sessions and backed-up
  metadata/settings records atomically. Restore records verbatim; do not
  regenerate timestamps or normalize values.
- Keep safety export behavior and transactional failure semantics.
- After restore, the running app must reflect restored theme/default image style
  without requiring a page reload, or document the smallest safe app-level
  update needed to make that true.
- Add focused automated coverage for metadata/settings round-trip and restore
  failure/no-partial-write behavior where practical. Preserve existing tests.
- Do not add cloud sync, accounts, native code, generic fitness behavior, or
  Apple Notes colour work. Do not claim physical Files/share or iPhone checks.

## Acceptance

- Existing focused backup tests plus new settings-restore coverage pass.
- Full suite has zero failures/unhandled errors.
- `npm run build` and `git diff --check` pass.
- The change remains limited to the backup/settings restore contract.
