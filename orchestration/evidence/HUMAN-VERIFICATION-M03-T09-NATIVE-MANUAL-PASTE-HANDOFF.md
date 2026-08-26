# M03-T09 — real production-session native manual-paste handoff

Status: `READY FOR RETEST — REPLACEMENT HELPER IPA PACKAGING VERIFIED`

Target: iPhone 14 Pro Max

Replacement build: hosted macOS/Xcode workflow
[`32974624451`](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32974624451)
(`GymLoggerPasteboardHelper-unsigned` artifact, commit `040fbb2`).

The earlier artifact from
[`32972780014`](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32972780014)
is invalid for this gate and must not be retried.

This is the single physical proof for the productized fallback. It is not a
Shortcut append test. The expected flow is Gym Logger → native helper → native
coloured clipboard → one manual Paste in the existing `Gym` note.

## Installation blocker — 2026-08-26

The product owner attempted to import the final helper IPA into LiveContainer.
LiveContainer failed before the Notes handoff could be tested, reporting:

`Failed to map /var/mobile/Containers/Data/Application/.../Documents/Applications/Unknown.app/(null): Bad file descriptor.`

Product chat independently downloaded the exact GitHub Actions artifact from
run `32972780014` and inspected `GymLoggerPasteboardHelper-unsigned.ipa`.
The IPA does contain:

- `Payload/GymLoggerPasteboardHelper.app/GymLoggerPasteboardHelper` — a real
  arm64 Mach-O executable;
- `Payload/GymLoggerPasteboardHelper.app/Info.plist`;
- the bundled fixture.

However, the packaged app's `Info.plist` is missing the normal bundle identity
and executable keys that LiveContainer needs to identify and map the guest app,
including at least:

- `CFBundleExecutable`;
- `CFBundleIdentifier`;
- `CFBundleName` / `CFBundleDisplayName`;
- `CFBundlePackageType`;
- `CFBundleShortVersionString`;
- `CFBundleVersion`.

The plist currently contains platform/Xcode metadata, the registered URL scheme,
minimum OS version, device family, and required arm64 capability, but no
`CFBundleExecutable`. This directly explains the LiveContainer path resolving as
`Unknown.app/(null)` rather than a named app executable.

Therefore this is an artifact-packaging defect, not a failed Apple Notes colour
handoff and not evidence that LiveContainer itself is incompatible with the helper.
Do not ask the product owner to retry the same IPA.

## Packaging correction completed — 2026-08-26

The custom native app plist was restored with the complete application identity,
including executable, identifier, name/display name, package type, and version
fields. The hosted workflow now extracts `Info.plist` from the resulting IPA
and asserts those fields, the `gymloggerpasteboardproof` URL scheme, and the
presence of the executable named by `CFBundleExecutable`.

Hosted run
[`32974624451`](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32974624451)
passed the build, packaging, and all IPA metadata assertions:

- `CFBundleExecutable = GymLoggerPasteboardHelper`;
- bundle identifier, name, display name, short version, and bundle version are
  present;
- `CFBundlePackageType = APPL`;
- `gymloggerpasteboardproof` remains registered;
- `Payload/GymLoggerPasteboardHelper.app/GymLoggerPasteboardHelper` exists.

This resolves the recorded LiveContainer import blocker. The replacement IPA
is ready for the same physical M03-T09 proof; no Notes result has been inferred
from the hosted build.

## Required correction before retest

Rebuild/package the helper with a complete valid application `Info.plist`.
At minimum, ensure the resulting IPA's app bundle resolves all standard bundle
identity fields and specifically maps:

`CFBundleExecutable = GymLoggerPasteboardHelper`

while preserving the existing `gymloggerpasteboardproof` URL scheme, iPhoneOS
platform metadata, minimum OS version, arm64 executable, bundled fixture, and
M03-T09 real-session handoff behavior.

The corrected hosted artifact should be independently opened as an IPA before
publishing the next human gate and its `Info.plist` should be asserted in CI so
this packaging regression cannot recur.

## Simple test after a corrected artifact exists

1. Install/import the corrected newest `GymLoggerPasteboardHelper-unsigned` IPA.
   Keep the helper installed alongside the PWA.
2. Open the trusted Gym Logger HTTPS build and open the real Tuesday session
   shown as **Tuesday 25 Aug** / `actual-2026-08-25`. Do not use the helper's
   isolated fixture button for this test.
3. Make one harmless visual check that the session has the expected real rows,
   then tap **Prepare Coloured Notes Copy**.
4. If iOS opens the helper, wait for the message that the coloured clipboard is
   ready. If it does not, open **Gym Logger Pasteboard Proof** manually; it
   should show the received Tuesday session, then tap **Prepare Coloured
   Clipboard & Open Notes**.
5. Open the existing Apple Notes note named **Gym**. Paste once at the intended
   insertion point. Do not use the old `Gym Logger to Gym` Shortcut.
6. Check the result:

   - editable Notes table;
   - date is Tuesday 25 Aug, not the Sunday fixture;
   - legend reads `Arms Back Chest Delts Legs` with spaces;
   - legend labels are Arms orange, Back purple, Chest mint, Delts blue, Legs pink;
   - workout rows retain their five category colours;
   - row order and all free-form values are correct;
   - summary override and notes are present;
   - Unicode such as `30°`, `·`, `—`, and punctuation is intact.

## Record the result

Current device result:

- previous helper import/install: **BLOCKED** — malformed packaged `Info.plist`
  caused LiveContainer `Unknown.app/(null): Bad file descriptor` before launch;
- replacement helper import/install: **PENDING HUMAN RETEST**;
- Notes handoff checks: **NOT RUN** for the replacement because this is a new
  artifact and physical installation is still required.

Do not infer the Notes result from source, desktop tests, or the earlier B2
fixture proof. Once a corrected IPA installs successfully, repeat the physical
handoff checklist above. If that passes, the productized native manual-paste
route is accepted. If it fails, keep ordinary uncoloured `Copy to Notes` as the
v1 fallback and route only the affected helper branch for correction.
