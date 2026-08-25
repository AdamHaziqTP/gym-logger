# M03-T03 - optional Shortcuts colour handoff

This is an optional device experiment. The normal **Copy to Notes** button is
unchanged and remains the reliable uncoloured editable-table fallback.

## One-time iPhone setup

1. Open the **Shortcuts** app and create a shortcut named **Gym Logger Notes Colours**.
2. In the shortcut's details, allow it to receive **Files** and **Rich Text** from the Share Sheet.
3. Add **Get Text from Input**.
4. Add **Make Rich Text from HTML** and pass it the result from the previous action.
5. Add **Create Note** in Apple Notes and pass it the Rich Text result as the note body.
6. Save the shortcut.

## Device proof

On a trusted HTTPS Gym Logger build, open a real session and tap **Share for
Notes Colours**. Choose **Gym Logger Notes Colours** in the iPhone share sheet.
Then inspect the created Apple Note:

- the table is a real editable Notes table;
- date, five-entry legend, row order, values, summary override, and notes survive;
- Arms, Back, Chest, Delts, and Legs retain their intended Notes text/highlight colours;
- unhighlighted rows remain uncoloured.

This document is setup guidance only. Desktop tests can prove file name, MIME,
payload fidelity, capability detection, and truthful share outcomes; they
cannot prove Shortcuts execution or Apple Notes editability/colours. If the
shortcut creates an attachment, plain text, or loses colours, record that as a
failed bounded route. Do not rerun the earlier disproven HTML clipboard
variants. A native attributed-string helper would require a separate product
decision.
