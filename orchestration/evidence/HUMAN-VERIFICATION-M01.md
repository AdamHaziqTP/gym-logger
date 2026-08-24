# M01 human verification gate

Automated M01 verification is complete. Do not mark these items passed from desktop evidence alone. Record each result, device/browser/iOS version, date, and any screenshot or screen recording in the evidence folder.

## Prerequisite

Use a reachable build of the current automated checkpoint on the physical iPhone. A desktop-only `127.0.0.1` server is not sufficient. Install/add the PWA to the Home Screen if the current deployment path supports it.

## Required M01 gate

- [ ] **HV-01 — First launch and seed:** On the iPhone, open the installed/reachable app with network unavailable after the shell has been cached. Confirm the Home screen loads, the seeded latest session shows `40 sets · 39 exercises`, and no error overlay appears.
- [ ] **HV-02 — Start/Continue and clone:** Tap `Start Today's Session`. Confirm exactly one current session appears. Close/reopen the app and confirm it offers `Continue Today's Session` rather than creating a duplicate.
- [ ] **HV-03 — Persistence through real lifecycle:** Edit an Exercise, Sets, Reps, Weight, Skip, and the notes area. Blur/close the keyboard, background or terminate the app, then reopen it. Confirm every edited string and the note text survive exactly, including values such as `8,6` and `body weight`.
- [ ] **HV-04 — Touch/table behavior:** At the target phone width, confirm the five-column table remains usable, horizontal movement does not corrupt values, the keyboard does not hide the active edit, and row-color selection is visibly clear and touchable.
- [ ] **HV-05 — Visual comparison:** Compare Home and Session views against the supplied reference images. Check the near-black restrained presentation, subtle grid, colored row text/highlights, spacing, readable controls, and 40-row scrolling. Record concrete mismatches; do not silently reinterpret them as product changes.

## Not an M01 pass criterion

Rich Apple Notes paste and faithful/compact PNG/session export are not implemented or accepted in M01. They remain M03/M05 gates and must be tested on the target iPhone only after their implementation tasks are authorized. Do not mark them passed based on this checklist.

## Reporting back

Return `HV-01` through `HV-05` as PASS, FAIL, or BLOCKED, with the exact step and evidence for each. A failure should include a screenshot and the observed-versus-expected behavior; a product ambiguity should be recorded as an escalation rather than patched ad hoc.
