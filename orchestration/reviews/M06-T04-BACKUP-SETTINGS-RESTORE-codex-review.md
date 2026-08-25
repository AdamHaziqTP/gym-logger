# Codex review — M06-T04 backup/settings restore

Date: 2026-08-25
Decision: `ACCEPTED_FOR_AUTOMATED_SCOPE`

## Diff audit

The correction is bounded to the verified backup contract:

- `replaceAllData` replaces sessions and metadata in one Dexie transaction.
- Confirmed restore passes imported metadata and refreshes App-level settings.
- Duplicate metadata keys are rejected before any write.
- Existing safety-export, validation, and session semantics remain intact.
- Tests cover metadata restoration, live theme/style refresh, duplicate-key
  rejection, and the existing exact session restore path.

No new product scope, native code, cloud service, Notes colour work, or
destructive behavior outside the existing explicit restore confirmation was
introduced.

## Evidence

- Focused backup tests: **45/45 passed**.
- Full suite: **352/352 passed**, zero unhandled errors.
- Build: **passed**.
- Trusted HTTPS runtime: shell, manifest, service worker, icon, and built asset
  returned 200; service-worker stamp and manifest identity verified.
- Diff hygiene: `git diff --check` passed.

This review accepts automated evidence only. Physical Files/share/restore and
other iPhone checks remain in the final consolidated device gate.
