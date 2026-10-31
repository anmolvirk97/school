// Offline shell: the app files open instantly from the device and are refreshed quietly in the background (so a new version shows on the next open).
// Data requests are not handled here - they always go to the network (the app keeps its own offline copy + sync queue).
const V = "school-v18", FILES = ["./", "index.html", "style.css", "script.js", "icon.svg", "logo.svg", "manifest.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url); if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }                       // instant from the device, refreshed for next time
    return (await net) || Response.error();
  }));
});
