import SwiftUI
import UIKit

@MainActor
struct ContentView: View {
    @State private var status = "Copy a small coloured table in Apple Notes, then inspect it here."
    @State private var shareURLs: [URL] = []

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Gym Logger").font(.largeTitle.bold())
                Text("Native Notes pasteboard proof").foregroundStyle(.secondary)
                Text("In Notes, copy a small table containing Arms, Back, Chest, Delts, and Legs. Return here and inspect without changing the clipboard.")
                    .font(.body)

                Button("Inspect Notes Clipboard") { inspectClipboard() }
                    .buttonStyle(.borderedProminent)
                Button("Replay Captured Clipboard") { replayClipboard() }
                    .buttonStyle(.bordered)
                Button("Share Capture Report and Raw Payloads") { shareCapture() }
                    .buttonStyle(.bordered)

                Divider()
                Text("Synthetic fixture (historical comparison only)").font(.headline)
                Button("Copy Gym Session to Pasteboard") { copySession() }
                    .buttonStyle(.bordered)

                Text(status).font(.footnote).foregroundStyle(.secondary)
            }
            .padding(24)
        }
        .sheet(isPresented: Binding(
            get: { !shareURLs.isEmpty },
            set: { if !$0 { shareURLs = [] } }
        )) {
            ShareSheet(items: shareURLs.map { $0 as Any })
        }
    }

    private func inspectClipboard() {
        status = "Inspecting the current Notes clipboard. The clipboard will not be changed."
        Task { @MainActor in
            do {
                let package = try await NativeClipboardInspector.inspect()
                let readableCount = package.manifest.items.flatMap(\.representations).filter { $0.relativePath != nil }.count
                status = "Captured \(package.manifest.itemCount) item(s), \(readableCount) readable representation(s). Share the report or replay it into Notes."
            } catch {
                status = "Inspection failed: \(error.localizedDescription)"
            }
        }
    }

    private func replayClipboard() {
        do {
            try NativeClipboardInspector.replayLatestCapture()
            status = "Replayed the captured pasteboard representations. Open the Gym note and paste once."
        } catch {
            status = "Replay failed: \(error.localizedDescription)"
        }
    }

    private func shareCapture() {
        do {
            shareURLs = try NativeClipboardInspector.latestCaptureShareURLs()
            if shareURLs.isEmpty { status = "No capture files are available to share yet." }
        } catch {
            status = "No capture is available yet: \(error.localizedDescription)"
        }
    }

    private func copySession() {
        do {
            let session = try NativePayloadBuilder.loadFixture()
            let payload = NativePayloadBuilder.makePayload(session: session)
            UIPasteboard.general.setItems(
                [payload.pasteboardItem],
                options: [.expirationDate: Date().addingTimeInterval(600)]
            )
            status = "Copied. Open the existing Gym note and paste once."
        } catch {
            status = "Could not load the bundled proof fixture."
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
