# E-004 Phase A — native representation-removal variants

Status: `HUMAN_REVIEW_REQUIRED — UPDATED HELPER BUILD READY`
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

## Test procedure

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

## Result to report

For each displayed type identifier, report `PASS` only when the pasted result
keeps the editable table and all five colours with correct content/Unicode.
If removing one representation loses colour or table fidelity, identify that
type. If every removal loses colour, the colour-bearing set is the complete
captured set. If replay is not possible, report `BLOCKED` with the visible
helper error and do not infer a result.

The Phase B generated Gym Logger payload and Phase C Shortcut append remain
blocked until this result identifies a viable minimum representation or closes
the native colour branch with evidence.
