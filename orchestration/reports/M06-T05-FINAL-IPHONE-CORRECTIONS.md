# M06-T05 final iPhone correction batch

Date: 2026-08-25

## Scope

The consolidated iPhone 14 Pro Max gate recorded five real failures: blank or
black Faithful and Compact previews, a hard-to-dismiss Export Image sheet, an
HTTPS origin that still presented a trust warning, and a placeholder-like Home
Screen icon. Apple Notes colour transfer was not reopened.

## Worker route

- OX Alpha was dispatched twice through the verified Desktop wrapper with
  `--profile headless` and the generated active-worker patch.
- Both bounded invocations ended silently without a worker report or usable
  repository delta. They were terminated after the bounded retry window under
  the existing infrastructure policy.
- Codex completed the bounded fallback from the authoritative task file and
  independently verified the resulting diff.

## Implemented correction

- Image Export now keeps the deterministic SVG as the visible preview instead
  of displaying a potentially black WebKit canvas raster; PNG encoding remains
  a separate, truthful delivery path.
- The export sheet has a sticky, reachable header Close control, while the
  existing backdrop and Escape dismissal remain available.
- The reproducible icon generator now emits a deliberate dark Gym Logger log
  card with the five approved category colors rather than the old barbell/H-like
  mark. Manifest dimensions and iOS icon wiring are unchanged.
- The local HTTPS setup now serves a leaf certificate for `192.168.1.49` from a
  proper local root CA with IP SAN and server-auth usage. The public download is
  the root CA only; private PFX/password material remains local and ignored.

## Independent evidence

- Focused export, PNG, PWA/icon, and Home tests: **47/47 passed**.
- Full suite: **354/354 passed** across 30 test files, zero unhandled failures.
- Build: **passed**; Vite stamped the production service worker.
- HTTPS runtime: shell, manifest, service worker, icon, and built certificate
  resource all returned HTTP 200. The app title was `Gym Log`; the server leaf
  reported subject `CN=192.168.1.49`, issuer `CN=Gym Logger Local Root CA`, and
  SAN `IP Address=192.168.1.49, DNS Name=localhost`.
- `git diff --check`: **passed**.

## Human status

This evidence does not pass the device-only branches. The same consolidated
checklist remains the acceptance authority for iPhone WebKit preview rendering,
mobile dismissal, root trust/profile installation, icon appearance after a
fresh Home Screen install, offline behavior, and all other deferred checks.
