# M03-T06 — Exact Apple Notes HTML replay proof

Status: `READY_FOR_HUMAN_REVIEW`
Owner: OX Alpha implementation builder; Codex is independent acceptance authority
Milestone: M03 bounded Apple Notes colour-recovery investigation
Base: current `main` after the supplied M03-T05 fingerprint result

## Context

The target-iPhone M03-T05 fingerprint proves that Apple Notes exposes two
browser-visible clipboard representations: `text/html` and `text/plain`. The
complete HTML payload is preserved in:

- `orchestration/evidence/fixtures/M03-T05-apple-notes-clipboard-fingerprint.json`
- `public/feasibility/notes-clipboard-fingerprint.json`

The HTML is 184,878 UTF-8 bytes and visibly contains the Apple Notes table,
Apple-specific classes, and the exact five category colour tokens. This is a
new experiment, not another generated HTML variant.

## Scope

Build one isolated static HTTPS proof under `public/feasibility/` named
`notes-html-replay.html`.

1. Load and validate the mirrored captured JSON fixture before enabling the
   replay button. Preserve the parsed `text/html` and `text/plain` strings
   byte-for-byte; pin the captured HTML SHA-256 and payload lengths in focused
   tests.
2. On one direct user tap, create a `ClipboardItem` with exactly two
   representations: the captured `text/html` Blob and the matching captured
   `text/plain` Blob. Call `navigator.clipboard.write([item])` immediately from
   that gesture. Do not sanitize, simplify, substitute colour tokens, parse
   and regenerate a DOM, or intercept a copy event.
3. Make the page clearly say that it is an experimental replay, not the
   production Gym Logger app. Show the loaded fixture hash/length and honest
   write success, permission failure, or unsupported-API status. Do not claim
   Apple Notes paste success in the page.
4. Keep production `Copy to Notes` completely unchanged. Do not expose this
   action in the normal app UI.

## Verification

Add focused tests for fixture identity, exact string preservation, the two
ClipboardItem MIME types/order, the write call, permission/API failure, and
strict isolation from production clipboard modules. Run focused tests, full
suite, production build, exact static-file check, and trusted HTTPS LAN body
check. Inspect the diff and write a Codex review/report.

## Human gate

After independent verification, provide exactly one target-iPhone test at the
replay URL:

1. Open the replay page.
2. Tap **Replay captured Notes HTML**.
3. Paste into the existing Apple Notes `Gym` note.
4. Report whether the result is an editable table and whether Arms, Back,
   Chest, Delts, and Legs retain their colours. Also report any Unicode or
   table-order regression.

If exact replay succeeds, the next bounded task is a diff/minimal-generator
experiment. If it fails despite byte-equivalent captured HTML, close the web
replay route and advance E-004 native inspection. Do not modify production
Copy to Notes before this result.

## Codex checkpoint — 2026-08-26

The verified Desktop DSH wrapper was dispatched with the configured OX Alpha
worker. The fresh task produced no stdout, stderr, report, or repository delta
within the bounded approximately 90-second window and was classified as a
task-level worker timeout. Codex implemented the isolated fallback and
independently accepted it for automated scope; this does not classify OX or
the provider as unavailable.
