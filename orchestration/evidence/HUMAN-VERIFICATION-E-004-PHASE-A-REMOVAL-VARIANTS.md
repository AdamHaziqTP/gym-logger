# E-004 Phase A — native representation-removal variants

Status: `PASS — EVERY SINGLE-REPRESENTATION REMOVAL PRESERVES FULL FIDELITY; NO UNIQUE NECESSARY TYPE IDENTIFIED`
Device: iPhone 14 Pro Max
Purpose: identify whether one captured native pasteboard representation is
necessary for Apple Notes to preserve an editable coloured table.

## Updated helper build

The Phase A helper source was rebuilt successfully by the hosted macOS/Xcode
workflow on `main`:

- Run: [32946246114](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32946246114)
- Artifact: `GymLoggerPasteboardHelper-unsigned`
- Verification: the IPA contains `Payload/GymLoggerPasteboardHelper.app`,
  `Info.plist`, and the bundled `latest-session.example.json` fixture.

The hosted build proves compilation and packaging only. It does not prove
iPhone installation or Apple Notes behavior.

## Important boundary

This test uses a fresh capture made from Apple Notes on the device. It does not
claim that Gym Logger can yet generate the colour-bearing representation. Do
not change the production PWA `Copy to Notes` path while this proof is open.

## Human device result — 2026-08-26

The product owner installed the fresh Phase A helper, captured a coloured Apple
Notes table, and exercised every displayed `Replay without <type>` variant.
Every variant preserved the editable table, all five category colours, and the
content/Unicode fidelity expected from the full native replay.

Recorded results:

- Replay without `com.apple.notes.richtext`: **PASS — all working**.
- Replay without `com.apple.flat-rtfd`: **PASS — all working**.
- Replay without `public.html`: **PASS — all working**.
- Replay without `com.apple.webarchive`: **PASS — all working**.
- Replay without `public.utf8-plain-text`: **PASS — all working**.
- Replay without `public.rtf`: **PASS — all working**.

No single non-empty representation is therefore individually necessary when
all of the other captured representations remain present.

This result does **not** identify the minimum sufficient representation or set.
The remaining representations are redundant enough that removing any one of
them still leaves Apple Notes with a fidelity-preserving alternative. The next
bounded experiment should test **single-representation-only** replay (or an
equivalent grouped-elimination search) to identify which representations are
individually sufficient before generated Gym Logger payload work begins.

## Original test procedure

1. Install and open the newly rebuilt **Gym Logger Pasteboard Proof** helper.
2. In Apple Notes, copy a small editable table containing Arms, Back, Chest,
   Delts, and Legs. Include one uncoloured row and values such as `30°`, `8,6`,
   curly punctuation, and a multiline note.
3. Return to the helper and tap **Inspect Notes Clipboard**. Do not copy or
   paste anything else before inspecting.
4. Note the displayed `Replay without <type>` buttons. Each button is one
   separate test; the helper omits zero-byte/unreadable representations.
5. For each displayed button, tap it once, open the temporary/test Gym note,
   and paste once. Record the result before running the next button.
6. For every variant, record separately:
   - editable table structure;
   - all five category colours;
   - date, row order, values, summary, and notes;
   - Unicode such as `30°` and `8,6`, with no mojibake.
7. If convenient, use **Replay Captured Clipboard** once at the end to confirm
   the complete captured replay still behaves as before. This is a control,
   not a replacement for the removal variants.

## Disposition

Phase A removal testing is complete and shows representation redundancy. Phase
B generated Gym Logger payload and Phase C Shortcut append remain blocked until
a minimum sufficient native representation or representation set is identified
by the next bounded sufficiency test.

## Phase A2 next gate — single-representation sufficiency

The updated helper now provides one `Replay ONLY <type>` button for each unique
readable, non-empty type from the fresh capture. Run each displayed button using
the same temporary/test Gym note and record the result separately. Prioritize
these identifiers when present:

- `public.rtf`
- `com.apple.flat-rtfd`
- `public.html`
- `com.apple.webarchive`
- `com.apple.notes.richtext`
- `public.utf8-plain-text` as a negative control

Each single-type result must be judged on editable table structure, all five
colours, values/order/notes, and Unicode. The helper must not be treated as
successful merely because it placed bytes on the clipboard. Do not begin a
generated Gym Logger payload or Shortcut append until at least one single type
or minimal sufficient set passes this complete-fidelity check.

## Phase A2 helper build — ready for device testing

The single-representation helper update was rebuilt successfully on hosted
macOS/Xcode:

- Run: [32952585740](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32952585740)
- Artifact: `GymLoggerPasteboardHelper-unsigned`
- Codex verification: IPA contains `Payload/GymLoggerPasteboardHelper.app`,
  `Info.plist`, and `latest-session.example.json`.

This build result proves compilation and packaging only. It does not claim the
single-type replay works in Apple Notes.
