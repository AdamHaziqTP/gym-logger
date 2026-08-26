# M03-T11 — Final one-app IPA UX cleanup

Status: `AUTOMATED SCOPE ACCEPTED — HUMAN GATE OPEN`

## Authority

This task implements the product-owner decision in
`orchestration/state/M03-T11-FINAL-IPA-UX-CLEANUP-2026-08-27.md`.
The all-in-one Gym Logger IPA remains the product target; the React app stays
the UI implementation and the Swift shell owns device-only Photos/pasteboard
operations.

## Bounded scope

- Remove the obsolete ordinary `Copy to Notes` control from the session UI.
- Keep `Copy Coloured Notes & Open Notes` as the sole Notes action.
- Remove the normal `Export Image` modal, preview, style toggle, and Faithful
  control from the session UI.
- Replace the old share/download snapshot action with `Save Colour Snapshot`.
- Render the visible current session using the existing Compact renderer,
  including unsaved editor values, and send the PNG through the in-process
  WebKit bridge.
- Save the received PNG directly through Photos using add-only authorization
  and truthful saving/denied/failed status events.
- Keep the proven coloured Notes handoff, persistence, backup/import/export,
  offline bundle, settings, migration, and core editor behavior intact.
- Keep the native helper and E-004 feasibility sources available; no OX Alpha
  dispatch is authorized for this task.

The first hosted attempt (`32990405957`) exposed one Xcode 15.4 Swift API
compatibility issue in the new Photos write call. Codex corrected it to the
Swift-imported `PHAssetCreationRequest.forAsset()` API; the replacement
hosted build was then completed successfully by run `32990579200`.

## Acceptance

Automatable acceptance requires focused and full tests, production build,
one-app/native contract checks, native E-004 checks, diff hygiene, and hosted
macOS/Xcode IPA metadata/resource assertions. Physical iPhone behavior remains
open until the final M03-T11 device gate is completed.
