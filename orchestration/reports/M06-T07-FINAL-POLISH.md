# M06-T07 final polish — Codex acceptance review

Date: 2026-08-26  
Project: Gym Logger  
Base: `2c23f97`  
Mode: Codex orchestrator → DSH/OX Alpha attempted → Codex independent verification

## Scope

This bounded batch implements the product owner's final polish decisions from
`HUMAN-VERIFICATION-FINAL-IPHONE14-PROMAX-2026-08-26.md`:

- Compact remains the preferred/default export style while Faithful remains
  available.
- `Share Colour Snapshot` provides a direct Compact PNG image handoff near
  `Copy to Notes`; it is explicitly not the editable Notes path.
- Cut is removed from the row menu.
- Paste replaces the selected row's contents without changing identity,
  position, or row count.
- Existing Gym Logger icon references are cache-busted for a fresh iPhone
  Home Screen install.

The Apple Notes colour question was not reopened. E-004 remains
`BLOCKED/DEFERRED — NEEDS MAC/XCODE`.

## OX Alpha dispatch record

All three tasks used the verified Desktop wrapper, not the npm/global CLI:

| Task | Task file | Result |
|---|---|---|
| Compact snapshot share | `orchestration/tasks/M06-T07-SHARE-SNAPSHOT.md` | No usable stdout/stderr, report, or repository delta in the bounded window; stopped as task-level timeout |
| Row-menu polish | `orchestration/tasks/M06-T07-ROW-MENU-POLISH.md` | No usable stdout/stderr, report, or repository delta in the bounded window; stopped as task-level timeout |
| Icon/cache-bust polish | `orchestration/tasks/M06-T07-ICON-CACHE-BUST.md` | No usable stdout/stderr, report, or repository delta in the bounded window; stopped as task-level timeout |

Invocation configuration for each task:

- Wrapper: `C:\Users\adam4\AppData\Roaming\DSH Desktop\host-commands\desktop\bin\dsh.cmd`
- Profile: `headless`
- Provider/model: `openrouter` / `stealth/ox-alpha`
- Active patch: `orchestration/product-sync/generated/active-worker.patch.yml`

The existing `orchestration/reports/OX-DSH-RECOVERY-2026-08-26.md` proves the
wrapper and OX smoke path work. These larger task-level timeouts are therefore
recorded as bounded worker hangs, not as OX unavailability. Codex fallback was
used only after that concrete classification.

## Codex implementation and audit

- `CompactSnapshotShare` prepares the Compact PNG locally and invokes the
  existing file-share/download delivery path only from the user action.
- The existing `Copy to Notes` editable-table path is unchanged.
- `replaceRowContentsById` copies all free-form values and highlight while
  retaining the selected row's id and position.
- The visible row menu no longer exposes Cut.
- `index.html` and the manifest use `?v=20260826-1` icon URLs. The supplied
  deliberate icon assets and dimensions remain unchanged.
- The first full-suite run exposed one genuine test-contract collision from a
  pre-rendered snapshot status message. Codex narrowed that status to the
  snapshot component and reran the full suite green.

## Independent verification

| Check | Result |
|---|---|
| M06-T07 focused tests | **PASS — 74/74** across 6 files |
| Full test suite | **PASS — 374/374** across 32 files |
| Production build | **PASS — `tsc` + Vite; service-worker stamp generated** |
| PWA icon/static assertions | **PASS** |
| Runtime/static host contract | **PASS by build/static audit; physical install remains open** |
| `git diff --check` | **PASS** (line-ending warnings only) |

No desktop result is being promoted to a physical iPhone pass.

## Acceptance state

M06-T07 is accepted for automated scope. The only new human checks are:

1. Remove the old plain-`G` Home Screen installation, reopen the fresh build,
   re-add it, and confirm the deliberate Gym Logger icon appears.
2. Open a session, wait for `Share Colour Snapshot` to be ready, tap it once,
   and confirm the iOS share sheet opens with the coloured Compact image.

The normal editable Notes path remains accepted from the prior device evidence
without colours. E-004 remains parked and is not part of this v1 gate.
