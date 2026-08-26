# Return-to-PWA latest-session requirement — 2026-08-26

Status: `LOCKED PRODUCT REQUIREMENT`

When the Apple Notes colour/Shortcut feasibility branch finishes and work returns to the production Gym Logger PWA, the app's latest/last workout must be the product owner's actual Tuesday 25 Aug 2026 session (`actual-2026-08-25`), not the historical Sunday seed/fixture.

Requirements:

- Home `Last Workout` must resolve to the actual Tuesday 25 Aug 2026 session when no later legitimate user session exists.
- `Start Today's Session` / normal clone-latest behavior must use that Tuesday session as its source under the same condition.
- Do not re-seed or promote the historical Sunday 23 Aug fixture over the migrated actual Tuesday session.
- The current native Phase C proof fixture is transport-test data only and must not redefine production PWA latest-session state.
- Preserve unrelated legitimate later user sessions. If a later development/test clone exists, do not silently delete it; surface it for explicit cleanup/verification instead.

Existing migration evidence already identifies `actual-2026-08-25` as the one-time production migration. This note makes the post-Phase-C product expectation explicit so the colour-recovery work cannot accidentally regress the production latest-session source.
