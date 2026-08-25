# M03-T03 - optional Shortcuts colour handoff

This is an optional device experiment. The normal **Copy to Notes** button is
unchanged and remains the reliable uncoloured editable-table fallback.

## One-time iPhone setup

The colour handoff should append to the existing canonical Apple Note named
**Gym**. It should not create a new note for every workout.

1. Open the **Shortcuts** app and create a shortcut named **Gym Logger Notes Colours**.
2. In the shortcut's details, allow it to receive **Files** and **Rich Text** from the Share Sheet.
3. Add **Get Text from Input**.
4. Add **Make Rich Text from HTML** and pass it the result from the previous action.
5. Add **Find Notes**. Configure it to find the existing note whose name/title is exactly **Gym** and limit the result to one note.
6. Add **Append to Note**. Use **Rich Text from HTML** as the content to append and the result of **Find Notes** as the destination note.
7. Save the shortcut.

Do not use **Create Note** for the normal workflow; that action creates a new
Apple Note and may prompt for a new note name.

## Device proof

On a trusted HTTPS Gym Logger build, open a real session and tap **Share for
Notes Colours**. Choose **Gym Logger Notes Colours** in the iPhone share sheet.
Then inspect the existing **Gym** Apple Note:

- the workout is appended to the existing Gym note rather than creating a new note;
- the appended table is a real editable Notes table;
- date, five-entry legend, row order, values, summary override, and notes survive;
- Arms, Back, Chest, Delts, and Legs retain their intended Notes text/highlight colours;
- unhighlighted rows remain uncoloured.

This document is setup guidance only. Desktop tests can prove file name, MIME,
payload fidelity, capability detection, and truthful share outcomes; they
cannot prove Shortcuts execution or Apple Notes editability/colours. If the
shortcut creates an attachment, plain text, a duplicate/new note, or loses
colours, record that as a failed bounded route. Do not rerun the earlier
disproven HTML clipboard variants. A native attributed-string helper would
require a separate product decision.
