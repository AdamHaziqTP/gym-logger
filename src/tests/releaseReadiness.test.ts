import { describe, expect, it } from "vitest";
import { seedSessionFromFixture } from "../data/fixture";
import { buildNotesPayload } from "../domain/notesExport";
import { buildImageLayout, buildSessionSvg } from "../domain/imageExport";
import { moveRow, normalizePositions } from "../domain/rows";
import type { WorkoutRow, WorkoutSession } from "../domain/types";

function makeSyntheticSession(rowCount: number): WorkoutSession {
  const rows: WorkoutRow[] = Array.from({ length: rowCount }, (_, index) => ({
    id: `synthetic-${index}`,
    position: index,
    exercise: `Exercise ${index} with a deliberately long free-form value`,
    sets: String((index % 5) + 1),
    reps: index % 3 === 0 ? "8,6" : String((index % 12) + 1),
    weight: index % 4 === 0 ? "body weight / bands" : `${index}.5 kg`,
    skip: index % 11 === 0 ? "skip for now" : "",
    highlight: (["none", "orange", "purple", "mint", "blue", "pink"] as const)[
      index % 6
    ],
  }));

  return {
    id: `synthetic-session-${rowCount}`,
    dateLocal: "2026-08-25",
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
    rows,
    notes: "Release readiness notes\nsecond line",
  };
}

describe("release-readiness regression coverage", () => {
  it("keeps the approved 40-row fixture lossless through both export representations", () => {
    const session = seedSessionFromFixture("2026-08-25T00:00:00.000Z");
    const payload = buildNotesPayload(session);

    expect(session.rows).toHaveLength(40);
    expect(payload.text).toContain(session.rows[0]!.exercise);
    expect(payload.html).toContain("<table");
    expect(payload.html).toContain("</table>");
    expect(payload.html).toContain(session.rows[39]!.exercise);
    expect(payload.text).toContain(session.notes);
  });

  it("renders and exports a synthetic 100-row session without losing order or values", () => {
    const session = makeSyntheticSession(100);

    for (const style of ["faithful", "compact"] as const) {
      const layout = buildImageLayout(session, style);
      const svg = buildSessionSvg(session, style);

      expect(layout.bodyRows).toHaveLength(100);
      expect(layout.bodyRows.every((row) => row.height > 0)).toBe(true);
      expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
      expect(svg.endsWith("</svg>")).toBe(true);
      expect(svg).toContain("Exercise 0");
      expect(svg).toContain("Exercise 99");
      expect(svg.indexOf("Exercise 0")).toBeLessThan(svg.indexOf("Exercise 99"));
      expect(svg).toContain("Release readiness notes");
    }

    const moved = moveRow(session.rows, "synthetic-0", 99);
    expect(moved.map((row) => row.id)).toEqual([
      ...Array.from({ length: 99 }, (_, index) => `synthetic-${index + 1}`),
      "synthetic-0",
    ]);
    expect(moved.every((row, index) => row.position === index)).toBe(true);
    expect(moved[98]!.exercise).toContain("Exercise 99");
    expect(moved[99]!.exercise).toContain("Exercise 0");

    const normalized = normalizePositions(moved);
    expect(normalized.map((row) => row.id)).toEqual(moved.map((row) => row.id));
  });
});
