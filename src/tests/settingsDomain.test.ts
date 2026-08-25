import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GymLogDB, type MetaRecord } from "../data/db";
import {
  readAppSettings,
  saveDefaultImageStyleSetting,
  saveThemeSetting,
} from "../data/settings";
import {
  applyThemePreference,
  dataThemeForPreference,
  DEFAULT_SETTINGS,
  IMAGE_STYLE_META_KEY,
  parseImageStyleMetaValue,
  parseThemeMetaValue,
  readSettingsFromMeta,
  SETTINGS_SCHEMA_VERSION,
  THEME_META_KEY,
  type MetaKeyValue,
} from "../domain/settings";

/* ---------------------------------------------------------------------- */
/* Focused coverage for the v1 settings core (spec §§22–23; M06-T02       */
/* CORRECTION-01): strict parsing with safe defaults for missing/invalid  */
/* metadata, the DOM application rule (explicit choice vs. System), and   */
/* persistence through the EXISTING meta table. Deterministic only — no   */
/* browser, no OS appearance claims.                                      */
/* ---------------------------------------------------------------------- */

const DB_NAME = "gym-logger-settings-domain-test";
const FIXED_AT = "2026-08-25T06:00:00.000Z";

let db: GymLogDB;

beforeEach(async () => {
  await Dexie.delete(DB_NAME);
  db = new GymLogDB(DB_NAME);
  await db.open();
});

afterEach(async () => {
  db.close();
  await Dexie.delete(DB_NAME);
  // Tests may drive the real <html> element; never leak a theme attribute.
  document.documentElement.removeAttribute("data-theme");
});

describe("strict parsing falls back to safe defaults (no coercion)", () => {
  it("accepts exactly the three theme values and nothing else", () => {
    expect(parseThemeMetaValue("system")).toBe("system");
    expect(parseThemeMetaValue("dark")).toBe("dark");
    expect(parseThemeMetaValue("light")).toBe("light");

    // Missing, mistyped, near-miss, and hostile values all fall back to the
    // System default — no trimming, casing, or reinterpreting.
    expect(parseThemeMetaValue(undefined)).toBe("system");
    expect(parseThemeMetaValue(null)).toBe("system");
    expect(parseThemeMetaValue("")).toBe("system");
    expect(parseThemeMetaValue("DARK")).toBe("system");
    expect(parseThemeMetaValue(" dark")).toBe("system");
    expect(parseThemeMetaValue("sepia")).toBe("system");
    expect(parseThemeMetaValue(42)).toBe("system");
    expect(parseThemeMetaValue({ theme: "dark" })).toBe("system");
  });

  it("accepts exactly compact/faithful and falls back to Compact otherwise", () => {
    expect(parseImageStyleMetaValue("compact")).toBe("compact");
    expect(parseImageStyleMetaValue("faithful")).toBe("faithful");

    expect(parseImageStyleMetaValue(undefined)).toBe("compact");
    expect(parseImageStyleMetaValue(null)).toBe("compact");
    expect(parseImageStyleMetaValue("Faithful")).toBe("compact");
    expect(parseImageStyleMetaValue("faithful ")).toBe("compact");
    expect(parseImageStyleMetaValue(1)).toBe("compact");
  });

  it("exposes the spec defaults: System theme, Compact style, schema version 1", () => {
    expect(DEFAULT_SETTINGS).toEqual({
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      theme: "system",
      defaultImageStyle: "compact",
    });
    expect(SETTINGS_SCHEMA_VERSION).toBe(1);
  });
});

describe("readSettingsFromMeta mapping", () => {
  const record = (key: string, value: string): MetaKeyValue => ({ key, value });

  it("returns exact defaults when no records exist", () => {
    expect(readSettingsFromMeta([])).toEqual(DEFAULT_SETTINGS);
  });

  it("ignores unknown keys and reads known ones", () => {
    expect(
      readSettingsFromMeta([
        record("seededFrom", "seed/latest-session.example.json@1"),
        record(THEME_META_KEY, "dark"),
        record("unrelated.setting", "whatever"),
        record(IMAGE_STYLE_META_KEY, "faithful"),
      ]),
    ).toEqual({
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      theme: "dark",
      defaultImageStyle: "faithful",
    });
  });

  it("falls back per-key: one invalid value never poisons the other", () => {
    expect(
      readSettingsFromMeta([
        record(THEME_META_KEY, "blue"),
        record(IMAGE_STYLE_META_KEY, "faithful"),
      ]).theme,
    ).toBe("system");
    expect(
      readSettingsFromMeta([
        record(THEME_META_KEY, "light"),
        record(IMAGE_STYLE_META_KEY, "night"),
      ]).defaultImageStyle,
    ).toBe("compact");
  });

  it("uses the first record for a duplicated known key", () => {
    expect(
      readSettingsFromMeta([
        record(THEME_META_KEY, "dark"),
        record(THEME_META_KEY, "light"),
      ]).theme,
    ).toBe("dark");
  });
});

describe("theme → DOM rule (pure part)", () => {
  it("maps explicit choices to their attribute value and System to removal", () => {
    expect(dataThemeForPreference("dark")).toBe("dark");
    expect(dataThemeForPreference("light")).toBe("light");
    expect(dataThemeForPreference("system")).toBeNull();
  });
});

/** Minimal injectable root recording every mutation call in order. */
function makeFakeRoot() {
  const attributes = new Map<string, string>();
  const calls: string[] = [];
  return {
    calls,
    has: (name: string) => attributes.has(name),
    getAttribute: (name: string) => {
      calls.push(`get:${name}`);
      return attributes.get(name) ?? null;
    },
    setAttribute: (name: string, value: string) => {
      calls.push(`set:${name}=${value}`);
      attributes.set(name, value);
    },
    removeAttribute: (name: string) => {
      calls.push(`remove:${name}`);
      attributes.delete(name);
    },
  };
}

describe("applyThemePreference against an injected root", () => {
  it("sets data-theme for explicit Dark/Light choices", () => {
    const root = makeFakeRoot();
    applyThemePreference("dark", root);
    expect(root.has("data-theme")).toBe(true);

    applyThemePreference("light", root);
    expect(root.getAttribute("data-theme")).toBe("light");
  });

  it("removes an existing attribute for System and never touches a clean root", () => {
    const root = makeFakeRoot();
    applyThemePreference("dark", root);
    applyThemePreference("system", root);
    expect(root.has("data-theme")).toBe(false);

    // Idempotent System re-application on an attribute-less root performs no
    // redundant removal — the pinned guard behavior of the corrected type.
    const removeCallsBefore = root.calls.filter((call) =>
      call.startsWith("remove:"),
    ).length;
    applyThemePreference("system", root);
    expect(
      root.calls.filter((call) => call.startsWith("remove:")).length,
    ).toBe(removeCallsBefore);
  });

  it("is idempotent for repeated identical applications", () => {
    const root = makeFakeRoot();
    applyThemePreference("light", root);
    applyThemePreference("light", root);
    expect(root.getAttribute("data-theme")).toBe("light");
  });

  it("is a silent no-op without any root (SSR/undefined guard)", () => {
    expect(() => applyThemePreference("dark", undefined)).not.toThrow();
  });
});

describe("applyThemePreference on the real document element", () => {
  it("drives html[data-theme] through Dark → Light → System without residue", () => {
    const root = document.documentElement;
    applyThemePreference("dark", root);
    expect(root.getAttribute("data-theme")).toBe("dark");

    applyThemePreference("light", root);
    expect(root.getAttribute("data-theme")).toBe("light");

    applyThemePreference("system", root);
    expect(root.getAttribute("data-theme")).toBeNull();

    // Production signature (no injected root) works against the same element.
    applyThemePreference("dark");
    expect(root.getAttribute("data-theme")).toBe("dark");
    applyThemePreference("system");
    expect(root.getAttribute("data-theme")).toBeNull();
  });
});

describe("settings persistence in the existing meta table", () => {
  it("reads exact defaults from a fresh database", async () => {
    expect(await readAppSettings(db)).toEqual(DEFAULT_SETTINGS);
    expect(await db.meta.toArray()).toEqual([]);
  });

  it("persists a theme choice as a plain meta record and reads it back", async () => {
    await saveThemeSetting(db, "dark", () => new Date(FIXED_AT));
    expect(await db.meta.get(THEME_META_KEY)).toEqual({
      key: THEME_META_KEY,
      value: "dark",
      at: FIXED_AT,
    });
    expect((await readAppSettings(db)).theme).toBe("dark");

    // Overwriting the same key replaces the record (no duplicates).
    await saveThemeSetting(db, "light", () => new Date(FIXED_AT));
    expect(await db.meta.where("key").equals(THEME_META_KEY).count()).toBe(1);
    expect((await readAppSettings(db)).theme).toBe("light");
  });

  it("persists the default image style independently of the theme", async () => {
    await saveDefaultImageStyleSetting(db, "faithful");
    await saveThemeSetting(db, "dark");
    expect(await readAppSettings(db)).toEqual({
      schemaVersion: SETTINGS_SCHEMA_VERSION,
      theme: "dark",
      defaultImageStyle: "faithful",
    });
  });

  it("falls back to safe defaults when stored values are invalid", async () => {
    const badRecords: MetaRecord[] = [
      { key: THEME_META_KEY, value: "blue", at: FIXED_AT },
      { key: IMAGE_STYLE_META_KEY, value: "gigantic", at: FIXED_AT },
    ];
    await db.meta.bulkPut(badRecords);
    expect(await readAppSettings(db)).toEqual(DEFAULT_SETTINGS);
  });

  it("survives a hostile wrong-typed value written directly into the table", async () => {
    await db.meta.bulkPut([
      { key: THEME_META_KEY, value: 42, at: FIXED_AT },
    ] as unknown as MetaRecord[]);
    expect(await readAppSettings(db)).toEqual(DEFAULT_SETTINGS);
  });

  it("resolves to the defaults instead of failing when the read itself throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const brokenDb = {
        meta: {
          bulkGet: () => Promise.reject(new Error("storage gone")),
        },
      } as unknown as GymLogDB;
      await expect(readAppSettings(brokenDb)).resolves.toEqual(DEFAULT_SETTINGS);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
