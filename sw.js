// Santa Cruz App — Service Worker PWA (funciona sin internet).
// Este archivo va en la RAÍZ del repo (al lado de index.html), NO dentro de src/.
// En cada nueva versión publicada, subir V a sc-v2, sc-v3...
const V = "sc-v3";
const CACHE = "santacruz-" + V;
const CORE = [
  "./",
  "index.html",
  "src/styles.css",
  "src/pwa/manifest.webmanifest",
  "src/pwa/icon-192.png",
  "src/pwa/icon-512.png",
  "src/gcal-seed.json",
  "src/app.js",
  "src/i18n.js",
  "src/i18n-content.js",
  "src/content.js",
  "src/content-ui.js",
  "src/sync.js",
  "src/sync-cloud.js",
  "src/cloud-config.js",
  "src/gcal.js",
  "src/saints.js",
  "src/saints-data.js",
  "src/saints-es.js",
  "src/saints-extra.js",
  "src/lectionary/litcal.js",
  "src/lectionary/display.js",
  "src/lectionary/usccb-text.js",
  "src/litcal.js",
  "src/lectionary-daily.js",
  "src/daily-citations.js",
  "src/daily-extra.js",
  "src/vendor/lectionary-daily.js",
  "src/vendor/lectionary-data.js",
  "src/vendor/saints-data.js",
  "src/vendor/saints-es.js",
  "src/vendor/saints-extra.js",
  "src/usccb.js",
  "src/usccb-prayers.js",
  "src/missal.js",
  "src/confesion.js",
  "src/pastoral.js",
  "src/parish-schedule.js",
  "src/manyanet.js",
  "src/data.js",
  "src/calendario-extra.js",
  "src/build-daily-extra.js",
  "src/build-parish-schedule.js"
];
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.allSettled(
        CORE.map((u) =>
          fetch(u, { cache: "no-cache" }).then((r) => { if (r && r.ok) return c.put(u, r); }).catch(() => {})
        )
      )
    )
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.indexOf("santacruz-") === 0 && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .catch(() => {})
  );
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // Supabase/Google: siempre por red
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((r) => {
        if (r && r.ok) {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return r;
      }).catch(() => {
        if (e.request.mode === "navigate") return caches.match("index.html");
        throw new Error("offline");
      });
    })
  );
});
