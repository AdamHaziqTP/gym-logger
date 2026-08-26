import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "..");
const iosRoot = resolve(root, "orchestration", "ios", "GymLogger");
const project = readFileSync(resolve(iosRoot, "GymLogger.xcodeproj", "project.pbxproj"), "utf8");
const plist = readFileSync(resolve(iosRoot, "GymLogger", "Info.plist"), "utf8");
const native = readFileSync(resolve(iosRoot, "GymLogger", "GymLoggerWebView.swift"), "utf8");
const app = readFileSync(resolve(iosRoot, "GymLogger", "GymLoggerApp.swift"), "utf8");
const bridge = readFileSync(resolve(root, "src", "domain", "embeddedNativeBridge.ts"), "utf8");
const sessionView = readFileSync(resolve(root, "src", "components", "SessionView.tsx"), "utf8");
const notesClipboard = readFileSync(resolve(root, "src", "domain", "notesClipboard.ts"), "utf8");
const migration = readFileSync(resolve(root, "src", "data", "actualSessionMigration.ts"), "utf8");
const workflow = readFileSync(resolve(root, ".github", "workflows", "gym-logger-ipa.yml"), "utf8");

const checks = [
  ["one-app Xcode target", project.includes("name = GymLogger") && project.includes("GymLogger.app")],
  ["bundled web-app resource", project.includes("WebApp") && project.includes("WebApp in Resources")],
  ["shared proven Notes generator", project.includes("../../feasibility/E-004-native/GymLoggerPasteboardHelper/PasteboardPayload.swift") && native.includes("NativePayloadBuilder")],
  ["native in-process message handler", native.includes("gymLoggerNative") && native.includes("WKScriptMessageHandler")],
  ["native coloured handoff", native.includes("prepareColouredNotes") && native.includes("flatRTFDPasteboardItem")],
  ["native ordinary Notes fallback", native.includes("copyNotesPayload") && native.includes("UTType.html.identifier")],
  ["local bundled web transport", native.includes("WKURLSchemeHandler") && native.includes("gymlogger://app/") && native.includes("WebApp")],
  ["Gym Logger SwiftUI shell", app.includes("struct GymLoggerApp") && app.includes("GymLoggerWebView()")],
  ["embedded bridge action contract", bridge.includes("prepareColouredNotes") && bridge.includes("copyNotesPayload")],
  ["coloured action prefers in-process bridge", sessionView.includes("sendNativeHandoffToEmbeddedBridge(visibleSession)")],
  ["ordinary Copy to Notes prefers native bridge", notesClipboard.includes("writeNotesPayloadToEmbeddedNative(payload)")],
  ["Tuesday migration remains in web app", migration.includes("migrateActualSession") && migration.includes("ACTUAL_SESSION_2026-08-25.json")],
  ["app plist identity", plist.includes("CFBundleExecutable") && plist.includes("CFBundleIdentifier") && plist.includes("CFBundlePackageType") && plist.includes("Gym Logger")],
  ["app plist branding", plist.includes("GymLoggerIcon-192") && plist.includes("GymLoggerIcon-512")],
  ["workflow builds web app first", workflow.includes("npm ci") && workflow.includes("npm run build") && workflow.includes("Stage bundled web app")],
  ["workflow builds iOS target", workflow.includes("-target GymLogger") && workflow.includes("-sdk iphoneos")],
  ["workflow verifies IPA identity", workflow.includes("CFBundleExecutable") && workflow.includes('test "$executable" = "GymLogger"') && workflow.includes("GymLoggerIcon-512")],
  ["WebApp source directory tracked", existsSync(resolve(iosRoot, "GymLogger", "WebApp", ".gitkeep"))],
];

for (const [label, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
