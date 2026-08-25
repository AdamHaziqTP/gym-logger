# M06-T01-CORRECTION-01 — clear delayed SessionView status timer on unmount

## Role

Bounded correction after Codex independent verification of M06-T01. Preserve
all product behavior and change only the lifecycle defect described below.

## Verified defect

The full suite reports 315/315 assertions but also emits an unhandled
`ReferenceError: window is not defined` after `sessionInteraction.test.tsx`
teardown. The callback is the delayed `savedResetTimer` in
`src/components/SessionView.tsx` (`setTimeout(() => setSaveState("idle"),
1500)`) firing after the jsdom environment has been torn down.

## Required correction

- Clear `savedResetTimer.current` in the SessionView effect cleanup alongside
  the existing undo timer cleanup.
- Keep the existing autosave/pagehide flush behavior intact; do not close the
  shared Dexie instance or cancel in-flight saves.
- Add or adjust focused automated coverage proving the delayed status timer is
  cleaned up on unmount, without weakening existing assertions.
- Do not alter M06 PWA behavior, backup schema, Notes export, image export,
  table/row behavior, or product decisions.

## Acceptance

- Focused SessionView suite passes with no unhandled errors.
- `npm test -- --run --reporter=dot` passes with zero unhandled errors.
- `npm run build` passes.
- `git diff --check` passes.
- Produce `orchestration/reports/M06-T01-CORRECTION-01-SESSION-TIMER-CLEANUP.md`.
