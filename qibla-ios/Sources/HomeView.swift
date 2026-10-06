import SwiftUI
import CoreLocation
import UIKit

struct HomeView: View {
    @StateObject private var location = LocationService()
    @StateObject private var prayers = PrayerService()
    @State private var showingSettings = false
    @State private var lastRefreshContext: LocationContext?

    @AppStorage("use24Hour") private var use24Hour = false
    @AppStorage("alignmentHaptic") private var alignmentHaptic = true

    private let accent = Color(red: 0.66, green: 0.48, blue: 1.0)

    var body: some View {
        ZStack {
            Color(red: 0.035, green: 0.03, blue: 0.055)
                .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 18) {
                    header

                    if location.authorizationStatus == .denied || location.authorizationStatus == .restricted {
                        permissionCard
                    }

                    nextPrayerCard
                    compassCard
                    prayerTimesCard
                    sourceFooter
                }
                .padding(.horizontal, 18)
                .padding(.top, 10)
                .padding(.bottom, 34)
            }
            .refreshable {
                location.requestFreshLocation()
                location.restartHeading()
                if let context = location.context {
                    await prayers.refresh(for: context, forceNetwork: true)
                }
            }
        }
        .tint(accent)
        .sheet(isPresented: $showingSettings, onDismiss: {
            if let context = location.context {
                Task { await prayers.refresh(for: context, forceNetwork: true) }
            }
        }) {
            SettingsView(prayers: prayers)
                .preferredColorScheme(.dark)
        }
        .task {
            location.start()
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 60_000_000_000)
                guard let context = location.context else { continue }
                let calendar = Calendar.gregorian(in: context.timeZone)
                if let day = prayers.today,
                   !calendar.isDate(day.localDate, inSameDayAs: Date()) {
                    await prayers.refresh(for: context, forceNetwork: false)
                }
            }
        }
        .onChange(of: location.context) { _, newValue in
            guard let context = newValue else { return }
            let shouldRefresh: Bool
            if let previous = lastRefreshContext {
                let old = CLLocation(latitude: previous.latitude, longitude: previous.longitude)
                let new = CLLocation(latitude: context.latitude, longitude: context.longitude)
                shouldRefresh = old.distance(from: new) > 300
                    || previous.countryCode != context.countryCode
                    || previous.timeZoneIdentifier != context.timeZoneIdentifier
            } else {
                shouldRefresh = true
            }

            if shouldRefresh {
                lastRefreshContext = context
                Task { await prayers.refresh(for: context, forceNetwork: false) }
            }
        }
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Image(systemName: "location.fill")
                        .font(.caption)
                        .foregroundStyle(accent)
                    Text(location.context?.locality ?? "Finding your location…")
                        .font(.headline)
                        .lineLimit(1)
                }

                Text(dateSubtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Button {
                showingSettings = true
            } label: {
                Image(systemName: "gearshape.fill")
                    .font(.system(size: 17, weight: .semibold))
                    .frame(width: 42, height: 42)
                    .background(Color.white.opacity(0.08), in: Circle())
            }
            .accessibilityLabel("Settings")
        }
    }

    private var dateSubtitle: String {
        guard let context = location.context else {
            return Date().formatted(date: .abbreviated, time: .omitted)
        }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US")
        formatter.timeZone = context.timeZone
        formatter.dateFormat = "EEEE, d MMM yyyy"
        return formatter.string(from: Date())
    }

    private var permissionCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Location access is required", systemImage: "location.slash.fill")
                .font(.headline)
            Text("Qibla direction and local prayer times depend on your position. Your precise coordinates stay on this device except when an official timetable provider requires a regional lookup.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Button("Open iPhone Settings") {
                location.openSettings()
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .cardStyle()
    }

    private var nextPrayerCard: some View {
        TimelineView(.periodic(from: .now, by: 1)) { timeline in
            let next = prayers.nextPrayer(after: timeline.date)

            HStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 7) {
                    Text("NEXT PRAYER")
                        .font(.caption.weight(.bold))
                        .tracking(1.4)
                        .foregroundStyle(accent)

                    Text(next?.kind.displayName ?? "—")
                        .font(.system(size: 30, weight: .bold, design: .rounded))

                    Text(countdownText(to: next?.date, from: timeline.date))
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.secondary)
                }

                Spacer()

                if let next, let zone = prayers.today?.timeZone {
                    Text(DateFormatter.prayerTime(timeZone: zone, use24Hour: use24Hour).string(from: next.date))
                        .font(.system(size: 30, weight: .semibold, design: .rounded))
                        .monospacedDigit()
                } else {
                    ProgressView()
                }
            }
            .padding(20)
            .background(
                LinearGradient(
                    colors: [accent.opacity(0.20), Color.white.opacity(0.055)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ),
                in: RoundedRectangle(cornerRadius: 24, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
        }
    }

    private var compassCard: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text("QIBLA")
                        .font(.caption.weight(.bold))
                        .tracking(1.5)
                        .foregroundStyle(accent)
                    Text(qiblaGuidance)
                        .font(.headline)
                }
                Spacer()
                if let bearing = location.qiblaBearing {
                    Text("\(Int(bearing.rounded()))°")
                        .font(.title2.weight(.semibold))
                        .monospacedDigit()
                }
            }

            QiblaCompassView(
                heading: location.heading,
                qiblaBearing: location.qiblaBearing,
                quality: location.compassQuality,
                alignmentHaptic: alignmentHaptic,
                accent: accent
            )
            .frame(height: 315)

            HStack(spacing: 18) {
                MetricPill(
                    title: "HEADING",
                    value: location.heading.map { "\(Int($0.rounded()))°" } ?? "—"
                )
                MetricPill(
                    title: "ACCURACY",
                    value: location.compassQuality.rawValue
                )
            }

            if location.compassQuality == .poor {
                Label(
                    "Move away from magnets, metal surfaces or electronics. Rotate the phone in a figure-eight if iOS requests calibration.",
                    systemImage: "exclamationmark.triangle.fill"
                )
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(20)
        .cardStyle()
    }

    private var qiblaGuidance: String {
        guard let diff = location.relativeQiblaAngle else { return "Point your phone to begin" }
        let magnitude = Int(abs(diff).rounded())
        if magnitude <= 3 { return "Qibla aligned" }
        return diff > 0
            ? "Turn \(magnitude)° clockwise"
            : "Turn \(magnitude)° counter-clockwise"
    }

    private var prayerTimesCard: some View {
        VStack(spacing: 0) {
            HStack {
                Text("TODAY")
                    .font(.caption.weight(.bold))
                    .tracking(1.5)
                    .foregroundStyle(.secondary)
                Spacer()
                if prayers.isRefreshing {
                    ProgressView()
                        .controlSize(.small)
                }
            }
            .padding(.bottom, 10)

            if let day = prayers.today {
                TimelineView(.periodic(from: .now, by: 30)) { timeline in
                    let nextKind = prayers.nextPrayer(after: timeline.date)?.kind
                    VStack(spacing: 0) {
                        ForEach(day.entries) { entry in
                            PrayerRow(
                                entry: entry,
                                timeZone: day.timeZone,
                                use24Hour: use24Hour,
                                highlighted: entry.kind == nextKind,
                                accent: accent
                            )

                            if entry.id != day.entries.last?.id {
                                Divider()
                                    .overlay(Color.white.opacity(0.05))
                            }
                        }
                    }
                }
            } else {
                VStack(spacing: 12) {
                    ProgressView()
                    Text("Calculating prayer times…")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 30)
            }
        }
        .padding(18)
        .cardStyle()
    }

    private var sourceFooter: some View {
        VStack(alignment: .leading, spacing: 7) {
            if let day = prayers.today {
                HStack(spacing: 7) {
                    Image(systemName: day.isOfficial ? "checkmark.seal.fill" : "function")
                        .foregroundStyle(day.isOfficial ? accent : .secondary)
                    Text(day.sourceTitle)
                        .font(.footnote.weight(.semibold))
                }

                Text(day.sourceDetail)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let status = prayers.statusMessage {
                Text(status)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let context = location.context {
                Text("Location accuracy ±\(Int(max(0, context.horizontalAccuracy).rounded())) m • Pull down to refresh")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 4)
    }

    private func countdownText(to date: Date?, from now: Date) -> String {
        guard let date else { return "Waiting for location" }
        let seconds = max(0, Int(date.timeIntervalSince(now)))
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60
        if hours > 0 { return "in \(hours)h \(minutes)m" }
        if minutes > 0 { return "in \(minutes)m" }
        return "now"
    }
}

private struct QiblaCompassView: View {
    let heading: Double?
    let qiblaBearing: Double?
    let quality: CompassQuality
    let alignmentHaptic: Bool
    let accent: Color

    @State private var wasAligned = false

    private var relative: Double {
        guard let heading, let qiblaBearing else { return 0 }
        return AngleMath.shortestDifference(target: qiblaBearing, current: heading)
    }

    private var aligned: Bool {
        heading != nil && qiblaBearing != nil && abs(relative) <= 3 && quality != .unavailable
    }

    var body: some View {
        GeometryReader { proxy in
            let size = min(proxy.size.width, proxy.size.height)
            let radius = size / 2

            ZStack {
                Circle()
                    .fill(Color.black.opacity(0.28))
                Circle()
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
                Circle()
                    .stroke(accent.opacity(aligned ? 0.55 : 0.15), lineWidth: aligned ? 3 : 1.5)
                    .padding(10)

                ZStack {
                    ForEach(0..<72, id: \.self) { tick in
                        let major = tick % 6 == 0
                        Capsule()
                            .fill(major ? Color.white.opacity(0.78) : Color.white.opacity(0.23))
                            .frame(width: major ? 2 : 1, height: major ? 13 : 7)
                            .offset(y: -radius + 30)
                            .rotationEffect(.degrees(Double(tick) * 5))
                    }

                    cardinal("N", angle: 0, radius: radius)
                    cardinal("E", angle: 90, radius: radius)
                    cardinal("S", angle: 180, radius: radius)
                    cardinal("W", angle: 270, radius: radius)
                }
                .rotationEffect(.degrees(-(heading ?? 0)))
                .animation(.easeOut(duration: 0.18), value: heading ?? 0)

                VStack {
                    QiblaMarker(accent: accent, aligned: aligned)
                        .padding(.top, 18)
                    Spacer()
                }
                .rotationEffect(.degrees(relative))
                .animation(.easeOut(duration: 0.18), value: relative)

                VStack(spacing: 8) {
                    Image(systemName: "location.north.fill")
                        .font(.system(size: 30, weight: .bold))
                        .foregroundStyle(aligned ? accent : .white)

                    Text(aligned ? "ALIGNED" : "QIBLA")
                        .font(.caption2.weight(.bold))
                        .tracking(1.5)
                        .foregroundStyle(aligned ? accent : .secondary)

                    if let qiblaBearing {
                        Text("\(Int(qiblaBearing.rounded()))°")
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                            .monospacedDigit()
                    } else {
                        Text("—")
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                    }
                }

                Triangle()
                    .fill(Color.white)
                    .frame(width: 12, height: 8)
                    .offset(y: -radius + 9)
            }
            .frame(width: size, height: size)
            .position(x: proxy.size.width / 2, y: proxy.size.height / 2)
        }
        .onChange(of: aligned) { _, newValue in
            if newValue && !wasAligned && alignmentHaptic {
                let generator = UIImpactFeedbackGenerator(style: .medium)
                generator.prepare()
                generator.impactOccurred()
            }
            wasAligned = newValue
        }
    }

    private func cardinal(_ text: String, angle: Double, radius: CGFloat) -> some View {
        Text(text)
            .font(.caption.weight(.bold))
            .foregroundStyle(text == "N" ? accent : Color.white.opacity(0.72))
            .offset(y: -radius + 54)
            .rotationEffect(.degrees(angle))
    }
}

private struct QiblaMarker: View {
    let accent: Color
    let aligned: Bool

    var body: some View {
        VStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 3)
                .fill(accent)
                .frame(width: 25, height: 22)
                .overlay(
                    Rectangle()
                        .fill(Color.white.opacity(0.9))
                        .frame(height: 2)
                        .padding(.horizontal, 3),
                    alignment: .top
                )
                .shadow(color: accent.opacity(aligned ? 0.9 : 0.35), radius: aligned ? 12 : 4)
            Text("QIBLA")
                .font(.system(size: 8, weight: .bold))
                .tracking(0.8)
                .foregroundStyle(accent)
        }
    }
}

private struct PrayerRow: View {
    let entry: PrayerEntry
    let timeZone: TimeZone
    let use24Hour: Bool
    let highlighted: Bool
    let accent: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: entry.kind.symbolName)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(highlighted ? accent : Color.white.opacity(0.55))
                .frame(width: 22)

            Text(entry.kind.displayName)
                .font(.body.weight(highlighted ? .semibold : .regular))

            Spacer()

            if highlighted {
                Text("NEXT")
                    .font(.system(size: 9, weight: .bold))
                    .tracking(0.8)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 4)
                    .background(accent.opacity(0.15), in: Capsule())
                    .foregroundStyle(accent)
            }

            Text(DateFormatter.prayerTime(timeZone: timeZone, use24Hour: use24Hour).string(from: entry.date))
                .font(.body.weight(.semibold))
                .monospacedDigit()
                .foregroundStyle(highlighted ? accent : .primary)
        }
        .padding(.vertical, 13)
    }
}

private struct MetricPill: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(.system(size: 9, weight: .bold))
                .tracking(1)
                .foregroundStyle(.tertiary)
            Text(value)
                .font(.caption.weight(.semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 13)
        .padding(.vertical, 10)
        .background(Color.white.opacity(0.055), in: RoundedRectangle(cornerRadius: 13, style: .continuous))
    }
}

private struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.midX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

private extension View {
    func cardStyle() -> some View {
        self
            .background(Color.white.opacity(0.055), in: RoundedRectangle(cornerRadius: 24, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .stroke(Color.white.opacity(0.075), lineWidth: 1)
            )
    }
}
