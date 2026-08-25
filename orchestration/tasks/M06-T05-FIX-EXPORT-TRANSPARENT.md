# M06-T05 correction — transparent iPhone PNG delivery and failed Shortcut UI

## Role

You are OX Alpha, bounded implementation worker. Correct only the two
physically evidenced v1 defects below. Codex independently verifies all work.

## Evidence

- `orchestration/evidence/M06-T05-EXPORT-DELIVERY-RETEST.md` now records that
  the post-`0cb9b46` Faithful and Compact saved PNGs have correct dimensions but
  every RGBA pixel is zero: fully transparent.
- `orchestration/evidence/M03-T03-HUMAN-SHORTCUTS-RESULT.md` records that the
  Share for Notes Colours route produced flattened text, no table, no colours,
  and mojibake. The product owner configured it correctly; this is a route
  failure, not user error.

## Required correction

1. Fix the rasterization lifecycle so the SVG is drawn into the exact canvas
   whose PNG bytes are serialized. Do not draw into a temporary capability
   probe and then encode a different blank canvas. Preserve the visible SVG
   Faithful/Compact previews, close/dismissal behavior, output dimensions,
   filename, and MIME contract.
2. Add focused automated coverage that would fail if draw and serialization
   use different canvas elements. Where the browser test environment permits,
   verify the encoded PNG is non-empty and represents visible pixels; do not
   accept only a successful share promise, MIME, dimensions, or PNG signature.
3. Remove or hide the failed `Share for Notes Colours` action from the normal
   v1 session UI. Preserve the domain helper, historical evidence, and E-004
   native-helper feasibility source; do not delete or redesign them. Keep the
   ordinary `Copy to Notes` editable-table/data/order baseline unchanged.

## Boundaries

- No Apple Notes colour redesign, Shortcut variants, native rewrite, or paid
  Apple Developer dependency.
- Do not change the already-passed preview or mobile close paths except as
  required to keep them working.
- Use the narrowest reversible implementation.

## Acceptance

- Focused export and session UI tests pass, including absence of the failed
  Shortcut action and the real-canvas draw/encode relationship.
- Full test suite, `npm run build`, runtime smoke, and `git diff --check` pass.
- Codex audits the diff and returns only the saved-image branch for one more
  physical retest. Do not ask for preview or dismissal retesting unless they
  regress.
