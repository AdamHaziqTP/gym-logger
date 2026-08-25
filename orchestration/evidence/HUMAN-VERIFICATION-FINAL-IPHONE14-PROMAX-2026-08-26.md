# Final iPhone 14 Pro Max follow-up — 2026-08-26

Device: iPhone 14 Pro Max
Evidence source: product-owner physical testing and supplied Faithful/Compact PNGs plus exported backup JSON.

## Passed / accepted on device

- **PASS — Compact PNG export:** saved image is visible, correctly framed, readable, coloured, and visually satisfactory. Product owner specifically prefers Compact and expects it to be the normal image-export choice.
- **PASS — Faithful PNG export:** saved image is visible and correctly framed after the Canvg/framing corrections. Product owner does not expect to use this mode often, but it no longer blocks acceptance.
- **PASS — actual Tuesday migration:** the Tuesday 25 Aug real 40-row session is present and looks correct on device.
- **PASS — offline use:** product owner reports offline behavior works correctly.
- **PASS — backup/import/export functional path:** product owner reports the backup/import/export workflow works. The supplied `GymLog-Backup-2026-08-26.json` includes both the Sunday seed session and the migrated Tuesday 25 Aug session, plus the one-time migration marker.
- **PASS — ordinary Copy to Notes functional baseline:** editable Notes transfer is functionally good. The known missing category colours remain the major visual limitation.

## Remaining issues / product feedback

- **FAIL/POLISH — Home Screen icon still displays as plain `G`.** The repository contains the deliberate replacement icon, but the installed iPhone icon has not visibly updated. Existing final-evidence guidance already notes that iOS can retain the installed Home Screen icon and that the old Home Screen app/bookmark should be removed before re-adding the refreshed build. Do not classify the replacement asset itself as failed until a fresh install/re-add is tested.
- **HIGH PRIORITY — Apple Notes colour transfer:** the product owner strongly dislikes losing the five category colours in Notes. True editable-table + colours remains blocked behind E-004 (`NEEDS MAC/XCODE`). The ordinary editable uncoloured path remains accepted functionally but is not visually satisfying.
- **ROW MENU POLISH — Cut is redundant with Delete for this personal workflow.** Product owner prefers removing Cut rather than keeping two destructive-looking row actions with effectively overlapping utility.
- **ROW MENU POLISH — Paste semantics differ from Notes.** Current Paste inserts the copied row below the selected row; Notes-like expectation is to replace the selected row contents. This mismatch is minor, but if corrected it should replace the selected row rather than insert a new row.
- **EXPORT PRODUCT PREFERENCE — Compact should be the default/primary export mode.** Faithful can remain available as a secondary option; no need to remove it.

## Recommended bounded final-polish batch

1. Make Compact the default/primary image export selection while retaining Faithful as secondary.
2. Remove the redundant Cut row-menu command.
3. If low-risk, change Paste to replace the selected row contents instead of inserting below it.
4. Resolve the Home Screen icon with a cache-busted icon asset/path and explicit fresh-install/re-add verification; do not rely on an already-installed iOS web-app icon updating in place.
5. Add an optional low-friction `Share Colour Snapshot` action using the already-working Compact PNG/share path. This is **not** a substitute for editable Copy to Notes and must be labelled as an image/snapshot. It is a practical colour-preserving stopgap that can be shared to Notes while E-004 remains blocked.
6. Keep E-004 parked for the only remaining authorized proof of true editable Apple Notes table + five category colours.

Do not reopen the failed Shortcuts rich-text/HTML routes.
