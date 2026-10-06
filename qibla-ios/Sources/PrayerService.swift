import Foundation

private struct MUISRecord: Codable {
    let date: String
    let subuh: String
    let syuruk: String
    let zohor: String
    let asar: String
    let maghrib: String
    let isyak: String

    enum CodingKeys: String, CodingKey {
        case date = "Date"
        case subuh = "Subuh"
        case syuruk = "Syuruk"
        case zohor = "Zohor"
        case asar = "Asar"
        case maghrib = "Maghrib"
        case isyak = "Isyak"
    }
}

private struct MUISAPIResponse: Decodable {
    struct Result: Decodable {
        let records: [MUISRecord]
    }
    let success: Bool
    let result: Result
}

private struct MUISCache: Codable {
    let fetchedAt: Date
    let records: [MUISRecord]
}

@MainActor
final class PrayerService: ObservableObject {
    @Published private(set) var today: PrayerDay?
    @Published private(set) var tomorrow: PrayerDay?
    @Published private(set) var isRefreshing = false
    @Published private(set) var statusMessage: String?
    @Published private(set) var lastNetworkCheck: Date?

    private let cacheKey = "qibla.muis.cache.v2"
    private let consolidatedDatasetID = "d_a6a206cba471fe04b62dd886ef5eaf22"

    var schedule: [PrayerEntry] {
        (today?.entries ?? []) + (tomorrow?.entries ?? [])
    }

    func nextPrayer(after now: Date = Date()) -> PrayerEntry? {
        schedule
            .filter { $0.kind.countsAsPrayer && $0.date > now }
            .sorted(by: { $0.date < $1.date })
            .first
    }

    func refresh(for context: LocationContext, forceNetwork: Bool = false) async {
        isRefreshing = true
        statusMessage = nil
        defer { isRefreshing = false }

        let timeZone = context.timeZone
        let calendar = Calendar.gregorian(in: timeZone)
        let now = Date()
        let todayDate = calendar.startOfDay(for: now)
        let tomorrowDate = calendar.date(byAdding: .day, value: 1, to: todayDate) ?? now.addingTimeInterval(86400)

        let override = MethodOverride(rawValue: UserDefaults.standard.string(forKey: "methodOverride") ?? "automatic") ?? .automatic
        let shouldUseMUIS = override == .automatic && context.countryCode?.uppercased() == "SG"

        if shouldUseMUIS {
            if let cache = loadMUISCache(),
               let todayOfficial = makeMUISDay(for: todayDate, from: cache.records, timeZone: timeZone),
               let tomorrowOfficial = makeMUISDay(for: tomorrowDate, from: cache.records, timeZone: timeZone) {
                today = todayOfficial
                tomorrow = tomorrowOfficial
                lastNetworkCheck = cache.fetchedAt
            } else {
                today = makeCalculatedDay(for: todayDate, context: context, override: .singapore)
                tomorrow = makeCalculatedDay(for: tomorrowDate, context: context, override: .singapore)
                statusMessage = "Using calculated Singapore fallback until MUIS data is available."
            }

            let cacheAge = loadMUISCache().map { now.timeIntervalSince($0.fetchedAt) } ?? .infinity
            if forceNetwork || cacheAge > 18 * 3600 {
                do {
                    let records = try await fetchAllMUISRecords()
                    let cache = MUISCache(fetchedAt: Date(), records: records)
                    saveMUISCache(cache)
                    lastNetworkCheck = cache.fetchedAt

                    if let official = makeMUISDay(for: todayDate, from: records, timeZone: timeZone) {
                        today = official
                    }
                    if let officialTomorrow = makeMUISDay(for: tomorrowDate, from: records, timeZone: timeZone) {
                        tomorrow = officialTomorrow
                    }
                    statusMessage = nil
                } catch {
                    if today?.isOfficial == true {
                        statusMessage = "Offline • using saved MUIS timetable"
                    } else {
                        statusMessage = "MUIS update unavailable • calculated fallback"
                    }
                }
            }
        } else {
            today = makeCalculatedDay(for: todayDate, context: context, override: override)
            tomorrow = makeCalculatedDay(for: tomorrowDate, context: context, override: override)
            statusMessage = nil
        }
    }

    private func makeCalculatedDay(for date: Date, context: LocationContext, override: MethodOverride) -> PrayerDay? {
        let timeZone = context.timeZone
        let calendar = Calendar.gregorian(in: timeZone)
        let components = calendar.dateComponents([.year, .month, .day], from: date)
        let coordinates = Coordinates(latitude: context.latitude, longitude: context.longitude)

        let resolved = resolvedCalculationMethod(countryCode: context.countryCode, override: override)
        var params = resolved.method.params
        let madhab = MadhabChoice(rawValue: UserDefaults.standard.string(forKey: "madhabChoice") ?? "standard") ?? .standard
        params.madhab = madhab == .hanafi ? .hanafi : .shafi

        guard let prayers = PrayerTimes(
            coordinates: coordinates,
            date: components,
            calculationParameters: params
        ) else {
            return nil
        }

        let entries = [
            PrayerEntry(kind: .fajr, date: prayers.fajr),
            PrayerEntry(kind: .sunrise, date: prayers.sunrise),
            PrayerEntry(kind: .dhuhr, date: prayers.dhuhr),
            PrayerEntry(kind: .asr, date: prayers.asr),
            PrayerEntry(kind: .maghrib, date: prayers.maghrib),
            PrayerEntry(kind: .isha, date: prayers.isha)
        ]

        return PrayerDay(
            localDate: date,
            entries: entries,
            sourceTitle: "Calculated: \(resolved.name)",
            sourceDetail: "High-precision on-device calculation • Adhan 1.5.0",
            isOfficial: false,
            timeZoneIdentifier: timeZone.identifier
        )
    }

    private func resolvedCalculationMethod(countryCode: String?, override: MethodOverride) -> (method: CalculationMethod, name: String) {
        func explicit(_ choice: MethodOverride) -> (CalculationMethod, String)? {
            switch choice {
            case .automatic: return nil
            case .muslimWorldLeague: return (.muslimWorldLeague, "Muslim World League")
            case .singapore: return (.singapore, "Singapore / Malaysia")
            case .ummAlQura: return (.ummAlQura, "Umm al-Qura")
            case .moonsightingCommittee: return (.moonsightingCommittee, "Moonsighting Committee")
            case .northAmerica: return (.northAmerica, "ISNA / North America")
            case .egyptian: return (.egyptian, "Egyptian")
            case .karachi: return (.karachi, "Karachi")
            case .turkey: return (.turkey, "Türkiye")
            case .dubai: return (.dubai, "Dubai / UAE")
            case .qatar: return (.qatar, "Qatar")
            case .kuwait: return (.kuwait, "Kuwait")
            }
        }

        if let chosen = explicit(override) { return chosen }

        switch countryCode?.uppercased() {
        case "SG", "MY", "ID", "BN":
            return (.singapore, "Singapore / Malaysia")
        case "SA":
            return (.ummAlQura, "Umm al-Qura")
        case "AE":
            return (.dubai, "Dubai / UAE")
        case "QA":
            return (.qatar, "Qatar")
        case "KW":
            return (.kuwait, "Kuwait")
        case "EG":
            return (.egyptian, "Egyptian")
        case "PK", "IN", "BD":
            return (.karachi, "Karachi")
        case "TR":
            return (.turkey, "Türkiye")
        case "US", "CA", "GB", "IE":
            return (.moonsightingCommittee, "Moonsighting Committee")
        default:
            return (.muslimWorldLeague, "Muslim World League")
        }
    }

    private func makeMUISDay(for date: Date, from records: [MUISRecord], timeZone: TimeZone) -> PrayerDay? {
        let calendar = Calendar.gregorian(in: timeZone)
        let dateFormatter = DateFormatter()
        dateFormatter.calendar = calendar
        dateFormatter.locale = Locale(identifier: "en_US_POSIX")
        dateFormatter.timeZone = timeZone
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let key = dateFormatter.string(from: date)

        guard let record = records.first(where: { $0.date == key }) else { return nil }

        func parse(_ time: String) -> Date? {
            let clean = time.trimmingCharacters(in: .whitespacesAndNewlines)
            let parts = clean.split(separator: ":").compactMap { Int($0) }
            guard parts.count >= 2 else { return nil }
            var components = calendar.dateComponents([.year, .month, .day], from: date)
            components.hour = parts[0]
            components.minute = parts[1]
            components.second = parts.count > 2 ? parts[2] : 0
            return calendar.date(from: components)
        }

        guard
            let fajr = parse(record.subuh),
            let sunrise = parse(record.syuruk),
            let dhuhr = parse(record.zohor),
            let asr = parse(record.asar),
            let maghrib = parse(record.maghrib),
            let isha = parse(record.isyak)
        else { return nil }

        return PrayerDay(
            localDate: date,
            entries: [
                PrayerEntry(kind: .fajr, date: fajr),
                PrayerEntry(kind: .sunrise, date: sunrise),
                PrayerEntry(kind: .dhuhr, date: dhuhr),
                PrayerEntry(kind: .asr, date: asr),
                PrayerEntry(kind: .maghrib, date: maghrib),
                PrayerEntry(kind: .isha, date: isha)
            ],
            sourceTitle: "Source: MUIS Official Timetable",
            sourceDetail: "Majlis Ugama Islam Singapura • data.gov.sg",
            isOfficial: true,
            timeZoneIdentifier: timeZone.identifier
        )
    }

    private func fetchAllMUISRecords() async throws -> [MUISRecord] {
        var all: [MUISRecord] = []
        var offset = 0
        let limit = 1000

        while true {
            var components = URLComponents(string: "https://data.gov.sg/api/action/datastore_search")!
            components.queryItems = [
                URLQueryItem(name: "resource_id", value: consolidatedDatasetID),
                URLQueryItem(name: "limit", value: String(limit)),
                URLQueryItem(name: "offset", value: String(offset))
            ]
            guard let url = components.url else { throw URLError(.badURL) }

            var request = URLRequest(url: url)
            request.timeoutInterval = 15
            request.setValue("Qibla/1.0 iOS", forHTTPHeaderField: "User-Agent")

            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode else {
                throw URLError(.badServerResponse)
            }

            let decoded = try JSONDecoder().decode(MUISAPIResponse.self, from: data)
            guard decoded.success else { throw URLError(.cannotParseResponse) }

            all.append(contentsOf: decoded.result.records)
            if decoded.result.records.count < limit { break }
            offset += decoded.result.records.count
            if offset > 10000 { break }
        }

        guard !all.isEmpty else { throw URLError(.zeroByteResource) }
        return all
    }

    private func loadMUISCache() -> MUISCache? {
        guard let data = UserDefaults.standard.data(forKey: cacheKey) else { return nil }
        return try? JSONDecoder().decode(MUISCache.self, from: data)
    }

    private func saveMUISCache(_ cache: MUISCache) {
        guard let data = try? JSONEncoder().encode(cache) else { return }
        UserDefaults.standard.set(data, forKey: cacheKey)
    }
}
