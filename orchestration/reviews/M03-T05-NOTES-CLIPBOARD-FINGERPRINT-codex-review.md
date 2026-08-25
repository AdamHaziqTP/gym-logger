# M03-T05 Notes clipboard fingerprint — Codex review

Date: 2026-08-26
Decision: **ACCEPTED for isolated automated scope; target-iPhone clipboard capture remains pending**

## Delivered

- Added the standalone HTTPS page at
  `public/feasibility/notes-clipboard-fingerprint.html`.
- Added a read-only fingerprint module that calls
  `navigator.clipboard.read()` only after the explicit inspection tap.
- Preserved browser item order and each item's type order.
- Captured complete browser-readable textual payloads, byte lengths, and
  SHA-256 hashes when Web Crypto is available.
- Recorded non-text types by type/size/hash without claiming access to native
  pasteboard payloads.
- Added honest unsupported, denied, partial-read, and hash-unavailable states.
- Added on-page JSON output and a downloadable JSON report.
- Left production `Copy to Notes` and the React application unchanged.

## Independent verification

- Focused diagnostic tests: **6/6 PASS**.
- Full suite: **404/404 PASS** across 34 test files.
- Production build: **PASS**; Vite emitted the diagnostic assets and stamped
  the service worker.
- Local static check: standalone title/button present; React `id="root"`
  marker absent.
- LAN HTTPS check: `https://192.168.1.49:4173/feasibility/notes-clipboard-fingerprint.html`
  returned HTTP 200 with the standalone diagnostic title/button and without
  the React shell marker.
- Diff audit: diagnostic is isolated under `public/feasibility/`; no
  production clipboard implementation was changed.

## Not claimed

Automation does not establish whether Apple Notes' colours are present in the
browser-visible clipboard, and it does not inspect native iOS pasteboard
representations. The next gate is one physical iPhone capture starting from
Apple Notes. If the captured browser-visible payload has no colour-bearing
representation, advance the staged E-004 native inspection branch.
