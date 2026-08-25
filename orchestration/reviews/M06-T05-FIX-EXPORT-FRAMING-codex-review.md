# Codex review — M06-T05 PNG framing correction

Date: 2026-08-26  
Decision: **ACCEPTED FOR AUTOMATED SCOPE; PHYSICAL RETEST REQUIRED**

## Review criteria

- [x] Existing Canvg renderer retained.
- [x] Existing SVG preview and PNG delivery paths remain separate.
- [x] Exact delivery canvas is scaled before Canvg draws the logical SVG.
- [x] Faithful and Compact styles remain supported.
- [x] Visible-pixel guard remains before PNG serialization.
- [x] No server, native helper, or product-scope change introduced.
- [x] Focused framing tests: 15/15.
- [x] Actual-session migration integration tests: 12/12.
- [x] Full suite: 374/374 across 32 files.
- [x] Production build, HTTPS runtime, certificate endpoint, and diff audit pass.
- [ ] Target iPhone confirms both saved PNGs are visible and correctly framed.

## Finding

The correction is the smallest geometry fix supported by the latest device
evidence: Canvg was rendering correctly into the logical coordinate space, but
the 2x output canvas was not applying the matching transform. The physical
result is intentionally still open because a desktop canvas mock cannot prove
iOS Photos received the correctly framed bytes.

## Next gate

Use `https://192.168.1.49:4173/` and retest Faithful and Compact saved images
within the existing consolidated iPhone 14 Pro Max pass. Do not repeat preview
or dismissal checks unless they regress.
