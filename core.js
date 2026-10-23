/* ===== CONFIG: your Cloudflare Worker URL ===== */
const WORKER_URL = localStorage.apiUrl || "https://school-api.anmolvirk1997.workers.dev";

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const S = { me: null, cfg: null, students: [] };      // session state
const A = {};                                         // click actions: <button data-a="name"> -> A.name(button, event)
const D = {};                                         // data-file cache: path -> object
let token = localStorage.tok || "";

/* ---------- icons (outline, like the reference design) ---------- */
const IC = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  marks: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  cls: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/>',
  chart: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
  admin: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  cap: '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M9 9.5h4.5a1.5 1.5 0 0 1 0 3H9m0 0h5M9 9.5V16"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  print: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>'
};
const ic = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ""}</svg>`;

/* ---------- small helpers ---------- */
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const fmtD = d => d ? new Date(d + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const slug = s => (String(s).replace(/\W+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30)) || "t";
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const r0 = n => n == null ? "—" : Math.round(n);
const rupee = n => "₹" + Math.round(n || 0).toLocaleString("en-IN");
const byName = (a, b) => a.name.localeCompare(b.name);
function weekKey(d = new Date()) {                     // ISO week, e.g. 2026-W43
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return t.getUTCFullYear() + "-W" + String(Math.ceil(((t - y0) / 864e5 + 1) / 7)).padStart(2, "0");
}
const weekStart = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const classStudents = c => S.students.filter(s => s.cls === c).sort(byName);
const stuById = id => S.students.find(s => s.id === id);

function toast(msg, bad) {
  const t = $("toast"); t.textContent = msg; t.className = "toast" + (bad ? " bad" : ""); clearTimeout(toast.t); toast.t = setTimeout(() => t.className = "toast hide", 3200);
}
const busy = async (btn, fn) => { if (btn) btn.disabled = true; try { return await fn(); } finally { if (btn) btn.disabled = false; } };

/* ---------- API + offline queue ---------- */
async function api(method, path, body) {
  let r;
  try { r = await fetch(WORKER_URL + path, { method, headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: body ? JSON.stringify(body) : undefined }); }
  catch (e) { throw Object.assign(new Error("You are offline."), { offline: true }); }
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== "/login") { localStorage.removeItem("tok"); alert(j.error || "Please log in again."); location.reload(); throw new Error(j.error); }
  if (!r.ok) { const e = new Error(j.error || "Request failed (" + r.status + ")"); if (j.conflict) e.conflict = j.conflict; throw e; }
  return j;
}
const Q = { get: () => { try { return JSON.parse(localStorage.q || "[]"); } catch { return []; } }, set: a => { localStorage.q = JSON.stringify(a); syncBadge(); } };
function syncBadge() { const n = Q.get().length, b = $("sync"); if (b) { b.classList.toggle("hide", !n && navigator.onLine); b.textContent = n ? n + " waiting to sync" : "Offline"; } }
async function flushQueue() {
  let q = Q.get(); if (!q.length || !token) return;
  while (q.length) {
    try { await api("POST", "/patch", q[0]); q.shift(); Q.set(q); }
    catch (e) { if (e.offline) return; q.shift(); Q.set(q); toast(e.conflict ? "An entry saved offline was not applied because someone else changed that record first. Please check it." : "One saved entry could not be synced: " + e.message, true); }
  }
  toast("Offline entries synced");
}
addEventListener("online", () => { syncBadge(); flushQueue(); }); addEventListener("offline", syncBadge); setInterval(flushQueue, 20000);

/* ---------- data files: cached, offline-aware, edited with safe patches ---------- */
async function load(paths, force) {
  const need = paths.filter(p => force || !(p in D));
  if (need.length) {
    try { const r = await api("POST", "/bulk", { paths: need }); need.forEach(p => { D[p] = r[p] || {}; try { localStorage["c_" + p] = JSON.stringify(D[p]); } catch { } }); }
    catch (e) { if (!e.offline) throw e; need.forEach(p => { try { D[p] = JSON.parse(localStorage["c_" + p]); } catch { D[p] = {}; } }); toast("Offline - showing the last saved copy"); }
  }
  return paths.map(p => D[p]);
}
const getAt = (o, ks) => ks.reduce((x, k) => x == null ? undefined : x[k], o);
function setAt(path, k, v) {
  const o = D[path] || (D[path] = {}), ks = k.split("."), last = ks.pop();
  const parent = ks.reduce((x, key) => (typeof x[key] === "object" && x[key] !== null) ? x[key] : (x[key] = {}), o);
  if (v == null) delete parent[last]; else parent[last] = v;
}
async function patch(path, ops) {                       // ops: [{k:"marks.t1.s3", v:{...}}]  (v: null deletes)
  const old = ops.map(op => getAt(D[path] || {}, op.k.split(".")));
  ops.forEach(op => setAt(path, op.k, op.v));
  try { localStorage["c_" + path] = JSON.stringify(D[path]); } catch { }
  try { await api("POST", "/patch", { path, ops }); }
  catch (e) {
    if (e.offline) { Q.set([...Q.get(), { path, ops }]); toast("Saved on this phone. It will sync when you're back online."); return; }
    ops.forEach((op, i) => setAt(path, op.k, old[i] === undefined ? null : old[i])); throw e;
  }
}

const when = t => t ? new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
/* Two people saved the same record: show who/what/when and let the user decide. Nothing is overwritten silently. */
function conflictSheet(title, theirs, mine, keepAct, mineAct, extra) {
  sheet(`<h2>${esc(title)}</h2><p><b>${esc(theirs.by || "Someone")}</b> saved this ${theirs.t ? "at <b>" + when(theirs.t) + "</b> " : ""}while you were editing.</p>
   <div class="cf"><div><small>Their entry</small><b>${theirs.text}</b></div><div><small>Your entry</small><b>${mine.text}</b></div></div>${extra || ""}
   <div class="row"><button class="btn alt" data-a="${keepAct}" style="flex:1">Keep theirs</button><button class="btn" data-a="${mineAct}" style="flex:1">Use mine</button></div>`);
}

/* ---------- bottom sheet (entry card) with unsaved-change guard ---------- */
let dirty = false;
function sheet(html) { const s = $("sheet"); $("veil").classList.remove("hide"); s.classList.remove("hide"); s.innerHTML = html; dirty = false; s.oninput = () => dirty = true; const f = s.querySelector("[autofocus]"); if (f) f.focus(); }
function closeSheet(force) { if (dirty && !force && !confirm("Discard what you typed for this entry?")) return false; $("veil").classList.add("hide"); $("sheet").classList.add("hide"); $("sheet").innerHTML = ""; dirty = false; return true; }
$("veil").onclick = () => closeSheet();
addEventListener("keydown", e => { if (e.key === "Escape" && !$("sheet").classList.contains("hide")) closeSheet(); });
A.close = () => closeSheet();
document.addEventListener("change", e => { const b = e.target.closest("[data-c]"); if (b && A[b.dataset.c]) A[b.dataset.c](b, e); });
document.addEventListener("click", e => { const b = e.target.closest("[data-a]"); if (b && A[b.dataset.a]) A[b.dataset.a](b, e); });

/* ---------- which class/subject pairs can this user touch? (the worker enforces the same rule) ---------- */
function pairs() {
  const me = S.me, cfg = S.cfg, out = [];
  const add = (cls, sub) => { if (cfg.classes.includes(cls) && cfg.subjects.includes(sub) && !out.some(p => p.cls === cls && p.sub === sub)) out.push({ cls, sub }); };
  if (me.role === "admin") cfg.classes.forEach(c => cfg.subjects.forEach(s => add(c, s)));
  else { if (me.inchargeOf) cfg.subjects.forEach(s => add(me.inchargeOf, s)); (me.assignments || []).forEach(a => add(a.cls, a.sub)); }
  return out;
}
const myClasses = () => [...new Set(pairs().map(p => p.cls))];
const inchargeClasses = () => S.me.role === "admin" ? S.cfg.classes : (S.me.inchargeOf ? [S.me.inchargeOf] : []);
const subjectsOf = c => pairs().filter(p => p.cls === c).map(p => p.sub);
function pairHTML(p, noSub) {
  const cs = myClasses();
  return `<select id="${p}c" aria-label="Class" data-c="pairChange" data-p="${p}">${cs.map(c => `<option>${esc(c)}</option>`).join("")}</select>` + (noSub ? "" : `<select id="${p}s" aria-label="Subject" data-c="pairChange" data-p="${p}"></select>`);
}
function fillPair(p, noSub) { if (noSub) return; const c = $(p + "c").value, keep = $(p + "s").value, ss = subjectsOf(c); $(p + "s").innerHTML = ss.map(s => `<option ${s === keep ? "selected" : ""}>${esc(s)}</option>`).join(""); }
A.pairChange = b => { fillPair(b.dataset.p); const f = A["pairDone_" + b.dataset.p]; if (f) f(); };
const noAccess = what => `<div class="card empty"><b>Nothing to show yet</b><p class="sub">${what}</p></div>`;

/* ---------- universal alphabet entry (used by marks, notebooks, fines, calls, fees) ---------- */
const ENT = {};
function entry(host, o) {      // o: {id, cls, done(s), tail(s), pick(sid), counter=true, note}
  ENT[o.id] = Object.assign({ letter: "", q: "", counter: true }, o);
  host.innerHTML = `<div class="card entry"><div class="row between"><b id="${o.id}-cnt" class="cnt"></b><input id="${o.id}-q" class="find" placeholder="Search name" aria-label="Search student"></div>
   <div class="bar"><i id="${o.id}-bar"></i></div>${o.note ? `<div class="notes">${o.note}</div>` : ""}
   <div class="eflow"><div class="alpha" id="${o.id}-al" role="group" aria-label="Jump to letter"></div><div id="${o.id}-ls" class="elist"></div></div></div>`;
  $(o.id + "-q").oninput = e => { ENT[o.id].q = e.target.value.toLowerCase(); entryDraw(o.id); };
  entryDraw(o.id);
}
function entryDraw(id) {
  const o = ENT[id], all = classStudents(o.cls), done = all.filter(s => o.done(s)).length;
  $(id + "-cnt").textContent = o.counter ? `${done}/${all.length} entered` : `${all.length} students`; $(id + "-bar").style.width = (o.counter && all.length ? done / all.length * 100 : 0) + "%";
  $(id + "-bar").parentNode.classList.toggle("hide", !o.counter);
  const has = new Set(all.map(s => s.name[0].toUpperCase()));
  $(id + "-al").innerHTML = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => `<button data-a="eLetter" data-e="${id}" data-l="${l}" class="${l === o.letter ? "on" : ""}" ${has.has(l) ? "" : "disabled"}>${l}</button>`).join("");
  const list = all.filter(s => o.q ? s.name.toLowerCase().includes(o.q) : (!o.letter || s.name[0].toUpperCase() === o.letter));
  $(id + "-ls").innerHTML = list.map(s => `<button class="st ${o.done(s) ? "done" : ""}" data-a="ePick" data-e="${id}" data-id="${esc(s.id)}"><span>${esc(s.name)}</span><span class="tail">${o.tail ? o.tail(s) : ""}</span></button>`).join("") || `<p class="sub">No students found.</p>`;
}
A.eLetter = b => { const o = ENT[b.dataset.e]; o.letter = o.letter === b.dataset.l ? "" : b.dataset.l; entryDraw(b.dataset.e); };
A.ePick = b => ENT[b.dataset.e].pick(b.dataset.id);
function entryNext(id, sid) {      // next student who still has no entry; null when everyone is done
  const o = ENT[id], all = classStudents(o.cls), i = all.findIndex(s => s.id === sid);
  return [...all.slice(i + 1), ...all.slice(0, i)].find(s => !o.done(s)) || null;
}

/* ---------- tiny SVG charts ---------- */
function spark(vals, w = 96, h = 30) {
  if (vals.length < 2) return `<svg class="spark" width="${w}" height="${h}"><path d="M2 ${h / 2} q ${w / 4} -10 ${w / 2} 0 t ${w / 2 - 4} 0" fill="none" stroke="currentColor" stroke-width="2" opacity=".6"/></svg>`;
  const mn = Math.min(...vals), mx = Math.max(...vals), rg = mx - mn || 1;
  const pts = vals.map((v, i) => [2 + i * (w - 4) / (vals.length - 1), h - 4 - (v - mn) / rg * (h - 8)]);
  return `<svg class="spark" width="${w}" height="${h}"><path d="M${pts.map(p => p.map(n => n.toFixed(1)).join(" ")).join(" L")}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/></svg>`;
}
function lineChart(points, o = {}) {         // points: [{x:label,y:0..100}]
  const w = 560, h = 190, pl = 34, pb = 26, pt = 10, pr = 10;
  if (!points.length) return `<p class="sub">No marks recorded yet.</p>`;
  const X = i => pl + (points.length === 1 ? (w - pl - pr) / 2 : i * (w - pl - pr) / (points.length - 1)), Y = v => pt + (100 - v) / 100 * (h - pt - pb);
  const pass = o.pass ? `<line x1="${pl}" x2="${w - pr}" y1="${Y(o.pass)}" y2="${Y(o.pass)}" stroke="var(--red)" stroke-dasharray="4 4" opacity=".6"/>` : "";
  return `<svg class="lc" viewBox="0 0 ${w} ${h}" role="img" aria-label="Marks trend">${[0, 50, 100].map(v => `<line x1="${pl}" x2="${w - pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${pl - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="10" fill="var(--mut)">${v}</text>`).join("")}${pass}
   <polyline fill="none" stroke="var(--green)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${points.map((p, i) => X(i) + "," + Y(p.y)).join(" ")}"/>
   ${points.map((p, i) => `<circle cx="${X(i)}" cy="${Y(p.y)}" r="4.5" fill="var(--deep)"><title>${esc(p.x)}: ${Math.round(p.y)}%</title></circle>${points.length <= 8 ? `<text x="${X(i)}" y="${h - 8}" text-anchor="middle" font-size="9.5" fill="var(--mut)">${esc(p.x.slice(0, 10))}</text>` : ""}`).join("")}</svg>`;
}
const pill = (t, c = "") => `<span class="pill ${c}">${esc(t)}</span>`;

/* ---------- views registry ---------- */
const V = {};
let VT = 0; const stale = t => t !== VT;                    // VT changes on every page switch, so slow loads never paint over a newer page
const SK = `<div class="skw" aria-busy="true" aria-label="Loading"><div class="sk" style="height:44px;width:55%"></div><div class="skg"><div class="sk" style="height:84px"></div><div class="sk" style="height:84px"></div><div class="sk" style="height:84px"></div></div><div class="sk" style="height:230px"></div><div class="sk" style="height:140px"></div></div>`;
/* Show saved data instantly (stale-while-revalidate), then fetch fresh data and redraw only if something changed. */
function bundlePaths(cls) { const p = []; subjectsOf(cls).forEach(s => p.push(P.marks(cls, s), P.nb(cls, s), P.syl(cls, s))); if (inchargeClasses().includes(cls)) ["fines", "calls", "fees", "monitors"].forEach(k => p.push(P.k(k, cls))); return p; }
async function bundleFast(cls, render, quiet) {
  const paths = bundlePaths(cls);
  paths.forEach(p => { if (!(p in D)) { try { const c = localStorage["c_" + p]; if (c) D[p] = JSON.parse(c); } catch { } } });
  const had = paths.every(p => p in D), before = paths.map(p => JSON.stringify(D[p]));
  if (had && !quiet) render();
  try { await load(paths, true); } catch (e) { if (!had) throw e; return; }
  if (!had || paths.some((p, i) => JSON.stringify(D[p]) !== before[i])) render();
}
/* keep the keyboard from covering the entry card (phones/tablets) */
if (window.visualViewport) {
  const vv = visualViewport, fit = () => { const s = $("sheet"); if (!s) return; s.style.bottom = Math.max(0, innerHeight - vv.height - vv.offsetTop) + "px"; s.style.maxHeight = Math.max(260, vv.height - 20) + "px"; };
  vv.addEventListener("resize", fit); vv.addEventListener("scroll", fit);
}
document.addEventListener("focusin", e => { if (e.target.closest("#sheet")) setTimeout(() => e.target.scrollIntoView({ block: "nearest", behavior: "smooth" }), 320); });
const setTitle = (t, s) => { $("ttl").textContent = t; $("sbt").textContent = s || ""; };
