# M06-T07 final human checks — iPhone 14 Pro Max

Use the current workstation build at:

`https://192.168.1.49:4173/`

These are the only new checks after the Codex-verified M06-T07 polish batch.
Do not clear Safari website data; remove only the old Home Screen app/icon so
iOS requests the cache-busted icon URLs again.

## HV-ICON — fresh Home Screen icon

1. Remove the existing Gym Logger icon/app from the iPhone Home Screen.
2. Open the URL above in Safari and reload once.
3. Use Safari's Add to Home Screen action.
4. Confirm the new Home Screen icon is the deliberate Gym Logger icon with
   the white device/table mark and five colour dots, not the old plain `G`.

Result: `PASS` / `FAIL`  
Evidence or observation: ______________________________

## HV-SNAPSHOT — direct Compact colour snapshot share

1. Open any session containing coloured rows.
2. On the session screen, wait until the button reads **Share Colour Snapshot**.
3. Tap it once.
4. Confirm the iOS share sheet opens with a coloured Compact workout image
   ready to share.
5. Cancel the sheet if you do not want to send it anywhere. This check is for
   the image snapshot handoff only; it does not claim an editable Apple Notes
   table or Notes colour transfer.

Result: `PASS` / `FAIL`  
Evidence or observation: ______________________________

Do not retest Apple Notes colour transfer here. The standard editable-table
path without transferred category colours is the accepted v1 limitation, and
E-004 remains blocked pending legitimate Mac/Xcode access.
