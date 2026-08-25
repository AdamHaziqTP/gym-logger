# M06-T05 saved-image delivery correction report

Date: 2026-08-25
Status: CODEX-VERIFIED — READY FOR ONE PHYSICAL SAVED-IMAGE RETEST

## Scope

The target iPhone reported that Faithful and Compact previews and the mobile
close path were working, but the saved/shared PNG looked black or white rather
than matching the rendered workout image. This correction was limited to PNG
serialization and delivery. Preview rendering, the export sheet, and the
mobile close control were not changed.

## Worker execution

The task was published through the product-sync bridge and dispatched through
the configured DSH Desktop headless wrapper to OX Alpha. OX produced no usable
output during the bounded 90-second worker window. Per the established
infrastructure-silence policy, Codex completed the same bounded correction
from the authoritative task file; this is recorded as worker silence, not as a
worker acceptance.

## Correction

`src/domain/pngExport.ts` now prefers `canvas.toDataURL("image/png")` when
serializing the SVG-backed canvas and converts that data URL into an
`image/png` Blob. The existing `toBlob` path remains as a fallback when
synchronous serialization is unavailable, and invalid fallback MIME results
are rejected rather than presented as a valid PNG.

## Independent verification

- Focused PNG/delivery tests: **14/14 PASS**.
- Full automated suite: **361/361 PASS** across 31 test files.
- Production build: **PASS**.
- `git diff --check`: **PASS**.
- HTTPS runtime shell: **HTTP 200** at `https://192.168.1.49:4173/`.
- Manifest: **HTTP 200**.
- LAN certificate endpoint: **HTTP 200**, `application/x-x509-ca-cert`, 793 bytes.
- New rasterization coverage confirms non-empty PNG bytes with the PNG
  signature and verifies the `toBlob` fallback separately.
- Codex audit: preview and dismissal code paths are unchanged; no unrelated
  product scope was modified.

## Remaining gate

Desktop evidence cannot prove that iPhone Photos/Files or the share sheet
stores the correct pixels. Return to the existing consolidated iPhone pass
for **one saved-image-only retest**. Faithful preview, Compact preview, and
mobile dismissal do not need to be repeated unless the device exposes a new
regression.
