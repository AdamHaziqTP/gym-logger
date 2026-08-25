# M06-T05 iPhone export delivery retest

Date: 2026-08-25
Device: iPhone 14 Pro Max
Status: `PARTIAL PASS — PREVIEW/DISMISSAL FIXED; SAVED IMAGE FAILS`

Physical result supplied by the product owner during the consolidated PWA acceptance pass:

- **PASS — Faithful preview:** the Faithful export preview now visibly renders the workout on the iPhone instead of showing the earlier blank/black preview.
- **PASS — Compact preview:** the Compact export preview now visibly renders the workout on the iPhone instead of showing the earlier blank/black preview.
- **PASS — mobile dismissal:** the Close control is easy to read and use.
- **FAIL — save-to-device image delivery:** after saving the export to the device, the resulting saved image is not the rendered workout. The product owner reports a black image / white-looking thumbnail rather than the actual export image.

This is target-device evidence. Do not mark PNG delivery accepted from the successful in-app previews. The remaining defect is now narrowed to the generated/saved image payload or save/share delivery path on iPhone rather than the preview surface itself.

Correction scope is already authorized by the existing final-iPhone correction disposition for Faithful/Compact image rendering and delivery. Route a bounded correction for iPhone save/share delivery while preserving the now-working preview and dismissal behavior. After independent automated verification, return only the saved-image delivery branch for physical retest; do not reopen the already-passed preview or Close behavior unless the correction touches them.
