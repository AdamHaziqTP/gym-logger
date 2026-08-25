# Human verification — M03-T04 WebKit native selection-copy proof

Device: iPhone 14 Pro Max  
Proof URL: `https://192.168.1.49:4173/feasibility/selection-copy.html`

This is one isolated experiment. Do not use Gym Logger's normal `Copy to
Notes` button for this result, and do not run the old Shortcut conversion.

## Steps

1. Open the proof URL on the iPhone.
2. Tap **Copy rendered Gym table using Safari** once.
3. If the page says the browser copy command completed, open the existing
   Apple Notes note named **Gym**.
4. Paste once at the end of the note.
5. Report whether all of the following survived:
   - real editable table;
   - correct date, five-entry legend, summary, row order, values, and notes;
   - exact Unicode including `·` and `°`;
   - Arms orange, Back purple, Chest mint, Delts blue, and Legs pink.

Result: `PASS` / `FAIL` / `BLOCKED`  
Observed result: ____________________________________________

Desktop tests only establish that the proof requested the native browser copy
operation. They do not establish the Apple Notes result. If this fails or
colours are absent, leave the normal Copy to Notes path unchanged; the next
bounded branch is the Notes clipboard fingerprint.
