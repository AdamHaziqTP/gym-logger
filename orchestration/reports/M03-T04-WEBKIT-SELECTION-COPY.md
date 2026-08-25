# M03-T04 — WebKit native selection-copy proof

Date: 2026-08-26  
Base: `9b1e33b`  
Status: **AUTOMATED SCOPE ACCEPTED — TARGET IPHONE PROOF REQUIRED**

## Why this proof is materially different

The production path writes a `ClipboardItem` with `text/html` and
`text/plain`. This experiment instead renders the canonical coloured table as
real DOM content and lets WebKit's synchronous selection-copy implementation
own the copy operation. It does not supply clipboard data and does not
intercept the copy event.

This is motivated by WebKit's documented/native implementation distinction:
the selection-copy path can write web archive/HTML/plain representations and
allow UIKit/UIFoundation to coerce richer text only when the destination asks
for it. This is a hypothesis to test on the target iPhone, not an acceptance
claim.

## OX invocation

- Wrapper: `C:\Users\adam4\AppData\Roaming\DSH Desktop\host-commands\desktop\bin\dsh.cmd`
- Profile: `headless`
- Provider/model: `openrouter` / `stealth/ox-alpha`
- Task: `orchestration/tasks/M03-T04-WEBKIT-SELECTION-COPY.md`
- Result: no usable stdout, stderr, report, or repository delta in the
  bounded approximately 90-second task window; process stopped.
- Classification: **task-level worker timeout**, not OX unavailability. The
  existing OX smoke evidence remains valid, and Codex fallback was used only
  after this concrete failure.

## Fallback proof

The isolated static proof is:

- `public/feasibility/selection-copy.html`
- `public/feasibility/selectionCopy.mjs`

It uses the canonical five categories, complete table values/order, summary,
notes, Unicode, and per-row foreground/background styles. The proof table is
positioned offscreen but remains a real rendered DOM subtree; it is not
detached, `display:none`, or `visibility:hidden`.

The copy function selects the rendered subtree with a DOM `Range`, calls only
`document.execCommand("copy")`, restores prior selection/focus, and reports
only the browser command result. It does not use the production async
clipboard writer, set clipboard data, or alter the production Copy to Notes
button.

## Independent verification

| Check | Result |
|---|---|
| Selection proof + existing feasibility focused tests | **PASS — 36/36** |
| Full PWA suite | **PASS — 377/377** across 33 files |
| Production build | **PASS — `tsc` + Vite; 19 precached assets** |
| Static preview page | **PASS — HTTPS preview returned 200 for HTML and both modules** |
| Production Copy to Notes diff audit | **PASS — unchanged by this proof** |

## Boundary

The browser command and desktop tests do not prove what Apple Notes will
paste. The exact next gate is one target-iPhone paste using the checklist at
`orchestration/evidence/HUMAN-VERIFICATION-M03-T04-WEBKIT-SELECTION-COPY.md`.
If that fails or colours are still stripped, proceed to the clipboard
fingerprint branch; do not modify the production path based on this desktop
result.
