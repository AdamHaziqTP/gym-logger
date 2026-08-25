# M03-T05 — Notes clipboard fingerprint human verification

Status: `RETEST READY — TARGET IPHONE REQUIRED`
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
