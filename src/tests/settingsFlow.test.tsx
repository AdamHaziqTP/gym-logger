import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, beforeAll, describe, expect, it, vi } from "vitest";
import Dexie from "dexie";
import { App } from "../App";
import { createDb, type GymLogDB } from "../data/db";
import {
  APP_VERSION,
  IMAGE_STYLE_META_KEY,
  THEME_META_KEY,
} from "../domain/settings";

/* ---------------------------------------------------------------------- */
/* Focused Settings flow coverage (spec §§22–23; M06-T02 CORRECTION-01):  */
/* Home → Settings navigation, immediate theme application + persistence  */
/* (including the System media-query contract), Default Image Style       */
/* persistence seeding Export Image's initial selection while the panel   */
/* toggle stays per-export, About copy, and safe defaults for invalid     */
/* stored metadata. jsdom cannot prove physical light-mode pixels; the    */
/* stylesheet CONTRACT is pinned instead.                                 */
/* ---------------------------------------------------------------------- */

const DB_NAME = "gym-logger";
/**
 * Fixed local date with NO session (the seed is dated 2026-08-23), so every
 * launch lands deterministically on Home — the documented convention of the
 * existing App-flow suites. The seeded fixture then opens via its View button.
 */
const TODAY = "2026-08-24";

let db: GymLogDB;

beforeAll(() => {
  // jsdom has no canvas implementation; without this stub its virtual
  // console emits a "Not implemented" error for getContext("2d"). The
  // export panel treats a null context exactly as a real browser without
  // canvas support, so stubbing to null keeps the production degradation
  // path intact while keeping test output clean and deterministic.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

beforeEach(async () => {
  await Dexie.delete(DB_NAME);
  db = createDb();
});

afterEach(() => {
  cleanup();
  db.close();
  // Theme state lives on <html>; never leak it between tests.
  document.documentElement.removeAttribute("data-theme");
});

/** Launches on Home (seeding the fixture), then opens the Settings screen. */
async function openSettings() {
  render(<App db={db} todayLocal={TODAY} />);
  expect(await screen.findByText(/40 sets · 39 exercises/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  expect(await screen.findByRole("heading", { name: "Settings" })).toBeTruthy();
}

/** Launches on Home, then opens the seeded historical session via View. */
async function openSeededSession() {
  render(<App db={db} todayLocal={TODAY} />);
  expect(await screen.findByText(/40 sets · 39 exercises/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "View" }));
  expect(
    await screen.findByRole("heading", { name: "Sunday 23 Aug" }),
  ).toBeTruthy();
}

function themeGroup(): HTMLElement {
  return screen.getByRole("group", { name: "Theme" });
}

function imageStyleGroup(): HTMLElement {
  return screen.getByRole("group", { name: "Default image style" });
}

function groupButton(group: HTMLElement, name: string): HTMLButtonElement {
  return within(group).getByRole("button", { name }) as HTMLButtonElement;
}

function pressedValue(button: HTMLButtonElement): string | null {
  return button.getAttribute("aria-pressed");
}

async function storedMetaValue(key: string): Promise<string | undefined> {
  const record = await db.meta.get(key);
  return record?.value;
}

/** Polls until the persisted meta value equals `expected`. */
async function waitForStoredMeta(key: string, expected: string) {
  await waitFor(async () => {
    expect(await storedMetaValue(key)).toBe(expected);
  });
}

describe("Home → Settings navigation (spec §§4.1, 23)", () => {
  it("opens a quiet Settings screen from Home and returns back", async () => {
    render(<App db={db} todayLocal={TODAY} />);
    expect(await screen.findByText(/40 sets · 39 exercises/)).toBeTruthy();

    const settingsButton = screen.getByRole("button", { name: "Settings" });
    // Scoped entry: its own .settings-entry section — the two original
    // .home-actions controls stay an untouched pair.
    expect(settingsButton.closest(".settings-entry")).not.toBeNull();

    fireEvent.click(settingsButton);
    expect(
      await screen.findByRole("heading", { name: "Settings" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "‹ Gym Log" }));
    expect(
      await screen.findByRole("heading", { name: "Gym Log", level: 1 }),
    ).toBeTruthy();
  });

  it("renders exactly the two preference groups plus About", async () => {
    await openSettings();

    expect(themeGroup()).toBeTruthy();
    expect(imageStyleGroup()).toBeTruthy();

    // Spec §22 hint and §23 About wording.
    expect(
      screen.getByText("System follows this device's light or dark appearance."),
    ).toBeTruthy();
    expect(
      screen.getByText(/keeps everything on this device/),
    ).toBeTruthy();
    expect(
      screen.getByText(`Version ${APP_VERSION}`),
    ).toBeTruthy();
    expect(
      screen.getByText("Your Apple Notes archive remains canonical."),
    ).toBeTruthy();
  });
});

describe("theme choices apply immediately and persist", () => {
  it("defaults to System with no theme attribute on <html>", async () => {
    await openSettings();
    expect(pressedValue(groupButton(themeGroup(), "System"))).toBe("true");
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });

  it("applies Dark/Light without reload and removes the attribute for System", async () => {
    await openSettings();

    fireEvent.click(groupButton(themeGroup(), "Dark"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(pressedValue(groupButton(themeGroup(), "Dark"))).toBe("true");

    fireEvent.click(groupButton(themeGroup(), "Light"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    fireEvent.click(groupButton(themeGroup(), "System"));
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
    expect(pressedValue(groupButton(themeGroup(), "System"))).toBe("true");

    // The React tree survived every change — no page reload occurred.
    expect(screen.getByRole("heading", { name: "Settings" })).toBeTruthy();
  });

  it("persists each choice into the existing meta table", async () => {
    await openSettings();

    fireEvent.click(groupButton(themeGroup(), "Dark"));
    await waitForStoredMeta(THEME_META_KEY, "dark");

    fireEvent.click(groupButton(themeGroup(), "Light"));
    await waitForStoredMeta(THEME_META_KEY, "light");

    fireEvent.click(groupButton(themeGroup(), "System"));
    await waitForStoredMeta(THEME_META_KEY, "system");
  });

  it("re-applies a saved theme after remount (bootstrap path)", async () => {
    await openSettings();
    fireEvent.click(groupButton(themeGroup(), "Dark"));
    await waitForStoredMeta(THEME_META_KEY, "dark");

    cleanup();
    render(<App db={db} todayLocal={TODAY} />);

    // The attribute returns through bootstrap alone — no click involved —
    // landing on Home because no session exists for TODAY.
    await waitFor(() => {
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    // And the control reflects the loaded choice.
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const pressed = (
      await screen.findByRole("group", { name: "Theme" })
    ).querySelector('button[aria-pressed="true"]')?.textContent;
    expect(pressed).toBe("Dark");
  });
});

describe("safe defaults for missing/invalid metadata", () => {
  it("ignores unrecognized stored values and shows System/Compact", async () => {
    await db.meta.bulkPut([
      { key: THEME_META_KEY, value: "blue", at: "2026-08-25T06:00:00.000Z" },
      {
        key: IMAGE_STYLE_META_KEY,
        value: "gigantic",
        at: "2026-08-25T06:00:00.000Z",
      },
    ]);

    await openSettings();

    expect(pressedValue(groupButton(themeGroup(), "System"))).toBe("true");
    expect(pressedValue(groupButton(imageStyleGroup(), "Compact"))).toBe("true");
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });
});

describe("Default Image Style seeds Export Image (spec §14.1)", () => {
  function exportStyleGroup(): HTMLElement {
    return screen.getByRole("group", { name: "Export style" });
  }

  /** Opens the export overlay and waits for its preview lifecycle to settle. */
  async function openExportPanel() {
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Export Image" }));
    });
    expect(exportStyleGroup()).toBeTruthy();
    await screen.findByAltText(/Full-session export preview,/);
  }

  it("starts Compact when the preference was never changed", async () => {
    await openSeededSession();

    await openExportPanel();
    expect(pressedValue(groupButton(exportStyleGroup(), "Compact"))).toBe("true");
    expect(pressedValue(groupButton(exportStyleGroup(), "Faithful"))).toBe(
      "false",
    );
  });

  it("initializes from the persisted choice; per-export toggling never rewrites it", async () => {
    await openSettings();
    fireEvent.click(groupButton(imageStyleGroup(), "Faithful"));
    expect(pressedValue(groupButton(imageStyleGroup(), "Faithful"))).toBe("true");
    await waitForStoredMeta(IMAGE_STYLE_META_KEY, "faithful");

    // Back Home → reopen the seeded session → open Export Image.
    fireEvent.click(screen.getByRole("button", { name: "‹ Gym Log" }));
    fireEvent.click(await screen.findByRole("button", { name: "View" }));
    expect(
      await screen.findByRole("heading", { name: "Sunday 23 Aug" }),
    ).toBeTruthy();
    await openExportPanel();

    // Seeded from the persisted preference, not hard-coded Compact.
    expect(pressedValue(groupButton(exportStyleGroup(), "Faithful"))).toBe("true");
    expect(
      screen.getByAltText("Full-session export preview, faithful style"),
    ).toBeTruthy();

    // The panel toggle stays PER-EXPORT: switching here must not persist.
    await act(async () => {
      fireEvent.click(groupButton(exportStyleGroup(), "Compact"));
    });
    expect(pressedValue(groupButton(exportStyleGroup(), "Compact"))).toBe("true");
    await screen.findByAltText("Full-session export preview, compact style");
    expect(await storedMetaValue(IMAGE_STYLE_META_KEY)).toBe("faithful");

    // Closing discards the per-export choice; reopening re-seeds from storage.
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await openExportPanel();
    expect(pressedValue(groupButton(exportStyleGroup(), "Faithful"))).toBe("true");
  });
});

/* ------------------------ System media-query contract ------------------ */

function readStylesCss(): string {
  return readFileSync(resolve(process.cwd(), "src", "styles.css"), "utf8");
}

/** Extracts the balanced {...} block that follows a marker substring. */
function cssBlockAfter(css: string, startMarker: string): string {
  const start = css.indexOf(startMarker);
  expect(start, `missing CSS marker: ${startMarker}`).toBeGreaterThan(-1);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    const character = css[index];
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, index);
    }
  }
  throw new Error(`unbalanced braces after: ${startMarker}`);
}

/** Normalized declaration list of one CSS block, order-insensitive. */
function declarations(block: string): string[] {
  return block
    .split(";")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .sort();
}

describe("theme stylesheet contract (jsdom cannot compute OS media queries)", () => {
  it("keeps dark as the default :root presentation", () => {
    const rootBlock = cssBlockAfter(readStylesCss(), ":root {");
    expect(rootBlock).toMatch(/color-scheme:\s*dark/);
    expect(rootBlock).toMatch(/--bg:\s*#000000/);
    expect(rootBlock).toMatch(/--text:\s*#f2f2f7/);
  });

  it("scopes System overrides so they can NEVER beat an explicit Dark choice", () => {
    const css = readStylesCss();
    const mediaBlock = cssBlockAfter(css, "@media (prefers-color-scheme: light)");

    // Exactly one inner rule, and it excludes explicit dark explicitly.
    const selector = ':root:not([data-theme="dark"])';
    expect(mediaBlock.trim().startsWith(selector)).toBe(true);
    expect(mediaBlock.replace(selector, "").includes("[data-theme")).toBe(false);
  });

  it("declares the explicit Light block token-identical to the System override", () => {
    const css = readStylesCss();
    // Anchored to the brace: the stylesheet's header comment also mentions
    // [data-theme="light"], and indexOf must land on the RULE, not the prose.
    const lightBlock = cssBlockAfter(css, '[data-theme="light"] {');
    const mediaBlock = cssBlockAfter(css, "@media (prefers-color-scheme: light)");
    const systemRule = cssBlockAfter(mediaBlock, ':root:not([data-theme="dark"])');

    expect(lightBlock).toMatch(/color-scheme:\s*light/);
    // The pinned invariant from the stylesheet comment: both mechanisms MUST
    // stay token-identical so System and explicit Light look the same.
    expect(declarations(systemRule)).toEqual(declarations(lightBlock));
  });

  it("does not introduce any standalone dark override block", () => {
    // Dark needs none: it is the :root default, and the media query excludes it.
    expect(readStylesCss().match(/\[data-theme="dark"\]\s*\{/)).toBeNull();
  });
});
