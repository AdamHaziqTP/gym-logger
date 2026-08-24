import "fake-indexeddb/auto";

// jsdom may not expose structuredClone; Dexie needs it for value cloning.
if (typeof globalThis.structuredClone !== "function") {
  (globalThis as { structuredClone?: unknown }).structuredClone = function
    structuredCloneFallback<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  };
}
