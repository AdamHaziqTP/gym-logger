import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import Dexie from "dexie";
import { App } from "../App";
import { createDb, type GymLogDB } from "../data/db";
import {
  parseBackupJson,
  validateBackupObject,
} from "../domain/backup";
import { readAppSettings } from "../data/settings";
import type { WorkoutSession } from "../domain/types";

/* ---------------------------------------------------------------------- */
/* Backup/restore component flows (spec §18; task M05-T01-               */
/* BACKUP-RESTORE-01) through the real App/Home with fake-indexeddb.      */
/* Covers J1–J5 plus the task's five required proofs. Physical iPhone     */
/* Files/share/restore behavior is NOT claimed anywhere here — delivery   */
/* outcomes are pinned only at their honest desktop/jsdom level.          */
/* ---------------------------------------------------------------------- */

const DB_NAME = "gym-logger";
/** Fixed local date with NO session, so seeded history never auto-resumes. */
const TODAY = "2026-08-24";
const SEED_ID = "fixture-sunday-23-aug";

let db: GymLogDB;

beforeEach(async () => {
  await Dexie.delete(DB_NAME);
  db = createDb();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, "createObjectURL");
  Reflect.deleteProperty(URL, "revokeObjectURL");
  db.close();
});

async function openHome() {
  render(<App db={db} todayLocal={TODAY} />);
  expect(await screen.findByText(/40 sets · 39 exercises/)).toBeTruthy();
}

/**
 * jsdom Blobs have no .text(); FileReader is the supported reader here.
 * Used to inspect exactly what a download/share would have delivered.
 */
function blobText(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

interface DownloadCapture {
  blobs: Blob[];
  downloads: string[];
  /** db.sessions.count() captured synchronously at each anchor click. */
  countsAtClick: Promise<number>[];
}

/** Stubs object URLs + anchor clicks so downloads are observable, not real. */
function stubDownloads(): DownloadCapture {
  const capture: DownloadCapture = { blobs: [], downloads: [], countsAtClick: [] };
  URL.createObjectURL = (blob: Blob) => {
    capture.blobs.push(blob);
    return `blob:mock-${capture.blobs.length}`;
  };
  URL.revokeObjectURL = () => {};
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function
    mockClick(this: HTMLAnchorElement) {
    capture.downloads.push(this.download);
    // Synchronously sampled: proves what existed in the DB at click time.
    capture.countsAtClick.push(db.sessions.count());
  });
  return capture;
}

function pickFile(name: string, json: string): void {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  const file = new File([json], name, { type: "application/json" });
  fireEvent.change(input!, { target: { files: [file] } });
}

/** Full sessions-table snapshot for byte-for-byte preservation checks. */
async function snapshot(): Promise<WorkoutSession[]> {
  return db.sessions.toArray();
}

/** A valid two-session backup whose rows are stored OUT of positional order. */
function validImportJson(): string {
  return JSON.stringify(
    {
      schemaVersion: 1,
      kind: "gym-log-backup",
      exportedAt: "2026-08-25T00:00:00.000Z",
      sessions: [
        {
          id: "import-a",
          dateLocal: "2026-07-04",
          createdAt: "2026-07-04T08:00:00.000Z",
          updatedAt: "2026-07-04T09:30:00.000Z",
          sourceSessionId: "session-original-x",
          rows: [
            {
              id: "ir-b",
              position: 1,
              exercise: "Lat Pulldown Wide",
              sets: "4",
              reps: "10",
              weight: "50kg",
              skip: "",
              highlight: "none",
            },
            {
              id: "ir-a",
              position: 0,
              exercise: "SLDL {brace} \\ 30° IR",
              sets: "8,6",
              reps: '"10"',
              weight: "<b>70</b>kg",
              skip: "knee 🦵\nline2",
              highlight: "mint",
            },
          ],
          notes: 'multi\nline "notes" \\ done',
          summaryOverride: { sets: "~12", exercises: "2ish" },
          copiedToNotesAt: "2026-07-05T10:00:00.000Z",
        },
        {
          id: "import-b",
          dateLocal: "2026-08-20",
          createdAt: "2026-08-20T18:00:00.000Z",
          updatedAt: "2026-08-20T19:00:00.000Z",
          rows: [
            {
              id: "ir-c",
              position: 0,
              exercise: "Bench Press",
              sets: "5",
              reps: "5",
              weight: "100kg",
              skip: "",
              highlight: "blue",
            },
          ],
          notes: "",
        },
      ],
      meta: [],
    },
    null,
    2,
  );
}

function validImportWithSettingsJson(): string {
  const parsed = JSON.parse(validImportJson()) as Record<string, unknown>;
  parsed.meta = [
    {
      key: "settings.theme",
      value: "light",
      at: "2026-08-25T00:00:00.000Z",
    },
    {
      key: "settings.defaultImageStyle",
      value: "faithful",
      at: "2026-08-25T00:00:01.000Z",
    },
  ];
  return JSON.stringify(parsed);
}

describe("Home backup entry points (requirement 5)", () => {
  it("exposes Export Backup and Import Backup in their own labeled section", async () => {
    await openHome();
    expect(
      screen.getByRole("button", { name: "Export Backup" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Import Backup" }),
    ).toBeTruthy();
    const section = document.querySelector(".backup-section");
    expect(section?.querySelector("#backup-label")?.textContent).toBe("Backup");
    // A hidden real picker backs Import.
    expect(document.querySelector('input[type="file"]')).not.toBeNull();
  });

  it("keeps Today / Last Workout / Copy Another Session / History navigation untouched", async () => {
    await openHome();

    fireEvent.click(
      screen.getByRole("button", { name: "Copy Another Session" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Copy Another Session" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "‹ Gym Log" }));
    expect(
      await screen.findByRole("button", { name: "Export Backup" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "History" }));
    expect(
      await screen.findByRole("heading", { name: "History" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "‹ Gym Log" }));
    expect(
      await screen.findByRole("button", { name: "History" }),
    ).toBeTruthy();
  });

  it("exporting never navigates away from Home", async () => {
    stubDownloads();
    await openHome();
    fireEvent.click(screen.getByRole("button", { name: "Export Backup" }));
    await screen.findByText(/Download started — look for GymLog-Backup-/);
    expect(
      screen.getByRole("button", { name: "History" }),
    ).toBeTruthy();
  });
});

describe("Export Backup (J1, requirement 1)", () => {
  it("downloads valid deterministic JSON containing everything in the database", async () => {
    const capture = stubDownloads();
    await openHome();
    fireEvent.click(screen.getByRole("button", { name: "Export Backup" }));

    await screen.findByText(
      "Download started — look for GymLog-Backup-2026-08-24.json in your downloads.",
    );
    expect(capture.downloads).toEqual(["GymLog-Backup-2026-08-24.json"]);

    const first = await blobText(capture.blobs[0]!);
    const result = validateBackupObject(JSON.parse(first));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const doc = result.data;
    expect(doc.schemaVersion).toBe(1);
    expect(doc.kind).toBe("gym-log-backup");
    // The seeded fixture session with its override, rows, and metadata.
    const seeded = doc.sessions.find((session) => session.id === SEED_ID);
    expect(seeded?.rows).toHaveLength(40);
    expect(seeded?.summaryOverride).toEqual({ sets: "40", exercises: "39" });
    expect(doc.meta.map((record) => record.key)).toContain("seededFrom");

    // Second export differs ONLY by its export timestamp.
    fireEvent.click(screen.getByRole("button", { name: "Export Backup" }));
    await waitFor(() => {
      expect(capture.blobs.length).toBe(2);
    });
    const second = await blobText(capture.blobs[1]!);
    const secondDoc = JSON.parse(second) as { exportedAt?: string };
    delete secondDoc.exportedAt;
    const firstDoc = JSON.parse(first) as { exportedAt?: string };
    delete firstDoc.exportedAt;
    expect(secondDoc).toEqual(firstDoc);
  });

  it("reports failure truthfully when this browser cannot deliver files", async () => {
    // jsdom has no URL.createObjectURL by default and no share sheet.
    await openHome();
    fireEvent.click(screen.getByRole("button", { name: "Export Backup" }));
    await screen.findByText(
      "Backup could not be delivered in this browser.",
    );
    expect(await db.sessions.count()).toBe(1);
  });
});

describe("Import validation leaves data untouched (requirement 2)", () => {
  const CASES: Array<[string, string, string]> = [
    ["broken.json", "{not json at all", "not valid JSON"],
    [
      "future.json",
      JSON.stringify({ schemaVersion: 9, kind: "gym-log-backup", sessions: [] }),
      "newer format",
    ],
    [
      "foreign.json",
      JSON.stringify({ schemaVersion: 1, kind: "other-app", sessions: [] }),
      "not a Gym Log backup",
    ],
    [
      "bad-highlight.json",
      JSON.stringify({
        schemaVersion: 1,
        sessions: [
          {
            id: "x",
            dateLocal: "2026-01-01",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            rows: [
              {
                id: "r1",
                position: 0,
                exercise: "X",
                sets: "",
                reps: "",
                weight: "",
                skip: "",
                highlight: "green",
              },
            ],
            notes: "",
          },
        ],
      }),
      "highlight",
    ],
    [
      "coerced-cell.json",
      JSON.stringify({
        schemaVersion: 1,
        sessions: [
          {
            id: "x",
            dateLocal: "2026-01-01",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            rows: [
              {
                id: "r1",
                position: 0,
                exercise: 42,
                sets: "",
                reps: "",
                weight: "",
                skip: "",
                highlight: "none",
              },
            ],
            notes: "",
          },
        ],
      }),
      "exercise must be a string",
    ],
  ];

  for (const [filename, json, expectedFragment] of CASES) {
    it(`rejects ${filename} with a visible reason and zero database writes`, async () => {
      await openHome();
      const before = await snapshot();

      pickFile(filename, json);

      const alert = await screen.findByRole("alert");
      expect(alert.textContent).toContain(`Import failed:`);
      expect(alert.textContent).toContain(expectedFragment);

      // No confirmation dialog appeared and every record is unchanged.
      expect(screen.queryByRole("alertdialog")).toBeNull();
      expect(await snapshot()).toEqual(before);
      expect(await db.sessions.count()).toBe(1);
    });
  }

  it("Cancel on the summary dialog keeps the current database byte-for-byte", async () => {
    await openHome();
    const before = await snapshot();

    pickFile("GymLog-Backup-2026-08-25.json", validImportJson());
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Sessions: 2")).toBeTruthy();
    expect(within(dialog).getByText("Rows: 3")).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).toBeNull();
    });
    expect(await snapshot()).toEqual(before);
    expect(await db.sessions.count()).toBe(1);
  });

  it("backdrop dismissal cancels too", async () => {
    await openHome();
    pickFile("backup.json", validImportJson());
    await screen.findByRole("alertdialog");
    fireEvent.click(document.querySelector(".confirm-backdrop")!);
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).toBeNull();
    });
    expect(await db.sessions.count()).toBe(1);
  });
});

describe("Restore replaces settings metadata atomically", () => {
  it("restores theme/style metadata and refreshes the running App settings", async () => {
    await openHome();
    pickFile("settings-backup.json", validImportWithSettingsJson());
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Replace All Data" }));

    await screen.findByText(/Restored 2 sessions/);
    await waitFor(async () => {
      await expect(readAppSettings(db)).resolves.toMatchObject({
        theme: "light",
        defaultImageStyle: "faithful",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(
      (await screen.findByRole("button", { name: "Light" })).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    // The legacy image-style metadata remains restorable for backup
    // compatibility, but the retired Faithful selector is no longer exposed.
    expect(screen.queryByRole("button", { name: "Faithful" })).toBeNull();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});

describe("Pre-replacement summary and explicit confirm (requirement 4)", () => {
  it("shows the file's facts and replaces nothing before the explicit confirm", async () => {
    await openHome();
    const before = await snapshot();

    pickFile("imported.json", validImportJson());
    const dialog = await screen.findByRole("alertdialog");

    // The destructive button is present but nothing has happened yet.
    expect(
      within(dialog).getByRole("button", { name: "Replace All Data" }),
    ).toBeTruthy();
    expect(await db.sessions.count()).toBe(1);
    expect(await snapshot()).toEqual(before);
  });

  it("summarizes an empty backup honestly", async () => {
    await openHome();
    pickFile(
      "empty.json",
      JSON.stringify({ schemaVersion: 1, sessions: [], meta: [] }),
    );
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Sessions: 0")).toBeTruthy();
    expect(within(dialog).getByText("Rows: 0")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  });
});

describe("Confirmed replacement restores exactly (J2–J5, requirement 3)", () => {
  /** The exact records the import file promised, as plain objects. */
  function importedRecords(): WorkoutSession[] {
    const parsed = parseBackupJson(validImportJson());
    if (!parsed.ok) throw new Error("test fixture must be valid");
    return parsed.data.sessions as unknown as WorkoutSession[];
  }

  it("replaces all data transactionally and preserves ids, order, strings, highlights, notes, overrides, and timestamps verbatim", async () => {
    const capture = stubDownloads();
    await openHome();

    pickFile("GymLog-Backup-2026-08-25.json", validImportJson());
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Replace All Data" }),
    );

    await screen.findByText(/Restored 2 sessions from GymLog-Backup-/);

    // The seeded fixture is gone; exactly the imported set remains.
    expect(await db.sessions.count()).toBe(2);
    expect(await db.sessions.get(SEED_ID)).toBeUndefined();

    const expected = importedRecords();
    const restoredA = await db.sessions.get("import-a");
    // Deep equality covers ids, dateLocal, row array ORDER AND positions,
    // every free-form string, highlight values, notes, override, and the
    // original createdAt/updatedAt — restore regenerates nothing.
    expect(restoredA).toEqual(expected[0]);
    expect(restoredA!.rows.map((row) => row.id)).toEqual(["ir-b", "ir-a"]);
    expect(restoredA!.updatedAt).toBe("2026-07-04T09:30:00.000Z");
    expect(await db.sessions.get("import-b")).toEqual(expected[1]);

    // The imported metadata is authoritative: this valid fixture has no
    // metadata, so the previous seed marker is removed by exact restore.
    const seededFrom = await db.meta.get("seededFrom");
    expect(seededFrom).toBeUndefined();

    // The safety export of the PREVIOUS data ran BEFORE replacement: the
    // anchor click observed the old session still in place and its bytes
    // parse back to exactly that pre-state.
    expect(capture.downloads).toEqual([
      "GymLog-Backup-2026-08-24.pre-restore.json",
    ]);
    expect(await capture.countsAtClick[0]).toBe(1);
    const safetyResult = validateBackupObject(
      JSON.parse(await blobText(capture.blobs[0]!)),
    );
    expect(safetyResult.ok).toBe(true);
    if (safetyResult.ok) {
      expect(safetyResult.data.sessions.map((session) => session.id)).toEqual([
        SEED_ID,
      ]);
    }
  });

  it("restores honestly even when no safety download is possible", async () => {
    await openHome();
    pickFile("backup.json", validImportJson());
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Replace All Data" }),
    );

    await screen.findByText(
      /Restored 2 sessions from backup\.json\. A safety backup could not be delivered/,
    );
    expect(await db.sessions.count()).toBe(2);
    expect((await db.sessions.get("import-a"))!.rows).toHaveLength(2);
  });

  it("the restored sessions appear in History, newest first", async () => {
    await openHome();
    pickFile("backup.json", validImportJson());
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Replace All Data" }),
    );
    await screen.findByText(/Restored 2 sessions/);

    fireEvent.click(screen.getByRole("button", { name: "History" }));
    const list = await screen.findByRole("list", { name: "Session history" });
    const items = Array.from(
      list.querySelectorAll<HTMLButtonElement>("button.history-item"),
    );
    expect(items).toHaveLength(2);
    // Newest local date first: 2026-08-20 before 2026-07-04.
    expect(items[0]!.textContent).toMatch(/Aug/);
    expect(items[0]!.textContent).toMatch(/1 exercise|Bench/);
    expect(items[1]!.textContent).toMatch(/Jul/);
    expect(items[1]!.textContent).toMatch(/~12 sets · 2ish exercises/);
  });
});
