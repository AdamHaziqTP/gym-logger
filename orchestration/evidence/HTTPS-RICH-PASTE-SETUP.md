# M03-T01 trusted HTTPS verification setup

Status: **READY FOR HUMAN DEVICE RETEST**

## Secure app URL

The existing Vite PWA is serving over HTTPS at:

`https://192.168.1.49:5173`

Codex verified HTTP 200 from the workstation, including the expected `Gym Log` page shell.

## Install the local development certificate on iPhone

This is a local self-signed development certificate for `192.168.1.49`; it is not a public production certificate.

1. On the iPhone, open `http://192.168.1.49:5174/gym-logger-dev.cer` in Safari.
2. Allow the configuration profile download.
3. Open iPhone Settings → **Profile Downloaded** → install the `192.168.1.49` certificate profile.
4. Open Settings → General → About → **Certificate Trust Settings** and enable full trust for the installed `192.168.1.49` certificate.
5. Reopen `https://192.168.1.49:5173` in Safari. If Safari still shows a certificate warning, stop and report it; do not treat the origin as trusted.

The certificate file contains only the public certificate. The private `.pfx` and password remain local and ignored by Git.

## Rich-paste retest

On the secure URL, open the existing session and tap **Copy to Notes**. Expected rich-path status:

`Copied to Notes ✓`

Paste once into Apple Notes and record whether the editable table, row order, five-category legend, row colors, weird values, summary override, and multiline notes survive. Record screenshots and the iOS/Safari version in `HUMAN-VERIFICATION-M03-T01.md`.

Do not accept plain-text-only behavior yet. M03-T02 remains blocked until this secure-origin result exists.
