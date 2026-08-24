# M03-T01-FIX-01 Codex review

Date: 2026-08-24

## Decision

**ACCEPTED for automated correction scope; HUMAN_REVIEW_REQUIRED for the device retest.**

The reported iPhone failure was reproduced by code/environment analysis: the LAN HTTP origin is non-secure, so Async Clipboard is unavailable, and the previous handler delayed its first clipboard attempt behind awaited work. The correction adds a scoped synchronous plain-text fallback and preserves truthful rich/plain/failure reporting.

## Independent evidence

- `npm test -- --run --reporter=dot`: **140/140 passed**, 14 test files.
- `npm run build`: **PASS**, 50 modules transformed.
- `git diff --check`: **clean**.
- Runtime smoke after starting the corrected dev server: `http://localhost:5173/` and `http://192.168.1.49:5173/` returned HTTP 200 with title `Gym Log`.
- New tests cover no Async Clipboard API + legacy success, async denial + legacy success, all mechanisms failing, temporary selection cleanup, focus/selection restoration, and activation-preserving payload construction.

## Correction accepted

On capable secure browsers, rich ClipboardItem behavior remains intact. On the current HTTP LAN origin, the best available result is truthful plain text via a temporary textarea and synchronous `document.execCommand("copy")`; it never reports rich success. The visible payload captures current screen edits without awaiting IndexedDB before the first clipboard attempt.

## Exact remaining human gate

Repeat the affected test on the iPhone 14 Pro Max at `http://192.168.1.49:5173`:

- Expected on this HTTP build: `Copied as plain text (rich formatting unavailable)`.
- Paste once into Apple Notes and record date/legend/summary/table/notes order, all five columns plus the Category fallback column, weird values, summary override, and multiline notes.
- Do not expect HTML table structure or colors from HTTP; those require a secure HTTPS build and remain a separate open gate.
- If the status still says `Copy failed — clipboard unavailable`, record the iOS/Safari version and stop; do not mark the gate passed.

The original failure remains recorded in `HUMAN-VERIFICATION-M03-T01.md`; this is a retest, not retroactive evidence.
