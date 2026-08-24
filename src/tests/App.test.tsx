import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDefaultNormalizer } from "@testing-library/dom";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Dexie from "dexie";
import { App } from "../App";
import { createDb, type GymLogDB } from "../data/db";

const DB_NAME = "gym-logger";
/** Fixed local date for deterministic tests (device clock is never trusted). */
const TODAY = "2026-08-24";

let db: GymLogDB;

beforeEach(async () => {
  await Dexie.delete(DB_NAME);
  db = createDb();
});

afterEach(() => {
  cleanup();
  db.close();
});

describe("App — seed → start → edit → reload", () => {
  it("seeds on first launch and shows the fixture summary override", async () => {
    render(<App db={db} todayLocal={TODAY} />);

    expect(await screen.findByText("Gym Log")).toBeTruthy();
    // Last Workout card reflects the seeded fixture's manual 40/39 override.
    expect(await screen.findByText(/40 sets · 39 exercises/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Start Today's Session" }),
    ).toBeTruthy();
    // No Continue button before today's session exists.
    expect(
      screen.queryByRole("button", { name: /Continue Today/ }),
    ).toBeNull();
  });

  it("starts a session with all 40 cloned rows, accepts free-form edits, and resumes directly on remount", async () => {
    const first = render(<App db={db} todayLocal={TODAY} />);
    await screen.findByText(/40 sets · 39 exercises/);

    fireEvent.click(
      screen.getByRole("button", { name: "Start Today's Session" }),
    );

    // The clone opens immediately: header row plus 40 exercise rows.
    const firstExerciseInput = await screen.findByDisplayValue(
      "Recline curl bench 30° IR uni",
    );
    const bodyRows = document.querySelectorAll("table tbody tr");
    expect(bodyRows).toHaveLength(40);

    // Arbitrary text (not numeric-only) must be accepted in any cell.
    const weightInputs = screen.getAllByLabelText(/^Weight row /);
    fireEvent.change(weightInputs[37], {
      target: { value: "8.75 + 1 weight kg" },
    });
    fireEvent.blur(weightInputs[37]);

    fireEvent.change(firstExerciseInput, {
      target: { value: "Recline curl bench 30° IR uni edited" },
    });
    fireEvent.blur(firstExerciseInput);

    // Free-form notes area autosaves too.
    const notes = screen.getByLabelText("Session notes");
    fireEvent.change(notes, { target: { value: "Cardio:\n- 15 min bike" } });
    fireEvent.blur(notes);

    first.unmount();

    // "Reload": fresh mount against the same IndexedDB. A current session
    // must resume DIRECTLY instead of resetting the view to Home (M01
    // human-gate correction; spec §27.1).
    render(<App db={db} todayLocal={TODAY} />);
    expect(
      await screen.findByDisplayValue("Recline curl bench 30° IR uni edited"),
    ).toBeTruthy();
    expect(
      screen.getByDisplayValue("8.75 + 1 weight kg"),
    ).toBeTruthy();
    // Exact multi-line comparison: the default query normalizer collapses
    // whitespace, which would never match a free-form multi-line value.
    expect(
      screen.getByDisplayValue("Cardio:\n- 15 min bike", {
        normalizer: getDefaultNormalizer({
          trim: false,
          collapseWhitespace: false,
        }),
      }),
    ).toBeTruthy();

    // Cloned values elsewhere are untouched.
    expect(screen.getByDisplayValue("82.5kg")).toBeTruthy();

    // All 40 rows survived the reload.
    expect(document.querySelectorAll("table tbody tr")).toHaveLength(40);

    // The deliberate Gym Log back control remains available and Home still
    // offers Continue for the existing current session.
    fireEvent.click(screen.getByRole("button", { name: "‹ Gym Log" }));
    expect(
      await screen.findByRole("button", { name: /Continue Today's Session/ }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: /Continue Today's Session/ }),
    );
    expect(
      await screen.findByDisplayValue("Recline curl bench 30° IR uni edited"),
    ).toBeTruthy();
  });

  it("applies a row-level highlight through the row menu's Colour control", async () => {
    render(<App db={db} todayLocal={TODAY} />);
    await screen.findByText(/40 sets · 39 exercises/);
    fireEvent.click(
      screen.getByRole("button", { name: "Start Today's Session" }),
    );

    await screen.findByDisplayValue("Chest Press Neutral 5");

    // First tap selects row 6; tapping the selected handle opens the row menu;
    // Colour opens the locked palette (spec §§7.2-7.3, 5.1).
    fireEvent.click(screen.getByRole("button", { name: "Select row 6" }));
    fireEvent.click(screen.getByRole("button", { name: "Select row 6" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Colour" }));

    // Selection stays available until Done.
    expect(screen.getByText("Row colour")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    // Highlight persists asynchronously: await the observable persisted value
    // in IndexedDB instead of reading before the colour write lands.
    await waitFor(async () => {
      const sessions = await db.sessions.toArray();
      const todaySession = sessions.find((s) => s.dateLocal !== "2026-08-23");
      const chestPressRow = todaySession?.rows.find(
        (row) => row.exercise === "Chest Press Neutral 5",
      );
      expect(chestPressRow?.highlight).toBe("purple");
    });
  });

  it("does not duplicate today's session when Start is pressed twice quickly", async () => {
    render(<App db={db} todayLocal={TODAY} />);
    await screen.findByText(/40 sets · 39 exercises/);

    const startButton = () =>
      screen.getByRole("button", { name: "Start Today's Session" }) as HTMLButtonElement;

    // Second tap while the first is still resolving is ignored by the guard.
    startButton().click();
    if (!startButton().disabled) {
      startButton().click();
    }

    await screen.findByDisplayValue("Recline curl bench 30° IR uni");

    const todaysSessions = (await db.sessions.toArray()).filter(
      (session) => session.sourceSessionId === "fixture-sunday-23-aug",
    );
    expect(todaysSessions).toHaveLength(1);
  });

  it("keeps the Home/Start flow when no current session exists", async () => {
    // A date with no session: the seed is dated 2026-08-23, so nothing resumes.
    render(<App db={db} todayLocal="2026-09-01" />);

    expect(await screen.findByText("Gym Log")).toBeTruthy();
    expect(
      await screen.findByRole("button", { name: "Start Today's Session" }),
    ).toBeTruthy();
    // The seed did NOT auto-open as a current session.
    expect(screen.queryByDisplayValue("Recline curl bench 30° IR uni")).toBeNull();
  });
});
