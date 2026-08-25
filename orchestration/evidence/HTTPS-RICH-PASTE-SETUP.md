# M03-T01 trusted HTTPS verification setup

Status: **READY FOR HUMAN DEVICE RETEST**

## Secure app URL

The existing Vite PWA is serving over HTTPS at:

`https://192.168.1.49:5173`

Codex verified HTTP 200 from the workstation, including the expected `Gym Log` page shell.

## Install the local development certificate on iPhone

This is a local development trust chain for `192.168.1.49`; it is not a public
production certificate. The downloadable certificate is now the proper local
root CA, while the HTTPS server uses a separate leaf certificate with an IP
SAN for `192.168.1.49` and a server-auth usage.

1. On the iPhone, open `http://192.168.1.49:5174/gym-logger-dev.cer` in Safari.
2. If the old `192.168.1.49` certificate profile is still installed, remove it
   first from Settings → General → VPN & Device Management. Allow the new
   certificate download, then install **Gym Logger Local Root CA** from iPhone
   Settings → **Profile Downloaded**.
3. Open Settings → General → About → **Certificate Trust Settings** and enable full trust for **Gym Logger Local Root CA**.
4. Reopen `https://192.168.1.49:5173` in Safari. The page must open normally without a warning or manual interstitial. If Safari still shows a certificate warning, stop and report it; do not treat the origin as trusted.

The downloadable certificate contains only the public root CA. The private
server `.pfx`, password, and local key material remain on the workstation and
are ignored by Git.

## Rich-paste retest

On the secure URL, open the existing session and tap **Copy to Notes**. Expected rich-path status:

`Copied to Notes ✓`

Paste once into Apple Notes and record whether the editable table, row order, five-category legend, row colors, weird values, summary override, and multiline notes survive. Record screenshots and the iOS/Safari version in `HUMAN-VERIFICATION-M03-T01.md`.

Do not accept plain-text-only behavior yet. M03-T02 remains blocked until this secure-origin result exists.
