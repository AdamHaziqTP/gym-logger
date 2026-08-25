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

Result: `BLOCKED`

Observed result — 2026-08-26 target-iPhone attempt:

- The product owner opened the exact proof URL above in Safari.
- Instead of the isolated proof page, Safari rendered the normal Gym Logger application UI (Home/session screens), so the required **Copy rendered Gym table using Safari** control was not present.
- The normal app UI did show the existing **Copy to Notes**, **Share Colour Snapshot**, and **Export Image** controls, confirming the request reached the Gym Logger origin but not the intended feasibility document.
- Therefore M03-T04 has **not** yet been physically exercised and must not be classified PASS or FAIL for colour preservation.

Repository inspection confirms `public/feasibility/selection-copy.html` itself does contain the required proof button. The current blocker is the served/runtime route: the target iPhone is receiving the SPA/app shell rather than that static feasibility document. Codex must verify the exact response body/title/content for `/feasibility/selection-copy.html` from the currently running LAN preview, not merely HTTP 200, and correct stale `dist`, preview process, SPA fallback, or service-worker interference as applicable before asking for another human paste.

Desktop tests only establish that the proof requested the native browser copy
operation. They do not establish the Apple Notes result. If this fails or
colours are absent after the proof page is genuinely served, leave the normal
Copy to Notes path unchanged; the next bounded branch is the Notes clipboard fingerprint.
