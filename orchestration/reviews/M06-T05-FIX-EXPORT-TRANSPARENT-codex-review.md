# Codex review — M06-T05 transparent PNG correction

Date: 2026-08-25
Decision: **ACCEPTED FOR AUTOMATED SCOPE; PHYSICAL RETEST REQUIRED**

## Criteria

- [x] Root cause identified: draw and encode used different canvas elements.
- [x] Draw and serialization now use the same delivery canvas.
- [x] Focused regression test fails if a separate probe canvas is introduced.
- [x] Failed `Share for Notes Colours` action hidden from normal v1 UI.
- [x] Normal editable-table `Copy to Notes` path unchanged.
- [x] Historical Shortcut helper/evidence and E-004 source preserved.
- [x] Full suite 361/361.
- [x] Build, runtime smoke, and diff audit pass.
- [ ] Target iPhone saved PNG visibly matches the workout image.

## Review finding

The prior `toDataURL` preference did not address the actual empty bitmap: the
source canvas was never the draw target. This correction directly addresses the
device evidence and is intentionally narrow. The physical criterion remains
open until the new saved file is inspected on the iPhone.

## Handoff

Use `https://192.168.1.49:4173/` and save one Faithful or Compact image. Inspect
that saved image only; preview and dismissal are already accepted for this
correction cycle.
