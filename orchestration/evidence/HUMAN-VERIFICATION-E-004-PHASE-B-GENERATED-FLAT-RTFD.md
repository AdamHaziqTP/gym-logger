# E-004 Phase B — generated Gym Logger flat-RTFD proof

Status: `FAIL — GENERATED FLAT-RTFD PASTES WITHOUT CATEGORY COLOURS`
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

## Generated helper build

The Phase B helper was compiled and packaged by hosted macOS/Xcode workflow
run [32956758287](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32956758287).
The `GymLoggerPasteboardHelper-unsigned` IPA contains the helper app,
`Info.plist`, and the bundled `latest-session.example.json` fixture. This proves
compilation and packaging only; the generated Apple Notes result remains a
device gate.

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

## Human device result — 2026-08-26

The product owner installed the Phase B helper, used **Copy Generated Gym
Session (flat-RTFD only)**, and pasted the generated workout into Apple Notes.

- Category colours: **FAIL — no colour**.

This is the first visible acceptance mismatch and is sufficient to fail Phase
B. No additional claims are made here about table editability, 40-row order,
values, summary, notes, or Unicode because the product owner did not report
those details in this result.

The result is materially different from Phase A2: an exact Apple Notes-captured
`com.apple.flat-rtfd` representation pasted alone with full table and colour
fidelity, while the newly generated Foundation/FileWrapper flat-RTFD payload
does not preserve category colours. Therefore the type identifier and an RTFD
package containing `TXT.rtf` are not, by themselves, sufficient to reproduce
Apple Notes colour fidelity.

## Disposition

Phase B is **FAIL** and Phase C Shortcut append remains blocked. Do not change
the production PWA `Copy to Notes` path based on this result.

The next bounded investigation should compare the successful captured
`com.apple.flat-rtfd` payload with the generated flat-RTFD payload at the
container and `TXT.rtf` levels, focusing on structural/attributed-text metadata
rather than merely matching colour values or the pasteboard type identifier.
Any follow-up generated-payload attempt must remain isolated until another
target-iPhone paste proves editable table structure and all five colours.
