import Foundation
import CoreLocation
import UIKit

@MainActor
final class LocationService: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published private(set) var context: LocationContext?
    @Published private(set) var heading: Double?
    @Published private(set) var headingAccuracy: Double = -1
    @Published private(set) var authorizationStatus: CLAuthorizationStatus
    @Published private(set) var isRefreshing = false
    @Published private(set) var lastError: String?

    private let manager = CLLocationManager()
    private let geocoder = CLGeocoder()
    private var lastReverseGeocodedLocation: CLLocation?

    override init() {
        authorizationStatus = manager.authorizationStatus
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        manager.distanceFilter = 250
        manager.headingFilter = 1
        manager.headingOrientation = .portrait
    }

    var qiblaBearing: Double? {
        guard let context else { return nil }
        return AngleMath.qiblaBearing(latitude: context.latitude, longitude: context.longitude)
    }

    var relativeQiblaAngle: Double? {
        guard let qiblaBearing, let heading else { return nil }
        return AngleMath.shortestDifference(target: qiblaBearing, current: heading)
    }

    var compassQuality: CompassQuality {
        guard CLLocationManager.headingAvailable(), heading != nil else { return .unavailable }
        guard headingAccuracy >= 0 else { return .poor }
        if headingAccuracy <= 12 { return .good }
        if headingAccuracy <= 25 { return .fair }
        return .poor
    }

    func start() {
        authorizationStatus = manager.authorizationStatus
        switch authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedAlways, .authorizedWhenInUse:
            requestFreshLocation()
            startHeading()
        case .denied, .restricted:
            lastError = "Location permission is disabled."
        @unknown default:
            lastError = "Location access is unavailable."
        }
    }

    func requestFreshLocation() {
        guard authorizationStatus == .authorizedAlways || authorizationStatus == .authorizedWhenInUse else {
            start()
            return
        }
        isRefreshing = true
        lastError = nil
        manager.requestLocation()
        startHeading()
    }

    func restartHeading() {
        manager.stopUpdatingHeading()
        startHeading()
    }

    func openSettings() {
        guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
        UIApplication.shared.open(url)
    }

    private func startHeading() {
        guard CLLocationManager.headingAvailable() else {
            heading = nil
            headingAccuracy = -1
            return
        }
        manager.startUpdatingHeading()
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
        if authorizationStatus == .authorizedAlways || authorizationStatus == .authorizedWhenInUse {
            requestFreshLocation()
        } else if authorizationStatus == .denied || authorizationStatus == .restricted {
            lastError = "Location permission is disabled."
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last, location.horizontalAccuracy >= 0 else { return }
        isRefreshing = false

        let previous = context
        let provisional = LocationContext(
            latitude: location.coordinate.latitude,
            longitude: location.coordinate.longitude,
            locality: previous?.locality ?? "Current Location",
            countryCode: previous?.countryCode,
            timeZoneIdentifier: previous?.timeZoneIdentifier ?? TimeZone.current.identifier,
            horizontalAccuracy: location.horizontalAccuracy
        )
        context = provisional

        let shouldReverseGeocode: Bool
        if let last = lastReverseGeocodedLocation {
            shouldReverseGeocode = location.distance(from: last) > 1500
        } else {
            shouldReverseGeocode = true
        }

        guard shouldReverseGeocode else { return }
        lastReverseGeocodedLocation = location

        geocoder.cancelGeocode()
        geocoder.reverseGeocodeLocation(location) { [weak self] placemarks, _ in
            guard let self else { return }
            Task { @MainActor in
                let place = placemarks?.first
                let locality = place?.locality
                    ?? place?.subAdministrativeArea
                    ?? place?.administrativeArea
                    ?? "Current Location"
                let country = place?.country
                let display = country.map { "\(locality), \($0)" } ?? locality
                let zone = place?.timeZone ?? TimeZone.current

                self.context = LocationContext(
                    latitude: location.coordinate.latitude,
                    longitude: location.coordinate.longitude,
                    locality: display,
                    countryCode: place?.isoCountryCode,
                    timeZoneIdentifier: zone.identifier,
                    horizontalAccuracy: location.horizontalAccuracy
                )
            }
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        isRefreshing = false
        lastError = error.localizedDescription
    }

    func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        guard newHeading.headingAccuracy >= 0 else {
            headingAccuracy = newHeading.headingAccuracy
            return
        }

        let raw = newHeading.trueHeading >= 0 ? newHeading.trueHeading : newHeading.magneticHeading
        headingAccuracy = newHeading.headingAccuracy

        guard let old = heading else {
            heading = AngleMath.normalize(raw)
            return
        }

        let delta = AngleMath.shortestDifference(target: raw, current: old)
        heading = AngleMath.normalize(old + delta * 0.28)
    }

    func locationManagerShouldDisplayHeadingCalibration(_ manager: CLLocationManager) -> Bool {
        headingAccuracy > 25
    }
}
