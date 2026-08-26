# E-004 Phase B2 — generated Apple Notes-shaped flat-RTFD proof

Status: `HUMAN_REVIEW_REQUIRED — B2 HELPER BUILD READY`
Device: iPhone 14 Pro Max
Base result: Phase B colour failure recorded at `934ddd7`

## Purpose

Phase B proved that a newly generated Gym Logger flat-RTFD can paste as an
editable table with correct content, but generic RTF colour/highlight controls
did not preserve category colours. B2 is a materially different generated
payload: it retains Gym Logger fixture-originated content while shaping
`TXT.rtf` with the Apple Notes highlight controls observed in the successful
Notes-origin capture.

This is not a replay or byte patch of a captured Notes payload. The raw
captured `TXT.rtf` is not in the repository; the captured control words and
structural clues are reference evidence only.

## New helper build

Use the `GymLoggerPasteboardHelper-unsigned` artifact from [hosted macOS/Xcode
run 32959270742](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32959270742),
built from commit `249e216`. Codex independently verified the IPA contains the
helper app and bundled Gym Logger fixture. Do not use the older Phase B
artifact from run `32956758287`; it contains the generic RTF generator.

## Test procedure

1. Install and open the new **Gym Logger Pasteboard Proof** helper build.
2. Tap **Copy Generated Gym Session (flat-RTFD only)**.
3. Open a temporary/test note in Apple Notes and paste once.
4. Confirm the result is a real editable Notes table, not plain text or an
   image.
5. Confirm the generated workout has the expected date, all 40 rows in order,
   summary `40 sets · 39 exercises`, values, and notes.
6. Confirm category colours:
   - Arms — orange;
   - Back — purple;
   - Chest — mint;
   - Delts — blue;
   - Legs — pink.
7. Confirm exact free-form values and Unicode, including `30°`, `8,6`, curly
   punctuation, and multiline notes, with no mojibake.

## Result rule

Report `PASS` only if the generated workout satisfies every item: editable
table, all five colours, correct content/order/summary/notes, and Unicode.
Report `FAIL` with the first mismatch and a screenshot if possible. Do not
infer device success from source tokens, helper status, hosted compilation,
or the earlier captured-payload A2 result.

Phase C Shortcut append remains blocked until this generated B2 result passes.
