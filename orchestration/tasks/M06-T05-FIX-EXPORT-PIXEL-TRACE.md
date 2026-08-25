# M06-T05 correction — prove visible pixels before iPhone save

## Role

You are OX Alpha, bounded implementation worker. Correct only the target
iPhone saved-image path. Codex independently verifies the result.

## Device evidence

After checkpoints `0cb9b46` and `bfa2fba`, the target iPhone still produced a
1520×2456 RGBA PNG whose RGB and alpha channels are zero for every pixel.
Faithful/Compact previews and mobile dismissal remain PASS and must not be
retested or redesigned.

## Required trace and correction

Trace the complete path:

`SVG preview → image decode → canvas draw → canvas pixel population → PNG
bytes → Blob/File → Web Share/save handoff`.

Add a device-relevant precondition immediately before PNG encoding/File
creation that reads the exact delivery canvas pixels and proves at least one
pixel has non-zero alpha (and visible colour). If the canvas is blank, do not
create or share a blank file; try one narrow iPhone-compatible alternate SVG
decode/transport (for example, decoded image readiness or a Blob-backed SVG
source), then fail truthfully with a useful status if no visible pixels can be
proved.

Keep the normal preview SVG and Close/dismissal behavior unchanged. Preserve
the existing filename/MIME contract. Do not claim a resolved share promise is
proof that Photos stored the correct pixels.

## Acceptance

- Focused tests prove the exact canvas used for encoding contains non-zero
  alpha before a Blob/File is produced and cover the blank-canvas refusal or
  fallback path.
- Focused/full tests, `npm run build`, runtime smoke, and `git diff --check`
  pass.
- Codex audits the actual diff and returns one saved-image-only iPhone retest.

## Boundaries

No Apple Notes colour work, Shortcut variants, native rewrite, server/cloud
dependency, or unrelated product changes.
