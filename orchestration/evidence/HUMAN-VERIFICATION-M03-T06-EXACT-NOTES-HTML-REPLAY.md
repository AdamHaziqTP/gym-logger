# M03-T06 — Exact Apple Notes HTML replay human verification

Status: `RETEST READY — TARGET IPHONE REQUIRED`
Device target: iPhone 14 Pro Max
Replay URL:
`https://192.168.1.49:4173/feasibility/notes-html-replay.html`

## Purpose

M03-T05 showed that Apple Notes' browser-visible HTML contains the five
category colours. This proof writes that exact captured HTML and matching
plain text to the clipboard without sanitizing, simplifying, regenerating, or
substituting anything. It is not the normal Gym Logger copy action.

## Exact device steps

1. Open the replay URL in Safari on the iPhone.
2. Wait until it says the captured payload is loaded and ready.
3. Tap **Replay captured Notes HTML** once.
4. Return to the existing Apple Notes `Gym` note and paste once.
5. Report these results together:
   - editable table structure: PASS/FAIL;
   - Arms orange, Back purple, Chest mint, Delts blue, Legs pink: PASS/FAIL;
   - date, legend, row order, values, summary, notes, and Unicode: PASS/FAIL;
   - any Safari permission/error message.

Do not use the normal Gym Logger Copy to Notes action for this test. Do not
retest the prior fingerprint page.
