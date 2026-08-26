# E-004 Phase B — generated Gym Logger flat-RTFD proof

Status: `HUMAN_REVIEW_REQUIRED — UPDATED HELPER BUILD REQUIRED`
Device: iPhone 14 Pro Max
Purpose: determine whether a newly generated Gym Logger workout can paste into
Apple Notes as an editable, fully coloured table using only `com.apple.flat-rtfd`.

## Important boundary

This is not a replay of an Apple Notes capture. The helper action generates a
new payload from the bundled canonical Gym Logger
`latest-session.example.json` fixture. Do not use Inspect, Replay, or any
`Replay ONLY` action for this gate.

The production PWA and its ordinary `Copy to Notes` action remain unchanged.
Phase C Shortcut append is blocked until this generated payload passes.

## Test procedure

1. Install and open the new **Gym Logger Pasteboard Proof** helper build.
2. Tap **Copy Generated Gym Session (flat-RTFD only)**.
3. Open a temporary/test note in Apple Notes and paste once.
4. Confirm the result is a real editable Notes table, not plain text or an
   image.
5. Confirm the complete generated workout contains the expected date, 40-row
   order, summary `40 sets · 39 exercises`, values, and notes.
6. Confirm the five category colours are preserved:
   - Arms — orange;
   - Back — purple;
   - Chest — mint;
   - Delts — blue;
   - Legs — pink.
7. Confirm free-form values and Unicode remain exact, including `30°`, `8,6`,
   curly punctuation, and multiline notes, with no mojibake.

## Result to report

Report `PASS` only if the generated workout satisfies every item above:
editable table, all five colours, correct date/order/values/summary/notes, and
Unicode. Report `FAIL` with the first visible mismatch and a screenshot if
possible. Do not infer success from the helper status, clipboard type, desktop
build, or the earlier captured-payload result.

If Phase B passes, the next bounded task is Phase C: test whether passing this
generated flat-RTFD clipboard through the documented Shortcut append flow keeps
the same editable table and colours in the existing `Gym` note.
