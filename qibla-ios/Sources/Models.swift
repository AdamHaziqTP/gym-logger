import Foundation
import CoreLocation

struct LocationContext: Equatable {
    let latitude: Double
    let longitude: Double
    let locality: String
    let countryCode: String?
    let timeZoneIdentifier: String
    let horizontalAccuracy: Double

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    var timeZone: TimeZone {
        TimeZone(identifier: timeZoneIdentifier) ?? .current
    }
}

enum PrayerKind: String, CaseIterable, Identifiable {
    case fajr, sunrise, dhuhr, asr, maghrib, isha

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .fajr: return "Subuh"
        case .sunrise: return "Syuruk"
        case .dhuhr: return "Zohor"
        case .asr: return "Asar"
        case .maghrib: return "Maghrib"
        case .isha: return "Isyak"
        }
    }

    var symbolName: String {
        switch self {
        case .fajr: return "moon.stars.fill"
        case .sunrise: return "sunrise.fill"
        case .dhuhr: return "sun.max.fill"
        case .asr: return "sun.haze.fill"
        case .maghrib: return "sunset.fill"
        case .isha: return "moon.fill"
        }
    }

    var countsAsPrayer: Bool { self != .sunrise }
}

struct PrayerEntry: Identifiable, Equatable {
    var id: String { "\(kind.rawValue)-\(date.timeIntervalSince1970)" }
    let kind: PrayerKind
    let date: Date
}

struct PrayerDay: Equatable {
    let localDate: Date
    let entries: [PrayerEntry]
    let sourceTitle: String
    let sourceDetail: String
    let isOfficial: Bool
    let timeZoneIdentifier: String

    var timeZone: TimeZone {
        TimeZone(identifier: timeZoneIdentifier) ?? .current
    }

    func entry(_ kind: PrayerKind) -> PrayerEntry? {
        entries.first(where: { $0.kind == kind })
    }
}

enum CompassQuality: String {
    case unavailable = "Unavailable"
    case poor = "Calibration recommended"
    case fair = "Reduced accuracy"
    case good = "Good"
}

enum MethodOverride: String, CaseIterable, Identifiable {
    case automatic
    case muslimWorldLeague
    case singapore
    case ummAlQura
    case moonsightingCommittee
    case northAmerica
    case egyptian
    case karachi
    case turkey
    case dubai
    case qatar
    case kuwait

    var id: String { rawValue }

    var title: String {
        switch self {
        case .automatic: return "Automatic (recommended)"
        case .muslimWorldLeague: return "Muslim World League"
        case .singapore: return "Singapore / Malaysia"
        case .ummAlQura: return "Umm al-Qura"
        case .moonsightingCommittee: return "Moonsighting Committee"
        case .northAmerica: return "ISNA / North America"
        case .egyptian: return "Egyptian"
        case .karachi: return "Karachi"
        case .turkey: return "Türkiye (Diyanet approximation)"
        case .dubai: return "Dubai / UAE"
        case .qatar: return "Qatar"
        case .kuwait: return "Kuwait"
        }
    }
}

enum MadhabChoice: String, CaseIterable, Identifiable {
    case standard
    case hanafi

    var id: String { rawValue }
    var title: String { self == .hanafi ? "Hanafi" : "Standard (Shafi/Maliki/Hanbali)" }
}

enum AngleMath {
    static func normalize(_ degrees: Double) -> Double {
        let value = degrees.truncatingRemainder(dividingBy: 360)
        return value >= 0 ? value : value + 360
    }

    static func shortestDifference(target: Double, current: Double) -> Double {
        var diff = normalize(target) - normalize(current)
        if diff > 180 { diff -= 360 }
        if diff < -180 { diff += 360 }
        return diff
    }

    static func qiblaBearing(latitude: Double, longitude: Double) -> Double {
        let kaabaLatitude = 21.4225 * .pi / 180
        let kaabaLongitude = 39.8262 * .pi / 180
        let userLatitude = latitude * .pi / 180
        let userLongitude = longitude * .pi / 180
        let dLon = kaabaLongitude - userLongitude

        let y = sin(dLon) * cos(kaabaLatitude)
        let x = cos(userLatitude) * sin(kaabaLatitude)
            - sin(userLatitude) * cos(kaabaLatitude) * cos(dLon)
        return normalize(atan2(y, x) * 180 / .pi)
    }
}

extension DateFormatter {
    static func prayerTime(timeZone: TimeZone, use24Hour: Bool) -> DateFormatter {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = timeZone
        formatter.dateFormat = use24Hour ? "HH:mm" : "h:mm a"
        return formatter
    }
}

extension Calendar {
    static func gregorian(in timeZone: TimeZone) -> Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        return calendar
    }
}
