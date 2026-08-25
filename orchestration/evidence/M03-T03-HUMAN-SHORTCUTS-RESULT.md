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

## Final low-friction clipboard variant

Because colour preservation is a high-value requirement, one final low-friction variant was physically tried before closing the web/Shortcuts branch:

1. receive from Share Sheet;
2. `Get Text from Shortcut Input`;
3. `Make Rich Text from HTML`;
4. `Copy to Clipboard` instead of `Append to Note`;
5. manually paste into the existing Apple Notes `Gym` note.

Result: **FAIL — no table and no category colours**. The clipboard variant therefore does not recover either the editable table structure or the five-colour navigation treatment.

This closes the practical PWA/HTML/Shortcuts colour-recovery surface. Do not iterate further Shortcut or HTML variants.

The existing standard **Copy to Notes** path remains the reliable baseline because it preserves the editable table/data/order, albeit without category colours.

## Final clipboard-variant result

The product owner also tested the remaining low-friction variant correctly:
`Make Rich Text from HTML` followed by `Copy to Clipboard`, then manual paste
into the existing Gym note. It produced **no editable table and no category
colours**. This closes the practical web/Shortcuts branch; no further Shortcut
or HTML variants are authorized. The failed `Share for Notes Colours` action
is removed from the normal v1 UI, while its helper and evidence remain
preserved for historical reference.

Next product decision: whether to authorize one bounded native attributed-string / pasteboard helper feasibility proof. Such a proof must not replace the PWA or require a paid Apple Developer subscription as a v1 dependency. It should test whether native pasteboard representations can preserve both an editable Notes table and the five category colours on the target iPhone. If the native helper cannot prove that behavior with low enough friction, close colour recovery and retain the uncoloured editable-table baseline.
E-004 native attributed-string/pasteboard feasibility is the only remaining authorized colour-recovery route. It is separately parked as `BLOCKED/DEFERRED — NEEDS MAC/XCODE`; no further Shortcuts or HTML variants are authorized until that native proof can be built and exercised on the target iPhone.
