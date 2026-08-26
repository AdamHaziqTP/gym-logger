# M03-T11 — final one-app IPA iPhone 14 Pro Max gate

Status: `HUMAN_REVIEW_REQUIRED — HOSTED IPA PENDING`

This checklist must be completed on the physical iPhone 14 Pro Max. Desktop
tests, source inspection, and hosted packaging do not close these items.

## Install and independence

- [ ] Install the fresh `GymLogger-unsigned.ipa` in the existing permitted
      LiveContainer/SideStore workflow.
- [ ] Launch Gym Logger without Safari, a LAN server, a separate helper app,
      or a Shortcut.
- [ ] Confirm the installed app uses the deliberate Gym Logger icon.

## Session and persistence

- [ ] Confirm Tuesday 25 Aug (`actual-2026-08-25`) is the real Last Workout /
      clone baseline when no later legitimate session exists.
- [ ] Open/edit a session, including a free-form value and Notes entry; kill
      and relaunch the IPA; confirm the edits persist.
- [ ] Confirm row editing, reordering, row commands, category colours,
      summary override, history, settings/theme, and offline launch remain
      usable.
- [ ] Confirm backup/export/import still works on-device.

## Final session actions

- [ ] Confirm ordinary `Copy to Notes` is absent.
- [ ] Confirm the old `Export Image`, preview, Compact/Faithful selector, and
      `Share Colour Snapshot` UI are absent.
- [ ] Tap `Save Colour Snapshot` once. Confirm the truthful saving status,
      Photos permission behavior, and that the resulting Compact PNG appears
      directly in Photos with visible content, correct geometry, and colours.
- [ ] Tap `Copy Coloured Notes & Open Notes`. In the existing `Gym` note, paste
      once. Confirm a real editable table, correct order/content/summary/notes,
      Unicode, spaced legend labels, and all five legend/row colours:
      Arms orange, Back purple, Chest mint, Delts blue, Legs pink.

## Result record

- Device: iPhone 14 Pro Max
- iOS/Safari or LiveContainer version: ____________________
- IPA/workflow run: ____________________
- Result: `PENDING`
- Failures/screenshots/notes: _____________________________________________

If any item fails, record the exact symptom and stop that branch; do not infer
success for the other device-only items.
