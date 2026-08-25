# M03-T05 — Notes clipboard fingerprint

Status: `READY_FOR_HUMAN_REVIEW`
Owner: OX Alpha implementation builder; Codex is independent acceptance authority
Milestone: M03 bounded Apple Notes colour-recovery investigation
Base: current `main` after the M03-T04 target-iPhone result

## Context

M03-T04 physically proved that Safari's native rendered-selection copy can
produce a real editable Apple Notes table with the fixture data, but Notes
still strips all five category colours. Stop changing HTML/CSS and stop using
the production copy path as an experiment. The next question is what Apple
Notes itself places on the web-visible clipboard when it copies a small
coloured table.

## Scope

Build one isolated static HTTPS diagnostic under `public/feasibility/` named
`notes-clipboard-fingerprint.html` (and a small focused module if useful).
It must:

1. Clearly instruct the product owner to copy a small coloured table directly
   in Apple Notes, return to this page, and tap **Inspect Notes Clipboard**.
2. Use `navigator.clipboard.read()` only after that user gesture. Do not call
   any clipboard write API, intercept a copy event, alter clipboard contents,
   or call the production Copy to Notes implementation.
3. Preserve the browser-reported item order and each item's type order.
4. For every readable representation, record MIME/type identifier, item/type
   indexes, byte length, SHA-256 when Web Crypto supports it, and complete
   textual content. At minimum capture complete `text/html` and `text/plain`;
   include other `text/*` types exposed by the browser.
5. For non-text types, record type, byte length, and hash without pretending
   that the browser exposed their raw native payload. Be explicit when a hash
   or representation is unavailable.
6. Display the diagnostic JSON on the page and offer a download. Warn that
   clipboard contents may be sensitive. Handle permission denial, unsupported
   `navigator.clipboard.read`, and individual type-read failures honestly.

The page must remain obviously separate from the Gym Logger SPA. Do not add a
normal product button or change production Copy to Notes. Do not attempt to
decide whether colours survived; only report what the browser exposes.

## Required verification

Add focused automated coverage for deterministic fingerprint formatting,
item/type ordering, text capture, byte lengths, hashing, download output,
permission/API errors, and the absence of clipboard mutation/write calls.
Run the focused tests, full suite, production build, exact static-file check,
and trusted-HTTPS LAN response check. Inspect the diff and write a Codex
review/report. No target-iPhone colour result may be claimed from automation.

## Acceptance / next gate

Accept only if the diagnostic is isolated, read-only, downloadable, and
independently verified. Then provide one simple target-iPhone test: copy a
small coloured Notes table, open the exact HTTPS diagnostic URL, tap Inspect,
download the JSON, and return the JSON/evidence. If the browser-visible
payload contains no colour-bearing representation, advance E-004 native
inspection rather than trying more HTML variants.

## Codex checkpoint — 2026-08-26

The verified Desktop DSH wrapper was dispatched with the configured OX Alpha
worker. The fresh task produced no stdout, stderr, report, or repository delta
within the bounded approximately 85-second window and was classified as a
task-level worker timeout. Codex implemented the isolated fallback and
independently accepted it for the automated scope; this does not classify OX
or the provider as unavailable.
