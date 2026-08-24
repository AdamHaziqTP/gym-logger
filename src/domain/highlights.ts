import type { Highlight } from "./types";

export interface HighlightToken {
  /** Bright category-colored foreground text (spec §5.2). */
  fg: string;
  /** Subtle translucent category highlight behind text (spec §5.2). */
  bg: string;
}

/**
 * Apple system colors (dark mode) as the highlight tokens. Colors live here so
 * cells, swatches, and tests share one source of truth.
 */
export const HIGHLIGHT_TOKENS: Record<Highlight, HighlightToken> = {
  none: { fg: "#f2f2f7", bg: "transparent" },
  orange: { fg: "#ff9f0a", bg: "rgba(255, 159, 10, 0.15)" },
  purple: { fg: "#bf5af2", bg: "rgba(191, 90, 242, 0.16)" },
  mint: { fg: "#66d4cf", bg: "rgba(102, 212, 207, 0.15)" },
  blue: { fg: "#0a84ff", bg: "rgba(10, 132, 255, 0.16)" },
  pink: { fg: "#ff375f", bg: "rgba(255, 55, 95, 0.15)" },
};

/**
 * Row-level color choices with their category labels (spec §5.1; DECISIONS.md
 * locks the simpler `Arms` label instead of `Bicep Tricep`).
 */
export const HIGHLIGHT_OPTIONS: ReadonlyArray<{
  value: Highlight;
  label: string;
}> = [
  { value: "none", label: "None" },
  { value: "orange", label: "Arms" },
  { value: "purple", label: "Back" },
  { value: "mint", label: "Chest" },
  { value: "blue", label: "Delts" },
  { value: "pink", label: "Legs" },
];

/**
 * Approved visible session-header legend in the finalized content order
 * date → category legend → summary (spec §14.2; final legend decision,
 * 2026-08-24): exactly the five Apple highlight navigation categories
 * Arms, Back, Chest, Delts, Legs — no sixth entry.
 *
 * `none` stays an INTERNAL unhighlighted/white state for abs and other
 * uncategorized rows (it remains available through HIGHLIGHT_OPTIONS in the
 * row colour control); it must not appear in this legend.
 */
export const CATEGORY_LEGEND: ReadonlyArray<{
  value: Exclude<Highlight, "none">;
  label: string;
}> = [
  { value: "orange", label: "Arms" },
  { value: "purple", label: "Back" },
  { value: "mint", label: "Chest" },
  { value: "blue", label: "Delts" },
  { value: "pink", label: "Legs" },
];

/** The five visible workout categories (`HIGHLIGHT_TOKENS` minus `none`). */
export type CategoryHighlight = Exclude<Highlight, "none">;

/* -------------------- opaque Notes-paste equivalents --------------------- */

/**
 * Presentation backdrop the Copy-to-Notes HTML payload assumes: pure black,
 * matching the payload's dark wrapper (spec §22.1 / §15.3). The opaque
 * equivalents below are the locked translucent tokens composited over THIS
 * color — change it and every derived value changes with it.
 */
export const PRESENTATION_BACKDROP = "#000000";

interface RgbaChannels {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Parses the two color forms the locked tokens use — `#rrggbb` and
 * `rgba(r, g, b, a)` — into 8-bit sRGB channels plus alpha. Returns `null`
 * for anything else (`transparent`, named colors, malformed input), so callers
 * can never mistake unparsed text for a color.
 */
export function parseColorToken(token: string): RgbaChannels | null {
  const hex = /^#([0-9a-f]{6})$/i.exec(token);
  if (hex) {
    const int = parseInt(hex[1], 16);
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255,
      a: 1,
    };
  }
  const rgba =
    /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d+(?:\.\d+)?)\s*\)$/i.exec(
      token,
    );
  if (rgba) {
    const [r, g, b, a] = rgba.slice(1).map(Number);
    if (r > 255 || g > 255 || b > 255 || a > 1) return null;
    return { r, g, b, a };
  }
  return null;
}

/**
 * Standard source-over composite of one color token over an opaque backdrop,
 * returned as opaque `#rrggbb`. Returns `null` when either input is not an
 * parseable color or the backdrop itself is translucent.
 */
export function compositeOverBackdrop(
  token: string,
  backdropHex: string,
): string | null {
  const source = parseColorToken(token);
  const backdrop = parseColorToken(backdropHex);
  if (!source || !backdrop || backdrop.a !== 1) return null;
  const blend = (over: number, under: number) =>
    Math.round(over * source.a + under * (1 - source.a));
  const channel = (value: number) => value.toString(16).padStart(2, "0");
  return `#${channel(blend(source.r, backdrop.r))}${channel(
    blend(source.g, backdrop.g),
  )}${channel(blend(source.b, backdrop.b))}`;
}

function opaqueEquivalentOrThrow(category: CategoryHighlight): string {
  const hex = compositeOverBackdrop(
    HIGHLIGHT_TOKENS[category].bg,
    PRESENTATION_BACKDROP,
  );
  if (hex === null) {
    // Only reachable if someone edits a locked token into a form this module
    // cannot parse; fail loudly at load rather than pasting a wrong color.
    throw new Error(
      `Cannot derive opaque equivalent for category "${category}" from token "${HIGHLIGHT_TOKENS[category].bg}"`,
    );
  }
  return hex;
}

/**
 * Opaque, Apple-Notes-compatible stand-ins for the translucent category
 * backgrounds (M03-T01-FIX-03): each entry is exactly its category's locked
 * translucent `bg` token composited over `PRESENTATION_BACKDROP`, derived by
 * the function above so `HIGHLIGHT_TOKENS` stays the single source of truth —
 * there are no hand-copied colors here to drift.
 *
 * Why this exists: legacy/native paste importers (Apple Notes' HTML-to-
 * attributed-string conversion among them) cannot express translucency and
 * two iPhone retests showed `rgba(...)` backgrounds being stripped outright.
 * The Notes export therefore carries these solid equivalents for any markup
 * layer that must state a real, opaque highlight color. The in-app UI keeps
 * using the translucent `HIGHLIGHT_TOKENS` unchanged.
 */
export const OPAQUE_HIGHLIGHT_BG: Readonly<
  Record<CategoryHighlight, string>
> = Object.freeze(
  Object.fromEntries(
    CATEGORY_LEGEND.map(({ value }) => [value, opaqueEquivalentOrThrow(value)]),
  ) as Record<CategoryHighlight, string>,
);
