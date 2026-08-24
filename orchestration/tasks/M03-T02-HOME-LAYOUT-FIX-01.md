# M03-T02-HOME-LAYOUT-FIX-01 — Home action overlap correction

## Role

You are OX Alpha, the bounded implementation worker. Fix one recorded
responsive Home-screen defect only. Codex will independently review the diff,
tests, build, and runtime.

## Product evidence and authority

The authoritative product decision records a real iPhone 14 Pro Max defect:
the Home-screen **Copy Another Session** button visually clips/overlaps the
**History** button beneath it. Preserve the sparse Apple Notes-like Home
layout. Do not redesign navigation or invent new fitness behavior.

## Required correction

- Make the Home secondary actions (`Copy Another Session` and `History`) render
  as two distinct full-width controls on narrow iPhone-sized viewports, with
  clear vertical separation and no clipping/overlap.
- Preserve their labels, order, callbacks, disabled behavior, accessible button
  semantics, and the existing Today/Last Workout layout.
- Scope layout changes to the Home action area. Do not globally change all
  buttons unless the change is demonstrably required and remains visually
  equivalent elsewhere.
- Add focused automated coverage for the action-area structure/class contract
  and the existing navigation behavior where practical. Do not claim that
  jsdom proves physical iPhone pixels.

## Out of scope

- No product decision changes.
- No Apple Notes/clipboard work or colour-transfer experiments.
- No PNG export, backup/restore, PWA installability, native rewrite, or broad
  responsive redesign.
- Do not mark any deferred iPhone/visual gate as passed.

## Required verification and report

Run and report:

- `npm test -- --run --reporter=dot`
- `npm run build`
- `git diff --check`

Produce `orchestration/reports/M03-T02-HOME-LAYOUT-FIX-01.md` with changed
files, results, and the remaining physical-iPhone visual gate. Do not claim
visual acceptance from automated tests.
