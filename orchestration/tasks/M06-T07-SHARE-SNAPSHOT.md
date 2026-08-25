# M06-T07 — Compact colour snapshot share

Implement only this bounded final-polish task. Read the latest human evidence
at `orchestration/evidence/HUMAN-VERIFICATION-FINAL-IPHONE14-PROMAX-2026-08-26.md`
and the product context before editing.

## Required outcome

1. Compact is the default/initial export style for a new or unset preference.
   Preserve an explicit persisted Faithful preference; do not remove the
   existing per-export toggle or settings control.
2. Add a direct **Share Colour Snapshot** action beside/near **Copy to Notes**
   on the session screen. It must use the existing deterministic Compact SVG →
   Canvg PNG → `sharePngFile`/download delivery path and preserve the existing
   colours, layout, and Unicode.
3. Label this explicitly as an image/snapshot action. It is not an editable
   Apple Notes export and must not alter or replace **Copy to Notes**.
4. Keep the action offline-first and truthful: do not report a share success
   before `navigator.share` resolves; retain the existing download fallback.

## Verification

- Add focused component/domain coverage for the visible action, Compact
  generation, share outcome handling, and the unchanged Copy to Notes action.
- Do not reopen Apple Notes colour recovery, Shortcuts, or E-004.
- Return a concise report; do not modify row-menu or icon files in this task.
