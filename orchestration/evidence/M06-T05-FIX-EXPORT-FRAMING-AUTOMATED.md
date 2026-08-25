# M06-T05 framing correction — automated evidence

Date: 2026-08-26

Automated evidence for the bounded PNG framing correction:

- `npm test -- --run --reporter=dot`: **32 files / 374 tests PASS**
- Focused PNG + migration run: **27 tests PASS**
- `npm run build`: **PASS**
- `git diff --check`: **PASS**
- `https://192.168.1.49:4173/`: **HTTP 200** from the workstation
- `http://192.168.1.49:5174/gym-logger-dev.cer`: **HTTP 200** from the
  workstation over the LAN address

This evidence proves the engineering checkpoint only. It does not claim that
the target iPhone's saved Faithful or Compact PNG is physically accepted.
