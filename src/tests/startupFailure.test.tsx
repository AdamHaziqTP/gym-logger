import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";
import type { GymLogDB } from "../data/db";

/**
 * M06-T01 (spec §27.9): when local storage cannot open at startup the app
 * shows a non-destructive, truthful failure screen instead of failing
 * silently — and never claims data was lost or that storage is permanent.
 */

const TODAY = "2026-08-24";

function brokenDb(): GymLogDB {
  return {
    isOpen: () => false,
    open: () => Promise.reject(new Error("OpenFailedError: blocked")),
    sessions: {},
  } as unknown as GymLogDB;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("App storage-unavailable startup (M06-T01)", () => {
  it("shows an alert screen instead of Home when the database cannot open", async () => {
    render(<App db={brokenDb()} todayLocal={TODAY} />);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Storage unavailable");
    expect(alert.textContent).toContain("couldn't open this device's local database");
    expect(alert.textContent).toContain("Nothing was deleted");

    // The normal editing surface must not appear on a broken database.
    expect(
      screen.queryByRole("button", { name: "Start Today's Session" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "History" })).toBeNull();
  });

  it("offers Try Again, stays non-destructive while storage is still broken", async () => {
    const db = brokenDb();
    const openSpy = vi.spyOn(db, "open");
    render(<App db={db} todayLocal={TODAY} />);

    const button = await screen.findByRole("button", { name: "Try Again" });
    fireEvent.click(button);
    expect(await screen.findByRole("alert")).toBeTruthy();
    // A retry re-ran the bootstrap (still failing) without deleting anything.
    expect(openSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("alert").textContent).toContain("Nothing was deleted");
  });

  it("keeps the failure copy truthful: no data loss claims, points at Backup", async () => {
    render(<App db={brokenDb()} todayLocal={TODAY} />);
    const alert = await screen.findByRole("alert");
    // Honest about impermanence (spec §17.3) and about what did NOT happen.
    expect(alert.textContent).toContain("local storage is not a permanent archive");
    expect(alert.textContent).toContain("Nothing was deleted");
    // Points at the real safety net: Backup export.
    expect(alert.textContent).toContain("Export Backup");
  });

  it("keeps the normal Home flow intact when storage opens fine", async () => {
    // Sanity guard for this file's fixtures: a healthy db still reaches Home.
    const { createDb } = await import("../data/db");
    const { default: Dexie } = await import("dexie");
    await Dexie.delete("gym-logger");
    const db = createDb();
    try {
      render(<App db={db} todayLocal={TODAY} />);
      expect(
        await screen.findByRole("button", { name: "Start Today's Session" }),
      ).toBeTruthy();
      expect(screen.queryByRole("alert")).toBeNull();
    } finally {
      db.close();
    }
  });
});
