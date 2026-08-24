import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import Dexie from "dexie";
import { App } from "../App";
import { createDb, setSummaryOverride, type GymLogDB } from "../data/db";
import { clearRowClipboard } from "../domain/rowClipboard";

const DB_NAME = "gym-logger";
const TODAY = "2026-08-24";

let db: GymLogDB;

beforeEach(async () => {
  await Dexie.delete(DB_NAME);
  db = createDb();
  clearRowClipboard();
});

afterEach(() => {
  cleanup();
  db.close();
});

/* ------------------------------ helpers ------------------------------ */

/**
 * Boots the app, starts today's clone of the seeded fixture (the normal Home
 * → Start flow), and waits inside the opened session view.
 */
async function openTodaysSession(): Promise<void> {
  render(<App db={db} todayLocal={TODAY} />);
  // The seeded fixture must be visible (liveQuery resolved) before Start is
  // clickable — otherwise the button is still disabled and the tap no-ops.
  await screen.findByText(/40 sets · 39 exercises/);
  const startButton = screen.getByRole("button", {
    name: "Start Today's Session",
  }) as HTMLButtonElement;
  expect(startButton.disabled).toBe(false);
  fireEvent.click(startButton);
  await screen.findByDisplayValue("Recline curl bench 30° IR uni");
}

async function todaysSession() {
  const sessions = await db.sessions.toArray();
  return sessions.find((session) => session.dateLocal === TODAY)!;
}

function summaryButton(): HTMLButtonElement {
  return screen.getByLabelText("Edit session summary") as HTMLButtonElement;
}

function expectSummaryText(text: string): void {
  expect(summaryButton().textContent).toBe(text);
}

async function openEditor(): Promise<void> {
  fireEvent.click(summaryButton());
  await screen.findByLabelText("Sets display override");
}

function setsInput(): HTMLInputElement {
  return screen.getByLabelText("Sets display override") as HTMLInputElement;
}

function exercisesInput(): HTMLInputElement {
  return screen.getByLabelText(
    "Exercises display override",
  ) as HTMLInputElement;
}

function type(input: HTMLInputElement, value: string): void {
  fireEvent.change(input, { target: { value } });
}

/* ------------------------------- tests ------------------------------- */

describe("manual summary override UI (M02-T04)", () => {
  it("shows calculated totals when no override exists while the seeded 40/39 mismatch flows through existing data (AC-01)", async () => {
    await openTodaysSession();

    // The started session cloned the seed INCLUDING its intentional manual
    // mismatch (clone policy: source-fidelity, spec §9.2).
    expectSummaryText("40 sets · 39 exercises");

    // Removing the override (data path) reveals the pure calculated totals:
    // 40 rows × Sets "1" ⇒ 40 sets, 40 named exercises.
    const current = await todaysSession();
    await setSummaryOverride(db, current.id, undefined);

    await waitFor(() => expectSummaryText("40 sets · 40 exercises"));
  });

  it("edits one total independently and stores arbitrary strings without normalization (AC-02)", async () => {
    await openTodaysSession();
    const current = await todaysSession();
    await setSummaryOverride(db, current.id, undefined);
    await waitFor(() => expectSummaryText("40 sets · 40 exercises"));

    await openEditor();
    // Fields open pre-filled with the currently displayed values, and the
    // editor names what reset restores (spec §9.2 "show calculated values").
    expect(setsInput().value).toBe("40");
    expect(exercisesInput().value).toBe("40");
    expect(
      document.querySelector(".summary-calculated-hint")!.textContent,
    ).toBe("Calculated from rows: 40 sets · 40 exercises");

    // Edit ONLY Sets, to an arbitrary non-numeric display string. Exercises
    // stays equal to its calculated value, so NO exercises override is kept.
    type(setsInput(), "~41");
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    await waitFor(async () => {
      const saved = await db.sessions.get(current.id);
      expect(saved!.summaryOverride).toEqual({ sets: "~41" });
    });
    await waitFor(() => expectSummaryText("~41 sets · 40 exercises"));
  });

  it("keeps both totals free-form exactly as typed (AC-02)", async () => {
    await openTodaysSession();
    const current = await todaysSession();

    await openEditor();
    type(setsInput(), "8,6");
    type(exercisesInput(), "39ish");
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    // Stored byte-for-byte — never parsed, rounded, or coerced (§9.2).
    await waitFor(async () => {
      const saved = await db.sessions.get(current.id);
      expect(saved!.summaryOverride).toEqual({
        sets: "8,6",
        exercises: "39ish",
      });
    });
    await waitFor(() => expectSummaryText("8,6 sets · 39ish exercises"));
  });

  it("persists an override across leaving and reopening the session (AC-03)", async () => {
    await openTodaysSession();
    const current = await todaysSession();

    await openEditor();
    type(setsInput(), "42");
    type(exercisesInput(), "39ish");
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expectSummaryText("42 sets · 39ish exercises"));

    // Simulate leaving and coming back: remount against the SAME database.
    // A current session resumes directly (spec §27.1), override intact.
    cleanup();
    render(<App db={db} todayLocal={TODAY} />);
    await screen.findByDisplayValue("Recline curl bench 30° IR uni");
    expectSummaryText("42 sets · 39ish exercises");

    const reloaded = await db.sessions.get(current.id);
    expect(reloaded!.summaryOverride).toEqual({
      sets: "42",
      exercises: "39ish",
    });
  });

  it("reset-to-calculated removes the whole override and restores calculated totals (AC-04)", async () => {
    await openTodaysSession();
    const current = await todaysSession();

    await openEditor();
    type(setsInput(), "~41");
    type(exercisesInput(), "39ish");
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expectSummaryText("~41 sets · 39ish exercises"));

    await openEditor();
    expect(setsInput().value).toBe("~41");
    expect(exercisesInput().value).toBe("39ish");
    fireEvent.click(
      screen.getByRole("button", { name: "Reset to calculated" }),
    );
    // Filling both fields with the calculated values…
    expect(setsInput().value).toBe("40");
    expect(exercisesInput().value).toBe("40");
    // …and confirming removes the stored override entirely.
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    await waitFor(() => expectSummaryText("40 sets · 40 exercises"));
    const saved = await db.sessions.get(current.id);
    expect(saved!.summaryOverride).toBeUndefined();
  });

  it("clearing one field resets only that total while the other override persists", async () => {
    await openTodaysSession();
    const current = await todaysSession();

    await openEditor();
    type(setsInput(), "~41");
    type(exercisesInput(), "39ish");
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expectSummaryText("~41 sets · 39ish exercises"));

    await openEditor();
    type(setsInput(), ""); // blank ⇒ per-field reset to calculated
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    await waitFor(() => expectSummaryText("40 sets · 39ish exercises"));
    const saved = await db.sessions.get(current.id);
    expect(saved!.summaryOverride).toEqual({ exercises: "39ish" });
  });

  it("Cancel discards edits without writing anything", async () => {
    await openTodaysSession();
    const current = await todaysSession();
    const before = JSON.parse(JSON.stringify(await db.sessions.get(current.id)));

    await openEditor();
    type(setsInput(), "999 junk");
    type(exercisesInput(), "");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    // Editor closed; the record — including updatedAt — is untouched.
    expect(screen.queryByLabelText("Sets display override")).toBeNull();
    expectSummaryText("40 sets · 39 exercises");
    const after = await db.sessions.get(current.id);
    expect(after).toEqual(before);
  });
});
