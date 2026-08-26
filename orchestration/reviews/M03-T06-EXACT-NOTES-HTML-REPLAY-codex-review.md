# M03-T06 exact Apple Notes HTML replay — Codex review

Date: 2026-08-26
Decision: **ACCEPTED for isolated automated scope; target-iPhone paste remains pending**

## Delivered

- Preserved the supplied fingerprint JSON byte-for-byte in
  `orchestration/evidence/fixtures/M03-T05-apple-notes-clipboard-fingerprint.json`.
- Mirrored the same immutable fixture under `public/feasibility/` so the
  standalone HTTPS proof can load it without touching the React app.
- Added `public/feasibility/notes-html-replay.html` and its module helpers.
- Pinned and revalidated the captured HTML/text byte lengths and SHA-256
  values.
- On the direct replay tap, creates one `ClipboardItem` with exactly
  `text/html` followed by `text/plain`, using the captured strings unchanged,
  then calls the browser clipboard write API.
- Added honest fixture-load, unsupported, permission, and write-success
  states. The page does not claim Apple Notes paste success.
- Left production `Copy to Notes` and all normal app UI unchanged.

## Independent verification

- Focused replay tests: **6/6 PASS**.
- Full suite: **410/410 PASS** across 35 test files.
- Production build: **PASS**; Vite emitted the replay page/fixture and
  stamped the service worker.
- Exact LAN HTTPS check: replay page HTTP 200, exact title/button present,
  React `id="root"` marker absent.
- Exact fixture LAN check: HTTP 200, 191,133 bytes, colour token present.
- Service-worker check: replay/fixture precached and `/feasibility/*` bypass
  present in the served `sw.js`.
- Diff audit: no production clipboard module or normal UI changed.

## Not claimed

Desktop verification cannot establish whether Apple Notes preserves colours
after this byte-equivalent replay. The next gate is one physical iPhone paste.
If it fails, the web-readable HTML is not sufficient as a writable Notes
representation and E-004 native inspection becomes the next bounded branch.
