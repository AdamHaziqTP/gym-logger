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

A later screenshot of the Shortcut confirms the product owner did **not** misconfigure the handoff. The Shortcut is wired as intended for the bounded experiment:

1. receive from Share Sheet;
2. `Get Text from Shortcut Input`;
3. `Make Rich Text from HTML`;
4. `Append Rich Text from HTML to Gym`.

The corresponding Apple Notes screenshot still shows flattened text and mojibake. Therefore this is a route/platform failure, not a setup error by the product owner.

This fails the M03-T03 success criteria. The bounded Shortcuts route is closed rather than iterated through more HTML/Shortcuts variants, per the recorded product decision.

The existing standard **Copy to Notes** path remains the reliable baseline because it preserves the editable table/data/order, albeit without category colours.

E-004 native attributed-string/pasteboard feasibility is the only remaining authorized colour-recovery route. It is separately parked as `BLOCKED/DEFERRED — NEEDS MAC/XCODE`; no further Shortcuts or HTML variants are authorized.
