import SwiftUI
import UIKit

@MainActor
struct ContentView: View {
    @Environment(\.scenePhase) private var scenePhase
    @State private var status = "Copy a small coloured table in Apple Notes, then inspect it here."
    @State private var shareURLs: [URL] = []
    @State private var removalCandidates: [String] = []
    @State private var sufficiencyCandidates: [String] = []
    @State private var handoffSession: FixtureSession?

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

                if !removalCandidates.isEmpty {
                    Divider()
                    Text("Representation-removal variants").font(.headline)
                    Text("Replay one variant at a time, then paste into Notes. Each button removes only the named non-empty captured representation.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    ForEach(removalCandidates, id: \.self) { typeIdentifier in
                        Button("Replay without \(typeIdentifier)") {
                            replayWithout(typeIdentifier)
                        }
                        .buttonStyle(.bordered)
                    }
                }

                if !sufficiencyCandidates.isEmpty {
                    Divider()
                    Text("Single-representation sufficiency variants").font(.headline)
                    Text("Replay one captured representation by itself, then paste into Notes. Each button keeps only the named non-empty representation.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    ForEach(sufficiencyCandidates, id: \.self) { typeIdentifier in
                        Button("Replay ONLY \(typeIdentifier)") {
                            replayOnly(typeIdentifier)
                        }
                        .buttonStyle(.bordered)
                    }
                }

                Divider()
                Text("Production Gym Logger handoff").font(.headline)
                Text("When Gym Logger opens this helper, it sends the selected session as JSON. The helper then generates the coloured editable Notes payload from that real session.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                if let handoffSession {
                    Text("Received \(handoffSession.displayDate) from Gym Logger (\(handoffSession.rows.count) rows).")
                        .font(.footnote)
                    Button("Prepare Coloured Clipboard & Open Notes") {
                        prepareHandoffSession()
                    }
                    .buttonStyle(.borderedProminent)
                } else {
                    Text("No production session is waiting. Use the optional PWA action from an open session to send one here.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Divider()
                Text("Isolated fixture proof").font(.headline)
                Text("Builds a new 40-row workout from the bundled fixture only. This is retained for native-format diagnostics and is not the production handoff.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Button("Copy Generated Gym Session (flat-RTFD only)") { copySession() }
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
        .onAppear { consumeHandoffIfPresent() }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { consumeHandoffIfPresent() }
        }
    }

    private func inspectClipboard() {
        status = "Inspecting the current Notes clipboard. The clipboard will not be changed."
        Task { @MainActor in
            do {
                let package = try await NativeClipboardInspector.inspect()
                let readableCount = package.manifest.items.flatMap(\.representations).filter { $0.relativePath != nil }.count
                let candidates = try NativeClipboardInspector.latestCaptureTypeIdentifiers()
                removalCandidates = candidates
                sufficiencyCandidates = candidates
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

    private func replayWithout(_ typeIdentifier: String) {
        do {
            try NativeClipboardInspector.replayLatestCapture(excludingTypeIdentifier: typeIdentifier)
            status = "Replayed without \(typeIdentifier). Open the Gym note and paste once, then record whether the table, colours, and Unicode survived."
        } catch {
            status = "Variant replay failed: \(error.localizedDescription)"
        }
    }

    private func replayOnly(_ typeIdentifier: String) {
        do {
            try NativeClipboardInspector.replayLatestCapture(onlyTypeIdentifier: typeIdentifier)
            status = "Replayed only \(typeIdentifier). Open the temporary Gym note and paste once, then record table, colours, content, and Unicode."
        } catch {
            status = "Single-representation replay failed: \(error.localizedDescription)"
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
            let payload = try NativePayloadBuilder.makePayload(session: session)
            UIPasteboard.general.setItems(
                [payload.flatRTFDPasteboardItem],
                options: [.expirationDate: Date().addingTimeInterval(600)]
            )
            status = "Generated a new Gym Logger flat-RTFD payload. Open a temporary Gym note and paste once."
        } catch {
            status = "Could not load the bundled proof fixture."
        }
    }

    private func consumeHandoffIfPresent() {
        guard handoffSession == nil else { return }
        do {
            guard let received = try NativePayloadBuilder.loadHandoffFromPasteboard() else { return }
            handoffSession = received
            status = "Received \(received.displayDate) from Gym Logger. Preparing the coloured editable Notes clipboard."
            prepareSession(received, openNotes: true)
        } catch {
            status = "Gym Logger handoff could not be read: \(error.localizedDescription)"
        }
    }

    private func prepareHandoffSession() {
        guard let handoffSession else {
            status = "No Gym Logger session handoff is available yet."
            return
        }
        prepareSession(handoffSession, openNotes: true)
    }

    private func prepareSession(_ session: FixtureSession, openNotes: Bool) {
        do {
            let payload = try NativePayloadBuilder.makePayload(session: session)
            UIPasteboard.general.setItems(
                [payload.flatRTFDPasteboardItem],
                options: [.expirationDate: Date().addingTimeInterval(600)]
            )
            status = openNotes
                ? "Coloured clipboard prepared. Opening Notes; paste once into the Gym note."
                : "Coloured clipboard prepared. Open Notes and paste once."
            guard openNotes, let url = URL(string: "mobilenotes://") else {
                return
            }
            UIApplication.shared.open(url, options: [:]) { didOpen in
                guard !didOpen else { return }
                Task { @MainActor in
                    status = "Coloured clipboard prepared. iOS could not open Notes automatically; open Notes manually and paste once into the Gym note."
                }
            }
        } catch {
            status = "Could not prepare the native Notes payload from this session."
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
