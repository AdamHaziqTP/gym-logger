# M03-T08 — Phase C native flat-RTFD Shortcut append proof

Status: `IMPLEMENTED — CODEX FALLBACK; HOSTED BUILD PENDING`

## Context

The target iPhone 14 Pro Max accepted the generated Gym Logger fixture in
Apple Notes as an editable, correctly coloured table in B2. The generated
payload uses only `com.apple.flat-rtfd` and Apple Notes-shaped RTF controls.
The B2 result is recorded in
`orchestration/evidence/HUMAN-VERIFICATION-E-004-PHASE-B2-APPLE-NOTES-SHAPED-FLAT-RTFD.md`
at product checkpoint `d0544c5`.

## Bounded objective

Prepare the isolated native helper for one Phase C physical proof:

1. Keep the existing generated flat-RTFD-only button and payload behavior.
2. Apply the narrow B2 polish so the five legend labels are individually
   coloured: Arms/orange, Back/purple, Chest/mint, Delts/blue, Legs/pink.
3. Add a separate, clearly labelled proof action that generates the same
   Gym Logger fixture payload, places only `com.apple.flat-rtfd` on the native
   clipboard, and opens the documented iOS Shortcut URL using clipboard input:
   `shortcuts://run-shortcut?name=Gym%20Logger%20to%20Gym&input=clipboard`
4. Preserve the clipboard payload exactly; do not coerce it through Get Text,
   Make Rich Text from HTML, HTML conversion, or any other flattening action.
5. Preserve the PWA and normal PWA Copy to Notes path unchanged. Do not build a
   native Gym Logger app and do not depend on the private Notes pasteboard type.

## Shortcut proof assumptions

The proof action may rely on a one-time user-created Shortcut named `Gym
Logger to Gym` whose only action is `Append Shortcut Input to Gym`. The helper
must make the setup requirement explicit in its proof UI/status and must fail
honestly if the OS cannot open the URL. Do not claim append success before the
target-device paste result.

## Verification required from the worker

- Inspect the existing native helper and preserve all existing inspector,
  replay, removal, sufficiency, and generated-payload proof actions.
- Add deterministic source-contract coverage for the five legend mappings and
  the exact Shortcut URL/clipboard-only handoff.
- Run the native helper verification script and report all results.
- Do not edit production `src/` or `public/` files.
- Return a concise report naming changed files and any limitation; do not mark
  the physical Shortcut append gate as passed.

## Acceptance boundary

Codex independently reviews the diff, runs the helper contract checks, full PWA
tests, build, and hygiene checks. The next human gate must verify on the iPhone:

- the five legend labels have their matching colours;
- the Shortcut is one-time configured with only `Append Shortcut Input to Gym`;
- triggering the proof action appends to the existing `Gym` note;
- the result remains an editable table with all five colours, order, values,
  summary, notes, and Unicode.
