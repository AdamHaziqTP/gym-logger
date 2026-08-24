# M03-T02-IMAGE-EXPORT-01 — Faithful/Compact full-session PNG export

## Role

You are OX Alpha, the bounded implementation worker. Implement the next v1
export slice from the finalized specification. Codex will independently review
the diff, tests, build, and runtime. Physical iPhone image readability/save and
share behavior remain human-only evidence for the consolidated final pass.

## Authoritative requirements

Implement spec §14 and acceptance I1–I6 for the existing PWA:

- Add user-facing **Share / Export Image** access from the session screen.
- Support both **Faithful** and **Compact** styles.
- Export the complete session as one PNG, including date, five-entry legend
  (`Arms Back Chest Delts Legs`), summary, every row in order, and bottom notes.
- Preserve the locked five category colours inside the image. `none` rows stay
  unhighlighted. Use the current dark presentation regardless of app theme.
- Compact uses smaller header/margins/cell padding, a wider Exercise column,
  and hides the Skip column only when every Skip cell is empty. If any Skip
  text exists, Compact includes that column.
- Faithful keeps the normal Notes-like spacing, borders, and all five columns.
- Use a deterministic, dependency-free browser-safe renderer that can produce
  a tall 40+ row image without truncating or dropping rows. Prefer SVG-to-PNG
  with a Blob/canvas fallback if consistent with the existing build target.
- Use filename `Gym-YYYY-MM-DD.png`.
- After rendering, provide a preview and save/share through the iOS share sheet
  where available, with a truthful download fallback. Do not claim iOS share
  success from desktop tests.

## Scope boundaries

- No native rewrite, backend, cloud storage, account, or paid service.
- No general Settings system; a local export-style choice/control is enough
  for this bounded task.
- Do not change Notes clipboard semantics or revisit the accepted no-colour
  Apple Notes limitation.
- Do not remove or alter arbitrary string values, manual summary overrides,
  multiline notes, row order, or highlight mapping.
- Do not mark any iPhone/visual/save/share criterion as passed from jsdom.

## Required automated coverage

Add focused pure/DOM tests that prove:

1. 40-row fixture produces one deterministic export representation with all
   rows, date, legend, summary, notes, and category tokens.
2. Faithful and Compact styles differ as specified.
3. Compact Skip omission rule is exact for all-empty versus any-nonempty Skip.
4. Values with commas, degree signs, quotes/braces/backslashes, and multiline
   notes survive the renderer without HTML/SVG injection or truncation.
5. The session screen exposes the export control without changing existing
   Copy to Notes, row editing, or navigation behavior.

## Verification and report

Run:

- `npm test -- --run --reporter=dot`
- `npm run build`
- `git diff --check`
- a local HTTPS runtime smoke that loads the session screen/export assets.

Produce `orchestration/reports/M03-T02-IMAGE-EXPORT-01.md` with changed files,
commands/results, limitations, and the exact consolidated iPhone checklist.
