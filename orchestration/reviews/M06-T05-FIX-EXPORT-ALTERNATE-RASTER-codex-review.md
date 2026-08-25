# Codex review — M06-T05 alternate raster correction

Date: 2026-08-25
Decision: **ACCEPTED FOR AUTOMATED SCOPE; PHYSICAL RETEST REQUIRED**

## Criteria

- [x] Previous preview regression and transparent saved output recorded.
- [x] Preview remains independent from PNG generation.
- [x] SVG-image `drawImage` bridge removed from the delivery raster path.
- [x] Offline pure-JavaScript SVG renderer added and bounded to PNG delivery.
- [x] Exact canvas visible-pixel guard retained before encoding/File creation.
- [x] Faithful and Compact deterministic SVG source remains unchanged.
- [x] Focused tests: 17/17.
- [x] Full suite: 362/362.
- [x] Build, runtime, and diff audit pass.
- [ ] Target iPhone preview and saved Photos PNG pass.

## Review finding

This is a material technique change after repeated target-device failures, not
another timing or canvas-identity tweak. It remains reversible and offline-
first, with no backend, native helper, or Apple Notes scope change.

## Handoff

Use `https://192.168.1.49:4173/` and save one Faithful or Compact image. Inspect
the saved image only; do not repeat preview or Close unless they regress.
