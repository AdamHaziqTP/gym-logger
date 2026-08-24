# Gym Logger decisions

## Locked product decisions

- Apple Notes remains the canonical archive; Gym Logger is a local convenience layer.
- Target is an iPhone-first Home Screen PWA, not a native app by default.
- No account, backend, Supabase, cloud sync, analytics, AI, timers, checklists, programs, streaks, or generic exercise database.
- All visible table cells are unrestricted strings. Preserve values such as `body weight`, `8,6`, and `8.75 + 1 weight kg` exactly.
- Fixed columns are `Exercise | Sets | Reps | Weight | Skip`.
- A row-level highlight choice applies across the row. Labels are `Arms`, `Back`, `Chest`, `Delts`, `Legs`; `None` remains available for other work.
- Normal behavior is clone the latest session into today's local date, then edit freely with autosave and no finish state.
- Skipped rows remain in the session and count toward totals. `Skip` is plain text.
- Summary totals can be manually overridden; the seed's `40 sets / 39 exercises` mismatch is intentional.
- History is reverse chronological with simple local search. Historical sessions remain editable. Deleting an app copy does not affect Apple Notes.

## Implementation choices to validate

- New-session `Skip` and bottom notes default to cleared because they describe the new day; source values remain available in the source session.
- The first vertical slice uses the simplest reliable horizontal table behavior. It must preserve Notes-like usability; frozen Exercise-column behavior is a later comparison, not an invented requirement.
- The first vertical slice may use a browser-visible seed/import path for development, but must not hardcode generic fitness behavior or discard the supplied fixture.

## Product escalation rule

If the spec, references, and this file do not determine a user-facing behavior, pause only the affected branch and write an escalation with the conflicting evidence, options, and recommendation. Do not let OX invent the product decision.
