# Gym Logger implementation plan

## M01 — Offline foundation vertical slice (commissioning pilot)

Build a small but real vertical slice from the approved seed: React/Vite/TypeScript PWA shell, IndexedDB-backed session storage, seeded 40-row latest session, Home → Start/Continue flow, and a dark Notes-like editable fixed-column table with row-level highlight colors. Prove local persistence and basic runtime behavior. Stop for human review after Codex verification.

Task: `M01-T01`

## M02 — Session lifecycle and history

Copy Another Session, history list, local search, editable historical sessions, delete confirmation, local date/id edge cases, summary override UI, and clone policy coverage.

## M03 — Technical integration spikes

Minimal Apple Notes clipboard spike and tall 40-row image export spike. Test on the real iPhone before treating either integration as accepted. Document exact surviving structure/colors and platform limits.

## M04 — Full Apple Notes-like editor

Row handle selection, selected-row menu, add/duplicate/copy/cut/paste/delete, undo snackbar if practical, touch reorder, responsive horizontal behavior, notes area, and accessibility ergonomics.

## M05 — Export and backup

Faithful/Compact PNG, Skip-column omission rule, dark export, share/save, HTML/plain clipboard, copied state, backup JSON export/import, and restore safety behavior.

## M06 — PWA polish and regression

Manifest/service worker validation, offline cold launch, theme/settings, storage diagnostics, performance checks at 40/100 rows, error handling, and target-iPhone acceptance pass.

## M07 — Deferred backlog

Only after v1 is useful: historical clean-table import, exercise history, autocomplete, mixed per-cell highlights, automatic Notes append, or a native pivot justified by an unmet requirement.
