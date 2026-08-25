/*
 * Gym Logger service worker (M06-T01). Dependency-free; plain script on
 * purpose so it also runs before any bundler involvement.
 *
 * Build stamping: after a production build, the `gymLoggerServiceWorkerStamp`
 * plugin in vite.config.ts replaces the block between the STAMP markers below
 * with the real cache revision and the exact list of built asset URLs, so one
 * install pass can precache the whole shell. In dev the unstamped defaults are
 * used and runtime fill covers everything instead.
 *
 * Caching policy (spec §17.1): local static app shell only — HTML shell,
 * built JS/CSS, manifest, icons, other same-origin static files. Gym Logger
 * has no API/cloud endpoints; nothing is ever sent or cached anywhere remote,
 * non-GET requests bypass this worker entirely, and `/sw.js` itself is never
 * cached (the browser owns service-worker updates).
 */
"use strict";

/* === gym-logger-sw-stamp === */
var GYM_LOGGER_CACHE_REVISION = "dev-unstamped";
var GYM_LOGGER_SHELL_URL = "/";
var GYM_LOGGER_PRECACHE_ASSETS = [];
/* === end gym-logger-sw-stamp === */

var CACHE_PREFIX = "gym-logger-";
var cacheName = CACHE_PREFIX + GYM_LOGGER_CACHE_REVISION;

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(cacheName)
      .then(function (cache) {
        // Best-effort precache: one missing asset must never block install;
        // the fetch handler's runtime fill covers whatever slipped through.
        return Promise.all(
          GYM_LOGGER_PRECACHE_ASSETS.map(function (url) {
            return cache.add(url).catch(function () {
              /* intentionally tolerated */
            });
          }),
        );
      })
      .then(function () {
        return self.skipWaiting();
      }),
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        // Versioned caches: only the current revision survives activation.
        return Promise.all(
          keys.map(function (key) {
            if (key.indexOf(CACHE_PREFIX) === 0 && key !== cacheName) {
              return caches.delete(key);
            }
            return undefined;
          }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (!request || request.method !== "GET") return;
  if (request.headers && request.headers.get && request.headers.get("range")) {
    return; // Media/range requests belong to the browser.
  }

  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    // Network-first for navigations: fresh shell when online, cached shell
    // once offline — the offline fallback exists from the first successful
    // load onward.
    event.respondWith(
      fetch(request)
        .then(function (response) {
          if (response && response.ok) {
            var clone = response.clone();
            caches
              .open(cacheName)
              .then(function (cache) {
                return cache.put(GYM_LOGGER_SHELL_URL, clone);
              })
              .catch(function () {});
          }
          return response;
        })
        .catch(function () {
          return caches
            .match(GYM_LOGGER_SHELL_URL, { ignoreSearch: true })
            .then(function (cachedShell) {
              if (cachedShell) return cachedShell;
              return caches.match(request).then(function (cachedExact) {
                if (cachedExact) return cachedExact;
                return new Response("", {
                  status: 503,
                  statusText: "Offline",
                });
              });
            });
        }),
    );
    return;
  }

  // Same-origin static assets: cache-first with background fill. Built file
  // names are content-hashed, so a cached hit is always correct.
  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (response && response.ok && response.type === "basic") {
          var clone = response.clone();
          caches
            .open(cacheName)
            .then(function (cache) {
              return cache.put(request, clone);
            })
            .catch(function () {});
        }
        return response;
      });
    }),
  );
});
