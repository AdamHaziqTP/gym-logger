# Human verification — E-004 Phase C Shortcut append

Status: `HUMAN_REVIEW_REQUIRED — HOSTED HELPER BUILD READY`
Device: iPhone 14 Pro Max
Date opened: 2026-08-26

## Context

B2 generated Gym Logger data is physically proven at `d0544c5` as an editable
Apple Notes table with all five row/category colours. This gate tests only the
new Shortcut handoff and the legend polish. It must not be inferred from B2's
direct paste, desktop checks, captured-payload replay, or hosted compilation.

## One-time setup

In iOS Shortcuts, create a Shortcut named exactly `Gym Logger to Gym` with one
action only:

`Append Shortcut Input to Gym`

Do not add Get Text, Make Rich Text from HTML, HTML conversion, or any other
transformation. The existing `Gym` note is the target.

## Test procedure

1. Install and open the `GymLoggerPasteboardHelper-unsigned` artifact from
   [hosted macOS/Xcode run 32961489740](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32961489740).
2. Tap **Generate & Run Gym Logger to Gym Shortcut**.
3. Allow the Shortcut to run if iOS asks, then open the existing `Gym` note.
4. Confirm the appended result is a real editable Apple Notes table, not plain
   text or an image.
5. Confirm the legend labels are individually coloured: Arms orange, Back
   purple, Chest mint, Delts blue, Legs pink.
6. Confirm the table rows retain all five category colours, correct order and
   values, the `40 sets · 39 exercises` summary, notes, and Unicode such as
   `30°` and `·` without mojibake.

## Result to record

- Shortcut append: `PASS` / `FAIL` / `BLOCKED`
- Editable table: `PASS` / `FAIL`
- Legend colours: `PASS` / `FAIL`
- Row colours: `PASS` / `FAIL`
- Content/order/summary/notes/Unicode: `PASS` / `FAIL`
- Screenshot/observation for any failure:

Do not mark Phase C accepted until this target-device result is recorded.
