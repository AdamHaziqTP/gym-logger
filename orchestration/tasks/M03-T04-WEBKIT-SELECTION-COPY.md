# M03-T04 — WebKit native selection-copy colour proof

Status: CODEX-FALLBACK-READY-FOR-TARGET-IPHONE-PROOF  
Base checkpoint: `9b1e33b`  
Scope: isolated feasibility proof only; do not change production `Copy to Notes`

## Product decision

Apple Notes colour recovery was explicitly reopened on 2026-08-26. The first
new hypothesis is that Safari/WebKit's native rendered-selection copy path may
produce richer native pasteboard representations than the production
`ClipboardItem` HTML/plain write. The prior HTML styling permutations and
Shortcuts HTML conversion routes are closed and must not be repeated.

## Required proof

Create a clearly experimental, local-only proof page or control under the
existing feasibility area. It must:

1. Use the canonical Gym Logger session/colours and the same complete content
   contract as the existing Notes payload: date, five-entry legend, summary,
   all rows in order, all free-form cell values, highlights, and notes.
2. Render that content as an actual DOM table in the document. It may be
   positioned outside the viewport for the proof, but it must not use
   `display:none`, `visibility:hidden`, or a detached fragment that WebKit will
   not treat as rendered content.
3. On one direct user button gesture, select the table/content with a DOM
   `Range`, preserve the user's previous focus/selection, and invoke the
   browser native selection-copy path with `document.execCommand("copy")`.
4. **Do not** add a `copy` event listener for this proof. Do not call
   `clipboardData.setData`, `navigator.clipboard.write`, `ClipboardItem`, or
   `writeText` in the native-selection proof. The experiment is specifically
   testing what WebKit creates itself.
5. Restore the previous focus and selection after the synchronous copy call.
   Keep the proof isolated from the production session screen and do not
   change global selection CSS or row-handle behavior.
6. Provide a clear experimental status that only says the browser copy command
   was requested/succeeded or failed. It must not claim Apple Notes structure
   or colour success.

## Automated verification

Add focused static/unit coverage where practical for:

- real DOM table creation and complete content/colour mapping;
- no `ClipboardItem`/async clipboard writer and no `copy` event interception in
  this proof;
- native selection/focus restoration and cleanup;
- the existing production Copy to Notes path remaining unchanged.

These tests cannot prove iPhone paste behaviour. Do not fabricate that result.

## Device handoff when ready

Use the trusted LAN build and the existing iPhone 14 Pro Max. Tap the isolated
native-selection proof once, open the existing `Gym` note, and paste. Record:

- editable table structure;
- exact Unicode including `·` and `°`;
- date, legend, summary, row order, values, and notes;
- all five category colours/highlights.

Do not retest or alter E-004/native helper yet. Do not replace normal Copy to
Notes. Return the result as `PASS`, `FAIL`, or `BLOCKED` with screenshots if
the result is not fully successful.

## Codex execution record

OX Alpha was dispatched through the verified Desktop DSH wrapper with the
headless profile and produced no usable output, report, or repository delta in
the bounded task window. This is recorded as a task-level worker timeout, not
as OX unavailability. Codex completed the isolated fallback and independently
verified it; no production Copy to Notes code was changed.

## Re-dispatched correction record

The first fallback proof was later audited and retired because its fixture date
could render as `undefined`. The single live proof is now
`/feasibility/native-copy.html`, implemented in
`nativeSelectionCopy.mjs`/`nativeCopyApp.js`, with the target checklist updated
to match. The service worker explicitly bypasses `/feasibility` requests, and
the fresh build plus exact LAN response have been independently checked for
the experimental title/button rather than the React shell.
