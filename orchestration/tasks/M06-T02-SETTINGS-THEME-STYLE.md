# M06-T02-SETTINGS-THEME-STYLE — minimal settings and persisted export style

## Role

You are OX Alpha, the bounded implementation worker. Implement only the
remaining explicit v1 settings requirements from spec §§22–23 and the default
image-style preference. Codex will independently verify the diff, tests, build,
and runtime. Do not claim iPhone acceptance.

## Requirements

- Add a small accessible Settings surface reachable from Home. Keep it quiet
  and local; do not build a generic fitness/settings maze.
- Support the specified theme choices: **System**, **Dark**, and **Light**;
  default to System. Apply the choice without a page reload and persist it in
  the existing local metadata/settings path. Use the system preference when
  System is selected.
- Preserve the approved dark Notes-like default and all existing row/category
  colors, table behavior, text selection, and layout. Light mode must remain
  readable and restrained, not become a redesign.
- Persist the default image style choice (**Compact** or **Faithful**) and have
  the Image Export panel initialize from that preference while retaining its
  current per-export toggle. Existing Compact behavior, including conditional
  Skip omission, must not change.
- Keep the storage diagnostic and truthful local-only/archive wording. Do not
  add accounts, cloud sync, analytics, or remote assets.
- Add deterministic automated coverage for settings rendering, theme persistence
  and application, System media-query behavior, invalid/missing metadata
  fallback, and image-style preference initialization/persistence.
- Do not alter Apple Notes color decisions, PNG renderer semantics, backup JSON
  schema, service-worker cache policy, or physical-gate claims.

## Acceptance

- Focused settings/style tests pass.
- `npm test -- --run --reporter=dot` passes with zero unhandled errors.
- `npm run build` passes.
- `git diff --check` passes.
- Trusted HTTPS runtime smoke covers Home → Settings and the Image Export style
  control.
- Produce `orchestration/reports/M06-T02-SETTINGS-THEME-STYLE.md` with an
  updated consolidated human checklist. Do not mark device/visual acceptance
  as passed.
