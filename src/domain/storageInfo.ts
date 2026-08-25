/**
 * Truthful local-storage diagnostics (M06-T01; spec §17.3, §23).
 *
 * One quiet Home line that reports what the Storage API actually says. The
 * wording must never market browser storage as permanent — WebKit may evict
 * best-effort data under pressure, so the sentence always ends with the
 * possibility of clearing, and Apple Notes/Backup remain the real archive.
 */

export interface StorageSnapshot {
  /** null when the Storage API is unavailable or the state is unknown. */
  persisted: boolean | null;
  usageBytes: number | null;
  quotaBytes: number | null;
}

/** The slice of StorageManager this module relies on (injectable in tests). */
export interface StorageArea {
  persisted?: () => Promise<boolean>;
  estimate?: () => Promise<{ usage?: number; quota?: number }>;
}

const UNKNOWN_SNAPSHOT: StorageSnapshot = {
  persisted: null,
  usageBytes: null,
  quotaBytes: null,
};

function defaultStorageArea(): StorageArea | null {
  if (typeof navigator === "undefined") return null;
  const storage = (navigator as { storage?: StorageArea | undefined }).storage;
  return storage ?? null;
}

export async function readStorageSnapshot(
  area?: StorageArea | null,
): Promise<StorageSnapshot> {
  const storage = area === undefined ? defaultStorageArea() : area;
  if (!storage) return { ...UNKNOWN_SNAPSHOT };

  let persisted: boolean | null = null;
  let usageBytes: number | null = null;
  let quotaBytes: number | null = null;

  try {
    if (typeof storage.persisted === "function") {
      const granted = await storage.persisted();
      persisted = granted === true;
    }
  } catch {
    // Unknown stays unknown; the diagnostic must not guess.
  }

  try {
    if (typeof storage.estimate === "function") {
      const estimate = await storage.estimate();
      usageBytes =
        typeof estimate.usage === "number" && estimate.usage >= 0
          ? estimate.usage
          : null;
      quotaBytes =
        typeof estimate.quota === "number" && estimate.quota >= 0
          ? estimate.quota
          : null;
    }
  } catch {
    // Same policy: report only what was actually measured.
  }

  return { persisted, usageBytes, quotaBytes };
}

/** Human size, or null when there is nothing truthful to show. */
export function formatBytes(bytes: number | null): string | null {
  if (bytes === null || !Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  const mb = kb / 1024;
  if (mb < 1024) {
    return mb >= 100 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
  }
  return `${(mb / 1024).toFixed(1)} GB`;
}

/**
 * The one-line Home diagnostic. Every branch states local-only + clearability;
 * persistence is claimed only when the API explicitly granted it.
 */
export function describeStorage(snapshot: StorageSnapshot): string {
  const facts: string[] = [];
  if (snapshot.persisted === true) facts.push("persistent storage granted");
  if (snapshot.persisted === false) facts.push("persistent storage not granted");
  const usage = formatBytes(snapshot.usageBytes);
  if (usage) facts.push(`${usage} in use`);

  const detail = facts.length > 0 ? facts.join(", ") : "best-effort";
  return `On-device local storage (${detail}); your browser may still clear it.`;
}
