# Codex review — M06-T05 pixel-trace correction

Date: 2026-08-25
Decision: **ACCEPTED FOR AUTOMATED SCOPE; PHYSICAL RETEST REQUIRED**

## Criteria

- [x] Device evidence for the failed `bfa2fba` saved output is recorded.
- [x] Image decode readiness is awaited where available.
- [x] Exact delivery-canvas pixels are checked before PNG encoding.
- [x] Blank canvas refuses Blob/File creation and Web Share handoff.
- [x] One narrow Blob-backed SVG decode fallback is attempted.
- [x] Focused tests: 15/15.
- [x] Full suite: 362/362.
- [x] Build, runtime, and diff audit pass.
- [ ] Target iPhone Photos contains visible workout pixels.

## Review finding

This correction adds a real device-relevant guard at the boundary that the
prior two corrections did not verify. A resolved share promise still does not
count as proof of the final Photos payload.

## Handoff

Use `https://192.168.1.49:4173/` and save one image. Inspect the saved image
only. If the canvas guard disables saving, report that exact status instead of
retrying preview or Close checks.
