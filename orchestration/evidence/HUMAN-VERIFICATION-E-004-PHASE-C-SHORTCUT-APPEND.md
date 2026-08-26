# Human verification — E-004 Phase C Shortcut append

Status: `FAIL — SHORTCUT APPENDS TO CORRECT NOTE BUT STRIPS COLOUR; LEGEND SPACING ALSO REGRESSES`
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

## Human device result — 2026-08-26

The product owner configured the intended one-action Shortcut and ran the Phase
C helper handoff. The Shortcut appended the generated workout to the correct
existing `Gym` note.

Physical observations reported and shown in the supplied screenshot:

- Shortcut routing/append to the existing `Gym` note: **PASS**.
- Apple Notes table structure: **PRESENT**; the appended workout visibly appears
  as a table. The product owner did not separately report an editability test,
  so editability is not independently claimed here.
- Legend spacing: **FAIL** — the legend renders as
  `ArmsBackChestDeltsLegs` with no spaces between labels.
- Legend colours: **FAIL** — the labels are not coloured.
- Workout row/category colours: **FAIL** — the Shortcut-appended table is
  uncoloured.
- Content/order/summary/notes/Unicode: not fully re-verified in this report; no
  claim beyond the visible appended structure and the product owner's stated
  colour/legend defects.

The screenshot demonstrates that the Shortcut did reach the intended note and
preserved a table-shaped result, but it did not preserve the colour fidelity of
the already-proven B2 direct native paste.

## Disposition

Phase C automatic Shortcut append is **FAIL** for the required coloured Notes
handoff. Do not productize `Append Shortcut Input to Gym` as the coloured export
path.

The relevant contrast is now physically established:

- generated Apple Notes-shaped native flat-RTFD → manual Apple Notes paste:
  **PASS for editable coloured workout table** (B2);
- the same generated handoff routed through Shortcut `Append Shortcut Input to
  Gym`: **FAIL for colours**.

Close the automatic Shortcut-append branch unless a materially different,
low-friction native Notes mechanism is identified. Do not reopen the already
failed Get Text / HTML-conversion Shortcut routes.

The practical product fallback is to preserve the generated native flat-RTFD
clipboard and require one manual Paste into the existing `Gym` note. The helper
may automate navigation/opening as far as iOS reliably allows, but the actual
paste should remain manual unless another physically verified route preserves
full fidelity.

Before productizing that fallback, fix the new legend-spacing regression and
verify the latest helper's direct manual paste still preserves the five row
colours and individually coloured, spaced legend labels.
