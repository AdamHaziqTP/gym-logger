# M03-T02-IMAGE-EXPORT-02-CORRECTION — repair export verification and contracts

## Role

This is a bounded correction after Codex independent verification of
`M03-T02-IMAGE-EXPORT-01`. Do not broaden the PNG feature or change the
accepted Apple Notes limitation.

## Codex findings

The focused export suite currently reports **10 passed / 6 failed**, and
`npm run build` fails with TypeScript errors in `src/tests/imageExport.test.ts`:

- Tests require a complete long row string to occur contiguously in the SVG,
  but the renderer intentionally wraps long/multiline values into multiple
  `<text>` elements. Verify order and losslessness by decoding/collecting text
  nodes or joining the row's emitted fragments; do not disable wrapping or
  truncate values.
- The compact column-width test hard-codes Faithful's 24px margin while
  inspecting Compact's 12px margin. Assert against the selected document's
  actual table width.
- Hostile-value tests must assert XML escaping/no raw injection and decoded
  lossless content across wrapped fragments, not contiguous unwrapped markup.
- The wrapping primitive test expects `hijl`, which is not the correct
  four-character hard-break of `defghijkl`; make the expected behavior
  consistent with the documented lossless greedy wrapper, preferably asserting
  `lines.join(...)` preserves the source where spaces are accounted for.
- Fix all test typing/import/unused-variable errors (`WorkoutSession` import,
  inferred row types, unused values, Highlight indexing) so `tsc` passes.

## Required acceptance

- Keep production export behavior bounded and lossless. Do not weaken XML
  escaping, row order, colour mapping, summary override, multiline notes, or
  Compact Skip-column rules merely to satisfy a test.
- Focused export suite passes.
- `npm test -- --run --reporter=dot` passes.
- `npm run build` passes.
- `git diff --check` passes.
- Produce `orchestration/reports/M03-T02-IMAGE-EXPORT-02-CORRECTION.md` with
  the exact results and any remaining human-only limitations. Do not claim
  physical PNG readability or iOS share/save acceptance.
