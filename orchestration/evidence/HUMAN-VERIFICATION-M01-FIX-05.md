# M01 final physical-iPhone gate — FIX-05

The final narrow correction is independently green. The LAN build is available at:

`http://192.168.1.49:5173`

Record the iPhone model, iOS/Safari version, result, and screenshots.

- [ ] **HV-01 — Five-entry legend:** Open a session and confirm the header shows exactly `Arms`, `Back`, `Chest`, `Delts`, `Legs`, in that order. Confirm there is no visible `Other` or `None` legend item. Confirm unhighlighted/abs rows remain white and valid.
- [ ] **HV-02 — Handle tap/menu:** Tap a three-dot handle once: the row selects and no native text-selection handles/callout appear. Tap the selected handle again: the row menu opens with the full command set.
- [ ] **HV-03 — Handle hold/drag:** Press and hold the three-dot handle, then drag the row. Confirm Safari does not select the dots/text, show a magnifier/selection handles, invoke a callout, or start an HTML5 browser drag. Confirm the row reorders and remains in the new position after leaving/reopening.
- [ ] **HV-04 — Editable text remains normal:** Select/edit text inside Exercise, Sets, Reps, Weight, Skip, and Notes. Confirm normal keyboard/editing and text-selection behavior remains available; the handle-only hardening must not affect these fields.
- [ ] **HV-05 — Existing M01 behavior:** Reconfirm direct current-session resume, exact weird-value persistence after killing/reopening Safari, row-menu commands, colour application, horizontal/vertical table use, and the restrained per-cell highlight treatment.

Do not test Apple Notes paste or PNG export; those remain deferred milestones. Return each item as PASS, FAIL, or BLOCKED. M01 is not accepted and M02 remains blocked until this final gate passes.
