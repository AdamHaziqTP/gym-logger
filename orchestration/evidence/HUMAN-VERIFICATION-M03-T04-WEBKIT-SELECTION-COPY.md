# Human verification — M03-T04 WebKit native selection-copy proof

Device: iPhone 14 Pro Max  
Proof URL: `https://192.168.1.49:4173/feasibility/native-copy.html`

This is one isolated experiment. Do not use Gym Logger's normal `Copy to
Notes` button for this result, and do not run the old Shortcut conversion.

> Supersession note (2026-08-26): the earlier fallback proof at
> `/feasibility/selection-copy.html` was retired by this re-dispatched OX
> round because it rendered the fixture's missing `displayDate` field as the
> literal text `undefined` in the copied date line, violating the required
> content contract. This checklist now points at the complete, tested proof
> page only — there is deliberately one proof artifact to tap.

## Steps

1. Open the proof URL on the iPhone.
2. Tap **Copy proof session via native selection path** once.
3. If the status says the browser copy command SUCCEEDED, open the existing
   Apple Notes note named **Gym**.
4. Paste once at the end of the note.
5. Report whether all of the following survived:
   - real editable table;
   - correct date (`Sunday 23 Aug`), five-entry legend, summary
     (`~41 sets · 7+ exercises`), row order, every value, and notes;
   - exact Unicode including `·` and `°`;
   - Arms orange, Back purple, Chest mint, Delts blue, and Legs pink;
   - unhighlighted rows staying plain.

Result: `PASS` / `FAIL` / `BLOCKED`  
Observed result: ____________________________________________

Desktop tests only establish that the proof requested the native browser copy
operation. They do not establish the Apple Notes result. If this fails or
colours are absent, leave the normal Copy to Notes path unchanged; the next
bounded branch is the Notes clipboard fingerprint.
