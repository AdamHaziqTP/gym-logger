import Foundation
import UIKit
import UniformTypeIdentifiers

struct FixtureFile: Decodable { let session: FixtureSession }

/// The production PWA sends this small envelope as plain JSON to the helper.
/// The helper intentionally ignores transport-only fields such as id and
/// timestamps; the visible workout content remains the source of truth.
struct NativeHandoffEnvelope: Decodable {
    let schemaVersion: Int
    let source: String
    let displayDate: String
    let session: NativeHandoffSession
}

struct NativeHandoffSession: Decodable {
    let dateLocal: String
    let rows: [FixtureRow]
    let notes: String
    let summaryOverride: NativeHandoffSummaryOverride?
}

struct NativeHandoffSummaryOverride: Decodable {
    let sets: String?
    let exercises: String?
}

struct FixtureSession: Decodable {
    let dateLocal: String
    let displayDate: String
    let summary: FixtureSummary
    let rows: [FixtureRow]
    let notes: String
}

struct FixtureSummary: Decodable {
    let setsDisplayOverride: String?
    let exercisesDisplayOverride: String?
}

struct FixtureRow: Decodable {
    let position: Int
    let exercise: String
    let sets: String
    let reps: String
    let weight: String
    let skip: String
    let highlight: String
}

struct NativePasteboardPayload {
    let plainText: String
    let html: String
    let rtf: String
    let flatRTFD: Data

    static let flatRTFDTypeIdentifier = "com.apple.flat-rtfd"

    var pasteboardItem: [String: Any] {
        [
            UTType.utf8PlainText.identifier: plainText,
            UTType.html.identifier: Data(html.utf8),
            UTType.rtf.identifier: Data(rtf.utf8),
            Self.flatRTFDTypeIdentifier: flatRTFD,
        ]
    }

    var flatRTFDPasteboardItem: [String: Any] {
        [Self.flatRTFDTypeIdentifier: flatRTFD]
    }
}

enum NativePayloadError: LocalizedError {
    case invalidHandoff
    case unsupportedHandoff
    case flatRTFDSerializationFailed

    var errorDescription: String? {
        switch self {
        case .invalidHandoff:
            return "The Gym Logger handoff is not valid JSON for this helper."
        case .unsupportedHandoff:
            return "This Gym Logger handoff version or source is not supported."
        case .flatRTFDSerializationFailed:
            return "The generated flat-RTFD container could not be serialized."
        }
    }
}

enum NativePayloadBuilder {
    static let handoffSchemaVersion = 1
    static let handoffSource = "gym-logger-pwa"
    private static let categories = ["Arms", "Back", "Chest", "Delts", "Legs"]
    private static let foreground: [String: String] = [
        "orange": "#ff9230", "purple": "#db34f2", "mint": "#00dac3",
        "blue": "#0091ff", "pink": "#ff375f",
    ]
    private static let opaqueBackground: [String: String] = [
        "orange": "#261802", "purple": "#1f0e27", "mint": "#0f201f",
        "blue": "#021529", "pink": "#260809",
    ]
    private static let notesLegend: [(label: String, highlight: String)] = [
        ("Arms", "orange"),
        ("Back", "purple"),
        ("Chest", "mint"),
        ("Delts", "blue"),
        ("Legs", "pink"),
    ]

    static func loadFixture() throws -> FixtureSession {
        guard let url = Bundle.main.url(forResource: "latest-session.example", withExtension: "json") else {
            throw NSError(domain: "GymLoggerPasteboardHelper", code: 1)
        }
        return try JSONDecoder().decode(FixtureFile.self, from: Data(contentsOf: url)).session
    }

    static func decodeHandoff(_ text: String) throws -> FixtureSession {
        guard let data = text.data(using: .utf8) else {
            throw NativePayloadError.invalidHandoff
        }
        let envelope: NativeHandoffEnvelope
        do {
            envelope = try JSONDecoder().decode(NativeHandoffEnvelope.self, from: data)
        } catch {
            throw NativePayloadError.invalidHandoff
        }
        guard envelope.schemaVersion == handoffSchemaVersion,
              envelope.source == handoffSource,
              !envelope.displayDate.isEmpty,
              !envelope.session.dateLocal.isEmpty else {
            throw NativePayloadError.unsupportedHandoff
        }
        return FixtureSession(
            dateLocal: envelope.session.dateLocal,
            displayDate: envelope.displayDate,
            summary: FixtureSummary(
                setsDisplayOverride: envelope.session.summaryOverride?.sets,
                exercisesDisplayOverride: envelope.session.summaryOverride?.exercises
            ),
            rows: envelope.session.rows,
            notes: envelope.session.notes
        )
    }

    /// Reads only the transport JSON written by the production PWA. Once a
    /// generated payload is prepared the clipboard no longer has this string,
    /// so returning to the app cannot accidentally re-run the handoff.
    static func loadHandoffFromPasteboard() throws -> FixtureSession? {
        guard let text = UIPasteboard.general.string, !text.isEmpty else {
            return nil
        }
        guard text.contains("\"schemaVersion\"") && text.contains("\"gym-logger-pwa\"") else {
            return nil
        }
        return try decodeHandoff(text)
    }

    static func makePayload(session: FixtureSession) throws -> NativePasteboardPayload {
        let rows = session.rows.sorted { $0.position < $1.position }
        let sets = session.summary.setsDisplayOverride ?? ""
        let exercises = session.summary.exercisesDisplayOverride ?? ""
        let summary = "\(sets) sets · \(exercises) exercises"
        let header = "Category\tExercise\tSets\tReps\tWeight\tSkip"
        let textRows = rows.map { row in
            [categoryLabel(row.highlight), row.exercise, row.sets, row.reps, row.weight, row.skip].joined(separator: "\t")
        }
        let plain = ([session.displayDate, "", categories.joined(separator: " "), "", summary, "", header] + textRows + ["", "Notes", session.notes]).joined(separator: "\n")
        let generatedRTF = makeRTF(session: session, rows: rows, summary: summary)
        return NativePasteboardPayload(
            plainText: plain,
            html: makeHTML(session: session, rows: rows, summary: summary),
            rtf: generatedRTF,
            flatRTFD: try makeFlatRTFD(rtf: generatedRTF)
        )
    }

    private static func categoryLabel(_ highlight: String) -> String {
        switch highlight {
        case "orange": return "Arms"
        case "purple": return "Back"
        case "mint": return "Chest"
        case "blue": return "Delts"
        case "pink": return "Legs"
        default: return ""
        }
    }

    private static func htmlEscape(_ value: String) -> String {
        value.replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
            .replacingOccurrences(of: "\"", with: "&quot;")
            .replacingOccurrences(of: "'", with: "&#39;")
            .replacingOccurrences(of: "\n", with: "<br />")
    }

    private static func makeHTML(session: FixtureSession, rows: [FixtureRow], summary: String) -> String {
        let body = rows.map { row in
            let fg = foreground[row.highlight] ?? "#f2f2f7"
            let bg = opaqueBackground[row.highlight] ?? "#000000"
            let cells = [row.exercise, row.sets, row.reps, row.weight, row.skip]
                .map { "<td style=\"padding:4px 8px;color:\(fg);background-color:\(bg)\">\(htmlEscape($0))</td>" }
                .joined()
            return "<tr>\(cells)</tr>"
        }.joined()
        let headings = ["Exercise", "Sets", "Reps", "Weight", "Skip"].map { "<th>\($0)</th>" }.joined()
        return "<!doctype html><html><head><meta charset=\"utf-8\"></head><body style=\"background:#000;color:#f2f2f7\"><p><strong>\(htmlEscape(session.displayDate))</strong></p><p>\(categories.joined(separator: " "))</p><p>\(htmlEscape(summary))</p><table style=\"border-collapse:collapse\"><thead><tr>\(headings)</tr></thead><tbody>\(body)</tbody></table><p><strong>Notes</strong></p><p>\(htmlEscape(session.notes))</p></body></html>"
    }

    private static func rtfEscape(_ value: String) -> String {
        var output = ""
        for unit in value.utf16 {
            switch unit {
            case 0x5c: output += "\\\\"
            case 0x7b: output += "\\{"
            case 0x7d: output += "\\}"
            case 0x09: output += "\\tab "
            case 0x20...0x7e: output.append(Character(UnicodeScalar(unit)!))
            default:
                let signed = unit > 0x7fff ? Int(unit) - 0x10000 : Int(unit)
                output += "\\u\(signed)?"
            }
        }
        return output
    }

    private static func rgb(_ hex: String) -> String {
        let value = Int(hex.dropFirst(), radix: 16) ?? 0
        return "\\red\((value >> 16) & 255)\\green\((value >> 8) & 255)\\blue\(value & 255)"
    }

    private static func notesHighlightPrefix(for highlight: String) -> String {
        switch highlight {
        case "orange": return "\\cf3 \\AppleHighlight-1 \\AppleHilightClrSch-3 "
        case "blue": return "\\cf4 \\AppleHighlight-1 \\AppleHilightClrSch-5 "
        case "mint": return "\\cf5 \\AppleHighlight-1 \\AppleHilightClrSch-4 "
        case "purple": return "\\cf6 \\AppleHighlight-1 \\AppleHilightClrSch-1 "
        case "pink": return "\\cf7 \\AppleHighlight-1 \\AppleHilightClrSch-2 "
        default: return "\\cf2 \\AppleHighlight0 \\AppleHilightClrSch0 "
        }
    }

    private static let notesHighlightReset = "\\AppleHighlight0 \\AppleHilightClrSch0"

    private static func makeNotesLegend() -> String {
        notesLegend.map { entry in
            "\(notesHighlightPrefix(for: entry.highlight))\(rtfEscape(entry.label))\(notesHighlightReset)"
        // Each coloured label is a separate RTF run. A non-breaking-space
        // control keeps the visible separators when Notes normalizes those
        // runs during paste; a literal separator was previously dropped by
        // the Shortcut append path.
        }.joined(separator: "\\~")
    }

    private static func makeRTF(session: FixtureSession, rows: [FixtureRow], summary: String) -> String {
        // These indices and Apple-specific controls mirror the RTF semantics
        // observed in a Notes-origin flat-RTFD capture. The session values
        // themselves are always generated from the Gym Logger fixture.
        let colours = [
            "#000000", "#ffffff", "#ff9230", "#0091ff", "#00dac3",
            "#db34f2", "#ff375f",
        ]
        let colourTable = "{\\colortbl;\(colours.map(rgb).joined(separator: ";"));}"
        let expandedColourTable = "{\\*\\expandedcolortbl;\\cssrgb\\c0\\c0\\c0;\\cssrgb\\c100000\\c100000\\c100000;\\cssrgb\\c100000\\c57255\\c18824;\\cssrgb\\c0\\c56863\\c100000;\\cssrgb\\c0\\c85490\\c76471;\\cssrgb\\c85882\\c20392\\c94902;\\cssrgb\\c100000\\c21569\\c37255;}"
        let fontTable = "{\\fonttbl\\f0\\fswiss\\fcharset0 Helvetica;\\f1\\fnil\\fcharset0 UICTFontTextStyleBody;}"
        let bounds = "\\trowd\\itap1\\trgaph80\\trleft0\\clvertalt\\cellx1100\\cellx2600\\cellx3900\\cellx5400\\cellx7000"
        let header = ["Exercise", "Sets", "Reps", "Weight", "Skip"].map {
            "\\intbl{\\f1\\fs28\\cf2 \\AppleHighlight0 \\AppleHilightClrSch0\\b \(rtfEscape($0))\\b0 \(notesHighlightReset)}\\cell"
        }.joined()
        let body = rows.map { row in
            let cells = [row.exercise, row.sets, row.reps, row.weight, row.skip]
                .map { "\\intbl{\\f1\\fs28\(notesHighlightPrefix(for: row.highlight))\(rtfEscape($0)) \(notesHighlightReset)}\\cell" }
                .joined()
            return "\(bounds)\(cells)\\row"
        }.joined(separator: "\n")
        return "{\\rtf1\\ansi\\ansicpg1252\\cocoartf2865\\cocoatextscaling0\\cocoaplatform0\\deff0\(fontTable)\(colourTable)\(expandedColourTable)\\margl720\\margr720\\vieww12000\\viewh16000\\pard\\itap0\\f1\\fs28\\cf2 \\AppleHighlight0 \\AppleHilightClrSch0\\b \(rtfEscape(session.displayDate))\\b0\\par\\pard \(makeNotesLegend())\\par\\pard \(rtfEscape(summary))\\par\(bounds)\(header)\\row\n\(body)\\pard\\itap0\\f1\\fs28\\cf2 \\AppleHighlight0 \\AppleHilightClrSch0\\b Notes\\b0\\par\(rtfEscape(session.notes))}"
    }

    private static func makeFlatRTFD(rtf: String) throws -> Data {
        let textFile = FileWrapper(regularFileWithContents: Data(rtf.utf8))
        textFile.preferredFilename = "TXT.rtf"
        let rtfdPackage = FileWrapper(directoryWithFileWrappers: ["TXT.rtf": textFile])
        rtfdPackage.preferredFilename = "Gym Logger.rtfd"
        guard let serialized = rtfdPackage.serializedRepresentation, !serialized.isEmpty else {
            throw NativePayloadError.flatRTFDSerializationFailed
        }
        return serialized
    }
}
