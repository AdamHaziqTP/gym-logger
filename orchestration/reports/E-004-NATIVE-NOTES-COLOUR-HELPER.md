# E-004 — native Apple Notes colour-helper feasibility report

Date: 2026-08-25
Status: `SOURCE_PROOF_COMPLETE; DEVICE_PROOF_BLOCKED_BY_TOOLCHAIN`

## Trigger

The target iPhone physically failed M03-T03 Shortcuts: flattened plain text,
no colours, and UTF-8 mojibake (`Â·`, `Â°`). The Shortcuts branch is closed.
E-004 authorizes exactly one isolated native pasteboard proof.

## Worker execution

OX Alpha was dispatched through the verified DSH Desktop headless wrapper for
the bounded E-004 task. It produced no output, report, or repository delta in
the bounded 90-second window and was terminated. Codex fallback implementation
was used; no production PWA files were changed.

## Proof produced

`orchestration/feasibility/E-004-native/` contains a minimal SwiftUI iOS
helper project with one button. It loads a bundled copy of the exact
40-row canonical seed fixture and writes one `UIPasteboard` item containing:

- native `public.utf8-plain-text` Unicode;
- UTF-8 semantic `public.html` with the five category colours;
- ASCII-safe `public.rtf` with a real table, colour table, and `\\uN?`
  Unicode escapes.

The helper is isolated and does not alter the PWA, its normal Copy to Notes
path, or the failed Shortcuts route. It does not automate Apple Notes and does
not claim a paste result.

## Independent verification

- Native source/fixture/project harness: **12/12 checks passed**.
- Canonical fixture equality: **pass**; 40 rows, 40/39 override, all five
  categories, and Unicode evidence retained.
- Existing PWA full suite: **359/359 passed**.
- Existing PWA production build: **passed**.
- `git diff --check`: **passed**.
- Swift/Xcode compilation: **not run**. `swift` and `xcodebuild` are not
  installed on this Windows workstation.

## Acceptance boundary

This is not yet `READY_FOR_TARGET_IPHONE_PROOF`, because Codex cannot honestly
verify compilation, signing, installation, or the paste on the target iPhone
from this workstation. The next step requires a legitimate Mac/Xcode or other
valid iOS build/install route. If that route requires a paid Developer
subscription or a recurring fragile sideload workflow, close E-004 and retain
the accepted uncoloured editable-table PWA path. Do not start another native
pasteboard-format experiment.
