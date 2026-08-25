import { describe, expect, it } from "vitest";
import {
  describeStorage,
  formatBytes,
  readStorageSnapshot,
  type StorageArea,
} from "../domain/storageInfo";

describe("formatBytes", () => {
  it.each([
    [null, null],
    [-1, null],
    [Number.NaN, null],
    [0, "0 B"],
    [512, "512 B"],
    [1024, "1 KB"],
    [2048, "2 KB"],
    [1536, "2 KB"],
    [5 * 1024 * 1024, "5.0 MB"],
    [250 * 1024 * 1024, "250 MB"],
    [1.5 * 1024 * 1024 * 1024, "1.5 GB"],
  ] as Array<[number | null, string | null]>)(
    "formats %p → %p",
    (bytes, expected) => {
      expect(formatBytes(bytes)).toBe(expected);
    },
  );
});

describe("readStorageSnapshot", () => {
  it("reports exactly what a fully-featured StorageManager says", async () => {
    const area: StorageArea = {
      persisted: async () => true,
      estimate: async () => ({ usage: 12_345, quota: 1_000_000 }),
    };
    const snapshot = await readStorageSnapshot(area);
    expect(snapshot).toEqual({
      persisted: true,
      usageBytes: 12_345,
      quotaBytes: 1_000_000,
    });
  });

  it("treats an explicitly not-granted persistence state as false", async () => {
    const area: StorageArea = { persisted: async () => false };
    expect((await readStorageSnapshot(area)).persisted).toBe(false);
  });

  it("stays null for missing methods instead of guessing", async () => {
    const snapshot = await readStorageSnapshot({});
    expect(snapshot).toEqual({ persisted: null, usageBytes: null, quotaBytes: null });
  });

  it("survives rejecting Storage API calls", async () => {
    const area: StorageArea = {
      persisted: () => Promise.reject(new Error("SecurityError")),
      estimate: () => Promise.reject(new Error("unavailable")),
    };
    const snapshot = await readStorageSnapshot(area);
    expect(snapshot.persisted).toBeNull();
    expect(snapshot.usageBytes).toBeNull();
  });

  it("reports unknown when there is no Storage area at all", async () => {
    const snapshot = await readStorageSnapshot(null);
    expect(snapshot).toEqual({ persisted: null, usageBytes: null, quotaBytes: null });
  });

  it("falls back to navigator.storage when no area is injected", async () => {
    // jsdom has no StorageManager; the default probe must degrade to unknown.
    const snapshot = await readStorageSnapshot();
    expect(snapshot).toEqual({ persisted: null, usageBytes: null, quotaBytes: null });
  });
});

describe("describeStorage truthfulness (spec §17.3)", () => {
  it("claims persistence only when it was actually granted", () => {
    const granted = describeStorage({
      persisted: true,
      usageBytes: 4096,
      quotaBytes: null,
    });
    expect(granted).toContain("persistent storage granted");
    expect(granted).not.toContain("not granted");

    const denied = describeStorage({
      persisted: false,
      usageBytes: 4096,
      quotaBytes: null,
    });
    // "(persistent storage granted" cannot appear in the not-granted line
    // because "not " sits between the words inside the fact list.
    expect(denied).toContain("(persistent storage not granted");
    expect(denied).not.toContain("(persistent storage granted");

    const unknown = describeStorage({
      persisted: null,
      usageBytes: null,
      quotaBytes: null,
    });
    expect(unknown).toContain("best-effort");
    expect(unknown).not.toContain("persistent storage granted");
  });

  it("always states local-only and clearability — never permanence", () => {
    const variants = [
      { persisted: true, usageBytes: 100, quotaBytes: 1000 },
      { persisted: false, usageBytes: 0, quotaBytes: 1000 },
      { persisted: null, usageBytes: null, quotaBytes: null },
    ];
    for (const variant of variants) {
      const line = describeStorage(variant);
      expect(line).toMatch(/On-device local storage/);
      expect(line).toMatch(/may still clear it/);
      expect(line).not.toMatch(/permanent/i);
    }
  });

  it("includes measured usage when available", () => {
    const line = describeStorage({
      persisted: null,
      usageBytes: 4096,
      quotaBytes: null,
    });
    expect(line).toContain("4 KB in use");
  });
});
