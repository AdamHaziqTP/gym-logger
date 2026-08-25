# Consolidated final iPhone 14 Pro Max acceptance

Status: `HUMAN_REVIEW_REQUIRED` — desktop automation is complete for the
current v1 scope; these checks are intentionally not marked passed here.

Record the iPhone model, iOS version, Safari version, test date, and screenshots
only for failures.

## Installability and offline

- Open the trusted HTTPS build in Safari and add Gym Logger to the Home Screen.
- Launch from the Home Screen and confirm the icon/name and standalone layout.
- While online, create or edit a session, close the app, then enable airplane mode.
- Cold-launch the installed app and confirm the shell, session, edits, and local
  settings remain usable without network access.

## M01 table and interaction checks

- Confirm the visible legend contains exactly `Arms`, `Back`, `Chest`, `Delts`,
  `Legs`; unhighlighted rows remain white without a visible Other/None entry.
- Tap the three-dot handle once to select the row, then tap again to open its
  full command menu without native Safari text-selection UI.
- Press/hold/drag the handle to reorder a row. Confirm Safari does not select
  the dots, show a magnifier/callout, or start browser drag behavior, and confirm
  the order persists after leaving and reopening the session.
- Confirm normal text editing and selection still work in Exercise, Sets, Reps,
  Weight, Skip, and Notes.
- Reconfirm horizontal/vertical table use, row commands, colour application,
  current-session resume, and persistence of irregular/free-form values after
  closing and reopening Safari.

## Home, settings, and exports

- Confirm Copy Another Session and History are separate, readable, non-overlapping
  actions on the Home screen.
- Test System, Dark, and Light theme choices and persistence after relaunch.
- Test Faithful and Compact PNG preview, save/share, long 40-row content, notes,
  colours, and Compact's Skip omission only when every Skip cell is empty.
- Export a local backup, make a change, restore through Files/share, and confirm
  the replacement summary, safety export, cancel path, and restored values.

## Apple Notes baseline

- From the trusted HTTPS build, use Copy to Notes and paste into Apple Notes.
- Confirm the result is an editable table with the correct date, legend, order,
  values, summary override, multiline notes, and free-form text.
- Do not treat missing category colours as a failure: Apple Notes stripping the
  five Gym Logger colours is the accepted v1 limitation.

Record each item as `PASS`, `FAIL`, or `BLOCKED`, with a short observation. A
failure should include a screenshot and the exact step that produced it.
