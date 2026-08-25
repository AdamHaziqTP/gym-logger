# M06-T05 alternate raster correction report

Date: 2026-08-25
Status: CODEX-VERIFIED — READY FOR ONE SAVED-IMAGE RETEST

## Device failure being corrected

After `fa57dcb`, the target iPhone reported both a preview regression and the
same blank saved output. Faithful/Compact preview and mobile Close had passed
before that checkpoint and remain the physical baseline to preserve.

## Correction

The PNG path now uses `canvg@4.0.3`, an offline pure-JavaScript SVG parser and
renderer, to issue ordinary Canvas 2D drawing calls. It no longer asks iOS
WebKit to rasterize the SVG by loading it as an image and calling
`drawImage`. The preview remains a separate inline SVG image path, so PNG
preparation cannot blank the preview. The visible-pixel guard remains before
PNG encoding and File construction.

## Independent verification

- Focused export tests: **17/17 PASS**.
- Full suite: **362/362 PASS** across 31 test files.
- Production build: **PASS**; Canvg and its small MIT-licensed dependency set
  are bundled offline in the PWA.
- Runtime: HTTPS app, manifest, and LAN certificate endpoint all respond 200.
- `git diff --check`: **PASS**.
- Codex audit: Copy to Notes, Apple Notes decisions, and mobile Close logic
  are unchanged; preview state is set independently of raster completion.

## Remaining gate

The alternate renderer has not been physically proven on the iPhone. Return
one saved-image-only retest. Do not repeat preview or Close checks unless the
device shows a regression.
