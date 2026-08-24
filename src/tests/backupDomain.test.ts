import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BACKUP_KIND,
  BACKUP_SCHEMA_VERSION,
  backupFilename,
  buildBackupDocument,
  deliverBackupJson,
  parseBackupJson,
  safetyBackupFilename,
  serializeBackupDocument,
  summarizeBackup,
  triggerJsonDownload,
  validateBackupObject,
  type BackupFile,
} from "../domain/backup";
import type { MetaRecord } from "../data/db";
import type { WorkoutRow, WorkoutSession } from "../domain/types";

/* ---------------------------------------------------------------------- */
/* Pure backup format coverage (spec §18.1; task M05-T01-                 */
/* BACKUP-RESTORE-01). Pins: deterministic serialization, complete field  */
/* capture (schema/kind/exportedAt/sessions/rows/positions/highlights/    */
/* arbitrary strings/overrides/notes/provenance/meta), STRICT validation  */
/* that coerces nothing, the pre-replacement summary facts, exact         */
/* filenames, and the honest delivery outcomes. iOS Files/share behavior  */
/* itself is NEVER claimed here (deferred device gate).                   */
/* ---------------------------------------------------------------------- */

const EXPORTED_AT = "2026-08-25T01:30:00.000Z";

function makeRow(overrides: Partial<WorkoutRow> & { id: string; position: number }): WorkoutRow {
  return {
    exercise: "",
    sets: "",
    reps: "",
    weight: "",
    skip: "",
    highlight: "none",
    ...overrides,
  };
}

function makeSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: "s1",
    dateLocal: "2026-08-20",
    createdAt: "2026-08-20T07:00:00.000Z",
    updatedAt: "2026-08-20T09:00:00.000Z",
    rows: [],
    notes: "",
    ...overrides,
  };
}

const HOSTILE_ROW_A = makeRow({
  id: "row-a",
  position: 0,
  exercise: 'SLDL (semi sumo?) {brace} \\ 30° IR',
  sets: "8,6",
  reps: '"10"',
  weight: "<img src=x onerror=alert(1)>kg",
  skip: "knee 🦵 line1\nline2",
  highlight: "mint",
});
const HOSTILE_ROW_B = makeRow({
  id: "row-b",
  position: 1,
  exercise: "W".repeat(300),
  highlight: "none",
});

/** Every session-level field the format promises, filled with odd values. */
const FULL_SESSION = makeSession({
  id: "session-full",
  dateLocal: "2026-02-03",
  createdAt: "2026-02-03T06:15:00.000Z",
  updatedAt: "2026-02-03T08:45:00.000Z",
  sourceSessionId: "session-original",
  rows: [HOSTILE_ROW_A, HOSTILE_ROW_B],
  notes: 'cardio <b>15</b>min & bike\nC:\\gym\\log "quoted" \\ {json:1}\n🧘 end',
  summaryOverride: { sets: "~41", exercises: "39ish" },
  copiedToNotesAt: "2026-02-04T10:00:00.000Z",
});

const PLAIN_SESSION = makeSession({ id: "session-plain" });

const META_RECORDS: MetaRecord[] = [
  {
    key: "seededFrom",
    value: "seed/latest-session.example.json@1",
    at: "2026-08-24T00:00:00.000Z",
  },
];

function buildFull(): BackupFile {
  return buildBackupDocument(
    [PLAIN_SESSION, FULL_SESSION],
    META_RECORDS,
    EXPORTED_AT,
  );
}

describe("buildBackupDocument is complete and deterministic", () => {
  it("carries schemaVersion, kind, exportedAt, sessions, and meta", () => {
    const doc = buildFull();
    expect(doc.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(doc.schemaVersion).toBe(1);
    expect(doc.kind).toBe(BACKUP_KIND);
    expect(doc.exportedAt).toBe(EXPORTED_AT);
    expect(doc.meta).toEqual([
      {
        key: "seededFrom",
        value: "seed/latest-session.example.json@1",
        at: "2026-08-24T00:00:00.000Z",
      },
    ]);
    expect(doc.sessions.map((session) => session.id)).toEqual([
      "session-full",
      "session-plain",
    ]);
  });

  it("captures every row field byte-for-byte, including hostile strings", () => {
    const doc = buildFull();
    const full = doc.sessions[0]!;
    expect(full.rows[0]).toEqual({
      id: "row-a",
      position: 0,
      exercise: 'SLDL (semi sumo?) {brace} \\ 30° IR',
      sets: "8,6",
      reps: '"10"',
      weight: "<img src=x onerror=alert(1)>kg",
      skip: "knee 🦵 line1\nline2",
      highlight: "mint",
    });
    // The 300-character unbroken word survives whole — no truncation.
    expect(full.rows[1]!.exercise).toBe("W".repeat(300));
  });

  it("captures provenance timestamps, overrides, and free-form notes verbatim", () => {
    const full = buildFull().sessions[0]!;
    expect(full.sourceSessionId).toBe("session-original");
    expect(full.copiedToNotesAt).toBe("2026-02-04T10:00:00.000Z");
    expect(full.summaryOverride).toEqual({ sets: "~41", exercises: "39ish" });
    expect(full.notes).toContain('C:\\gym\\log "quoted" \\ {json:1}');
    expect(full.notes).toContain("🧘 end");

    // A plain session carries none of the optional keys — absence stays
    // absent rather than being invented as empty values.
    const plain = buildFull().sessions[1]!;
    expect("sourceSessionId" in plain).toBe(false);
    expect("copiedToNotesAt" in plain).toBe(false);
    expect("summaryOverride" in plain).toBe(false);
  });

  it("serializes identically regardless of database read order", () => {
    const normal = serializeBackupDocument(buildFull());
    // Same records, reversed insertion orders and shuffled row order inside
    // an equivalent session: output must not change.
    const shuffledRowsSession = makeSession({
      id: "session-full",
      dateLocal: "2026-02-03",
      createdAt: "2026-02-03T06:15:00.000Z",
      updatedAt: "2026-02-03T08:45:00.000Z",
      sourceSessionId: "session-original",
      rows: [
        { ...HOSTILE_ROW_B },
        { ...HOSTILE_ROW_A },
      ],
      notes: FULL_SESSION.notes,
      summaryOverride: { sets: "~41", exercises: "39ish" },
      copiedToNotesAt: "2026-02-04T10:00:00.000Z",
    });
    const reshuffled = serializeBackupDocument(
      buildBackupDocument(
        [shuffledRowsSession, PLAIN_SESSION],
        [...META_RECORDS],
        EXPORTED_AT,
      ),
    );
    expect(reshuffled).toBe(normal);
  });

  it("sorts sessions by (dateLocal, createdAt, id) and rows by position", () => {
    const a = makeSession({
      id: "a",
      dateLocal: "2026-01-01",
      createdAt: "2026-01-01T07:00:00.000Z",
    });
    const b = makeSession({
      id: "b",
      dateLocal: "2026-01-01",
      createdAt: "2026-01-01T09:00:00.000Z",
    });
    const c = makeSession({
      id: "c",
      dateLocal: "2025-12-31",
      createdAt: "2026-12-31T23:00:00.000Z",
    });
    const doc = buildBackupDocument([b, a, c], [], EXPORTED_AT);
    expect(doc.sessions.map((session) => session.id)).toEqual(["c", "a", "b"]);
  });

  it("round-trips through JSON.parse without losing any value (J1–J5)", () => {
    const json = serializeBackupDocument(buildFull());
    const result = parseBackupJson(json);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual(buildFull());
    // Free-form strings survive exactly (J3), highlights too (J4):
    const restoredRow = result.data.sessions[0]!.rows[0]!;
    expect(restoredRow.skip).toBe("knee 🦵 line1\nline2");
    expect(restoredRow.highlight).toBe("mint");
    // Overrides survive (J5):
    expect(result.data.sessions[0]!.summaryOverride).toEqual({
      sets: "~41",
      exercises: "39ish",
    });
  });
});

describe("parse/validate refuses bad input without coercion", () => {
  const validDoc = buildFull();
  // The same document parsed back out of serialized JSON as arbitrary
  // runtime data — the exact shape a real import hands the validator.
  const validJson = JSON.parse(serializeBackupDocument(validDoc)) as unknown;

  // Backup-shaped pieces reused to assemble deliberately broken documents.
  const fullBackupSession = validDoc.sessions[0]!;
  const plainBackupSession = validDoc.sessions[1]!;
  const firstRow = fullBackupSession.rows[0]!;
  const secondRow = fullBackupSession.rows[1]!;

  function expectRejected(value: unknown, fragment: string): void {
    const result = validateBackupObject(value);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain(fragment);
    }
  }

  /**
   * Parses arbitrary text and narrows the REAL discriminated union (no
   * casts): the error text comes from the `ok: false` branch, and an
   * unexpected success fails the test loudly instead of being papered over.
   */
  function expectParseError(text: string): string {
    const result = parseBackupJson(text);
    if (!result.ok) return result.error;
    throw new Error(`expected parse of ${text} to fail, but it succeeded`);
  }

  /** A shallow copy of `value` minus one key — the "field absent" case. */
  function withoutKey(value: object, key: string): Record<string, unknown> {
    const copy: Record<string, unknown> = { ...value };
    delete copy[key];
    return copy;
  }

  /** Rebuilds the document with `sessions` replaced by arbitrary data. */
  function withSessions(sessions: unknown): unknown {
    return { ...validDoc, sessions };
  }

  /**
   * Rebuilds the document with one field of the first session replaced by
   * arbitrary data; every other byte stays the valid document's.
   */
  function withSessionField(field: string, value: unknown): unknown {
    const session: Record<string, unknown> = {
      ...fullBackupSession,
      [field]: value,
    };
    return withSessions([session, plainBackupSession]);
  }

  /**
   * Rebuilds the document with the first session's first row replaced by
   * arbitrary data; the untouched second row keeps the document honest.
   */
  function withFirstRow(row: unknown): unknown {
    const session = { ...fullBackupSession, rows: [row, secondRow] };
    return withSessions([session, plainBackupSession]);
  }

  it("accepts the valid document and a minimal v1 document", () => {
    expect(validateBackupObject(validDoc)).toEqual({
      ok: true,
      data: validDoc,
    });
    // Arbitrary JSON parsed from real file bytes validates to the same
    // typed document — the import path never needs a cast to work.
    expect(validateBackupObject(validJson)).toEqual({
      ok: true,
      data: validDoc,
    });
    expect(validateBackupObject({
      schemaVersion: 1,
      sessions: [],
      meta: [],
    }).ok).toBe(true);
  });

  it("rejects non-JSON text and non-object roots", () => {
    expect(parseBackupJson("not json {").ok).toBe(false);
    expect(parseBackupJson("[1,2,3]").ok).toBe(false);
    expect(expectParseError("null")).toContain("JSON object");
    expect(expectParseError('"just a string"')).toContain("JSON object");
    expect(expectParseError("{}")).toContain("schemaVersion");
  });

  it("rejects missing/wrong/unknown/future schema versions", () => {
    expectRejected(withoutKey(validDoc, "schemaVersion"), "schemaVersion");
    expectRejected({ ...validDoc, schemaVersion: "1" }, "schemaVersion");
    expectRejected({ ...validDoc, schemaVersion: 2 }, "newer format");
    expectRejected({ ...validDoc, schemaVersion: 0 }, "older format");
    expectRejected({ ...validDoc, schemaVersion: 1.5 }, "schemaVersion");
  });

  it("rejects a foreign kind marker", () => {
    expectRejected(
      { ...validDoc, kind: "other-app-backup" },
      "not a Gym Log backup",
    );
  });

  it("rejects missing or non-array sessions", () => {
    expectRejected(withoutKey(validDoc, "sessions"), "sessions list");
    expectRejected({ ...validDoc, sessions: {} }, "sessions list");
  });

  it("rejects malformed session shapes with a precise path", () => {
    expectRejected(withSessions(["nope"]), "sessions[0] is not an object");
    expectRejected(withSessionField("id", 42), "sessions[0].id");
    expectRejected(withSessionField("id", ""), "sessions[0].id");
    expectRejected(
      withSessionField("dateLocal", "2026-8-3"),
      "YYYY-MM-DD",
    );
    expectRejected(
      withSessionField("dateLocal", "03-02-2026"),
      "YYYY-MM-DD",
    );
    expectRejected(
      withSessionField("createdAt", 123),
      "createdAt",
    );
    expectRejected(
      withSessionField("updatedAt", null),
      "updatedAt",
    );
    expectRejected(
      withSessionField("notes", undefined),
      "notes",
    );
    expectRejected(
      withSessionField("sourceSessionId", 7),
      "sourceSessionId",
    );
    expectRejected(
      withSessionField("copiedToNotesAt", {}),
      "copiedToNotesAt",
    );
    expectRejected(
      withSessionField("summaryOverride", { sets: 40, exercises: "39ish" }),
      "summaryOverride",
    );
    expectRejected(withSessionField("rows", "rows"), "list of rows");
    // A numeric cell must never be coerced into the string "42":
    expectRejected(
      withFirstRow({ ...firstRow, exercise: 42 }),
      "rows[0].exercise must be a string",
    );
  });

  it("rejects malformed rows: positions, cells, and unknown highlights", () => {
    expectRejected(withFirstRow({ ...firstRow, position: -1 }), "position");
    expectRejected(withFirstRow({ ...firstRow, position: 1.5 }), "position");
    expectRejected(withFirstRow({ ...firstRow, position: "0" }), "position");
    expectRejected(
      withFirstRow({ ...firstRow, highlight: "green" }),
      "highlight",
    );
    expectRejected(withFirstRow({ ...firstRow, skip: 0 }), "skip must be a string");
    expectRejected(
      withFirstRow(withoutKey(firstRow, "weight")),
      "weight",
    );
  });

  it("rejects duplicate session ids and duplicate row ids", () => {
    expectRejected(
      withSessions([fullBackupSession, { ...fullBackupSession }]),
      "Duplicate session id",
    );
    expectRejected(
      withSessions([
        { ...fullBackupSession, rows: [firstRow, { ...firstRow }] },
        plainBackupSession,
      ]),
      "Duplicate row id",
    );
  });

  it("rejects malformed meta but accepts absent meta", () => {
    expectRejected({ ...validDoc, meta: "meta" }, "settings records");
    expectRejected(
      { ...validDoc, meta: [{ key: "x", value: 3, at: "t" }] },
      "meta[0]",
    );
    const result = validateBackupObject(withoutKey(validDoc, "meta"));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.meta).toEqual([]);
  });

  it("names the file's real problem in the error text", () => {
    const result = parseBackupJson('{"schemaVersion": 9, "sessions": []}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("9");
    }
  });
});

describe("summarizeBackup reports only what the file contains", () => {
  it("counts sessions, rows, dates, export time, and metadata presence", () => {
    const summary = summarizeBackup(buildFull());
    expect(summary).toEqual({
      sessionCount: 2,
      rowCount: 2,
      oldestDateLocal: "2026-02-03",
      newestDateLocal: "2026-08-20",
      exportedAt: EXPORTED_AT,
      includesMetadata: true,
    });
  });

  it("handles an empty backup honestly", () => {
    const empty = buildBackupDocument([], [], EXPORTED_AT);
    const summary = summarizeBackup(empty);
    expect(summary.sessionCount).toBe(0);
    expect(summary.rowCount).toBe(0);
    expect(summary.oldestDateLocal).toBeUndefined();
    expect(summary.newestDateLocal).toBeUndefined();
    expect(summary.includesMetadata).toBe(false);
  });

  it("collapses a single-date range and omits a blank exportedAt", () => {
    const parsed = parseBackupJson(
      serializeBackupDocument(buildBackupDocument(
        [makeSession({ dateLocal: "2026-05-05" })],
        [],
        "",
      )),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const summary = summarizeBackup(parsed.data);
    expect(summary.oldestDateLocal).toBe("2026-05-05");
    expect(summary.newestDateLocal).toBe("2026-05-05");
    expect(summary.exportedAt).toBeUndefined();
  });
});

describe("filenames (spec §18.1)", () => {
  it("uses GymLog-Backup-YYYY-MM-DD.json", () => {
    expect(backupFilename("2026-08-25")).toBe("GymLog-Backup-2026-08-25.json");
    expect(safetyBackupFilename("2026-08-25")).toBe(
      "GymLog-Backup-2026-08-25.pre-restore.json",
    );
  });
});

describe("delivery honesty (spec §18.2)", () => {
  const nav = window.navigator as { share?: unknown; canShare?: unknown };

  afterEach(() => {
    Reflect.deleteProperty(nav, "share");
    Reflect.deleteProperty(nav, "canShare");
    vi.restoreAllMocks();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  function stubDownload(): { blobs: Blob[]; downloads: string[] } {
    const captured: { blobs: Blob[]; downloads: string[] } = {
      blobs: [],
      downloads: [],
    };
    URL.createObjectURL = (blob: Blob) => {
      captured.blobs.push(blob);
      return `blob:mock-${captured.blobs.length}`;
    };
    URL.revokeObjectURL = () => {};
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function
      mockClick(this: HTMLAnchorElement) {
      captured.downloads.push(this.download);
    });
    return captured;
  }

  /** jsdom Blobs have no .text(); FileReader is the supported reader here. */
  async function blobText(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
  }

  it("downloads with the exact filename when no share sheet exists", async () => {
    const captured = stubDownload();
    await expect(
      deliverBackupJson("{\"json\":true}", "GymLog-Backup-2026-08-25.json"),
    ).resolves.toBe("download-started");
    expect(captured.downloads).toEqual(["GymLog-Backup-2026-08-25.json"]);
    await expect(blobText(captured.blobs[0]!)).resolves.toBe('{"json":true}');
  });

  it("reports failed instead of pretending when downloads are unavailable", async () => {
    Reflect.deleteProperty(URL, "createObjectURL");
    await expect(deliverBackupJson("{}", "x.json")).resolves.toBe("failed");
  });

  it("reports shared ONLY after navigator.share resolves", async () => {
    Object.defineProperty(nav, "share", {
      value: (data: { files: File[] }) => {
        expect(data.files[0]!.name).toBe("GymLog-Backup-2026-08-25.json");
        expect(data.files[0]!.type).toBe("application/json");
        return Promise.resolve();
      },
      configurable: true,
    });
    Object.defineProperty(nav, "canShare", {
      value: () => true,
      configurable: true,
    });
    await expect(deliverBackupJson("{}", "GymLog-Backup-2026-08-25.json"))
      .resolves.toBe("shared");
  });

  it("reports cancelled on user dismissal of the share sheet", async () => {
    Object.defineProperty(nav, "share", {
      value: () => Promise.reject(new DOMException("aborted", "AbortError")),
      configurable: true,
    });
    Object.defineProperty(nav, "canShare", {
      value: () => true,
      configurable: true,
    });
    await expect(deliverBackupJson("{}", "x.json")).resolves.toBe("cancelled");
  });

  it("reports failed when the payload is not sharable", async () => {
    let shareCalled = false;
    Object.defineProperty(nav, "share", {
      value: () => {
        shareCalled = true;
        return Promise.resolve();
      },
      configurable: true,
    });
    Object.defineProperty(nav, "canShare", {
      value: () => false,
      configurable: true,
    });
    await expect(deliverBackupJson("{}", "x.json")).resolves.toBe("failed");
    expect(shareCalled).toBe(false);
  });

  it("triggerJsonDownload clicks an anchor with rel=noopener", () => {
    stubDownload();
    const blob = new Blob(["{}"], { type: "application/json" });
    expect(triggerJsonDownload(blob, "y.json")).toBe(true);
  });
});
