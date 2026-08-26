# M03-T05 — Notes clipboard fingerprint human verification

Status: `PASS — FINGERPRINT CAPTURED; EXACT REPLAY NEXT`
Device target: iPhone 14 Pro Max
Diagnostic URL:
`https://192.168.1.49:4173/feasibility/notes-clipboard-fingerprint.html`

## Purpose

M03-T04 proved that Safari's native rendered-selection copy still produces an
editable Apple Notes table but loses all five category colours. This isolated
diagnostic now records what the browser can see when **Apple Notes itself**
copies a coloured table. It does not change the clipboard and does not alter
Gym Logger's production Copy to Notes path.

## Exact device steps

1. In Apple Notes, copy a small table containing visible Arms, Back, Chest,
   Delts, and Legs colours. Do not copy a password or other sensitive text.
2. Open Safari on the iPhone and visit the diagnostic URL above.
3. Confirm the page title says **Notes clipboard fingerprint**, not Gym Log.
4. Tap **Inspect Notes Clipboard** once.
5. Wait for the JSON to appear, then tap **Download fingerprint JSON**.
6. Return the downloaded JSON here, or report if Safari denied the read or the
   link could not be downloaded.

## What this gate can establish

The report may reveal browser-visible `text/html`, `text/plain`, other text
types, and non-text type sizes/hashes in browser order. It cannot by itself
prove that a native Apple Notes/private pasteboard representation is
reproducible. No colour success or failure should be inferred until the JSON
is inspected.

## Supplied target-iPhone result — 2026-08-26

The product owner supplied the downloaded JSON at
`orchestration/evidence/fixtures/M03-T05-apple-notes-clipboard-fingerprint.json`.
The fixture SHA-256 is
`1e1c880d6446e442df944a0bfa9c54dedd932613d61371f1b43e0cfdc9d9d300`.

Observed:

- Clipboard read status: `ok`; one item in browser order.
- Browser-visible types: `text/html`, then `text/plain`.
- HTML payload: 184,878 UTF-8 bytes, with complete text captured.
- The HTML contains real table markup, Apple Notes classes/attributes, and
  explicit foreground plus translucent background tokens for Arms, Back,
  Chest, Delts, and Legs.

This resolves the M03-T05 fingerprint gate. It does **not** yet prove that
Safari can write the Notes-origin HTML back with colour fidelity. The next
isolated gate is M03-T06 exact replay.
