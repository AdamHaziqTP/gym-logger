# M03-T03 human Shortcuts result

Date: 2026-08-25
Device: iPhone 14 Pro Max
Status: `FAIL — SHORTCUTS_ROUTE`

The product owner completed the prescribed **Gym Logger Notes Colours** Shortcut and invoked it from the app's **Share for Notes Colours** action against a real workout session.

Observed result:

- The Shortcut appended into the existing Apple Notes `Gym` note.
- The workout arrived as flattened plain text rather than a real editable Apple Notes table.
- The five category colours did not survive.
- Unicode text was also decoded incorrectly: examples included `40 sets Â· 39 exercises` and `30Â°`.

This fails the M03-T03 success criteria. The bounded Shortcuts route is closed rather than iterated through more HTML/Shortcuts variants, per the recorded product decision.

The existing standard **Copy to Notes** path remains the reliable baseline because it preserves the editable table/data/order, albeit without category colours.

Next product decision: whether to authorize one bounded native attributed-string / pasteboard helper feasibility proof. Such a proof must not replace the PWA or require a paid Apple Developer subscription as a v1 dependency. It should test whether native pasteboard representations can preserve both an editable Notes table and the five category colours on the target iPhone. If the native helper cannot prove that behavior with low enough friction, close colour recovery and retain the uncoloured editable-table baseline.
