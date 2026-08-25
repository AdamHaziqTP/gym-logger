# M06-T06 Codex review

## Decision

**ACCEPTED for automated scope.** The source-preserving migration, production startup wiring, icon assets, and test coverage are independently verified. The final physical iPhone gate remains open.

## Acceptance checklist

- [x] Authoritative Tuesday source file contains 40 supplied rows and explicit 40/40 totals.
- [x] Stable session ID and migration marker are used.
- [x] Session and marker are written atomically.
- [x] Repeated startup does not duplicate or overwrite the imported record.
- [x] Sunday history and unrelated metadata/session records are preserved.
- [x] Unidentified Wednesday data is not deleted.
- [x] Next-date cloning inherits Tuesday values/highlights and clears Skip/notes under the existing policy when Tuesday is the newest session.
- [x] Supplied icon is used by the PWA icon endpoints; the original asset is preserved as a reference.
- [x] Focused migration tests: 12/12 pass, including App startup integration.
- [x] Full tests: 374/374 pass across 32 test files.
- [x] Build, HTTPS shell/manifest, certificate endpoint, and diff hygiene pass.
- [ ] Existing-device IndexedDB migration and iPhone Home Screen presentation: deferred to the consolidated human pass.

## Scope boundary

This checkpoint does not modify the Canvg PNG correction, reopen Apple Notes colour recovery, delete unknown sessions, or add generic fitness behavior.
