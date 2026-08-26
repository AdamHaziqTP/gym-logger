import Foundation
import SwiftUI
import UIKit
import UniformTypeIdentifiers
import WebKit

struct GymLoggerWebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        let contentController = WKUserContentController()
        contentController.add(context.coordinator, name: "gymLoggerNative")
        configuration.userContentController = contentController

        guard let root = Bundle.main.url(forResource: "WebApp", withExtension: nil) else {
            return WKWebView(frame: .zero, configuration: configuration)
        }

        let localHandler = LocalWebHandler(root: root)
        configuration.setURLSchemeHandler(localHandler, forURLScheme: "gymlogger")
        context.coordinator.localHandler = localHandler

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.allowsBackForwardNavigationGestures = false
        context.coordinator.webView = webView
        if let url = URL(string: "gymlogger://app/") {
            webView.load(URLRequest(url: url))
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    static func dismantleUIView(_ webView: WKWebView, coordinator: Coordinator) {
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "gymLoggerNative")
        webView.stopLoading()
    }

    final class Coordinator: NSObject, WKScriptMessageHandler {
        weak var webView: WKWebView?
        var localHandler: LocalWebHandler?

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "gymLoggerNative",
                  let body = message.body as? [String: Any],
                  let action = body["action"] as? String else { return }

            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                switch action {
                case "prepareColouredNotes":
                    self.prepareColouredNotes(handoff: body["payload"] as? String)
                case "copyNotesPayload":
                    self.copyNotesPayload(html: body["html"] as? String, plainText: body["plainText"] as? String)
                default:
                    break
                }
            }
        }

        private func prepareColouredNotes(handoff: String?) {
            guard let handoff else { notify("failed"); return }
            do {
                let session = try NativePayloadBuilder.decodeHandoff(handoff)
                let payload = try NativePayloadBuilder.makePayload(session: session)
                UIPasteboard.general.setItems(
                    [payload.flatRTFDPasteboardItem],
                    options: [.expirationDate: Date().addingTimeInterval(600)]
                )
                notify("prepared")
                openNotes()
            } catch {
                notify("failed")
            }
        }

        private func copyNotesPayload(html: String?, plainText: String?) {
            guard let html, let plainText else { notify("failed"); return }
            UIPasteboard.general.setItems(
                [[
                    UTType.html.identifier: Data(html.utf8),
                    UTType.utf8PlainText.identifier: plainText,
                ]],
                options: [.expirationDate: Date().addingTimeInterval(600)]
            )
            notify("copied")
        }

        private func openNotes() {
            guard let url = URL(string: "mobilenotes://") else { return }
            UIApplication.shared.open(url, options: [:])
        }

        private func notify(_ status: String) {
            guard let webView else { return }
            let data = try? JSONSerialization.data(withJSONObject: ["status": status])
            guard let json = data.flatMap({ String(data: $0, encoding: .utf8) }) else { return }
            webView.evaluateJavaScript(
                "window.dispatchEvent(new CustomEvent('gymlogger-native-status', { detail: \(json) }));"
            )
        }
    }
}

final class LocalWebHandler: NSObject, WKURLSchemeHandler {
    private let root: URL

    init(root: URL) { self.root = root.standardizedFileURL }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let requestURL = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(NSError(domain: "GymLogger", code: 1))
            return
        }

        let relativePath = requestURL.path.isEmpty || requestURL.path == "/"
            ? "index.html"
            : String(requestURL.path.drop(while: { $0 == "/" }))
        let fileURL = root.appendingPathComponent(relativePath).standardizedFileURL
        guard fileURL.path.hasPrefix(root.path + "/"),
              FileManager.default.fileExists(atPath: fileURL.path),
              let data = try? Data(contentsOf: fileURL) else {
            urlSchemeTask.didFailWithError(NSError(domain: "GymLogger", code: 404))
            return
        }

        let response = URLResponse(
            url: requestURL,
            mimeType: mimeType(for: fileURL.pathExtension),
            expectedContentLength: data.count,
            textEncodingName: textEncoding(for: fileURL.pathExtension)
        )
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    private func mimeType(for extension: String) -> String {
        switch `extension`.lowercased() {
        case "html": return "text/html"
        case "js", "mjs": return "text/javascript"
        case "css": return "text/css"
        case "json", "webmanifest": return "application/json"
        case "png": return "image/png"
        case "svg": return "image/svg+xml"
        case "woff", "woff2": return "font/woff2"
        default: return "application/octet-stream"
        }
    }

    private func textEncoding(for extension: String) -> String? {
        ["html", "js", "mjs", "css", "json", "webmanifest"].contains(`extension`.lowercased()) ? "utf-8" : nil
    }
}
