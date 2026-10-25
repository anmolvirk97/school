// Offline shell: cache the app files; data requests always go to the network (the app keeps its own offline copy + sync queue).
const V = "school-v7", FILES = ["./", "index.html", "style.css", "script.js", "icon.svg", "manifest.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => clients.claim())); });
self.addEventListener("fetch", e => { const u = new URL(e.request.url); if (e.request.method !== "GET" || u.origin !== location.origin) return; e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request))); });
