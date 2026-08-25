/**
 * Minimal app settings (spec §§22–23; task M06-T02-SETTINGS-THEME-STYLE).
 *
 * Exactly the two preferences v1 specifies and nothing else:
 * - `theme`: System | Dark | Light — default System (spec §22.1);
 * - `defaultImageStyle`: Compact | Faithful (spec §14.1) — Compact keeps the
 *   pre-setting initial selection, so existing behavior is unchanged until
 *   the user picks otherwise.
 *
 * Settings live in the EXISTING local metadata table as plain string records
 * (`{key, value, at}`), so backup/restore already carries them verbatim
 * (spec §18.1 "settings") without any schema change. Parsing never coerces:
 * a missing or unrecognized stored value falls back to the default instead of
 * being "repaired", mirroring the strict free-form discipline elsewhere.
 *
 * The approved dark Notes-like presentation stays the DEFAULT presentation:
 * with no explicit Light/Dark choice the DOM carries no theme attribute and
 * CSS follows the OS preference for System (dark remains the design
 * reference per spec §22.1/§14.4).
 */

export type ThemeSetting = "system" | "dark" | "light";
export type ImageStyleSetting = "compact" | "faithful";

export interface AppSettings {
  schemaVersion: number;
  theme: ThemeSetting;
  defaultImageStyle: ImageStyleSetting;
}

/** Bumped only by future settings-format changes; v1 is the initial format. */
export const SETTINGS_SCHEMA_VERSION = 1;

/**
 * Shown in Settings → About (spec §23). Kept as one constant rather than
 * importing package.json so nothing from the manifest leaks into the bundle.
 */
export const APP_VERSION = "0.1.0";

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  theme: "system",
  defaultImageStyle: "compact",
};

/** Metadata keys inside the existing meta table (one record per setting). */
export const THEME_META_KEY = "settings.theme";
export const IMAGE_STYLE_META_KEY = "settings.defaultImageStyle";

const THEME_VALUES: readonly ThemeSetting[] = ["system", "dark", "light"];
const IMAGE_STYLE_VALUES: readonly ImageStyleSetting[] = [
  "compact",
  "faithful",
];

/**
 * Accepts only an exact stored value; anything else (missing record, wrong
 * type, unknown string) falls back to the System default. No trimming,
 * casing, or coercion — an unrecognized value is not silently reinterpreted.
 */
export function parseThemeMetaValue(value: unknown): ThemeSetting {
  return THEME_VALUES.includes(value as ThemeSetting)
    ? (value as ThemeSetting)
    : DEFAULT_SETTINGS.theme;
}

/** Same exact-match policy; anything else falls back to Compact. */
export function parseImageStyleMetaValue(value: unknown): ImageStyleSetting {
  return IMAGE_STYLE_VALUES.includes(value as ImageStyleSetting)
    ? (value as ImageStyleSetting)
    : DEFAULT_SETTINGS.defaultImageStyle;
}

/** The minimal record shape this module reads from persistence. */
export interface MetaKeyValue {
  key: string;
  value: string;
}

/**
 * Pure mapping from stored metadata records to effective settings. Unknown
 * keys are ignored; known keys with invalid values fall back per parser.
 */
export function readSettingsFromMeta(records: MetaKeyValue[]): AppSettings {
  let theme: ThemeSetting | undefined;
  let defaultImageStyle: ImageStyleSetting | undefined;
  for (const record of records) {
    if (record.key === THEME_META_KEY && theme === undefined) {
      theme = parseThemeMetaValue(record.value);
    } else if (
      record.key === IMAGE_STYLE_META_KEY &&
      defaultImageStyle === undefined
    ) {
      defaultImageStyle = parseImageStyleMetaValue(record.value);
    }
  }
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    theme: theme ?? DEFAULT_SETTINGS.theme,
    defaultImageStyle: defaultImageStyle ?? DEFAULT_SETTINGS.defaultImageStyle,
  };
}

/**
 * What the DOM should carry for a theme preference: `"light"` / `"dark"` set
 * the explicit attribute; System returns `null` meaning REMOVE any attribute
 * so the stylesheet's `prefers-color-scheme` branch decides. Keeping this
 * pure makes the application rule unit-testable without a DOM.
 */
export function dataThemeForPreference(
  theme: ThemeSetting,
): "dark" | "light" | null {
  return theme === "system" ? null : theme;
}

/**
 * Applies a theme preference to a document element: sets `data-theme` for an
 * explicit Dark/Light choice and removes it for System. Idempotent, so it is
 * safe to call on every preference change and after every bootstrap. The
 * element is injectable for deterministic tests; production passes
 * `document.documentElement`. This never reloads or re-styles by force — the
 * CSS custom-property scopes in styles.css do the actual theming.
 */
export function applyThemePreference(
  theme: ThemeSetting,
  rootElement: {
    getAttribute: (name: string) => string | null;
    setAttribute: (name: string, value: string) => void;
    removeAttribute: (name: string) => void;
  } | undefined = typeof document === "undefined"
    ? undefined
    : document.documentElement,
): void {
  if (!rootElement) return;
  const value = dataThemeForPreference(theme);
  if (value === null) {
    if (rootElement.getAttribute("data-theme")) {
      rootElement.removeAttribute("data-theme");
    }
  } else {
    rootElement.setAttribute("data-theme", value);
  }
}
