/* ===== core.js ===== */
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

/* ===== analytics.js ===== */
/* ===== Data bundles + analytics shared by dashboard, student page, reports ===== */
const P = { marks: (c, s) => `data/marks/${c}_${s}.json`, nb: (c, s) => `data/notebook/${c}_${s}.json`, syl: (c, s) => `data/syllabus/${c}_${s}.json`, k: (k, c) => `data/${k}/${c}.json` };
async function bundle(cls, force) {
  const paths = []; subjectsOf(cls).forEach(s => paths.push(P.marks(cls, s), P.nb(cls, s), P.syl(cls, s)));
  const inch = inchargeClasses().includes(cls); if (inch) ["fines", "calls", "fees", "monitors"].forEach(k => paths.push(P.k(k, cls)));
  await load(paths, force); return { cls, inch };
}
const FD = (k, c) => D[P.k(k, c)] || {};
function stats(cls) {
  const pass = S.cfg.passPercent, st = {}, tests = [];
  classStudents(cls).forEach(s => st[s.id] = { s, pts: [], sub: {}, nbD: 0, nbT: 0, risk: [] });
  subjectsOf(cls).forEach(sub => {
    const mf = D[P.marks(cls, sub)] || {};
    Object.entries(mf.tests || {}).forEach(([tid, t]) => {
      const ms = (mf.marks || {})[tid] || {}, vals = [];
      Object.entries(ms).forEach(([sid, e]) => { if (!st[sid]) return; const p = e.m / e.max * 100; st[sid].pts.push({ x: t.name, y: p, date: t.date, sub }); (st[sid].sub[sub] = st[sid].sub[sub] || []).push(p); vals.push(p); });
      tests.push({ sub, tid, name: t.name, date: t.date, max: t.max, n: vals.length, avg: avg(vals) });
    });
    const ch = (D[P.syl(cls, sub)] || {}).chapters || [], tc = ch.filter(taught).length, en = (D[P.nb(cls, sub)] || {}).entries || {};
    Object.keys(st).forEach(sid => { const d = Object.keys(en).filter(k => en[k][sid]).sort().pop(); if (d && tc) { st[sid].nbD += nbDone(en[d][sid], ch); st[sid].nbT += tc; } });
  });
  const rows = Object.values(st);
  rows.forEach(r => {
    r.pts.sort((a, b) => a.date.localeCompare(b.date)); r.avg = avg(r.pts.map(p => p.y));
    r.nb = r.nbT ? r.nbD / r.nbT * 100 : null; r.nbInc = r.nbT - r.nbD;
    const ys = r.pts.map(p => p.y); r.trend = ys.length >= 3 ? ys[ys.length - 1] - avg(ys.slice(0, -1)) : 0;
    if (r.avg != null && r.avg < pass) r.risk.push("Low marks (" + Math.round(r.avg) + "%)");
    if (r.trend <= -10) r.risk.push("Marks falling");
    if (r.nbT && r.nbInc >= 2) r.risk.push(r.nbInc + " chapters pending");
  });
  const all = rows.flatMap(r => r.pts.map(p => p.y)), best = rows.filter(r => r.avg != null);
  return { rows, tests: tests.sort((a, b) => a.date.localeCompare(b.date)), classAvg: avg(all), passRate: best.length ? best.filter(r => r.avg >= pass).length / best.length * 100 : null, nbPct: avg(rows.filter(r => r.nb != null).map(r => r.nb)) };
}
/* dues helpers (incharge data) */
const fineRows = (cls, sid) => Object.entries(FD("fines", cls).items || {}).map(([id, f]) => Object.assign({ id }, f)).filter(f => !sid || f.sid === sid);
const fineDue = (cls, sid) => fineRows(cls, sid).filter(f => !f.paid).reduce((n, f) => n + f.amt, 0);
const termKey = t => t.replace(/\W+/g, "_");
const feeRec = (cls, term, sid) => getAt(FD("fees", cls), [termKey(term), sid]);
const feePaid = r => r ? (r.pays || []).reduce((n, p) => n + p.a, 0) : 0;
const feeLeft = r => r ? Math.max(0, r.due - feePaid(r)) : 0;
const callsOf = (cls, sid) => Object.entries(FD("calls", cls).items || {}).map(([id, c]) => Object.assign({ id }, c)).filter(c => !sid || c.sid === sid).sort((a, b) => b.date.localeCompare(a.date));
const calledThisWeek = (cls, sid) => callsOf(cls, sid).some(c => c.date >= weekStart());
const weekIdx = d => Math.floor((d.getTime() / 864e5 + 3) / 7);

/* ===== modules.js ===== */
/* ===== Test marks + Notebooks ===== */
let M = {};
const mk = sid => getAt(D[M.path] || {}, ["marks", M.tid, sid]);

V.marks = async host => {
  setTitle("Test marks", "Set the test once, then tap names to enter marks.");
  if (!pairs().length) return host.innerHTML = noAccess("Ask the admin to assign a class and subject to you.");
  host.innerHTML = `<div class="card"><div class="row">${pairHTML("m")}<input id="tname" placeholder="Test name (e.g. Unit 1)"><input id="max" type="number" inputmode="numeric" placeholder="Max marks"><input id="tdate" type="date" value="${today()}" aria-label="Test date"></div>
   <div id="tchips" class="row chips"></div><p></p><button class="btn" data-a="mStart">Start entry</button></div><div id="mentry"></div>`;
  fillPair("m"); A.pairDone_m = mTests; mTests();
};
async function mTests() {
  const c = $("mc").value, s = $("ms").value; if (!c || !s) return;
  const [f] = await load([`data/marks/${c}_${s}.json`], true), t = Object.entries(f.tests || {}).sort((a, b) => b[1].date.localeCompare(a[1].date)).slice(0, 6);
  $("tchips").innerHTML = t.length ? `<span class="sub" style="margin:8px 4px">Resume:</span>` + t.map(([id, x]) => `<button class="chip" data-a="mResume" data-t="${esc(id)}">${esc(x.name)} · ${fmtD(x.date)} · /${x.max}</button>`).join("") : "";
}
A.mResume = b => { const t = D[`data/marks/${$("mc").value}_${$("ms").value}.json`].tests[b.dataset.t]; $("tname").value = t.name; $("max").value = t.max; $("tdate").value = t.date; A.mStart(b); };
A.mStart = b => busy(b, async () => {
  const c = $("mc").value, s = $("ms").value, name = $("tname").value.trim(), max = +$("max").value, date = $("tdate").value;
  if (!name || !(max > 0) || !date) return toast("Add a test name, max marks and date.", true);
  const path = `data/marks/${c}_${s}.json`; await load([path], true);
  const tid = slug(name) + "_" + date; M = { path, cls: c, sub: s, tid };
  if (!getAt(D[path], ["tests", tid])) await patch(path, [{ k: "tests." + tid, v: { name, date, max, by: S.me.name } }]);
  M.max = D[path].tests[tid].max;
  entry($("mentry"), { id: "m", cls: c, note: `<b>${esc(name)}</b> · ${esc(s)} · out of ${M.max}`, done: x => !!mk(x.id), tail: x => { const e = mk(x.id); return e ? `${e.m}/${e.max}` : ""; }, pick: mOpen });
  $("mentry").scrollIntoView({ behavior: "smooth" });
});
function mOpen(id) {
  const s = stuById(id), e = mk(id) || { m: "", max: M.max, r: "" };
  sheet(`<h2>${esc(s.name)}</h2><div class="row mid"><input class="big" id="mm" type="number" inputmode="decimal" aria-label="Marks" enterkeyhint="done" value="${e.m}" placeholder="0" autofocus><b>/</b><input class="big" id="mx" type="number" aria-label="Max marks" value="${e.max}"></div>
   <p><input id="mr" placeholder="Remark (optional)" value="${esc(e.r || "")}" style="width:100%"></p>
   <div class="row"><button class="btn" data-a="mSave" data-id="${esc(id)}" style="flex:2">Save &amp; next</button><button class="btn alt" data-a="mSkip" data-id="${esc(id)}">Skip</button></div><div class="err" id="e2"></div>`);
  $("sheet").onkeydown = ev => { if (ev.key === "Enter") A.mSave($("sheet").querySelector("[data-a=mSave]")); };
}
A.mSkip = b => { if (!closeSheet()) return; const n = entryNext("m", b.dataset.id); n ? mOpen(n.id) : 0; };
A.mSave = b => busy(b, async () => {
  const id = b.dataset.id, v = $("mm").value, mx = +$("mx").value;
  if (v === "" || +v < 0 || +v > mx) return $("e2").textContent = "Marks must be between 0 and " + mx + ".";
  const old = mk(id), rec = { m: +v, max: mx, r: $("mr").value.trim(), by: S.me.name, t: Date.now() };
  try { await patch(M.path, [{ k: `marks.${M.tid}.${id}`, v: rec, base: old && old.t != null ? old.t : null }]); }
  catch (x) { if (x.conflict) return mConflict(id, rec, x.conflict[0].current); return $("e2").textContent = x.message; }
  entryDraw("m"); const n = entryNext("m", id); dirty = false; n ? mOpen(n.id) : closeSheet(true);
});
let CF = {};
function mConflict(id, mine, theirs) {
  CF = { id, mine, theirs };
  if (!theirs) return mOpen(id);
  conflictSheet(stuById(id).name + ": already saved", { by: theirs.by, t: theirs.t, text: `${theirs.m}/${theirs.max}` }, { text: `${mine.m}/${mine.max}` }, "mKeep", "mMine");
}
A.mKeep = () => { setAt(M.path, `marks.${M.tid}.${CF.id}`, CF.theirs); try { localStorage["c_" + M.path] = JSON.stringify(D[M.path]); } catch { } entryDraw("m"); const n = entryNext("m", CF.id); dirty = false; n ? mOpen(n.id) : closeSheet(true); };
A.mMine = b => busy(b, async () => {
  try { await patch(M.path, [{ k: `marks.${M.tid}.${CF.id}`, v: Object.assign({}, CF.mine, { t: Date.now() }), base: CF.theirs.t != null ? CF.theirs.t : null }]); }
  catch (x) { if (x.conflict) return mConflict(CF.id, CF.mine, x.conflict[0].current); return toast(x.message, true); }
  entryDraw("m"); const n = entryNext("m", CF.id); dirty = false; n ? mOpen(n.id) : closeSheet(true);
});

/* ---------- Notebooks ---------- */
const NBST = { full: "Full", summary: "Summary only", notstarted: "Not started", notcovered: "Not covered" };
const taught = c => c.st === "full" || c.st === "summary";
const SYM = ["✖", "✔", "➖"], nextS = v => v === 1 ? 2 : v === 2 ? 0 : 1;
let N = {}, NS = {};
const ne = sid => getAt(D[N.ep] || {}, ["entries", N.date, sid]);
const nbPaths = (c, s) => ({ sp: `data/syllabus/${c}_${s}.json`, ep: `data/notebook/${c}_${s}.json` });
const nbDone = (e, ch) => ch.reduce((n, c, i) => n + (taught(c) && e && e.s[i] === 1 ? 1 : 0), 0);

V.nb = host => {
  setTitle("Notebooks", "One tap per chapter: done, partial, pending.");
  if (!pairs().length) return host.innerHTML = noAccess("Ask the admin to assign a class and subject to you.");
  host.innerHTML = `<div class="card"><div class="row">${pairHTML("n")}<input id="ndate" type="date" value="${today()}" aria-label="Date"></div><p></p><div class="row"><button class="btn" data-a="nOpen">Open</button><button class="btn alt" data-a="nChapters">Edit chapters</button></div></div><div id="nbody"></div>`;
  fillPair("n");
};
async function nbLoad() {
  const c = $("nc").value, s = $("ns").value, ndate = $("ndate").value;
  if (!c || !s) return false;
  N = Object.assign({ cls: c, sub: s, date: ndate, view: "entry" }, nbPaths(c, s));
  const [sy] = await load([N.sp, N.ep], true); N.ch = sy.chapters || []; return true;
}
A.nOpen = b => busy(b, async () => { if (!await nbLoad()) return; if (!N.ch.length) return A.nChapters(b); nbDraw(); });
function nbDraw() {
  $("nbody").innerHTML = `<div class="seg" role="tablist"><button class="${N.view === "entry" ? "on" : ""}" data-a="nView" data-v="entry">Enter</button><button class="${N.view === "heat" ? "on" : ""}" data-a="nView" data-v="heat">Heatmap</button></div><div id="nmain"></div>`;
  if (N.view === "heat") return nbHeat();
  entry($("nmain"), { id: "n", cls: N.cls, note: `<b>${esc(N.sub)}</b> · ${fmtD(N.date)} · ${N.ch.filter(taught).length} chapters being checked`, done: s => !!ne(s.id), tail: s => { const e = ne(s.id); return e ? nbDone(e, N.ch) + "/" + N.ch.filter(taught).length : ""; }, pick: nOpenStu });
}
A.nView = b => { N.view = b.dataset.v; nbDraw(); };
function nbHeat() {
  const last = sid => { const en = D[N.ep].entries || {}, d = Object.keys(en).filter(k => en[k][sid]).sort().pop(); return d ? en[d][sid] : null; };
  const st = classStudents(N.cls);
  $("nmain").innerHTML = `<div class="card"><p class="sub">Latest entry for each student. Tap a name for details.</p><div class="scroll"><table class="heat"><thead><tr><th>Student</th>${N.ch.map((c, i) => `<th title="${esc(c.n)}" class="${taught(c) ? "" : "dim"}">${i + 1}</th>`).join("")}<th>%</th></tr></thead><tbody>${st.map(s => { const e = last(s.id), t = N.ch.filter(taught).length; return `<tr><td>${esc(s.name)}</td>${N.ch.map((c, i) => `<td><i class="hc ${!e || !taught(c) ? "hn" : "s" + (e.s[i] || 0)}"></i></td>`).join("")}<td>${e && t ? Math.round(nbDone(e, N.ch) / t * 100) + "%" : "—"}</td></tr>`; }).join("")}</tbody></table></div>
   <p class="legend"><i class="hc s1"></i> done <i class="hc s2"></i> partial <i class="hc s0"></i> pending <i class="hc hn"></i> no entry / not taught</p>
   <p class="sub">Chapters: ${N.ch.map((c, i) => `${i + 1}. ${esc(c.n)}`).join(" · ")}</p></div>`;
}
A.nChapters = async b => {
  if (!await nbLoad()) return;
  const row = c => `<div class="crow"><input class="cn" value="${esc(c.n)}" placeholder="Chapter name" aria-label="Chapter name"><select class="cs" aria-label="Status">${Object.entries(NBST).map(([k, v]) => `<option value="${k}" ${c.st === k ? "selected" : ""}>${v}</option>`).join("")}</select><button class="link" data-a="chDel" aria-label="Remove chapter">✕</button></div>`;
  A.chRow = row;
  sheet(`<h2>Chapters: ${esc(N.cls)} ${esc(N.sub)}</h2><p class="sub">In syllabus order. Only "Full" and "Summary only" chapters are checked in notebooks. Add new chapters at the end so saved ticks stay in place.</p><div id="chl" class="chl">${(N.ch.length ? N.ch : [{ n: "", st: "full" }]).map(row).join("")}</div>
   <p><button class="btn alt" data-a="chAdd">Add chapter</button></p><div class="row"><button class="btn" data-a="chSave" style="flex:2">Save chapters</button><button class="btn alt" data-a="close">Cancel</button></div><div class="err" id="e2"></div>`);
};
A.chAdd = () => { $("chl").insertAdjacentHTML("beforeend", A.chRow({ n: "", st: "full" })); dirty = true; $("chl").lastElementChild.querySelector("input").focus(); };
A.chDel = b => { b.closest(".crow").remove(); dirty = true; };
A.chSave = b => busy(b, async () => {
  const ch = [...document.querySelectorAll("#chl .crow")].map(r => ({ n: r.querySelector(".cn").value.trim(), st: r.querySelector(".cs").value })).filter(c => c.n);
  if (!ch.length) return $("e2").textContent = "Add at least one chapter.";
  try { await patch(N.sp, [{ k: "chapters", v: ch }]); } catch (x) { return $("e2").textContent = x.message; }
  N.ch = ch; closeSheet(true); toast("Chapters saved"); nbDraw();
});
function nOpenStu(id) {
  const e = ne(id); NS = { id, st: N.ch.map((c, i) => e ? (e.s[i] || 0) : 0), cr: Object.assign({}, e && e.cr), r: e ? e.r || "" : "", detail: NS.detail || false };
  sheet(""); nsDraw();
}
function nsDraw() {
  const s = stuById(NS.id), t = N.ch.map((c, i) => c).filter(taught).length;
  $("sheet").innerHTML = `<div class="row between"><h2>${esc(s.name)}</h2><button class="link" data-a="nsMode">${NS.detail ? "Quick strip" : "Individual entry"}</button></div><p class="sub">${fmtD(N.date)} · ${esc(N.sub)} · ${NS.detail ? "Set each chapter and add remarks" : "Tap a chapter to cycle done → partial → pending"}</p>` +
    (NS.detail ? `<div class="chl">${N.ch.map((c, i) => `<div class="crow ${taught(c) ? "" : "dim"}"><span class="cl">${i + 1}. ${esc(c.n)}</span><select data-c="nsSel" data-i="${i}" ${taught(c) ? "" : "disabled"} aria-label="Chapter ${i + 1} status"><option value="1" ${NS.st[i] === 1 ? "selected" : ""}>Done</option><option value="2" ${NS.st[i] === 2 ? "selected" : ""}>Partial</option><option value="0" ${NS.st[i] === 0 ? "selected" : ""}>Pending</option></select><input class="cr" data-i="${i}" placeholder="Remark" value="${esc(NS.cr[i] || "")}" ${taught(c) ? "" : "disabled"}></div>`).join("")}</div><p><input id="nr" placeholder="Overall remark (optional)" value="${esc(NS.r)}" style="width:100%"></p>`
      : `<div class="chs">${N.ch.map((c, i) => `<button class="ch s${NS.st[i]}" data-a="nbCh" data-i="${i}" title="${esc(c.n)}" ${taught(c) ? "" : "disabled"}>Ch ${i + 1}<br>${taught(c) ? SYM[NS.st[i]] : "–"}</button>`).join("")}</div><p class="sub chnames">${N.ch.map((c, i) => `${i + 1}. ${esc(c.n)}`).join(" · ")}</p>`) +
    `<div class="row"><button class="btn alt" data-a="nsAll">All done</button><button class="btn alt" data-a="nsLast">Same as last entry</button></div><p></p><div class="row"><button class="btn" data-a="nsSave" style="flex:2">Save &amp; next</button><button class="btn alt" data-a="nsSkip">Skip</button></div><div class="err" id="e2"></div>`;
}
const nsKeep = () => { if (NS.detail) { document.querySelectorAll(".cr").forEach(i => { i.value.trim() ? NS.cr[i.dataset.i] = i.value.trim() : delete NS.cr[i.dataset.i]; }); const r = $("nr"); if (r) NS.r = r.value; } };
A.nsMode = () => { nsKeep(); NS.detail = !NS.detail; nsDraw(); };
A.nbCh = b => { NS.st[+b.dataset.i] = nextS(NS.st[+b.dataset.i]); dirty = true; nsDraw(); };
A.nsSel = b => { NS.st[+b.dataset.i] = +b.value; dirty = true; };
A.nsAll = () => { nsKeep(); N.ch.forEach((c, i) => { if (taught(c)) NS.st[i] = 1; }); dirty = true; nsDraw(); };
A.nsLast = () => {
  const en = D[N.ep].entries || {}, d = Object.keys(en).filter(k => k < N.date && en[k][NS.id]).sort().pop();
  if (!d) return toast("No earlier entry for this student.", true);
  nsKeep(); NS.st = N.ch.map((c, i) => en[d][NS.id].s[i] || 0); dirty = true; nsDraw(); toast("Copied from " + fmtD(d));
};
A.nsSkip = () => { if (!closeSheet()) return; const n = entryNext("n", NS.id); if (n) nOpenStu(n.id); };
A.nsSave = b => busy(b, async () => {
  nsKeep(); const id = NS.id, v = { s: NS.st, by: S.me.name, t: Date.now() }, old = ne(id);
  if (Object.keys(NS.cr).length) v.cr = NS.cr; if (NS.r.trim()) v.r = NS.r.trim();
  try { await patch(N.ep, [{ k: `entries.${N.date}.${id}`, v, base: old && old.t != null ? old.t : null }]); }
  catch (x) { if (x.conflict && x.conflict[0].current) return nConflict(id, v, x.conflict[0].current); return $("e2").textContent = x.message; }
  nsDone(id);
});
function nsDone(id) { entryDraw("n"); dirty = false; const n = entryNext("n", id); n ? nOpenStu(n.id) : (closeSheet(true), toast("Everyone in this class is done")); }
const nbText = e => `${nbDone(e, N.ch)}/${N.ch.filter(taught).length} chapters done`;
function nConflict(id, mine, theirs) { CF = { id, mine, theirs }; conflictSheet(stuById(id).name + ": notebook already saved", { by: theirs.by, t: theirs.t, text: nbText(theirs) }, { text: nbText(mine) }, "nKeep", "nMine"); }
A.nKeep = () => { setAt(N.ep, `entries.${N.date}.${CF.id}`, CF.theirs); try { localStorage["c_" + N.ep] = JSON.stringify(D[N.ep]); } catch { } nsDone(CF.id); };
A.nMine = b => busy(b, async () => {
  try { await patch(N.ep, [{ k: `entries.${N.date}.${CF.id}`, v: Object.assign({}, CF.mine, { t: Date.now() }), base: CF.theirs.t != null ? CF.theirs.t : null }]); }
  catch (x) { if (x.conflict && x.conflict[0].current) return nConflict(CF.id, CF.mine, x.conflict[0].current); return toast(x.message, true); }
  nsDone(CF.id);
});

/* ===== classwork.js ===== */
/* ===== Class incharge area: monitors, fines & dues, parent calls, fees ===== */
const C = { cls: "", tab: "mon", term: "" };
const RESP = ["Informed", "Will visit", "Promised improvement", "Not reachable", "Not available"];
const FTYPE = { nonEnglish: "Non-English speaking", icard: "I-card fee", other: "Other due" };

V.cls = async host => {
  setTitle("My class", "Monitors, dues, parent calls and fees");
  const cs = inchargeClasses();
  if (!cs.length) return host.innerHTML = noAccess("This area is for class incharges. Ask the admin to make you incharge of a class.");
  if (!cs.includes(C.cls)) C.cls = cs[0];
  C.term = C.term || S.cfg.terms[0] || "";
  host.innerHTML = `<div class="row" style="align-items:center">${cs.length > 1 ? `<select id="ccls" data-c="cClass" aria-label="Class" style="max-width:160px">${cs.map(c => `<option ${c === C.cls ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>` : `<h2 style="margin:0 8px 0 0">Class ${esc(C.cls)}</h2>`}</div>
   <div class="seg" id="ctabs"></div><div id="cbody"></div>`;
  $("cbody").innerHTML = SK; const t = VT;
  await bundleFast(C.cls, () => { if (!stale(t) && $("cbody")) cTab(); });
};
A.cClass = b => { C.cls = b.value; $("cbody").innerHTML = SK; const t = VT; bundleFast(C.cls, () => { if (!stale(t)) cTab(); }); };
A.cGo = b => { C.tab = b.dataset.t; cTab(); };
function cTab() {
  const T = { mon: "Monitors", fine: "Fines & dues", call: "Parent calls", fee: "Fees" };
  $("ctabs").innerHTML = Object.entries(T).map(([k, v]) => `<button class="${C.tab === k ? "on" : ""}" data-a="cGo" data-t="${k}">${v}</button>`).join("");
  ({ mon: cMon, fine: cFine, call: cCall, fee: cFee })[C.tab]($("cbody"));
}

/* ----- weekly monitors: automatic round-robin, incharge can override ----- */
function monitorFor(cls, offset, ci) {
  const cats = S.cfg.monitorCategories, d = new Date(); d.setDate(d.getDate() + 7 * offset);
  const key = weekKey(d), roster = classStudents(cls);
  const o = getAt(FD("monitors", cls), ["over", key, termKey(cats[ci])]), ov = o && stuById(o);
  if (ov) return { s: ov, over: true, key };
  return { s: roster.length ? roster[(weekIdx(d) * cats.length + ci) % roster.length] : null, over: false, key };
}
function cMon(host) {
  const cats = S.cfg.monitorCategories, roster = classStudents(C.cls);
  if (!cats.length) return host.innerHTML = noAccess("The admin has not set any monitor categories yet.");
  host.innerHTML = `<div class="card"><h3>This week's monitors</h3><p class="sub">Roster rotates automatically so every student gets a turn. Pick a name to override.</p>${[0, 1].map(off => `<h4>${off ? "Next week" : "This week"}</h4><div class="mons">${cats.map((c, i) => { const m = monitorFor(C.cls, off, i); return `<div class="mon"><span class="mc">${esc(c)}</span><span class="mp p${i % 3}">${m.s ? esc(m.s.name) : "—"}${m.over ? " ✎" : ""}</span><select data-c="monSet" data-cat="${esc(c)}" data-off="${off}" aria-label="Override ${esc(c)}"><option value="">Auto</option>${roster.map(s => `<option value="${esc(s.id)}" ${m.over && m.s.id === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></div>`; }).join("")}</div>`).join("")}</div>`;
}
A.monSet = async b => {
  const d = new Date(); d.setDate(d.getDate() + 7 * +b.dataset.off); const key = weekKey(d);
  try { await patch(P.k("monitors", C.cls), [{ k: `over.${key}.${termKey(b.dataset.cat)}`, v: b.value || null }]); cMon($("cbody")); } catch (x) { toast(x.message, true); }
};

/* ----- fines & dues ----- */
function cFine(host) {
  const rows = fineRows(C.cls), due = rows.filter(f => !f.paid).reduce((n, f) => n + f.amt, 0), got = rows.filter(f => f.paid).reduce((n, f) => n + f.amt, 0), def = classStudents(C.cls).filter(s => fineDue(C.cls, s.id) > 0).length;
  host.innerHTML = `<div class="kpis"><div class="kpi"><small>Pending</small><b>${rupee(due)}</b></div><div class="kpi"><small>Collected</small><b>${rupee(got)}</b></div><div class="kpi ${def ? "bad" : ""}"><small>Students with dues</small><b>${def}</b></div></div><div id="fent"></div>`;
  entry($("fent"), { id: "f", cls: C.cls, counter: false, done: () => false, note: "Tap a student to log a fine or an I-card / other due. Red badges show what is still pending.", tail: s => { const d = fineDue(C.cls, s.id); return d ? `<span class="pill bad">${rupee(d)} due</span>` : ""; }, pick: fOpen });
}
function fOpen(id) {
  const s = stuById(id), rows = fineRows(C.cls, id).sort((a, b) => b.date.localeCompare(a.date));
  sheet(`<h2>${esc(s.name)}</h2><p class="sub">Pending ${rupee(fineDue(C.cls, id))} · Paid ${rupee(rows.filter(f => f.paid).reduce((n, f) => n + f.amt, 0))}</p>
   ${rows.length ? `<div class="hist">${rows.slice(0, 6).map(f => `<div class="hr"><span>${fmtD(f.date)} · ${FTYPE[f.type]}${f.r ? " · " + esc(f.r) : ""}</span><b>${rupee(f.amt)}</b><button class="link" data-a="fPay" data-id="${esc(f.id)}" data-s="${esc(id)}">${f.paid ? "Paid ✓ undo" : "Mark paid"}</button></div>`).join("")}</div>` : ""}
   <div class="row"><select id="ft" data-c="fType" aria-label="Type">${Object.entries(FTYPE).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select><input id="fa" type="number" inputmode="decimal" placeholder="Amount ₹" value="${S.cfg.nonEnglishFine || ""}" aria-label="Amount" autofocus><input id="fd" type="date" value="${today()}" aria-label="Date"></div>
   <p><input id="fr" placeholder="Remark (optional)" style="width:100%"></p><div class="row"><button class="btn" data-a="fSave" data-id="${esc(id)}" style="flex:2">Save &amp; next</button><button class="btn alt" data-a="fNext" data-id="${esc(id)}">Skip</button></div><div class="err" id="e2"></div>`);
}
A.fType = b => { $("fa").value = b.value === "nonEnglish" ? S.cfg.nonEnglishFine || "" : ""; };
A.fNext = b => { if (!closeSheet()) return; const n = entryNext("f", b.dataset.id); if (n) fOpen(n.id); };
A.fSave = b => busy(b, async () => {
  const amt = +$("fa").value; if (!(amt > 0)) return $("e2").textContent = "Enter an amount.";
  const id = uid("f"), sid = b.dataset.id;
  try { await patch(P.k("fines", C.cls), [{ k: "items." + id, v: { sid, type: $("ft").value, amt, date: $("fd").value, paid: 0, r: $("fr").value.trim(), by: S.me.name, t: Date.now() } }]); } catch (x) { return $("e2").textContent = x.message; }
  dirty = false; cFine($("cbody")); const n = entryNext("f", sid); n ? fOpen(n.id) : closeSheet(true); toast("Saved");
});
A.fPay = async b => {
  const f = FD("fines", C.cls).items[b.dataset.id];
  try { await patch(P.k("fines", C.cls), [{ k: `items.${b.dataset.id}.paid`, v: f.paid ? 0 : 1 }, { k: `items.${b.dataset.id}.pd`, v: f.paid ? null : today() }]); } catch (x) { return toast(x.message, true); }
  fOpen(b.dataset.s); cFine($("cbody"));
};

/* ----- parent calls ----- */
function cCall(host) {
  const st = stats(C.cls).rows.filter(r => r.risk.length && !calledThisWeek(C.cls, r.s.id)), all = classStudents(C.cls), cov = all.filter(s => calledThisWeek(C.cls, s.id)).length;
  host.innerHTML = `<div class="card"><b>Calls to make</b><p class="sub">Students with 2+ notebook chapters pending or low / falling marks, not called this week.</p><div class="row chips">${st.length ? st.map(r => `<button class="chip bad" data-a="cPick" data-id="${esc(r.s.id)}">${esc(r.s.name)} <small>${esc(r.risk[0])}</small></button>`).join("") : `<span class="sub">Nobody pending. 🎉</span>`}</div><p class="sub">Coverage this week: ${cov}/${all.length} parents called.</p></div><div id="cent"></div>`;
  entry($("cent"), { id: "c", cls: C.cls, done: s => calledThisWeek(C.cls, s.id), tail: s => { const c = callsOf(C.cls, s.id)[0]; return c ? `${fmtD(c.date)} · ${esc(c.resp)}` : ""; }, pick: callOpen });
}
A.cPick = b => callOpen(b.dataset.id);
function callOpen(id) {
  const s = stuById(id), h = callsOf(C.cls, id).slice(0, 3), r = stats(C.cls).rows.find(x => x.s.id === id);
  sheet(`<h2>${esc(s.name)}</h2>${r && r.risk.length ? `<p>${r.risk.map(x => pill(x, "bad")).join(" ")}</p>` : ""}${h.length ? `<div class="hist">${h.map(c => `<div class="hr"><span>${fmtD(c.date)} · ${esc(c.resp)}${c.r ? " · " + esc(c.r) : ""}</span></div>`).join("")}</div>` : ""}
   <div class="row"><input id="cd" type="date" value="${today()}" aria-label="Call date"><select id="cr" aria-label="Parent's response">${RESP.map(x => `<option>${x}</option>`).join("")}</select></div><p><input id="cn" placeholder="Remark (optional)" style="width:100%"></p>
   <div class="row"><button class="btn" data-a="cSave" data-id="${esc(id)}" style="flex:2">Save &amp; next</button><button class="btn alt" data-a="cSkip" data-id="${esc(id)}">Skip</button></div><div class="err" id="e2"></div>`);
}
A.cSkip = b => { if (!closeSheet()) return; const n = entryNext("c", b.dataset.id); if (n) callOpen(n.id); };
A.cSave = b => busy(b, async () => {
  const sid = b.dataset.id;
  try { await patch(P.k("calls", C.cls), [{ k: "items." + uid("c"), v: { sid, date: $("cd").value, resp: $("cr").value, r: $("cn").value.trim(), by: S.me.name, t: Date.now() } }]); } catch (x) { return $("e2").textContent = x.message; }
  dirty = false; cCall($("cbody")); const n = entryNext("c", sid); n ? callOpen(n.id) : closeSheet(true); toast("Call logged");
});

/* ----- fee clearance ----- */
function cFee(host) {
  if (!S.cfg.terms.length) return host.innerHTML = noAccess("The admin has not added fee terms yet (Admin → Settings).");
  if (!S.cfg.terms.includes(C.term)) C.term = S.cfg.terms[0];
  const all = classStudents(C.cls), recs = all.map(s => feeRec(C.cls, C.term, s.id)), due = recs.reduce((n, r) => n + (r ? r.due : 0), 0), paid = recs.reduce((n, r) => n + feePaid(r), 0), def = recs.filter(r => feeLeft(r) > 0).length;
  host.innerHTML = `<div class="row"><select id="fterm" data-c="fTerm" aria-label="Term" style="max-width:200px">${S.cfg.terms.map(t => `<option ${t === C.term ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></div>
   <div class="kpis"><div class="kpi"><small>Due</small><b>${rupee(due)}</b></div><div class="kpi"><small>Collected</small><b>${rupee(paid)}</b></div><div class="kpi ${def ? "bad" : ""}"><small>Defaulters</small><b>${def}</b></div></div><div id="fee"></div>`;
  entry($("fee"), { id: "e", cls: C.cls, done: s => { const r = feeRec(C.cls, C.term, s.id); return !!r && feeLeft(r) === 0 && r.due > 0; }, tail: s => { const r = feeRec(C.cls, C.term, s.id); return !r ? "" : feeLeft(r) ? `<span class="pill bad">${rupee(feeLeft(r))} left</span>` : "Cleared"; }, pick: feeOpen });
}
A.fTerm = b => { C.term = b.value; cFee($("cbody")); };
function feeOpen(id) {
  const s = stuById(id), r = feeRec(C.cls, C.term, id) || { due: "", pays: [] }, prev = S.cfg.terms.map(t => feeRec(C.cls, t, id)).filter(Boolean).pop();
  sheet(`<h2>${esc(s.name)}</h2><p class="sub">${esc(C.term)} · paid ${rupee(feePaid(r))}${r.due ? " of " + rupee(r.due) : ""}</p>
   ${r.pays.length ? `<div class="hist">${r.pays.map(p => `<div class="hr"><span>${fmtD(p.d)}</span><b>${rupee(p.a)}</b></div>`).join("")}</div>` : ""}
   <div class="row"><input id="fdue" type="number" inputmode="decimal" placeholder="Amount due ₹" value="${r.due || (prev ? prev.due : "")}" aria-label="Amount due"><input id="fpay" type="number" inputmode="decimal" placeholder="Payment received ₹" aria-label="Payment received" autofocus><input id="fpd" type="date" value="${today()}" aria-label="Payment date"></div>
   <div class="row" style="margin-top:12px"><button class="btn" data-a="feeSave" data-id="${esc(id)}" style="flex:2">Save &amp; next</button><button class="btn alt" data-a="feeFull" data-id="${esc(id)}">Paid in full</button></div><div class="err" id="e2"></div>`);
}
A.feeFull = b => { const due = +$("fdue").value, r = feeRec(C.cls, C.term, b.dataset.id); if (!(due > 0)) return $("e2").textContent = "Enter the amount due first."; $("fpay").value = Math.max(0, due - feePaid(r)); };
A.feeSave = b => busy(b, async () => {
  const sid = b.dataset.id, due = +$("fdue").value, pay = +$("fpay").value, r = feeRec(C.cls, C.term, sid) || { pays: [] };
  if (!(due > 0)) return $("e2").textContent = "Enter the amount due.";
  const pays = r.pays.slice(); if (pay > 0) pays.push({ d: $("fpd").value, a: pay });
  try { await patch(P.k("fees", C.cls), [{ k: `${termKey(C.term)}.${sid}`, v: { due, pays, by: S.me.name, t: Date.now() } }]); } catch (x) { return $("e2").textContent = x.message; }
  dirty = false; cFee($("cbody")); const n = entryNext("e", sid); n ? feeOpen(n.id) : closeSheet(true); toast("Saved");
});

/* ===== insights.js ===== */
/* ===== Insights: class analytics, single-student page, printable reports ===== */
const I = { cls: "", tab: "ov", sid: "" };
V.ins = async host => {
  setTitle("Insights", "How the class is doing, student by student");
  const cs = myClasses(); if (!cs.length) return host.innerHTML = noAccess("Ask the admin to assign you a class first.");
  if (!cs.includes(I.cls)) I.cls = cs[0];
  host.innerHTML = `<div class="row" style="align-items:center"><select id="icls" data-c="iClass" aria-label="Class" style="max-width:160px">${cs.map(c => `<option ${c === I.cls ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div><div class="seg" id="itabs"></div><div id="ibody"></div>`;
  $("itabs").innerHTML = ""; $("ibody").innerHTML = SK; const t = VT;
  await bundleFast(I.cls, () => { if (!stale(t) && $("ibody")) iTab(); });
};
A.iClass = b => { I.cls = b.value; I.sid = ""; $("ibody").innerHTML = SK; const t = VT; bundleFast(I.cls, () => { if (!stale(t)) iTab(); }); };
A.iGo = b => { I.tab = b.dataset.t; iTab(); };
function iTab() {
  $("itabs").innerHTML = Object.entries({ ov: "Class overview", stu: "Student", rep: "Reports" }).map(([k, v]) => `<button class="${I.tab === k ? "on" : ""}" data-a="iGo" data-t="${k}">${v}</button>`).join("");
  ({ ov: iOverview, stu: iStudent, rep: iReports })[I.tab]($("ibody"));
}
const bar = (label, v, c) => `<div class="hb"><span>${esc(label)}</span><div class="bar"><i style="width:${Math.min(100, v || 0)}%;background:${c || "var(--green)"}"></i></div><b>${r0(v)}${v == null ? "" : "%"}</b></div>`;
const tone = v => v == null ? "var(--line)" : v >= 75 ? "var(--green)" : v >= S.cfg.passPercent + 15 ? "var(--amber)" : "var(--red)";

function iOverview(host) {
  const s = stats(I.cls), subs = subjectsOf(I.cls), ranked = s.rows.filter(r => r.avg != null).sort((a, b) => b.avg - a.avg), imp = s.rows.filter(r => r.pts.length >= 3).sort((a, b) => b.trend - a.trend).filter(r => r.trend > 0).slice(0, 3), risk = s.rows.filter(r => r.risk.length);
  host.innerHTML = `<div class="kpis"><div class="kpi"><small>Class average</small><b>${r0(s.classAvg)}${s.classAvg == null ? "" : "%"}</b></div><div class="kpi"><small>Passing</small><b>${r0(s.passRate)}${s.passRate == null ? "" : "%"}</b></div><div class="kpi"><small>Notebooks complete</small><b>${r0(s.nbPct)}${s.nbPct == null ? "" : "%"}</b></div><div class="kpi ${risk.length ? "bad" : ""}"><small>At risk</small><b>${risk.length}</b></div></div>
   <div class="grid2"><div class="card"><h3>Subject averages</h3>${subs.map(sub => bar(sub, avg(s.rows.flatMap(r => r.sub[sub] || [])), tone(avg(s.rows.flatMap(r => r.sub[sub] || []))))).join("") || `<p class="sub">No marks yet.</p>`}</div>
   <div class="card"><h3>Notebook completion by subject</h3>${subs.map(sub => { const ch = (D[P.syl(I.cls, sub)] || {}).chapters || [], en = (D[P.nb(I.cls, sub)] || {}).entries || {}, t = ch.filter(taught).length, v = []; classStudents(I.cls).forEach(st => { const d = Object.keys(en).filter(k => en[k][st.id]).sort().pop(); if (d && t) v.push(nbDone(en[d][st.id], ch) / t * 100); }); return bar(sub, avg(v), tone(avg(v))); }).join("")}</div></div>
   <div class="grid2"><div class="card"><h3>Top performers</h3>${ranked.slice(0, 5).map((r, i) => `<div class="li"><span>${i + 1}. ${esc(r.s.name)}</span><b>${r0(r.avg)}%</b></div>`).join("") || `<p class="sub">No marks yet.</p>`}<h3 style="margin-top:16px">Most improved</h3>${imp.map(r => `<div class="li"><span>${esc(r.s.name)}</span><b class="up">+${r0(r.trend)}</b></div>`).join("") || `<p class="sub">Needs 3+ tests per student.</p>`}</div>
   <div class="card"><h3>At-risk alerts</h3>${risk.map(r => `<div class="li"><button class="link" data-a="iStu" data-id="${esc(r.s.id)}">${esc(r.s.name)}</button><span class="risk">${r.risk.map(x => pill(x, "bad")).join(" ")}</span></div>`).join("") || `<p class="sub">No alerts right now.</p>`}</div></div>
   <div class="card"><h3>Recent tests</h3>${s.tests.slice(-8).reverse().map(t => `<div class="li"><span>${esc(t.name)} · ${esc(t.sub)} · ${fmtD(t.date)}</span><b>${t.n} entered · avg ${r0(t.avg)}%</b></div>`).join("") || `<p class="sub">No tests recorded.</p>`}</div>`;
}
A.iStu = b => { I.tab = "stu"; I.sid = b.dataset.id; iTab(); };
function studentPage(sid) { const s = stuById(sid); if (!s) return; I.cls = s.cls; I.sid = sid; I.tab = "stu"; go("ins"); }

function iStudent(host) {
  const list = classStudents(I.cls);
  if (!I.sid || !list.some(s => s.id === I.sid)) I.sid = list[0] ? list[0].id : "";
  host.innerHTML = `<div class="row"><select id="isid" data-c="iSid" aria-label="Student">${list.map(s => `<option value="${esc(s.id)}" ${s.id === I.sid ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select><button class="btn alt" data-a="repOne">${ic("print", 18)} Report card</button></div><div id="sbody"></div>`;
  sDraw();
}
A.iSid = b => { I.sid = b.value; sDraw(); };
function sDraw() {
  const s = stuById(I.sid); if (!s) return $("sbody").innerHTML = noAccess("No students in this class yet.");
  const st = stats(I.cls), me = st.rows.find(r => r.s.id === s.id), inch = inchargeClasses().includes(I.cls), cm = {};
  subjectsOf(I.cls).forEach(sub => cm[sub] = avg(st.rows.flatMap(r => r.sub[sub] || [])));
  let h = `<div class="card shead"><div class="av">${esc(s.name[0].toUpperCase())}</div><div><h2 style="margin:0">${esc(s.name)}</h2><p class="sub" style="margin:2px 0">Class ${esc(s.cls)} · average ${r0(me.avg)}${me.avg == null ? "" : "%"} (class ${r0(st.classAvg)}${st.classAvg == null ? "" : "%"})</p>${me.risk.map(x => pill(x, "bad")).join(" ")}</div></div>
   <div class="card"><h3>Marks trend</h3>${lineChart(me.pts.map(p => ({ x: p.sub + " " + p.x, y: p.y })), { pass: S.cfg.passPercent })}<div class="subs">${subjectsOf(I.cls).map(sub => { const v = avg(me.sub[sub] || []); return `<div class="sc"><small>${esc(sub)}</small><b style="color:${tone(v)}">${r0(v)}${v == null ? "" : "%"}</b><small>class ${r0(cm[sub])}${cm[sub] == null ? "" : "%"}</small></div>`; }).join("")}</div></div>
   <div class="card"><h3>Notebooks</h3>${subjectsOf(I.cls).map(sub => { const ch = (D[P.syl(I.cls, sub)] || {}).chapters || [], en = (D[P.nb(I.cls, sub)] || {}).entries || {}, d = Object.keys(en).filter(k => en[k][s.id]).sort().pop(), e = d && en[d][s.id]; return `<div class="nbrow"><b>${esc(sub)}</b><span class="hmr">${ch.map((c, i) => `<i class="hc ${!e || !taught(c) ? "hn" : "s" + (e.s[i] || 0)}" title="${esc(c.n)}"></i>`).join("") || "<small class='sub'>No chapters set</small>"}</span><small>${e ? fmtD(d) : "no entry"}</small></div>`; }).join("")}</div>`;
  if (inch) {
    const f = fineRows(I.cls, s.id).sort((a, b) => b.date.localeCompare(a.date)), cl = callsOf(I.cls, s.id);
    h += `<div class="grid2"><div class="card"><h3>Fines & dues</h3>${f.map(x => `<div class="li"><span>${fmtD(x.date)} · ${FTYPE[x.type]}</span><b>${rupee(x.amt)} ${x.paid ? "✓" : pill("due", "bad")}</b></div>`).join("") || `<p class="sub">None.</p>`}<div class="li"><span>Pending total</span><b>${rupee(fineDue(I.cls, s.id))}</b></div></div>
     <div class="card"><h3>Fee status</h3>${S.cfg.terms.map(t => { const r = feeRec(I.cls, t, s.id); return `<div class="li"><span>${esc(t)}</span><b>${!r ? "—" : feeLeft(r) ? pill(rupee(feeLeft(r)) + " left", "bad") : "Cleared ✓"}</b></div>`; }).join("")}</div></div>
     <div class="card"><h3>Parent calls</h3>${cl.slice(0, 6).map(c => `<div class="li"><span>${fmtD(c.date)} · ${esc(c.resp)}${c.r ? " · " + esc(c.r) : ""}</span></div>`).join("") || `<p class="sub">No calls logged.</p>`}</div>`;
  }
  $("sbody").innerHTML = h;
}

/* ----- reports (print / save as PDF from the browser) ----- */
function iReports(host) {
  const inch = inchargeClasses().includes(I.cls);
  host.innerHTML = `<div class="card"><h3>Print or save as PDF</h3><p class="sub">Opens the print dialog. Choose "Save as PDF" to keep a copy.</p><div class="row"><button class="btn" data-a="repSheet">Class marks sheet</button><button class="btn" data-a="repCards">Report cards (whole class)</button>${inch ? `<button class="btn" data-a="repDef">Defaulters list</button>` : ""}</div></div>`;
  host.insertAdjacentHTML("beforeend", exportHTML()); xPer();
}
function printHTML(html) { $("print").innerHTML = html; setTimeout(() => print(), 50); }
const rhead = t => `<div class="rh"><b>${esc(S.cfg.school)}</b><span>${esc(t)} · ${fmtD(today())}</span></div>`;
A.repSheet = () => {
  const st = stats(I.cls), subs = subjectsOf(I.cls);
  printHTML(`${rhead("Class " + I.cls + " marks sheet")}<table class="pt"><tr><th>Student</th>${subs.map(s => `<th>${esc(s)} %</th>`).join("")}<th>Overall %</th><th>Notebook %</th></tr>${st.rows.map(r => `<tr><td>${esc(r.s.name)}</td>${subs.map(s => `<td>${r0(avg(r.sub[s] || []))}</td>`).join("")}<td><b>${r0(r.avg)}</b></td><td>${r0(r.nb)}</td></tr>`).join("")}<tr><td><b>Class average</b></td>${subs.map(s => `<td>${r0(avg(st.rows.flatMap(r => r.sub[s] || [])))}</td>`).join("")}<td><b>${r0(st.classAvg)}</b></td><td>${r0(st.nbPct)}</td></tr></table>`);
};
function cardHTML(r, st) {
  const subs = subjectsOf(I.cls), inch = inchargeClasses().includes(I.cls), tests = r.pts.slice().sort((a, b) => a.sub.localeCompare(b.sub) || a.date.localeCompare(b.date));
  return `<section class="rc">${rhead("Progress report")}<h2>${esc(r.s.name)} <small>Class ${esc(I.cls)}</small></h2>
   <table class="pt"><tr><th>Subject</th><th>Tests</th><th>Average</th><th>Class avg</th><th>Notebook</th></tr>${subs.map(s => { const v = r.sub[s] || [], ch = (D[P.syl(I.cls, s)] || {}).chapters || [], en = (D[P.nb(I.cls, s)] || {}).entries || {}, d = Object.keys(en).filter(k => en[k][r.s.id]).sort().pop(), t = ch.filter(taught).length; return `<tr><td>${esc(s)}</td><td>${v.length}</td><td><b>${r0(avg(v))}</b></td><td>${r0(avg(st.rows.flatMap(x => x.sub[s] || [])))}</td><td>${d && t ? Math.round(nbDone(en[d][r.s.id], ch) / t * 100) + "%" : "—"}</td></tr>`; }).join("")}<tr><td><b>Overall</b></td><td>${r.pts.length}</td><td><b>${r0(r.avg)}</b></td><td>${r0(st.classAvg)}</td><td>${r0(r.nb)}</td></tr></table>
   <div class="rbars">${subs.map(s => bar(s, avg(r.sub[s] || []), "#2d8a7a")).join("")}</div>
   <h4>Test details</h4><table class="pt">${tests.map(p => `<tr><td>${esc(p.sub)}</td><td>${esc(p.x)}</td><td>${fmtD(p.date)}</td><td>${Math.round(p.y)}%</td></tr>`).join("") || "<tr><td>No tests recorded.</td></tr>"}</table>
   ${inch ? `<p>Fines pending: <b>${rupee(fineDue(I.cls, r.s.id))}</b> · Fees pending: <b>${rupee(S.cfg.terms.reduce((n, t) => n + feeLeft(feeRec(I.cls, t, r.s.id)), 0))}</b></p>` : ""}${r.risk.length ? `<p>Attention: ${esc(r.risk.join(", "))}</p>` : ""}<div class="sig"><span>Class teacher</span><span>Parent</span></div></section>`;
}
A.repCards = () => { const st = stats(I.cls); printHTML(st.rows.map(r => cardHTML(r, st)).join("")); };
A.repOne = () => { const st = stats(I.cls), r = st.rows.find(x => x.s.id === I.sid); if (r) printHTML(cardHTML(r, st)); };
A.repDef = () => {
  const rows = classStudents(I.cls).map(s => ({ s, f: fineDue(I.cls, s.id), t: S.cfg.terms.map(t => ({ t, l: feeLeft(feeRec(I.cls, t, s.id)) })).filter(x => x.l > 0) })).filter(x => x.f || x.t.length);
  printHTML(`${rhead("Class " + I.cls + " defaulters")}<table class="pt"><tr><th>Student</th><th>Fines pending</th><th>Fees pending</th><th>Total</th></tr>${rows.map(x => `<tr><td>${esc(x.s.name)}</td><td>${rupee(x.f)}</td><td>${x.t.map(y => esc(y.t) + ": " + rupee(y.l)).join("<br>") || "—"}</td><td><b>${rupee(x.f + x.t.reduce((n, y) => n + y.l, 0))}</b></td></tr>`).join("") || "<tr><td>No defaulters 🎉</td></tr>"}</table>`);
};

/* ===== admin.js ===== */
/* ===== Admin: profiles, students, settings ===== */
const AD = { tab: "users", users: [], cls: "" };
const ROLE = { admin: "Admin", teacher: "Teacher", incharge: "Teacher" };
V.admin = async host => {
  setTitle("Admin", "People, students and school settings");
  if (S.me.role !== "admin") return host.innerHTML = noAccess("Only the admin can open this page.");
  host.innerHTML = `<div class="seg">${Object.entries({ users: "Teachers", students: "Students", set: "Settings" }).map(([k, v]) => `<button class="${AD.tab === k ? "on" : ""}" data-a="adGo" data-t="${k}">${v}</button>`).join("")}</div><div id="adb"></div>`;
  ({ users: adUsers, students: adStudents, set: adSettings })[AD.tab]($("adb"));
};
A.adGo = b => { AD.tab = b.dataset.t; V.admin($("view")); };

async function adUsers(host) {
  host.innerHTML = `<p class="sub">Loading…</p>`;
  try { AD.users = (await api("GET", "/admin/users")).users; } catch (e) { return host.innerHTML = noAccess(e.message); }
  host.innerHTML = `<div class="row between"><b>${AD.users.length} profiles</b><button class="btn" data-a="uEdit" data-u="">Add teacher</button></div>` + AD.users.map(u => `<div class="card urow ${u.active ? "" : "off"}"><div><b>${esc(u.name)}</b> <small class="sub">@${esc(u.username)}</small><br>${pill(ROLE[u.role])}${u.inchargeOf ? " " + pill("Incharge of " + u.inchargeOf, "ok") : ""}${u.active ? "" : " " + pill("Deactivated", "bad")}<div class="sub">${u.role === "admin" ? "Full access" : (u.assignments.map(a => a.cls + " " + a.sub).join(", ") || "No subjects assigned")}</div></div>
   <div class="row"><button class="btn alt sm" data-a="uEdit" data-u="${esc(u.username)}">Edit</button><button class="btn alt sm" data-a="uPin" data-u="${esc(u.username)}">Reset PIN</button>${u.username !== S.me.username ? `<button class="btn alt sm" data-a="uDel" data-u="${esc(u.username)}">Delete</button>` : ""}</div></div>`).join("");
}
A.uEdit = b => {
  const u = AD.users.find(x => x.username === b.dataset.u) || { username: "", name: "", role: "teacher", inchargeOf: null, assignments: [], active: true }, isNew = !u.username;
  sheet(`<h2>${isNew ? "New profile" : "Edit " + esc(u.name)}</h2><div class="form"><input id="uu" placeholder="Username (letters, digits)" value="${esc(u.username)}" ${isNew ? "" : "disabled"} autocapitalize="none" autofocus><input id="un" placeholder="Full name" value="${esc(u.name)}">
   <select id="ur" data-c="uRole" aria-label="Role">${Object.entries({ admin: "Admin (sees and edits everything)", teacher: "Teacher" }).map(([k, v]) => `<option value="${k}" ${(u.role === "admin") === (k === "admin") ? "selected" : ""}>${v}</option>`).join("")}</select>
   <label id="uil" class="${u.role === "admin" ? "hide" : ""}">Class incharge of (optional)<select id="ui"><option value="">Not an incharge</option>${S.cfg.classes.map(c => `<option ${u.inchargeOf === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
   <input id="up" type="password" inputmode="numeric" maxlength="6" placeholder="${isNew ? "PIN (4–6 digits)" : "New PIN (leave blank to keep)"}"></div>
   <div id="uasg" class="${u.role === "admin" ? "hide" : ""}"><p class="sub">Subjects this teacher teaches. If they are incharge of a class they automatically get every subject of that class, so tick only subjects in other classes.</p>${S.cfg.classes.map(c => `<div class="asg"><b>${esc(c)}</b>${S.cfg.subjects.map(s => `<label class="cb"><input type="checkbox" data-c="${esc(c)}" data-s="${esc(s)}" ${u.assignments.some(a => a.cls === c && a.sub === s) ? "checked" : ""}> ${esc(s)}</label>`).join("")}</div>`).join("")}</div>
   <label class="cb"><input type="checkbox" id="ua" ${u.active ? "checked" : ""}> Active (can log in)</label>
   <p></p><div class="row"><button class="btn" data-a="uSave" style="flex:2">Save profile</button><button class="btn alt" data-a="close">Cancel</button></div><div class="err" id="e2"></div>`);
};
A.uRole = b => { $("uil").classList.toggle("hide", b.value === "admin"); $("uasg").classList.toggle("hide", b.value === "admin"); };
A.uSave = b => busy(b, async () => {
  const body = { username: $("uu").value.trim(), name: $("un").value.trim(), role: $("ur").value, inchargeOf: $("ui").value, pin: $("up").value, active: $("ua").checked, assignments: [...document.querySelectorAll("#uasg input:checked")].map(i => ({ cls: i.dataset.c, sub: i.dataset.s })) };
  try { await api("POST", "/admin/user", body); } catch (x) { return $("e2").textContent = x.message; }
  closeSheet(true); toast("Profile saved"); adUsers($("adb"));
});
A.uPin = async b => { const pin = prompt("New PIN for " + b.dataset.u + " (4–6 digits):"); if (!pin) return; try { await api("POST", "/admin/reset-pin", { username: b.dataset.u, pin }); toast("PIN reset"); } catch (x) { toast(x.message, true); } };
A.uDel = async b => { if (!confirm("Delete " + b.dataset.u + "? Their entered records are kept.")) return; try { await api("POST", "/admin/user/delete", { username: b.dataset.u }); adUsers($("adb")); } catch (x) { toast(x.message, true); } };

function adStudents(host) {
  if (!S.cfg.classes.includes(AD.cls)) AD.cls = S.cfg.classes[0];
  const list = classStudents(AD.cls);
  host.innerHTML = `<div class="row"><select id="adc" data-c="adCls" aria-label="Class">${S.cfg.classes.map(c => `<option ${c === AD.cls ? "selected" : ""}>${esc(c)}</option>`).join("")}</select><button class="btn" data-a="sEdit" data-id="">Add student</button><button class="btn alt" data-a="sBulk">Import list</button></div>
   <div class="card"><b>${list.length} students in ${esc(AD.cls)}</b>${list.map(s => `<div class="li"><span>${esc(s.name)}${s.roll ? ` <small class="sub">roll ${esc(s.roll)}</small>` : ""}</span><span><button class="link" data-a="sEdit" data-id="${esc(s.id)}">Edit</button><button class="link" data-a="sDel" data-id="${esc(s.id)}">Remove</button></span></div>`).join("") || `<p class="sub">No students yet.</p>`}</div>`;
}
A.adCls = b => { AD.cls = b.value; adStudents($("adb")); };
const nextSid = () => "s" + (Math.max(0, ...S.students.map(s => +(/^s(\d+)$/.exec(s.id) || [0, 0])[1])) + 1);
async function saveStudents(list) { await api("POST", "/admin/students", { students: list }); S.students = list; }
A.sEdit = b => {
  const s = S.students.find(x => x.id === b.dataset.id) || { id: "", name: "", cls: AD.cls, roll: "" };
  sheet(`<h2>${s.id ? "Edit student" : "Add student"}</h2><div class="form"><input id="sn" placeholder="Full name" value="${esc(s.name)}" autofocus><select id="sc" aria-label="Class">${S.cfg.classes.map(c => `<option ${s.cls === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select><input id="sr" placeholder="Roll no. (optional)" value="${esc(s.roll || "")}"></div><p></p><div class="row"><button class="btn" data-a="sSave" data-id="${esc(s.id)}" style="flex:2">Save</button><button class="btn alt" data-a="close">Cancel</button></div><div class="err" id="e2"></div>`);
};
A.sSave = b => busy(b, async () => {
  const name = $("sn").value.trim(); if (!name) return $("e2").textContent = "Enter a name.";
  const rec = { id: b.dataset.id || nextSid(), name, cls: $("sc").value, roll: $("sr").value.trim() || undefined };
  const list = b.dataset.id ? S.students.map(s => s.id === rec.id ? rec : s) : [...S.students, rec];
  try { await saveStudents(list); } catch (x) { return $("e2").textContent = x.message; }
  AD.cls = rec.cls; closeSheet(true); adStudents($("adb"));
});
A.sDel = async b => { const s = stuById(b.dataset.id); if (!confirm("Remove " + s.name + " from the student list? Past marks stay in the records.")) return; try { await saveStudents(S.students.filter(x => x.id !== s.id)); adStudents($("adb")); } catch (x) { toast(x.message, true); } };
A.sBulk = () => sheet(`<h2>Import students</h2><p class="sub">One per line: <b>Name, Class</b> (e.g. Riya Sharma, 7A). Existing students are kept.</p><textarea id="sb" rows="8" autofocus></textarea><p></p><div class="row"><button class="btn" data-a="sBulkGo" style="flex:2">Import</button><button class="btn alt" data-a="close">Cancel</button></div><div class="err" id="e2"></div>`);
A.sBulkGo = b => busy(b, async () => {
  const add = [], bad = []; let n = Math.max(0, ...S.students.map(s => +(/^s(\d+)$/.exec(s.id) || [0, 0])[1]));
  $("sb").value.split("\n").map(l => l.trim()).filter(Boolean).forEach(l => { const [name, cls] = l.split(",").map(x => x.trim()); if (name && S.cfg.classes.includes(cls)) add.push({ id: "s" + (++n), name, cls }); else bad.push(l); });
  if (bad.length) return $("e2").textContent = "Check these lines (class must exist): " + bad.slice(0, 3).join(" | ");
  if (!add.length) return $("e2").textContent = "Nothing to import.";
  try { await saveStudents([...S.students, ...add]); } catch (x) { return $("e2").textContent = x.message; }
  closeSheet(true); toast(add.length + " students added"); adStudents($("adb"));
});

async function adSettings(host) {
  const c = S.cfg;
  host.innerHTML = `<div class="card" id="shcard"><h3>Google Sheets backup</h3><p class="sub" id="shst">Checking…</p><div class="row"><button class="btn alt" data-a="shTest">Test connection</button><button class="btn" data-a="shSync">Sync all data now</button></div><div class="sub" id="shlog" role="status"></div></div>
   <div class="card"><h3>School settings</h3><div class="form"><label>School name<input id="cs" value="${esc(c.school)}"></label><label>Classes (comma separated, letters/digits)<input id="cc" value="${esc(c.classes.join(", "))}"></label><label>Subjects<input id="cu" value="${esc(c.subjects.join(", "))}"></label><label>Monitor categories<input id="cm" value="${esc(c.monitorCategories.join(", "))}"></label><label>Fee terms<input id="ct" value="${esc(c.terms.join(", "))}"></label><label>Non-English fine (₹)<input id="cf" type="number" value="${c.nonEnglishFine}"></label><label>Pass mark (%)<input id="cp" type="number" value="${c.passPercent}"></label></div><p></p><button class="btn" data-a="cfgSave">Save settings</button><div class="err" id="e2"></div></div><div class="card"><h3>Recent admin activity</h3><div id="aud" class="sub">Loading…</div></div>`;
  shStatus();
  try { const l = (await api("GET", "/admin/audit")).log.slice(0, 12); $("aud").innerHTML = l.map(x => `<div class="li"><span>${esc(x.who)} ${esc(x.what)}</span><small>${new Date(x.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small></div>`).join("") || "Nothing yet."; } catch { $("aud").textContent = ""; }
}
A.cfgSave = b => busy(b, async () => {
  const l = id => $(id).value.split(",").map(x => x.trim()).filter(Boolean);
  const config = { school: $("cs").value.trim(), classes: l("cc"), subjects: l("cu"), monitorCategories: l("cm"), terms: l("ct"), nonEnglishFine: +$("cf").value, passPercent: +$("cp").value };
  try { await api("POST", "/admin/config", { config }); S.cfg = await api("GET", "/config"); toast("Settings saved"); buildNav(); } catch (x) { $("e2").textContent = x.message; }
});

/* ----- Google Sheets mirror ----- */
async function shStatus() {
  try {
    const s = await api("GET", "/admin/sheets/status");
    $("shst").innerHTML = !s.configured ? `Not connected yet. Follow <b>GOOGLE_SHEETS_SETUP.md</b> (about 5 minutes), then press <b>Test connection</b>.`
      : `<span class="ok">Connected.</span> Every mark, notebook entry, fine, call and fee payment is copied to your Google Sheet as soon as it is saved.` + (s.lastError ? `<br><span style="color:var(--red)">Last problem: ${esc(s.lastError)}. Press “Sync all data now” to catch up.</span>` : "");
  } catch (e) { if ($("shst")) $("shst").textContent = e.message; }
}
A.shTest = b => busy(b, async () => {
  $("shlog").textContent = "Testing…";
  try { const r = await api("POST", "/admin/sheets/test"); $("shlog").innerHTML = `<span class="ok">Working.</span> Connected to “${esc(r.name)}” · <a href="${esc(r.url)}" target="_blank" rel="noopener">Open the sheet</a>`; shStatus(); }
  catch (e) { $("shlog").innerHTML = `<span style="color:var(--red)">${esc(e.message)}</span>`; }
});
A.shSync = b => busy(b, async () => {
  if (!confirm("Copy ALL saved records to the Google Sheet now? Existing rows are updated, nothing is duplicated.")) return;
  const jobs = [{ students: true, t: "student list" }];
  S.cfg.classes.forEach(c => { jobs.push({ cls: c, t: "class " + c + " fines, calls, fees, monitors" }); S.cfg.subjects.forEach(s => jobs.push({ cls: c, sub: s, t: c + " " + s })); });
  let rows = 0;
  for (let i = 0; i < jobs.length; i++) {
    $("shlog").textContent = `Syncing ${jobs[i].t} (${i + 1}/${jobs.length})…`;
    const { t, ...body } = jobs[i];
    try { rows += (await api("POST", "/admin/sheets/sync", body)).rows; } catch (e) { $("shlog").innerHTML = `<span style="color:var(--red)">Stopped at ${esc(t)}: ${esc(e.message)}</span>`; return; }
  }
  $("shlog").innerHTML = `<span class="ok">Done.</span> ${rows} rows are up to date in the Google Sheet.`; shStatus();
});

/* ===== export.js ===== */
/* ===== Excel export: pick class(es), a period (date / month / year / all time) and which records to include ===== */
const X = { mode: "month" };
const XSETS = [["nb", "Notebook checking record"], ["test", "Test record"], ["fee", "Fees record", 1], ["call", "Calls record", 1], ["fine", "Fines & dues record", 1], ["all", "Combined data (one summary row per student)"]];

function exportHTML() {
  const cs = myClasses(), hasInch = inchargeClasses().length > 0;
  return `<div class="card" id="xcard"><h3>Export to Excel</h3><p class="sub">Choose a class, a time period and what to include. You get one Excel file with a sheet for each record type.</p>
   <div class="form"><label>Class<select id="xcls">${cs.length > 1 ? `<option value="*">All my classes (${cs.length})</option>` : ""}${cs.map(c => `<option ${c === I.cls ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label></div>
   <div class="seg" id="xmodes">${[["date", "Date"], ["month", "Month"], ["year", "Year"], ["all", "All time"]].map(([k, v]) => `<button data-a="xMode" data-m="${k}" class="${X.mode === k ? "on" : ""}">${v}</button>`).join("")}</div><div id="xper"></div>
   <div class="xsets" id="xsets">${XSETS.map(([k, v, inc]) => `<label class="cb ${inc && !hasInch ? "dis" : ""}"><input type="checkbox" value="${k}" ${inc && !hasInch ? "disabled" : (k === "nb" || k === "test" ? "checked" : "")}> ${v}${inc ? `<small>incharge only</small>` : ""}</label>`).join("")}</div>
   <button class="btn" data-a="xGo">${ic("print", 18)} Download Excel</button><div class="err" id="xerr" role="alert"></div></div>`;
}
function xPer() {
  const y = new Date().getFullYear(), t = today(), el = $("xper"); if (!el) return;
  el.innerHTML = X.mode === "date" ? `<div class="row"><label class="fl">From<input id="xf" type="date" value="${t}"></label><label class="fl">To<input id="xt" type="date" value="${t}"></label></div><p class="sub">Use the same date in both boxes for a single day.</p>`
    : X.mode === "month" ? `<label class="fl">Month<input id="xm" type="month" value="${t.slice(0, 7)}"></label>`
    : X.mode === "year" ? `<label class="fl">Year<select id="xy">${[y + 1, y, y - 1, y - 2, y - 3].map(v => `<option ${v === y ? "selected" : ""}>${v}</option>`).join("")}</select></label>`
    : `<p class="sub">Everything recorded so far.</p>`;
}
A.xMode = b => { X.mode = b.dataset.m; document.querySelectorAll("#xmodes button").forEach(x => x.classList.toggle("on", x === b)); xPer(); };
function xRange() {
  if (X.mode === "date") { const f = $("xf").value, t = $("xt").value; if (!f || !t || f > t) throw new Error("Pick a valid From and To date."); return { from: f, to: t, label: f === t ? f : f + "_to_" + t, text: f === t ? f : f + " to " + t }; }
  if (X.mode === "month") { const m = $("xm").value; if (!m) throw new Error("Pick a month."); return { from: m + "-01", to: m + "-31", label: m, text: "Month " + m }; }
  if (X.mode === "year") { const y = $("xy").value; return { from: y + "-01-01", to: y + "-12-31", label: y, text: "Year " + y }; }
  return { from: "0000-00-00", to: "9999-99-99", label: "all-time", text: "All time" };
}
let xlsxP = null;
const loadXlsx = () => window.XLSX ? Promise.resolve() : (xlsxP = xlsxP || new Promise((res, rej) => { const s = document.createElement("script"); s.src = "vendor/xlsx.mini.min.js"; s.onload = res; s.onerror = () => { xlsxP = null; rej(new Error("Could not load the Excel tool. Check your internet connection.")); }; document.head.appendChild(s); }));
const pc = (m, x) => x ? Math.round(m / x * 1000) / 10 : "";

A.xGo = b => busy(b, async () => {
  $("xerr").textContent = "";
  try {
    const sets = new Set([...document.querySelectorAll("#xsets input:checked")].map(i => i.value)); if (!sets.size) throw new Error("Tick at least one record type.");
    const rg = xRange(), sel = $("xcls").value, classes = sel === "*" ? myClasses() : [sel], inR = d => !!d && d >= rg.from && d <= rg.to, inchC = inchargeClasses();
    await loadXlsx();
    const out = {}, add = (name, h, row) => (out[name] = out[name] || { h, rows: [] }).rows.push(row), skipped = [];
    const H = { test: ["Class", "Subject", "Test", "Date", "Student", "Marks", "Out of", "Percent", "Remark", "Entered by"], nb: ["Class", "Subject", "Date", "Student", "Chapters done", "Chapters checked", "Percent", "Chapter details", "Remark", "Entered by"],
      pay: ["Class", "Term", "Student", "Payment date", "Amount paid", "Term fee", "Entered by"], bal: ["Class", "Term", "Student", "Amount due", "Paid so far", "Balance", "Status"], call: ["Class", "Student", "Date", "Parent's response", "Remark", "Entered by"],
      fine: ["Class", "Student", "Date", "Type", "Amount", "Paid", "Paid on", "Remark", "Entered by"] };
    const subs = S.cfg.subjects, HC = ["Class", "Student", "Tests taken", "Average %", ...subs.map(s => s + " %"), "Notebook checks", "Notebook %", "Calls made", "Last call", "Last response", "Fines added", "Fines pending now", "Fee paid in period", "Fee balance now"];
    for (const c of classes) {
      toast("Collecting class " + c + "…"); await bundle(c, true);
      const stu = classStudents(c), isInch = inchC.includes(c), acc = {};
      stu.forEach(s => acc[s.id] = { pts: [], sub: {}, nbP: [], calls: [], fAdd: 0, fPend: 0, fPaid: 0, fBal: 0 });
      subjectsOf(c).forEach(sub => {
        const mf = D[P.marks(c, sub)] || {}, ch = (D[P.syl(c, sub)] || {}).chapters || [], en = (D[P.nb(c, sub)] || {}).entries || {}, tc = ch.filter(taught).length;
        Object.entries(mf.tests || {}).filter(([, t]) => inR(t.date)).sort((a, z) => a[1].date.localeCompare(z[1].date)).forEach(([tid, t]) => stu.forEach(s => {
          const e = getAt(mf, ["marks", tid, s.id]);
          if (sets.has("test")) add("Test record", H.test, [c, sub, t.name, t.date, s.name, e ? e.m : "", e ? e.max : t.max, e ? pc(e.m, e.max) : "", e ? (e.r || "") : "Not entered", e ? (e.by || "") : ""]);
          if (e) { const p = e.m / e.max * 100; acc[s.id].pts.push(p); (acc[s.id].sub[sub] = acc[s.id].sub[sub] || []).push(p); }
        }));
        Object.keys(en).filter(inR).sort().forEach(d => stu.forEach(s => {
          const e = en[d][s.id]; if (!e) return; const done = nbDone(e, ch);
          if (sets.has("nb")) add("Notebook record", H.nb, [c, sub, d, s.name, done, tc, pc(done, tc), ch.map((x, i) => taught(x) ? `${x.n}: ${["pending", "done", "partial"][e.s[i] || 0]}` : null).filter(Boolean).join("; "), e.r || "", e.by || ""]);
          if (tc) acc[s.id].nbP.push(done / tc * 100);
        }));
      });
      if (isInch) {
        const fees = S.cfg.terms;
        stu.forEach(s => fees.forEach(t => {
          const r = feeRec(c, t, s.id); if (!r) return; const left = feeLeft(r);
          (r.pays || []).filter(p => inR(p.d)).forEach(p => { acc[s.id].fPaid += p.a; if (sets.has("fee")) add("Fees - payments", H.pay, [c, t, s.name, p.d, p.a, r.due, r.by || ""]); });
          acc[s.id].fBal += left; if (sets.has("fee")) add("Fees - balances", H.bal, [c, t, s.name, r.due, feePaid(r), left, left === 0 ? "Cleared" : feePaid(r) > 0 ? "Partial" : "Unpaid"]);
        }));
        callsOf(c).filter(k => inR(k.date)).reverse().forEach(k => { const s = stuById(k.sid); if (!s || !acc[s.id]) return; acc[s.id].calls.push(k); if (sets.has("call")) add("Calls record", H.call, [c, s.name, k.date, k.resp, k.r || "", k.by || ""]); });
        fineRows(c).sort((a, z) => a.date.localeCompare(z.date)).forEach(f => { const s = stuById(f.sid); if (!s || !acc[s.id]) return; if (!f.paid) acc[s.id].fPend += f.amt; if (inR(f.date)) { acc[s.id].fAdd += f.amt; if (sets.has("fine")) add("Fines record", H.fine, [c, s.name, f.date, FTYPE[f.type] || f.type, f.amt, f.paid ? "Yes" : "No", f.pd || "", f.r || "", f.by || ""]); } });
      } else if (["fee", "call", "fine"].some(k => sets.has(k)) || sets.has("all")) skipped.push(c);
      if (sets.has("all")) stu.forEach(s => { const a = acc[s.id], lc = a.calls[a.calls.length - 1]; add("Combined", HC, [c, s.name, a.pts.length, a.pts.length ? Math.round(avg(a.pts) * 10) / 10 : "", ...subs.map(x => a.sub[x] ? Math.round(avg(a.sub[x]) * 10) / 10 : ""), a.nbP.length, a.nbP.length ? Math.round(avg(a.nbP) * 10) / 10 : "", isInch ? a.calls.length : "", lc ? lc.date : "", lc ? lc.resp : "", isInch ? a.fAdd : "", isInch ? a.fPend : "", isInch ? a.fPaid : "", isInch ? a.fBal : ""]); });
    }
    const order = ["Combined", "Test record", "Notebook record", "Fees - payments", "Fees - balances", "Calls record", "Fines record"], names = order.filter(n => out[n]);
    const total = names.reduce((n, k) => n + out[k].rows.length, 0); if (!total) throw new Error("No records found for " + rg.text + ".");
    const wb = XLSX.utils.book_new(), sheet = (n, h, rows) => { const ws = XLSX.utils.aoa_to_sheet([h, ...rows]); ws["!cols"] = h.map((x, i) => ({ wch: Math.min(48, Math.max(String(x).length, ...rows.slice(0, 300).map(r => String(r[i] ?? "").length)) + 2) })); XLSX.utils.book_append_sheet(wb, ws, n.slice(0, 31)); };
    sheet("Info", ["Item", "Details"], [["School", S.cfg.school], ["Classes", classes.join(", ")], ["Period", rg.text], ["Included", names.join(", ")], ["Exported by", S.me.name], ["Exported on", new Date().toLocaleString("en-IN")], ...(skipped.length ? [["Note", "Fees, calls and fines are only included for classes where you are the incharge. Not included for: " + skipped.join(", ")]] : [])]);
    names.forEach(n => sheet(n, out[n].h, out[n].rows));
    XLSX.writeFile(wb, `School-Records_${sel === "*" ? "all-classes" : sel}_${rg.label}.xlsx`);
    toast(`Excel file ready: ${total} rows`);
  } catch (e) { $("xerr").textContent = e.message; }
});

/* ===== app.js ===== */
/* ===== App shell: login, navigation, dashboard, profile ===== */
let cur = "home", pin = "", sel = "", sw = false;
const deviceId = () => localStorage.did || (localStorage.did = crypto.randomUUID());
const rec = () => { try { return JSON.parse(localStorage.recent || "[]"); } catch { return []; } };
const remember = (u, n) => localStorage.recent = JSON.stringify([{ u, n }, ...rec().filter(x => x.u !== u)].slice(0, 4));

/* ----- login ----- */
function renderAcct() {
  const r = rec(), a = $("acct"), inp = $("user");
  if (!sw && r.length) { const c = r.find(x => x.u === sel) || r[0]; sel = c.u; inp.classList.add("hide"); a.innerHTML = `<div class="av">${esc(c.n[0] || "?").toUpperCase()}</div><b>${esc(c.n)}</b><p><button class="link" data-a="lgSwitch">Switch user</button></p>`; }
  else if (r.length) { inp.classList.add("hide"); a.innerHTML = r.map(x => `<button class="st" data-a="lgPick" data-u="${esc(x.u)}">${esc(x.n)}</button>`).join("") + `<button class="st" data-a="lgOther">Another user…</button>`; }
  else { a.innerHTML = ""; inp.classList.remove("hide"); }
}
A.lgSwitch = () => { sw = true; pin = ""; drawPad(); renderAcct(); };
A.lgPick = b => { sel = b.dataset.u; sw = false; renderAcct(); };
A.lgOther = () => { sel = ""; $("acct").innerHTML = ""; $("user").classList.remove("hide"); $("user").focus(); };
const drawPad = () => $("dots").innerHTML = [0, 1, 2, 3, 4, 5].map(i => `<i class="${i < pin.length ? "f" : ""}"></i>`).join("");
$("pad").innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, "⌫", 0, "Go"].map(k => `<button data-k="${k}" aria-label="${k === "⌫" ? "Delete" : k}">${k}</button>`).join("");
async function doLogin() {
  const uname = (sel || $("user").value).trim().toLowerCase(); $("err").textContent = "";
  if (!uname) return $("err").textContent = "Enter your username.";
  if (pin.length < 4) return $("err").textContent = "PIN must be 4 to 6 digits.";
  try { const r = await api("POST", "/login", { username: uname, pin, device: deviceId() }); token = r.token; localStorage.tok = token; remember(uname, r.user.name); S.me = r.user; await start(); }
  catch (x) { $("err").textContent = x.message; pin = ""; drawPad(); }
}
$("pad").onclick = e => { const k = e.target.dataset.k; if (!k) return; if (k === "⌫") pin = pin.slice(0, -1); else if (k === "Go") return doLogin(); else if (pin.length < 6) pin += k; drawPad(); };
addEventListener("keydown", e => { if (!$("login").classList.contains("hide") && !e.target.matches("#user")) { if (/^\d$/.test(e.key) && pin.length < 6) { pin += e.key; drawPad(); } else if (e.key === "Backspace") { pin = pin.slice(0, -1); drawPad(); } else if (e.key === "Enter") doLogin(); } else if (e.key === "Enter" && e.target.matches("#user")) $("pad").querySelector("[data-k=Go]").focus(); });

/* ----- start / shell ----- */
async function start() {
  [S.cfg, S.students] = await Promise.all([api("GET", "/config"), api("GET", "/students")]);
  $("login").classList.add("hide"); $("app").classList.remove("hide"); $("avb").textContent = S.me.name[0].toUpperCase();
  buildNav(); renderSide(); go("home"); flushQueue(); syncBadge();
  setTimeout(() => { const c = inchargeClasses()[0]; if (c && c !== H.cls) bundleFast(c, () => { }, true).catch(() => { }); }, 800);   // warm up the incharge screens
}
function buildNav() {
  const items = [["home", "home", "Home"], ["marks", "marks", "Test marks"], ["nb", "book", "Notebooks"]];
  if (inchargeClasses().length) items.push(["cls", "cls", "My class"]);
  items.push(["ins", "chart", "Insights"]); if (S.me.role === "admin") items.push(["admin", "admin", "Admin"]);
  items.push(["out", "out", "Log out"]);
  $("nav").innerHTML = items.map(([v, i, t]) => `<button data-a="nav" data-v="${v}" aria-label="${t}" title="${t}" class="${v === cur ? "on" : ""}">${ic(i)}</button>`).join("");
}
A.nav = b => b.dataset.v === "out" ? A.logout() : go(b.dataset.v);
A.logout = () => { api("POST", "/logout").catch(() => { }).finally(() => { localStorage.removeItem("tok"); location.reload(); }); };
async function go(v) {
  if (!closeSheet()) return; cur = v; VT++; buildNav(); $("view").innerHTML = SK; $("gres").innerHTML = "";
  try { await V[v]($("view")); } catch (e) { $("view").innerHTML = `<div class="card empty"><b>Could not load this page</b><p class="sub">${esc(e.message)}</p></div>`; }
  scrollTo(0, 0);
}
const roleLine = () => S.me.role === "admin" ? "Admin" : (S.me.inchargeOf ? "Teacher · Incharge of " + S.me.inchargeOf : "Teacher");

/* ----- global student search ----- */
$("gq").oninput = e => {
  const q = e.target.value.trim().toLowerCase();
  $("gres").innerHTML = q ? S.students.filter(s => s.name.toLowerCase().includes(q)).slice(0, 6).map(s => `<button class="st" data-a="gStu" data-id="${esc(s.id)}"><span>${esc(s.name)}</span><small>${esc(s.cls)}</small></button>`).join("") || `<p class="sub" style="padding:8px">No match</p>` : "";
};
A.gStu = b => { $("gq").value = ""; $("gres").innerHTML = ""; studentPage(b.dataset.id); };

/* ----- profile ----- */
A.profile = () => sheet(`<div class="pf"><div class="av">${esc(S.me.name[0].toUpperCase())}</div><h2>${esc(S.me.name)}</h2><p class="sub">@${esc(S.me.username)} · ${esc(roleLine())}</p></div>
  <h3>Change PIN</h3><div class="row"><input id="op" type="password" inputmode="numeric" maxlength="6" placeholder="Current PIN" aria-label="Current PIN"><input id="np" type="password" inputmode="numeric" maxlength="6" placeholder="New PIN (4–6 digits)" aria-label="New PIN"></div>
  <p></p><div class="row"><button class="btn" data-a="pinSave" style="flex:2">Save new PIN</button><button class="btn alt" data-a="logout">Log out</button></div><div class="err" id="e2"></div>`);
A.pinSave = b => busy(b, async () => { try { await api("POST", "/pin/change", { oldPin: $("op").value, newPin: $("np").value }); closeSheet(true); toast("PIN changed"); } catch (x) { $("e2").textContent = x.message; } });

/* ----- right panel (profile + this week's monitors over the school skyline) ----- */
const SKY = `<svg class="sky" viewBox="0 0 300 250" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs><linearGradient id="gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d8a7a"/><stop offset="1" stop-color="#0b4a4a"/></linearGradient></defs>
 <circle cx="238" cy="52" r="20" fill="#dfe97a" opacity=".9"/><g fill="#fff" opacity=".35"><ellipse cx="60" cy="40" rx="30" ry="7"/><ellipse cx="90" cy="48" rx="22" ry="6"/></g>
 <rect x="0" y="212" width="300" height="38" fill="url(#gw)"/>
 <g><path d="M0 212 Q40 188 90 206 T190 204 T300 196 V214 H0z" fill="#5bb98c"/><path d="M0 220 Q70 204 150 218 T300 212 V232 H0z" fill="#2d8a7a" opacity=".8"/></g>
 <g><rect x="92" y="150" width="116" height="62" fill="#e9f5ef"/><rect x="72" y="172" width="26" height="40" fill="#cfe8dd"/><rect x="202" y="172" width="26" height="40" fill="#cfe8dd"/><polygon points="86,150 150,112 214,150" fill="#0b4a4a"/><rect x="138" y="128" width="24" height="22" fill="#dfe97a"/><line x1="150" y1="112" x2="150" y2="88" stroke="#e9f5ef" stroke-width="2"/><polygon points="150,88 170,95 150,102" fill="#e2574c"/>
 ${[104, 124, 166, 186].map(x => `<rect x="${x}" y="164" width="14" height="18" rx="2" fill="#2d8a7a"/>`).join("")}<rect x="140" y="186" width="20" height="26" rx="3" fill="#0b4a4a"/>${[78, 206].map(x => `<rect x="${x}" y="182" width="14" height="14" rx="2" fill="#2d8a7a"/>`).join("")}</g>
 <g><rect x="34" y="180" width="5" height="32" fill="#0b4a4a"/><circle cx="36" cy="172" r="17" fill="#5bb98c"/><rect x="258" y="186" width="5" height="26" fill="#0b4a4a"/><circle cx="260" cy="178" r="14" fill="#2d8a7a"/></g></svg>`;
function renderSide() {
  const cls = myClasses().includes(H.cls) ? H.cls : myClasses()[0];
  $("side").innerHTML = `<div class="sp"><div class="av big2">${esc(S.me.name[0].toUpperCase())}</div><b>${esc(S.me.name)}</b><small>${esc(roleLine())}</small><button class="btn pillbtn" data-a="profile">${ic("edit", 16)} Edit profile</button>
   <div class="sbox"><small>Class</small><b>${cls ? esc(cls) : "—"}</b><span class="arrow">${esc(todayLabel())}</span></div></div><h2 class="sch">${esc(S.cfg.school)}</h2>${SKY}`;
}
const todayLabel = () => new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
$("avb").onclick = () => A.profile();

/* ----- dashboard ----- */
const H = { cls: "" };
V.home = async host => {
  setTitle("Hello, " + S.me.name.split(" ")[0], "Let's check your progress");
  const cs = myClasses(); if (!cs.length) return host.innerHTML = noAccess("No class or subject is assigned to you yet. Ask the admin.");
  if (!cs.includes(H.cls)) H.cls = cs[0];
  host.innerHTML = SK; const t = VT;
  await bundleFast(H.cls, () => { if (!stale(t)) homeDraw(host); });
};
function homeDraw(host) {
  const cs = myClasses(), cls = H.cls, st = stats(cls), inch = inchargeClasses().includes(cls), all = classStudents(cls), subs = subjectsOf(cls), T = today();
  const risk = st.rows.filter(r => r.risk.length), enteredToday = new Set(), month = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10), fort = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
  subs.forEach(s => Object.entries(((D[P.nb(cls, s)] || {}).entries || {})[T] || {}).forEach(([sid]) => enteredToday.add(sid)));
  const pend = st.rows.reduce((n, r) => n + (r.nbT ? r.nbInc : 0), 0), calls = inch ? risk.filter(r => !calledThisWeek(cls, r.s.id)).length : 0;
  const fdue = inch ? fineDue(cls) : 0, fdef = inch ? all.filter(s => S.cfg.terms.some(t => feeLeft(feeRec(cls, t, s.id)) > 0)).length : 0;
  const card = (tag, big, wave, pl, s1, s2) => `<div class="stat"><div class="tag">${tag}<b>${big}</b></div><div class="wave">${spark(wave)}<span class="pl">${pl}</span></div><div><small>${s1[0]}</small><strong>${s1[1]}</strong></div><div><small>${s2[0]}</small><strong>${s2[1]}</strong></div></div>`;
  const cards = card("Marks", r0(st.classAvg) + (st.classAvg == null ? "" : "%"), st.tests.map(t => t.avg).filter(x => x != null).slice(-8), r0(st.passRate) + (st.passRate == null ? "" : "% pass"), ["Tests recorded", st.tests.length], ["Students at risk", risk.length]) +
    card("Books", r0(st.nbPct) + (st.nbPct == null ? "" : "%"), [], enteredToday.size + "/" + all.length + " today", ["Chapters pending", pend], ["Subjects", subs.length]) +
    (inch ? card("Dues", rupee(fdue), [], fdef + " owing", ["Fee defaulters", fdef], ["Calls due", calls]) : "");
  const cov = [["Subjects tested (30 days)", subs.length ? subs.filter(s => Object.values((D[P.marks(cls, s)] || {}).tests || {}).some(t => t.date >= month)).length / subs.length * 100 : 0], ["Notebooks today", all.length ? enteredToday.size / all.length * 100 : 0]];
  if (inch) cov.push(["Parent calls this week", all.length ? all.filter(s => calledThisWeek(cls, s.id)).length / all.length * 100 : 0]);
  const ring = avg(cov.map(c => c[1])), C2 = 2 * Math.PI * 52;
  const todo = [];
  subs.forEach(s => { const ts = Object.values((D[P.marks(cls, s)] || {}).tests || {}); if (!ts.some(t => t.date >= fort)) todo.push(["marks", "marks", `${s}: no test recorded in 2 weeks`, `${cls} ${s}`]); });
  subs.forEach(s => { const ch = (D[P.syl(cls, s)] || {}).chapters || [], n = Object.keys(((D[P.nb(cls, s)] || {}).entries || {})[T] || {}).length; if (ch.length && n < all.length) todo.push(["nb", "book", `${all.length - n} students pending notebook entry`, `${cls} ${s}`]); });
  if (inch && calls) todo.push(["cls", "phone", `${calls} parent calls to make`, "Class " + cls]);
  if (inch && fdef) todo.push(["cls", "coin", `${fdef} students with fees pending`, "Class " + cls]);
  const cats = S.cfg.monitorCategories;
  host.innerHTML = `${cs.length > 1 ? `<div class="row chips">${cs.map(c => `<button class="chip ${c === cls ? "on" : ""}" data-a="hCls" data-c="${esc(c)}">Class ${esc(c)}</button>`).join("")}</div>` : ""}
   <div class="hero"><div class="stats">${cards}</div>
   <div class="card statc"><h3>Statistics</h3><div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="var(--line)" stroke-width="6"/><circle cx="60" cy="60" r="52" fill="none" stroke="var(--deep)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C2 * ring / 100} ${C2}" transform="rotate(-90 60 60)"/></svg><div class="rc2">${ic("cap", 34)}</div></div>${cov.map(c => `<div class="hb2"><div class="row between"><small>${c[0]}</small><b>${Math.round(c[1])}%</b></div><div class="bar"><i style="width:${c[1]}%"></i></div></div>`).join("")}</div></div>
   <div class="grid2"><div class="card"><h3>${inch && cats.length ? "This week's monitors" : "Your subjects"}</h3>${inch && cats.length ? `<div class="gantt">${cats.map((c, i) => { const m = monitorFor(cls, 0, i); return `<div class="grow"><span>${esc(c)}</span><i class="mp p${i % 3}" style="margin-left:${(i * 9) % 36}%">${m.s ? esc(m.s.name) : "—"}</i></div>`; }).join("")}</div>` : `<div class="row chips">${subs.map(s => `<span class="chip">${esc(s)}</span>`).join("")}</div>`}</div>
   <div class="card"><h3>To do</h3>${todo.slice(0, 5).map(t => `<button class="todo" data-a="nav" data-v="${t[0]}"><span class="tic">${ic(t[1], 20)}</span><span><b>${esc(t[2])}</b><small>${esc(t[3])}</small></span></button>`).join("") || `<p class="sub">All caught up. 🎉</p>`}<p style="text-align:center"><button class="btn" data-a="nav" data-v="marks">Enter test marks</button></p></div></div>`;
  renderSide();
}
A.hCls = b => { H.cls = b.dataset.c; V.home($("view")); };

/* ----- auto-sync: other teachers' entries appear in the incharge's screens without reloading ----- */
function refreshView() {
  if (document.hidden || !token || !S.me || !$("sheet").classList.contains("hide")) return;
  if (document.activeElement && document.activeElement.matches("input,select,textarea")) return;
  const t = VT, ok = () => !stale(t);
  if (cur === "home" && H.cls) bundleFast(H.cls, () => ok() && homeDraw($("view")), true).catch(() => { });
  else if (cur === "cls" && C.cls) bundleFast(C.cls, () => ok() && $("cbody") && cTab(), true).catch(() => { });
  else if (cur === "ins" && I.cls) bundleFast(I.cls, () => ok() && $("ibody") && iTab(), true).catch(() => { });
  else if (cur === "marks" && M.path && $("m-ls")) { const b = JSON.stringify(D[M.path]); load([M.path], true).then(() => { if (ok() && JSON.stringify(D[M.path]) !== b) entryDraw("m"); }).catch(() => { }); }
  else if (cur === "nb" && N.ep && $("n-ls")) { const b = JSON.stringify(D[N.ep]); load([N.ep], true).then(() => { if (ok() && JSON.stringify(D[N.ep]) !== b) entryDraw("n"); }).catch(() => { }); }
}
setInterval(refreshView, 25000); document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshView(); });

/* ----- boot ----- */
renderAcct(); drawPad(); document.querySelector(".gi").innerHTML = ic("search", 18);
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => { });
if (token) api("GET", "/me").then(r => { S.me = r; return start(); }).catch(() => { });

