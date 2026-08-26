# M03-T09 — real production-session native manual-paste handoff

Status: `READY FOR RETEST — CURRENT PWA AVAILABLE OVER LAN HTTPS`

Target: iPhone 14 Pro Max

Replacement build: hosted macOS/Xcode workflow
[`32974624451`](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32974624451)
(`GymLoggerPasteboardHelper-unsigned` artifact, commit `040fbb2`).

The earlier artifact from
[`32972780014`](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32972780014)
is invalid for this gate and must not be retried.

This is the single physical proof for the productized fallback. It is not a
Shortcut append test. The expected flow is Gym Logger PWA → native helper →
native coloured clipboard → one manual Paste in the existing `Gym` note.

## Earlier helper packaging blocker — resolved

The earlier helper artifact from run `32972780014` could not be imported by
LiveContainer because its packaged `Info.plist` was missing normal application
identity/executable fields. The replacement build `32974624451` restored those
fields and passed hosted IPA metadata assertions including:

- `CFBundleExecutable = GymLoggerPasteboardHelper`;
- bundle identifier, name, display name, short version, and bundle version;
- `CFBundlePackageType = APPL`;
- registered `gymloggerpasteboardproof` URL scheme;
- executable present at the path named by `CFBundleExecutable`.

That packaging defect is closed and must not be confused with the current
blocker.

## Current device blocker — 2026-08-26

The product owner successfully reached the replacement native helper in
LiveContainer. The helper correctly displayed that no production session was
waiting.

The product owner then clarified that they do **not** currently have the main
Gym Logger PWA installed/available on the iPhone and were only given the native
helper IPA. Therefore they cannot perform the required production-session step:
open Tuesday `actual-2026-08-25` in Gym Logger and tap **Prepare Coloured Notes
Copy**.

This is not a native helper failure and not an Apple Notes handoff result. The
human instructions assumed an accessible current PWA build without providing a
usable production/reachable URL or install path.

## Current PWA access — resolved for retest

The current production PWA is now served from the workstation over LAN HTTPS:

`https://192.168.1.49:4173/`

Workstation verification passed:

- app shell: HTTP 200;
- manifest: HTTP 200, `Gym Log`, three icon entries;
- built app contains **Prepare Coloured Notes Copy**;
- current build includes the Tuesday migration and production handoff code.

This is a temporary LAN test deployment, not a public-hosting claim. The
workstation preview process must remain running while the iPhone uses the URL.

## Required correction before retest

The required current HTTPS PWA is now available at
`https://192.168.1.49:4173/`, containing M03-T09, the real Tuesday session
migration, and the **Prepare Coloured Notes Copy** action.

Do not ask the product owner to package the PWA as an IPA. The production Gym
Logger remains a PWA; the native IPA is only the colour-preserving pasteboard
helper.

The next human gate must include an exact usable PWA URL/install instruction,
not merely the phrase “open the trusted Gym Logger HTTPS build.”

## Simple test after PWA access exists

1. Keep/import the corrected `GymLoggerPasteboardHelper-unsigned` from run
   `32974624451` in LiveContainer.
2. Open `https://192.168.1.49:4173/` in Safari (or add that exact URL to the
   Home Screen) and open the real Tuesday session shown as **Tuesday 25 Aug** /
   `actual-2026-08-25`.
3. Confirm it is the real Tuesday workout, then tap **Prepare Coloured Notes
   Copy**.
4. If iOS opens the helper, wait for the coloured-clipboard-ready message. If
   it does not, open **Gym Logger Pasteboard Proof** manually; it should show
   the received Tuesday session, then tap **Prepare Coloured Clipboard & Open
   Notes**.
5. Open the existing Apple Notes note named **Gym**. Paste once at the intended
   insertion point. Do not use the old `Gym Logger to Gym` Shortcut.
6. Check:

   - editable Notes table;
   - date is Tuesday 25 Aug, not the Sunday fixture;
   - legend reads `Arms Back Chest Delts Legs` with spaces;
   - legend labels are Arms orange, Back purple, Chest mint, Delts blue, Legs pink;
   - workout rows retain their five category colours;
   - row order and all free-form values are correct;
   - summary override and notes are present;
   - Unicode such as `30°`, `·`, `—`, and punctuation is intact.

## Current result

- replacement helper import/install: **PASS** — helper launches in LiveContainer;
- production PWA availability on target iPhone: **READY FOR HUMAN RETEST** — current LAN HTTPS URL is `https://192.168.1.49:4173/`;
- real Tuesday production-session handoff: **NOT RUN**;
- Notes paste result for M03-T09: **NOT RUN**.

Do not infer the Notes result from source, desktop tests, or the earlier B2
fixture proof. The current reachable PWA only resolves the access blocker; the
real Tuesday handoff and Notes result remain pending physical verification.
