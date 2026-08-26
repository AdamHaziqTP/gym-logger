# M03-T07-B — Generated Gym Logger flat-RTFD payload

Status: `HUMAN_REVIEW_REQUIRED — GENERATED HELPER BUILD READY`
Owner: OX Alpha builder, Codex acceptance
Scope: isolated E-004 native helper proof; no PWA/native rewrite

## Context

Phase A2 physically proved that captured `com.apple.flat-rtfd` alone preserves
an editable Apple Notes table, all five category colours, correct content/order,
and Unicode on the iPhone 14 Pro Max. Phase B must now generate a new payload
from Gym Logger data rather than replaying captured Notes bytes.

## Bounded implementation

`NativePayloadBuilder.loadFixture()` loads the canonical 40-row
`latest-session.example.json` fixture. It generates the coloured RTF table,
packages its generated `TXT.rtf` in a Foundation `FileWrapper` RTFD container,
and serializes that package. ContentView exposes
`Copy Generated Gym Session (flat-RTFD only)`, which places only
`com.apple.flat-rtfd` on the pasteboard.

The helper retains the diagnostic capture/replay/sufficiency actions. No
captured Notes payload is read or transformed by the generated action.

## Acceptance

- hosted macOS/Xcode compile and package pass;
- target iPhone paste is a real editable Notes table;
- Arms orange, Back purple, Chest mint, Delts blue, and Legs pink survive;
- date, all 40 rows/order, free-form values, summary, notes, and Unicode survive;
- production PWA and ordinary `Copy to Notes` are unchanged;
- Codex independently verifies helper contracts, full PWA tests, build, and
  diff hygiene;
- Phase C Shortcut append remains blocked until this physical result passes.
