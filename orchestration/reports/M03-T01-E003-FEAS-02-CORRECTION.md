# M03-T01-E003-FEAS-02 — harness correction: worker report

**Worker:** OX
**Task:** `orchestration/tasks/M03-T01-E003-FEAS-02-CORRECTION.md`
**Result:** COMPLETE — both Codex findings corrected inside the isolated
harness; focused suite **33/33**, full suite **186/186 (16 files)**, build
passing, `git diff --check` clean. No production behavior changed by this
correction; no Notes/Shortcuts/device evidence claimed or fabricated.

Note on sequencing: the two findings had already surfaced during the FEAS-01
run and were fixed there; this correction tightens finding 1 to Codex's exact
required semantic wording and pins both behaviors with focused coverage. All
changes are confined to `public/feasibility/routes.mjs` and its test.

## Changes

| Finding | File | Change |
|---|---|---|
| 1 | `public/feasibility/routes.mjs` | `share-file-html` available-branch verdict now states verbatim: "Predicted Apple Notes outcome when Notes is the chosen target: **an attachment** (not editable inline) — **transport evidence** only." Stable `attachment … transport evidence` order; still a prediction, never a success claim. |
| 1 | `src/tests/feasibilityHarness.test.mjs` | Test regex updated to require `/attachment.*transport evidence/i`, with a comment naming FEAS-02 as the source of the stable wording contract. |
| 2 | `public/feasibility/routes.mjs` | `detectCapabilities` returns `secureContext: null` (unknown) whenever `isSecureContext` is not a boolean on the probed scope — including a bare `{}` scope — instead of coercing to `false`; missing protocol stays `null`. Nothing is guessed from the host/test runner. |
| 2 | `src/tests/feasibilityHarness.test.mjs` | Existing "returns unknown/null answers rather than guesses on bare scopes" test already asserts `secureContext === null`, `protocol === null`, `canShareFiles === null`, `hasShare === false` for `{}`; retained as the focused guard. |

Honesty invariants re-verified by the suite: every route verdict uses only the
four honest statuses (`available-on-this-origin`,
`needs-user-created-shortcut`, `not-available-here`,
`unknown-on-this-origin`) and the mechanical check that no verdict text may
assert an Apple Notes outcome (`/guaranteed|proven transfer|works with notes|
will import successfully/` must never match).

## Commands run and results

| Command | Result |
|---|---|
| `npx vitest run src/tests/feasibilityHarness.test.mjs --reporter=dot` | **PASS — 33/33** |
| `npm test -- --run --reporter=dot` | **PASS — 186/186 across 16 files** |
| `npm run build` | **Passing** (50 modules) |
| `git diff --check` | Clean (exit 0; benign CRLF notices only) |

## Remaining limitations

Unchanged from `orchestration/reports/M03-T01-E003-FEAS-01.md` §5–§8: the
harness reports mechanics only; all Apple Notes outcomes remain pending the
target-iPhone gate after independent review.
