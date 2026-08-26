# E-004 Phase B2 — generated Apple Notes-shaped flat-RTFD proof

Status: `PASS — GENERATED EDITABLE COLOURED TABLE PROVEN; CATEGORY LEGEND LABELS REMAIN UNCOLOURED`
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

## Human device result — 2026-08-26

The product owner installed the B2 helper, used **Copy Generated Gym Session
(flat-RTFD only)**, and pasted the newly generated workout into Apple Notes.

Reported physical result:

- editable table: **PASS**;
- generated workout/table content: **PASS — looks good**;
- row/category colouring across the workout table: **PASS — table text is
  coloured correctly**;
- all five category colours are visibly represented correctly in the workout
  table: **PASS**;
- `Arms Back Chest Delts Legs` category legend text above the table:
  **MINOR POLISH DEFECT — labels are not themselves coloured according to their
  categories**.

The product owner otherwise reported the generated result as working. No
additional defect was reported for order, summary, notes, or Unicode.

## Acceptance interpretation

The core B2 feasibility question is **PASS**: Gym Logger-originated data can now
be synthesized as a fresh Apple Notes-shaped `com.apple.flat-rtfd` payload and
paste as an editable table with the required category colouring. This satisfies
the colour-recovery feasibility requirement that blocked Phase C.

The uncoloured category legend is a bounded presentation defect, not a failure
of generated table colour fidelity. The v1 specification requires the legend to
be present and prioritizes category/highlight colour preservation, but does not
make coloured legend labels a separate blocker for the Notes handoff proof.
The legend should still be corrected before final productization so it matches
the established category mapping and the rest of the export.

## Disposition

Phase B2 is accepted for generated coloured-table feasibility. Phase C Shortcut
append may proceed using this generated payload path.

Before or alongside Phase C implementation, apply a narrow B2 polish correction
so the `Arms Back Chest Delts Legs` legend labels use their corresponding Apple
Notes colour controls:

- Arms — orange;
- Back — purple;
- Chest — mint;
- Delts — blue;
- Legs — pink.

Do not regress the already-proven editable table, table colours, generated
content, or native flat-RTFD path.
