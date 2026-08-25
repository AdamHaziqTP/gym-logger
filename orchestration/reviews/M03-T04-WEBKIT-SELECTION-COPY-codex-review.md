# Codex review — M03-T04 WebKit native selection-copy proof

Decision: **ACCEPTED for isolated automated scope; pending target-iPhone paste**

The proof is correctly isolated from production. It creates a real rendered
DOM table from the canonical fixture, selects it with a `Range`, invokes only
the browser's native synchronous copy command, and restores focus/selection.
There is no async clipboard writer, clipboard-data injection, copy-event
interception, native helper change, Shortcut route, or production UI change.

Evidence:

- `orchestration/reports/M03-T04-WEBKIT-SELECTION-COPY.md`
- `src/tests/selectionCopy.test.mjs` — 3 focused proof assertions
- Full suite: 377/377
- Production build: PASS
- HTTPS preview: proof HTML/module/fixture all returned 200

Not accepted from automation: Apple Notes editable-table structure, Unicode,
or five-colour survival. Those require the target iPhone paste.
