import SwiftUI
import UIKit

struct ContentView: View {
    @State private var status = "Ready to copy the canonical Gym Logger proof fixture."

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Gym Logger").font(.largeTitle.bold())
            Text("Native Notes pasteboard proof").foregroundStyle(.secondary)
            Button("Copy Gym Session to Pasteboard") { copySession() }
                .buttonStyle(.borderedProminent)
            Text(status).font(.footnote).foregroundStyle(.secondary)
        }
        .padding(24)
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
