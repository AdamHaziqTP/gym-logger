# Gym Logger Handoff Bundle

Start here:

1. Read `GYM_LOGGER_SPEC.md` completely.
2. Inspect `references/IMG_5550.png` through `IMG_5554.jpeg` for the Apple Notes table interaction target.
3. Inspect `references/IMG_5501.jpeg` and `IMG_5502.jpeg` for the full-session screenshot problem.
4. Use `seed/latest-session.example.json` as the primary regression fixture.
5. Use `references/text 2.txt` only to understand historical/free-form data; historical import is not a v1 requirement.

Critical first implementation spikes:
- offline Home Screen web app;
- IndexedDB persistence after app termination;
- rich HTML clipboard pasted into Apple Notes on a real iPhone;
- one tall 40-row PNG export on a real iPhone.

Do not add generic fitness-tracker features.
