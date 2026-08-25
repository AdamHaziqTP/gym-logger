# M06-T05 pixel-trace correction report

Date: 2026-08-25
Status: CODEX-VERIFIED — READY FOR ONE SAVED-IMAGE RETEST

## Device failure being corrected

After `bfa2fba`, the target iPhone still produced a Compact 1520×2456 RGBA
PNG with zero RGB and alpha channels for every pixel. Faithful/Compact previews
and mobile Close remain PASS.

## Correction

The rasterizer now:

1. waits for the SVG image to load and decode where WebKit exposes `decode()`;
2. draws into the delivery canvas;
3. reads that exact canvas with `getImageData` and requires a pixel with both
   non-zero alpha and visible colour;
4. encodes only after that assertion passes; and
5. retries one Blob-backed SVG source if the primary encoded data URL leaves
   the canvas empty.

If both sources remain empty, it returns no Blob, so iOS cannot receive a
known-blank file.

## Worker and independent verification

OX Alpha was dispatched through the configured DSH Desktop wrapper and was
silent for the bounded 90-second window. Codex used the authorized fallback.

- Focused PNG tests: **15/15 PASS**.
- Full suite: **362/362 PASS** across 31 test files.
- Production build: **PASS**.
- Runtime: HTTPS app, manifest, and LAN certificate endpoint all respond 200.
- `git diff --check`: **PASS**.
- Regression coverage proves blank pixels prevent PNG encoding and that the
  exact serialized canvas is the one being inspected.

## Remaining gate

Desktop checks cannot prove the final Photos payload. Return only one
saved-image physical retest. Do not repeat preview or dismissal checks.
