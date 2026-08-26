# M03-T07-B2 — Generated Apple Notes-shaped flat-RTFD proof

Status: `IMPLEMENTED — CODEX FALLBACK; DEVICE PROOF PENDING`
Date: 2026-08-26

## Role

You are the bounded OX Alpha implementation worker for Gym Logger. Work only
inside this repository and do not redefine product requirements, change the
production PWA, or claim target-iPhone success.

## Context

The previous Phase B proof generated a fresh workout from
`orchestration/feasibility/E-004-native/GymLoggerPasteboardHelper/latest-session.example.json`,
wrapped a generated `TXT.rtf` in a Foundation flat-RTFD container, and placed
only `com.apple.flat-rtfd` on the pasteboard. On the target iPhone, that
generated table and content pasted correctly but all five Apple Notes category
colours were stripped. The successful Apple Notes-captured flat-RTFD uses
Apple-shaped RTF semantics rather than generic `\\highlightN` /
`\\chcbpatN` controls.

The product owner supplied these observed Apple Notes highlight controls:

- Arms/orange: `\\cf3 \\AppleHighlight-1 \\AppleHilightClrSch-3`
- Delts/blue: `\\cf4 \\AppleHighlight-1 \\AppleHilightClrSch-5`
- Chest/mint: `\\cf5 \\AppleHighlight-1 \\AppleHilightClrSch-4`
- Purple/back: `\\cf6 \\AppleHighlight-1 \\AppleHilightClrSch-1`
- Pink/legs: `\\cf7 \\AppleHighlight-1 \\AppleHilightClrSch-2`
- reset: `\\AppleHighlight0 \\AppleHilightClrSch0`

The captured RTF is not present as a raw repository fixture. Do not invent a
replay or patch captured bytes. Use the supplied control words and known
Apple-shaped structural clues only as a reference while generating a new
payload from the Gym Logger fixture.

## Bounded implementation

Update only the isolated native helper proof as needed:

1. Preserve the canonical fixture-originated values, row ordering, summary,
   notes, and Unicode. Do not copy values or bytes from a Notes capture.
2. Replace the generic colour/highlight controls in generated `TXT.rtf` with
   Apple Notes-shaped colour/highlight runs. Include a Cocoa/Apple RTF header,
   an explicit expanded colour table, and the minimum table/font metadata
   needed for Notes to parse the result as an editable table.
3. Keep `com.apple.flat-rtfd` as the only representation in the B2 proof
   action. Do not add `com.apple.notes.richtext`, replay mode, Shortcut append,
   or production PWA clipboard changes.
4. Keep ordinary inspection/replay/sufficiency diagnostics intact.
5. Add or update deterministic source-contract tests for every five Apple
   highlight scheme values, the reset controls, Cocoa header/expanded colour
   table, fixture-originated generation, flat-RTFD packaging, and Unicode.
6. Write a concise worker report at
   `orchestration/reports/M03-T07-B2-APPLE-NOTES-SHAPED-FLAT-RTFD.md` with
   changed files, commands/results, limitations, and an explicit statement
   that physical Notes colour fidelity remains unproven.

## Acceptance criteria

- New payload is generated from the bundled Gym Logger fixture and is not a
  captured-payload replay.
- Generated RTF contains the five exact Apple highlight scheme controls and
  reset controls, with Apple/Cocoa structural metadata.
- The proof action writes one `com.apple.flat-rtfd` item only.
- Native focused checks pass; the PWA suite/build/diff hygiene pass.
- Production `src/` and `public/` remain unchanged.
- No physical-device PASS is claimed. Codex must independently review the
  diff and rerun verification before opening one B2 iPhone paste gate.

## Out of scope

No Phase C Shortcut append, no native full-app rewrite, no private
`com.apple.notes.richtext` synthesis, no HTML/CSS experiments, no changes to
the production `Copy to Notes` path, and no changes to unrelated user edits.
