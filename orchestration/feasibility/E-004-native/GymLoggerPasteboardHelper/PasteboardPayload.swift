import Foundation
import UIKit
import UniformTypeIdentifiers

struct FixtureFile: Decodable { let session: FixtureSession }

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
    case flatRTFDSerializationFailed

    var errorDescription: String? {
        switch self {
        case .flatRTFDSerializationFailed:
            return "The generated flat-RTFD container could not be serialized."
        }
    }
}

enum NativePayloadBuilder {
    private static let categories = ["Arms", "Back", "Chest", "Delts", "Legs"]
    private static let foreground: [String: String] = [
        "orange": "#ff9230", "purple": "#db34f2", "mint": "#00dac3",
        "blue": "#0091ff", "pink": "#ff375f",
    ]
    private static let opaqueBackground: [String: String] = [
        "orange": "#261802", "purple": "#1f0e27", "mint": "#0f201f",
        "blue": "#021529", "pink": "#260809",
    ]

    static func loadFixture() throws -> FixtureSession {
        guard let url = Bundle.main.url(forResource: "latest-session.example", withExtension: "json") else {
            throw NSError(domain: "GymLoggerPasteboardHelper", code: 1)
        }
        return try JSONDecoder().decode(FixtureFile.self, from: Data(contentsOf: url)).session
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

    private static func makeRTF(session: FixtureSession, rows: [FixtureRow], summary: String) -> String {
        let colours = [foreground["orange"]!, foreground["purple"]!, foreground["mint"]!, foreground["blue"]!, foreground["pink"]!, "#261802", "#1f0e27", "#0f201f", "#021529", "#260809"]
        let colourTable = "{\\colortbl;\(colours.map(rgb).joined(separator: ";"));}"
        let bounds = "\\trowd\\trgaph80\\trleft0\\cellx1100\\cellx2600\\cellx3900\\cellx5400\\cellx7000"
        let header = ["Exercise", "Sets", "Reps", "Weight", "Skip"].map { "\\intbl{\\b \(rtfEscape($0))}\\cell" }.joined()
        let body = rows.map { row in
            let indices: (Int, Int)
            switch row.highlight {
            case "orange": indices = (1, 6)
            case "purple": indices = (2, 7)
            case "mint": indices = (3, 8)
            case "blue": indices = (4, 9)
            case "pink": indices = (5, 10)
            default: indices = (0, 0)
            }
            let cells = [row.exercise, row.sets, row.reps, row.weight, row.skip]
                .map { "\\intbl{\\cf\(indices.0)\\highlight\(indices.1)\\chcbpat\(indices.1) \(rtfEscape($0))}\\cell" }
                .joined()
            return "\(bounds)\(cells)\\row"
        }.joined(separator: "\n")
        return "{\\rtf1\\ansi\\ansicpg1252\\deff0\(colourTable)\\pard\\fs28\\b \(rtfEscape(session.displayDate))\\b0\\fs22\\par\\pard \(rtfEscape(categories.joined(separator: " ")))\\par\\pard \(rtfEscape(summary))\\par\(bounds)\(header)\\row\n\(body)\\pard\\b Notes\\b0\\par\(rtfEscape(session.notes))}"
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
