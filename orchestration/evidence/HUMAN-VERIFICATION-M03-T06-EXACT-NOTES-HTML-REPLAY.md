# M03-T06 — Exact Apple Notes HTML replay human verification

Status: `FAIL — EXACT NOTES HTML REPLAY PRESERVES TABLE BUT STRIPS COLOURS`
Device target: iPhone 14 Pro Max
Replay URL:
`https://192.168.1.49:4173/feasibility/notes-html-replay.html`

## Purpose

M03-T05 showed that Apple Notes' browser-visible HTML contains the five
category colours. This proof writes that exact captured HTML and matching
plain text to the clipboard without sanitizing, simplifying, regenerating, or
substituting anything. It is not the normal Gym Logger copy action.

## Physical result — 2026-08-26

The product owner completed the target-iPhone replay and pasted once into the
existing Apple Notes `Gym` note.

- **PASS — table/content structure survives.** The product owner reported that
  the table "looks good", and the supplied screenshot shows the expected
  Notes table, date, legend, summary, headers, row order, and workout values.
- **FAIL — all category colours are stripped.** The pasted result is uniformly
  uncoloured despite replaying the exact `text/html` captured from Apple Notes,
  whose browser-visible source contained all five foreground/background colour
  styles.
- No Safari clipboard permission/error was reported for this run.
- No separate data/Unicode defect was reported in this run. The decisive
  failure is colour fidelity.

## Interpretation

M03-T06 closes the remaining browser-HTML hypothesis. Apple Notes exposes
colour-bearing `text/html` to Safari on read, but Safari writing that exact
captured HTML back through the web Clipboard API does not reproduce the colour
fidelity when pasted into Notes. Therefore further HTML/CSS/token/markup
iteration is not justified under the current evidence.

Production Gym Logger `Copy to Notes` remains unchanged.

The next bounded colour-recovery branch is the staged E-004 native pasteboard
inspection/replay proof: inspect the actual native Notes pasteboard
representations, replay them unchanged, and identify the minimum
representation responsible for editable-table colour fidelity before
attempting a Gym Logger native payload generator.
