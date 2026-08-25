# Consolidated final iPhone 14 Pro Max acceptance

Status: `FAILURES_FOUND — CORRECTION_REQUIRED` — the first real-device pass exposed release-blocking iPhone issues. Remaining checks stay pending until the affected branches are corrected and the trusted HTTPS environment is actually trusted on-device.

Device: iPhone 14 Pro Max
Test date: 2026-08-25
Evidence source: product-owner observations and two screenshots supplied in the product conversation at approximately 18:03 Singapore time.

## Installability and offline

- **FAIL — trusted HTTPS environment:** the app URL still presents Safari's `Connection Not Private` / `Not Secure` state on the iPhone even after the supplied certificate/profile was installed. The product owner reports having to manually choose to visit the site each time. This means the final trusted-origin/installability/offline gate is not yet validly exercised and the certificate/trust setup must be corrected before retesting.
- **PARTIAL — Add to Home Screen works:** the app can be added to the Home Screen, but the installed icon is only a plain `G`. Treat the current icon as a polish defect; replace the placeholder-like identity with a deliberate Gym Logger app icon before final acceptance.
- **PENDING — standalone/offline cold-launch:** do not mark passed until the HTTPS trust issue is fixed and the installed app can be launched without a certificate warning/interstitial.

## M01 table and interaction checks

- PENDING — visible legend exactly `Arms`, `Back`, `Chest`, `Delts`, `Legs`; unhighlighted rows white without visible Other/None.
- PENDING — row-handle first tap selection, second tap full command menu, no native Safari selection UI.
- PENDING — press/hold/drag reorder without Safari magnifier/callout/browser drag, with persistence after reopen.
- PENDING — normal text editing/selection in Exercise, Sets, Reps, Weight, Skip, Notes.
- PENDING — horizontal/vertical table use, row commands, colour application, current-session resume, and irregular/free-form persistence.

## Home, settings, and exports

- PENDING — Copy Another Session and History separation/readability/non-overlap.
- PENDING — System, Dark, Light theme choices and persistence.
- **FAIL — Faithful PNG preview:** opening Export Image and selecting Faithful shows a large blank/black preview area instead of the session image.
- **FAIL — Compact PNG preview:** selecting Compact likewise shows a large blank/black preview area instead of the session image.
- **FAIL — export modal dismissal/escape UX:** on the iPhone the Export Image sheet is difficult to exit; the supplied screenshots show no obvious visible close/cancel/back control within the sheet. Correct the mobile dismissal path so the user is never trapped in the export surface.
- PENDING — save/share of generated PNG, long 40-row content, notes, colours, and Compact Skip omission rule; these cannot be accepted while both previews are blank.
- PENDING — backup export/change/restore through Files/share, replacement summary, safety export, cancel path, restored values/settings.

## Apple Notes baseline

- Existing accepted v1 limitation remains in force unless explicitly reopened by product decision: standard trusted-HTTPS Copy to Notes preserves an editable table/data/order but Apple Notes strips the five category colours.
- The plain text session content pasted into the product conversation on 2026-08-25 is not evidence about colour survival because plain text cannot carry the visual formatting. Do not infer a new Notes colour result from that transcript alone.
- PENDING — final Copy to Notes retest after the trusted HTTPS origin is actually trusted on-device; verify editable table, date, legend, order, values, summary override, multiline notes, and free-form text. Missing category colours are not currently a v1 failure under the recorded decision.

## Correction disposition

Route bounded autonomous corrections for:

1. Faithful/Compact iPhone image preview rendering and delivery.
2. Clear, reliable mobile dismissal/escape for the Export Image sheet.
3. The local trusted-HTTPS certificate/origin setup so Safari no longer shows `Connection Not Private` / `Not Secure` on the target iPhone after trust installation.
4. Replace the placeholder-like `G` Home Screen icon with a deliberate Gym Logger icon consistent with the existing minimal product identity.

After independent automated verification, return to this same consolidated checklist. Do not discard or restart the pending items, and do not mark any device behavior passed from desktop evidence.