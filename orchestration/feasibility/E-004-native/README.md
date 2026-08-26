# E-004 native Apple Notes colour-helper proof

This folder is an isolated feasibility proof, not a native Gym Logger app and
not production code. It leaves the PWA and its normal `Copy to Notes` action
unchanged.

The helper now has an isolated inspection/replay flow. Copy a small coloured
table directly in Apple Notes, tap **Inspect Notes Clipboard**, and it records
the item/provider type identifiers, byte sizes, SHA-256 hashes, and permitted
raw payloads without mutating the clipboard. **Replay Captured Clipboard** puts
the captured representations back on the pasteboard unchanged as far as the
available iOS APIs allow. The report preserves the first-item pasteboard type
order, provider order, observed rich-type hints, and any unreadable/omitted
representations. The report can be shared from the helper.

The historical **Copy Gym Session to Pasteboard** action remains available for
comparison. It loads the exact canonical `seed/latest-session.example.json`
fixture and writes UTF-8 plain text, semantic coloured HTML, and a real RTF
table with Unicode escapes. That synthetic action is not evidence that Apple
Notes will preserve colours.

## Build/install boundary

The helper requires Xcode on macOS or another legitimate iOS development
installation route. This Windows workstation has no `swift` or `xcodebuild`
toolchain, so no IPA, compile result, or device result is fabricated here.

Open the isolated helper project on a Mac or install the hosted build through
the documented one-time device route, then run it on the target iPhone. First
copy a small Apple Notes table containing all five colours. In the helper tap
**Inspect Notes Clipboard**, share the report if needed, then tap **Replay
Captured Clipboard**. Switch to the existing `Gym` note and paste once.
Record whether the result is an editable table, preserves all five colours,
keeps the full data/order/summary/notes, and preserves `·`, `°`, curly
punctuation, and other Unicode.

The repository workflow
`.github/workflows/e004-native-helper.yml` builds the isolated Xcode project
on a hosted macOS runner with signing disabled and uploads a truthful unsigned
IPA/app artifact when compilation succeeds. A hosted build does not prove
iPhone installation or Apple Notes behavior. Signing and installation remain
a separate device/toolchain step; no paid Apple Developer membership is a v1
requirement.

If installation requires a paid Developer subscription or a recurring fragile
sideload process, record that burden and close E-004 rather than making it a v1
requirement.
