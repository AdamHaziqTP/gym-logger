# M03-T09 native manual-paste handoff — Codex review

Updated: 2026-08-26

## Scope accepted

- [x] Phase C automatic Shortcut append is closed after the physical failure at
  `cda3a58`; no Shortcut append route remains in the helper.
- [x] Native generated RTF legend runs use the five approved labels with
  non-breaking separators: Arms, Back, Chest, Delts, Legs.
- [x] Production PWA sends the currently visible/selected `WorkoutSession` as
  versioned JSON, including rows, highlights, summary override, notes, and
  local/display date.
- [x] Native helper validates the envelope and generates the proven
  Apple-shaped flat-RTFD payload from the handoff session, not from the bundled
  fixture.
- [x] The helper writes only `com.apple.flat-rtfd` for the real-session route,
  attempts to open Notes, and leaves an explicit manual-open/manual-paste
  fallback if iOS does not open Notes automatically.
- [x] The ordinary PWA `Copy to Notes` path is unchanged.
- [x] The bundled fixture remains isolated to the diagnostic proof action.
- [x] The helper has a registered `gymloggerpasteboardproof://handoff` URL
  scheme.

## Independent verification

- Native static contract: **PASS** (`node orchestration/feasibility/E-004-native/verify.mjs`).
- PWA full suite: **PASS — 412/412 tests, 36 files**.
- `npm run build`: **PASS**.
- `git diff --check`: pending final checkpoint after orchestration docs are
  updated.
- Swift/Xcode compile: **not available on this Windows workstation**. A fresh
  hosted macOS/Xcode workflow must package the changed helper before physical
  testing; no iOS compile or device result is claimed here.

## Acceptance boundary

This review accepts the code and transport contract for the next device gate.
It does not mark the target iPhone result passed. The helper must be built and
installed, then the product owner must paste one real production session into
the existing `Gym` note and verify the checklist in the accompanying evidence
file.
