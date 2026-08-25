/// <reference types="vite/client" />

/**
 * Service-worker registration for the offline shell (M06-T01; spec §17.1).
 *
 * Non-blocking by contract: registration happens only after the window load
 * event (or immediately if the page already loaded), never competes with the
 * first render or editing, and any failure is a quiet console warning — the
 * app remains fully usable without offline caching. Updates are left to the
 * browser's own navigation-time checks; this code never forces a reload, so
 * an update can never interrupt an in-progress edit.
 */

export interface ServiceWorkerEnv {
  /** Production build only — dev/HMR must never fight the runtime cache. */
  isProduction: boolean;
  /** `navigator.serviceWorker` exists (absent in jsdom and older browsers). */
  hasServiceWorkerContainer: boolean;
}

export const SERVICE_WORKER_URL = "/sw.js";

export function defaultServiceWorkerEnv(): ServiceWorkerEnv {
  return {
    isProduction: import.meta.env.PROD === true,
    hasServiceWorkerContainer:
      typeof navigator !== "undefined" && !!navigator.serviceWorker,
  };
}

/** The whole registration decision, in one testable predicate. */
export function shouldRegisterServiceWorker(
  env: ServiceWorkerEnv = defaultServiceWorkerEnv(),
): boolean {
  return env.isProduction && env.hasServiceWorkerContainer;
}

export async function registerServiceWorker(
  env: ServiceWorkerEnv = defaultServiceWorkerEnv(),
  swUrl: string = SERVICE_WORKER_URL,
): Promise<void> {
  if (!shouldRegisterServiceWorker(env)) return;

  const register = () => {
    navigator.serviceWorker.register(swUrl).catch((error: unknown) => {
      // Offline caching is an enhancement; losing it is never fatal.
      console.warn("Gym Logger: offline caching unavailable", error);
    });
  };

  if (document.readyState === "complete") {
    register();
    return;
  }
  window.addEventListener("load", register, { once: true });
}
