# E-004 — native Apple Notes clipboard inspection and exact replay

## Role

You are OX Alpha, the bounded implementation worker. Build the next isolated
native feasibility proof under `orchestration/feasibility/E-004-native/`.
Codex independently audits the diff, runs all available checks, and decides
whether the proof is ready for one iPhone 14 Pro Max test.

## Authoritative result and boundaries

- M03-T06 physically preserved the editable Notes table and all fixture data,
  but exact Apple Notes HTML replay stripped every category colour. Evidence:
  `orchestration/evidence/HUMAN-VERIFICATION-M03-T06-EXACT-NOTES-HTML-REPLAY.md`.
- Do not perform more HTML/CSS/Apple-class/colour-token experiments.
- Keep the production PWA, `src/`, ordinary `Copy to Notes`, and all existing
  accepted v1 behavior unchanged.
- This is one bounded native inspection/replay feasibility proof, not a native
  Gym Logger rewrite, backend, App Store product, or paid Developer project.
- Preserve the user's existing uncommitted edits in
  `orchestration/product-orchestrator/WORKFLOW_SPEC.md` and
  `orchestration/product-orchestrator/bootstrap.mjs`.

## Required helper behavior

Extend the existing minimal iOS helper with a separate inspection/replay flow.
Keep the current synthetic copy action only as historical context; do not
claim it proves Notes compatibility.

1. **Inspect Notes Clipboard**
   - The user copies a small coloured table directly in Apple Notes, then
     opens the helper and taps this action.
   - Enumerate `UIPasteboard.general.items`, `pasteboardTypes`, and
     `NSItemProvider.registeredTypeIdentifiers` where available.
   - Preserve fidelity/order and record each type identifier, byte length, and
     SHA-256 hash. Inspect/load data asynchronously where providers require it.
   - Look specifically for `public.rtf`, `com.apple.rtfd`,
     `com.apple.flat-rtfd`, `public.html`/`text/html`, webarchive,
     attributed-string-compatible data, and Apple-private types.
   - Export a JSON metadata report plus raw payload files only where the system
     permits it. Cap or omit unsafe/unreadable payloads and say so in the
     report. Do not mutate the clipboard during inspection.

2. **Replay Captured Clipboard**
   - Preserve the captured item as exactly as possible, including all captured
     representations, and write it back to `UIPasteboard.general`.
   - Give the user a simple share/export action for the capture artifact and a
     clear instruction to paste once into the existing `Gym` note.
   - Never claim editable-table or colour success without the target-iPhone
     paste result.

3. **Bounded representation removal**
   - Add removal-test support only if the exact captured replay can be tested.
   - Do not start synthetic payload generation or guess private Notes formats.

## Hosted build route

Add a `workflow_dispatch` GitHub Actions workflow using a hosted macOS/Xcode
runner. It must build the existing Xcode project, surface compile/signing
failures clearly, and upload a truthful unsigned/resignable app/IPA artifact
when feasible. Do not fabricate an IPA. Document that a hosted build does not
prove iPhone installation or Apple Notes behavior and that free Personal Team
signing/SideStore remains a one-time human setup if applicable.

## Verification requirements

- Extend the platform-neutral harness to pin inspection/replay contracts and
  ensure the existing 40-row fixture/Unicode is still intact.
- Verify the Xcode project references every new Swift source/resource.
- Verify no production PWA files changed.
- Run the native harness and report the actual local toolchain status.
- Keep all target-device claims as `PENDING` until the iPhone proof.

## Stop condition

Return an honest `READY_FOR_TARGET_IPHONE_PROOF` only when the isolated helper
and build route are independently verified. If hosted compilation or signing
is unavailable, record the exact infrastructure blocker and leave the proof
ready for that route; do not close E-004 or infer colour support.

## Codex checkpoint — 2026-08-26

The fresh OX Alpha dispatch timed out without output or delta; the result is
recorded in `orchestration/reports/E-004-NATIVE-CLIPBOARD-INSPECTION-OX-ALPHA-REPORT.md`.
Codex fallback implemented and independently verified the isolated inspection
and replay flow. Hosted run `32925095555` compiled and packaged the unsigned
IPA successfully. The task is now `READY_FOR_TARGET_IPHONE_PROOF`; the only
remaining action is legitimate iOS installation followed by the single
physical Notes copy/inspect/replay/paste result.
