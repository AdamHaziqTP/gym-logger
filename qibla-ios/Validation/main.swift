import Foundation

func approx(_ actual: Double, _ expected: Double, tolerance: Double, _ label: String) {
    if abs(actual - expected) > tolerance {
        fatalError("\(label): expected ~\(expected), got \(actual)")
    }
}

approx(AngleMath.qiblaBearing(latitude: 1.3521, longitude: 103.8198), 293.02, tolerance: 0.25, "Singapore Qibla")
approx(AngleMath.qiblaBearing(latitude: 33.5902, longitude: 130.4017), 288.39, tolerance: 0.25, "Fukuoka Qibla")
approx(AngleMath.qiblaBearing(latitude: 35.6762, longitude: 139.6503), 293.00, tolerance: 0.25, "Tokyo Qibla")
approx(AngleMath.qiblaBearing(latitude: 51.5074, longitude: -0.1278), 118.99, tolerance: 0.25, "London Qibla")
approx(AngleMath.qiblaBearing(latitude: 40.7128, longitude: -74.0060), 58.48, tolerance: 0.25, "New York Qibla")
approx(AngleMath.qiblaBearing(latitude: -33.8688, longitude: 151.2093), 277.50, tolerance: 0.25, "Sydney Qibla")

let fukuoka = Coordinates(latitude: 33.5902, longitude: 130.4017)
var params = CalculationMethod.muslimWorldLeague.params
params.madhab = .shafi
let date = DateComponents(year: 2026, month: 10, day: 6)

guard let prayers = PrayerTimes(coordinates: fukuoka, date: date, calculationParameters: params) else {
    fatalError("Adhan failed to calculate Fukuoka prayer times")
}

let ordered = [prayers.fajr, prayers.sunrise, prayers.dhuhr, prayers.asr, prayers.maghrib, prayers.isha]
for pair in zip(ordered, ordered.dropFirst()) {
    if pair.0 >= pair.1 {
        fatalError("Prayer times are not strictly ordered for Fukuoka")
    }
}

print("Validation PASS")
print("Singapore Qibla:", AngleMath.qiblaBearing(latitude: 1.3521, longitude: 103.8198))
print("Fukuoka Qibla:", AngleMath.qiblaBearing(latitude: 33.5902, longitude: 130.4017))
