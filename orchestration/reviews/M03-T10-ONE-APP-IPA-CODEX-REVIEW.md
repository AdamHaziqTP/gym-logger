# M03-T10 one-app IPA — Codex review

Updated: 2026-08-26

## Scope reviewed

- [x] Existing React/TypeScript Gym Logger UI remains the product surface.
- [x] Embedded WebKit bridge sends the visible `WorkoutSession` directly to
  native Swift for the coloured Notes handoff.
- [x] Ordinary Copy to Notes remains available through the native bridge in
  the bundled app and retains the browser fallback outside it.
- [x] Native shell serves the built web app from the IPA through a local URL
  scheme and does not require the PC, LAN HTTPS, Safari, a Shortcut, or a
  separate helper app.
- [x] Proven `NativePayloadBuilder` is reused for generated Apple Notes-shaped
  flat-RTFD output; the diagnostic fixture remains isolated.
- [x] Tuesday `actual-2026-08-25` migration remains in the bundled web app and
  is not replaced by the Sunday proof fixture.
- [x] Hosted workflow packages the IPA and inspects the artifact rather than
  trusting only source metadata.

## Independent verification

- PWA suite: **PASS — 415/415 tests, 37 files**.
- `npm run build`: **PASS**.
- One-app static contract: **PASS — 18/18 checks**.
- Native E-004 harness: **PASS — 55/55 checks**.
- `git diff --check`: **PASS**.
- Hosted macOS/Xcode compilation and packaged IPA assertions: **PENDING**;
  the workflow is `.github/workflows/gym-logger-ipa.yml`.

## Acceptance boundary

This review accepts the Windows-verifiable source contract and fallback
implementation for hosted packaging. It does not claim Swift compilation,
IPA installation, iOS persistence, or Apple Notes behavior until the hosted
artifact and target-iPhone gate are complete.
