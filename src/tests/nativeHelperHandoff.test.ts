import { describe, expect, it } from "vitest";
import {
  buildNativeHelperHandoff,
  NATIVE_HELPER_SCHEMA_VERSION,
  NATIVE_HELPER_SOURCE,
  NATIVE_HELPER_URL,
  serializeNativeHelperHandoff,
} from "../domain/nativeHelperHandoff";
import type { WorkoutSession } from "../domain/types";

function makeSession(): WorkoutSession {
  return {
    id: "actual-2026-08-25",
    dateLocal: "2026-08-25",
    createdAt: "2026-08-25T08:00:00.000Z",
    updatedAt: "2026-08-25T09:00:00.000Z",
    rows: [
      {
        id: "row-1",
        position: 0,
        exercise: "Recline curl bench 30° IR uni",
        sets: "1",
        reps: "8,6",
        weight: "body weight",
        skip: "",
        highlight: "orange",
      },
      {
        id: "row-2",
        position: 1,
        exercise: "Chest Press — neutral",
        sets: "1",
        reps: "7",
        weight: "55kg",
        skip: "later",
        highlight: "mint",
      },
    ],
    notes: "right shoulder felt good — next: add 1kg\nUnicode stays intact: ° · —",
    summaryOverride: { sets: "40", exercises: "39" },
  };
}

describe("native Gym Logger helper handoff", () => {
  it("serializes the selected production session without changing values or order", () => {
    const session = makeSession();
    const handoff = buildNativeHelperHandoff(session);

    expect(handoff).toEqual({
      schemaVersion: NATIVE_HELPER_SCHEMA_VERSION,
      source: NATIVE_HELPER_SOURCE,
      displayDate: "Tuesday 25 Aug",
      session,
    });

    const parsed = JSON.parse(serializeNativeHelperHandoff(session)) as typeof handoff;
    expect(parsed).toEqual(handoff);
    expect(parsed.session.id).toBe("actual-2026-08-25");
    expect(parsed.session.rows.map((row) => row.id)).toEqual(["row-1", "row-2"]);
    expect(parsed.session.rows.map((row) => row.highlight)).toEqual([
      "orange",
      "mint",
    ]);
    expect(parsed.session.summaryOverride).toEqual({ sets: "40", exercises: "39" });
    expect(parsed.session.notes).toContain("° · —");
  });

  it("uses a registered helper URL and contains no fixture dependency", () => {
    expect(NATIVE_HELPER_URL).toBe("gymloggerpasteboardproof://handoff");
    expect(serializeNativeHelperHandoff(makeSession())).not.toContain(
      "latest-session.example.json",
    );
  });
});
