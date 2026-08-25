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

Result: `FAIL — STRUCTURE/DATA SURVIVE; COLOURS STRIPPED`

## Physical retest — 2026-08-26

The product owner opened the corrected `/feasibility/native-copy.html` proof,
used **Copy proof session via native selection path**, and pasted the result
into the existing Apple Notes `Gym` note.

Observed result from the supplied iPhone screenshot:

- **PASS — real editable table structure survives.** The pasted content is a
  normal Notes table with the expected five workout columns.
- **PASS — proof fixture content survives.** The short `Sunday 23 Aug` fixture,
  its representative rows, summary, and bottom notes are present. The shorter
  session is intentional: this isolated fixture covers all five categories,
  unhighlighted rows, free-form/Unicode values, and summary overrides without
  copying the full live 40-row workout.
- **FAIL — category colours do not survive.** The pasted table is uniformly
  uncoloured in Apple Notes despite the source fixture containing Arms orange,
  Back purple, Chest mint, Delts blue, and Legs pink.
- No new mojibake or flattened-text failure is visible in the supplied result;
  the regression is specifically colour fidelity.

Therefore the distinct WebKit rendered-selection/native-copy route does not
recover Apple Notes category colours. This is a genuine target-iPhone colour
failure, not a serving/setup failure and not the normal production
`Copy to Notes` path.

Per the bounded investigation order, leave normal `Copy to Notes` unchanged
and advance to the **Notes clipboard fingerprint** branch. Do not spend another
round changing HTML/CSS on this selection-copy route.

Historical blocked attempt — 2026-08-26:

- The product owner opened the retired `/feasibility/selection-copy.html`
  route in Safari.
- Safari rendered the normal Gym Logger application UI instead of the
  experimental page, so the required proof button was absent.
- That attempt did not exercise Apple Notes and is not a colour PASS or FAIL.

Correction status:

- The retired proof was replaced by the complete
  `/feasibility/native-copy.html` proof.
- Fresh `dist` and the exact LAN response were independently checked for the
  experimental title/button and absence of the React shell.
- The service worker now bypasses `/feasibility/*` requests.
- The corrected proof was then physically exercised and failed only on colour
  fidelity as recorded above.

Desktop tests only establish that the proof requested the native browser copy
operation. They do not establish the Apple Notes result. The target-iPhone
result above closes M03-T04 as a colour failure; the next bounded branch is the
Notes clipboard fingerprint.
