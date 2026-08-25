import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaultServiceWorkerEnv,
  registerServiceWorker,
  shouldRegisterServiceWorker,
  type ServiceWorkerEnv,
} from "../pwa/serviceWorkerRegistration";

function envWith(partial: Partial<ServiceWorkerEnv>): ServiceWorkerEnv {
  return { isProduction: true, hasServiceWorkerContainer: true, ...partial };
}

describe("shouldRegisterServiceWorker", () => {
  it("registers only for production builds with a service-worker container", () => {
    expect(shouldRegisterServiceWorker(envWith({}))).toBe(true);
    expect(
      shouldRegisterServiceWorker(envWith({ isProduction: false })),
    ).toBe(false);
    expect(
      shouldRegisterServiceWorker(envWith({ hasServiceWorkerContainer: false })),
    ).toBe(false);
  });
});

describe("registerServiceWorker", () => {
  const nav = navigator as Navigator & {
    serviceWorker?: { register: (url: string) => Promise<unknown> };
  };
  let originalDescriptor: PropertyDescriptor | undefined;

  function installFakeContainer(register: (url: string) => Promise<unknown>) {
    originalDescriptor = Object.getOwnPropertyDescriptor(nav, "serviceWorker");
    Object.defineProperty(nav, "serviceWorker", {
      configurable: true,
      value: { register },
    });
  }

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(nav, "serviceWorker", originalDescriptor);
      originalDescriptor = undefined;
    } else {
      Reflect.deleteProperty(nav, "serviceWorker");
    }
    vi.restoreAllMocks();
  });

  it("no-ops outside production or without container support", async () => {
    const register = vi.fn();
    await registerServiceWorker(envWith({ isProduction: false }));
    await registerServiceWorker(envWith({ hasServiceWorkerContainer: false }));
    expect(register).not.toHaveBeenCalled();
  });

  it("registers /sw.js immediately once the page already loaded", async () => {
    installFakeContainer(vi.fn().mockResolvedValue(undefined));
    const readyState = vi.spyOn(document, "readyState", "get");

    readyState.mockReturnValue("complete");
    await registerServiceWorker(envWith({}));

    expect(nav.serviceWorker!.register).toHaveBeenCalledTimes(1);
    expect(nav.serviceWorker!.register).toHaveBeenCalledWith("/sw.js");
  });

  it("defers registration to the window load event while loading", async () => {
    installFakeContainer(vi.fn().mockResolvedValue(undefined));
    const readyState = vi.spyOn(document, "readyState", "get");
    readyState.mockReturnValue("loading");

    const addEventListener = vi.spyOn(window, "addEventListener");
    await registerServiceWorker(envWith({}));
    expect(nav.serviceWorker!.register).not.toHaveBeenCalled();

    const loadCall = addEventListener.mock.calls.find(([type]) => type === "load");
    expect(loadCall).toBeDefined();
    const [, handler, options] = loadCall!;
    expect((options as AddEventListenerOptions | undefined)?.once).toBe(true);

    (handler as EventListener)(new Event("load"));
    expect(nav.serviceWorker!.register).toHaveBeenCalledTimes(1);
    expect(nav.serviceWorker!.register).toHaveBeenCalledWith("/sw.js");
  });

  it("degrades to a console warning when registration fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    installFakeContainer(
      vi.fn().mockRejectedValue(new Error("insecure context")),
    );

    await expect(registerServiceWorker(envWith({}))).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  it("keeps the jsdom default env unregistered (no service worker there)", () => {
    const defaults = defaultServiceWorkerEnv();
    expect(defaults.isProduction).toBe(false);
    expect(defaults.hasServiceWorkerContainer).toBe(false);
    expect(shouldRegisterServiceWorker(defaults)).toBe(false);
  });
});
