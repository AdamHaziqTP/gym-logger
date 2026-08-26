# Human verification — M03-T10 one-app Gym Logger IPA

Status: `PARTIAL PASS — ONE-APP COLOURED NOTES FLOW PASSED; FINAL UI/PHOTOS CLEANUP REQUESTED`

Hosted artifact: `GymLogger-unsigned.ipa` from corrected workflow run
[`32986140862`](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32986140862).

This artifact includes the Codex correction that waits for native
clipboard/Notes completion and reports a manual-open fallback truthfully.
Do not install the older `32982786740` artifact for this gate.

This is the single consolidated device gate for the one-app productization.
Do not infer any unchecked item from desktop tests, source review, or IPA metadata.

## Installation and independence

- [x] Install the fresh unsigned `GymLogger-unsigned.ipa` in the existing
  LiveContainer/SideStore-style workflow.
- [x] Launch the Gym Logger IPA itself; no separate helper app is required for the
  reported coloured Notes flow.
- [ ] Confirm it opens and remains usable with the PC/LAN server unavailable.
- [ ] Confirm the app icon is the deliberate Gym Logger icon, not the old G.

## Data and core app

- [ ] Home opens with Tuesday 25 Aug (`actual-2026-08-25`) as Last Workout/
  clone source when no later legitimate session exists.
- [ ] Start/continue a session, edit a representative value and note, kill the
  IPA, relaunch it, and confirm the edits persist.
- [ ] Confirm session history, row editing/reorder/menu actions, highlights,
  summary override, backup/import/export, settings/theme, and offline launch
  remain usable.

## Coloured Notes handoff

- [x] From the visible workout session, tap the one-app coloured Notes action.
- [x] Notes opens from the same Gym Logger app after the coloured clipboard is prepared.
- [x] Paste once into the canonical `Gym` note.
- [x] Human report: the pasted table is fully correct and coloured.
- [x] No separate helper app, PWA/web URL, or Shortcut was required for this reported flow.

## Human feedback — final product simplification

The product owner reported:

> "nice prepare colour notes button copies it to my clipboard and sends me to notes, i have to find my gym notes scroll to the bottom and paste and it works."

They also requested the following final UI simplification:

1. Remove the old ordinary `Copy to Notes` action because the native coloured Notes
   action supersedes it for their normal use.
2. Remove the full `Export Image` preview flow (Compact/Faithful toggle + preview +
   delivery) because the product owner prefers the Compact snapshot and does not need
   a preview.
3. Keep one Compact image action, but change it from share/download behavior to a
   direct native **Save to Photos** action so the PNG appears in the iPhone Camera Roll.
4. The current image delivery is not accepted for the IPA because it exposes a Files
   save path rather than a direct Camera Roll save.

The requested final image UX is therefore one button such as **Save Colour Snapshot**:
Compact PNG -> native Photos save -> visible success/failure status. No preview and no
Faithful selection are required in the normal session UI.

## Device record

- iPhone: `iPhone 14 Pro Max`
- IPA build/run: `32986140862`
- Coloured Notes one-app result: **PASS**
- Image save-to-Camera-Roll result: **FAIL / NOT IMPLEMENTED — current delivery only offers Files-style save on device**
- Remaining consolidated core/persistence/offline checks: **PENDING unless separately recorded elsewhere**
