# Product decision — authorize one-app Gym Logger IPA

Date: 2026-08-26
Status: `AUTHORIZED`

## Decision

Supersede the previous PWA-only delivery constraint for this bounded productization step.

The product owner has explicitly requested that the normal Gym Logger experience and the now-proven native coloured Apple Notes clipboard generator be combined into **one installable Gym Logger IPA**.

This is not authorization for a ground-up native rewrite. The preferred implementation is a thin native wrapper around the existing production Gym Logger web UI plus an in-process native bridge for the colour-preserving Notes handoff.

## Required user experience

The installed Gym Logger IPA should be the only Gym Logger app the product owner needs to open for normal use.

Inside a workout session, one action should perform the native colour handoff directly, without launching a separate helper app or requiring a website/PWA first:

`Copy Coloured Notes & Open Notes`

Expected flow:

1. User edits/opens the current workout in the Gym Logger IPA.
2. User taps the one coloured-Notes action.
3. The same app sends the visible session directly to its native bridge.
4. Native code generates the already-proven Apple Notes-shaped `com.apple.flat-rtfd` payload.
5. The app writes that payload to the iOS pasteboard.
6. The app opens Apple Notes when iOS allows.
7. User performs exactly one manual Paste into the canonical `Gym` note.

The final manual Paste remains required because the separately verified Shortcut `Append to Note` path strips colour.

## Architecture constraints

Prefer reuse over rewrite:

- retain the current React/TypeScript Gym Logger UI and product behavior;
- bundle/host the existing web app inside the IPA with a minimal native shell (for example a `WKWebView` wrapper or equivalent);
- replace the current cross-app `gymloggerpasteboardproof://handoff` flow with an in-process JS/native bridge;
- reuse the proven Swift flat-RTFD generator from the helper;
- preserve local/offline behavior;
- preserve current session editing, history, image export, backup/import/export, and Notes fallback behavior unless a wrapper-specific compatibility correction is required;
- preserve the ordinary uncoloured `Copy to Notes` action as a fallback unless product polish later consolidates the labels;
- keep Tuesday 25 Aug 2026 (`actual-2026-08-25`) as Last Workout / clone source when no later legitimate session exists;
- do not promote the old Sunday fixture to production latest state;
- do not introduce accounts, backend/cloud sync, analytics, or unrelated native features.

## Data/storage requirement

A bundled/native-webview app has a different storage container from Safari/PWA. Do not assume Safari/Home-Screen IndexedDB magically appears in the IPA.

Before acceptance, Codex must explicitly verify the wrapper's persistence/migration behavior. At minimum the IPA must start with the authoritative Tuesday production session available and must persist subsequent workouts locally across app relaunches. Existing backup/import/export should remain usable as the user-controlled migration/recovery mechanism unless a safer direct migration is implemented and verified.

## Distribution constraint

No paid Apple Developer Program dependency is authorized. Produce the same style of unsigned/hosted IPA that can be used through the owner's existing LiveContainer/SideStore-style workflow.

## Acceptance

One-app productization is accepted only after a target-iPhone test proves:

- IPA installs and launches;
- normal Gym Logger UI works without a PC/LAN web server;
- Tuesday is the correct latest baseline when appropriate;
- session edits persist across relaunch;
- `Copy Coloured Notes & Open Notes` generates the fully coloured editable Notes table from the real visible session;
- Notes opens or a truthful manual-open fallback is shown;
- one manual Paste preserves table, all five colours, values/order, summary, notes, and Unicode;
- no separate helper app or PWA/web URL is required during normal use;
- existing core Gym Logger functions do not regress.

This authorization is the next productization direction after the M03-T09 physical PASS.
