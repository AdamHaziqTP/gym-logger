# M03-T09 — real production-session native manual-paste handoff

Status: `BLOCKED — FINAL HELPER IPA CANNOT BE IMPORTED BY LIVECONTAINER`

Target: iPhone 14 Pro Max

Build: hosted macOS/Xcode workflow
[`32972780014`](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32972780014)
(`GymLoggerPasteboardHelper-unsigned` artifact, commit `08f894b`).

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

- helper import/install: **BLOCKED** — malformed packaged `Info.plist` causes
  LiveContainer `Unknown.app/(null): Bad file descriptor` before launch;
- Notes handoff checks: **NOT RUN** because the helper could not be imported.

Do not infer the Notes result from source, desktop tests, or the earlier B2
fixture proof. Once a corrected IPA installs successfully, repeat the physical
handoff checklist above. If that passes, the productized native manual-paste
route is accepted. If it fails, keep ordinary uncoloured `Copy to Notes` as the
v1 fallback and route only the affected helper branch for correction.
