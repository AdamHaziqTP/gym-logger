# M01 final human feedback before acceptance — 2026-08-24

The FIX-04 physical-iPhone pass is otherwise positive. Adam approved the behavior and requested two narrow final corrections before the last M01 device gate.

## Product decision

- The visible session legend contains exactly five navigation categories: `Arms`, `Back`, `Chest`, `Delts`, `Legs`.
- Remove the visible `Other` legend item.
- Keep `none`/unhighlighted internally as the white, uncategorized state. Abs and other unclassified rows remain unhighlighted; they do not need a sixth legend label.

## Final touch issue

On iPhone Safari, pressing/holding the three-dot row handle to drag can invite native text-selection/long-press behavior. The handle must behave only as an interactive drag control:

- normal tap still selects/opens the row menu;
- press/drag still reorders;
- the handle/dots do not become selectable text, show selection handles, or invoke an inappropriate callout;
- actual editable cells and Notes text retain normal selection/editing behavior.

This is a narrow handle-only correction, not a global text-selection change.

## Disposition

M01 remains unaccepted and M02 remains blocked until FIX-05 is independently verified and the final iPhone gate passes.
