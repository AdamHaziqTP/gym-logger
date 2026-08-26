import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CompactSnapshotSave,
  ImageExportPanel,
} from "../components/ImageExport";
import { seedSessionFromFixture } from "../data/fixture";

describe("ImageExportPanel final-gate corrections", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("keeps an inline vector preview when the browser has no PNG canvas", async () => {
    render(
      <ImageExportPanel
        session={seedSessionFromFixture("2026-08-24T08:00:00.000Z")}
        onClose={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("img", { name: /compact style/i })).toBeTruthy();
    });
    expect(
      (screen.getByRole("img", { name: /compact style/i }) as HTMLImageElement)
        .src,
    ).toContain("data:image/svg+xml");
    expect(screen.getByText(/no visible pixels were verified/i)).toBeTruthy();
  });

  it("exposes a reachable header close control for tall mobile previews", () => {
    const onClose = vi.fn();
    render(
      <ImageExportPanel
        session={seedSessionFromFixture("2026-08-24T08:00:00.000Z")}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close Export Image" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("exposes only the direct Compact colour snapshot action", async () => {
    render(
      <CompactSnapshotSave
        session={seedSessionFromFixture("2026-08-24T08:00:00.000Z")}
      />,
    );

    const button = screen.getByRole("button", {
      name: "Save Colour Snapshot",
    });
    expect((button as HTMLButtonElement).disabled).toBe(false);
    expect(
      button.closest("[data-export-style='compact']"),
    ).not.toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("group", { name: "Export style" })).toBeNull();
  });
});
