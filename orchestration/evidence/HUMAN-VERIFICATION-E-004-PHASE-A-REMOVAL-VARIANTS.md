# E-004 Phase A — native representation-removal variants

Status: `PASS — PHASE A2 IDENTIFIES TWO INDIVIDUALLY SUFFICIENT COLOUR-PRESERVING TYPES`
Device: iPhone 14 Pro Max
Purpose: identify whether one captured native pasteboard representation is
necessary or individually sufficient for Apple Notes to preserve an editable
coloured table.

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

These tests use fresh captures made from Apple Notes on the device. They prove
fidelity of captured native representations, not yet that Gym Logger can
synthesize an equivalent colour-bearing representation from generated workout
data. Do not treat generated Gym Logger colour export as passed until a
separate generated-payload device test succeeds.

## Human device result — Phase A removal variants — 2026-08-26

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

## Phase A2 gate — single-representation sufficiency

The updated helper provides one `Replay ONLY <type>` button for each unique
readable, non-empty type from the fresh capture. Each single-type result is
judged on editable table structure, all five colours, values/order/notes, and
Unicode.

## Phase A2 helper build

The single-representation helper update was rebuilt successfully on hosted
macOS/Xcode:

- Run: [32952585740](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32952585740)
- Artifact: `GymLoggerPasteboardHelper-unsigned`
- Codex verification: IPA contains `Payload/GymLoggerPasteboardHelper.app`,
  `Info.plist`, and `latest-session.example.json`.

This build result proves compilation and packaging only.

## Human device result — Phase A2 complete — 2026-08-26

The product owner physically tested every displayed `Replay ONLY <type>`
variant on the target iPhone.

Recorded results:

- ONLY `com.apple.notes.richtext`: **PASS — editable table and colours are perfect**.
- ONLY `com.apple.flat-rtfd`: **PASS — editable table and colours are perfect**.
- ONLY `public.html`: **PARTIAL — table survives; colour does not survive**.
- ONLY `com.apple.webarchive`: **PARTIAL — table survives; colour does not survive**.
- ONLY `public.rtf`: **PARTIAL — table survives; colour does not survive**.
- ONLY `public.utf8-plain-text`: **FAIL — no table; no colour**.

The full-fidelity result therefore has two individually sufficient captured
representations:

1. `com.apple.notes.richtext`
2. `com.apple.flat-rtfd`

The private Notes representation is **not required for Phase B to proceed**,
because captured `com.apple.flat-rtfd` alone independently preserves the
editable table and all five category colours on the target iPhone.

## Disposition

Phase A/A2 native representation discovery is complete.

Phase B may now begin with a bounded generated-payload proof targeting
`com.apple.flat-rtfd` as the preferred first candidate, because it preserves
full fidelity by itself without relying on the Notes-private
`com.apple.notes.richtext` type. The implementation must generate the payload
from Gym Logger workout data rather than replaying captured Notes bytes.

Acceptance for Phase B remains physical target-iPhone paste into Apple Notes:
editable table, all five category colours, correct values/order/notes, and
Unicode fidelity. Production PWA `Copy to Notes` must remain unchanged until
that generated-payload proof passes.

Phase C Shortcut append remains blocked until Phase B generated payload passes.
