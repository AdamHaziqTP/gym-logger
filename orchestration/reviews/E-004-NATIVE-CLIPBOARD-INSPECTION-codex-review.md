# Codex review — E-004 native Apple Notes clipboard inspection

## Review disposition

`READY_FOR_TARGET_IPHONE_PROOF`

The isolated helper implementation is complete for the next feasibility
boundary. It is not an accepted Apple Notes colour solution and is not part of
the PWA production path.

## Independent checks

- [x] Canonical 40-row fixture remains bundled and matches the repository seed.
- [x] Existing synthetic plain/HTML/RTF payload builder remains isolated.
- [x] `Inspect Notes Clipboard` reads direct `UIPasteboard` items and modern
      pasteboard type order without mutating the clipboard.
- [x] `NSItemProvider.registeredTypeIdentifiers` are enumerated and provider
      data is loaded asynchronously where available.
- [x] Capture manifest records schema, item index, source, type identifier,
      value kind, byte length, SHA-256, raw-payload path, and omissions.
- [x] Raw payload capture is capped at 10 MB and shareable through the helper.
- [x] `Replay Captured Clipboard` reconstructs the captured items from saved
      representations and writes them back with `UIPasteboard.setItems`.
- [x] Xcode project references the new Swift source.
- [x] Hosted macOS/Xcode workflow is present and packages an unsigned artifact
      only after a real build succeeds.
- [x] First hosted workflow invocation reached Xcode; its target-plus-derived-
      data-path argument error was diagnosed and corrected in the workflow.
- [x] Second hosted workflow invocation reached the Xcode build graph; its
      nested-source/resource path error was diagnosed and corrected in the
      project file.
- [x] Third hosted workflow invocation compiled the project sources far enough
      to expose an actor-isolation error in the replay action; the view is now
      explicitly main-actor isolated.
- [x] Fourth hosted workflow invocation compiled the Swift helper successfully;
      its remaining failure was limited to the workflow's artifact lookup.
- [x] Fifth hosted workflow invocation passed Xcode compilation, unsigned IPA
      packaging, and artifact upload (`32925095555`). Codex downloaded the
      artifact and verified the app bundle and fixture inside the IPA.
- [x] PWA regression suite: 410/410 tests pass.
- [x] PWA production build passes.
- [x] Native platform-neutral harness: 18/18 checks pass.
- [x] `git diff --check` passes.
- [x] No `src/` or `public/` production files changed.
- [ ] Swift/Xcode compilation: not run on this Windows workstation.
- [x] Hosted macOS/Xcode compilation and unsigned packaging are verified by
      run `32925095555`.
- [ ] iOS installation: not run.
- [ ] Apple Notes editable-table, Unicode, or five-colour result: not run.

## OX execution

The fresh bounded OX invocation returned no output or delta and timed out. The
Codex fallback implementation is accepted only because the task-level protocol
allows fallback after a concrete worker timeout. The result is recorded in
`orchestration/reports/E-004-NATIVE-CLIPBOARD-INSPECTION-OX-ALPHA-REPORT.md`.

## Next boundary

Use the successful hosted artifact from run `32925095555` through a legitimate
iOS test-signing/install route, then issue the one target-iPhone
inspection/replay gate. Do not infer colour support from the hosted build or
from the native payload source.
