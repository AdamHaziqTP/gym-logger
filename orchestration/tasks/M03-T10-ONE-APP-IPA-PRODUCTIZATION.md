# M03-T10 — One-app Gym Logger IPA productization

Status: `IMPLEMENTED — HOSTED IPA READY FOR TARGET-IPHONE GATE`

## Authority

The product owner authorized this bounded productization in
`orchestration/state/ONE-APP-IPA-AUTHORIZATION-2026-08-26.md` after the real
production-session native manual-paste proof passed at M03-T09.

## Objective

Combine the existing React/TypeScript Gym Logger UI and the proven native
Apple Notes flat-RTFD generator in one installable iOS app. The app remains
local-first and offline-capable; it does not become a ground-up Swift rewrite.

Expected flow:

`Gym Logger IPA → Copy Coloured Notes & Open Notes → one manual Paste`

The native helper must receive the currently visible production session from
the embedded web app, generate the Apple Notes-shaped `com.apple.flat-rtfd`
payload in-process, put it on the pasteboard, and open Notes when iOS permits.

## Bounded implementation

1. Keep the production React/TypeScript UI and all existing session behavior.
2. Add a narrow WebKit message bridge for the coloured handoff and ordinary
   Notes fallback.
3. Bundle the built web app in a minimal SwiftUI/WKWebView shell with a local
   URL-scheme handler, so the installed app needs no LAN server, Safari URL,
   or service worker to run.
4. Reuse the independently proven `NativePayloadBuilder` and keep its
   fixture-only proof action separate from the real-session handoff.
5. Bundle the Tuesday `actual-2026-08-25` migration in the web app. Do not
   assume Safari/Home Screen IndexedDB transfers into the WKWebView store.
6. Build an unsigned IPA on hosted macOS/Xcode and assert the packaged plist,
   executable, web bundle, and deliberate Gym Logger icon assets in CI.

## Acceptance boundary

Automated acceptance requires the one-app static contract, native harness,
full PWA tests, production build, diff hygiene, and hosted IPA assertions to
pass. The target iPhone must then prove installation/launch without a PC,
Tuesday latest-session bootstrap, local persistence across relaunch, native
coloured handoff, one-paste editable coloured Notes output, Unicode/data
fidelity, and no core regressions. Desktop evidence cannot close those
physical checks.

## Verification result

The hosted workflow run
[`32982786740`](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32982786740)
passed on macOS/Xcode after two bounded CI/project-reference corrections. It
compiled the unsigned iOS app, packaged `GymLogger-unsigned.ipa`, and asserted
the complete bundle identity, executable, bundled web app, and icon assets.

## Worker policy

OX Alpha was attempted through the verified DSH Desktop wrapper. That attempt
failed before the worker started because the packaged DSH plugin tree could
not apply its `cordis:include` loader entry. The exact infrastructure report
is `orchestration/reports/M03-T10-ONE-APP-IPA-OX-ALPHA-REPORT.md`; Codex
fallback implementation is allowed after this concrete launcher failure.
