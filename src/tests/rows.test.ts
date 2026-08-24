import { beforeEach, describe, expect, it } from "vitest";
import {
  createBlankRow,
  deleteRow,
  duplicateRow,
  insertBlankRowAt,
  insertRowAt,
  moveRow,
  normalizePositions,
  orderedRows,
} from "../domain/rows";
import {
  clearRowClipboard,
  copyRowToClipboard,
  hasCopiedRow,
  peekRowClipboard,
} from "../domain/rowClipboard";
import type { WorkoutRow } from "../domain/types";

function row(partial: Partial<WorkoutRow> & { id: string }): WorkoutRow {
  return {
    position: 0,
    exercise: "",
    sets: "",
    reps: "",
    weight: "",
    skip: "",
    highlight: "none",
    ...partial,
  };
}

const sampleRows = (): WorkoutRow[] =>
  normalizePositions([
    row({ id: "a", exercise: "Row A", sets: "3", highlight: "orange" }),
    row({
      id: "b",
      exercise: "Row B",
      reps: "8,6",
      weight: "body weight",
      skip: "skip",
      highlight: "purple",
    }),
    row({ id: "c", exercise: "Row C", weight: "8.75 + 1 weight kg", highlight: "pink" }),
    row({ id: "d", exercise: "Row D" }),
  ]);

describe("row normalization", () => {
  it("normalizes positions to 0..n-1 regardless of stored positions", () => {
    const messy = [
      row({ id: "x", position: 7, exercise: "X" }),
      row({ id: "y", position: -2, exercise: "Y" }),
      row({ id: "z", position: 100, exercise: "Z" }),
    ];
    const normalized = normalizePositions(messy);
    expect(normalized.map((r) => r.position)).toEqual([0, 1, 2]);
    // Input is never mutated.
    expect(messy.map((r) => r.position)).toEqual([7, -2, 100]);
  });

  it("orderedRows sorts by position without mutating", () => {
    const shuffled = [
      row({ id: "b", position: 1 }),
      row({ id: "a", position: 0 }),
      row({ id: "c", position: 2 }),
    ];
    expect(orderedRows(shuffled).map((r) => r.id)).toEqual(["a", "b", "c"]);
  });
});

describe("insert operations", () => {
  it("inserts a blank row at the requested index and shifts the rest", () => {
    let nextId = 0;
    const rows = insertBlankRowAt(sampleRows(), 1, () => `new-${nextId++}`);

    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.exercise)).toEqual([
      "Row A",
      "",
      "Row B",
      "Row C",
      "Row D",
    ]);
    expect(rows[1]).toMatchObject({ id: "new-0", highlight: "none" });
    expect(rows.map((r) => r.position)).toEqual([0, 1, 2, 3, 4]);
  });

  it("clamps insertion indices to the valid range", () => {
    let nextId = 0;
    const atEnd = insertBlankRowAt(sampleRows(), 99, () => `n-${nextId++}`);
    expect(atEnd).toHaveLength(5);
    expect(atEnd[4].exercise).toBe("");

    const atStart = insertBlankRowAt(sampleRows(), -5, () => `n-${nextId++}`);
    expect(atStart[0].exercise).toBe("");
    expect(atStart[1].exercise).toBe("Row A");
  });

  it("inserts a fully-formed row with its identity preserved (paste path)", () => {
    const pasted = row({
      id: "pasted-1",
      exercise: "Pasted",
      sets: "2",
      reps: "12",
      weight: "50kg",
      skip: "skip",
      highlight: "blue",
    });
    const rows = insertRowAt(sampleRows(), 2, pasted);
    expect(rows.map((r) => r.id)).toEqual(["a", "b", "pasted-1", "c", "d"]);
    expect(rows[2]).toMatchObject({
      exercise: "Pasted",
      highlight: "blue",
      skip: "skip",
    });
    expect(rows.map((r) => r.position)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("duplicateRow", () => {
  it("produces an exact copy below the source with a new identity", () => {
    const rows = duplicateRow(sampleRows(), "b", () => "copy-1");
    const copy = rows[2];

    expect(copy.id).toBe("copy-1");
    expect(copy).toMatchObject({
      exercise: "Row B",
      sets: "",
      reps: "8,6",
      weight: "body weight",
      skip: "skip",
      highlight: "purple",
    });
    // The source is untouched.
    expect(rows[1]).toMatchObject({ id: "b", exercise: "Row B" });
    expect(rows.map((r) => r.position)).toEqual([0, 1, 2, 3, 4]);
  });

  it("is a no-op for a missing row id", () => {
    const rows = sampleRows();
    expect(duplicateRow(rows, "missing", () => "x")).toHaveLength(4);
  });
});

describe("deleteRow", () => {
  it("removes the row and keeps positions contiguous", () => {
    const target = sampleRows()[1];
    const { removed, rows } = deleteRow(sampleRows(), "b");

    expect(removed).toMatchObject({ id: "b", exercise: "Row B" });
    expect(rows.map((r) => r.id)).toEqual(["a", "c", "d"]);
    expect(rows.map((r) => r.position)).toEqual([0, 1, 2]);
    expect(target.exercise).toBe("Row B"); // snapshot object intact
  });

  it("reports a null removal for a missing row id", () => {
    const { removed, rows } = deleteRow(sampleRows(), "missing");
    expect(removed).toBeNull();
    expect(rows).toHaveLength(4);
  });
});

describe("moveRow", () => {
  it("moves a row later and preserves all data and highlights", () => {
    const rows = moveRow(sampleRows(), "a", 2);
    expect(rows.map((r) => r.exercise)).toEqual(["Row B", "Row C", "Row A", "Row D"]);
    expect(rows.find((r) => r.id === "a")).toMatchObject({
      sets: "3",
      highlight: "orange",
    });
    expect(rows.map((r) => r.position)).toEqual([0, 1, 2, 3]);
  });

  it("moves a row earlier and preserves weird free-form values", () => {
    const rows = moveRow(sampleRows(), "d", 0);
    expect(rows.map((r) => r.exercise)).toEqual(["Row D", "Row A", "Row B", "Row C"]);
    expect(rows.find((r) => r.id === "b")!.weight).toBe("body weight");
    expect(rows.map((r) => r.position)).toEqual([0, 1, 2, 3]);
  });

  it("clamps out-of-range targets and no-ops on same index or missing id", () => {
    const rows = sampleRows();
    expect(moveRow(rows, "a", 999).map((r) => r.id)).toEqual(["b", "c", "d", "a"]);
    expect(moveRow(rows, "b", 1).map((r) => r.id)).toEqual(["a", "b", "c", "d"]);
    expect(moveRow(rows, "ghost", 0).map((r) => r.id)).toEqual(["a", "b", "c", "d"]);
  });
});

describe("app-owned row clipboard", () => {
  beforeEach(() => clearRowClipboard());

  it("stores and returns a defensive copy of the copied row", () => {
    expect(hasCopiedRow()).toBe(false);

    const source = row({ id: "src", exercise: "Cut me", highlight: "mint" });
    copyRowToClipboard(source);

    expect(hasCopiedRow()).toBe(true);
    const peeked = peekRowClipboard()!;
    expect(peeked.exercise).toBe("Cut me");

    // Mutating the returned copy must not corrupt the clipboard.
    peeked.exercise = "mutated";
    expect(peekRowClipboard()!.exercise).toBe("Cut me");

    // Mutating the original must not corrupt it either.
    source.exercise = "changed after copy";
    expect(peekRowClipboard()!.exercise).toBe("Cut me");
  });

  it("keeps data available for Cut even after the source row is deleted", () => {
    const source = row({ id: "src", exercise: "Will be removed" });
    copyRowToClipboard(source);

    // Simulate the cut: the source row disappears from the session…
    const { rows } = deleteRow([source, row({ id: "keep", exercise: "Keep" })], "src");
    expect(rows.map((r) => r.id)).toEqual(["keep"]);

    // …but the copied data survives in the app-owned clipboard.
    expect(hasCopiedRow()).toBe(true);
    expect(peekRowClipboard()!.exercise).toBe("Will be removed");

    clearRowClipboard();
    expect(hasCopiedRow()).toBe(false);
    expect(peekRowClipboard()).toBeNull();
  });

  it("createBlankRow produces an empty Other-highlighted row", () => {
    expect(createBlankRow("blank")).toEqual({
      id: "blank",
      position: 0,
      exercise: "",
      sets: "",
      reps: "",
      weight: "",
      skip: "",
      highlight: "none",
    });
  });
});
