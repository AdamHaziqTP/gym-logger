# M03-T01-E003 — Apple Notes color interoperability feasibility harness

**Status:** EXPERIMENTAL — isolated bounded spike authorized by E-003 (2026-08-25).
**Task:** `orchestration/tasks/M03-T01-E003-FEAS-01.md`
**Verdict authority:** target iPhone 14 Pro Max over trusted HTTPS, after Codex review.

## What lives here

This directory documents the isolated feasibility harness. The runnable
artifacts are static assets under `public/feasibility/`:

| Artifact | Role |
|---|---|
| `public/feasibility/index.html` | Trusted-HTTPS test page: capability panel, route verdicts, controls, Share Sheet / file-handoff buttons, Shortcuts setup instructions, fixture preview, mechanics log. Clearly banner-labeled experimental. |
| `public/feasibility/app.js` | DOM wiring only; reports local mechanics (copied/shared/downloaded/rejected) and records refusals verbatim as evidence. Never claims a Notes result. |
| `public/feasibility/fixture.mjs` | Representative session fixture: all five categories + one/two `none` rows, weird free-form values (`8,6`, `body weight`, degree sign, em dash, `<strict>`, `"inc."`, backslash/braces), table order, multi-line notes, non-derivable summary override. Locked color tokens restated; opaque highlights DERIVED (same composite as FIX-03). |
| `public/feasibility/format.mjs` | Dependency-free mirrors of production pure helpers (`formatDateDisplay`, summary calc/override, row ordering). |
| `public/feasibility/plainNotes.mjs` | Plain-TSV control restating production `buildNotesText` output format. |
| `public/feasibility/rtfNotes.mjs` | Pure deterministic RTF generator: real RTF table (`\trowd…\cell`), per-cell `\cf` foregrounds + `\highlight`/`\chcbpat` opaque highlights from a full `\colortbl`, ASCII-only output via signed `\uN?` escapes, escaped `\ { }`, in-cell `\line`. |
| `public/feasibility/notesHtmlTable.mjs` | Representative HTML payload (FIX-03-style markup) as input for the Shortcuts Make-Rich-Text routes and .html file handoff. NOT the production payload; production Copy to Notes is untouched. |
| `public/feasibility/routes.mjs` | Honest capability detection + route classification. Unsupported features become explicit verdicts ("not available here"), never silent failures. |

## Test coverage

`src/tests/feasibilityHarness.test.mjs` pins the harness to the production code:

- fixture tokens equal `HIGHLIGHT_TOKENS` fg/bg and derived opaque values equal
  `OPAQUE_HIGHLIGHT_BG`; legend labels/order equal `CATEGORY_LEGEND`;
- mirror helpers are byte-equal to production `formatDateDisplay` /
  `calculateSummary` / `displaySummary` behavior on representative cases;
- `buildPlainNotes(fixture)` is byte-equal to production
  `buildNotesText(liftedSession)`;
- RTF output is deterministic, ASCII-only, fully escaped, carries the correct
  color-table indices for all five categories, leaves `none` rows uncolored,
  preserves cell order and multiline text;
- route classification never asserts a Notes outcome and marks unsupported
  capabilities honestly.

## Serving (trusted HTTPS)

The page is served by the existing Vite server at `/feasibility/`:

- dev: `https://192.168.1.49:5173/feasibility/`
- preview of a production build serves it identically from `dist/`.

The same trusted-certificate preconditions as
`orchestration/evidence/HTTPS-RICH-PASTE-SETUP.md` apply. If Safari shows any
certificate warning, stop — an untrusted origin cannot exercise clipboard/share
capabilities and would poison the evidence.

## Explicit limits (E-003)

No native app, no paid Apple Developer dependency, no change to the accepted
Copy to Notes behavior, no replacement of the editable table by an image, and
no claim that any representation imports into Apple Notes until the iPhone test
proves it. If no route demonstrates a low-friction improvement, stop this spike
and return evidence to the product bridge (default disposition: accept
uncolored editable rich-table paste as a documented iOS/Notes limitation).
