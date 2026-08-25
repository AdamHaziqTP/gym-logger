# M06-T05 — final iPhone gate correction batch

## Role

You are OX Alpha, the bounded implementation worker. Correct only the real
failures recorded by the consolidated iPhone 14 Pro Max acceptance pass. Codex
will independently inspect the diff and verify all automated evidence.

## Product authority and boundaries

- Preserve the existing Gym Logger PWA and sparse Apple Notes-inspired design.
- Do not reopen Apple Notes category-colour transfer. Editable Notes table/data
  without transferred colours remains the accepted v1 limitation.
- Do not add native code, cloud services, accounts, generic fitness features,
  or new export formats.
- Do not claim physical-device behavior from desktop tests.

## Required corrections

1. Fix the Faithful and Compact image-export previews on iPhone WebKit. The
   current physical result is a blank/black preview for both styles. Keep the
   deterministic SVG/PNG data fidelity, long-session support, row colours,
   notes, and Skip-column rules. Prefer a robust preview representation that
   does not display a blank raster when WebKit can produce a valid source
   document; PNG delivery must remain truthful and independently testable.
2. Make the Export Image sheet reliably dismissible on mobile. Provide an
   obvious close control that remains reachable for tall 40-row previews, keep
   backdrop dismissal and Escape where supported, and do not trap focus or
   scroll the underlying session accidentally.
3. Replace the current placeholder-like Home Screen icon with a deliberate,
   minimal Gym Logger icon consistent with the dark shell, blue accent, and
   table/log identity. Update the reproducible generator and generated PNGs;
   preserve manifest sizes and iOS apple-touch-icon wiring.
4. Add focused automated coverage for the preview fallback/selection and the
   mobile close affordance where practical, plus icon identity/generator
   coverage without brittle pixel claims. Preserve existing tests.

## Acceptance

- Focused image/export, component, and PWA/icon tests pass.
- Full suite has zero failures and zero unhandled errors.
- `npm run build` and `git diff --check` pass.
- The production build serves the expected shell, manifest, service worker,
  icons, and image-export assets from the configured HTTPS runtime.
- Worker report describes the changed files, limitations, and test evidence.
- Physical iPhone preview rendering, mobile dismissal, installability, and
  HTTPS trust remain human checks in the consolidated final checklist.
