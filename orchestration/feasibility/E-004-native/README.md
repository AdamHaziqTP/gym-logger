# E-004 native Apple Notes colour-helper proof

This folder is an isolated feasibility proof, not a native Gym Logger app and
not production code. It leaves the PWA and its normal `Copy to Notes` action
unchanged.

The helper has one action. It loads the exact canonical
`seed/latest-session.example.json` fixture and writes one native iOS
`UIPasteboard` item containing UTF-8 plain text, semantic coloured HTML, and a
real RTF table with Unicode escapes. Apple Notes chooses which representation
it imports; this source does not claim the result is successful.

## Build/install boundary

The helper requires Xcode on macOS or another legitimate iOS development
installation route. This Windows workstation has no `swift` or `xcodebuild`
toolchain, so no IPA, compile result, or device result is fabricated here.

Open the isolated helper project on a Mac, run it on the target iPhone, tap
**Copy Gym Session to Pasteboard**, switch to the existing `Gym` note, and
paste once. Record whether the result is an editable table, preserves all five
colours, keeps the full 40-row data/order/summary/notes, and preserves `·`,
`°`, curly punctuation, and other Unicode.

If installation requires a paid Developer subscription or a recurring fragile
sideload process, record that burden and close E-004 rather than making it a v1
requirement.
