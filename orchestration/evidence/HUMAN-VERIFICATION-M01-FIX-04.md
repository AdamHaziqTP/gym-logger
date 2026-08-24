# M01 repeat human-verification gate — FIX-04

Automated FIX-04 verification passed. Repeat the physical-iPhone gate at the current LAN URL:

`http://192.168.1.49:5173`

Record the iPhone model, iOS version, Safari version, result, and screenshots for each item.

## Required checks

- [ ] **HV-01 — Load/seed:** Open the URL in Safari. Confirm Home loads and shows `40 sets · 39 exercises`. The offline-after-cache portion remains BLOCKED unless an installable/cached PWA path is available through this temporary HTTP setup.
- [ ] **HV-02 — Direct resume:** Start today's session once. Leave Safari, wait, and return to the URL. Confirm the session opens directly at the table without requiring `Continue Today's Session`. Tap `‹ Gym Log` and confirm deliberate navigation Home still works and shows Continue.
- [ ] **HV-03 — Persistence:** Edit exact values `TEST EXERCISE`, `test`, `8,6`, `body weight`, `skip`, and notes `Persistence test hello 123`. Dismiss the keyboard, kill Safari from the app switcher, reopen the URL, and confirm every value survives exactly.
- [ ] **HV-04 — Row menu commands:** In the table, tap a three-dot handle once and confirm selection only. Tap the selected handle again and confirm the menu exposes `Add Row Above`, `Add Row Below`, `Duplicate Row`, `Copy`, `Cut`, `Paste`, `Colour`, and `Delete Row`. Exercise each command on disposable rows and confirm the visible row/data result. Confirm Paste is disabled before Copy and enabled after Copy/Cut.
- [ ] **HV-05 — Touch reorder:** Select a row, drag its selected handle above/below other rows, release, leave/reopen, and confirm the order and all row values/highlights persist. Also try a stationary tap to ensure it opens the menu rather than reordering.
- [ ] **HV-06 — Legend and visual treatment:** Confirm the header order is date → category legend → summary → table. Check the approved labels/mapping and decide whether the sixth `Other`/white entry belongs in the visible header legend. Confirm highlights read as bright colored text with subtle dark/translucent per-cell treatment, not heavy full-row fills. Record any concrete mismatch against the supplied references.
- [ ] **HV-07 — Gym usability:** Edit right-edge cells with the keyboard open, swipe horizontally and vertically, and confirm inputs remain tappable, values do not disappear, scrolling is not janky, and the menu/colour controls are reachable.

Do not test or mark Apple Notes paste or PNG export; those remain deferred milestones. Return each item as PASS, FAIL, or BLOCKED with exact observations. M01 remains unaccepted and M02 remains blocked until this gate is resolved.
