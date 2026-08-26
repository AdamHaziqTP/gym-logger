# M03-T09 — real production-session native manual-paste handoff

Status: `READY FOR TARGET-IPHONE VERIFICATION`

Target: iPhone 14 Pro Max

Build: hosted macOS/Xcode workflow
[`32972780014`](https://github.com/AdamHaziqTP/gym-logger/actions/runs/32972780014)
(`GymLoggerPasteboardHelper-unsigned` artifact, commit `08f894b`).

This is the single physical proof for the productized fallback. It is not a
Shortcut append test. The expected flow is Gym Logger → native helper → native
coloured clipboard → one manual Paste in the existing `Gym` note.

## Simple test

1. Install the newest `GymLoggerPasteboardHelper-unsigned` artifact from the
   hosted macOS/Xcode workflow. Keep the helper installed alongside the PWA.
2. Open the trusted Gym Logger HTTPS build and open the real Tuesday session
   shown as **Tuesday 25 Aug** / `actual-2026-08-25`. Do not use the helper's
   isolated fixture button for this test.
3. Make one harmless visual check that the session has the expected real rows,
   then tap **Prepare Coloured Notes Copy**.
4. If iOS opens the helper, wait for the message that the coloured clipboard is
   ready. If it does not, open **Gym Logger Pasteboard Proof** manually; it
   should show the received Tuesday session, then tap **Prepare Coloured
   Clipboard & Open Notes**.
5. Open the existing Apple Notes note named **Gym**. Paste once at the intended
   insertion point. Do not use the old `Gym Logger to Gym` Shortcut.
6. Check the result:

   - editable Notes table;
   - date is Tuesday 25 Aug, not the Sunday fixture;
   - legend reads `Arms Back Chest Delts Legs` with spaces;
   - legend labels are Arms orange, Back purple, Chest mint, Delts blue, Legs pink;
   - workout rows retain their five category colours;
   - row order and all free-form values are correct;
   - summary override and notes are present;
   - Unicode such as `30°`, `·`, `—`, and punctuation is intact.

## Record the result

Set each item to `PASS`, `FAIL`, or `BLOCKED` and add screenshots for any
failure. Record whether the helper opened Notes automatically; automatic
opening is convenience only, while the clipboard/paste result is the core
acceptance.

Do not infer this device result from the source, desktop tests, or the earlier
B2 fixture proof. If this test passes, the productized native manual-paste
route is accepted. If it fails, keep ordinary uncoloured `Copy to Notes` as the
v1 fallback and route only the affected helper branch for correction.
