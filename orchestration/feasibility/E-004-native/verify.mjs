import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "..", "..");
const fixturePath = resolve(root, "seed/latest-session.example.json");
const bundledPath = resolve(import.meta.dirname, "GymLoggerPasteboardHelper/latest-session.example.json");
const source = readFileSync(resolve(import.meta.dirname, "GymLoggerPasteboardHelper/PasteboardPayload.swift"), "utf8");
const app = readFileSync(resolve(import.meta.dirname, "GymLoggerPasteboardHelper/ContentView.swift"), "utf8");
const project = readFileSync(resolve(import.meta.dirname, "GymLoggerPasteboardHelper.xcodeproj/project.pbxproj"), "utf8");
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
const bundled = JSON.parse(readFileSync(bundledPath, "utf8"));

const checks = [
  ["bundled fixture matches canonical fixture", JSON.stringify(fixture) === JSON.stringify(bundled)],
  ["fixture retains 40 rows", fixture.session.rows.length === 40],
  ["fixture retains summary override", fixture.session.summary.setsDisplayOverride === "40" && fixture.session.summary.exercisesDisplayOverride === "39"],
  ["fixture carries Unicode degree", JSON.stringify(fixture).includes("30°")],
  ["fixture covers all five categories", ["orange", "purple", "mint", "blue", "pink"].every((value) => JSON.stringify(fixture).includes(`\"${value}\"`))],
  ["native plain-text representation", source.includes("UTType.utf8PlainText.identifier")],
  ["native HTML representation", source.includes("UTType.html.identifier")],
  ["native RTF representation", source.includes("UTType.rtf.identifier")],
  ["one pasteboard item", app.includes("UIPasteboard.general.setItems") && app.includes("payload.pasteboardItem")],
  ["copy action is user initiated", app.includes("Button(\"Copy Gym Session to Pasteboard\")")],
  ["no PWA source dependency", !source.includes("src/") && !app.includes("navigator.clipboard")],
  ["Xcode project references the three Swift files and fixture", ["GymLoggerPasteboardHelperApp.swift", "ContentView.swift", "PasteboardPayload.swift", "latest-session.example.json"].every((name) => project.includes(name))],
];

for (const [label, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
