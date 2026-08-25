# Codex review — M06-T05 saved-image delivery correction

Date: 2026-08-25
Decision: **ACCEPTED FOR AUTOMATED SCOPE; PHYSICAL RETEST REQUIRED**

## Acceptance criteria

- [x] Bounded saved-image PNG serialization correction only.
- [x] Preview and mobile dismissal behavior preserved by diff audit.
- [x] PNG output is non-empty, has `image/png` MIME, and begins with the PNG
      signature in focused automated coverage.
- [x] `toBlob` fallback remains covered when `toDataURL` is unavailable.
- [x] Full suite passes: 361/361.
- [x] Production build passes.
- [x] Diff hygiene passes.
- [x] HTTPS and LAN certificate endpoints respond from the workstation.
- [ ] Target iPhone saves/shares an image with the correct rendered pixels.

## Findings

The correction is narrow and reversible. It changes the browser-side canvas
encoding preference, not the deterministic SVG renderer or delivery filename
contract. The physical failure remains open because a desktop/browser test
cannot establish what iOS actually writes to Photos or Files.

## OX status

OX Alpha was dispatched through the verified Desktop DSH wrapper with the
published task packet but was silent for the bounded window. Codex used the
authorized fallback and independently verified the implementation.

## Handoff

Use `https://192.168.1.49:4173/` for one physical retest of the saved-image
branch only. Do not mark the device criterion passed until the saved result
visually matches the workout image.
