# M03-T01-E003-FEAS-02 — Harness correction after independent test

## Role

This is a bounded correction to the isolated E-003 feasibility harness. Do not
modify the production PWA, Copy to Notes implementation, product decisions, or
any native application code.

## Codex finding to correct

Independent Codex verification found 31/33 isolated harness tests passing and
two failures:

1. The `share-file-html` available-route verdict contains the wording
   `predicted to attach the file (not editable inline) — transport evidence
   only`, but the test's required semantic order is `attachment ... transport
   evidence`. Make the verdict explicit and stable so it matches that
   acceptance wording without claiming a Notes result.
2. `detectCapabilities({})` currently returns `secureContext: false` because
   the browser-like scope is being read through the host/global fallback. For a
   missing `isSecureContext` property, return `null` (unknown), and likewise
   keep the missing protocol unknown. Do not guess from the test runner.

## Required work

- Make the smallest isolated changes in `public/feasibility/routes.mjs` and,
  only if needed, its focused harness test.
- Preserve honest route language: no route may claim Apple Notes success.
- Add or adjust focused automated coverage for both cases.
- Run `npx vitest run src/tests/feasibilityHarness.test.mjs --reporter=dot`.
- Run `npm run build` and `git diff --check`.
- Produce `orchestration/reports/M03-T01-E003-FEAS-02-CORRECTION.md` with the
  changed files, exact commands/results, and any remaining limitations.

## Stop conditions

- Do not change production behavior.
- Do not fabricate iPhone, Apple Notes, Shortcuts, or visual evidence.
- If the requested behavior conflicts with the route/spec, stop and report the
  conflict instead of broadening scope.
