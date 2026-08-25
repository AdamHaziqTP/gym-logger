# M06-T05 transparent PNG correction report

Date: 2026-08-25
Status: CODEX-VERIFIED — READY FOR ONE SAVED-IMAGE RETEST

## New physical evidence

The target iPhone files produced after `0cb9b46` had correct dimensions but
were fully transparent:

- Faithful: 1520 × 4842, every RGBA pixel zero.
- Compact: 1520 × 2456, every RGBA pixel zero.

Faithful/Compact previews and mobile dismissal remain PASS.

## Root cause and correction

The rasterizer obtained a 2D context from a temporary capability-probe canvas,
then drew the SVG into that probe while serializing a separate blank delivery
canvas. The corrected code obtains the context from the delivery canvas after
its dimensions are set, so draw and PNG serialization target the same bitmap.

The failed `Share for Notes Colours` action was removed from the normal session
UI. Its domain helper, evidence, and E-004 native-helper source remain
preserved. Normal `Copy to Notes` is unchanged.

## Worker execution

The bounded task was published and dispatched to OX Alpha through the verified
DSH Desktop wrapper. OX produced no usable output during the 90-second window.
Codex completed the narrow correction under the established infrastructure
silence fallback.

## Independent verification

- Focused export/UI tests: **24/24 PASS**.
- Full automated suite: **361/361 PASS** across 31 test files.
- Production build: **PASS**.
- `git diff --check`: **PASS**.
- HTTPS app: **HTTP 200** at `https://192.168.1.49:4173/`.
- Manifest: **HTTP 200**.
- Certificate endpoint: **HTTP 200**, 793-byte X.509 response.
- Regression coverage proves the draw context is created exactly once for the
  serialized delivery canvas and that the failed Shortcut action is absent.

## Remaining gate

Desktop tests cannot prove the iPhone's saved pixels. Return only the saved
image branch for one physical retest. Do not repeat previews or dismissal
unless a regression appears.
