import CryptoKit
import Foundation
import UIKit

struct ClipboardCaptureManifest: Codable {
    let schema: String
    let captureID: String
    let capturedAt: Date
    let pasteboardChangeCount: Int
    let firstItemTypeOrder: [String]
    let observedRichTypeHints: [String]
    let itemCount: Int
    let items: [ClipboardCaptureItem]
    let warnings: [String]
}

struct ClipboardCaptureItem: Codable {
    let itemIndex: Int
    let representations: [ClipboardCaptureRepresentation]
}

struct ClipboardCaptureRepresentation: Codable {
    let typeIdentifier: String
    let source: String
    let valueKind: String
    let byteLength: Int?
    let sha256: String?
    let relativePath: String?
    let omittedReason: String?
}

struct ClipboardCapturePackage {
    let manifest: ClipboardCaptureManifest
    let directoryURL: URL
}

enum ClipboardInspectorError: LocalizedError {
    case noCapture
    case unreadableRepresentation(String)
    case missingRepresentation(String)
    case invalidCapture

    var errorDescription: String? {
        switch self {
        case .noCapture:
            return "No captured Notes clipboard is available yet."
        case let .unreadableRepresentation(typeIdentifier):
            return "The clipboard representation \(typeIdentifier) could not be read."
        case let .missingRepresentation(typeIdentifier):
            return "No readable captured representation exists for \(typeIdentifier)."
        case .invalidCapture:
            return "The saved clipboard capture is incomplete."
        }
    }
}

enum NativeClipboardInspector {
    private static let schema = "gym-logger/e004-native-clipboard-capture/v1"
    private static let maximumRawPayloadBytes = 10 * 1024 * 1024
    private static let richTypeHints = [
        "public.rtf", "com.apple.rtfd", "com.apple.flat-rtfd", "public.html",
        "text/html", "com.apple.webarchive", "public.webarchive",
        "public.attributed-string", "com.apple.notes.table"
    ]

    @MainActor
    static func inspect() async throws -> ClipboardCapturePackage {
        let pasteboard = UIPasteboard.general
        let directItems = pasteboard.items
        let providers = pasteboard.itemProviders
        let firstItemTypeOrder = pasteboard.types
        let itemCount = max(directItems.count, providers.count)
        let captureID = "capture-\(Int(Date().timeIntervalSince1970))"
        let directoryURL = try makeCaptureDirectory(captureID: captureID)
        var warnings: [String] = []
        var capturedItems: [ClipboardCaptureItem] = []

        for itemIndex in 0..<itemCount {
            let directItem = itemIndex < directItems.count ? directItems[itemIndex] : [:]
            let provider = itemIndex < providers.count ? providers[itemIndex] : nil
            var representations: [ClipboardCaptureRepresentation] = []

            let directTypeOrder = itemIndex == 0
                ? firstItemTypeOrder + directItem.keys.filter { !firstItemTypeOrder.contains($0) }.sorted()
                : directItem.keys.sorted()
            for typeIdentifier in directTypeOrder {
                let value = directItem[typeIdentifier]
                guard let value, let payload = data(for: value) else {
                    representations.append(ClipboardCaptureRepresentation(
                        typeIdentifier: typeIdentifier,
                        source: "pasteboard-item",
                        valueKind: value.map { String(describing: type(of: $0)) } ?? "missing",
                        byteLength: nil,
                        sha256: nil,
                        relativePath: nil,
                        omittedReason: "unsupported value class"
                    ))
                    warnings.append("Item \(itemIndex) type \(typeIdentifier) was not directly serializable.")
                    continue
                }

                representations.append(try persist(
                    payload: payload.data,
                    typeIdentifier: typeIdentifier,
                    source: "pasteboard-item",
                    valueKind: payload.kind,
                    itemIndex: itemIndex,
                    directoryURL: directoryURL
                ))
            }

            if let provider {
                for typeIdentifier in provider.registeredTypeIdentifiers {
                    if let existing = representations.first(where: { $0.typeIdentifier == typeIdentifier && $0.relativePath != nil }) {
                        representations.append(ClipboardCaptureRepresentation(
                            typeIdentifier: typeIdentifier,
                            source: "item-provider",
                            valueKind: existing.valueKind,
                            byteLength: existing.byteLength,
                            sha256: existing.sha256,
                            relativePath: existing.relativePath,
                            omittedReason: nil
                        ))
                        continue
                    }

                    do {
                        let data = try await loadData(from: provider, typeIdentifier: typeIdentifier)
                        representations.append(try persist(
                            payload: data,
                            typeIdentifier: typeIdentifier,
                            source: "item-provider",
                            valueKind: "data",
                            itemIndex: itemIndex,
                            directoryURL: directoryURL
                        ))
                    } catch {
                        representations.append(ClipboardCaptureRepresentation(
                            typeIdentifier: typeIdentifier,
                            source: "item-provider",
                            valueKind: "unreadable",
                            byteLength: nil,
                            sha256: nil,
                            relativePath: nil,
                            omittedReason: error.localizedDescription
                        ))
                        warnings.append("Item \(itemIndex) provider type \(typeIdentifier) could not be loaded: \(error.localizedDescription)")
                    }
                }
            }

            if representations.isEmpty {
                warnings.append("Item \(itemIndex) exposed no readable representations.")
            }
            capturedItems.append(ClipboardCaptureItem(itemIndex: itemIndex, representations: representations))
        }

        let manifest = ClipboardCaptureManifest(
            schema: schema,
            captureID: captureID,
            capturedAt: Date(),
            pasteboardChangeCount: pasteboard.changeCount,
            firstItemTypeOrder: firstItemTypeOrder,
            observedRichTypeHints: richTypeHints.filter { typeIdentifier in
                capturedItems.flatMap(\.representations).contains { $0.typeIdentifier == typeIdentifier }
            },
            itemCount: itemCount,
            items: capturedItems,
            warnings: warnings
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        try encoder.encode(manifest).write(to: directoryURL.appendingPathComponent("manifest.json"), options: .atomic)
        return ClipboardCapturePackage(manifest: manifest, directoryURL: directoryURL)
    }

    static func latestCaptureTypeIdentifiers() throws -> [String] {
        guard let directoryURL = latestCaptureDirectory() else { throw ClipboardInspectorError.noCapture }
        let manifest = try loadManifest(from: directoryURL)
        var identifiers: [String] = []
        for representation in manifest.items.flatMap(\.representations) {
            guard representation.relativePath != nil,
                  (representation.byteLength ?? 0) > 0,
                  !identifiers.contains(representation.typeIdentifier) else { continue }
            identifiers.append(representation.typeIdentifier)
        }
        return identifiers
    }

    @MainActor
    static func replayLatestCapture(excludingTypeIdentifier: String? = nil) throws {
        guard let directoryURL = latestCaptureDirectory() else { throw ClipboardInspectorError.noCapture }
        let manifest = try loadManifest(from: directoryURL)
        var items: [[String: Any]] = []

        for capturedItem in manifest.items {
            var item: [String: Any] = [:]
            for representation in capturedItem.representations {
                if let excludingTypeIdentifier,
                   representation.typeIdentifier == excludingTypeIdentifier { continue }
                guard item[representation.typeIdentifier] == nil,
                      let relativePath = representation.relativePath else { continue }
                let data = try Data(contentsOf: directoryURL.appendingPathComponent(relativePath))
                if representation.valueKind == "string", let value = String(data: data, encoding: .utf8) {
                    item[representation.typeIdentifier] = value
                } else {
                    item[representation.typeIdentifier] = data
                }
            }
            guard !item.isEmpty else { throw ClipboardInspectorError.invalidCapture }
            items.append(item)
        }

        UIPasteboard.general.setItems(
            items,
            options: [.expirationDate: Date().addingTimeInterval(600)]
        )
    }

    @MainActor
    static func replayLatestCapture(onlyTypeIdentifier: String) throws {
        let requestedType = onlyTypeIdentifier.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !requestedType.isEmpty else { throw ClipboardInspectorError.invalidCapture }
        guard let directoryURL = latestCaptureDirectory() else { throw ClipboardInspectorError.noCapture }
        let manifest = try loadManifest(from: directoryURL)
        var items: [[String: Any]] = []
        var foundReadableRepresentation = false

        for capturedItem in manifest.items {
            var item: [String: Any] = [:]
            for representation in capturedItem.representations {
                guard representation.typeIdentifier == requestedType,
                      item[representation.typeIdentifier] == nil,
                      let relativePath = representation.relativePath,
                      (representation.byteLength ?? 0) > 0 else { continue }
                let data = try Data(contentsOf: directoryURL.appendingPathComponent(relativePath))
                if representation.valueKind == "string", let value = String(data: data, encoding: .utf8) {
                    item[representation.typeIdentifier] = value
                } else {
                    item[representation.typeIdentifier] = data
                }
                foundReadableRepresentation = true
            }
            guard !item.isEmpty else {
                throw ClipboardInspectorError.missingRepresentation(requestedType)
            }
            items.append(item)
        }

        guard foundReadableRepresentation else {
            throw ClipboardInspectorError.missingRepresentation(requestedType)
        }

        UIPasteboard.general.setItems(
            items,
            options: [.expirationDate: Date().addingTimeInterval(600)]
        )
    }

    static func latestCaptureShareURLs() throws -> [URL] {
        guard let directoryURL = latestCaptureDirectory() else { throw ClipboardInspectorError.noCapture }
        let urls = try FileManager.default.contentsOfDirectory(
            at: directoryURL,
            includingPropertiesForKeys: [.isRegularFileKey],
            options: [.skipsHiddenFiles]
        )
        return urls.filter { $0.pathExtension == "json" || $0.pathExtension == "bin" }.sorted { $0.lastPathComponent < $1.lastPathComponent }
    }

    private static func loadManifest(from directoryURL: URL) throws -> ClipboardCaptureManifest {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(ClipboardCaptureManifest.self, from: Data(contentsOf: directoryURL.appendingPathComponent("manifest.json")))
    }

    private static func latestCaptureDirectory() -> URL? {
        guard let root = captureRootURL(),
              let urls = try? FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: nil, options: [.skipsHiddenFiles]) else { return nil }
        return urls.filter { $0.hasDirectoryPath }.sorted { $0.lastPathComponent > $1.lastPathComponent }.first
    }

    private static func captureRootURL() -> URL? {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.appendingPathComponent("E004-captures", isDirectory: true)
    }

    private static func makeCaptureDirectory(captureID: String) throws -> URL {
        guard let root = captureRootURL() else { throw ClipboardInspectorError.invalidCapture }
        let directory = root.appendingPathComponent(captureID, isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory
    }

    private static func data(for value: Any) -> (data: Data, kind: String)? {
        if let data = value as? Data { return (data, "data") }
        if let string = value as? String { return (Data(string.utf8), "string") }
        if let url = value as? URL { return (Data(url.absoluteString.utf8), "url") }
        return nil
    }

    private static func persist(
        payload: Data,
        typeIdentifier: String,
        source: String,
        valueKind: String,
        itemIndex: Int,
        directoryURL: URL
    ) throws -> ClipboardCaptureRepresentation {
        let digest = SHA256.hash(data: payload).map { String(format: "%02x", $0) }.joined()
        guard payload.count <= maximumRawPayloadBytes else {
            return ClipboardCaptureRepresentation(
                typeIdentifier: typeIdentifier,
                source: source,
                valueKind: valueKind,
                byteLength: payload.count,
                sha256: digest,
                relativePath: nil,
                omittedReason: "payload exceeds 10 MB safety limit"
            )
        }
        let safeType = typeIdentifier.replacingOccurrences(of: "[^A-Za-z0-9._-]", with: "_", options: .regularExpression)
        let filename = "item-\(itemIndex)-\(safeType)-\(source).bin"
        try payload.write(to: directoryURL.appendingPathComponent(filename), options: .atomic)
        return ClipboardCaptureRepresentation(
            typeIdentifier: typeIdentifier,
            source: source,
            valueKind: valueKind,
            byteLength: payload.count,
            sha256: digest,
            relativePath: filename,
            omittedReason: nil
        )
    }

    private static func loadData(from provider: NSItemProvider, typeIdentifier: String) async throws -> Data {
        try await withCheckedThrowingContinuation { continuation in
            provider.loadDataRepresentation(forTypeIdentifier: typeIdentifier) { data, error in
                if let error {
                    continuation.resume(throwing: error)
                } else if let data {
                    continuation.resume(returning: data)
                } else {
                    continuation.resume(throwing: ClipboardInspectorError.unreadableRepresentation(typeIdentifier))
                }
            }
        }
    }
}
