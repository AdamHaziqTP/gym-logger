import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

/**
 * M06-T01 runtime contract for public/sw.js, exercised in a fully faked
 * worker scope (no browser, no network, deterministic).
 *
 * The source is stamped here exactly the way vite.config.ts stamps dist/sw.js
 * during a production build, so these tests exercise the shipped shape of the
 * worker: a concrete cache revision plus an absolute-URL precache list.
 */

const ORIGIN = "https://gym.test";
const CACHE_NAME = "gym-logger-test-v1";
const SHELL_BODY = "<html>gym-log-shell</html>";

const tick = () => new Promise((resolve_) => setTimeout(resolve_, 0));

class FakeResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: string;
  constructor(
    readonly body: string,
    init: { status?: number; statusText?: string; type?: string } = {},
  ) {
    this.status = init.status ?? 200;
    this.statusText = init.statusText ?? "";
    this.type = init.type ?? "basic";
    this.ok = this.status >= 200 && this.status < 300;
  }
  clone(): FakeResponse {
    return new FakeResponse(this.body, {
      status: this.status,
      statusText: this.statusText,
      type: this.type,
    });
  }
}

/** Cache keys resolve like real Cache API: relative URLs join the origin. */
function toKey(urlOrRequest: string | { url: string }): string {
  return typeof urlOrRequest === "string"
    ? new URL(urlOrRequest, ORIGIN).href
    : urlOrRequest.url;
}

class FakeCache {
  private store = new Map<string, FakeResponse>();
  constructor(private fetchFn: (url: string) => Promise<FakeResponse>) {}
  async match(
    request: string | { url: string },
    options?: { ignoreSearch?: boolean },
  ): Promise<FakeResponse | undefined> {
    const target = toKey(request);
    const direct = this.store.get(target);
    if (direct) return direct;
    if (!options?.ignoreSearch) return undefined;
    const strip = (value: string) => value.split("?")[0];
    for (const [key, value] of this.store) {
      if (strip(key) === strip(target)) return value;
    }
    return undefined;
  }
  async put(urlOrRequest: string | { url: string }, response: FakeResponse) {
    this.store.set(toKey(urlOrRequest), response.clone());
  }
  async add(url: string) {
    const response = await this.fetchFn(url);
    if (!response || !response.ok) throw new Error(`add failed: ${url}`);
    await this.put(url, response);
  }
}

class FakeCacheStorage {
  readonly stores = new Map<string, FakeCache>();
  constructor(private fetchFn: (url: string) => Promise<FakeResponse>) {}
  async open(name: string): Promise<FakeCache> {
    let cache = this.stores.get(name);
    if (!cache) {
      cache = new FakeCache(this.fetchFn);
      this.stores.set(name, cache);
    }
    return cache;
  }
  async keys(): Promise<string[]> {
    return [...this.stores.keys()];
  }
  async delete(name: string): Promise<boolean> {
    return this.stores.delete(name);
  }
  async match(
    request: string | { url: string },
    options?: { ignoreSearch?: boolean },
  ): Promise<FakeResponse | undefined> {
    for (const cache of this.stores.values()) {
      const hit = await cache.match(request, options);
      if (hit) return hit;
    }
    return undefined;
  }
}

interface FetchRequestLike {
  method: string;
  mode: string;
  url: string;
  headers: { get: (name: string) => string | null };
}

function request(
  url: string,
  options: { method?: string; mode?: string; range?: boolean } = {},
): FetchRequestLike {
  return {
    method: options.method ?? "GET",
    mode: options.mode ?? "same-origin",
    url,
    headers: {
      get: (name: string) => (name === "range" && options.range ? "bytes=0-" : null),
    },
  };
}

/**
 * Builds the worker scope. `bodies` maps absolute URL → served body; anything
 * missing behaves as an unreachable network.
 */
function makeWorld(bodies: Record<string, string>, online = true) {
  const state = { online };
  const fetchFn = vi.fn(async (input: string | { url: string }) => {
    const href = toKey(input);
    if (!state.online || !(href in bodies)) {
      throw new Error(`network unreachable: ${href}`);
    }
    return new FakeResponse(bodies[href]);
  });
  const cacheStorage = new FakeCacheStorage(fetchFn);
  const listeners: Record<string, Array<(event: never) => void>> = {
    install: [],
    activate: [],
    fetch: [],
  };
  const selfObj = {
    location: { origin: ORIGIN },
    skipWaiting: vi.fn(async () => undefined),
    clients: { claim: vi.fn(async () => undefined) },
    addEventListener(type: string, handler: (event: never) => void) {
      listeners[type].push(handler);
    },
  };

  // Stamp public/sw.js exactly like the production build does.
  const source = readFileSync(resolve(process.cwd(), "public", "sw.js"), "utf8");
  const precache = ["/", "/index.html", "/manifest.webmanifest"];
  const stampedBlock = [
    "/* === gym-logger-sw-stamp === */",
    `var GYM_LOGGER_CACHE_REVISION = "test-v1";`,
    `var GYM_LOGGER_SHELL_URL = "/";`,
    `var GYM_LOGGER_PRECACHE_ASSETS = ${JSON.stringify(precache)};`,
    "/* === end gym-logger-sw-stamp === */",
  ].join("\n");
  const stamped = source.replace(
    /\/\* === gym-logger-sw-stamp === \*\/[\s\S]*?\/\* === end gym-logger-sw-stamp === \*\//,
    () => stampedBlock,
  );
  expect(stamped).not.toEqual(source);

  new Function(
    "self",
    "caches",
    "fetch",
    "Response",
    "URL",
    stamped,
  )(selfObj, cacheStorage, fetchFn, FakeResponse, URL);

  return {
    cacheStorage,
    fetchFn,
    listeners,
    selfObj,
    setOnline(next: boolean) {
      state.online = next;
    },
  };
}

async function runInstall(world: ReturnType<typeof makeWorld>) {
  let installed: Promise<void> | undefined;
  for (const handler of world.listeners.install) {
    handler({ waitUntil: (promise: Promise<void>) => (installed = promise) } as never);
  }
  expect(installed).toBeDefined();
  await installed;
  return installed;
}

async function runActivate(world: ReturnType<typeof makeWorld>) {
  let activated: Promise<void> | undefined;
  for (const handler of world.listeners.activate) {
    handler({ waitUntil: (promise: Promise<void>) => (activated = promise) } as never);
  }
  expect(activated).toBeDefined();
  await activated;
}

/** Returns undefined when the worker bypassed the request (no respondWith). */
async function runFetch(
  world: ReturnType<typeof makeWorld>,
  fetchRequest: FetchRequestLike,
): Promise<FakeResponse | undefined> {
  let responded: Promise<FakeResponse> | undefined;
  for (const handler of world.listeners.fetch) {
    handler({
      request: fetchRequest,
      respondWith: (promise: Promise<FakeResponse>) => (responded = promise),
    } as never);
  }
  if (!responded) return undefined;
  const response = await responded;
  await tick(); // Let background cache fills settle before assertions.
  return response;
}

describe("service worker runtime behavior (M06-T01)", () => {
  it("precaches every stamped asset into the versioned cache and skips waiting", async () => {
    const world = makeWorld({
      [`${ORIGIN}/`]: SHELL_BODY,
      [`${ORIGIN}/index.html`]: SHELL_BODY,
      [`${ORIGIN}/manifest.webmanifest`]: "{}",
    });

    await runInstall(world);

    expect(world.selfObj.skipWaiting).toHaveBeenCalledTimes(1);
    expect(world.cacheStorage.stores.has(CACHE_NAME)).toBe(true);
    const cache = world.cacheStorage.stores.get(CACHE_NAME)!;
    expect(await cache.match(`${ORIGIN}/`)).toBeTruthy();
    expect(await cache.match(`${ORIGIN}/index.html`)).toBeTruthy();
    expect((await cache.match(`${ORIGIN}/manifest.webmanifest`))!.body).toBe("{}");
    // One network attempt per precache entry, nothing else.
    expect(world.fetchFn).toHaveBeenCalledTimes(3);
  });

  it("tolerates a failed precache entry instead of blocking installation", async () => {
    const world = makeWorld({
      [`${ORIGIN}/`]: SHELL_BODY,
      [`${ORIGIN}/index.html`]: SHELL_BODY,
      // manifest.webmanifest intentionally unreachable
    });

    await runInstall(world);

    expect(world.selfObj.skipWaiting).toHaveBeenCalledTimes(1);
    const cache = world.cacheStorage.stores.get(CACHE_NAME)!;
    expect(await cache.match(`${ORIGIN}/`)).toBeTruthy();
  });

  it("activation deletes stale versioned caches, keeps foreign ones, and claims clients", async () => {
    const world = makeWorld({ [`${ORIGIN}/`]: SHELL_BODY });
    await runInstall(world);
    world.cacheStorage.stores.set("gym-logger-old", new FakeCache(world.fetchFn));
    world.cacheStorage.stores.set("other-tool-cache", new FakeCache(world.fetchFn));

    await runActivate(world);

    expect([...world.cacheStorage.stores.keys()].sort()).toEqual([
      CACHE_NAME,
      "other-tool-cache",
    ]);
    expect(world.selfObj.clients.claim).toHaveBeenCalledTimes(1);
  });

  it("navigation when online serves the network and refreshes the cached shell", async () => {
    const world = makeWorld({ [`${ORIGIN}/`]: SHELL_BODY });
    await runInstall(world);
    const cache = world.cacheStorage.stores.get(CACHE_NAME)!;
    await cache.put(`${ORIGIN}/`, new FakeResponse("stale-shell"));

    const response = await runFetch(
      world,
      request(`${ORIGIN}/`, { mode: "navigate" }),
    );

    expect(response!.body).toBe(SHELL_BODY);
    expect((await cache.match(`${ORIGIN}/`))!.body).toBe(SHELL_BODY);
  });

  it("navigation when offline falls back to the cached shell", async () => {
    // Install happens while online (the "first successful load"), then the
    // network goes away and only the cache may answer.
    const world = makeWorld({ [`${ORIGIN}/`]: SHELL_BODY });
    await runInstall(world);
    world.setOnline(false);

    const response = await runFetch(
      world,
      request(`${ORIGIN}/`, { mode: "navigate" }),
    );

    expect(response!.body).toBe(SHELL_BODY);
    expect(response!.status).toBe(200);
  });

  it("navigation when offline without a cached shell answers 503 instead of crashing", async () => {
    const world = makeWorld({}, false);

    const response = await runFetch(
      world,
      request(`${ORIGIN}/some/deep/link`, { mode: "navigate" }),
    );

    expect(response!.status).toBe(503);
  });

  it("serves same-origin assets cache-first and fills the cache on misses", async () => {
    const assetUrl = `${ORIGIN}/assets/index-abcd1234.js`;
    const world = makeWorld({ [assetUrl]: "console.log(1)" });
    await runInstall(world);
    world.fetchFn.mockClear(); // Ignore install-time precache traffic.

    // Miss → network, then cached.
    const first = await runFetch(world, request(assetUrl));
    expect(first!.body).toBe("console.log(1)");
    expect(world.fetchFn).toHaveBeenCalledTimes(1);
    expect((await world.cacheStorage.match(assetUrl))!.body).toBe(
      "console.log(1)",
    );

    // Hit → served from cache with no network at all.
    const second = await runFetch(world, request(assetUrl));
    expect(second!.body).toBe("console.log(1)");
    expect(world.fetchFn).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["non-GET requests", request(`${ORIGIN}/api`, { method: "POST" })],
    ["cross-origin requests", request("https://cdn.example/lib.js")],
    ["range requests", request(`${ORIGIN}/video`, { range: true })],
    ["the service worker itself", request(`${ORIGIN}/sw.js`)],
    [
      "experimental feasibility pages",
      request(`${ORIGIN}/feasibility/native-copy.html`, { mode: "navigate" }),
    ],
  ])("bypasses %s entirely", async (_label, bypassRequest) => {
    const world = makeWorld({});
    const response = await runFetch(world, bypassRequest);
    expect(response).toBeUndefined();
    expect(world.fetchFn).not.toHaveBeenCalled();
  });
});
