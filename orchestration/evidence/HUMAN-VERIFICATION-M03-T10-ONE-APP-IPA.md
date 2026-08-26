# Human verification — M03-T10 one-app Gym Logger IPA

Status: `HUMAN_REVIEW_REQUIRED — CORRECTED HOSTED IPA READY`

Hosted artifact: `GymLogger-unsigned.ipa` from corrected workflow run
[`32986140862`](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32986140862).

This artifact includes the Codex correction that waits for native
clipboard/Notes completion and reports a manual-open fallback truthfully.
Do not install the older `32982786740` artifact for this gate.

This is the single consolidated device gate for the one-app productization.
Do not infer any item from desktop tests, source review, or IPA metadata.

## Installation and independence

- [ ] Install the fresh unsigned `GymLogger-unsigned.ipa` in the existing
  LiveContainer/SideStore-style workflow.
- [ ] Launch the Gym Logger IPA itself; no separate helper app is required.
- [ ] Confirm it opens and remains usable with the PC/LAN server unavailable.
- [ ] Confirm the app icon is the deliberate Gym Logger icon, not the old G.

## Data and core app

- [ ] Home opens with Tuesday 25 Aug (`actual-2026-08-25`) as Last Workout/
  clone source when no later legitimate session exists.
- [ ] Start/continue a session, edit a representative value and note, kill the
  IPA, relaunch it, and confirm the edits persist.
- [ ] Confirm session history, row editing/reorder/menu actions, highlights,
  summary override, image export, backup/import/export, settings/theme, and
  offline launch remain usable.

## Coloured Notes handoff

- [ ] From the visible Tuesday session, tap `Copy Coloured Notes & Open Notes`.
- [ ] Confirm Notes opens or the app gives a truthful manual-open fallback.
- [ ] Paste once into the canonical `Gym` note.
- [ ] Confirm the result is an editable table with the correct date, row order,
  values, summary, notes, Unicode, and all five row colours.
- [ ] Confirm the legend reads `Arms Back Chest Delts Legs` with each label
  individually coloured orange, purple, mint, blue, and pink.
- [ ] Confirm no separate PWA URL, LAN server, helper app, or Shortcut was
  needed for the normal flow.

## Device record

- iPhone: `iPhone 14 Pro Max`
- iOS/Safari: ____________________
- IPA build/run: ____________________
- Result/observations: ____________________
