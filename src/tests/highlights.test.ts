import { describe, expect, it } from "vitest";
import {
  CATEGORY_LEGEND,
  HIGHLIGHT_TOKENS,
  OPAQUE_HIGHLIGHT_BG,
  PRESENTATION_BACKDROP,
  compositeOverBackdrop,
  parseColorToken,
} from "../domain/highlights";

/* ---------------------------------------------------------------------- */
/* Highlight color source of truth (spec §5.1/§5.2) plus the FIX-03       */
/* opaque Apple-Notes-compatible equivalents. The opaque values must be   */
/* DERIVED from the locked translucent tokens over the payload's dark     */
/* presentation backdrop — never hand-copied — so these tests pin both    */
/* the locked inputs and the documented derived outputs.                  */
/* ---------------------------------------------------------------------- */

const EXPECTED_OPAQUE_BG: Record<string, string> = {
  orange: "#261802",
  purple: "#1f0e27",
  mint: "#0f201f",
  blue: "#021529",
  pink: "#26080e",
};

describe("locked highlight tokens", () => {
  it("keeps the exact five category foreground colors", () => {
    expect(HIGHLIGHT_TOKENS.orange.fg).toBe("#ff9f0a");
    expect(HIGHLIGHT_TOKENS.purple.fg).toBe("#bf5af2");
    expect(HIGHLIGHT_TOKENS.mint.fg).toBe("#66d4cf");
    expect(HIGHLIGHT_TOKENS.blue.fg).toBe("#0a84ff");
    expect(HIGHLIGHT_TOKENS.pink.fg).toBe("#ff375f");
  });

  it("keeps the translucent locked backgrounds untouched by the Notes-paste derivation", () => {
    // The UI keeps using the original translucent tokens; the derivation
    // must read them, never rewrite them.
    expect(HIGHLIGHT_TOKENS.none).toEqual({ fg: "#f2f2f7", bg: "transparent" });
    expect(HIGHLIGHT_TOKENS.orange.bg).toBe("rgba(255, 159, 10, 0.15)");
    expect(HIGHLIGHT_TOKENS.purple.bg).toBe("rgba(191, 90, 242, 0.16)");
    expect(HIGHLIGHT_TOKENS.mint.bg).toBe("rgba(102, 212, 207, 0.15)");
    expect(HIGHLIGHT_TOKENS.blue.bg).toBe("rgba(10, 132, 255, 0.16)");
    expect(HIGHLIGHT_TOKENS.pink.bg).toBe("rgba(255, 55, 95, 0.15)");
  });

  it("keeps the visible legend exactly Arms Back Chest Delts Legs", () => {
    expect(CATEGORY_LEGEND.map(({ label }) => label)).toEqual([
      "Arms",
      "Back",
      "Chest",
      "Delts",
      "Legs",
    ]);
  });
});

describe("opaque Apple-Notes highlight equivalents (FIX-03)", () => {
  it("covers exactly the five visible categories and never 'none'", () => {
    expect(Object.keys(OPAQUE_HIGHLIGHT_BG).sort()).toEqual([
      "blue",
      "mint",
      "orange",
      "pink",
      "purple",
    ]);
  });

  it("is derived, not hand-copied: each value equals its locked token composited over the presentation backdrop", () => {
    for (const { value } of CATEGORY_LEGEND) {
      expect(OPAQUE_HIGHLIGHT_BG[value]).toBe(
        compositeOverBackdrop(
          HIGHLIGHT_TOKENS[value].bg,
          PRESENTATION_BACKDROP,
        ),
      );
    }
  });

  it("pins the documented derived values so drift is caught", () => {
    for (const [category, expected] of Object.entries(EXPECTED_OPAQUE_BG)) {
      expect(OPAQUE_HIGHLIGHT_BG[category as keyof typeof OPAQUE_HIGHLIGHT_BG]).toBe(
        expected,
      );
    }
  });

  it("always yields a distinct opaque hex that is not the foreground color", () => {
    for (const { value } of CATEGORY_LEGEND) {
      const bgOpaque = OPAQUE_HIGHLIGHT_BG[value];
      expect(bgOpaque).toMatch(/^#[0-9a-f]{6}$/);
      expect(bgOpaque.includes("rgba(")).toBe(false);
      expect(bgOpaque).not.toBe(HIGHLIGHT_TOKENS[value].fg);
    }
  });
});

describe("color token parsing and compositing helpers", () => {
  it("parses #rrggbb tokens as fully opaque (case-insensitive)", () => {
    expect(parseColorToken("#000000")).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    expect(parseColorToken("#FF9F0A")).toEqual({
      r: 255,
      g: 159,
      b: 10,
      a: 1,
    });
  });

  it("parses rgba(...) tokens into channels plus alpha", () => {
    expect(parseColorToken("rgba(255, 159, 10, 0.15)")).toEqual({
      r: 255,
      g: 159,
      b: 10,
      a: 0.15,
    });
  });

  it("rejects unparseable or out-of-range input instead of guessing", () => {
    expect(parseColorToken("transparent")).toBeNull();
    expect(parseColorToken("#fff")).toBeNull();
    expect(parseColorToken("blue")).toBeNull();
    expect(parseColorToken("rgba(300, 0, 0, 0.5)")).toBeNull();
    expect(parseColorToken("rgba(1, 2, 3, 1.5)")).toBeNull();
  });

  it("composites over an opaque backdrop and passes opaque colors through unchanged", () => {
    expect(compositeOverBackdrop("rgba(255, 159, 10, 0.15)", "#000000")).toBe(
      "#261802",
    );
    expect(compositeOverBackdrop("#123456", "#ffffff")).toBe("#123456");
  });

  it("refuses to composite without a parseable color and opaque backdrop", () => {
    expect(compositeOverBackdrop("rgba(255, 159, 10, 0.15)", "transparent")).toBe(
      null,
    );
    expect(compositeOverBackdrop("nonsense", "#000000")).toBe(null);
  });
});
