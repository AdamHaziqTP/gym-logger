# M05-T01-BACKUP-RESTORE-02-CORRECTION — report

Bounded correction of the `M05-T01-BACKUP-RESTORE-01` test typing after Codex
verification. Scope: **only** `src/tests/backupDomain.test.ts`. No product,
domain, UI, or backup/restore behavior changed.

## Codex findings → fixes

### 1. TS6133 — `validJson` declared but unused

Kept and **used in its intended place**: the valid-import assertion now proves
that the serialized document parsed back as arbitrary runtime JSON (the exact
shape a real import hands the validator) validates to the identical typed
document, with no cast anywhere on the import path.

### 2. TS2339 — `.error` accessed without narrowing the union

Root cause: the tests called an `expectParseError(...)` helper that was
referenced three times but never defined (this also surfaced as three
unlisted `TS2304` errors at build). The helper is now defined to narrow the
real `BackupParseResult` discriminated union:

```ts
function expectParseError(text: string): string {
  const result = parseBackupJson(text);
  if (!result.ok) return result.error;
  throw new Error(`expected parse of ${text} to fail, but it succeeded`);
}
```

No casts; an unexpected `ok: true` fails the test loudly instead of being
papered over. An unexpected failure inside `expectRejected` was already
guarded by its own `if (!result.ok)` branch.

### 3. TS18046 — arbitrary JSON treated as `unknown` then read (`doc.sessions`)

Replaced the lying `mutate((doc: Record<string, unknown>) => ...)` helper,
whose mutators indexed into `unknown`, with typed assembly helpers that feed
deliberately invalid **object literals** straight into
`validateBackupObject(value: unknown)`:

- `withoutKey(value, key)` — shallow copy minus one key ("field absent").
- `withSessions(sessions)` — rebuilds the document with replaced sessions.
- `withSessionField(field, value)` / `withFirstRow(row)` — rebuild one
  session/row slot with arbitrary data over otherwise-valid bytes.

No property is ever accessed on `unknown`; all reads stay on the exported
`BackupFile`/`BackupSession`/`BackupRow` types produced by the domain helper.
Every original refusal case survives 1:1 (same input values, same expected
error fragments), including no-coercion cases (`42` never becomes `"42"`,
`"0"` is not a position, `"green"` is not a highlight).

## Verification results

| Check | Command | Result |
| --- | --- | --- |
| Focused backup suites | `npx vitest --run src/tests/backupDomain.test.ts src/tests/backupRestore.test.tsx --reporter=verbose` | 43/43 passed |
| Full suite | `npm test -- --run --reporter=dot` | 262/262 passed (21 files) |
| Build | `npm run build` | passed — `tsc` clean, vite build ok (no TypeScript errors) |
| Whitespace | `git diff --check` | exit 0 (benign CRLF advisories only) |

Pre-fix baseline reproduced first: 30 errors in `src/tests/backupDomain.test.ts`
(1×TS6133, 3×TS2304, 26×TS18046); post-fix: zero.

## Acceptance confirmation

- Strict schema validation, arbitrary-string fidelity, exact IDs/order,
  summary overrides, cancel/no-change behavior, and explicit replacement
  confirmation are asserted exactly as before — no test was weakened or
  removed; assertions were only re-expressed with type-safe assembly.
- No claim is made about physical iPhone Files/share/restore behavior;
  that remains deferred to the consolidated final device pass.
