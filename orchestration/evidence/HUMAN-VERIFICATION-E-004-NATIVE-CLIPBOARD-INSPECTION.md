# E-004 native Apple Notes clipboard inspection/replay

Status: `HUMAN_REVIEW_REQUIRED — SIGNING/INSTALLATION AND DEVICE PASTE PENDING`

This is the single physical gate for the bounded E-004 colour-recovery proof.
No Apple Notes result is claimed from the Swift source, desktop harness, or a
hosted macOS build.

## Why this gate exists

M03-T06 proved that replaying the complete Apple Notes-generated HTML through
Safari preserves the editable table/content but strips all five colours. E-004
now inspects the native pasteboard produced by Apple Notes and replays the
captured representations unchanged as far as iOS permits.

## Test when the helper is installed on the iPhone 14 Pro Max

1. In Apple Notes, copy a small editable table containing the five categories:
   Arms, Back, Chest, Delts, and Legs. Include one uncoloured row and values
   such as `30°`, `8,6`, curly punctuation, and a multiline note.
2. Open **Gym Logger Pasteboard Proof** and tap **Inspect Notes Clipboard**.
3. Confirm the helper reports a capture and optionally use **Share Capture
   Report and Raw Payloads** to send the manifest for inspection.
4. Tap **Replay Captured Clipboard**.
5. Open the existing `Gym` note and paste once.

Record separately:

- editable table structure;
- all five category colours;
- row order, values, date, summary, and notes;
- Unicode fidelity without mojibake;
- any type identifiers or raw payloads that were omitted.

Only the actual paste result can identify whether a native representation
preserves the colours. If exact replay succeeds, a later bounded removal test
may identify the minimum representation. Do not synthesize a Gym Logger native
payload before that result exists.

## Build boundary

The repository contains `.github/workflows/e004-native-helper.yml`, which
builds the isolated Xcode project on a hosted macOS runner with signing
disabled and uploads an unsigned/resignable artifact when compilation
succeeds. A hosted build does not prove installation or Notes behavior. The
artifact is unsigned, so it still needs a legitimate iOS test-signing/install
route such as a configured free-account device-test flow. No paid Apple
Developer membership is required or authorized by this proof.

The successful hosted build is run `32925095555`:
https://github.com/AdamHaziqTP/gym-logger/actions/runs/32925095555

Download the `GymLoggerPasteboardHelper-unsigned` artifact from that run. The
repository-side check confirmed the IPA contains the helper app and bundled
fixture. This is the only remaining human/toolchain gate for E-004; the hosted
build itself is not a colour result.
