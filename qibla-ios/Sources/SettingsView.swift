import SwiftUI

struct SettingsView: View {
    @ObservedObject var prayers: PrayerService
    @Environment(\.dismiss) private var dismiss

    @AppStorage("methodOverride") private var methodOverride = MethodOverride.automatic.rawValue
    @AppStorage("madhabChoice") private var madhabChoice = MadhabChoice.standard.rawValue
    @AppStorage("use24Hour") private var use24Hour = false
    @AppStorage("alignmentHaptic") private var alignmentHaptic = true

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker("Calculation method", selection: $methodOverride) {
                        ForEach(MethodOverride.allCases) { method in
                            Text(method.title).tag(method.rawValue)
                        }
                    }

                    Picker("Asar school", selection: $madhabChoice) {
                        ForEach(MadhabChoice.allCases) { madhab in
                            Text(madhab.title).tag(madhab.rawValue)
                        }
                    }
                } header: {
                    Text("Prayer calculation")
                } footer: {
                    Text("Automatic uses official MUIS timetable data while in Singapore. Elsewhere it selects an established regional calculation method and labels it clearly.")
                }

                Section("Display") {
                    Toggle("24-hour time", isOn: $use24Hour)
                    Toggle("Haptic when Qibla aligns", isOn: $alignmentHaptic)
                }

                Section("Current data") {
                    if let day = prayers.today {
                        LabeledContent("Source", value: day.sourceTitle.replacingOccurrences(of: "Source: ", with: "").replacingOccurrences(of: "Calculated: ", with: ""))
                        LabeledContent("Type", value: day.isOfficial ? "Official timetable" : "On-device calculation")
                    } else {
                        Text("Waiting for location and prayer data.")
                            .foregroundStyle(.secondary)
                    }

                    if let checked = prayers.lastNetworkCheck {
                        LabeledContent("Last MUIS check") {
                            Text(checked, style: .relative)
                        }
                    }
                }

                Section {
                    VStack(alignment: .leading, spacing: 9) {
                        Label("Location stays private", systemImage: "hand.raised.fill")
                            .font(.headline)
                        Text("The app uses Core Location for Qibla and regional prayer-time selection. It has no account, advertising, analytics or tracking SDK. Singapore timetable downloads contain no coordinates.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                } header: {
                    Text("Privacy")
                }

                Section {
                    VStack(alignment: .leading, spacing: 7) {
                        Text("Prayer calculation")
                            .font(.headline)
                        Text("Calculated prayer times use Adhan Swift 1.5.0 by Batoul Apps, an MIT-licensed high-precision implementation based on astronomical algorithms.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)

                        Text("Singapore")
                            .font(.headline)
                            .padding(.top, 5)
                        Text("Official Singapore prayer times are retrieved from the MUIS Muslim Prayer Timetable (consolidated) dataset on data.gov.sg and cached locally.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)

                        Text("Qibla")
                            .font(.headline)
                            .padding(.top, 5)
                        Text("Qibla is calculated locally as the initial great-circle bearing from your position to the Kaaba (21.4225° N, 39.8262° E).")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 4)
                } header: {
                    Text("Methodology")
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
