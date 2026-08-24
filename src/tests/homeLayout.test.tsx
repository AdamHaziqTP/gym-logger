import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import Dexie from "dexie";
import { App } from "../App";
import { createDb, type GymLogDB } from "../data/db";

const DB_NAME = "gym-logger";
/** Fixed local date so Home renders the seeded fixture deterministically. */
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

async function openHome() {
  render(<App db={db} todayLocal={TODAY} />);
  expect(await screen.findByText(/40 sets · 39 exercises/)).toBeTruthy();
}

/**
 * The action area must hold EXACTLY the two secondary actions in their
 * original order; returns them as [copyAnother, history].
 */
function homeActionButtons(): [HTMLButtonElement, HTMLButtonElement] {
  const container = screen
    .getByRole("button", { name: "Copy Another Session" })
    .closest(".home-actions");
  expect(container).not.toBeNull();
  const buttons = Array.from(container!.querySelectorAll("button"));
  expect(buttons.map((button) => button.textContent)).toEqual([
    "Copy Another Session",
    "History",
  ]);
  return buttons as [HTMLButtonElement, HTMLButtonElement];
}

/**
 * jsdom never loads styles.css and cannot prove physical iPhone pixels; this
 * pins only the stylesheet CONTRACT that separates the two controls.
 */
function homeActionsCssRule(): string {
  // Resolved from the package root, the same convention vite.config.ts uses.
  const css = readFileSync(
    resolve(process.cwd(), "src", "styles.css"),
    "utf8",
  );
  const match = css.match(/\.home-actions\s*\{[^}]*\}/);
  expect(match).not.toBeNull();
  return match![0];
}

describe("Home action-area layout (M03-T02-HOME-LAYOUT-FIX-01)", () => {
  it("renders Copy Another Session + History as two distinct btn btn-secondary controls inside one .home-actions area on .screen", async () => {
    await openHome();

    const [copy, history] = homeActionButtons();

    // Real buttons with unchanged accessible semantics.
    for (const button of [copy, history]) {
      expect(button.tagName).toBe("BUTTON");
      expect(button.getAttribute("type")).toBe("button");
      expect(button.classList.contains("btn")).toBe(true);
      expect(button.classList.contains("btn-secondary")).toBe(true);
    }

    // Order preserved: Copy Another Session first, History directly after.
    expect(
      copy.compareDocumentPosition(history) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // Scoped placement: a direct child of the Home screen element — never
    // nested inside a Today/Last Workout panel.
    const container = copy.closest(".home-actions") as HTMLElement;
    expect(container.parentElement?.classList.contains("screen")).toBe(true);
    expect(
      container.querySelectorAll(".panel, .btn-primary").length,
    ).toBe(0);

    // The Today/Last Workout panels remain untouched siblings.
    expect(document.querySelector("#today-label")).not.toBeNull();
    expect(document.querySelector("#last-label")).not.toBeNull();
  });

  it("keeps the stylesheet rule that keeps the controls distinct: scoped flex column with a positive gap", () => {
    const rule = homeActionsCssRule();
    expect(rule).toMatch(/display:\s*flex/);
    expect(rule).toMatch(/flex-direction:\s*column/);
    const gap = rule.match(/gap:\s*([\d.]+)px/);
    expect(gap).not.toBeNull();
    expect(parseFloat(gap![1])).toBeGreaterThan(0);
  });

  it("preserves existing navigation behavior through both action buttons", async () => {
    await openHome();

    fireEvent.click(
      screen.getByRole("button", { name: "Copy Another Session" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Copy Another Session" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "‹ Gym Log" }));
    expect(
      await screen.findByRole("button", { name: "History" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "History" }));
    expect(await screen.findByRole("heading", { name: "History" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "‹ Gym Log" }));
    expect(
      await screen.findByRole("button", { name: "History" }),
    ).toBeTruthy();
  });

  it("preserves disabled behavior: no sessions disables Copy Another Session while History stays enabled", async () => {
    await openHome();

    // The one-time seed flag is already set, so clearing sessions can never
    // reseed — this is the real empty-history Home state.
    await act(async () => {
      await db.sessions.clear();
    });
    await waitFor(() => {
      expect(
        (
          screen.getByRole("button", {
            name: "Copy Another Session",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });

    const [, history] = homeActionButtons();
    expect(history.disabled).toBe(false);
    fireEvent.click(history);
    expect(await screen.findByText("No sessions yet.")).toBeTruthy();
  });
});
