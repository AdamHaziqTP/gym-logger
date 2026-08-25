import type { AppSettings } from "../domain/settings";
import {
  DEFAULT_SETTINGS,
  IMAGE_STYLE_META_KEY,
  THEME_META_KEY,
  readSettingsFromMeta,
} from "../domain/settings";
import type { GymLogDB, MetaRecord } from "./db";

/**
 * Dexie-backed settings persistence (spec §§22–23; M06-T02). Settings are
 * ordinary records in the EXISTING meta table — the same local
 * metadata/settings path backup/restore already exports verbatim (spec
 * §18.1) — so no new table and no schema migration is involved.
 */

/**
 * Reads effective settings from stored metadata. Any read failure resolves
 * to the defaults rather than failing startup: preferences must never block
 * sessions from loading (spec §27.9 discipline).
 */
export async function readAppSettings(
  db: GymLogDB,
): Promise<AppSettings> {
  try {
    const records = await db.meta.bulkGet([
      THEME_META_KEY,
      IMAGE_STYLE_META_KEY,
    ]);
    return readSettingsFromMeta(
      records.filter((record): record is MetaRecord => record !== undefined),
    );
  } catch (error) {
    console.error("Gym Logger: could not read settings", error);
    return { ...DEFAULT_SETTINGS };
  }
}

/** Persists one setting as a plain meta record with a fresh timestamp. */
async function putSettingValue(
  db: GymLogDB,
  key: string,
  value: string,
  now: () => Date,
): Promise<void> {
  await db.meta.put({ key, value, at: now().toISOString() });
}

export function saveThemeSetting(
  db: GymLogDB,
  theme: AppSettings["theme"],
  now: () => Date = () => new Date(),
): Promise<void> {
  return putSettingValue(db, THEME_META_KEY, theme, now);
}

export function saveDefaultImageStyleSetting(
  db: GymLogDB,
  style: AppSettings["defaultImageStyle"],
  now: () => Date = () => new Date(),
): Promise<void> {
  return putSettingValue(db, IMAGE_STYLE_META_KEY, style, now);
}
