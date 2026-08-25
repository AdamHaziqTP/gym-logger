# M06-T03-RELEASE-READINESS — performance, static deployment, and final handoff

## Role

You are OX Alpha, the bounded implementation worker. Finish the remaining
automatable v1 release-readiness work only. Codex will independently verify all
changes. Do not claim physical iPhone acceptance and do not reopen Apple Notes
colour transfer; editable Notes table/data/order without category colours is the
accepted v1 limitation.

## Requirements

- Add deterministic performance/regression coverage for the approved 40-row
  fixture and a synthetic 100-row session: rendering/export/domain operations
  must complete without crashes, silent value loss, or row-order corruption.
  Keep the test practical and dependency-free; do not invent a numeric latency
  promise that the product spec does not make.
- Audit the production build for static deployment readiness: relative/absolute
  asset paths, manifest/service-worker precache, SPA fallback, trusted HTTPS
  requirement for installability, and no remote runtime dependencies. Add only
  small configuration/docs fixes that are genuinely needed; do not introduce a
  hosting vendor, account, cloud backend, or secret.
- Add/update concise project documentation covering install/run/test/build,
  trusted HTTPS/static hosting requirements, PWA first-load/offline behavior,
  backup/restore, Apple Notes accepted color limitation, and the consolidated
  final iPhone 14 Pro Max checklist location.
- Reconcile `orchestration/state/REQUIREMENTS_MATRIX.md`, `STATE.md`, and the
  product-sync packet with accepted automated evidence and deferred human gates.
- Preserve all existing product decisions and features. No native rewrite,
  no generic fitness features, no cloud sync, and no open-ended Apple Notes
  experiments.

## Acceptance

- New focused performance/release tests pass.
- `npm test -- --run --reporter=dot` passes with zero unhandled errors.
- `npm run build` passes.
- `git diff --check` passes.
- Trusted HTTPS runtime smoke passes for the shell, manifest, service worker,
  icons, and built asset paths.
- Produce `orchestration/reports/M06-T03-RELEASE-READINESS.md` and update the
  consolidated human checklist. Do not mark device/offline/visual checks as
  passed.
