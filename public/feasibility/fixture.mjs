/**
 * ============================================================================
 * EXPERIMENTAL FEASIBILITY HARNESS — NOT PRODUCT CODE
 * Task: M03-T01-E003-FEAS-01 (bounded Apple Notes color interoperability spike)
 * ============================================================================
 *
 * This module and everything else in `public/feasibility/` is an isolated,
 * static, zero-dependency test asset. It does NOT participate in the Gym
 * Logger app bundle and it does NOT alter the accepted production
 * `Copy to Notes` behavior in any way.
 *
 * The fixture below is the single representative session used by every route
 * probe on the harness page. It deliberately covers:
 *
 * - all five visible categories (Arms/orange, Back/purple, Chest/mint,
 *   Delts/blue, Legs/pink) plus exactly one `none` row (and a second `none`
 *   row that doubles as an escaping torture cell);
 * - weird free-form values per spec §§6.2/27.6: degree sign, em dash,
 *   ampersand, literal angle brackets, double quotes, a backslash and braces,
 *   non-numeric sets/reps/weights (`8,6`, `body weight`), empty Skip vs a
 *   Skip value;
 * - table order via explicit positions;
 * - multi-line bottom notes;
 * - a manual summary override that cannot be derived from the rows.
 *
 * The color constants are the locked tokens from
 * `src/domain/highlights.ts` (HIGHLIGHT_TOKENS fg/bg) restated for this
 * dependency-free context; the opaque highlight values are DERIVED here with
 * the same source-over composite over `#000000`, not hand-copied.
 * `src/tests/feasibilityHarness.test.mjs` pins every value to the production
 * modules so drift fails CI.
 */

/** Legend labels in the approved content order (spec §14.2). */
export const CATEGORY_ORDER = ["orange", "purple", "mint", "blue", "pink"];

export const CATEGORY_LABELS = Object.freeze({
  orange: "Arms",
  purple: "Back",
  mint: "Chest",
  blue: "Delts",
  pink: "Legs",
});

/**
 * Locked category foreground tokens — must equal HIGHLIGHT_TOKENS[c].fg
 * (pinned by tests).
 */
export const CATEGORY_FG = Object.freeze({
  orange: "#ff9f0a",
  purple: "#bf5af2",
  mint: "#66d4cf",
  blue: "#0a84ff",
  pink: "#ff375f",
});

/**
 * Locked translucent category background tokens — must equal
 * HIGHLIGHT_TOKENS[c].bg (pinned by tests).
 */
export const CATEGORY_BG_TRANSLUCENT = Object.freeze({
  orange: "rgba(255, 159, 10, 0.15)",
  purple: "rgba(191, 90, 242, 0.16)",
  mint: "rgba(102, 212, 207, 0.15)",
  blue: "rgba(10, 132, 255, 0.16)",
  pink: "rgba(255, 55, 95, 0.15)",
});

/**
 * Presentation backdrop of the Notes payload (spec §22.1 / FIX-03): pure
 * black. Opaque equivalents below are composited over THIS color.
 */
export const PRESENTATION_BACKDROP = "#000000";

function parseHex(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  const int = Number.parseInt(hex.slice(1), 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function parseRgba(token) {
  const match = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d+(?:\.\d+)?)\s*\)$/.exec(
    token,
  );
  if (!match) return null;
  const [r, g, b, a] = match.slice(1).map(Number);
  if (r > 255 || g > 255 || b > 255 || a > 1) return null;
  return { r, g, b, a };
}

/**
 * Standard source-over composite over an opaque backdrop, as opaque #rrggbb.
 * Mirrors `compositeOverBackdrop` in src/domain/highlights.ts (pinned).
 */
export function compositeOverBackdrop(token, backdropHex) {
  const source =
    token.startsWith("#") ? parseHex(token) : parseRgba(token);
  const backdrop = parseHex(backdropHex);
  if (!source || !backdrop) return null;
  const blend = (over, under) =>
    Math.round(over * source.a + under * (1 - source.a));
  const channel = (value) => value.toString(16).padStart(2, "0");
  return `#${channel(blend(source.r, backdrop.r))}${channel(
    blend(source.g, backdrop.g),
  )}${channel(blend(source.b, backdrop.b))}`;
}

function deriveOpaqueOrThrow(category) {
  const hex = compositeOverBackdrop(
    CATEGORY_BG_TRANSLUCENT[category],
    PRESENTATION_BACKDROP,
  );
  if (hex === null) {
    throw new Error(
      `Cannot derive opaque highlight for category "${category}" from "${CATEGORY_BG_TRANSLUCENT[category]}"`,
    );
  }
  return hex;
}

/**
 * Opaque Apple-Notes-compatible stand-ins — must equal OPAQUE_HIGHLIGHT_BG
 * in src/domain/highlights.ts (pinned by tests): Arms #261802,
 * Back #1f0e27, Chest #0f201f, Delts #021529, Legs #26080e.
 */
export const OPAQUE_HIGHLIGHT = Object.freeze(
  Object.fromEntries(CATEGORY_ORDER.map((c) => [c, deriveOpaqueOrThrow(c)])),
);

/* ------------------------------ the fixture ------------------------------ */

/**
 * Representative session. Shape mirrors the production WorkoutSession domain
 * record minus persistence timestamps so every generator below can consume it
 * directly and tests can lift it into a full WorkoutSession for parity checks.
 */
export const FIXTURE_SESSION = Object.freeze({
  id: "feasibility-e003-fixture",
  dateLocal: "2026-08-23", // → display "Sunday 23 Aug"
  summaryOverride: { sets: "~41", exercises: "7+" },
  notes:
    "cardio 15min bike\nright shoulder felt good — reduce DB press\nnext: add chain weight (8.75kg + 1kg)",
  rows: Object.freeze([
    freezeRow({
      id: "f01",
      position: 0,
      exercise: "Recline curl bench 30° IR uni",
      sets: "4",
      reps: "8,6",
      weight: "16.25 kg",
      skip: "",
      highlight: "orange", // Arms
    }),
    freezeRow({
      id: "f02",
      position: 1,
      exercise: "Kelso shrug — chest supported (wide grip)",
      sets: "3",
      reps: "8",
      weight: "160kg",
      skip: "",
      highlight: "purple", // Back
    }),
    freezeRow({
      id: "f03",
      position: 2,
      exercise: "Chest Press Neutral 5",
      sets: "1",
      reps: "7",
      weight: "55kg",
      skip: "shoulder",
      highlight: "mint", // Chest
    }),
    freezeRow({
      id: "f04",
      position: 3,
      exercise: "Curl & Press <strict>",
      sets: "1",
      reps: "6",
      weight: "body weight",
      skip: "",
      highlight: "blue", // Delts
    }),
    freezeRow({
      id: "f05",
      position: 4,
      exercise: "Hip Thrust",
      sets: "1",
      reps: "7",
      weight: "77.5kg",
      skip: "",
      highlight: "pink", // Legs
    }),
    freezeRow({
      id: "f06",
      position: 5,
      exercise: 'Ab Cable Crunch "inc."',
      sets: "1",
      reps: "9",
      weight: "52.5kg",
      skip: "",
      highlight: "none",
    }),
    freezeRow({
      id: "f07",
      position: 6,
      exercise: 'Reverse curl \\ "strict" {tempo 3-1-3}',
      sets: "1",
      reps: "6",
      weight: "6.25kg",
      skip: "",
      highlight: "none",
    }),
  ]),
});

function freezeRow(row) {
  return Object.freeze(row);
}
