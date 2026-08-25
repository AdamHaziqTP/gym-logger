# M06-T02-CORRECTION-01 — finish settings implementation and repair build gate

## Role

Bounded correction after Codex verification of the partially written
M06-T02 Settings/Theme/Default Image Style implementation. Preserve the
approved product behavior; finish the missing verification artifacts and fix
only the verified defects below.

## Verified findings

`npm run build` currently fails with:

- `src/components/SessionView.tsx`: `ImageExportStyle` is used in the new
  `defaultImageStyle` prop but is not imported.
- `src/domain/settings.ts`: `applyThemePreference` calls `getAttribute` on its
  injected root element, but the declared type contains only `setAttribute` and
  `removeAttribute`.

The first M06-T02 worker invocation also stopped without producing the required
settings tests or `orchestration/reports/M06-T02-SETTINGS-THEME-STYLE.md`.

## Required correction/completion

- Repair the two TypeScript errors with the narrowest type-safe changes.
- Complete the existing M06-T02 settings behavior only: Home → Settings,
  System/Dark/Light immediate theme application and persistence, Compact/Faithful
  default image-style persistence and Image Export initialization, About copy,
  and safe defaults for missing/invalid metadata.
- Add deterministic focused tests for settings parsing/persistence, theme
  application including System media-query behavior, Settings UI controls, and
  Image Export initial-style behavior. Do not weaken existing tests.
- Produce the required worker report with exact results and the consolidated
  human checklist. Do not claim physical iPhone or visual acceptance.
- Do not change Apple Notes colour decisions, PNG renderer semantics, backup
  schema, service-worker policy, table/row behavior, or unrelated product UI.

## Acceptance

- Focused settings/style tests pass.
- `npm test -- --run --reporter=dot` passes with zero unhandled errors.
- `npm run build` passes with no TypeScript errors.
- `git diff --check` passes.
- Trusted HTTPS runtime smoke covers Home → Settings and Image Export style
  initialization.
