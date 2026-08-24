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
