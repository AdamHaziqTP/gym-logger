# Qibla

A private, ad-free iPhone prayer utility focused on two things: trustworthy local prayer times and a live Qibla compass.

## Core behavior

- Uses Core Location on-device for latitude/longitude, approximate locality, timezone and live heading.
- Calculates Qibla locally as the initial great-circle bearing to the Kaaba at 21.4225 N, 39.8262 E.
- In Singapore, automatic mode prefers the official MUIS consolidated prayer timetable from data.gov.sg and caches it locally.
- Outside Singapore, automatic mode chooses a recognized regional calculation preset and calculates on-device using Batoul Apps Adhan Swift 1.5.0.
- Pull-to-refresh reacquires location, restarts heading observation and refreshes official data where applicable.
- No account, ads, analytics or tracking SDK.

## Data sources

Singapore official dataset:
- MUIS Muslim Prayer Timetable (consolidated)
- data.gov.sg resource id: d_a6a206cba471fe04b62dd886ef5eaf22
- Updated annually by MUIS; the app fetches all available rows with pagination and caches them.

Calculated prayer times:
- Adhan Swift 1.5.0 by Batoul Apps
- MIT License
- https://github.com/batoulapps/adhan-swift

## Build

The GitHub Actions workflow generates the Xcode project on a macOS runner, vendors the pinned Adhan 1.5.0 source, compiles a simulator check and a Release iphoneos build with code signing disabled, then packages Payload/Qibla.app as Qibla-unsigned.ipa.

The IPA is intentionally unsigned/re-signable for SideStore/AltStore-style personal sideloading.
