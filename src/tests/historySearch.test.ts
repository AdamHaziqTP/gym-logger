import { describe, expect, it } from "vitest";
import {
  filterSessionsBySearch,
  sessionMatchesQuery,
  sessionSearchSurfaces,
} from "../domain/historySearch";
import type { WorkoutRow, WorkoutSession } from "../domain/types";

/** Minimal deterministic session factory for pure search tests. */
function makeSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: overrides.id ?? "session-under-test",
    dateLocal: "2026-08-23",
    createdAt: "2026-08-23T18:00:00.000Z",
    updatedAt: "2026-08-23T19:00:00.000Z",
    rows: [],
    notes: "",
    ...overrides,
  };
}

function makeRow(overrides: Partial<WorkoutRow> = {}): WorkoutRow {
  return {
    id: overrides.id ?? `row-${Math.random().toString(36).slice(2)}`,
    position: overrides.position ?? 0,
    exercise: "",
    sets: "",
    reps: "",
    weight: "",
    skip: "",
    highlight: "none",
    ...overrides,
  };
}

describe("sessionSearchSurfaces", () => {
  it("exposes the stored local date and its display form", () => {
    const surfaces = sessionSearchSurfaces(
      makeSession({ dateLocal: "2026-08-23" }),
    );
    expect(surfaces).toContain("2026-08-23");
    expect(surfaces).toContain("Sunday 23 Aug");
  });

  it("exposes every row's five cell columns", () => {
    const surfaces = sessionSearchSurfaces(
      makeSession({
        rows: [
          makeRow({
            position: 0,
            exercise: "Chest Press Neutral 5",
            sets: "1",
            reps: "8,6",
            weight: "82.5kg",
            skip: "skip",
          }),
        ],
      }),
    );
    expect(surfaces).toContain("Chest Press Neutral 5");
    expect(surfaces).toContain("1");
    expect(surfaces).toContain("8,6");
    expect(surfaces).toContain("82.5kg");
    expect(surfaces).toContain("skip");
  });

  it("includes the free-form bottom notes", () => {
    const surfaces = sessionSearchSurfaces(
      makeSession({ notes: "Cardio:\n- 15 min bike\nStarted using straps" }),
    );
    expect(surfaces.some((surface) => surface.includes("straps"))).toBe(true);
  });
});

describe("sessionMatchesQuery — one surface per required search field", () => {
  const base = { createdAt: "", updatedAt: "" };

  it("matches the display/local date", () => {
    const session = makeSession({ ...base, dateLocal: "2026-08-21" });
    expect(sessionMatchesQuery(session, "friday")).toBe(true);
    expect(sessionMatchesQuery(session, "21 aug")).toBe(true);
    expect(sessionMatchesQuery(session, "2026-08-21")).toBe(true);
  });

  it("matches exercise text", () => {
    const session = makeSession({
      ...base,
      rows: [makeRow({ exercise: "Chest Press Neutral 5" })],
    });
    expect(sessionMatchesQuery(session, "chest press")).toBe(true);
  });

  it("matches Sets text", () => {
    const session = makeSession({
      ...base,
      rows: [makeRow({ sets: "8,6" })],
    });
    expect(sessionMatchesQuery(session, "8,6")).toBe(true);
  });

  it("matches Reps text", () => {
    const session = makeSession({
      ...base,
      rows: [makeRow({ reps: "10-12" })],
    });
    expect(sessionMatchesQuery(session, "10-12")).toBe(true);
  });

  it("matches Weight text", () => {
    const session = makeSession({
      ...base,
      rows: [makeRow({ weight: "35?kg added weight thing" })],
    });
    expect(sessionMatchesQuery(session, "35?kg added weight thing")).toBe(
      true,
    );
  });

  it("matches Skip text", () => {
    const session = makeSession({
      ...base,
      rows: [makeRow({ skip: "skip" })],
    });
    expect(sessionMatchesQuery(session, "skip")).toBe(true);
  });

  it("matches bottom notes", () => {
    const session = makeSession({
      ...base,
      notes: "Cardio first today:\n- 15 min bike",
    });
    expect(sessionMatchesQuery(session, "15 min bike")).toBe(true);
  });

  it("is case-insensitive in both directions", () => {
    const session = makeSession({
      ...base,
      dateLocal: "2026-08-21",
      rows: [makeRow({ exercise: "Recline curl bench 30° IR uni" })],
      notes: "Started Using Straps",
    });
    expect(sessionMatchesQuery(session, "RECLINE CURL")).toBe(true);
    expect(sessionMatchesQuery(session, "started using STRAPS")).toBe(true);
    expect(sessionMatchesQuery(session, "Friday 21 Aug".toLowerCase())).toBe(
      true,
    );
  });

  it("does not match when the query appears nowhere", () => {
    const session = makeSession({
      ...base,
      rows: [makeRow({ exercise: "Chest Press Neutral 5" })],
    });
    expect(sessionMatchesQuery(session, "lat pulldown")).toBe(false);
  });
});

describe("filterSessionsBySearch", () => {
  const chestDay = makeSession({
    id: "chest-day",
    dateLocal: "2026-08-23",
    rows: [makeRow({ position: 0, exercise: "Chest Press Neutral 5" })],
  });
  const legDay = makeSession({
    id: "leg-day",
    dateLocal: "2026-08-21",
    notes: "Leg press felt heavy",
  });
  const all = [chestDay, legDay];

  it("returns every session for an empty query", () => {
    expect(filterSessionsBySearch(all, "")).toEqual(all);
  });

  it("returns every session for a whitespace-only query", () => {
    expect(filterSessionsBySearch(all, "   ")).toEqual(all);
  });

  it("keeps only matching sessions for a text query", () => {
    // No session contains "CHESS PRESS".
    expect(filterSessionsBySearch(all, "CHESS PRESS")).toEqual([]);

    expect(filterSessionsBySearch(all, "chest press").map((s) => s.id)).toEqual([
      "chest-day",
    ]);
    expect(filterSessionsBySearch(all, "leg press").map((s) => s.id)).toEqual([
      "leg-day",
    ]);
  });

  it("preserves the caller's ordering (newest-first stays newest-first)", () => {
    // Both stored local dates contain "2026"; the filter must not reorder.
    const bothMatch = filterSessionsBySearch(all, "2026");
    expect(bothMatch.map((s) => s.id)).toEqual(["chest-day", "leg-day"]);
  });
});
