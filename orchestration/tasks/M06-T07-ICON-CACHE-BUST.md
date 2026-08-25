# M06-T07 — PWA icon cache-bust polish

Implement only this bounded final-polish task. The supplied deliberate icon is
already the approved asset at `references/gym_logger_app_icon_1024.png`; do not
redesign it.

## Required outcome

1. Ensure `index.html` apple-touch-icon/favicon references and
   `public/manifest.webmanifest` icon references use a deterministic,
   cache-busted versioned URL or equivalent asset path so a fresh iPhone
   install requests the supplied Gym Logger icon.
2. Keep 180px Apple touch, 192px, and 512px manifest dimensions and the
   existing `any`/`maskable` declarations valid.
3. Keep the service-worker/static-host/offline contract correct. Do not claim
   an already-installed iOS Home Screen icon can update in place.
4. Add/update static tests for the versioned icon references and document the
   required one-time remove-from-Home-Screen → reopen fresh URL → re-add flow.

## Verification

- Do not redesign or regenerate the icon unless the existing supplied assets
  are actually missing or invalid.
- Return a concise report; do not modify export/share or row-menu files in this
  task.
