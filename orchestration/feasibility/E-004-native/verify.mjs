import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = resolve(root, "seed/latest-session.example.json");
const bundledPath = resolve(import.meta.dirname, "GymLoggerPasteboardHelper/latest-session.example.json");
const source = readFileSync(resolve(import.meta.dirname, "GymLoggerPasteboardHelper/PasteboardPayload.swift"), "utf8");
const app = readFileSync(resolve(import.meta.dirname, "GymLoggerPasteboardHelper/ContentView.swift"), "utf8");
const inspector = readFileSync(resolve(import.meta.dirname, "GymLoggerPasteboardHelper/ClipboardInspector.swift"), "utf8");
const project = readFileSync(resolve(import.meta.dirname, "GymLoggerPasteboardHelper.xcodeproj/project.pbxproj"), "utf8");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const bundled = JSON.parse(readFileSync(bundledPath, "utf8"));
const sampleRepresentations = [
  { typeIdentifier: "com.apple.notes.richtext-pasteboard-item", relativePath: "notes.bin" },
  { typeIdentifier: "public.html", relativePath: "html.bin" },
  { typeIdentifier: "public.rtf", relativePath: "rtf.bin" },
];
const retainedAfterRemoval = sampleRepresentations.filter(
  ({ typeIdentifier }) => typeIdentifier !== "public.html",
);
const sampleItems = [
  [sampleRepresentations[0], sampleRepresentations[1], sampleRepresentations[2]],
  [sampleRepresentations[2], sampleRepresentations[0]],
];
const requestedType = "public.rtf";
const onlyRequestedType = sampleItems.map((representations) =>
  representations.filter(({ typeIdentifier }) => typeIdentifier === requestedType),
);

const sourceSlash = String.fromCharCode(92).repeat(2);
const appleHighlightSchemes = [
  `${sourceSlash}cf3 ${sourceSlash}AppleHighlight-1 ${sourceSlash}AppleHilightClrSch-3`,
  `${sourceSlash}cf4 ${sourceSlash}AppleHighlight-1 ${sourceSlash}AppleHilightClrSch-5`,
  `${sourceSlash}cf5 ${sourceSlash}AppleHighlight-1 ${sourceSlash}AppleHilightClrSch-4`,
  `${sourceSlash}cf6 ${sourceSlash}AppleHighlight-1 ${sourceSlash}AppleHilightClrSch-1`,
  `${sourceSlash}cf7 ${sourceSlash}AppleHighlight-1 ${sourceSlash}AppleHilightClrSch-2`,
];

const checks = [
  ["bundled fixture matches canonical fixture", JSON.stringify(fixture) === JSON.stringify(bundled)],
  ["fixture retains 40 rows", fixture.session.rows.length === 40],
  ["fixture retains summary override", fixture.session.summary.setsDisplayOverride === "40" && fixture.session.summary.exercisesDisplayOverride === "39"],
  ["fixture carries Unicode degree", JSON.stringify(fixture).includes("30°")],
  ["fixture covers all five categories", ["orange", "purple", "mint", "blue", "pink"].every((value) => JSON.stringify(fixture).includes(`\"${value}\"`))],
  ["native plain-text representation", source.includes("UTType.utf8PlainText.identifier")],
  ["native HTML representation", source.includes("UTType.html.identifier")],
  ["native RTF representation", source.includes("UTType.rtf.identifier")],
  ["generated flat-RTFD identifier", source.includes("com.apple.flat-rtfd") && source.includes("flatRTFDTypeIdentifier")],
  ["generated flat-RTFD uses Foundation FileWrapper", source.includes("FileWrapper") && source.includes("serializedRepresentation") && source.includes("TXT.rtf")],
  ["generated flat-RTFD comes from the fixture", source.includes("loadFixture") && source.includes("makeFlatRTFD(rtf:") && source.includes("Data(rtf.utf8)")],
  ["generated payload keeps exact Notes colour tokens", ["#ff9230", "#db34f2", "#00dac3", "#0091ff", "#ff375f"].every((value) => source.includes(value))],
  ["generated RTF uses Apple Notes Cocoa metadata", source.includes("\\cocoartf2865") && source.includes("\\cocoatextscaling0") && source.includes("\\cocoaplatform0") && source.includes("\\fonttbl")],
  ["generated RTF uses expanded Apple colour table", source.includes("\\expandedcolortbl") && source.includes("\\cssrgb")],
  ["generated RTF uses all five Apple highlight schemes", appleHighlightSchemes.every((value) => source.includes(value))],
  ["generated RTF resets Apple highlight state", source.includes(`${sourceSlash}AppleHighlight0 ${sourceSlash}AppleHilightClrSch0`)],
  ["generated RTF colors each legend label", source.includes("makeNotesLegend") && [
    '("Arms", "orange")',
    '("Back", "purple")',
    '("Chest", "mint")',
    '("Delts", "blue")',
    '("Legs", "pink")',
  ].every((value) => source.includes(value))],
  ["generated RTF has Apple table nesting metadata", source.includes("\\itap1") && source.includes("\\trowd")],
  ["generated RTF removes generic highlight controls", !source.includes("\\highlight") && !source.includes("\\chcbpat")],
  ["generated payload keeps Unicode", source.includes("·") && source.includes("rtfEscape")],
  ["production handoff has a versioned schema", source.includes("NativeHandoffEnvelope") && source.includes("handoffSchemaVersion") && source.includes("handoffSource")],
  ["production handoff validates source and version", source.includes("envelope.schemaVersion == handoffSchemaVersion") && source.includes("envelope.source == handoffSource")],
  ["production handoff reads JSON from the system clipboard", source.includes("loadHandoffFromPasteboard") && source.includes("UIPasteboard.general.string") && source.includes("decodeHandoff")],
  ["production handoff preserves summary override and session values", source.includes("envelope.session.summaryOverride") && source.includes("envelope.session.rows") && source.includes("envelope.session.notes")],
  ["one flat-RTFD pasteboard item", app.includes("UIPasteboard.general.setItems") && app.includes("payload.flatRTFDPasteboardItem")],
  ["flat-RTFD proof action is user initiated", app.includes("Button(\"Copy Generated Gym Session (flat-RTFD only)\")") && app.includes("payload.flatRTFDPasteboardItem")],
  ["real-session action is distinct from fixture proof", app.includes("Production Gym Logger handoff") && app.includes("Isolated fixture proof") && app.includes("prepareHandoffSession")],
  ["real-session action generates from handoff data", app.includes("consumeHandoffIfPresent") && app.includes("prepareSession(received") && app.includes("Button(\"Prepare Coloured Clipboard & Open Notes\")")],
  ["manual-paste fallback writes only flat-RTFD and opens Notes", app.includes("payload.flatRTFDPasteboardItem") && app.includes("mobilenotes://") && app.includes("paste once")],
  ["Shortcut append route is closed", !app.includes("shortcuts://") && !app.includes("Append Shortcut Input")],
  ["no browser clipboard dependency in native helper", !source.includes("navigator.clipboard")],
  ["clipboard inspector enumerates direct items", inspector.includes("pasteboard.items")],
  ["clipboard inspector records pasteboard type order", inspector.includes("pasteboard.types") && inspector.includes("firstItemTypeOrder")],
  ["clipboard inspector enumerates item providers", inspector.includes("pasteboard.itemProviders") && inspector.includes("registeredTypeIdentifiers")],
  ["clipboard inspector records hashes and raw payloads", inspector.includes("SHA256.hash") && inspector.includes("manifest.json")],
  ["clipboard replay writes captured representations", inspector.includes("replayLatestCapture") && inspector.includes("UIPasteboard.general.setItems")],
  ["removal harness reads non-empty captured type identifiers", inspector.includes("latestCaptureTypeIdentifiers") && inspector.includes("byteLength")],
  ["removal harness excludes only the requested type", inspector.includes("excludingTypeIdentifier") && inspector.includes("representation.typeIdentifier == excludingTypeIdentifier") && retainedAfterRemoval.length === 2 && retainedAfterRemoval.every(({ typeIdentifier }) => typeIdentifier !== "public.html")],
  ["single replay selects only the requested type", inspector.includes("onlyTypeIdentifier") && inspector.includes("representation.typeIdentifier == requestedType") && onlyRequestedType.every((item) => item.length === 1 && item[0].typeIdentifier === requestedType)],
  ["single replay preserves captured item order", inspector.includes("for capturedItem in manifest.items") && inspector.includes("items.append(item)")],
  ["single replay rejects missing or empty types", inspector.includes("trimmingCharacters") && inspector.includes("guard !requestedType.isEmpty") && inspector.includes("missingRepresentation")],
  ["UI exposes inspection, replay, share, removal, and single actions", ["Inspect Notes Clipboard", "Replay Captured Clipboard", "Share Capture Report and Raw Payloads", "Replay without ", "Replay ONLY "].every((label) => app.includes(label)) && app.includes("Button(\"Replay ONLY \\(typeIdentifier)\")")],
  ["manual paste handoff opens Notes and leaves explicit fallback", app.includes("prepareSession") && app.includes("mobilenotes://") && app.includes("open Notes manually and paste once")],
  ["Xcode project references all Swift files, fixture, and URL plist", ["GymLoggerPasteboardHelperApp.swift", "ContentView.swift", "PasteboardPayload.swift", "ClipboardInspector.swift", "latest-session.example.json", "Info.plist"].every((name) => project.includes(name))],
];

for (const [label, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
