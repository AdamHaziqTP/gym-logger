# M03-T09 — Product native manual-paste handoff

Status: `IMPLEMENTED — CODEX FALLBACK; READY_FOR_HOSTED_BUILD_AND_HUMAN_GATE`

## Context

Phase C is physically failed at `cda3a58`: Shortcut `Append Shortcut Input to
Gym` reaches the existing note and preserves a table, but strips all colours
and concatenates the legend labels. Direct generated `com.apple.flat-rtfd` →
manual Paste in Apple Notes remains the proven coloured editable-table path.

The product fallback is therefore: production Gym Logger session → native
helper → generated flat-RTFD clipboard → open Notes as far as iOS reliably
allows → one manual Paste. Do not iterate Shortcut append or HTML conversion.

## Bounded implementation

1. Fix the native generated RTF legend so it visibly renders `Arms Back Chest
   Delts Legs` with spaces and individually uses Arms/orange, Back/purple,
   Chest/mint, Delts/blue, and Legs/pink Apple Notes highlight controls.
2. Add a small versioned transport contract for the production PWA to hand off
   the selected/current `WorkoutSession` as JSON through the system clipboard,
   then launch a registered helper URL scheme. The handoff must include the
   real session rows, highlights, summary overrides, notes, local date, and a
   display date; it must not read or depend on `seed/latest-session.example.json`.
3. Add helper-side decoding/validation of that handoff and use the imported
   session when generating flat-RTFD. Keep the bundled fixture only for the
   isolated proof button and make the real-session action distinguishable.
4. From the helper's real-session action, write only `com.apple.flat-rtfd` to
   the native clipboard and open Apple Notes as far as a supported/reasonable
   iOS URL allows. If Notes cannot be opened, leave the clipboard prepared and
   surface an explicit manual-open/manual-paste instruction.
5. Keep the existing ordinary uncoloured PWA `Copy to Notes` path unchanged.
   Do not build a native Gym Logger rewrite, use the private Notes type, or
   silently replace a user's later legitimate session.
6. Ensure the helper's payload source is the PWA handoff for the real-session
   route. The production Tuesday `actual-2026-08-25` latest-session behavior
   remains governed by the existing migration and must not be changed by this
   task; the Sunday fixture is transport-test data only.

## Verification required

- Add deterministic tests for the JSON handoff schema, Unicode, exact session
  values/order/highlights/summary override, helper URL, fixture-vs-handoff
  source boundary, legend mappings/spaces, and the flat-RTFD/manual-paste
  action contract.
- Run focused/native checks, full PWA tests, production build, diff hygiene,
  and the hosted macOS/Xcode helper build.
- Do not claim direct manual-paste success until the target iPhone retests the
  new helper using a real production session.
- Report changed files and any iOS URL/installation limitation honestly.
