# Codex review — M03-T03 Shortcuts colour-recovery feasibility

Review status: `ACCEPTED_FOR_AUTOMATED_SCOPE; HUMAN DEVICE GATE OPEN`

## Acceptance checklist

- [x] Normal `Copy to Notes` implementation and status wording remain intact.
- [x] Optional route reuses the existing self-contained Notes HTML payload.
- [x] File name and MIME are deterministic: `Gym-Logger-Notes.html`,
  `text/html`.
- [x] Feature detection hides the optional action when file sharing is not
  available.
- [x] Share success is reported only after `navigator.share` resolves.
- [x] User dismissal and other share failures remain distinct.
- [x] Focused tests pass: 41/41.
- [x] Full suite passes: 359/359.
- [x] Build, diff audit, and LAN HTTPS/static-asset smoke pass.
- [ ] iPhone Share Sheet → Shortcuts execution.
- [ ] Editable Apple Notes table and category colours.

## Findings

This is a credible low-friction route for one device proof: the PWA hands a
self-contained HTML file to a user-created Shortcut, rather than asking the
user to manage MIME or RTF data. The route is optional and reversible, and the
known-good uncoloured clipboard path is unaffected.

The result is not a product acceptance claim for Apple Notes. The target
device must still establish whether the Shortcut action chain consumes the
file as HTML/Rich Text, creates an editable table, preserves values/order, and
retains the five category colours. A failed device proof closes this bounded
branch; it does not regress or invalidate ordinary `Copy to Notes`.

## Open risk

The iPhone/Shortcuts/Notes interoperability boundary cannot be simulated
faithfully by the desktop test environment. The consolidated final iPhone
checklist remains the only authority for that result.
