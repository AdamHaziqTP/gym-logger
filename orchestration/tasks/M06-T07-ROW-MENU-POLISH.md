# M06-T07 — Row-menu final polish

Implement only this bounded final-polish task. Read the latest human evidence
at `orchestration/evidence/HUMAN-VERIFICATION-FINAL-IPHONE14-PROMAX-2026-08-26.md`
and preserve the existing Apple Notes-style interaction model.

## Required outcome

1. Remove **Cut** from the visible row menu. Delete remains the destructive
   action; do not add a replacement destructive command.
2. Change **Paste** so a copied row replaces the contents of the currently
   selected row, preserving the selected row's identity and position. Copy all
   free-form cell values and the highlight exactly; do not insert a new row or
   change row count.
3. Keep Copy, Add Above/Below, Duplicate, Colour, Delete, drag reorder, row
   selection, and undo behavior intact.
4. Keep the app-owned clipboard offline/local; do not use the OS clipboard.

## Verification

- Add/update focused tests proving Cut is absent, Paste replaces the selected
  row, identity/position/count are stable, and all values/highlight survive.
- Return a concise report; do not modify export/share or icon files in this
  task.
