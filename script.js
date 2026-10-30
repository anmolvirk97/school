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
Object.assign(IC, {
  lock: '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 7l3 3"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>', plus: '<path d="M12 5v14M5 12h14"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', chevr: '<path d="M9 6l6 6-6 6"/>',
  backspace: '<path d="M20 5H9l-6 7 6 7h11a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="M13 10l4 4M17 10l-4 4"/>' });
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
const busy = async (btn, fn) => { BUSYN++; if (btn) { btn.disabled = true; btn.classList.add("ld"); } try { return await fn(); } finally { BUSYN--; if (btn) { btn.disabled = false; btn.classList.remove("ld"); } } };

/* ---------- API + offline queue ---------- */
async function api(method, path, body) {
  let r;
  const hdr = { "Content-Type": "application/json", Authorization: "Bearer " + token }; if (BG > 0) hdr["X-Bg"] = "1"; else { lastAct = Date.now(); lastPing = lastAct; }      // background refreshes do not count as activity
  try { r = await fetch(WORKER_URL + path, { method, headers: hdr, body: body ? JSON.stringify(body) : undefined }); }
  catch (e) { throw Object.assign(new Error("You are offline."), { offline: true }); }
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== "/login" && path !== "/logout") { endSession(j.error || "Please sign in again."); throw new Error(j.error || "Signed out"); }
  if (!r.ok) { const e = new Error(j.error || "Request failed (" + r.status + ")"); if (j.conflict) e.conflict = j.conflict; if (j.code) e.code = j.code; if (j.other) e.other = j.other; throw e; }
  return j;
}
const Q = { get: () => { try { return JSON.parse(localStorage.q || "[]"); } catch { return []; } }, set: a => { localStorage.q = JSON.stringify(a); syncBadge(); } };
function syncBadge() { const n = Q.get().length, p = pend(), b = $("sync"); if (b) { b.classList.toggle("hide", !n && !p && navigator.onLine); b.textContent = n ? n + " waiting to sync" : p ? "Saving…" : "Offline"; } }
async function flushQueue() {
  let q = Q.get(); if (!q.length || !token) return;
  while (q.length) {
    try { await api("POST", "/patch", q[0]); q.shift(); Q.set(q); }
    catch (e) { if (e.offline) return; q.shift(); Q.set(q); toast(e.conflict ? "An entry saved offline was not applied because someone else changed that record first. Please check it." : "One saved entry could not be synced: " + e.message, true); }
  }
  toast("Offline entries synced");
}
addEventListener("online", () => { syncBadge(); flushQueue(); }); addEventListener("offline", syncBadge); setInterval(() => { BG++; try { flushQueue(); } finally { BG--; } }, 20000);

/* ---------- data files: cached, offline-aware, edited with safe patches ---------- */
/* SHA[path] = the version of that file we hold; FT[path] = when the server last confirmed it is current.
   A refresh sends the versions; the server answers "unchanged" for files that did not change, so nothing is downloaded, parsed or re-saved for them. */
const SHA = {}, FT = {};
const fresh = (ps, ttl) => ps.every(p => FT[p] && Date.now() - FT[p] < ttl);
async function loadX(paths, force) {
  const need = paths.filter(p => (force || !(p in D)) && !(typeof PQ !== "undefined" && PQ[p] && (PQ[p].busy || PQ[p].items.length))), changed = [];
  if (need.length) {
    try {
      const have = {}; need.forEach(p => { if (SHA[p] && p in D) have[p] = SHA[p]; });
      const r = await api("POST", "/bulk", { paths: need, have }), docs = r.d || r, ver = r.v || {}, same = new Set(r.same || []), now = Date.now();
      need.forEach(p => {
        if (same.has(p) && p in D) { FT[p] = now; return; }
        const nd = docs[p] || {};
        if (!(p in D) || JSON.stringify(D[p]) !== JSON.stringify(nd)) { changed.push(p); D[p] = nd; try { localStorage["c_" + p] = JSON.stringify(nd); } catch { } }
        if (ver[p]) { SHA[p] = ver[p]; try { localStorage["h_" + p] = ver[p]; } catch { } }
        FT[p] = now;
      });
    }
    catch (e) { if (!e.offline) throw e; need.forEach(p => { try { D[p] = JSON.parse(localStorage["c_" + p]); } catch { D[p] = {}; } }); toast("Offline - showing the last saved copy"); }
  }
  return { docs: paths.map(p => D[p]), changed };
}
const load = async (paths, force) => (await loadX(paths, force)).docs;
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

/* instant saves: the screen updates at once; a background queue sends the changes to the server in batches */
const PQ = {}, pend = () => Object.values(PQ).reduce((n, q) => n + q.items.length + (q.busy ? 1 : 0), 0);
function patchQ(path, ops, onFail) {
  const old = ops.map(op => getAt(D[path] || {}, op.k.split(".")));
  ops.forEach(op => setAt(path, op.k, op.v));
  try { localStorage["c_" + path] = JSON.stringify(D[path]); } catch { }
  (PQ[path] = PQ[path] || { items: [], busy: false }).items.push({ ops, old, onFail }); syncBadge(); pqRun(path);
}
async function pqRun(path) {
  const q = PQ[path]; if (q.busy) return; q.busy = true; syncBadge();
  try {
    while (q.items.length) {
      let n = 0, size = 0;
      if (!q.items[0].solo) while (n < q.items.length && !q.items[n].solo && size + q.items[n].ops.length <= 150) size += q.items[n++].ops.length;
      n = Math.max(n, 1); const batch = q.items.splice(0, n);
      try { await api("POST", "/patch", { path, ops: batch.flatMap(b => b.ops) }); }
      catch (e) {
        if (e.offline) { batch.forEach(b => Q.set([...Q.get(), { path, ops: b.ops }])); toast("Saved on this phone. It will sync when you're back online."); continue; }
        if (batch.length > 1) { batch.forEach(b => b.solo = true); q.items.unshift(...batch); continue; }      // find out which entry was refused
        const b = batch[0]; b.ops.forEach((op, i) => setAt(path, op.k, b.old[i] === undefined ? null : b.old[i])); try { localStorage["c_" + path] = JSON.stringify(D[path]); } catch { }
        b.onFail ? b.onFail(e) : (toast("Not saved: " + e.message, true), redrawNow());
      }
    }
  } finally { q.busy = false; syncBadge(); if (q.items.length) pqRun(path); }
}
function patchQAll(path, ops, onFail) { chunk(ops, 150).forEach(part => patchQ(path, part, onFail)); }
function redrawNow() {
  try {
    if (cur === "marks" && $("m-ls")) entryDraw("m"); else if (cur === "nb" && $("nbody")) nbDraw(); else if (cur === "cls" && $("cbody")) cTab(); else if (cur === "ins" && $("ibody")) iTab();
  } catch { }
}
addEventListener("beforeunload", e => { if (pend()) { e.preventDefault(); e.returnValue = ""; } });
const when = t => t ? new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
/* Two people saved the same record: show who/what/when and let the user decide. Nothing is overwritten silently. */
function conflictSheet(title, theirs, mine, keepAct, mineAct, extra) {
  sheet(`<h2>${esc(title)}</h2><p><b>${esc(theirs.by || "Someone")}</b> saved this ${theirs.t ? "at <b>" + when(theirs.t) + "</b> " : ""}while you were editing.</p>
   <div class="cf"><div><small>Their entry</small><b>${theirs.text}</b></div><div><small>Your entry</small><b>${mine.text}</b></div></div>${extra || ""}
   <div class="row"><button class="btn alt" data-a="${keepAct}" style="flex:1">Keep theirs</button><button class="btn" data-a="${mineAct}" style="flex:1">Use mine</button></div>`);
}

/* ---------- bottom sheet (entry card) with unsaved-change guard ---------- */
let dirty = false;
const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
function sheet(html) { const s = $("sheet"); $("veil").classList.remove("hide"); s.classList.remove("hide"); s.innerHTML = html; s.insertAdjacentHTML("afterbegin", `<button type="button" class="xclose" data-a="close" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`); dirty = false; s.oninput = () => dirty = true; const f = s.querySelector("[autofocus]"); if (f) setTimeout(() => { try { f.focus({ preventScroll: true }); } catch { } }, 240); }
const sheetL = h => { sheet(h); $("sheet").oninput = null; };
function closeSheet(force) { if (dirty && !force && !confirm("Discard what you typed for this entry?")) return false; $("veil").classList.add("hide"); $("sheet").classList.add("hide"); $("sheet").classList.remove("wide"); $("sheet").innerHTML = ""; dirty = false; return true; }
$("veil").onclick = () => closeSheet();
addEventListener("keydown", e => { if (e.key === "Escape" && !$("sheet").classList.contains("hide")) closeSheet(); });
A.close = () => closeSheet();
document.addEventListener("change", e => { const b = e.target.closest("[data-c]"); if (b && A[b.dataset.c]) A[b.dataset.c](b, e); });
document.addEventListener("click", e => { const b = e.target.closest("[data-a]"); if (b && A[b.dataset.a]) { const r = A[b.dataset.a](b, e); if (r && typeof r.then === "function" && !b.classList.contains("ld")) { b.classList.add("ld"); r.then(() => b.classList.remove("ld"), () => b.classList.remove("ld")); } } });

/* ---------- which class/subject pairs can this user touch? (the worker enforces the same rule) ---------- */
/* ---------- subjects belong to a class: the class incharge decides them (cfg.classSubjects), the admin's list is the default ---------- */
const classSubList = c => { const x = (S.cfg.classSubjects || {})[c]; return x && Array.isArray(x.list) && x.list.length ? x.list : S.cfg.subjects; };
const subMode = (c, sub) => ((((S.cfg.classSubjects || {})[c] || {}).mode || {})[sub]) || "marks";   // marks | grade (exams get a grade) | split (exam = theory + assessment)
const allSubs = () => [...new Set([...S.cfg.subjects, ...Object.values(S.cfg.classSubjects || {}).flatMap(x => x.list || [])])];
const gradeList = () => S.cfg.grades && S.cfg.grades.length ? S.cfg.grades : ["A+", "A", "B+", "B", "C", "D", "E"];
const numE = e => !!e && !e.ab && !e.g && e.m != null && e.max > 0;              // an entry that counts as marks (grade entries never do)
function pairs() {
  const me = S.me, cfg = S.cfg, out = [];
  const add = (cls, sub) => { if (cfg.classes.includes(cls) && classSubList(cls).includes(sub) && !out.some(p => p.cls === cls && p.sub === sub)) out.push({ cls, sub }); };
  if (me.role === "admin") cfg.classes.forEach(c => classSubList(c).forEach(s => add(c, s)));
  else { if (me.inchargeOf) classSubList(me.inchargeOf).forEach(s => add(me.inchargeOf, s)); (me.assignments || []).forEach(a => add(a.cls, a.sub)); }
  const cr = [...new Set(out.map(p => p.cls))];
  return out.sort((a, b) => cr.indexOf(a.cls) - cr.indexOf(b.cls) || classSubList(a.cls).indexOf(a.sub) - classSubList(b.cls).indexOf(b.sub));
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
   <div class="bar"><i id="${o.id}-bar"></i></div>${o.note ? `<div class="notes">${o.note}</div>` : ""}${o.tools ? `<div class="row tools">${o.tools}</div>` : ""}
   <div class="eflow"><div class="alpha" id="${o.id}-al" role="group" aria-label="Jump to letter"></div><div id="${o.id}-ls" class="elist"></div></div></div>`;
  $(o.id + "-q").oninput = e => { ENT[o.id].q = e.target.value.toLowerCase(); entryDraw(o.id); };
  entryDraw(o.id);
}
function entryDraw(id) {
  const o = ENT[id], all = classStudents(o.cls), done = all.filter(s => o.done(s)).length;
  $(id + "-cnt").textContent = o.counter ? `${done}/${all.length} entered` : `${all.length} students`; $(id + "-bar").style.width = (o.counter && all.length ? done / all.length * 100 : 0) + "%";
  $(id + "-bar").parentNode.classList.toggle("hide", !o.counter);
  const has = new Set(all.map(s => s.name[0].toUpperCase()));
  $(id + "-al").innerHTML = `<button data-a="eLetter" data-e="${id}" data-l="" class="all ${o.letter || o.q ? "" : "on"}">All</button>` + "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => `<button data-a="eLetter" data-e="${id}" data-l="${l}" class="${l === o.letter ? "on" : ""}" ${has.has(l) ? "" : "disabled"}>${l}</button>`).join("");
  const list = all.filter(s => o.q ? s.name.toLowerCase().includes(o.q) : (!o.letter || s.name[0].toUpperCase() === o.letter));
  $(id + "-ls").innerHTML = list.map(s => `<button class="st ${o.done(s) ? "done" : ""}" data-a="ePick" data-e="${id}" data-id="${esc(s.id)}"><span>${esc(s.name)}</span><span class="tail">${o.tail ? o.tail(s) : ""}</span></button>`).join("") || `<p class="sub">No students found.</p>`;
}
A.eLetter = b => { const o = ENT[b.dataset.e], l = b.dataset.l; o.letter = !l || o.letter === l ? "" : l; o.q = ""; const q = $(o.id + "-q"); if (q) q.value = ""; entryDraw(o.id); };
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
function bundlePaths(cls) { const p = []; subjectsOf(cls).forEach(s => p.push(P.marks(cls, s), P.nb(cls, s), P.syl(cls, s))); if (inchargeClasses().includes(cls)) ["fines", "calls", "fees", "monitors", "attendance"].forEach(k => p.push(P.k(k, cls))); return p; }
async function bundleFast(cls, render, quiet) {
  const paths = bundlePaths(cls);
  paths.forEach(p => { if (!(p in D)) { try { const c = localStorage["c_" + p]; if (c) { D[p] = JSON.parse(c); SHA[p] = localStorage["h_" + p] || ""; } } catch { } } });
  const had = paths.every(p => p in D);
  if (had && !quiet) render();
  if (had && fresh(paths, quiet ? 40000 : 30000)) return;          // the server confirmed these files a moment ago: no request at all
  let res; try { res = await loadX(paths, true); } catch (e) { if (!had) throw e; return; }
  if (!had || res.changed.length) render();
}
/* keep the keyboard from covering the entry card (phones/tablets) */
if (window.visualViewport) {
  const vv = visualViewport, fit = () => { const s = $("sheet"); if (!s) return; const kb = Math.max(0, innerHeight - vv.height - vv.offsetTop); s.style.bottom = kb > 80 ? kb + 8 + "px" : ""; s.style.maxHeight = kb > 80 ? Math.max(260, vv.height - 20) + "px" : ""; };
  vv.addEventListener("resize", fit); vv.addEventListener("scroll", fit);
}
document.addEventListener("focusin", e => { if (e.target.closest("#sheet")) setTimeout(() => e.target.scrollIntoView({ block: "nearest", behavior: "smooth" }), 320); });
const setTitle = (t, s) => { $("ttl").textContent = t; $("sbt").textContent = s || ""; };

/* ===== analytics.js ===== */
/* ===== Data bundles + analytics shared by dashboard, student page, reports ===== */
const P = { marks: (c, s) => `data/marks/${c}_${s}.json`, nb: (c, s) => `data/notebook/${c}_${s}.json`, syl: (c, s) => `data/syllabus/${c}_${s}.json`, k: (k, c) => `data/${k}/${c}.json` };
async function bundle(cls, force) {
  const paths = []; subjectsOf(cls).forEach(s => paths.push(P.marks(cls, s), P.nb(cls, s), P.syl(cls, s)));
  const inch = inchargeClasses().includes(cls); if (inch) ["fines", "calls", "fees", "monitors", "attendance"].forEach(k => paths.push(P.k(k, cls)));
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
      Object.entries(ms).forEach(([sid, e]) => { if (!st[sid] || !numE(e)) return; const p = e.m / e.max * 100; st[sid].pts.push({ x: t.name, y: p, date: t.date, sub, term: !!t.term }); (st[sid].sub[sub] = st[sid].sub[sub] || []).push(p); vals.push(p); });
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
const calledThisWeek = (cls, sid, kind = "fb") => callsOf(cls, sid).some(c => c.date >= weekStart() && (c.kind === "fee" ? "fee" : "fb") === kind);
const weekIdx = d => Math.floor((d.getTime() / 864e5 + 3) / 7);

/* ===== modules.js ===== */
/* ===== Test marks + Notebooks ===== */
let M = {}, MH = { all: false };
const mk = sid => getAt(D[M.path] || {}, ["marks", M.tid, sid]);
const mTxt = e => e.ab ? "Absent" : e.g ? "Grade " + e.g + (e.m != null ? " · " + e.m + "/" + e.max : "") : e.th != null ? e.m + "/" + e.max + " (" + e.th + " + " + e.as + ")" : e.m + "/" + e.max;
const tMaxTxt = (t, c, s) => t.term && subMode(c, s) === "grade" ? "graded" : t.amax != null ? `out of ${t.max} (${t.tmax} theory + ${t.amax} assessment)` : `out of ${t.max}`;
const tLbl = (c, sub, t) => t.term && subMode(c, sub) === "grade" ? "Grade" : "/" + t.max;

V.marks = async host => {
  setTitle("Test marks", "Set the test once, then tap names to enter marks.");
  if (!pairs().length) return host.innerHTML = noAccess("Ask the admin to assign a class and subject to you.");
  host.innerHTML = `<div class="card"><div class="row">${pairHTML("m")}</div><div class="row"><input id="tname" placeholder="Test name (e.g. Unit 1)"><input id="max" type="number" inputmode="numeric" placeholder="Max marks"><input id="tdate" type="date" value="${today()}" aria-label="Test date"></div><p></p><button class="btn" data-a="mStart">Start entry</button></div>
   <div id="mhist"></div><div id="mentry"></div>`;
  fillPair("m"); A.pairDone_m = mHist; mHist();
};
/* test history: every test of the chosen class + subject, with open / edit / delete */
async function mHist() {
  const c = $("mc") && $("mc").value, s = $("ms") && $("ms").value; if (!c || !s || !$("mhist")) return;
  const path = P.marks(c, s); await load([path], true);
  if (!$("mhist") || $("mc").value !== c || $("ms").value !== s) return;
  const f = D[path] || {}, all = Object.entries(f.tests || {}).sort((a, b) => b[1].date.localeCompare(a[1].date)), list = MH.all ? all : all.slice(0, 5), n = classStudents(c).length;
  $("mhist").innerHTML = all.length ? `<div class="card"><div class="row between"><b>Test history · ${esc(c)} ${esc(s)}</b>${all.length > 5 ? `<button class="link" data-a="mHAll">${MH.all ? "Show recent" : "Show all " + all.length}</button>` : ""}</div>${list.map(([id, t]) => { const e = Object.keys((f.marks || {})[id] || {}).length; return `<div class="trow"><div><b>${esc(t.name)}</b>${t.term ? " " + pill("Term") : ""}<br><small>${fmtD(t.date)} · ${tMaxTxt(t, c, s)} · ${e}/${n} entered</small></div><div class="row"><button class="btn alt sm" data-a="mResume" data-t="${esc(id)}">Open</button><button class="btn alt sm" data-a="mEditT" data-t="${esc(id)}">Edit</button><button class="btn alt sm" data-a="mDelT" data-t="${esc(id)}">Delete</button></div></div>`; }).join("")}</div>` : "";
}
A.mHAll = () => { MH.all = !MH.all; mHist(); };
A.mResume = b => busy(b, () => mRun($("mentry"), $("mc").value, $("ms").value, b.dataset.t));
A.mStart = b => busy(b, async () => {
  const c = $("mc").value, s = $("ms").value, name = $("tname").value.trim(), max = +$("max").value, date = $("tdate").value;
  if (!name || !(max > 0) || !date) return toast("Add a test name, max marks and date.", true);
  const path = P.marks(c, s); await load([path], true);
  const same = Object.entries(D[path].tests || {}).find(([, t]) => !t.term && t.name.toLowerCase() === name.toLowerCase() && t.date === date), tid = same ? same[0] : slug(name) + "_" + date;
  if (!same) patchQ(path, [{ k: "tests." + tid, v: { name, date, max, by: S.me.name } }], e => { toast("The test was not saved: " + e.message, true); if (M.tid === tid) { $("mentry").innerHTML = ""; M = {}; } mHist(); });
  await mRun($("mentry"), c, s, tid, false, true); mHist();
});
/* open the name list for one test (used by unit tests and term exams) */
async function mRun(host, c, s, tid, quiet, local) {
  const path = P.marks(c, s); await load([path], !local);
  const t = getAt(D[path], ["tests", tid]); if (!t) return toast("That test no longer exists.", true);
  M = { path, cls: c, sub: s, tid, max: t.max, t, mode: t.term ? subMode(c, s) : "marks" };
  entry(host, { id: "m", cls: c, note: `<b>${esc(t.name)}</b> · ${esc(s)} · ${tMaxTxt(t, c, s)} · ${fmtD(t.date)}`,
    tools: `<button class="btn alt sm" data-a="mAbs">Mark remaining absent</button><button class="btn alt sm" data-a="mManage">Edit / delete entries</button>`,
    done: x => !!mk(x.id), tail: x => { const e = mk(x.id); return e ? esc(mTxt(e)) : ""; }, pick: mOpen });
  if (!quiet) host.scrollIntoView({ behavior: "smooth" });
}
function mOpen(id) {
  const s = stuById(id), e = mk(id) || { m: "", max: M.max, r: "" }, md = M.mode, T = M.t || {};
  let body;
  if (md === "grade") body = `<p class="sub">Award a grade for this exam. Marks are optional and are not printed on mark sheets or report cards.</p><select id="mg" aria-label="Grade" autofocus><option value="">Choose grade</option>${gradeList().map(g => `<option ${e.g === g ? "selected" : ""}>${esc(g)}</option>`).join("")}</select><p></p><div class="row mid"><input class="big" id="mm" type="number" inputmode="decimal" aria-label="Marks (optional)" enterkeyhint="done" value="${e.m ?? ""}" placeholder="Marks (optional)"><b>/</b><input class="big" id="mx" type="number" inputmode="decimal" aria-label="Max marks" value="${e.max || M.max || ""}" placeholder="Max"></div>`;
  else if (md === "split") body = `<p class="sub">Total = theory + assessment (out of ${M.max}). Only the total is printed on mark sheets and report cards.</p><div class="row mid"><label class="fl">Theory<input class="big" id="mth" type="number" inputmode="decimal" value="${e.th ?? ""}" placeholder="0" autofocus></label><b>/ ${T.tmax ?? "?"}</b></div><div class="row mid"><label class="fl">Assessment<input class="big" id="mas" type="number" inputmode="decimal" enterkeyhint="done" value="${e.as ?? ""}" placeholder="0"></label><b>/ ${T.amax ?? "?"}</b></div><p class="sub" id="mtot"></p>`;
  else body = `<div class="row mid"><input class="big" id="mm" type="number" inputmode="decimal" aria-label="Marks" enterkeyhint="done" value="${e.m ?? ""}" placeholder="0" autofocus><b>/</b><input class="big" id="mx" type="number" aria-label="Max marks" value="${e.max}"></div>`;
  sheet(`<h2>${esc(s.name)}</h2>${e.ab ? `<p class="sub">Currently marked absent.</p>` : ""}${body}
   <p><input id="mr" placeholder="Remark (optional)" value="${esc(e.r || "")}" style="width:100%"></p>
   <div class="row"><button class="btn" data-a="mSave" data-id="${esc(id)}" style="flex:2">Save &amp; next</button><button class="btn alt" data-a="mSkip" data-id="${esc(id)}">Skip</button></div>
   <div class="row"><button class="btn alt sm" data-a="mAbsOne" data-id="${esc(id)}">Absent / did not give test</button>${mk(id) ? `<button class="btn alt sm" data-a="mDelOne" data-id="${esc(id)}">Delete entry</button>` : ""}</div><div class="err" id="e2"></div>`);
  $("sheet").onkeydown = ev => { if (ev.key === "Enter" && ev.target.tagName !== "SELECT") A.mSave($("sheet").querySelector("[data-a=mSave]")); };
  if (md === "split") { const upd = () => { const a = $("mth").value, b = $("mas").value; $("mtot").textContent = a !== "" || b !== "" ? "Total: " + Math.round(((+a || 0) + (+b || 0)) * 100) / 100 + " / " + M.max : ""; }; ["mth", "mas"].forEach(i => $(i).addEventListener("input", upd)); upd(); }
}
A.mSkip = b => { if (!closeSheet()) return; const n = entryNext("m", b.dataset.id); n ? mOpen(n.id) : 0; };
async function mPut(id, rec) {
  const old = mk(id), path = M.path, tid = M.tid, name = stuById(id).name;
  patchQ(path, [{ k: `marks.${tid}.${id}`, v: rec, base: old && old.t != null ? old.t : null }], e => {
    const here = M.path === path && M.tid === tid; if (here) entryDraw("m");
    if (here && e.conflict && e.conflict[0].current) return mConflict(id, rec, e.conflict[0].current);
    toast(name + ": marks were not saved. " + e.message, true);
  });
  entryDraw("m"); const n = entryNext("m", id); dirty = false; n ? mOpen(n.id) : closeSheet(true);
}
A.mSave = b => busy(b, async () => {
  const id = b.dataset.id, r = $("mr").value.trim(), by = S.me.name, t = Date.now(), er = x => ($("e2").textContent = x);
  if (M.mode === "grade") {                                        // term exam of a grade subject: grade required, marks optional
    const g = $("mg").value, v = $("mm").value, mx = +$("mx").value || 0; if (!g) return er("Choose a grade.");
    const rec = { g }; if (v !== "") { if (!(mx > 0)) return er("Enter the max marks too, or clear the marks."); if (+v < 0 || +v > mx) return er("Marks must be between 0 and " + mx + "."); rec.m = +v; rec.max = mx; }
    return mPut(id, Object.assign(rec, { r, by, t }));
  }
  if (M.mode === "split") {                                        // term exam of a theory + assessment subject
    const T = M.t || {}, a = $("mth").value, c = $("mas").value;
    if (!(T.tmax > 0 && T.amax > 0)) return er("This exam has no theory / assessment maximum. Set it again in Term exams → Start entry.");
    if (a === "" || c === "") return er("Enter both the theory and the assessment marks.");
    if (+a < 0 || +a > T.tmax) return er("Theory marks must be between 0 and " + T.tmax + "."); if (+c < 0 || +c > T.amax) return er("Assessment marks must be between 0 and " + T.amax + ".");
    return mPut(id, { th: +a, as: +c, m: Math.round((+a + +c) * 100) / 100, max: M.max, r, by, t });
  }
  const v = $("mm").value, mx = +$("mx").value;
  if (v === "" || +v < 0 || +v > mx) return er("Marks must be between 0 and " + mx + ".");
  return mPut(id, { m: +v, max: mx, r, by, t });
});
A.mAbsOne = b => busy(b, () => mPut(b.dataset.id, { ab: 1, max: ($("mx") && +$("mx").value) || M.max || 0, r: $("mr").value.trim(), by: S.me.name, t: Date.now() }));
A.mDelOne = b => {
  if (!confirm("Delete this student's entry for the test?")) return;
  patchQ(M.path, [{ k: `marks.${M.tid}.${b.dataset.id}`, v: null }], e => { toast("Not deleted: " + e.message, true); if ($("m-ls")) entryDraw("m"); });
  entryDraw("m"); closeSheet(true); toast("Entry deleted");
};
/* everyone without an entry = absent / did not give the test */
A.mAbs = b => {
  const rest = classStudents(M.cls).filter(s => !mk(s.id)); if (!rest.length) return toast("Everyone already has an entry.");
  if (!confirm(`Mark the ${rest.length} students without marks as absent (did not give this test)?`)) return;
  const ops = rest.map(s => ({ k: `marks.${M.tid}.${s.id}`, v: { ab: 1, max: M.max, r: "", by: S.me.name, t: Date.now() } }));
  patchQAll(M.path, ops, e => { toast("Not saved: " + e.message, true); if ($("m-ls")) entryDraw("m"); });
  entryDraw("m"); toast(rest.length + " marked absent");
};
/* list of saved entries: edit one, delete several */
A.mManage = () => {
  const rows = classStudents(M.cls).filter(s => mk(s.id)); if (!rows.length) return toast("No entries saved yet.", true);
  sheetL(`<h2>Saved entries</h2><p class="sub">Tick entries to delete them, or tap Edit to correct marks.</p><div class="row"><button class="btn alt sm" data-a="mkAll">Select / clear all</button></div><div class="mlist">${rows.map(s => `<div class="lrow"><label class="cb"><input type="checkbox" class="mkc" value="${esc(s.id)}" aria-label="Select ${esc(s.name)}"></label><div class="lm"><b>${esc(s.name)}</b><small>${esc(mTxt(mk(s.id)))}</small></div><button class="link" data-a="mkEdit" data-id="${esc(s.id)}">Edit</button></div>`).join("")}</div><p></p><div class="row"><button class="btn" data-a="mkDel" style="flex:2">Delete selected</button><button class="btn alt" data-a="close">Close</button></div>`);
};
A.mkAll = () => { const cs = [...document.querySelectorAll(".mkc")], on = cs.some(c => !c.checked); cs.forEach(c => c.checked = on); };
A.mkEdit = b => mOpen(b.dataset.id);
A.mkDel = b => {
  const ids = [...document.querySelectorAll(".mkc:checked")].map(c => c.value); if (!ids.length) return toast("Tick at least one entry.", true);
  if (!confirm(`Delete ${ids.length} saved ${ids.length === 1 ? "entry" : "entries"}?`)) return;
  patchQAll(M.path, ids.map(id => ({ k: `marks.${M.tid}.${id}`, v: null })), e => { toast("Not deleted: " + e.message, true); if ($("m-ls")) entryDraw("m"); });
  entryDraw("m"); closeSheet(true); toast(ids.length + " deleted");
};
/* edit the test itself: name, date, max marks */
let ET = {};
A.mEditT = b => {
  const c = $("mc").value, sb = $("ms").value, path = P.marks(c, sb), t = D[path].tests[b.dataset.t], gr = !!t.term && subMode(c, sb) === "grade", sp = t.amax != null;
  ET = { path, tid: b.dataset.t, t, gr, sp };
  const maxF = sp ? `<label>Theory max marks<input id="etth" type="number" inputmode="decimal" value="${t.tmax}"></label><label>Assessment max marks<input id="etas" type="number" inputmode="decimal" value="${t.amax}"></label>` : `<label>Max marks${gr ? " (optional)" : ""}<input id="etm" type="number" inputmode="decimal" value="${t.max > 0 ? t.max : ""}"></label>`;
  sheet(`<h2>Edit test</h2><div class="form"><label>Test name<input id="etn" value="${esc(t.name)}"></label><label>Date<input id="etd" type="date" value="${esc(t.date)}"></label>${maxF}${sp || gr ? "" : `<label class="cb"><input type="checkbox" id="etu" checked> Also change “out of” on marks already entered</label>`}</div><p></p><div class="row"><button class="btn" data-a="mEditSave" style="flex:2">Save changes</button><button class="btn alt" data-a="close">Cancel</button></div><div class="err" id="e2"></div>`);
};
A.mEditSave = b => {
  const { path, tid, t, gr, sp } = ET, name = $("etn").value.trim(), date = $("etd").value, er = x => ($("e2").textContent = x);
  if (!name || !date) return er("Fill in the name and date.");
  const ms = (D[path].marks || {})[tid] || {}, nt = { name, date }, ops = [];
  if (sp) {
    const th = +$("etth").value, am = +$("etas").value; if (!(th > 0) || !(am > 0)) return er("Enter the theory and the assessment max marks.");
    const over = Object.values(ms).filter(e => !e.ab && (e.th > th || e.as > am)).length; if (over) return er(over + " saved entries are higher than the new maximum. Correct them first.");
    const max = th + am; Object.assign(nt, { max, tmax: th, amax: am });
    if (max !== t.max) Object.entries(ms).forEach(([sid, e]) => ops.push({ k: `marks.${tid}.${sid}`, v: Object.assign({}, e, { max }) }));
  } else {
    const max = +$("etm").value || 0; if (!gr && !(max > 0)) return er("Fill in the max marks."); nt.max = max;
    if (!gr && max !== t.max && $("etu").checked) {
      const over = Object.values(ms).filter(e => !e.ab && e.m > max).length; if (over) return er(over + " saved marks are higher than " + max + ". Correct them first.");
      Object.entries(ms).forEach(([sid, e]) => { if (e.max === t.max) ops.push({ k: `marks.${tid}.${sid}`, v: Object.assign({}, e, { max }) }); });
    }
  }
  ops.unshift({ k: "tests." + tid, v: Object.assign({}, t, nt) });
  patchQAll(path, ops, e => { toast("Test not updated: " + e.message, true); mHist(); });
  closeSheet(true); toast("Test updated"); mHist();
  if (M.tid === tid && M.path === path) mRun($("mentry"), M.cls, M.sub, tid, true, true);
};
/* delete a whole test with all its marks */
A.mDelT = b => {
  const c = $("mc").value, s = $("ms").value, path = P.marks(c, s), tid = b.dataset.t, t = D[path].tests[tid], ids = Object.keys((D[path].marks || {})[tid] || {});
  if (!confirm(`Delete the test “${t.name}” (${fmtD(t.date)}) and its ${ids.length} saved marks? This cannot be undone.`)) return;
  const ops = [...ids.map(id => ({ k: `marks.${tid}.${id}`, v: null })), { k: `marks.${tid}`, v: null }, { k: "tests." + tid, v: null }];
  patchQAll(path, ops, e => { toast("Test not deleted: " + e.message, true); mHist(); });
  if (M.tid === tid && M.path === path) { $("mentry").innerHTML = ""; M = {}; }
  toast("Test deleted"); mHist();
};
let CF = {};
function mConflict(id, mine, theirs) {
  CF = { id, mine, theirs };
  if (!theirs) return mOpen(id);
  conflictSheet(stuById(id).name + ": already saved", { by: theirs.by, t: theirs.t, text: mTxt(theirs) }, { text: mTxt(mine) }, "mKeep", "mMine");
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
const nPrev = sid => { const en = (D[N.ep] || {}).entries || {}, d = Object.keys(en).filter(k => k < N.date && en[k][sid]).sort().pop(); return d ? { d, e: en[d][sid] } : null; };
function nDates() {
  const en = (D[N.ep] || {}).entries || {}, ds = Object.keys(en).filter(k => Object.keys(en[k] || {}).length).sort().reverse().slice(0, 6); if (!ds.length) return "";
  return `<div class="row chips"><small class="sub">Dates with entries:</small>${ds.map(d => `<button class="chip${d === N.date ? " on" : ""}" data-a="nDate" data-d="${esc(d)}">${esc(fmtD(d))}</button>`).join("")}</div>`;
}
A.nDate = b => { N.date = b.dataset.d; if ($("ndate")) $("ndate").value = N.date; nbDraw(); };
function nbDraw() {
  $("nbody").innerHTML = `<div class="seg" role="tablist"><button class="${N.view === "entry" ? "on" : ""}" data-a="nView" data-v="entry">Enter</button><button class="${N.view === "heat" ? "on" : ""}" data-a="nView" data-v="heat">Heatmap</button></div><div id="nmain"></div>`;
  if (N.view === "heat") return nbHeat();
  entry($("nmain"), { id: "n", cls: N.cls, note: `<b>${esc(N.sub)}</b> · ${fmtD(N.date)} · ${N.ch.filter(taught).length} chapters being checked${nDates()}`, done: s => !!ne(s.id), tail: s => { const e = ne(s.id), t = N.ch.filter(taught).length; if (e) return nbDone(e, N.ch) + "/" + t; const p = nPrev(s.id); return p ? `<span class="prev">last ${esc(fmtD(p.d))} · ${nbDone(p.e, N.ch)}/${t}</span>` : ""; }, tools: `<button class="btn alt sm" data-a="nDay">Move / delete this date's entries</button>`, pick: nOpenStu });
}
A.nView = b => { N.view = b.dataset.v; nbDraw(); };
function nbHeat() {
  const en = D[N.ep].entries || {}, last = sid => { const d = Object.keys(en).filter(k => en[k][sid]).sort().pop(); return d ? { d, e: en[d][sid] } : null; };
  const st = classStudents(N.cls), t = N.ch.filter(taught).length;
  $("nmain").innerHTML = `<div class="card"><p class="sub">Latest entry for each student. Tap a name to see, edit or delete all of their entries.</p><div class="scroll"><table class="heat"><thead><tr><th>Student</th>${N.ch.map((c, i) => `<th title="${esc(c.n)}" class="${taught(c) ? "" : "dim"}">${i + 1}</th>`).join("")}<th>%</th><th>Last</th></tr></thead><tbody>${st.map(s => { const l = last(s.id), e = l && l.e; return `<tr><td><button class="link nmb" data-a="nHist" data-id="${esc(s.id)}">${esc(s.name)}</button></td>${N.ch.map((c, i) => `<td><i class="hc ${!e || !taught(c) ? "hn" : "s" + (e.s[i] || 0)}"></i></td>`).join("")}<td>${e && t ? Math.round(nbDone(e, N.ch) / t * 100) + "%" : "—"}</td><td><small>${l ? fmtD(l.d) : "—"}</small></td></tr>`; }).join("")}</tbody></table></div>
   <p class="legend"><i class="hc s1"></i> done <i class="hc s2"></i> partial <i class="hc s0"></i> pending <i class="hc hn"></i> no entry / not taught</p>
   <p class="sub">Chapters: ${N.ch.map((c, i) => `${i + 1}. ${esc(c.n)}`).join(" · ")}</p></div>`;
}
/* every notebook entry of one student for this subject: open (edit) or delete */
function nHistDraw(id) {
  const en = D[N.ep].entries || {}, ds = Object.keys(en).filter(k => en[k][id]).sort().reverse(), t = N.ch.filter(taught).length;
  sheetL(`<h2>${esc(stuById(id).name)} · ${esc(N.sub)}</h2><p class="sub">${ds.length ? "Tick entries to delete them, or tap Open to correct one." : "No notebook entries saved for this student."}</p>${ds.length ? `<div class="row"><button class="btn alt sm" data-a="nhAll">Select / clear all</button></div>` : ""}<div class="mlist">${ds.map(d => `<div class="lrow"><label class="cb"><input type="checkbox" class="nhc" value="${esc(d)}" aria-label="Select ${esc(fmtD(d))}"></label><div class="lm"><b>${fmtD(d)}</b><small>${nbDone(en[d][id], N.ch)}/${t} chapters done${en[d][id].by ? " · " + esc(en[d][id].by) : ""}</small></div><button class="link" data-a="nhOpen" data-id="${esc(id)}" data-d="${esc(d)}">Open</button></div>`).join("")}</div><p></p><div class="row">${ds.length ? `<button class="btn" data-a="nhDel" data-id="${esc(id)}" style="flex:2">Delete selected</button>` : ""}<button class="btn alt" data-a="close">Close</button></div>`);
}
A.nHist = b => nHistDraw(b.dataset.id);
A.nhAll = () => { const cs = [...document.querySelectorAll(".nhc")], on = cs.some(c => !c.checked); cs.forEach(c => c.checked = on); };
A.nhOpen = b => { closeSheet(true); N.date = b.dataset.d; if ($("ndate")) $("ndate").value = N.date; N.view = "entry"; nbDraw(); nOpenStu(b.dataset.id); };
A.nhDel = b => {
  const id = b.dataset.id, ds = [...document.querySelectorAll(".nhc:checked")].map(c => c.value); if (!ds.length) return toast("Tick at least one entry.", true);
  if (!confirm(`Delete ${ds.length} notebook ${ds.length === 1 ? "entry" : "entries"} of ${stuById(id).name}?`)) return;
  const en = D[N.ep].entries || {}, ops = ds.flatMap(d => [{ k: `entries.${d}.${id}`, v: null }, ...(Object.keys(en[d] || {}).every(k => k === id) ? [{ k: `entries.${d}`, v: null }] : [])]);
  patchQAll(N.ep, ops, e => { toast("Not deleted: " + e.message, true); nbDraw(); });
  toast(ds.length + " deleted"); nbDraw(); nHistDraw(id);
};
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
  patchQ(N.sp, [{ k: "chapters", v: ch }], e => { toast("Chapters were not saved: " + e.message, true); });
  N.ch = ch; closeSheet(true); toast("Chapters saved"); nbDraw();
});
function nOpenStu(id) {
  const e = ne(id); NS = { id, st: N.ch.map((c, i) => e ? (e.s[i] || 0) : 0), cr: Object.assign({}, e && e.cr), r: e ? e.r || "" : "", detail: NS.detail || false, rem: false };
  sheet(""); nsDraw();
}
function nsDraw() {
  if (NS.rem) return nsRemDraw();
  const s = stuById(NS.id), t = N.ch.map((c, i) => c).filter(taught).length;
  $("sheet").innerHTML = `<div class="row between"><h2>${esc(s.name)}</h2><button class="link" data-a="nsMode">${NS.detail ? "Quick strip" : "Individual entry"}</button></div><p class="sub">${fmtD(N.date)} · ${esc(N.sub)} · ${NS.detail ? "Set each chapter and add remarks" : "Tap a chapter to cycle done → partial → pending"}</p>${(() => { const p = ne(NS.id) ? null : nPrev(NS.id); return p ? `<p class="sub">Last checked ${esc(fmtD(p.d))}: ${nbDone(p.e, N.ch)}/${N.ch.filter(taught).length} chapters done. Use “Same as last entry” to start from it.</p>` : ""; })()}` +
    (NS.detail ? `<div class="chl">${N.ch.map((c, i) => `<div class="crow ${taught(c) ? "" : "dim"}"><span class="cl">${i + 1}. ${esc(c.n)}</span><select data-c="nsSel" data-i="${i}" ${taught(c) ? "" : "disabled"} aria-label="Chapter ${i + 1} status"><option value="1" ${NS.st[i] === 1 ? "selected" : ""}>Done</option><option value="2" ${NS.st[i] === 2 ? "selected" : ""}>Partial</option><option value="0" ${NS.st[i] === 0 ? "selected" : ""}>Pending</option></select><input class="cr" data-i="${i}" placeholder="Remark" value="${esc(NS.cr[i] || "")}" ${taught(c) ? "" : "disabled"}></div>`).join("")}</div><p><input id="nr" placeholder="Overall remark (optional)" value="${esc(NS.r)}" style="width:100%"></p>`
      : `<div class="chs">${N.ch.map((c, i) => `<button class="ch s${NS.st[i]}" data-a="nbCh" data-i="${i}" title="${esc(c.n)}" ${taught(c) ? "" : "disabled"}>Ch ${i + 1}<br>${taught(c) ? SYM[NS.st[i]] : "–"}</button>`).join("")}</div><p class="sub chnames">${N.ch.map((c, i) => `${i + 1}. ${esc(c.n)}`).join(" · ")}</p>`) +
    `<div class="row"><button class="btn alt" data-a="nsAll">All done</button><button class="btn alt" data-a="nsLast">Same as last entry</button></div>${NS.detail ? "" : `<p></p><button class="btn alt" data-a="nsRem" style="width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Remarks${NS.r ? ": " + esc(NS.r) : ""}</button>`}<p></p><div class="row"><button class="btn" data-a="nsSave" style="flex:2">Save &amp; next</button><button class="btn alt" data-a="nsSkip">Skip</button></div>${ne(NS.id) ? `<p></p><button class="btn alt sm" data-a="nsDel">Delete this entry</button>` : ""}<div class="err" id="e2"></div>`;
}
const nsKeep = () => { if (NS.detail) { document.querySelectorAll(".cr").forEach(i => { i.value.trim() ? NS.cr[i.dataset.i] = i.value.trim() : delete NS.cr[i.dataset.i]; }); const r = $("nr"); if (r) NS.r = r.value; } };
/* quick remarks screen: tap buttons to build the remark, or open the keyboard */
const QR_NUM = ["Ch", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], QR_TXT = ["Long q", "short q", "v short q", "app q", "diagram", "art work", "pages", "pending", "not done", "given again"];
function nsRemDraw() {
  const s = stuById(NS.id), b = (t, x = "") => `<button class="qb${x}" data-a="nrq" data-t="${esc(t)}">${esc(t)}</button>`;
  $("sheet").innerHTML = `<div class="row between"><h2>Remarks · ${esc(s.name)}</h2></div><div class="qv" id="nrv" aria-live="polite">${esc(NS.r) || "<span class='sub'>Tap buttons to build the remark</span>"}</div>
   <div class="qr6">${QR_NUM.map(t => b(t, t === "Ch" ? " ch" : "")).join("")}<button class="qb ic" data-a="nrBack" aria-label="Delete last">⌫</button></div>
   <div class="qr3">${QR_TXT.map(t => b(t)).join("")}<button class="qb ic" data-a="nrKey" aria-label="Type with keyboard">⌨ Keyboard</button><button class="qb ic" data-a="nrClr">Clear</button></div>
   <input id="nrk" class="hide" placeholder="Type remark" value="${esc(NS.r)}" style="width:100%;margin-top:8px" aria-label="Remark">
   <p></p><div class="row"><button class="btn" data-a="nrDone" style="flex:2">Done</button></div>`;
  $("nrk").oninput = () => { NS.r = $("nrk").value; dirty = true; nrShow(); };
}
const nrShow = () => { $("nrv").innerHTML = NS.r ? esc(NS.r) : "<span class='sub'>Tap buttons to build the remark</span>"; if ($("nrk") && document.activeElement !== $("nrk")) $("nrk").value = NS.r; };
A.nrq = b => {
  const t = b.dataset.t, r = NS.r || "";
  if (QR_NUM.includes(t) && t !== "Ch" && /(\d|Ch )$/.test(r)) NS.r = r + t;        // digits continue a chapter number: Ch 1 2 → Ch 12
  else NS.r = r ? r.replace(/,?\s*$/, "") + ", " + (t === "Ch" ? "Ch " : t) : (t === "Ch" ? "Ch " : t);
  dirty = true; nrShow();
};
A.nrBack = () => { const r = NS.r || "", m = QR_TXT.find(t => r.endsWith(t)); NS.r = m ? r.slice(0, -m.length).replace(/,\s*$/, "") : r.replace(/,\s*$/, "").slice(0, -1); NS.r = NS.r.replace(/,\s*$/, ""); dirty = true; nrShow(); };
A.nrClr = () => { NS.r = ""; dirty = true; nrShow(); };
A.nrKey = () => { const k = $("nrk"); k.classList.remove("hide"); k.value = NS.r; k.focus(); };
A.nrDone = () => { NS.r = (NS.r || "").replace(/[,\s]+$/, ""); NS.rem = false; nsDraw(); };
A.nsRem = () => { nsKeep(); NS.rem = true; nsDraw(); };
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
  const ep = N.ep, date = N.date, name = stuById(id).name;
  patchQ(ep, [{ k: `entries.${date}.${id}`, v, base: old && old.t != null ? old.t : null }], e => {
    const here = N.ep === ep && N.date === date; if (here) entryDraw("n");
    if (here && e.conflict && e.conflict[0].current) return nConflict(id, v, e.conflict[0].current);
    toast(name + ": notebook entry was not saved. " + e.message, true);
  });
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

/* ===== term.js ===== */
/* ===== Term exams: subject-wise entry, custom mark sheet, mini report cards ===== */
const TM = { tab: "enter", cls: "", term: "", c: "", s: "", opt: (() => { try { return JSON.parse(localStorage.tmOpt || "{}"); } catch { return {}; } })() };
const TCOL = { Teal: "#0b4a4a", Blue: "#1f4e8c", Maroon: "#7a1f2b", Black: "#222222" };
const sigList = () => S.cfg.signatories && S.cfg.signatories.length ? S.cfg.signatories : ["Class teacher", "Examination in-charge", "Principal"];
const sgBoxes = (id, sel, change) => `<div class="xsets" id="${id}">${sigList().map(t => `<label class="cb"><input type="checkbox" ${change ? 'data-c="tOptCh"' : ""} value="${esc(t)}" ${sel.includes(t) ? "checked" : ""}> ${esc(t)}</label>`).join("")}</div>`;
const sgOne = (t, img) => `<div class="sgc"><div class="sgbox">${img ? `<img src="${img}" alt="">` : ""}</div><div class="sgt">${esc(t)}</div></div>`;
const sigRow = (list, parent) => `<div class="sig">${list.filter(Boolean).map(t => sgOne(t, /^class teacher$/i.test(t) && S.sig)).join("")}${parent ? sgOne("Parent") : ""}</div>`;
const tTid = term => "term_" + termKey(term);
const tOpt = () => Object.assign({ fs: 13, rh: 5, tw: 100, title: "Mark Sheet", or: "landscape", col: "Teal", logo: 1, roll: 1, tot: 1, pct: 1, rank: 1, res: 1, max: 1, cn: 6, csg: ["Class teacher"], clogo: 1, crank: 1, cres: 1, cremark: 0, csig: 1, cpar: 1 }, TM.opt);
function tReadOpt() {
  const o = tOpt(), v = id => $(id) ? $(id).value : null;
  if (v("to-title") != null) { o.title = v("to-title").trim() || "Mark Sheet"; o.or = v("to-or"); o.col = v("to-col"); }
  if (v("to-n") != null) o.cn = +v("to-n");
  document.querySelectorAll("#tchk input, #tcchk input").forEach(i => o[i.value] = i.checked ? 1 : 0);
  if ($("tsg")) o.sg = [...document.querySelectorAll("#tsg input:checked")].map(i => i.value); if ($("tcsg")) o.csg = [...document.querySelectorAll("#tcsg input:checked")].map(i => i.value);
  TM.opt = o; try { localStorage.tmOpt = JSON.stringify(o); } catch { } return o;
}
V.term = host => {
  setTitle("Term exams", "Subject-wise marks, mark sheets and mini report cards");
  if (!pairs().length) return host.innerHTML = noAccess("Ask the admin to assign a class and subject to you.");
  if (!S.cfg.terms.length) return host.innerHTML = noAccess("The admin has not added exam terms yet (Admin → Settings → Exam terms).");
  if (!S.cfg.terms.includes(TM.term)) TM.term = S.cfg.terms[0];
  host.innerHTML = `<div class="seg" id="ttabs"></div><div id="tbody"></div>`; tTab();
};
function tTab() {
  $("ttabs").innerHTML = Object.entries({ enter: "Enter marks", sheet: "Mark sheet", cards: "Mini report cards" }).map(([k, v]) => `<button class="${TM.tab === k ? "on" : ""}" data-a="tGo" data-t="${k}">${v}</button>`).join("");
  ({ enter: tEnter, sheet: tSheet, cards: tCards })[TM.tab]($("tbody"));
}
A.tGo = b => { TM.tab = b.dataset.t; tTab(); };
const termSel = () => `<select id="tterm" data-c="tTermCh" aria-label="Term">${S.cfg.terms.map(t => `<option ${t === TM.term ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
A.tTermCh = b => { TM.term = b.value; tTab(); };
A.tClsCh = b => { TM.cls = b.value; tTab(); };
A.tOptCh = () => { if ($("tprev")) tPrev(); };

/* ----- entry: my class and other classes, one subject at a time ----- */
function tEnter(host) {
  host.innerHTML = `<div class="card"><div class="row">${pairHTML("t")}${termSel()}</div><div class="row"><input id="tmax" type="number" inputmode="decimal" placeholder="Max marks (e.g. 80)" aria-label="Max marks"><input id="tth" class="hide" type="number" inputmode="decimal" placeholder="Theory max (e.g. 70)" aria-label="Theory max marks"><input id="tas" class="hide" type="number" inputmode="decimal" placeholder="Assessment max (e.g. 10)" aria-label="Assessment max marks"><input id="tdt" type="date" value="${today()}" aria-label="Exam date"></div><p class="sub" id="tinfo"></p><button class="btn" data-a="tStart">Start entry</button><p class="sub">To correct the exam's date or max marks, or delete it, use Test marks → Test history.</p></div><div id="mentry"></div>`;
  if (myClasses().includes(TM.c)) $("tc").value = TM.c;
  fillPair("t"); if (subjectsOf($("tc").value).includes(TM.s)) $("ts").value = TM.s;
  A.pairDone_t = tInfo; tInfo();
}
async function tInfo() {
  const c = $("tc") && $("tc").value, s = $("ts") && $("ts").value; if (!c || !s) return; TM.c = c; TM.s = s;
  const path = P.marks(c, s); await load([path], true);
  if (!$("tinfo") || $("tc").value !== c || $("ts").value !== s) return;
  const md = subMode(c, s), tid = tTid(TM.term), t = getAt(D[path], ["tests", tid]);
  $("tmax").classList.toggle("hide", md === "split"); $("tth").classList.toggle("hide", md !== "split"); $("tas").classList.toggle("hide", md !== "split");
  $("tmax").placeholder = md === "grade" ? "Max marks (optional)" : "Max marks (e.g. 80)";
  if (t) { $("tmax").value = t.max > 0 ? t.max : ""; $("tth").value = t.tmax ?? ""; $("tas").value = t.amax ?? ""; $("tdt").value = t.date; }
  const how = md === "grade" ? " This subject is graded in exams: choose a grade for each student (marks optional); only grades are printed." : md === "split" ? " This subject is entered as theory + assessment; only the total is printed." : "";
  $("tinfo").textContent = (t ? `${TM.term}: ${Object.keys(getAt(D[path], ["marks", tid]) || {}).length}/${classStudents(c).length} entered · ${tMaxTxt(t, c, s)}.` : `No ${TM.term} marks entered yet for ${c} ${s}.`) + how;
}
A.tStart = b => busy(b, async () => {
  const c = $("tc").value, s = $("ts").value, date = $("tdt").value, md = c && s ? subMode(c, s) : "marks", th = +$("tth").value, am = +$("tas").value;
  let max = +$("tmax").value;
  if (!c || !s || !date) return toast("Choose class and subject and the exam date.", true);
  if (md === "split") { if (!(th > 0) || !(am > 0)) return toast("Enter the theory max and the assessment max.", true); max = th + am; }
  else if (md === "grade") max = max > 0 ? max : 0;
  else if (!(max > 0)) return toast("Enter the max marks.", true);
  const path = P.marks(c, s), tid = tTid(TM.term); await load([path], true);
  const t = getAt(D[path], ["tests", tid]);
  if (!t || t.max !== max || t.date !== date || (md === "split" && (t.tmax !== th || t.amax !== am))) {
    if (t && t.max !== max && max > 0 && t.max > 0 && Object.keys(getAt(D[path], ["marks", tid]) || {}).length && !confirm("Marks are already entered out of " + t.max + ". Change this exam to " + max + "?")) return;
    const rec = { name: TM.term + " Exam", date, max, term: TM.term, by: (t && t.by) || S.me.name }; if (md === "split") { rec.tmax = th; rec.amax = am; }
    patchQ(path, [{ k: "tests." + tid, v: rec }], e => { toast("The exam was not saved: " + e.message, true); $("mentry") && ($("mentry").innerHTML = ""); });
  }
  await mRun($("mentry"), c, s, tid, false, true); tInfo();
});

/* ----- shared data: one row per student, one column per subject ----- */
function tData(cls, term) {
  const tid = tTid(term), pass = S.cfg.passPercent;
  const cols = subjectsOf(cls).map(sub => { const f = D[P.marks(cls, sub)] || {}; return { sub, mode: subMode(cls, sub), t: getAt(f, ["tests", tid]), ms: getAt(f, ["marks", tid]) || {} }; }).filter(c => c.t);
  const rows = classStudents(cls).map(s => {
    let tot = 0, mx = 0, fail = 0, ab = 0, n = 0;
    const cells = cols.map(c => { const e = c.ms[s.id]; if (!e) return null; n++; if (e.ab) { ab++; return e; } if (e.g) return e; tot += e.m; mx += e.max; if (e.m / e.max * 100 < pass) fail++; return e; });
    return { s, cells, tot, mx, n, pct: mx ? tot / mx * 100 : null, res: !n ? "—" : fail ? "Fail" : ab ? "Absent" : n < cols.length ? "Incomplete" : "Pass" };
  });
  const rk = rows.filter(r => r.pct != null).sort((a, b) => b.pct - a.pct); rk.forEach((r, i) => r.rank = i && r.pct === rk[i - 1].pct ? rk[i - 1].rank : i + 1);
  return { cols, rows };
}
const fmt1 = n => n == null ? "" : (Math.round(n * 10) / 10).toString();

/* ----- mark sheet ----- */
async function tSheet(host) {
  const cs = myClasses(); if (!cs.includes(TM.cls)) TM.cls = cs[0]; const o = tOpt();
  host.innerHTML = `<div class="card"><div class="row"><select id="tcl" data-c="tClsCh" aria-label="Class">${cs.map(c => `<option ${c === TM.cls ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>${termSel()}</div><p class="sub">Columns are the subjects you can access in this class.</p>
   <h4>Design</h4><div class="form"><label>Title<input id="to-title" data-c="tOptCh" value="${esc(o.title)}" placeholder="Mark Sheet"></label><div class="row"><select id="to-or" data-c="tOptCh" aria-label="Page"><option value="landscape" ${o.or === "landscape" ? "selected" : ""}>Landscape A4</option><option value="portrait" ${o.or === "portrait" ? "selected" : ""}>Portrait A4</option></select><select id="to-col" data-c="tOptCh" aria-label="Colour">${Object.keys(TCOL).map(k => `<option ${o.col === k ? "selected" : ""}>${k}</option>`).join("")}</select></div></div>
   <div class="xsets" id="tchk">${[["logo", "School logo"], ["roll", "Serial no."], ["max", "Max marks under subject names"], ["tot", "Total"], ["pct", "Percentage"], ["rank", "Rank"], ["res", "Result"]].map(([k, v]) => `<label class="cb"><input type="checkbox" data-c="tOptCh" value="${k}" ${o[k] ? "checked" : ""}> ${v}</label>`).join("")}</div>
   <h4>Signatures</h4>${sgBoxes("tsg", o.sg || sigList(), true)}<p></p><div class="row"><button class="btn alt" data-a="tPreview">Preview PDF</button><button class="btn" data-a="tPrint">${ic("print", 18)} Print / save PDF</button></div><div class="err" id="terr"></div></div><div id="tprev"></div>`;
  const t = VT; try { await load(subjectsOf(TM.cls).map(s => P.marks(TM.cls, s)), true); } catch (e) { return $("terr").textContent = e.message; }
  if (!stale(t) && $("tprev")) tPrev();
}
function tPrev() { const h = tSheetHTML(TM.cls, TM.term, tReadOpt()); $("tprev").innerHTML = h ? `<div class="card"><div class="scroll">${h}</div></div>` : `<div class="card empty"><b>No ${esc(TM.term)} marks yet</b><p class="sub">Enter the term marks first (Enter marks tab).</p></div>`; }
function tSheetHTML(cls, term, o) {
  const d = tData(cls, term); if (!d.cols.length) return "";
  const col = TCOL[o.col] || TCOL.Teal, avgOf = i => avg(d.rows.map(r => r.cells[i]).filter(e => e && !e.ab && !e.g).map(e => e.m));
  return `<div class="msx" style="--ac:${col};--fs:${+o.fs || 13}px;--rh:${+o.rh >= 0 ? +o.rh : 5}px;--tw:${+o.tw || 100}%"><div class="msh">${o.logo && S.logo ? `<img src="${S.logo}" alt="">` : ""}<div><b>${esc(S.cfg.school)}</b><div>${esc(o.title)} · ${esc(term)} · Class ${esc(cls)}</div></div></div>
   <table class="pt mst"><tr>${o.roll ? "<th>#</th>" : ""}<th>Student</th>${d.cols.map(c => `<th>${esc(c.sub)}${o.max ? `<br><small>${c.mode === "grade" ? "Grade" : "/" + c.t.max}</small>` : ""}</th>`).join("")}${o.tot ? "<th>Total</th>" : ""}${o.pct ? "<th>%</th>" : ""}${o.rank ? "<th>Rank</th>" : ""}${o.res ? "<th>Result</th>" : ""}</tr>
   ${d.rows.map((r, i) => `<tr>${o.roll ? `<td>${i + 1}</td>` : ""}<td>${esc(r.s.name)}</td>${r.cells.map(e => `<td>${!e ? "" : e.ab ? "Ab" : e.g ? esc(e.g) : e.m}</td>`).join("")}${o.tot ? `<td>${r.n ? r.tot + "/" + r.mx : ""}</td>` : ""}${o.pct ? `<td>${fmt1(r.pct)}</td>` : ""}${o.rank ? `<td>${r.rank || ""}</td>` : ""}${o.res ? `<td class="${r.res === "Fail" ? "fail" : ""}">${esc(r.res)}</td>` : ""}</tr>`).join("")}
   <tr class="avr"><td${o.roll ? ' colspan="2"' : ""}><b>Class average</b></td>${d.cols.map((c, i) => `<td>${fmt1(avgOf(i))}</td>`).join("")}${(o.tot ? 1 : 0) + (o.pct ? 1 : 0) + (o.rank ? 1 : 0) + (o.res ? 1 : 0) ? `<td colspan="${(o.tot ? 1 : 0) + (o.pct ? 1 : 0) + (o.rank ? 1 : 0) + (o.res ? 1 : 0)}"></td>` : ""}</tr></table>
   ${sigRow(o.sg || sigList())}</div>`;
}
A.tPrint = () => { const o = tReadOpt(), h = tSheetHTML(TM.cls, TM.term, o); if (!h) return $("terr").textContent = "No marks to print for this term yet."; printHTML(h, `@page{size:A4 ${o.or};margin:10mm}`); };

/* ----- PDF preview of the exam mark sheet: A4 page, adjust text size / row height / table width until the rows fit ----- */
const MMPX = 96 / 25.4;
A.tPreview = () => {
  const o = tReadOpt(); if (!tSheetHTML(TM.cls, TM.term, o)) return $("terr").textContent = "No marks to preview for this term yet.";
  sheetL(`<h2>PDF preview</h2><p class="sub">${esc(TM.term)} · Class ${esc(TM.cls)} · A4. Adjust until it fits, then print. The red dashed line is the bottom of the page.</p>
   <div class="row"><select id="tp-or" aria-label="Page layout"><option value="landscape">Landscape A4</option><option value="portrait">Portrait A4</option></select></div>
   <div class="tpc"><label>Text size <b id="tp-fs-v"></b><input id="tp-fs" type="range" min="6" max="18" step="0.5"></label><label>Row height <b id="tp-rh-v"></b><input id="tp-rh" type="range" min="0" max="14" step="0.5"></label><label>Table width <b id="tp-tw-v"></b><input id="tp-tw" type="range" min="50" max="100" step="1"></label></div>
   <p class="sub" id="tp-info" role="status"></p><div class="tpw" id="tp-w"><div class="tpr" id="tp-r"><div class="tpg" id="tp-g"></div></div></div>
   <div class="row"><button class="btn alt" data-a="tFit">Fit to one page</button><button class="btn" data-a="tPrintP" style="flex:2">${ic("print", 18)} Print / save PDF</button><button class="btn alt" data-a="close">Close</button></div>`);
  $("sheet").classList.add("wide"); $("tp-or").value = o.or; $("tp-fs").value = o.fs; $("tp-rh").value = o.rh; $("tp-tw").value = o.tw;
  $("sheet").oninput = tpDraw; setTimeout(tpDraw, 30);
};
function tpDraw() {
  if (!$("tp-g")) return 1;
  const o = tOpt(); o.or = $("tp-or").value; o.fs = +$("tp-fs").value; o.rh = +$("tp-rh").value; o.tw = +$("tp-tw").value; TM.opt = o;
  try { localStorage.tmOpt = JSON.stringify(o); } catch { } if ($("to-or")) $("to-or").value = o.or;
  $("tp-fs-v").textContent = o.fs + " px"; $("tp-rh-v").textContent = o.rh + " px"; $("tp-tw-v").textContent = o.tw + "%";
  const L = o.or === "landscape", pw = L ? 297 : 210, ph = L ? 210 : 297, avH = (ph - 20) * MMPX, g = $("tp-g"), r = $("tp-r");
  g.style.cssText = `width:${pw}mm;min-height:${ph}mm;padding:10mm`; g.innerHTML = tSheetHTML(TM.cls, TM.term, o);
  const k = Math.min(1, ($("tp-w").clientWidth - 20) / (pw * MMPX)) || 1, ch = g.firstElementChild.offsetHeight, pages = Math.max(1, Math.ceil((ch - 2) / avH));
  for (let i = 1; i <= pages; i++) g.insertAdjacentHTML("beforeend", `<div class="tpb" style="top:${10 * MMPX + i * avH}px"></div>`);
  g.style.transform = `scale(${k})`; r.style.height = Math.max(ph * MMPX, g.offsetHeight) * k + "px";
  $("tp-info").innerHTML = pages === 1 ? `<span class="ok">Fits on 1 page.</span>` : `About ${pages} pages. Lower the text size or row height, or press Fit to one page.`;
  return pages;
}
A.tFit = () => {
  let fs = +$("tp-fs").value, rh = +$("tp-rh").value; const set = () => { $("tp-fs").value = fs; $("tp-rh").value = rh; return tpDraw(); };
  let n = set(); while (n > 1 && rh > 1) { rh = Math.max(1, rh - 0.5); n = set(); } while (n > 1 && fs > 6) { fs -= 0.5; n = set(); }
  if (n > 1) toast("Even at the smallest size this class needs more than one page.", true);
};
A.tPrintP = () => { closeSheet(true); A.tPrint(); };

/* ----- mini report cards (4 / 6 / 8 per A4 page) ----- */
async function tCards(host) {
  const cs = inchargeClasses(); if (!cs.length) return host.innerHTML = noAccess("Mini report cards need every subject's marks, so they are available to the class incharge.");
  if (!cs.includes(TM.cls)) TM.cls = cs[0]; const o = tOpt();
  host.innerHTML = `<div class="card"><div class="row"><select id="tcl" data-c="tClsCh" aria-label="Class">${cs.map(c => `<option ${c === TM.cls ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>${termSel()}<select id="to-n" aria-label="Cards per page">${[4, 6, 8].map(n => `<option value="${n}" ${o.cn === n ? "selected" : ""}>${n} per A4 page</option>`).join("")}</select></div>
   <div class="xsets" id="tcchk">${[["clogo", "School logo"], ["crank", "Rank"], ["cres", "Result (pass / fail)"], ["cremark", "Blank remarks line"], ["cpar", "Parent signature line"]].map(([k, v]) => `<label class="cb"><input type="checkbox" value="${k}" ${o[k] ? "checked" : ""}> ${v}</label>`).join("")}</div>
   <h4>Signatures</h4>${sgBoxes("tcsg", o.csg || ["Class teacher"], false)}<p></p><button class="btn" data-a="tCardsGo">${ic("print", 18)} Print cards</button><div class="err" id="terr"></div></div>`;
  const t = VT; try { await load(subjectsOf(TM.cls).map(s => P.marks(TM.cls, s)), true); } catch (e) { $("terr").textContent = e.message; }
}
function miniCard(cls, term, r, d, o, col) {
  return `<div class="mcard" style="--ac:${col}"><div class="mch">${o.clogo && S.logo ? `<img src="${S.logo}" alt="">` : ""}<div><b>${esc(S.cfg.school)}</b><small>Report card · ${esc(term)}</small></div></div>
   <div class="mcn"><b>${esc(r.s.name)}</b><span>Class ${esc(cls)}${r.s.roll ? " · Roll " + esc(r.s.roll) : ""}</span></div>
   <table class="pt"><tr><th>Subject</th><th>Marks</th><th>Out of</th></tr>${d.cols.map((c, i) => { const e = r.cells[i]; return `<tr><td>${esc(c.sub)}</td><td>${!e ? "–" : e.ab ? "Ab" : e.g ? esc(e.g) : e.m}</td><td>${(e && e.g) || (c.mode === "grade" && (!e || e.ab)) ? "Grade" : c.t.max}</td></tr>`; }).join("")}<tr><td><b>Total</b></td><td colspan="2"><b>${r.n ? r.tot + " / " + r.mx : "–"}${r.pct != null ? " · " + fmt1(r.pct) + "%" : ""}</b></td></tr></table>
   <div class="mcr">${o.crank && r.rank ? `Rank ${r.rank} ` : ""}${o.cres ? `<b class="${r.res === "Fail" ? "fail" : ""}">${esc(r.res)}</b>` : ""}</div>${o.cremark ? `<div class="mcl">Remarks:</div>` : ""}
   <div class="sig2">${(o.csg || ["Class teacher"]).map(t => sgOne(t, /^class teacher$/i.test(t) && S.sig)).join("")}${o.cpar ? sgOne("Parent") : ""}</div></div>`;
}
A.tCardsGo = () => {
  const o = tReadOpt(), d = tData(TM.cls, TM.term); if (!d.cols.length) return $("terr").textContent = "No " + TM.term + " marks entered for this class yet.";
  const col = TCOL[o.col] || TCOL.Teal, n = [4, 6, 8].includes(o.cn) ? o.cn : 6;
  printHTML(chunk(d.rows, n).map(g => `<div class="mpg n${n}">${g.map(r => miniCard(TM.cls, TM.term, r, d, o, col)).join("")}</div>`).join(""), "@page{size:A4 portrait;margin:8mm}");
};

/* ===== reports for the principal (PDF): notebooks, marks, calls, class record, fines, attendance ===== */
const PR = { per: "week", cls: "" };
const ymd = d => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const dAdd = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fmtFull = d => d ? new Date(d + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
const PRPER = { week: "This week", lastweek: "Last week", month: "This month", lastmonth: "Last month", range: "Date range" };
function prRange() {
  const t = new Date(), mon = dAdd(new Date(t.getFullYear(), t.getMonth(), t.getDate()), -((t.getDay() + 6) % 7));
  if (PR.per === "week") return { from: ymd(mon), to: ymd(dAdd(mon, 6)), kind: "Weekly" };
  if (PR.per === "lastweek") { const m = dAdd(mon, -7); return { from: ymd(m), to: ymd(dAdd(m, 6)), kind: "Weekly" }; }
  if (PR.per === "month") return { from: ymd(new Date(t.getFullYear(), t.getMonth(), 1)), to: ymd(new Date(t.getFullYear(), t.getMonth() + 1, 0)), kind: "Monthly" };
  if (PR.per === "lastmonth") return { from: ymd(new Date(t.getFullYear(), t.getMonth() - 1, 1)), to: ymd(new Date(t.getFullYear(), t.getMonth(), 0)), kind: "Monthly" };
  const f = $("prf") && $("prf").value, e = $("prt") && $("prt").value; if (!f || !e || f > e) throw new Error("Pick a valid From and To date.");
  return { from: f, to: e, kind: "Progress" };
}
function prHTML() {
  return `<div class="card" id="prcard"><h3>Reports to submit (PDF)</h3><p class="sub">For the principal: pick the class, the period and what to include. This opens the print dialog; choose “Save as PDF”.</p>
   <div class="form"><label>Class<select id="prc" data-c="prCls" aria-label="Class"></select></label></div>
   <div class="seg" id="prper">${Object.entries(PRPER).map(([k, v]) => `<button data-a="prPer" data-p="${k}" class="${PR.per === k ? "on" : ""}">${v}</button>`).join("")}</div><div id="prr"></div>
   <div class="xsets" id="prcats"></div>
   <div class="row"><select id="pror" aria-label="Page"><option value="portrait">Portrait A4</option><option value="landscape">Landscape A4</option></select></div>
   <label class="cb" style="margin-top:10px"><input type="checkbox" id="prbr" checked> Start each record on a new page</label>
   <p></p><button class="btn" data-a="prGo">${ic("print", 18)} Print / save PDF</button><div class="err" id="prerr" role="alert"></div></div>`;
}
function prInit() {
  const cs = myClasses(); if (!$("prc")) return; if (!cs.includes(PR.cls)) PR.cls = cs.includes(I.cls) ? I.cls : cs[0];
  $("prc").innerHTML = cs.map(c => `<option ${c === PR.cls ? "selected" : ""}>${esc(c)}</option>`).join(""); prCats(); prRangeUI();
}
function prCats() {
  const inch = inchargeClasses().includes(PR.cls), all = [["nb", "Notebook record"], ["mk", "Marks record (tests)"], ["cl", "Parent calls record", 1], ["cr", "Class record (summary per student)", 1], ["fi", "Fines & dues", 1], ["at", "Attendance", 1]];
  $("prcats").innerHTML = all.filter(x => !x[2] || inch).map(([k, v]) => `<label class="cb"><input type="checkbox" value="${k}" ${["nb", "mk", "cl"].includes(k) ? "checked" : ""}> ${v}</label>`).join("");
}
function prRangeUI() { $("prr").innerHTML = PR.per === "range" ? `<div class="row"><label class="fl">From<input id="prf" type="date" value="${today()}"></label><label class="fl">To<input id="prt" type="date" value="${today()}"></label></div>` : `<p class="sub">${esc(fmtFull(prRange().from))} – ${esc(fmtFull(prRange().to))} (weeks run Monday to Sunday)</p>`; }
A.prCls = b => { PR.cls = b.value; prCats(); };
A.prPer = b => { PR.per = b.dataset.p; document.querySelectorAll("#prper button").forEach(x => x.classList.toggle("on", x === b)); prRangeUI(); };

A.prGo = b => busy(b, async () => {
  $("prerr").textContent = "";
  try {
    const c = PR.cls, inch = inchargeClasses().includes(c), subs = subjectsOf(c), rg = prRange(), cats = [...document.querySelectorAll("#prcats input:checked")].map(i => i.value);
    if (!cats.length) throw new Error("Tick at least one record.");
    await load([...subs.flatMap(s => [P.marks(c, s), P.nb(c, s), P.syl(c, s)]), ...(inch ? ["fines", "calls", "fees", "attendance"].map(k => P.k(k, c)) : [])], true);
    const inR = d => !!d && d >= rg.from && d <= rg.to, stu = classStudents(c), pass = S.cfg.passPercent, sec = [];
    const tbl = (head, rows, cls = "") => `<table class="pt ${cls}"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("") || `<tr><td colspan="${head.length}">Nothing recorded in this period.</td></tr>`}</tbody></table>`;
    const tr = cells => `<tr>${cells.map(x => `<td>${x}</td>`).join("")}</tr>`;
    const mkTests = sub => { const f = D[P.marks(c, sub)] || {}; return Object.entries(f.tests || {}).filter(([, t]) => inR(t.date)).sort((a, z) => a[1].date.localeCompare(z[1].date)).map(([tid, t]) => ({ tid, t, ms: getAt(f, ["marks", tid]) || {} })); };
    const nbLatest = (sub, sid) => { const en = (D[P.nb(c, sub)] || {}).entries || {}, ds = Object.keys(en).filter(d => inR(d) && en[d][sid]).sort(); return { n: ds.length, d: ds[ds.length - 1], e: ds.length ? en[ds[ds.length - 1]][sid] : null }; };

    if (cats.includes("nb")) {
      let h = `<h3>Notebook checking record</h3>`;
      subs.forEach(sub => {
        const ch = (D[P.syl(c, sub)] || {}).chapters || [], tc = ch.filter(taught).length, en = (D[P.nb(c, sub)] || {}).entries || {}, dates = Object.keys(en).filter(inR).sort();
        h += `<h4>${esc(sub)}</h4>`; if (!tc) { h += `<p class="sub">No chapters set for this subject.</p>`; return; }
        const rows = stu.map(s => { const l = nbLatest(sub, s.id); if (!l.e) return tr([esc(s.name), "0", "—", "—", "—", "—"]); const done = nbDone(l.e, ch), pend = ch.filter((x, i) => taught(x) && (l.e.s[i] || 0) !== 1).map(x => x.n).join(", "); return tr([esc(s.name), l.n, fmtD(l.d), `${done}/${tc}`, `<b>${Math.round(done / tc * 100)}%</b>`, esc(pend.length > 70 ? pend.slice(0, 68) + "…" : pend || "—")]); });
        const pcts = stu.map(s => { const l = nbLatest(sub, s.id); return l.e ? nbDone(l.e, ch) / tc * 100 : null; }).filter(x => x != null);
        h += `<p class="sub">Checked on: ${dates.length ? dates.map(fmtD).join(", ") : "no check in this period"} · class completion ${pcts.length ? Math.round(avg(pcts)) + "%" : "—"} · ${pcts.length}/${stu.length} students checked</p>` + tbl(["Student", "Checks", "Last checked", "Chapters done", "%", "Chapters pending"], rows);
      });
      sec.push(h);
    }
    if (cats.includes("mk")) {
      let h = `<h3>Marks record</h3>`;
      subs.forEach(sub => {
        const ts = mkTests(sub); h += `<h4>${esc(sub)}</h4>`; if (!ts.length) { h += `<p class="sub">No test held in this period.</p>`; return; }
        const rows = stu.map(s => { const ps = []; const cells = ts.map(x => { const e = x.ms[s.id]; if (!e) return ""; if (e.ab) return "Ab"; if (e.g) return esc(e.g); if (!numE(e)) return ""; const p = e.m / e.max * 100; ps.push(p); return `<span class="${p < pass ? "fail" : ""}">${e.m}</span>`; }); return tr([esc(s.name), ...cells, ps.length ? `<b>${Math.round(avg(ps))}%</b>` : "—"]); });
        const foot = `<tr class="avr"><td><b>Class average</b></td>${ts.map(x => { const v = Object.values(x.ms).filter(numE).map(e => e.m); return `<td>${v.length ? fmt1(avg(v)) : ""}</td>`; }).join("")}<td></td></tr>`;
        h += tbl(["Student", ...ts.map(x => `${esc(x.t.name)}<br><small>${fmtD(x.t.date)} · ${tLbl(c, sub, x.t)}</small>`), "Avg %"], [...rows, foot], "mst");
      });
      sec.push(h);
    }
    if (inch && cats.includes("cl")) {
      const cl = callsOf(c).filter(x => inR(x.date)).sort((a, z) => a.date.localeCompare(z.date)), uniq = new Set(cl.map(x => x.sid)).size, by = {}; cl.forEach(x => by[x.resp] = (by[x.resp] || 0) + 1);
      sec.push(`<h3>Parent calls record</h3><p class="sub">${cl.length} calls (${cl.filter(x => callKind(x) === "fee").length} fee, ${cl.filter(x => callKind(x) !== "fee").length} feedback) · grievances: ${cl.filter(x => x.gr && !x.grs).length} open, ${cl.filter(x => x.gr && x.grs).length} resolved · ${uniq} of ${stu.length} parents contacted (${stu.length ? Math.round(uniq / stu.length * 100) : 0}%)${Object.keys(by).length ? " · " + Object.entries(by).map(([k, v]) => `${esc(k)}: ${v}`).join(", ") : ""}</p>` + tbl(["Date", "Student", "Type", "Parent's response", "Remark / grievance", "Called by"], cl.map(x => { const s = stuById(x.sid); return tr([fmtD(x.date), esc(s ? s.name : "?"), callKind(x) === "fee" ? "Fee" : "Feedback", esc(callTxt(x).replace(/^Fee call · /, "")), esc(x.r || "") + (x.gr ? `${x.r ? "<br>" : ""}<b>Grievance (${x.grs ? "resolved " + fmtD(x.grd) : "open"}):</b> ${esc(x.gr)}${x.grn ? " — " + esc(x.grn) : ""}` : ""), esc(x.by || "")]); })));
    }
    if (inch && cats.includes("cr")) {
      const months = Object.keys(FD("attendance", c)).filter(m => /^\d{4}-\d{2}$/.test(m) && m + "-01" <= rg.to && m + "-31" >= rg.from), y = ayStart(rg.to), callsIn = callsOf(c).filter(x => inR(x.date));
      const rows = stu.map(s => {
        const pts = [], nbp = []; subs.forEach(sub => { mkTests(sub).forEach(x => { const e = x.ms[s.id]; if (numE(e)) pts.push(e.m / e.max * 100); }); const ch = (D[P.syl(c, sub)] || {}).chapters || [], tc = ch.filter(taught).length, l = nbLatest(sub, s.id); if (l.e && tc) nbp.push(nbDone(l.e, ch) / tc * 100); });
        let a = 0, lv = 0, any = false; months.forEach(m => { const r = getAt(FD("attendance", c), [m, s.id]); if (r) { any = true; a += r.a || 0; lv += r.l || 0; } });
        const fc = fyCalc(c, y, s.id), fd = fineDue(c, s.id);
        return { cells: [esc(s.name), pts.length, pts.length ? `<b>${Math.round(avg(pts))}%</b>` : "—", nbp.length ? Math.round(avg(nbp)) + "%" : "—", callsIn.filter(x => x.sid === s.id).length, fd ? rupee(fd) : "—", any ? `${a} / ${lv}` : "—", fc.r ? (fc.owedM > 0 ? `<span class="fail">${fyM(fc.owedM)}</span>` : "Up to date") : "—"], avg: pts.length ? avg(pts) : null };
      });
      const withAvg = rows.filter(r => r.avg != null);
      sec.push(`<h3>Class record</h3><p class="sub">${stu.length} students · class average ${withAvg.length ? Math.round(avg(withAvg.map(r => r.avg))) + "%" : "—"} · pass rate ${withAvg.length ? Math.round(withAvg.filter(r => r.avg >= pass).length / withAvg.length * 100) + "%" : "—"} · ${callsIn.length} calls · fines pending ${rupee(stu.reduce((n, s) => n + fineDue(c, s.id), 0))}</p>` + tbl(["Student", "Tests", "Marks avg", "Notebook", "Calls", "Fines pending", "Absent / leave days", `Fees ${fyLab(y)}`], rows.map(r => tr(r.cells)), "mst"));
    }
    if (inch && cats.includes("fi")) {
      const fr = fineRows(c).filter(x => inR(x.date)).sort((a, z) => a.date.localeCompare(z.date));
      sec.push(`<h3>Fines & dues</h3><p class="sub">Added in this period: ${rupee(fr.reduce((n, x) => n + x.amt, 0))} · collected ${rupee(fr.filter(x => x.paid).reduce((n, x) => n + x.amt, 0))} · pending (all dates) ${rupee(stu.reduce((n, s) => n + fineDue(c, s.id), 0))}</p>` + tbl(["Date", "Student", "Type", "Amount", "Status"], fr.map(x => { const s = stuById(x.sid); return tr([fmtD(x.date), esc(s ? s.name : "?"), esc(FTYPE[x.type] || x.type), rupee(x.amt), x.paid ? "Paid" : `<span class="fail">Due</span>`]); })));
    }
    if (inch && cats.includes("at")) {
      const at = FD("attendance", c), months = Object.keys(at).filter(m => /^\d{4}-\d{2}$/.test(m) && m + "-01" <= rg.to && m + "-31" >= rg.from).sort();
      sec.push(`<h3>Attendance</h3><p class="sub">Monthly totals of days absent / leaves taken.</p>` + (months.length ? tbl(["Student", ...months.map(m => `${esc(monthLabel(m))}<br><small>${at[m]._wd != null ? at[m]._wd + " working days" : ""}</small>`), "Total"], stu.map(s => { let a = 0, l = 0; const cells = months.map(m => { const r = at[m][s.id]; if (!r) return "—"; a += r.a || 0; l += r.l || 0; return `${r.a || 0} / ${r.l || 0}`; }); return tr([esc(s.name), ...cells, `<b>${a} / ${l}</b>`]); }), "mst") : `<p>No attendance entered for this period.</p>`));
    }
    const col = TCOL.Teal, head = `<div class="msh">${S.logo ? `<img src="${S.logo}" alt="">` : ""}<div><b>${esc(S.cfg.school)}</b><div>${rg.kind} report · Class ${esc(c)}</div><small>${esc(fmtFull(rg.from))} – ${esc(fmtFull(rg.to))}</small></div></div>`;
    const foot = `<div class="sig"><span>${S.sig ? `<img class="sgi" src="${S.sig}" alt="">` : ""}Prepared by ${esc(S.me.name)}</span><span>Principal</span></div><p class="sub rpf">Generated on ${esc(fmtFull(today()))}</p>`;
    printHTML(`<div class="rp msx" style="--ac:${col}">${head}${sec.map(s => `<section class="rps${$("prbr").checked ? " brk" : ""}">${s}</section>`).join("")}${foot}</div>`, `@page{size:A4 ${$("pror").value};margin:12mm}`);
  } catch (e) { $("prerr").textContent = e.message; }
});

/* ===== extras.js ===== */
/* ----- school logo + teacher signature (stored on the server, cached on the device) ----- */
function loadAssets(pre) {
  S.logo = localStorage.logo || ""; S.sig = localStorage["sig_" + S.me.username] || "";
  if (pre && pre.sig !== undefined) {                                  // the sign-in / boot answer already carries them (the logo only when ours is out of date)
    if (pre.logo !== undefined) { S.logo = pre.logo; try { localStorage.logo = pre.logo; localStorage.logoh = pre.logoh || ""; } catch { } }
    S.sig = pre.sig; try { localStorage["sig_" + S.me.username] = pre.sig; } catch { }
    return;
  }
  return (async () => {                                                // older server: ask separately
    try { S.logo = (await api("GET", "/logo")).img || ""; localStorage.logo = S.logo; } catch { }
    try { S.sig = (await api("GET", "/sig")).img || ""; localStorage["sig_" + S.me.username] = S.sig; } catch { }
  })();
}
function imgPick(max, cb) {
  const i = document.createElement("input"); i.type = "file"; i.accept = "image/*";
  i.onchange = () => {
    const f = i.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onerror = () => toast("That file is not a usable image.", true);
      im.onload = () => {
        let k = Math.min(1, max / Math.max(im.width, im.height)), out = "";
        const enc = (s, type) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(im.width * s)); c.height = Math.max(1, Math.round(im.height * s)); const g = c.getContext("2d"); if (type === "image/jpeg") { g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); } g.drawImage(im, 0, 0, c.width, c.height); return c.toDataURL(type, .75); };
        for (let n = 0; n < 4; n++) { out = enc(k, "image/png"); if (out.length < 90000) break; k *= .7; }
        if (out.length >= 90000) out = enc(k, "image/jpeg");
        cb(out);
      }; im.src = r.result; };
    r.readAsDataURL(f);
  };
  i.click();
}
const sigSend = async img => { try { await api("POST", "/sig", { img }); S.sig = img; localStorage["sig_" + S.me.username] = img; toast(img ? "Signature saved" : "Signature removed"); A.sigScreen(); } catch (x) { toast(x.message, true); } };
A.sigUp = () => imgPick(400, sigSend);
A.sigDel = () => sigSend("");
let SG = { drew: false, last: null };
A.sigDraw = () => {
  sheetL(`<h2>Draw your signature</h2><p class="sub">Sign inside the box with your finger or pen.</p><canvas id="sgc" class="sgc" width="640" height="240"></canvas><p></p><div class="row"><button class="btn" data-a="sigSave" style="flex:2">Save</button><button class="btn alt" data-a="sigClr">Clear</button><button class="btn alt" data-a="sigScreen">Back</button></div>`);
  const c = $("sgc"), g = c.getContext("2d"); SG = { drew: false, last: null }; g.lineWidth = 4; g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#0b1f3a";
  const pt = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
  c.onpointerdown = e => { c.setPointerCapture(e.pointerId); SG.last = pt(e); g.beginPath(); g.moveTo(...SG.last); g.lineTo(SG.last[0] + .1, SG.last[1]); g.stroke(); SG.drew = true; };
  c.onpointermove = e => { if (!SG.last) return; const p = pt(e); g.beginPath(); g.moveTo(...SG.last); g.lineTo(...p); g.stroke(); SG.last = p; };
  c.onpointerup = c.onpointercancel = () => SG.last = null;
};
A.sigClr = () => { const c = $("sgc"); c.getContext("2d").clearRect(0, 0, c.width, c.height); SG.drew = false; };
A.sigSave = () => { if (!SG.drew) return toast("Draw your signature first.", true); sigSend($("sgc").toDataURL("image/png")); };
const logoSend = async img => { try { await api("POST", "/admin/logo", { img }); S.logo = img; localStorage.logo = img; localStorage.logoh = ""; toast(img ? "Logo saved" : "Logo removed"); adSettings($("adb")); } catch (x) { toast(x.message, true); } };
A.logoUp = () => imgPick(300, logoSend);
A.logoDel = () => logoSend("");

/* ----- notebooks: remove one entry, move or delete a whole day ----- */
A.nsDel = () => {
  if (!confirm("Delete this notebook entry?")) return;
  patchQ(N.ep, [{ k: `entries.${N.date}.${NS.id}`, v: null }], e => { toast("Not deleted: " + e.message, true); if ($("n-ls")) entryDraw("n"); });
  entryDraw("n"); closeSheet(true); toast("Entry deleted");
};
A.nDay = () => {
  const n = Object.keys(((D[N.ep] || {}).entries || {})[N.date] || {}).length; if (!n) return toast("No entries on " + fmtD(N.date) + ".", true);
  sheetL(`<h2>Entries of ${esc(fmtD(N.date))}</h2><p class="sub">${n} notebook ${n === 1 ? "entry" : "entries"} · ${esc(N.cls)} ${esc(N.sub)}</p><div class="form"><label>Move all of them to date<input id="ndn" type="date" value="${esc(N.date)}"></label></div><p></p><div class="row"><button class="btn" data-a="nMove" style="flex:2">Move</button><button class="btn alt" data-a="nDelDay">Delete all</button></div><p></p><button class="btn alt" data-a="close">Close</button>`);
};
A.nMove = () => {
  const to = $("ndn").value, from = N.date, en = D[N.ep].entries || {}, src = en[from] || {}; if (!to || to === from) return toast("Choose a different date.", true);
  const clash = Object.keys(src).filter(id => (en[to] || {})[id]).length; if (clash && !confirm(clash + " students already have an entry on that date. Replace them?")) return;
  const ops = Object.entries(src).flatMap(([id, v]) => [{ k: `entries.${to}.${id}`, v }, { k: `entries.${from}.${id}`, v: null }]);
  patchQAll(N.ep, [...ops, { k: `entries.${from}`, v: null }], e => { toast("Not moved: " + e.message, true); nbDraw(); });
  closeSheet(true); toast("Entries moved to " + fmtD(to)); $("ndate").value = to; N.date = to; nbDraw();
};
A.nDelDay = () => {
  const src = (D[N.ep].entries || {})[N.date] || {}, ids = Object.keys(src); if (!confirm(`Delete all ${ids.length} notebook entries of ${fmtD(N.date)}?`)) return;
  patchQAll(N.ep, [...ids.map(id => ({ k: `entries.${N.date}.${id}`, v: null })), { k: `entries.${N.date}`, v: null }], e => { toast("Not deleted: " + e.message, true); nbDraw(); });
  closeSheet(true); toast("Entries deleted"); nbDraw();
};


/* ----- dropdowns: the browser's plain popup is replaced by a menu in the app's own style ----- */
(() => {
  let menu = null, cur = null;
  const close = () => { if (menu) { menu.remove(); menu = null; } if (cur) { cur.setAttribute("aria-expanded", "false"); cur = null; } };
  const open = sel => {
    close(); cur = sel; sel.setAttribute("aria-expanded", "true");
    const r = sel.getBoundingClientRect(), vh = innerHeight, below = vh - r.bottom - 14, above = r.top - 14, up = below < 220 && above > below;
    menu = document.createElement("div"); menu.className = "dd"; menu.setAttribute("role", "listbox");
    menu.innerHTML = [...sel.options].map((o, i) => `<button type="button" role="option" class="ddo${o.selected ? " on" : ""}" data-i="${i}" ${o.disabled ? "disabled" : ""}>${esc(o.textContent)}</button>`).join("");
    document.body.appendChild(menu);
    const w = Math.max(r.width, 170), left = Math.max(8, Math.min(r.left, innerWidth - w - 8));
    menu.style.cssText = `left:${left}px;min-width:${w}px;max-width:${innerWidth - 16}px;max-height:${Math.max(140, Math.min(340, up ? above : below))}px;` + (up ? `bottom:${vh - r.top + 6}px` : `top:${r.bottom + 6}px`);
    const on = menu.querySelector(".on"); if (on) on.scrollIntoView({ block: "center" });
    menu.onclick = e => { const b = e.target.closest(".ddo"); if (!b) return; sel.selectedIndex = +b.dataset.i; close(); sel.dispatchEvent(new Event("input", { bubbles: true })); sel.dispatchEvent(new Event("change", { bubbles: true })); };
  };
  const sel = e => { const s = e.target.closest && e.target.closest("select"); return s && !s.disabled && !s.multiple ? s : null; };
  document.addEventListener("mousedown", e => { if (sel(e)) e.preventDefault(); }, true);
  document.addEventListener("click", e => { const s = sel(e); if (!s) return; e.preventDefault(); e.stopPropagation(); cur === s ? close() : open(s); }, true);
  document.addEventListener("keydown", e => { if (e.key === "Escape") return close(); const s = sel(e); if (s && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(s); } }, true);
  document.addEventListener("pointerdown", e => { if (menu && !e.target.closest(".dd") && !sel(e)) close(); }, true);
  addEventListener("scroll", e => { if (menu && !menu.contains(e.target)) close(); }, true); addEventListener("resize", close);
})();
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
A.cClass = b => { C.cls = b.value; LG = {}; $("cbody").innerHTML = SK; const t = VT; bundleFast(C.cls, () => { if (!stale(t)) cTab(); }); };
A.cGo = b => { C.tab = b.dataset.t; cTab(); };
function cTab() {
  const T = { mon: "Monitors", fine: "Fines & dues", call: "Parent calls", fee: "Fees", att: "Attendance", stu: "Students", sub: "Subjects" };
  $("ctabs").innerHTML = Object.entries(T).map(([k, v]) => `<button class="${C.tab === k ? "on" : ""}" data-a="cGo" data-t="${k}">${v}</button>`).join("");
  ({ mon: cMon, fine: cFine, call: cCall, fee: cFee, att: cAtt, stu: cStu, sub: cSub })[C.tab]($("cbody"));
}

/* ----- subjects of this class: the incharge adds subjects and chooses how exams are marked ----- */
const SUBMODE = { marks: "Marks (normal)", grade: "Grades in exams", split: "Theory + assessment in exams" };
let CSU = null;
function cSub(host) {
  const c = C.cls; if (!CSU || CSU.cls !== c) CSU = { cls: c, list: classSubList(c).slice(), mode: Object.assign({}, ((S.cfg.classSubjects || {})[c] || {}).mode) };
  host.innerHTML = `<div class="card"><h3>Subjects of class ${esc(c)}</h3><p class="sub">Add the subjects this class has and choose how each one is marked in <b>term exams</b>. Unit tests are always marked in marks.</p>
   ${CSU.list.map(s => `<div class="li"><b>${esc(s)}</b><span class="row"><select data-c="csMode" data-s="${esc(s)}" aria-label="Exam marking for ${esc(s)}">${Object.entries(SUBMODE).map(([k, v]) => `<option value="${k}" ${(CSU.mode[s] || "marks") === k ? "selected" : ""}>${v}</option>`).join("")}</select><button class="link" data-a="csUp" data-s="${esc(s)}" aria-label="Move ${esc(s)} up">▲</button><button class="link" data-a="csDn" data-s="${esc(s)}" aria-label="Move ${esc(s)} down">▼</button><button class="link" data-a="csDel" data-s="${esc(s)}">Remove</button></span></div>`).join("") || `<p class="sub">No subjects yet.</p>`}
   <p></p><div class="row"><input id="csn" placeholder="New subject (e.g. Punjabi)" maxlength="12" autocapitalize="words" aria-label="New subject"><button class="btn alt" data-a="csAdd">Add subject</button></div>
   <p class="sub"><b>Grades in exams</b>: exams get a grade (marks optional) and only the grade is printed on mark sheets and report cards. <b>Theory + assessment</b>: exam marks are entered in two parts; only the total is printed. Names use letters and digits only (up to 12), e.g. SocialSci.</p>
   <button class="btn" data-a="csSave">Save subjects</button><div class="err" id="cserr"></div></div>`;
}
A.csMode = b => { if (CSU) CSU.mode[b.dataset.s] = b.value; };
A.csUp = b => csMove(b.dataset.s, -1);
A.csDn = b => csMove(b.dataset.s, 1);
function csMove(sub, d) { const l = CSU.list, i = l.indexOf(sub), j = i + d; if (i < 0 || j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; cSub($("cbody")); }
A.csDel = b => { if (!confirm("Remove " + b.dataset.s + " from this class? Marks and notebooks already saved are kept, just hidden.")) return; CSU.list = CSU.list.filter(x => x !== b.dataset.s); delete CSU.mode[b.dataset.s]; cSub($("cbody")); };
A.csAdd = () => {
  const v = $("csn").value.trim(), er = x => ($("cserr").textContent = x);
  if (!/^[A-Za-z0-9]{1,12}$/.test(v)) return er("Use letters and digits only, up to 12 characters (e.g. SocialSci).");
  if (CSU.list.some(x => x.toLowerCase() === v.toLowerCase())) return er(v + " is already in this class.");
  CSU.list.push(v); cSub($("cbody"));
};
A.csSave = b => busy(b, async () => {
  if (!CSU.list.length) return ($("cserr").textContent = "Keep at least one subject.");
  const mode = {}; CSU.list.forEach(s => { if (CSU.mode[s] && CSU.mode[s] !== "marks") mode[s] = CSU.mode[s]; });
  const c = CSU.cls;
  try { await api("POST", "/class/subjects", { cls: c, list: CSU.list, mode }); S.cfg = await api("GET", "/config"); } catch (x) { return ($("cserr").textContent = x.message); }
  CSU = null; toast("Subjects saved"); buildNav();
  if (C.cls === c && $("cbody")) { const t = VT; await bundleFast(c, () => { if (!stale(t) && $("cbody")) cTab(); }); }
});

/* ----- weekly monitors: automatic round-robin, incharge can override ----- */
/* ----- weekly monitors: automatic round-robin, incharge can override; every class can have its own categories ----- */
const monCats = cls => { const c = getAt(FD("monitors", cls), ["cats"]); return Array.isArray(c) && c.length ? c : S.cfg.monitorCategories; };
function monitorFor(cls, offset, ci) {
  const cats = monCats(cls), d = new Date(); d.setDate(d.getDate() + 7 * offset);
  const key = weekKey(d), roster = classStudents(cls);
  const o = getAt(FD("monitors", cls), ["over", key, termKey(cats[ci])]), ov = o && stuById(o);
  if (ov) return { s: ov, over: true, key };
  return { s: roster.length ? roster[(weekIdx(d) * cats.length + ci) % roster.length] : null, over: false, key };
}
function cMon(host) {
  const cats = monCats(C.cls), roster = classStudents(C.cls), own = Array.isArray(getAt(FD("monitors", C.cls), ["cats"])) && getAt(FD("monitors", C.cls), ["cats"]).length;
  const head = `<div class="row between"><h3 style="margin:0">This week's monitors</h3><button class="btn alt sm" data-a="monCats">Edit categories</button></div>`;
  if (!cats.length) return host.innerHTML = `<div class="card">${head}<p class="sub">No monitor categories yet. Tap “Edit categories” to add the ones your class needs (Discipline, Diary, Cleanliness…).</p></div>`;
  host.innerHTML = `<div class="card">${head}<p class="sub">Roster rotates automatically so every student gets a turn. Pick a name to override. ${own ? "These categories are set for your class." : "Using the school's default categories."}</p>${[0, 1].map(off => `<h4>${off ? "Next week" : "This week"}</h4><div class="mons">${cats.map((c, i) => { const m = monitorFor(C.cls, off, i); return `<div class="mon"><span class="mcat">${esc(c)}</span><span class="mp p${i % 3}">${m.s ? esc(m.s.name) : "—"}${m.over ? " ✎" : ""}</span><select data-c="monSet" data-cat="${esc(c)}" data-off="${off}" aria-label="Override ${esc(c)}"><option value="">Auto</option>${roster.map(s => `<option value="${esc(s.id)}" ${m.over && m.s.id === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></div>`; }).join("")}</div>`).join("")}</div>`;
}
A.monSet = b => {
  const d = new Date(); d.setDate(d.getDate() + 7 * +b.dataset.off); const key = weekKey(d), cls = C.cls;
  patchQ(P.k("monitors", cls), [{ k: `over.${key}.${termKey(b.dataset.cat)}`, v: b.value || null }], e => { toast("Monitor was not saved: " + e.message, true); if (C.cls === cls && $("cbody")) cTab(); });
  cMon($("cbody"));
};
/* category editor */
const mcRow = v => `<div class="mcrow"><input class="mcn" value="${esc(v)}" placeholder="Category name (e.g. Discipline)" maxlength="24" aria-label="Category name"><button class="link" data-a="mcDel" aria-label="Remove category">✕</button></div>`;
A.monCats = () => {
  const cats = monCats(C.cls);
  sheet(`<h2>Monitor categories · ${esc(C.cls)}</h2><p class="sub">These are for your class only. The weekly rotation uses this list. Renaming a category starts it fresh (earlier overrides for the old name are not carried over).</p><div id="mclist" class="mclist">${(cats.length ? cats : [""]).map(mcRow).join("")}</div><p><button class="btn alt sm" data-a="mcAdd">Add category</button></p><div class="row"><button class="btn" data-a="mcSave" style="flex:2">Save</button><button class="btn alt" data-a="mcDefault">Use school default</button></div><p></p><button class="btn alt" data-a="close">Cancel</button><div class="err" id="e2"></div>`);
};
A.mcAdd = () => { $("mclist").insertAdjacentHTML("beforeend", mcRow("")); dirty = true; $("mclist").lastElementChild.querySelector("input").focus(); };
A.mcDel = b => { b.closest(".mcrow").remove(); dirty = true; };
A.mcSave = () => {
  const list = [...document.querySelectorAll("#mclist .mcn")].map(i => i.value.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (new Set(list.map(x => x.toLowerCase())).size !== list.length) return $("e2").textContent = "Two categories have the same name.";
  if (list.length > 12) return $("e2").textContent = "Use at most 12 categories.";
  const cls = C.cls; patchQ(P.k("monitors", cls), [{ k: "cats", v: list.length ? list : null }], e => { toast("Categories were not saved: " + e.message, true); if (C.cls === cls && $("cbody")) cTab(); });
  closeSheet(true); cMon($("cbody")); toast("Categories saved");
};
A.mcDefault = () => { const cls = C.cls; patchQ(P.k("monitors", cls), [{ k: "cats", v: null }], e => { toast(e.message, true); if (C.cls === cls && $("cbody")) cTab(); }); closeSheet(true); cMon($("cbody")); toast("Using the school's default categories"); };

/* ----- fines & dues ----- */
function cFine(host) {
  const rows = fineRows(C.cls), due = rows.filter(f => !f.paid).reduce((n, f) => n + f.amt, 0), got = rows.filter(f => f.paid).reduce((n, f) => n + f.amt, 0), def = classStudents(C.cls).filter(s => fineDue(C.cls, s.id) > 0).length;
  host.innerHTML = `<div class="kpis"><div class="kpi"><small>Pending</small><b>${rupee(due)}</b></div><div class="kpi"><small>Collected</small><b>${rupee(got)}</b></div><div class="kpi ${def ? "bad" : ""}"><small>Students with dues</small><b>${def}</b></div></div><div id="fent"></div><div id="flog"></div>`;
  entry($("fent"), { id: "f", cls: C.cls, counter: false, done: () => false, note: "Tap a student to log a fine or an I-card / other due. Red badges show what is still pending.", tail: s => { const d = fineDue(C.cls, s.id); return d ? `<span class="pill bad">${rupee(d)} due</span>` : ""; }, pick: fOpen }); logDraw("fines");
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
  const cls = C.cls; patchQ(P.k("fines", cls), [{ k: "items." + id, v: { sid, type: $("ft").value, amt, date: $("fd").value, paid: 0, r: $("fr").value.trim(), by: S.me.name, t: Date.now() } }], e => { toast("A fine was not saved: " + e.message, true); if (C.cls === cls && $("cbody")) cTab(); });
  dirty = false; cFine($("cbody")); const n = entryNext("f", sid); n ? fOpen(n.id) : closeSheet(true); toast("Saved");
});
A.fPay = b => {
  const f = FD("fines", C.cls).items[b.dataset.id], cls = C.cls;
  patchQ(P.k("fines", cls), [{ k: `items.${b.dataset.id}.paid`, v: f.paid ? 0 : 1 }, { k: `items.${b.dataset.id}.pd`, v: f.paid ? null : today() }], e => { toast("Not saved: " + e.message, true); if (C.cls === cls && $("cbody")) cTab(); });
  fOpen(b.dataset.s); cFine($("cbody"));
};

/* ----- parent calls: feedback calls (with optional grievances) and fee calls ----- */
const FEE_RESP = ["Already paid", "Will deposit until", "Special payment plan", "Will talk to MD sir"];
const callKind = c => c.kind === "fee" ? "fee" : "fb";
const callsOfKind = (cls, kind, sid) => callsOf(cls, sid).filter(c => callKind(c) === kind);
const callTxt = c => (callKind(c) === "fee" ? "Fee call · " : "") + c.resp + (c.until ? " " + fmtD(c.until) : "");
const grBadge = c => c.gr ? (c.grs ? ` <span class="pill ok">grievance resolved</span>` : ` <span class="pill bad">grievance open</span>`) : "";
function cCall(host) {
  const k = C.ck = C.ck || "fb", all = classStudents(C.cls), y = ayStart();
  const todo = k === "fb" ? stats(C.cls).rows.filter(r => r.risk.length && !calledThisWeek(C.cls, r.s.id, "fb")).map(r => ({ s: r.s, note: r.risk[0] }))
    : all.filter(s => fyDef(C.cls, y, s.id) && !calledThisWeek(C.cls, s.id, "fee")).map(s => ({ s, note: fyM(fyCalc(C.cls, y, s.id).owedM) + " due" }));
  const cov = all.filter(s => calledThisWeek(C.cls, s.id, k)).length, open = callsOf(C.cls).filter(c => c.gr && !c.grs && stuById(c.sid));
  host.innerHTML = `<div class="seg" id="cks"><button class="${k === "fb" ? "on" : ""}" data-a="cKind" data-k="fb">Feedback calls</button><button class="${k === "fee" ? "on" : ""}" data-a="cKind" data-k="fee">Fee calls</button></div>
   ${open.length ? `<div class="card"><div class="row between"><b>Open grievances</b><span class="pill bad">${open.length}</span></div>${open.map(c => `<div class="lrow"><div class="lm"><b>${esc(stuById(c.sid).name)}</b><small>${fmtD(c.date)} · ${esc(c.gr)}</small></div><button class="btn alt sm" data-a="grRes" data-id="${esc(c.id)}">Resolve</button></div>`).join("")}</div>` : ""}
   <div class="card"><b>Calls to make</b><p class="sub">${k === "fb" ? "Students with 2+ notebook chapters pending or low / falling marks, not called this week." : "Students whose fee months are pending, not called this week."}</p><div class="row chips">${todo.length ? todo.map(t => `<button class="chip bad" data-a="cPick" data-id="${esc(t.s.id)}">${esc(t.s.name)} <small>${esc(t.note)}</small></button>`).join("") : `<span class="sub">Nobody pending. 🎉</span>`}</div><p class="sub">${k === "fb" ? "Feedback" : "Fee"} calls this week: ${cov}/${all.length} parents called.</p></div>
   <div class="card"><div class="row mid"><label class="fl">Date for the calls you enter<input id="cdd" type="date" value="${C.callDate || today()}" data-c="cDate"></label><p class="sub" style="flex:2;margin:0;min-width:180px">Set it once: every call you log below uses this date.</p></div></div><div id="cent"></div><div id="clog"></div>`;
  entry($("cent"), { id: "c", cls: C.cls, done: s => calledThisWeek(C.cls, s.id, k), tail: s => { const c = callsOfKind(C.cls, k, s.id)[0]; return c ? `${esc(fmtD(c.date))} · ${esc(callTxt(c))}${grBadge(c)}` : ""; }, pick: callOpen });
  logDraw("calls");
  const on = $("cks") && $("cks").querySelector(".on"); if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest", inline: "center" });
}
A.cKind = b => { C.ck = b.dataset.k; LG.calls = null; cCall($("cbody")); };
A.cDate = b => { C.callDate = b.value || today(); };
A.cPick = b => callOpen(b.dataset.id);
A.cRespCh = b => { const w = $("cuw"); if (w) w.classList.toggle("hide", b.value !== "Will deposit until"); };
A.cGrCh = b => { $("cgt").classList.toggle("hide", !b.checked); const w = $("grsw"); if (w) w.classList.toggle("hide", !b.checked); };
function callOpen(id) {
  const k = C.ck || "fb", fee = k === "fee", s = stuById(id), h = callsOfKind(C.cls, k, id).slice(0, 3), y = ayStart(), fc = fyCalc(C.cls, y, id);
  const r = fee ? null : stats(C.cls).rows.find(x => x.s.id === id), wk = new Date(Date.now() + 7 * 864e5);
  sheet(`<h2>${esc(s.name)} <small>${fee ? "Fee call" : "Feedback call"}</small></h2>${fee ? (fc.r ? `<p>${pill(fyText(C.cls, y, id))} ${fc.owedM > 0 ? pill(fyM(fc.owedM) + " due", "bad") : ""}${fc.bal != null ? " " + pill("₹" + fc.bal + " yearly due") : ""}</p>` : `<p class="sub">No fee record for ${fyLab(y)} yet.</p>`) : (r && r.risk.length ? `<p>${r.risk.map(x => pill(x, "bad")).join(" ")}</p>` : "")}
   ${h.length ? `<div class="hist">${h.map(c => `<div class="hr"><span>${esc(fmtD(c.date))} · ${esc(callTxt(c))}${c.r ? " · " + esc(c.r) : ""}</span></div>`).join("")}</div>` : ""}
   <div class="form"><div class="row"><input id="cd" type="date" value="${C.callDate || today()}" aria-label="Call date"><select id="cr" data-c="cRespCh" aria-label="Parent's response">${(fee ? FEE_RESP : RESP).map(x => `<option>${esc(x)}</option>`).join("")}</select></div>
   ${fee ? `<div id="cuw" class="hide"><label>Will deposit until<input id="cu" type="date" value="${ymd(wk)}"></label></div>` : ""}
   <input id="cn" placeholder="Remark (optional)">
   ${fee ? "" : `<label class="cb"><input type="checkbox" id="cg" data-c="cGrCh"> Record a grievance</label><textarea id="cgt" class="hide" rows="3" placeholder="What is the parent's grievance?"></textarea>`}</div>
   <p></p><div class="row"><button class="btn" data-a="cSave" data-id="${esc(id)}" style="flex:2">Save &amp; next</button><button class="btn alt" data-a="cSkip" data-id="${esc(id)}">Skip</button></div><div class="err" id="e2"></div>`);
}
A.cSkip = b => { if (!closeSheet()) return; const n = entryNext("c", b.dataset.id); if (n) callOpen(n.id); };
A.cSave = b => {
  const sid = b.dataset.id, fee = (C.ck || "fb") === "fee", resp = $("cr").value, v = { sid, date: $("cd").value, resp, r: $("cn").value.trim(), by: S.me.name, t: Date.now() };
  if (!v.date) return $("e2").textContent = "Pick the call date.";
  if (fee) { v.kind = "fee"; if (resp === "Will deposit until") { if (!$("cu").value) return $("e2").textContent = "Pick the date the parent will deposit by."; v.until = $("cu").value; } }
  else if ($("cg").checked) { const g = $("cgt").value.trim(); if (!g) return $("e2").textContent = "Describe the grievance, or untick it."; v.gr = g; v.grs = 0; }
  const cls = C.cls; patchQ(P.k("calls", cls), [{ k: "items." + uid("c"), v }], e => { toast("A call was not saved: " + e.message, true); if (C.cls === cls && $("cbody")) cTab(); });
  dirty = false; cCall($("cbody")); const n = entryNext("c", sid); n ? callOpen(n.id) : closeSheet(true); toast(v.gr ? "Call and grievance logged" : "Call logged");
};
/* grievances: mark resolved */
A.grRes = b => {
  const c = callsOf(C.cls).find(x => x.id === b.dataset.id); if (!c) return;
  sheet(`<h2>Resolve grievance</h2><p class="sub"><b>${esc(stuById(c.sid).name)}</b> · ${esc(c.gr)}</p><div class="form"><input id="grn" placeholder="How was it resolved? (optional)" autofocus><label>Resolved on<input id="grd" type="date" value="${today()}"></label></div><p></p><div class="row"><button class="btn" data-a="grGo" data-id="${esc(c.id)}" style="flex:2">Mark resolved</button><button class="btn alt" data-a="close">Cancel</button></div>`);
};
A.grGo = b => {
  const id = b.dataset.id, note = $("grn").value.trim(), d = $("grd").value || today(), cls = C.cls;
  patchQ(P.k("calls", cls), [{ k: `items.${id}.grs`, v: 1 }, { k: `items.${id}.grd`, v: d }, { k: `items.${id}.grn`, v: note || null }], e => { toast("Not saved: " + e.message, true); if (C.cls === cls && $("cbody")) cTab(); });
  closeSheet(true); cCall($("cbody")); toast("Grievance marked resolved");
};
const callEditHTML = x => {
  const fee = callKind(x) === "fee";
  return `<div class="form"><div class="row"><input id="ed" type="date" value="${esc(x.date)}" aria-label="Date"><select id="er" data-c="cRespCh" aria-label="Response">${(fee ? FEE_RESP : RESP).map(r => `<option ${r === x.resp ? "selected" : ""}>${esc(r)}</option>`).join("")}</select></div>
   ${fee ? `<div id="cuw" class="${x.resp === "Will deposit until" ? "" : "hide"}"><label>Will deposit until<input id="cu" type="date" value="${esc(x.until || "")}"></label></div>` : `<label class="cb"><input type="checkbox" id="cg" data-c="cGrCh" ${x.gr ? "checked" : ""}> Grievance</label><textarea id="cgt" rows="3" class="${x.gr ? "" : "hide"}" placeholder="Grievance">${esc(x.gr || "")}</textarea><label class="cb ${x.gr ? "" : "hide"}" id="grsw"><input type="checkbox" id="cgs" ${x.grs ? "checked" : ""}> Resolved</label>`}
   <input id="en" placeholder="Remark" value="${esc(x.r || "")}"></div>`;
};
function callEditRead(rest) {
  const fee = callKind(rest) === "fee", resp = $("er").value, v = Object.assign(rest, { date: $("ed").value, resp, r: $("en").value.trim(), t: Date.now() });
  delete v.until;
  if (fee) { if (resp === "Will deposit until") { if (!$("cu").value) return { err: "Pick the date the parent will deposit by." }; v.until = $("cu").value; } }
  else { const on = $("cg").checked, g = $("cgt").value.trim(); if (on && !g) return { err: "Describe the grievance, or untick it." };
    if (on) { v.gr = g; if ($("cgs").checked) { v.grs = 1; v.grd = v.grd || today(); } else { v.grs = 0; delete v.grd; delete v.grn; } } else { delete v.gr; delete v.grs; delete v.grd; delete v.grn; } }
  return { v };
}

/* ----- log manager (calls + fines): edit, change dates and delete one or many ----- */
let LG = {};
const lgItems = k => (k === "calls" ? callsOfKind(C.cls, C.ck || "fb") : fineRows(C.cls).sort((a, b) => b.date.localeCompare(a.date))).filter(x => stuById(x.sid));
function logDraw(k) {
  const host = $(k === "calls" ? "clog" : "flog"); if (!host) return; const L = LG[k] = LG[k] || { sel: new Set(), n: 15, q: "" };
  host.innerHTML = `<div class="card"><div class="row between"><b>${k === "calls" ? ((C.ck || "fb") === "fee" ? "Fee call log" : "Feedback call log") : "Fines & dues log"}</b><input id="lq-${k}" class="find" placeholder="Search name" value="${esc(L.q)}" aria-label="Search log"></div>
   <div class="row tools"><button class="btn alt sm" data-a="lgAll" data-k="${k}">Select / clear all</button><button class="btn alt sm" data-a="lgDate" data-k="${k}">Change date</button>${k === "fines" ? `<button class="btn alt sm" data-a="lgPaid" data-k="fines">Mark paid</button>` : ""}<button class="btn alt sm" data-a="lgDel" data-k="${k}">Delete</button></div><small class="sub" id="lc-${k}"></small><div id="ll-${k}"></div></div>`;
  $("lq-" + k).oninput = e => { L.q = e.target.value.toLowerCase(); L.n = 15; logList(k); };
  logList(k);
}
function logList(k) {
  const L = LG[k], all = lgItems(k), ids = new Set(all.map(x => x.id)); L.sel.forEach(i => { if (!ids.has(i)) L.sel.delete(i); });
  const it = all.filter(x => { const s = stuById(x.sid); return !L.q || (s && s.name.toLowerCase().includes(L.q)); }), part = it.slice(0, L.n);
  $("ll-" + k).innerHTML = part.map(x => { const s = stuById(x.sid); return `<div class="lrow"><label class="cb"><input type="checkbox" data-c="lgChk" data-k="${k}" data-id="${esc(x.id)}" ${L.sel.has(x.id) ? "checked" : ""} aria-label="Select"></label><div class="lm"><b>${esc(s ? s.name : "?")}</b><small>${fmtD(x.date)} · ${k === "calls" ? esc(callTxt(x)) : esc(FTYPE[x.type] || x.type) + " · " + rupee(x.amt) + (x.paid ? " · paid" : " · due")}${x.r ? " · " + esc(x.r) : ""}${k === "calls" ? grBadge(x) : ""}</small></div><button class="link" data-a="lgEdit" data-k="${k}" data-id="${esc(x.id)}">Edit</button></div>`; }).join("") + (it.length > L.n ? `<p><button class="btn alt sm" data-a="lgMore" data-k="${k}">Show more (${it.length - L.n})</button></p>` : "") || `<p class="sub">Nothing logged yet.</p>`;
  lgCount(k);
}
const lgCount = k => { const e = $("lc-" + k); if (e) e.textContent = LG[k].sel.size ? LG[k].sel.size + " selected" : "Tick entries to change their date or delete them together."; };
A.lgChk = b => { const L = LG[b.dataset.k]; b.checked ? L.sel.add(b.dataset.id) : L.sel.delete(b.dataset.id); lgCount(b.dataset.k); };
A.lgMore = b => { LG[b.dataset.k].n += 20; logList(b.dataset.k); };
A.lgAll = b => { const k = b.dataset.k, L = LG[k], vis = [...document.querySelectorAll(`#ll-${k} input[type=checkbox]`)], on = vis.some(c => !c.checked); vis.forEach(c => { c.checked = on; on ? L.sel.add(c.dataset.id) : L.sel.delete(c.dataset.id); }); lgCount(k); };
const lgSel = k => { const ids = [...LG[k].sel]; if (!ids.length) toast("Tick at least one entry first.", true); return ids; };
const lgRun = (k, ops, msg) => { const cls = C.cls; patchQAll(P.k(k, cls), ops, e => { toast("Not saved: " + e.message, true); if (C.cls === cls && $("cbody")) cTab(); }); toast(msg); cTab(); };
A.lgDel = b => { const k = b.dataset.k, ids = lgSel(k); if (!ids.length || !confirm(`Delete ${ids.length} selected ${ids.length === 1 ? "entry" : "entries"}?`)) return; ids.forEach(i => LG[k].sel.delete(i)); lgRun(k, ids.map(i => ({ k: "items." + i, v: null })), ids.length + " deleted"); };
A.lgPaid = b => { const ids = lgSel("fines"); if (!ids.length) return; lgRun("fines", ids.flatMap(i => [{ k: `items.${i}.paid`, v: 1 }, { k: `items.${i}.pd`, v: today() }]), "Marked paid"); };
A.lgDate = b => { const k = b.dataset.k, ids = lgSel(k); if (!ids.length) return; LG.cur = { k, ids }; sheetL(`<h2>Change date</h2><p class="sub">${ids.length} selected ${ids.length === 1 ? "entry" : "entries"} will move to this date.</p><input id="lgd" type="date" value="${today()}" style="width:100%"><p></p><div class="row"><button class="btn" data-a="lgDateGo" style="flex:2">Apply</button><button class="btn alt" data-a="close">Cancel</button></div>`); };
A.lgDateGo = b => busy(b, async () => { const d = $("lgd").value; if (!d) return toast("Pick a date.", true); const { k, ids } = LG.cur; closeSheet(true); await lgRun(k, ids.map(i => ({ k: `items.${i}.date`, v: d })), "Date changed"); });
A.lgEdit = b => {
  const k = b.dataset.k, x = lgItems(k).find(i => i.id === b.dataset.id); if (!x) return; LG.cur = { k, id: x.id, x };
  sheet(`<h2>${esc((stuById(x.sid) || { name: "" }).name)}</h2>` + (k === "calls"
    ? callEditHTML(x)
    : `<div class="row"><select id="et" aria-label="Type">${Object.entries(FTYPE).map(([a, v]) => `<option value="${a}" ${a === x.type ? "selected" : ""}>${v}</option>`).join("")}</select><input id="ea" type="number" inputmode="decimal" value="${x.amt}" aria-label="Amount"><input id="ed" type="date" value="${esc(x.date)}" aria-label="Date"></div><p><input id="en" placeholder="Remark" value="${esc(x.r || "")}" style="width:100%"></p><label class="cb"><input type="checkbox" id="ep" ${x.paid ? "checked" : ""}> Paid</label>`)
    + `<p></p><div class="row"><button class="btn" data-a="lgSave" style="flex:2">Save</button><button class="btn alt" data-a="lgDelOne">Delete</button><button class="btn alt" data-a="close">Cancel</button></div><div class="err" id="e2"></div>`);
};
A.lgSave = b => {
  const { k, x } = LG.cur, { id, ...rest } = x; let v;
  if (!$("ed").value) return $("e2").textContent = "Pick a date.";
  if (k === "calls") { const rr = callEditRead(rest); if (rr.err) return $("e2").textContent = rr.err; v = rr.v; }
  else { const amt = +$("ea").value; if (!(amt > 0)) return $("e2").textContent = "Enter an amount."; const paid = $("ep").checked ? 1 : 0; v = Object.assign(rest, { type: $("et").value, amt, date: $("ed").value, r: $("en").value.trim(), paid, t: Date.now() }); if (paid) v.pd = rest.pd || today(); else delete v.pd; }
  const cls = C.cls; patchQ(P.k(k, cls), [{ k: "items." + id, v }], e => { toast("Not saved: " + e.message, true); if (C.cls === cls && $("cbody")) cTab(); });
  closeSheet(true); toast("Saved"); cTab();
};
A.lgDelOne = () => { const { k, id } = LG.cur; if (!confirm("Delete this entry?")) return; const cls = C.cls; patchQ(P.k(k, cls), [{ k: "items." + id, v: null }], e => { toast("Not deleted: " + e.message, true); if (C.cls === cls && $("cbody")) cTab(); }); closeSheet(true); toast("Deleted"); cTab(); };

/* ----- fees, month-wise (academic year April to March) ----- */
const MN = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const ayStart = (d = today()) => { const y = +d.slice(0, 4), m = +d.slice(5, 7); return m >= 4 ? y : y - 1; };
const fyKey = y => `Y_${y}-${String(y + 1).slice(2)}`, fyLab = y => `${y}-${String(y + 1).slice(2)}`;
const fyMonths = y => MN.map((n, i) => ({ n, i, k: (i < 9 ? y : y + 1) + "-" + String((i + 3) % 12 + 1).padStart(2, "0") }));
const fyRec = (cls, y, sid) => getAt(FD("fees", cls), [fyKey(y), sid]);
const fyElapsed = y => { const t = today(), cur = ayStart(t); if (y < cur) return 12; if (y > cur) return 0; return ((+t.slice(5, 7) + 8) % 12) + 1; };
const fyM = n => (Number.isInteger(n) ? n : n.toFixed(1)) + (n === 1 ? " month" : " months");
function fyTxt(ms, y) {
  const L = fyMonths(y); let i = 0; while (i < 12 && ms[L[i].k] === 2) i++;
  let t = i ? (i === 12 ? "Full year paid" : "Paid till " + L[i - 1].n) : "";
  if (i < 12 && ms[L[i].k] === 1) t += (t ? " + " : "") + "half " + L[i].n;
  const extra = L.filter((m, j) => j > i && ms[m.k]).length; if (extra) t += (t ? " · " : "") + extra + " other month" + (extra > 1 ? "s" : "");
  return t || "Nothing paid";
}
const fyText = (cls, y, sid) => fyTxt((fyRec(cls, y, sid) || {}).months || {}, y);
function fyCalc(cls, y, sid) {
  const r = fyRec(cls, y, sid), ms = (r && r.months) || {}, el = fyElapsed(y); let full = 0, half = 0, paidEl = 0;
  fyMonths(y).forEach((m, i) => { const v = ms[m.k] || 0; if (v === 2) full++; else if (v === 1) half++; if (i < el) paidEl += v === 2 ? 1 : v === 1 ? .5 : 0; });
  return { r, full, half, owedM: Math.max(0, el - paidEl), bal: r && r.total > 0 ? Math.max(0, r.total - (r.paid || 0)) : null };
}
const fyDef = (cls, y, sid) => { const c = fyCalc(cls, y, sid); return !!c.r && c.owedM > 0; };
function feeSummary(cls, sid) {
  const y = ayStart(), c = fyCalc(cls, y, sid); if (!c.r) return `<p class="sub">No fee record for ${fyLab(y)}.</p>`;
  return `<div class="li"><span>${esc(fyText(cls, y, sid))}</span><b>${c.owedM > 0 ? pill(fyM(c.owedM) + " due", "bad") : "Up to date ✓"}</b></div>${c.bal != null ? `<div class="li"><span>Yearly due amount</span><b>${rupee(c.bal)}</b></div>` : ""}`;
}
function cFee(host) {
  C.fy = C.fy || ayStart(); const y = C.fy, all = classStudents(C.cls), cs = all.map(s => fyCalc(C.cls, y, s.id));
  const def = cs.filter(c => c.r && c.owedM > 0).length, paidAmt = cs.reduce((n, c) => n + ((c.r && c.r.paid) || 0), 0), dueAmt = cs.reduce((n, c) => n + (c.bal || 0), 0), recd = cs.filter(c => c.r).length;
  host.innerHTML = `<div class="row"><select id="fyr" data-c="fYear" aria-label="Academic year" style="max-width:200px">${[ayStart() + 1, ayStart(), ayStart() - 1, ayStart() - 2].map(v => `<option value="${v}" ${v === y ? "selected" : ""}>Year ${fyLab(v)}</option>`).join("")}</select></div>
   <div class="kpis"><div class="kpi"><small>With a fee record</small><b>${recd}/${all.length}</b></div><div class="kpi ${def ? "bad" : ""}"><small>Behind on months</small><b>${def}</b></div><div class="kpi"><small>Paid (amounts entered)</small><b>${rupee(paidAmt)}</b></div><div class="kpi"><small>Due (amounts entered)</small><b>${rupee(dueAmt)}</b></div></div><div id="fee"></div>`;
  entry($("fee"), { id: "e", cls: C.cls, note: "Tap a student to mark the months paid (full or half), a quarter, or “paid until” a month. The yearly amount is optional.", done: s => { const c = fyCalc(C.cls, y, s.id); return !!c.r && c.owedM === 0; }, tail: s => { const c = fyCalc(C.cls, y, s.id); return !c.r ? "" : `${esc(fyText(C.cls, y, s.id))}${c.owedM > 0 ? ` <span class="pill bad">${fyM(c.owedM)} due</span>` : ""}`; }, pick: feeOpen });
}
A.fYear = b => { C.fy = +b.value; cFee($("cbody")); };
let FY = {};
function feeOpen(id) {
  const y = C.fy, r = fyRec(C.cls, y, id) || {}; FY = { sid: id, y, ms: Object.assign({}, r.months) };
  sheet(`<h2>${esc(stuById(id).name)}</h2><p class="sub">Fees ${fyLab(y)} · <span id="fytxt"></span></p><div id="fygrid" class="mgrid"></div>
   <div class="row chips">${[0, 1, 2, 3].map(q => `<button class="chip" data-a="fyQ" data-q="${q}">Quarter ${q + 1} <small>${MN[q * 3]}–${MN[q * 3 + 2]}</small></button>`).join("")}</div>
   <div class="row mid"><label class="fl">Paid until<select id="fyu"><option value="">Choose month</option>${MN.map((n, i) => `<option value="${i}">${n}</option>`).join("")}</select></label><label class="cb"><input type="checkbox" id="fyh"> only half of that month</label><button class="btn alt sm" data-a="fyUpto">Apply</button></div>
   <h4>Amounts (optional)</h4><div class="row"><input id="fyt" type="number" inputmode="decimal" placeholder="Total fee for the year ₹" value="${r.total || ""}" aria-label="Total fee for the year"><input id="fyp" type="number" inputmode="decimal" placeholder="Paid so far ₹" value="${r.paid ?? ""}" aria-label="Paid so far"></div>
   <p class="sub" id="fydue"></p><button class="btn alt sm" data-a="fyAmt">Mark months from the paid amount</button>
   <p></p><div class="row"><button class="btn" data-a="fySave" style="flex:2">Save &amp; next</button><button class="btn alt" data-a="fyClear">Clear</button></div><div class="err" id="e2"></div>`);
  fyGrid(); $("fyt").oninput = $("fyp").oninput = fyDue; fyDue();
}
function fyGrid() {
  $("fygrid").innerHTML = fyMonths(FY.y).map(m => { const v = FY.ms[m.k] || 0; return `<button class="mb m${v}" data-a="fyM" data-k="${m.k}"><small>${m.k.slice(0, 4)}</small><br>${m.n}<br>${["–", "½", "✔"][v]}</button>`; }).join("");
  $("fytxt").textContent = fyTxt(FY.ms, FY.y);
}
function fyDue() {
  const t = +$("fyt").value, p = +$("fyp").value || 0;
  $("fydue").innerHTML = t > 0 ? `Due <b>${rupee(Math.max(0, t - p))}</b> of ${rupee(t)} · one month = ${rupee(t / 12)}` : "Enter the yearly total to see the due amount and to mark months from an amount.";
}
A.fyM = b => { const k = b.dataset.k, v = FY.ms[k] || 0, n = v === 0 ? 2 : v === 2 ? 1 : 0; n ? FY.ms[k] = n : delete FY.ms[k]; dirty = true; fyGrid(); };
A.fyQ = b => { const q = +b.dataset.q, ks = fyMonths(FY.y).slice(q * 3, q * 3 + 3).map(m => m.k), all = ks.every(k => FY.ms[k] === 2); ks.forEach(k => all ? delete FY.ms[k] : FY.ms[k] = 2); dirty = true; fyGrid(); };
function fySeq(n) { FY.ms = {}; fyMonths(FY.y).forEach((m, i) => { if (i + 1 <= n) FY.ms[m.k] = 2; else if (i < n) FY.ms[m.k] = 1; }); dirty = true; fyGrid(); }
A.fyUpto = () => { const j = $("fyu").value; if (j === "") return toast("Choose the month first.", true); fySeq(+j + ($("fyh").checked ? .5 : 1)); };
A.fyAmt = () => { const t = +$("fyt").value, p = +$("fyp").value; if (!(t > 0) || !(p >= 0)) return toast("Enter the yearly total and the amount paid.", true); fySeq(Math.min(12, Math.round(p / (t / 12) * 2) / 2)); };
A.fySave = b => busy(b, async () => {
  const total = +$("fyt").value || 0, pRaw = $("fyp").value, paid = pRaw === "" ? null : +pRaw, sid = FY.sid;
  if (paid != null && (paid < 0 || (total && paid > total))) return $("e2").textContent = "Paid amount cannot be more than the total.";
  const has = Object.keys(FY.ms).length || total || paid != null;
  const v = has ? Object.assign({ months: FY.ms, by: S.me.name, t: Date.now() }, total ? { total } : {}, paid != null ? { paid } : {}) : null;
  const cls = C.cls; patchQ(P.k("fees", cls), [{ k: `${fyKey(FY.y)}.${sid}`, v }], e => { toast("Fee entry was not saved: " + e.message, true); if (C.cls === cls && $("cbody")) cTab(); });
  dirty = false; cFee($("cbody")); const n = entryNext("e", sid); n ? feeOpen(n.id) : closeSheet(true); toast("Saved");
});
A.fyClear = () => {
  if (!confirm("Remove this student's fee record for the year?")) return;
  const cls = C.cls; patchQ(P.k("fees", cls), [{ k: `${fyKey(FY.y)}.${FY.sid}`, v: null }], e => { toast("Not cleared: " + e.message, true); if (C.cls === cls && $("cbody")) cTab(); });
  closeSheet(true); cFee($("cbody")); toast("Cleared");
};

/* ----- attendance: monthly totals of absent days and leaves ----- */
const attOf = (cls, m, sid) => getAt(FD("attendance", cls), [m, sid]);
const monthLabel = m => new Date(m + "-01T00:00").toLocaleDateString("en-IN", { month: "long", year: "numeric" });
function cAtt(host) {
  C.am = C.am || today().slice(0, 7); const wd = getAt(FD("attendance", C.cls), [C.am, "_wd"]);
  host.innerHTML = `<div class="card"><div class="row"><label class="fl">Month<input id="am" type="month" value="${C.am}" data-c="aMonth"></label><label class="fl">Working days this month (optional)<input id="awd" type="number" inputmode="numeric" value="${wd ?? ""}" data-c="aWd"></label></div></div><div id="aent"></div>`;
  entry($("aent"), { id: "a", cls: C.cls, note: `Total days absent and leaves taken in <b>${esc(monthLabel(C.am))}</b>. Tap a student.`, done: s => !!attOf(C.cls, C.am, s.id), tail: s => { const a = attOf(C.cls, C.am, s.id); return a ? `${a.a || 0} absent · ${a.l || 0} leave` : ""; }, pick: aOpen });
}
A.aMonth = b => { if (b.value) { C.am = b.value; cAtt($("cbody")); } };
A.aWd = b => { const cls = C.cls; patchQ(P.k("attendance", cls), [{ k: `${C.am}._wd`, v: b.value === "" ? null : +b.value }], e => toast("Working days not saved: " + e.message, true)); toast("Working days saved"); };
function aOpen(id) {
  const a = attOf(C.cls, C.am, id) || {};
  sheet(`<h2>${esc(stuById(id).name)}</h2><p class="sub">${esc(monthLabel(C.am))}</p><div class="row"><label class="fl">Days absent<input id="aa" type="number" inputmode="numeric" min="0" value="${a.a ?? ""}" placeholder="0" autofocus></label><label class="fl">Leaves taken<input id="al" type="number" inputmode="numeric" min="0" value="${a.l ?? ""}" placeholder="0"></label></div><p></p><div class="row"><button class="btn" data-a="aSave" data-id="${esc(id)}" style="flex:2">Save &amp; next</button>${a.t ? `<button class="btn alt" data-a="aClear" data-id="${esc(id)}">Clear</button>` : ""}</div><div class="err" id="e2"></div>`);
  $("sheet").onkeydown = ev => { if (ev.key === "Enter") A.aSave($("sheet").querySelector("[data-a=aSave]")); };
}
A.aSave = b => busy(b, async () => {
  const sid = b.dataset.id, a = +$("aa").value || 0, l = +$("al").value || 0; if (a < 0 || l < 0 || a > 31 || l > 31) return $("e2").textContent = "Enter days between 0 and 31.";
  const cls = C.cls; patchQ(P.k("attendance", cls), [{ k: `${C.am}.${sid}`, v: { a, l, by: S.me.name, t: Date.now() } }], e => { toast("Attendance was not saved: " + e.message, true); if (C.cls === cls && $("aent")) cAtt($("cbody")); });
  dirty = false; entryDraw("a"); const n = entryNext("a", sid); n ? aOpen(n.id) : closeSheet(true);
});
A.aClear = b => { const cls = C.cls; patchQ(P.k("attendance", cls), [{ k: `${C.am}.${b.dataset.id}`, v: null }], e => { toast("Not cleared: " + e.message, true); if (C.cls === cls && $("aent")) cAtt($("cbody")); }); entryDraw("a"); closeSheet(true); };
function attRows(cls, sid, y = ayStart()) {
  const at = FD("attendance", cls); return Object.keys(at).filter(m => /^\d{4}-\d{2}$/.test(m) && m >= y + "-04" && m <= (y + 1) + "-03" && at[m][sid]).sort().map(m => ({ m, wd: at[m]._wd, a: at[m][sid].a || 0, l: at[m][sid].l || 0 }));
}
function attHTML(cls, sid) {
  const rows = attRows(cls, sid); if (!rows.length) return `<p class="sub">No attendance entered for ${fyLab(ayStart())}.</p>`;
  return rows.map(x => `<div class="li"><span>${esc(monthLabel(x.m))}</span><b>${x.a} absent · ${x.l} leave</b></div>`).join("") + `<div class="li"><span>Total</span><b>${rows.reduce((n, x) => n + x.a, 0)} absent · ${rows.reduce((n, x) => n + x.l, 0)} leave</b></div>`;
}


/* ----- students: add, correct, remove to the archive and restore (class incharge and admin) ----- */
S.arch = S.arch || [];
const newSid = () => "sx" + Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 4);
const redrawStu = () => { if (typeof cur !== "undefined" && cur === "cls" && C.tab === "stu" && $("cbody")) cStu($("cbody")); if (typeof cur !== "undefined" && cur === "admin" && AD.tab === "students" && $("adb")) adStudents($("adb")); };
async function loadArch() { try { S.arch = (await api("GET", "/students/archive")).students || []; } catch { } document.querySelectorAll("[data-a=cuArch],[data-a=adArch]").forEach(b => { const n = S.arch.filter(a => a.cls === (b.dataset.a === "adArch" ? AD.cls : C.cls)).length; b.textContent = "Archive" + (n ? " (" + n + ")" : ""); }); return S.arch; }
/* the new student appears at once; the server is told in the background */
function stuAddQ(items) {
  const seen = new Set(), recs = [];
  items.forEach(i => { const name = String(i.name).replace(/\s+/g, " ").trim(), k = i.cls + "|" + nk(name); if (!name || seen.has(k) || classStudents(i.cls).some(s => nk(s.name) === nk(name))) return; seen.add(k); recs.push(Object.assign({ id: newSid(), name, cls: i.cls }, i.roll ? { roll: String(i.roll).slice(0, 8) } : {})); });
  if (!recs.length) return recs;
  recs.forEach(upsertStu); redrawStu();
  api("POST", "/students/add", { students: recs }).then(res => res.students.forEach((s, i) => { if (s.id !== recs[i].id) { S.students = S.students.filter(x => x.id !== recs[i].id); upsertStu(s); } }))
    .catch(e => { S.students = S.students.filter(x => !recs.some(r => r.id === x.id)); toast("Not added: " + e.message, true); }).finally(redrawStu);
  return recs;
}
function stuUpdQ(id, name, roll) {
  const old = Object.assign({}, stuById(id)); if (!old.id) return;
  name = String(name).replace(/\s+/g, " ").trim(); if (classStudents(old.cls).some(s => s.id !== id && nk(s.name) === nk(name))) return toast("Another student in this class has that name.", true);
  upsertStu(Object.assign({}, old, { name, roll: roll || undefined })); redrawStu();
  api("POST", "/students/update", { id, name, roll }).catch(e => { upsertStu(old); toast("Not saved: " + e.message, true); redrawStu(); });
}
function stuArchiveQ(ids) {
  const recs = ids.map(stuById).filter(Boolean); if (!recs.length) return;
  const before = S.students.slice(); S.students = S.students.filter(s => !ids.includes(s.id)); recs.forEach(r => S.arch.push(Object.assign({}, r, { archivedAt: today() }))); redrawStu();
  api("POST", "/students/remove", { ids }).then(() => toast(recs.length + (recs.length === 1 ? " student" : " students") + " moved to the archive"))
    .catch(e => { S.students = before; S.arch = S.arch.filter(a => !ids.includes(a.id)); toast("Not removed: " + e.message, true); redrawStu(); });
}
function stuRestoreQ(id, name) {
  const a = S.arch.find(x => x.id === id); if (!a) return;
  name = String(name || a.name).replace(/\s+/g, " ").trim(); if (classStudents(a.cls).some(s => nk(s.name) === nk(name))) return toast("A student named " + name + " is already in " + a.cls + ".", true);
  const rec = Object.assign({}, a, { name }); delete rec.archivedAt; delete rec.by; upsertStu(rec); const before = S.arch.slice(); S.arch = S.arch.filter(x => x.id !== id); redrawStu();
  api("POST", "/students/restore", { id, name }).then(() => toast(name + " restored with all earlier records"))
    .catch(e => { S.students = S.students.filter(s => s.id !== id); S.arch = before; toast("Not restored: " + e.message, true); redrawStu(); });
}
function cStu(host) {
  const list = classStudents(C.cls), na = S.arch.filter(a => a.cls === C.cls).length;
  host.innerHTML = `<div class="row"><button class="btn" data-a="cuEdit" data-id="">Add student</button><button class="btn alt" data-a="cuBulk">Add several</button><button class="btn alt" data-a="cuArch">Archive${na ? " (" + na + ")" : ""}</button></div>
   <div class="card"><div class="row between"><b>${list.length} students in ${esc(C.cls)}</b>${list.length ? `<button class="link" data-a="cuRemSel">Remove selected</button>` : ""}</div>${list.map(s => `<div class="lrow"><label class="cb"><input type="checkbox" class="cuc" value="${esc(s.id)}" aria-label="Select ${esc(s.name)}"></label><div class="lm"><b>${esc(s.name)}</b>${s.roll ? `<small>roll ${esc(s.roll)}</small>` : ""}</div><button class="link" data-a="cuEdit" data-id="${esc(s.id)}">Edit</button></div>`).join("") || `<p class="sub">No students yet.</p>`}</div>
   <p class="sub">Removed students go to the Archive with all their marks, notebooks, calls and fees. Restore them any time, even under a new name.</p>`;
  loadArch();
}
A.cuEdit = b => {
  const s = stuById(b.dataset.id) || { id: "", name: "", roll: "" };
  sheet(`<h2>${s.id ? "Edit student" : "Add student to " + esc(C.cls)}</h2><div class="form"><input id="sn" placeholder="Full name" value="${esc(s.name)}" autofocus><input id="sr" placeholder="Roll no. (optional)" value="${esc(s.roll || "")}"></div><p></p><div class="row"><button class="btn" data-a="cuSave" data-id="${esc(s.id)}" style="flex:2">Save</button><button class="btn alt" data-a="close">Cancel</button></div>${s.id ? `<p></p><button class="btn alt sm" data-a="cuRem" data-id="${esc(s.id)}">Remove student (move to archive)</button>` : ""}<div class="err" id="e2"></div>`);
};
A.cuSave = b => {
  const name = $("sn").value.trim(), roll = $("sr").value.trim(); if (!name) return $("e2").textContent = "Enter a name.";
  if (b.dataset.id) { stuUpdQ(b.dataset.id, name, roll); return closeSheet(true); }
  const ar = S.arch.find(a => a.cls === C.cls && nk(a.name) === nk(name));
  if (ar && confirm(`“${ar.name}” is in the archive (removed ${fmtD(ar.archivedAt)}). Restore them with all their earlier records?\n\nOK = restore, Cancel = add as a brand-new student.`)) { stuRestoreQ(ar.id, ar.name); return closeSheet(true); }
  if (classStudents(C.cls).some(s => nk(s.name) === nk(name))) return $("e2").textContent = "That student is already in the class.";
  stuAddQ([{ name, cls: C.cls, roll }]); closeSheet(true);
};
A.cuBulk = () => sheet(`<h2>Add several students</h2><p class="sub">One per line: <b>Name</b> or <b>Name, roll no.</b>. Students already in ${esc(C.cls)} are skipped.</p><textarea id="sb" rows="8" autofocus></textarea><p></p><div class="row"><button class="btn" data-a="cuBulkGo" style="flex:2">Add</button><button class="btn alt" data-a="close">Cancel</button></div><div class="err" id="e2"></div>`);
A.cuBulkGo = () => {
  const list = $("sb").value.split("\n").map(l => l.trim()).filter(Boolean).map(l => { const [name, roll] = l.split(",").map(x => x.trim()); return { name, cls: C.cls, roll }; });
  if (!list.length) return $("e2").textContent = "Type at least one name.";
  const n = stuAddQ(list).length; closeSheet(true); toast(n + " added" + (n < list.length ? ", " + (list.length - n) + " already in the class" : ""));
};
A.cuRem = b => { const s = stuById(b.dataset.id); if (!s || !confirm(`Remove ${s.name}? They move to the Archive with all their records and can be restored later.`)) return; closeSheet(true); stuArchiveQ([s.id]); };
A.cuRemSel = () => {
  const ids = [...document.querySelectorAll(".cuc:checked")].map(c => c.value); if (!ids.length) return toast("Tick the students to remove first.", true);
  if (!confirm(`Remove ${ids.length} ${ids.length === 1 ? "student" : "students"}? They move to the Archive with all their records and can be restored later.`)) return; stuArchiveQ(ids);
};
async function archDraw(cls) {
  sheetL(`<h2>Archive · ${esc(cls)}</h2><p class="sub">Loading…</p>`); await loadArch();
  const list = S.arch.filter(a => a.cls === cls);
  sheetL(`<h2>Archive · ${esc(cls)}</h2><p class="sub">Removed students keep all their marks, notebooks, calls and fees. Restore one to bring everything back. You can give them a new name.</p><div class="mlist">${list.map(a => `<div class="lrow"><div class="lm"><b>${esc(a.name)}</b><small>removed ${esc(fmtD(a.archivedAt || today()))}</small></div><button class="link" data-a="arRestore" data-id="${esc(a.id)}">Restore</button></div>`).join("") || `<p class="sub">Nothing in the archive.</p>`}</div><p></p><button class="btn alt" data-a="close">Close</button>`);
}
A.cuArch = () => archDraw(C.cls); A.adArch = () => archDraw(AD.cls);
A.arRestore = b => { const a = S.arch.find(x => x.id === b.dataset.id); if (!a) return; sheet(`<h2>Restore ${esc(a.name)}</h2><p class="sub">All their earlier records in ${esc(a.cls)} come back. Change the name if they should return under a different one.</p><input id="arn" value="${esc(a.name)}" style="width:100%" autofocus><p></p><div class="row"><button class="btn" data-a="arGo" data-id="${esc(a.id)}" style="flex:2">Restore</button><button class="btn alt" data-a="close">Cancel</button></div>`); };
A.arGo = b => { const name = $("arn").value.trim(); if (!name) return; closeSheet(true); stuRestoreQ(b.dataset.id, name); };
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
/* ----- marks trend filters: what (test marks / unit test exams / term exams / all) and when (1-3 months, term, session, custom) ----- */
const KINDL = { test: "Test marks", unit: "Unit test exams", term: "Term exams", all: "All data" };
const kindOk = p => { const k = I.kind || "test"; return k === "all" || (k === "test" ? !p.term : p.term && (k === "unit") === /unit/i.test(p.x)); };
const iRange = () => {
  const r = I.rng || "3m", t = new Date(), to = ymd(t), y = ayStart(), m = t.getMonth() + 1;
  if (/^\dm$/.test(r)) return { from: ymd(new Date(t.getFullYear(), t.getMonth() - +r[0], t.getDate())), to };
  if (r === "term") return m >= 4 && m <= 9 ? { from: `${y}-04-01`, to: `${y}-09-30` } : { from: `${y}-10-01`, to: `${y + 1}-03-31` };
  if (r === "year") return { from: `${y}-04-01`, to: `${y + 1}-03-31` };
  return { from: I.from || "0000-01-01", to: I.to || "9999-12-31" };
};
const ptOk = p => { const g = iRange(); return kindOk(p) && p.date >= g.from && p.date <= g.to; };
const RNGL = { "1m": "1 month", "2m": "2 months", "3m": "3 months", term: "This term (" + (new Date().getMonth() + 1 >= 4 && new Date().getMonth() + 1 <= 9 ? "Apr–Sep" : "Oct–Mar") + ")", year: "Entire session", custom: "Custom range" };
const iRangeUI = () => `<div class="row" style="margin-top:8px"><select data-c="iRng" aria-label="Date range">${Object.entries(RNGL).map(([k, v]) => `<option value="${k}" ${(I.rng || "3m") === k ? "selected" : ""}>${v}</option>`).join("")}</select>${I.rng === "custom" ? `<input type="date" data-c="iRngD" data-k="from" value="${esc(I.from || "")}" aria-label="From"><input type="date" data-c="iRngD" data-k="to" value="${esc(I.to || "")}" aria-label="To">` : ""}</div>${I.rng === "custom" ? "" : `<p class="sub" style="margin:4px 0">${esc(fmtFull(iRange().from))} – ${esc(fmtFull(iRange().to))}</p>`}`;
A.iRng = b => { I.rng = b.value; if (b.value === "custom" && !I.from) { I.from = iRange().from === "0000-01-01" ? ymd(new Date(new Date().getFullYear(), new Date().getMonth() - 3, new Date().getDate())) : I.from; I.to = I.to || today(); } sDraw(); };
A.iRngD = b => { I[b.dataset.k] = b.value; sDraw(); };
A.iKind = b => { I.kind = b.dataset.k; sDraw(); };
A.iSub = b => { I.sub = I.sub === b.dataset.s ? "" : b.dataset.s; sDraw(); };
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
  if (I.sub && !subjectsOf(I.cls).includes(I.sub)) I.sub = ""; const st = stats(I.cls), me = st.rows.find(r => r.s.id === s.id), inch = inchargeClasses().includes(I.cls), cm = {};
  subjectsOf(I.cls).forEach(sub => cm[sub] = avg(st.rows.flatMap(r => r.sub[sub] || [])));
  let h = `<div class="card shead"><div class="av">${esc(s.name[0].toUpperCase())}</div><div><h2 style="margin:0">${esc(s.name)}</h2><p class="sub" style="margin:2px 0">Class ${esc(s.cls)} · average ${r0(me.avg)}${me.avg == null ? "" : "%"} (class ${r0(st.classAvg)}${st.classAvg == null ? "" : "%"})</p>${me.risk.map(x => pill(x, "bad")).join(" ")}</div></div>
   <div class="card"><div class="row between"><h3 style="margin:0">Marks trend${I.sub ? " · " + esc(I.sub) : ""}${" · " + KINDL[I.kind || "test"]}</h3>${I.sub ? `<button class="link" data-a="iSub" data-s="">All subjects</button>` : ""}</div><div class="seg" role="group" aria-label="Marks type">${[["test", "Test marks"], ["unit", "Unit test exams"], ["term", "Term exams"], ["all", "All data"]].map(([k, v]) => `<button class="${(I.kind || "test") === k ? "on" : ""}" data-a="iKind" data-k="${k}">${v}</button>`).join("")}</div>${iRangeUI()}${lineChart(me.pts.filter(p => (!I.sub || p.sub === I.sub) && ptOk(p)).map(p => ({ x: (I.sub ? "" : p.sub + " ") + p.x, y: p.y })), { pass: S.cfg.passPercent })}<div class="subs">${subjectsOf(I.cls).map(sub => { const v = avg(me.pts.filter(p => p.sub === sub && ptOk(p)).map(p => p.y)), cv = avg(st.rows.flatMap(x => x.pts.filter(p => p.sub === sub && ptOk(p)).map(p => p.y))); return `<button class="sc${I.sub === sub ? " on" : ""}" data-a="iSub" data-s="${esc(sub)}" aria-pressed="${I.sub === sub}"><small>${esc(sub)}</small><b style="color:${tone(v)}">${r0(v)}${v == null ? "" : "%"}</b><small>class ${r0(cv)}${cv == null ? "" : "%"}</small></button>`; }).join("")}</div><p class="sub" style="margin-bottom:0">Tap a subject to see only its trend.</p></div>
   <div class="card"><h3>Notebooks</h3>${subjectsOf(I.cls).map(sub => { const ch = (D[P.syl(I.cls, sub)] || {}).chapters || [], en = (D[P.nb(I.cls, sub)] || {}).entries || {}, d = Object.keys(en).filter(k => en[k][s.id]).sort().pop(), e = d && en[d][s.id]; return `<div class="nbrow"><b>${esc(sub)}</b><span class="hmr">${ch.map((c, i) => `<i class="hc ${!e || !taught(c) ? "hn" : "s" + (e.s[i] || 0)}" title="${esc(c.n)}"></i>`).join("") || "<small class='sub'>No chapters set</small>"}</span><small>${e ? fmtD(d) : "no entry"}</small></div>`; }).join("")}</div>`;
  if (inch) {
    const f = fineRows(I.cls, s.id).sort((a, b) => b.date.localeCompare(a.date)), cl = callsOf(I.cls, s.id);
    h += `<div class="grid2"><div class="card"><h3>Fines & dues</h3>${f.map(x => `<div class="li"><span>${fmtD(x.date)} · ${FTYPE[x.type]}</span><b>${rupee(x.amt)} ${x.paid ? "✓" : pill("due", "bad")}</b></div>`).join("") || `<p class="sub">None.</p>`}<div class="li"><span>Pending total</span><b>${rupee(fineDue(I.cls, s.id))}</b></div></div>
     <div class="card"><h3>Fee status ${fyLab(ayStart())}</h3>${feeSummary(I.cls, s.id)}</div></div>
     <div class="card"><h3>Parent calls</h3>${cl.slice(0, 6).map(c => `<div class="li"><span>${fmtD(c.date)} · ${esc(c.resp)}${c.r ? " · " + esc(c.r) : ""}</span></div>`).join("") || `<p class="sub">No calls logged.</p>`}</div><div class="card"><h3>Attendance ${fyLab(ayStart())}</h3>${attHTML(I.cls, s.id)}</div>`;
  }
  $("sbody").innerHTML = h;
}

/* ----- reports (print / save as PDF from the browser) ----- */
function iReports(host) {
  const inch = inchargeClasses().includes(I.cls);
  host.innerHTML = `<div class="card"><h3>Print or save as PDF</h3><p class="sub">Opens the print dialog. Choose "Save as PDF" to keep a copy.</p><div class="row"><button class="btn" data-a="repSheet">Class marks sheet</button><button class="btn" data-a="repCards">Report cards (whole class)</button>${inch ? `<button class="btn" data-a="repDef">Defaulters list</button>` : ""}</div></div>`;
  host.insertAdjacentHTML("beforeend", prHTML() + exportHTML() + importHTML()); prInit(); xPer(); xScopeDraw(); impHistLoad();
}
function printHTML(html, css) { if (css && /Android/i.test(navigator.userAgent)) { if (/landscape/.test(css)) toast("Tip: choose Landscape in the print screen for this wide sheet."); css = css.replace(/size:[^;}]*;?/, ""); }
  $("print").innerHTML = (css ? `<style>${css}</style>` : "") + html; setTimeout(() => print(), 50); }
const rhead = (t, logo = 1) => `<div class="rh">${logo && S.logo ? `<img src="${S.logo}" alt="">` : ""}<b>${esc(S.cfg.school)}</b><span>${esc(t)} · ${fmtD(today())}</span></div>`;
A.repSheet = () => {
  const st = stats(I.cls), subs = subjectsOf(I.cls);
  printHTML(`${rhead("Class " + I.cls + " marks sheet")}<table class="pt"><tr><th>Student</th>${subs.map(s => `<th>${esc(s)} %</th>`).join("")}<th>Overall %</th><th>Notebook %</th></tr>${st.rows.map(r => `<tr><td>${esc(r.s.name)}</td>${subs.map(s => `<td>${r0(avg(r.sub[s] || []))}</td>`).join("")}<td><b>${r0(r.avg)}</b></td><td>${r0(r.nb)}</td></tr>`).join("")}<tr><td><b>Class average</b></td>${subs.map(s => `<td>${r0(avg(st.rows.flatMap(r => r.sub[s] || [])))}</td>`).join("")}<td><b>${r0(st.classAvg)}</b></td><td>${r0(st.nbPct)}</td></tr></table>`);
};
/* ----- report cards: the teacher chooses what each card contains ----- */
const RC_DEF = { logo: 1, sub: 1, tests: 1, term: 1, nb: 1, fine: 1, fee: 1, att: 1, calls: 0, attn: 1, sg: ["Class teacher"], par: 1 };
const rcOpt = () => { try { return Object.assign({}, RC_DEF, JSON.parse(localStorage.rcopt || "{}")); } catch { return Object.assign({}, RC_DEF); } };
function termTable(cls, sid, subs) {
  const terms = S.cfg.terms.filter(t => subs.some(s => getAt(D[P.marks(cls, s)] || {}, ["tests", tTid(t)]))); if (!terms.length) return "";
  const cell = (s, t) => { const e = getAt(D[P.marks(cls, s)] || {}, ["marks", tTid(t), sid]); return !e ? "–" : e.ab ? "Ab" : e.g ? esc(e.g) : e.m + "/" + e.max; };
  return `<h4>Term exams</h4><table class="pt"><tr><th>Subject</th>${terms.map(t => `<th>${esc(t)}</th>`).join("")}</tr>${subs.map(s => `<tr><td>${esc(s)}</td>${terms.map(t => `<td>${cell(s, t)}</td>`).join("")}</tr>`).join("")}</table>`;
}
function cardHTML(r, st, o) {
  const subs = subjectsOf(I.cls), inch = inchargeClasses().includes(I.cls), sid = r.s.id, y = ayStart();
  const tests = r.pts.filter(p => !p.term).sort((a, b) => a.sub.localeCompare(b.sub) || a.date.localeCompare(b.date));
  let h = `<section class="rc">${rhead("Progress report", o.logo)}<h2>${esc(r.s.name)} <small>Class ${esc(I.cls)}${r.s.roll ? " · Roll " + esc(r.s.roll) : ""}</small></h2>`;
  if (o.sub) h += `<table class="pt"><tr><th>Subject</th><th>Tests</th><th>Average</th><th>Class avg</th></tr>${subs.map(s => { const v = r.sub[s] || []; return `<tr><td>${esc(s)}</td><td>${v.length}</td><td><b>${r0(avg(v))}</b></td><td>${r0(avg(st.rows.flatMap(x => x.sub[s] || [])))}</td></tr>`; }).join("")}<tr><td><b>Overall</b></td><td>${r.pts.length}</td><td><b>${r0(r.avg)}</b></td><td>${r0(st.classAvg)}</td></tr></table>`;
  if (o.term) h += termTable(I.cls, sid, subs);
  if (o.tests) h += `<h4>Test details</h4><table class="pt">${tests.map(p => `<tr><td>${esc(p.sub)}</td><td>${esc(p.x)}</td><td>${fmtD(p.date)}</td><td>${Math.round(p.y)}%</td></tr>`).join("") || "<tr><td>No tests recorded.</td></tr>"}</table>`;
  if (o.nb) h += `<h4>Notebooks</h4><table class="pt"><tr><th>Subject</th><th>Chapters done</th><th>%</th></tr>${subs.map(s => { const ch = (D[P.syl(I.cls, s)] || {}).chapters || [], en = (D[P.nb(I.cls, s)] || {}).entries || {}, d = Object.keys(en).filter(k => en[k][sid]).sort().pop(), t = ch.filter(taught).length; return `<tr><td>${esc(s)}</td><td>${d && t ? nbDone(en[d][sid], ch) + "/" + t + " · " + fmtD(d) : "—"}</td><td>${d && t ? Math.round(nbDone(en[d][sid], ch) / t * 100) + "%" : "—"}</td></tr>`; }).join("")}</table>`;
  if (inch && o.att) { const rows = attRows(I.cls, sid, y); h += `<h4>Attendance ${fyLab(y)}</h4>` + (rows.length ? `<table class="pt"><tr><th>Month</th><th>Working days</th><th>Absent</th><th>Leaves</th></tr>${rows.map(x => `<tr><td>${esc(monthLabel(x.m))}</td><td>${x.wd ?? "—"}</td><td>${x.a}</td><td>${x.l}</td></tr>`).join("")}<tr><td><b>Total</b></td><td></td><td><b>${rows.reduce((n, x) => n + x.a, 0)}</b></td><td><b>${rows.reduce((n, x) => n + x.l, 0)}</b></td></tr></table>` : `<p>No attendance entered.</p>`); }
  if (inch && (o.fine || o.fee)) h += `<p>${o.fine ? `Fines pending: <b>${rupee(fineDue(I.cls, sid))}</b>` : ""}${o.fine && o.fee ? " · " : ""}${o.fee ? (() => { const c = fyCalc(I.cls, y, sid); return `Fees ${fyLab(y)}: <b>${esc(c.r ? fyText(I.cls, y, sid) : "no record")}</b>${c.owedM > 0 ? ` (${fyM(c.owedM)} pending)` : ""}${c.bal != null ? ` · due ${rupee(c.bal)}` : ""}`; })() : ""}</p>`;
  if (inch && o.calls) { const cl = callsOf(I.cls, sid).slice(0, 3); if (cl.length) h += `<h4>Parent contact</h4><p>${cl.map(c => `${fmtD(c.date)} · ${esc(c.resp)}${c.r ? " · " + esc(c.r) : ""}`).join("<br>")}</p>`; }
  if (o.attn && r.risk.length) h += `<p>Attention: ${esc(r.risk.join(", "))}</p>`;
  return h + `${sigRow(o.sg || ["Class teacher"], o.par)}</section>`;
}
function rcAsk(scope) {
  const o = rcOpt(), inch = inchargeClasses().includes(I.cls);
  const L = [["sub", "Subject-wise summary (tests, average, class average)"], ["tests", "Test-by-test marks"], ["term", "Term exam marks"], ["nb", "Notebook status"], ["att", "Absent days & leaves (month-wise)", 1], ["fine", "Fines pending", 1], ["fee", "Fees (month-wise status)", 1], ["calls", "Parent call notes", 1], ["attn", "Attention / at-risk note"], ["logo", "School logo in the header"]];
  sheetL(`<h2>What should the report card show?</h2><p class="sub">Tick the details to include. Your choice is remembered.</p><div class="xsets" id="rcchk">${L.filter(x => !x[2] || inch).map(([k, v]) => `<label class="cb"><input type="checkbox" value="${k}" ${o[k] ? "checked" : ""}> ${v}</label>`).join("")}</div><h4>Signatures</h4>${sgBoxes("rcsg", o.sg || ["Class teacher"], false)}<div class="xsets"><label class="cb"><input type="checkbox" id="rcpar" ${o.par ? "checked" : ""}> Parent signature line</label></div><p></p><div class="row"><button class="btn" data-a="rcGo" data-s="${scope}" style="flex:2">${ic("print", 18)} Print ${scope === "all" ? "whole class" : "this student"}</button><button class="btn alt" data-a="close">Cancel</button></div>`);
}
A.rcGo = b => {
  const o = rcOpt(); document.querySelectorAll("#rcchk input").forEach(i => o[i.value] = i.checked ? 1 : 0); o.sg = [...document.querySelectorAll("#rcsg input:checked")].map(i => i.value); o.par = $("rcpar").checked ? 1 : 0;
  try { localStorage.rcopt = JSON.stringify(o); } catch { } closeSheet(true);
  const st = stats(I.cls), rows = b.dataset.s === "all" ? st.rows : st.rows.filter(x => x.s.id === I.sid);
  if (rows.length) printHTML(rows.map(r => cardHTML(r, st, o)).join(""));
};
A.repCards = () => rcAsk("all"); A.repOne = () => rcAsk("one");
A.repDef = () => {
  const y = ayStart(), rows = classStudents(I.cls).map(s => ({ s, f: fineDue(I.cls, s.id), c: fyCalc(I.cls, y, s.id) })).filter(x => x.f || (x.c.r && x.c.owedM > 0));
  printHTML(`${rhead("Class " + I.cls + " defaulters")}<table class="pt"><tr><th>Student</th><th>Fines pending</th><th>Fees ${fyLab(y)}</th><th>Months pending</th><th>Due amount</th></tr>${rows.map(x => `<tr><td>${esc(x.s.name)}</td><td>${rupee(x.f)}</td><td>${esc(x.c.r ? fyText(I.cls, y, x.s.id) : "—")}</td><td>${x.c.owedM > 0 ? fyM(x.c.owedM) : "—"}</td><td>${x.c.bal != null ? rupee(x.c.bal) : "—"}</td></tr>`).join("") || "<tr><td>No defaulters 🎉</td></tr>"}</table>`);
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
   <div id="uasg" class="${u.role === "admin" ? "hide" : ""}"><p class="sub">Subjects this teacher teaches. If they are incharge of a class they automatically get every subject of that class, so tick only subjects in other classes.</p>${S.cfg.classes.map(c => `<div class="asg"><b>${esc(c)}</b>${classSubList(c).map(s => `<label class="cb"><input type="checkbox" data-c="${esc(c)}" data-s="${esc(s)}" ${u.assignments.some(a => a.cls === c && a.sub === s) ? "checked" : ""}> ${esc(s)}</label>`).join("")}</div>`).join("")}</div>
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
  host.innerHTML = `<div class="row"><select id="adc" data-c="adCls" aria-label="Class">${S.cfg.classes.map(c => `<option ${c === AD.cls ? "selected" : ""}>${esc(c)}</option>`).join("")}</select><button class="btn" data-a="sEdit" data-id="">Add student</button><button class="btn alt" data-a="sBulk">Import list</button><button class="btn alt" data-a="adArch">Archive</button></div>
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
   <div class="card"><h3>School logo</h3><p class="sub">Printed on mark sheets, report cards and reports.</p><div class="sgprev">${S.logo ? `<img src="${S.logo}" alt="Logo" style="max-height:90px">` : `<small>No logo saved yet.</small>`}</div><div class="row"><button class="btn alt sm" data-a="logoUp">Upload logo</button>${S.logo ? `<button class="btn alt sm" data-a="logoDel">Remove</button>` : ""}</div></div><div class="card"><h3>School settings</h3><div class="form"><label>School name<input id="cs" value="${esc(c.school)}"></label><label>Classes (comma separated, letters/digits)<input id="cc" value="${esc(c.classes.join(", "))}"></label><label>Default subjects (each class starts with these; the class incharge can change their own class under My class → Subjects)<input id="cu" value="${esc(c.subjects.join(", "))}"></label><div id="cuo" class="sorter">${subSortHTML(c.subjects)}</div><label>Monitor categories<input id="cm" value="${esc(c.monitorCategories.join(", "))}"></label><label>Signatories for mark sheets &amp; report cards<input id="cg" value="${esc(sigList().join(", "))}"></label><label>Exam terms (e.g. Term 1, Term 2)<input id="ct" value="${esc(c.terms.join(", "))}"></label><label>Exam grades, best to lowest (for grade-only subjects)<input id="cgr" value="${esc(gradeList().join(", "))}"></label><label>Non-English fine (₹)<input id="cf" type="number" value="${c.nonEnglishFine}"></label><label>Pass mark (%)<input id="cp" type="number" value="${c.passPercent}"></label></div><p></p><button class="btn" data-a="cfgSave">Save settings</button><div class="err" id="e2"></div></div><div class="card"><h3>Recent admin activity</h3><div id="aud" class="sub">Loading…</div></div>`;
  shStatus();
  try { const l = (await api("GET", "/admin/audit")).log.slice(0, 12); $("aud").innerHTML = l.map(x => `<div class="li"><span>${esc(x.who)} ${esc(x.what)}</span><small>${new Date(x.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small></div>`).join("") || "Nothing yet."; } catch { $("aud").textContent = ""; }
}
const subSortHTML = l => l.length > 1 ? `<small class="sub">Order of subjects (the first is shown first):</small>${l.map((x, i) => `<div class="li"><b>${esc(x)}</b><span><button type="button" class="link" data-a="cuMv" data-i="${i}" data-d="-1" aria-label="Move ${esc(x)} up">▲</button><button type="button" class="link" data-a="cuMv" data-i="${i}" data-d="1" aria-label="Move ${esc(x)} down">▼</button></span></div>`).join("")}` : "";
const cuList = () => $("cu").value.split(",").map(x => x.trim()).filter(Boolean);
A.cuMv = b => { const l = cuList(), i = +b.dataset.i, j = i + +b.dataset.d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; $("cu").value = l.join(", "); $("cuo").innerHTML = subSortHTML(l); };
addEventListener("input", e => { if (e.target.id === "cu" && $("cuo")) $("cuo").innerHTML = subSortHTML(cuList()); });
A.cfgSave = b => busy(b, async () => {
  const l = id => $(id).value.split(",").map(x => x.trim()).filter(Boolean);
  const config = { school: $("cs").value.trim(), classes: l("cc"), subjects: l("cu"), monitorCategories: l("cm"), terms: l("ct"), grades: l("cgr"), signatories: l("cg"), nonEnglishFine: +$("cf").value, passPercent: +$("cp").value };
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
  S.cfg.classes.forEach(c => { jobs.push({ cls: c, t: "class " + c + " fines, calls, fees, monitors" }); classSubList(c).forEach(s => jobs.push({ cls: c, sub: s, t: c + " " + s })); });
  let rows = 0;
  for (let i = 0; i < jobs.length; i++) {
    $("shlog").textContent = `Syncing ${jobs[i].t} (${i + 1}/${jobs.length})…`;
    const { t, ...body } = jobs[i];
    try { rows += (await api("POST", "/admin/sheets/sync", body)).rows; } catch (e) { $("shlog").innerHTML = `<span style="color:var(--red)">Stopped at ${esc(t)}: ${esc(e.message)}</span>`; return; }
  }
  $("shlog").innerHTML = `<span class="ok">Done.</span> ${rows} rows are up to date in the Google Sheet.`; shStatus();
});

/* ===== export.js ===== */
/* ===== Excel export + import. "My class" = everything for the class you are incharge of;
   "Subject-wise" = chosen subjects of any class you teach, several classes in one file. ===== */
const X = { mode: "month", scope: "" };
const XSETS = [["nb", "Notebook checking record", "s"], ["test", "Test record (unit + term exams)", "s"], ["all", "Combined data (one summary row per student)", "s"], ["att", "Attendance record", "c"], ["fee", "Fees record (month-wise)", "c"], ["call", "Calls record", "c"], ["fine", "Fines & dues record", "c"]];

function exportHTML() {
  const ic2 = inchargeClasses(); if (!X.scope || (X.scope === "c" && !ic2.length)) X.scope = ic2.length ? "c" : "s";
  return `<div class="card" id="xcard"><h3>Export to Excel</h3><p class="sub">${ic2.length ? "Export everything for your own class, or pick subjects (even from several classes) for one file." : "Pick the subjects to export. You can combine different classes in one file."}</p>
   <div class="seg" id="xscope">${ic2.length ? `<button data-a="xScope" data-s="c" class="${X.scope === "c" ? "on" : ""}">My class: all data</button>` : ""}<button data-a="xScope" data-s="s" class="${X.scope === "s" ? "on" : ""}">Subject-wise</button></div><div id="xsc"></div>
   <div class="seg" id="xmodes">${[["date", "Date"], ["month", "Month"], ["year", "Year"], ["all", "All time"]].map(([k, v]) => `<button data-a="xMode" data-m="${k}" class="${X.mode === k ? "on" : ""}">${v}</button>`).join("")}</div><div id="xper"></div>
   <div class="xsets" id="xsets"></div><button class="btn" data-a="xGo">${ic("print", 18)} Download Excel</button><div class="err" id="xerr" role="alert"></div></div>`;
}
function xScopeDraw() {
  const ic2 = inchargeClasses(), cs = myClasses(), el = $("xsc"); if (!el) return;
  el.innerHTML = X.scope === "c"
    ? `<div class="form"><label>Class<select id="xcls">${ic2.length > 1 ? `<option value="*">All my classes (${ic2.length})</option>` : ""}${ic2.map(c => `<option ${c === I.cls ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label></div><p class="sub">All subjects' marks and notebooks, plus attendance, fees, calls and fines of the class.</p>`
    : `<p class="sub">Tick the subjects to export.</p>${cs.map(c => `<div class="asg"><b>${esc(c)}</b>${subjectsOf(c).map(s => `<label class="cb"><input type="checkbox" class="xsub" data-cl="${esc(c)}" data-su="${esc(s)}"> ${esc(s)}</label>`).join("")}<button class="link" data-a="xAll" data-cl="${esc(c)}">All</button></div>`).join("")}`;
  $("xsets").innerHTML = XSETS.filter(x => X.scope === "c" || x[2] === "s").map(([k, v]) => `<label class="cb"><input type="checkbox" value="${k}" checked> ${v}</label>`).join("");
}
A.xScope = b => { X.scope = b.dataset.s; document.querySelectorAll("#xscope button").forEach(x => x.classList.toggle("on", x === b)); xScopeDraw(); };
A.xAll = b => { const bx = [...document.querySelectorAll(`.xsub[data-cl="${b.dataset.cl}"]`)], on = bx.some(i => !i.checked); bx.forEach(i => i.checked = on); };
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
    const rg = xRange(), inR = d => !!d && d >= rg.from && d <= rg.to; let jobs = [];
    if (X.scope === "c") { const sel = $("xcls").value; jobs = (sel === "*" ? inchargeClasses() : [sel]).map(c => ({ c, subs: subjectsOf(c), full: true })); }
    else { const by = {}; document.querySelectorAll(".xsub:checked").forEach(i => (by[i.dataset.cl] = by[i.dataset.cl] || []).push(i.dataset.su)); jobs = Object.entries(by).map(([c, subs]) => ({ c, subs, full: false })); if (!jobs.length) throw new Error("Tick at least one subject."); }
    await loadXlsx();
    const out = {}, add = (name, h, row) => (out[name] = out[name] || { h, rows: [] }).rows.push(row);
    const H = { test: ["Class", "Subject", "Test", "Date", "Student", "Marks", "Out of", "Percent", "Remark", "Entered by", "Type", "Grade", "Theory", "Assessment"], nb: ["Class", "Subject", "Date", "Student", "Chapters done", "Chapters checked", "Percent", "Chapter details", "Remark", "Entered by"],
      fee: ["Class", "Year", "Student", "Total fee", "Paid", "Due", ...MN, "Status", "Entered by"], att: ["Class", "Month", "Student", "Working days", "Absent days", "Leaves", "Entered by"], call: ["Class", "Student", "Date", "Parent's response", "Remark", "Entered by", "Type", "Pay by", "Grievance", "Grievance status", "Resolved on", "Resolution"],
      fine: ["Class", "Student", "Date", "Type", "Amount", "Paid", "Paid on", "Remark", "Entered by"] };
    const all = allSubs(), HC = ["Class", "Student", "Tests taken", "Average %", ...all.map(s => s + " %"), "Notebook checks", "Notebook %", "Calls made", "Last call", "Last response", "Fines added", "Fines pending now", "Fee paid (amount entered)", "Fee due (amount entered)"];
    for (const { c, subs: sl, full } of jobs) {
      toast("Collecting class " + c + "…");
      await load([...sl.flatMap(s => [P.marks(c, s), P.nb(c, s), P.syl(c, s)]), ...(full ? ["fines", "calls", "fees", "attendance"].map(k => P.k(k, c)) : [])], true);
      const stu = classStudents(c), acc = {};
      stu.forEach(s => acc[s.id] = { pts: [], sub: {}, nbP: [], calls: [], fAdd: 0, fPend: 0, fPaid: 0, fBal: 0 });
      sl.forEach(sub => {
        const mf = D[P.marks(c, sub)] || {}, ch = (D[P.syl(c, sub)] || {}).chapters || [], en = (D[P.nb(c, sub)] || {}).entries || {}, tc = ch.filter(taught).length;
        Object.entries(mf.tests || {}).filter(([, t]) => inR(t.date)).sort((a, z) => a[1].date.localeCompare(z[1].date)).forEach(([tid, t]) => stu.forEach(s => {
          const e = getAt(mf, ["marks", tid, s.id]), ok = e && !e.ab;
          if (sets.has("test")) add("Test record", H.test, [c, sub, t.name, t.date, s.name, ok ? (e.m ?? "") : "", e ? (e.max ?? t.max ?? "") : (t.max ?? ""), ok && numE(e) ? pc(e.m, e.max) : "", e ? (e.ab ? "Absent" : e.r || "") : "Not entered", e ? e.by || "" : "", t.term ? "Term" : "Unit", ok ? (e.g || "") : "", ok && e.th != null ? e.th : "", ok && e.th != null ? e.as : ""]);
          if (numE(e)) { const p = e.m / e.max * 100; acc[s.id].pts.push(p); (acc[s.id].sub[sub] = acc[s.id].sub[sub] || []).push(p); }
        }));
        Object.keys(en).filter(inR).sort().forEach(d => stu.forEach(s => {
          const e = en[d][s.id]; if (!e) return; const done = nbDone(e, ch);
          if (sets.has("nb")) add("Notebook record", H.nb, [c, sub, d, s.name, done, tc, pc(done, tc), ch.map((x, i) => taught(x) ? `${x.n}: ${["pending", "done", "partial"][e.s[i] || 0]}` : null).filter(Boolean).join("; "), e.r || "", e.by || ""]);
          if (tc) acc[s.id].nbP.push(done / tc * 100);
        }));
      });
      if (full) {
        const fe = FD("fees", c);
        Object.keys(fe).filter(k => /^Y_\d{4}-\d{2}$/.test(k)).sort().forEach(k => { const y = +k.slice(2, 6); if (`${y}-04-01` > rg.to || `${y + 1}-03-31` < rg.from) return; stu.forEach(s => { const r = fe[k][s.id]; if (!r) return; const cl = fyCalc(c, y, s.id); acc[s.id].fPaid += r.paid || 0; acc[s.id].fBal += cl.bal || 0; if (sets.has("fee")) add("Fees", H.fee, [c, fyLab(y), s.name, r.total ?? "", r.paid ?? "", cl.bal ?? "", ...fyMonths(y).map(m => ["", "Half", "Full"][(r.months || {})[m.k] || 0]), fyTxt(r.months || {}, y), r.by || ""]); }); });
        const at = FD("attendance", c);
        Object.keys(at).filter(m => /^\d{4}-\d{2}$/.test(m) && m + "-01" <= rg.to && m + "-31" >= rg.from).sort().forEach(m => stu.forEach(s => { const a = at[m][s.id]; if (a && sets.has("att")) add("Attendance", H.att, [c, m, s.name, at[m]._wd ?? "", a.a || 0, a.l || 0, a.by || ""]); }));
        callsOf(c).filter(k => inR(k.date)).reverse().forEach(k => { const s = stuById(k.sid); if (!s || !acc[s.id]) return; acc[s.id].calls.push(k); if (sets.has("call")) add("Calls record", H.call, [c, s.name, k.date, k.resp, k.r || "", k.by || "", callKind(k) === "fee" ? "Fee" : "Feedback", k.until || "", k.gr || "", k.gr ? (k.grs ? "Resolved" : "Open") : "", k.grd || "", k.grn || ""]); });
        fineRows(c).sort((a, z) => a.date.localeCompare(z.date)).forEach(f => { const s = stuById(f.sid); if (!s || !acc[s.id]) return; if (!f.paid) acc[s.id].fPend += f.amt; if (inR(f.date)) { acc[s.id].fAdd += f.amt; if (sets.has("fine")) add("Fines record", H.fine, [c, s.name, f.date, FTYPE[f.type] || f.type, f.amt, f.paid ? "Yes" : "No", f.pd || "", f.r || "", f.by || ""]); } });
      }
      if (sets.has("all")) stu.forEach(s => { const a = acc[s.id], lc = a.calls[a.calls.length - 1]; add("Combined", HC, [c, s.name, a.pts.length, a.pts.length ? Math.round(avg(a.pts) * 10) / 10 : "", ...all.map(x => a.sub[x] ? Math.round(avg(a.sub[x]) * 10) / 10 : ""), a.nbP.length, a.nbP.length ? Math.round(avg(a.nbP) * 10) / 10 : "", full ? a.calls.length : "", lc ? lc.date : "", lc ? lc.resp : "", full ? a.fAdd : "", full ? a.fPend : "", full ? a.fPaid : "", full ? a.fBal : ""]); });
    }
    const order = ["Combined", "Test record", "Notebook record", "Attendance", "Fees", "Calls record", "Fines record"], names = order.filter(n => out[n]);
    const total = names.reduce((n, k) => n + out[k].rows.length, 0); if (!total) throw new Error("No records found for " + rg.text + ".");
    const wb = XLSX.utils.book_new(), addSheet = (n, h, rows) => { const ws = XLSX.utils.aoa_to_sheet([h, ...rows]); ws["!cols"] = h.map((x, i) => ({ wch: Math.min(48, Math.max(String(x).length, ...rows.slice(0, 300).map(r => String(r[i] ?? "").length)) + 2) })); XLSX.utils.book_append_sheet(wb, ws, n.slice(0, 31)); };
    addSheet("Info", ["Item", "Details"], [["School", S.cfg.school], ["Classes", jobs.map(j => j.c).join(", ")], ["Subjects", X.scope === "c" ? "All subjects" : [...new Set(jobs.flatMap(j => j.subs))].join(", ")], ["Period", rg.text], ["Included", names.join(", ")], ["Exported by", S.me.name], ["Exported on", new Date().toLocaleString("en-IN")]]);
    names.forEach(n => addSheet(n, out[n].h, out[n].rows));
    XLSX.writeFile(wb, `School-Records_${X.scope === "c" ? (jobs.length > 1 ? "all-classes" : jobs[0].c) : "subjects"}_${rg.label}.xlsx`);
    toast(`Excel file ready: ${total} rows`);
  } catch (e) { $("xerr").textContent = e.message; }
});

/* ----- import: reads a file exported by this app (same sheets and columns) ----- */
function importHTML() {
  return `<div class="card" id="icard"><h3>Import from Excel</h3><p class="sub">Choose a file exported from this app (same sheets and columns). You see a summary before anything is saved. Only the classes and subjects you can edit are imported.</p><input type="file" id="xfile" accept=".xlsx,.xls" aria-label="Excel file"><p></p><button class="btn" data-a="impRead">Read file</button><div class="err" id="ierr" role="alert"></div><div id="impu"></div></div>`;
}
let IMP = null;
const nd = v => { if (typeof v === "number") return new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10); const s = String(v).trim(); let m = /^\d{4}-\d{2}-\d{2}/.exec(s); if (m) return m[0]; m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(s); return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : ""; };
const nk = n => String(n ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const cc = v => S.cfg.classes.find(c => nk(c) === nk(v)) || String(v ?? "").replace(/\s+/g, " ").trim();
const cs = v => allSubs().find(c => nk(c) === nk(v)) || String(v ?? "").replace(/\s+/g, " ").trim();
const impStu = (c, n, alias) => { const a = alias[c + "|" + nk(n)]; if (a) return a === "skip" ? undefined : stuById(a); return classStudents(c).find(s => nk(s.name) === nk(n)); };
const whyNo = (c, sb) => !S.cfg.classes.includes(c) ? `class “${c}” does not exist` : !allSubs().includes(sb) ? `subject “${sb}” does not exist` : `${c} ${sb}: you are not assigned to this subject`;
const whyInch = (c, what) => !S.cfg.classes.includes(c) ? `class “${c}” does not exist` : `${c}: ${what} can be imported by the class incharge only`;
const chapterPairs = t => String(t ?? "").split(";").map(x => { const i = x.lastIndexOf(":"); return i > 0 ? [x.slice(0, i).trim(), x.slice(i + 1).trim()] : null; }).filter(x => x && x[0]);
const stCode = t => { const v = nk(t); if (["done", "complete", "completed", "full", "yes", "✔", "✓"].includes(v)) return 1; if (["partial", "half", "part", "incomplete"].includes(v)) return 2; if (["pending", "not done", "no", "", "✘", "✗", "x"].includes(v)) return 0; return null; };
async function impPlan(wb, alias = {}, chAlias = {}) {
  const R = { ops: {}, n: 0, cnt: {}, warn: [], notes: new Set() }, note = m => R.notes.add(m), now = Date.now(), by = S.me.name + " (import)", seen = new Set(), made = new Set(), bad = new Set();
  R.undo = {}; const dupKeys = new Set(); let dups = 0; const put = (path, op, kind) => { if (kind && /^(marks|entries|Y_|\d{4}-)/.test(op.k)) { const dk = path + "|" + op.k; if (dupKeys.has(dk)) dups++; dupKeys.add(dk); } (R.ops[path] = R.ops[path] || []).push(op); if (getAt(D[path] || {}, op.k.split(".")) == null) (R.undo[path] = R.undo[path] || []).push(op.k); if (kind) { R.cnt[kind] = (R.cnt[kind] || 0) + 1; R.n++; } };
  const rows = n => { const ws = wb.Sheets[n]; return ws ? XLSX.utils.sheet_to_json(ws, { defval: "" }) : []; };
  const ld = async p => { if (!seen.has(p)) { seen.add(p); await load([p], true); } return D[p] || {}; };
  const stu = (c, n) => impStu(c, n, alias);
  const canSub = (c, s) => pairs().some(p => p.cls === c && p.sub === s), canInch = c => inchargeClasses().includes(c), skip = m => bad.add(m);
  const str = v => String(v ?? "").trim();
  for (const r of rows("Test record")) {
    const c = cc(r.Class), sb = cs(r.Subject), name = str(r.Test), date = nd(r.Date), rem = str(r.Remark), absent = rem.toLowerCase() === "absent", max = +r["Out of"], grade = str(r.Grade);
    if (!canSub(c, sb)) { skip(whyNo(c, sb)); continue; }
    const s = stu(c, r.Student); if (!s) { skip(`student “${str(r.Student)}” not found in ${c}`); continue; }
    if (rem.toLowerCase() === "not entered" || (r.Marks === "" && !absent && !grade)) continue;
    if (!name) { skip(`a test row for ${s.name} has no test name`); continue; }
    if (!date) { skip(`test “${name}”: unreadable date “${str(r.Date)}”`); continue; }
    if (!(max > 0) && !grade) { skip(`test “${name}”: “Out of” is missing`); continue; }
    if (!absent && !grade && !(+r.Marks >= 0 && +r.Marks <= max)) { skip(`${s.name} in “${name}”: marks “${str(r.Marks)}” are not between 0 and ${max}`); continue; }
    const gm = grade ? gradeList().find(x => nk(x) === nk(grade)) : null; if (grade && !gm) { skip(`${s.name} in “${name}”: grade “${grade}” is not in the grades list (Admin → Settings)`); continue; }
    const path = P.marks(c, sb), f = await ld(path), isT = nk(r.Type) === "term", term = isT ? S.cfg.terms.find(t => nk(name) === nk(t + " Exam") || nk(name) === nk(t)) : null; let tid, t;
    if (isT && !term) note(`Term exam “${name}” is not in the Exam terms list, so it was imported as a normal test`);
    if (term) { tid = tTid(term); t = getAt(f, ["tests", tid]); } else { const e = Object.entries(f.tests || {}).find(([, x]) => !x.term && x.name.toLowerCase() === name.toLowerCase() && x.date === date); if (e) [tid, t] = e; else tid = slug(name) + "_" + date; }
    if (!t && !made.has(path + tid)) { made.add(path + tid); put(path, { k: "tests." + tid, v: Object.assign({ name, date, max, by }, term ? { term } : {}) }); }
    const th = str(r.Theory), asm = str(r.Assessment), mx0 = max > 0 ? max : 0, hasM = r.Marks !== "" && mx0 > 0 && +r.Marks >= 0 && +r.Marks <= mx0;
    put(path, { k: `marks.${tid}.${s.id}`, v: absent ? { ab: 1, max: mx0, r: "", by, t: now } : gm ? Object.assign({ g: gm }, hasM ? { m: +r.Marks, max: mx0 } : {}, { r: rem, by, t: now }) : Object.assign({ m: +r.Marks, max }, th !== "" && asm !== "" && !isNaN(+th) && !isNaN(+asm) ? { th: +th, as: +asm } : {}, { r: rem, by, t: now }) }, "Test marks");
  }
  for (const r of rows("Notebook record")) {
    const c = cc(r.Class), sb = cs(r.Subject), date = nd(r.Date);
    if (!canSub(c, sb)) { skip(whyNo(c, sb)); continue; }
    const s = stu(c, r.Student); if (!s) { skip(`student “${str(r.Student)}” not found in ${c}`); continue; }
    if (!date) { skip(`notebook row for ${s.name}: unreadable date “${str(r.Date)}”`); continue; }
    const ch = (await ld(P.syl(c, sb))).chapters || []; if (!ch.length) { skip(`${c} ${sb}: no chapters yet (Notebooks → Edit chapters)`); continue; }
    const sc = new Array(ch.length).fill(0);
    chapterPairs(r["Chapter details"]).forEach(([cn, st]) => {
      const target = chAlias[`${c}|${sb}|${nk(cn)}`] ?? (ch.find(x => nk(x.n) === nk(cn)) || {}).n; if (!target || target === "skip") return;
      const i = ch.findIndex(x => nk(x.n) === nk(target)); if (i < 0) return; const v = stCode(st); if (v == null) note(`Chapter status “${st}” is not recognised (counted as pending)`); sc[i] = v || 0;
    });
    const e = { s: sc, by, t: now }; if (str(r.Remark)) e.r = str(r.Remark);
    await ld(P.nb(c, sb)); put(P.nb(c, sb), { k: `entries.${date}.${s.id}`, v: e }, "Notebook entries");
  }
  for (const r of rows("Calls record")) {
    const c = cc(r.Class), date = nd(r.Date); if (!canInch(c)) { skip(whyInch(c, "calls")); continue; }
    const s = stu(c, r.Student); if (!s) { skip(`student “${str(r.Student)}” not found in ${c}`); continue; } if (!date) { skip(`call for ${s.name}: unreadable date “${str(r.Date)}”`); continue; }
    const path = P.k("calls", c), f = await ld(path), resp = str(r["Parent's response"]) || "Informed", rem = str(r.Remark);
    const fee = nk(r.Type) === "fee", until = nd(r["Pay by"]), gr = str(r.Grievance);
    if (Object.values(f.items || {}).some(x => x.sid === s.id && x.date === date && x.resp === resp && (x.r || "") === rem && (x.kind === "fee") === fee)) continue;
    const v = { sid: s.id, date, resp, r: rem, by, t: now }; if (fee) v.kind = "fee"; if (until) v.until = until;
    if (gr && !fee) { v.gr = gr; v.grs = nk(r["Grievance status"]) === "resolved" ? 1 : 0; if (v.grs) { v.grd = nd(r["Resolved on"]) || date; if (str(r.Resolution)) v.grn = str(r.Resolution); } }
    put(path, { k: "items." + uid("c") + R.n.toString(36), v }, "Calls");
  }
  for (const r of rows("Fines record")) {
    const c = cc(r.Class), date = nd(r.Date), amt = +r.Amount; if (!canInch(c)) { skip(whyInch(c, "fines")); continue; }
    const s = stu(c, r.Student); if (!s) { skip(`student “${str(r.Student)}” not found in ${c}`); continue; } if (!date || !(amt > 0)) { skip(`fine for ${s.name}: ${!date ? "unreadable date “" + str(r.Date) + "”" : "amount is missing"}`); continue; }
    const ft = Object.entries(FTYPE).find(([, v]) => nk(v) === nk(r.Type)), type = ft ? ft[0] : "other"; if (!ft) note(`Fine type “${str(r.Type)}” is not recognised, so it was imported as “Other due”`); const path = P.k("fines", c), f = await ld(path), paid = str(r.Paid).toLowerCase() === "yes" ? 1 : 0;
    if (Object.values(f.items || {}).some(x => x.sid === s.id && x.date === date && x.type === type && x.amt === amt)) continue;
    const v = { sid: s.id, type, amt, date, paid, r: str(r.Remark), by, t: now }; if (paid) v.pd = nd(r["Paid on"]) || date;
    put(path, { k: "items." + uid("f") + R.n.toString(36), v }, "Fines");
  }
  for (const r of rows("Fees")) {
    const c = cc(r.Class); if (!canInch(c)) { skip(whyInch(c, "fees")); continue; }
    const s = stu(c, r.Student), y = +(/^(\d{4})/.exec(str(r.Year)) || [])[1]; if (!s) { skip(`student “${str(r.Student)}” not found in ${c}`); continue; } if (!y) { skip(`fees for ${s.name}: year “${str(r.Year)}” is not like 2026-27`); continue; }
    const ms = {}; fyMonths(y).forEach(m => { const v = str(r[m.n]).toLowerCase(); if (v === "full") ms[m.k] = 2; else if (v === "half") ms[m.k] = 1; });
    const total = +r["Total fee"] || 0, paid = r.Paid === "" ? NaN : +r.Paid;
    await ld(P.k("fees", c)); put(P.k("fees", c), { k: `${fyKey(y)}.${s.id}`, v: Object.assign({ months: ms, by, t: now }, total ? { total } : {}, isNaN(paid) ? {} : { paid }) }, "Fee records");
  }
  for (const r of rows("Attendance")) {
    const c = cc(r.Class); if (!canInch(c)) { skip(whyInch(c, "attendance")); continue; }
    const s = stu(c, r.Student), m = /^\d{4}-\d{2}$/.test(str(r.Month)) ? str(r.Month) : nd(r.Month).slice(0, 7); if (!s) { skip(`student “${str(r.Student)}” not found in ${c}`); continue; } if (!m) { skip(`attendance for ${s.name}: unreadable month “${str(r.Month)}”`); continue; }
    const path = P.k("attendance", c); await ld(path); put(path, { k: `${m}.${s.id}`, v: { a: +r["Absent days"] || 0, l: +r.Leaves || 0, by, t: now } }, "Attendance");
    if (r["Working days"] !== "") put(path, { k: `${m}._wd`, v: +r["Working days"] });
  }
  if (dups) note(`${dups} rows repeat the same student on the same date or test, so the last of them was used`); R.warn = [...bad]; R.note = [...R.notes]; R.sum = Object.entries(R.cnt); return R;
}
/* find names in the file that are not in the student list */
function impScan(wb) {
  const rows = n => { const ws = wb.Sheets[n]; return ws ? XLSX.utils.sheet_to_json(ws, { defval: "" }) : []; }, str = v => String(v ?? "").trim(), seen = {};
  const canSub = (c, s) => pairs().some(p => p.cls === c && p.sub === s), canInch = c => inchargeClasses().includes(c);
  const chk = (c, name, ok) => { if (!ok || !name || !S.cfg.classes.includes(c) || classStudents(c).some(s => nk(s.name) === nk(name))) return; (seen[c + "|" + nk(name)] = seen[c + "|" + nk(name)] || { c, name: name.replace(/\s+/g, " "), n: 0 }).n++; };
  rows("Test record").forEach(r => { const rem = str(r.Remark).toLowerCase(); if (rem === "not entered" || (r.Marks === "" && rem !== "absent")) return; chk(cc(r.Class), str(r.Student), canSub(cc(r.Class), cs(r.Subject))); });
  rows("Notebook record").forEach(r => chk(cc(r.Class), str(r.Student), canSub(cc(r.Class), cs(r.Subject))));
  ["Calls record", "Fines record", "Fees", "Attendance"].forEach(n => rows(n).forEach(r => chk(cc(r.Class), str(r.Student), canInch(cc(r.Class)))));
  return Object.values(seen);
}
function lev(a, b) { const m = a.length, n = b.length; if (!m || !n) return Math.max(m, n); let p = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
const nameSim = (a, b) => { const f = (x, y) => 1 - lev(x, y) / Math.max(x.length, y.length, 1), srt = s => s.split(" ").sort().join(" "); return Math.max(f(a, b), f(srt(a), srt(b))); };
const upsertStu = r => { const i = S.students.findIndex(x => x.id === r.id); i < 0 ? S.students.push(r) : S.students[i] = r; };
let IM = null;
A.impRead = b => busy(b, async () => {
  $("ierr").textContent = ""; const f = $("xfile").files[0]; if (!f) return $("ierr").textContent = "Choose an Excel file first."; IM = null;
  try {
    await loadXlsx(); const wb = XLSX.read(await f.arrayBuffer(), { type: "array" }), un = impScan(wb), inch = inchargeClasses(); if (un.length) await loadArch();
    if (un.length) {
      IM = { wb, list: un.map(u => { const k = nk(u.name), cands = classStudents(u.c).map(s => ({ id: s.id, name: s.name, sc: nameSim(k, nk(s.name)) })).sort((x, y) => y.sc - x.sc).slice(0, 12), best = cands[0], canNew = inch.includes(u.c); cands.forEach(c => c.best = c === best && c.sc >= .6); const arc = S.arch.filter(a => a.cls === u.c).map(a => ({ id: "arch:" + a.id, name: a.name, sc: nameSim(k, nk(a.name)), arch: true })).sort((x, y) => y.sc - x.sc).slice(0, 6), ab = arc[0]; return Object.assign(u, { cands: [...(ab && ab.sc >= .85 ? arc : []), ...cands, ...(ab && ab.sc < .85 ? arc : [])], canNew, sel: ab && ab.sc >= .85 ? ab.id : best && best.sc >= .85 ? best.id : canNew ? "new" : "skip" }); }) };
      return impMatchDraw();
    }
    await impChapters(wb, {}, []);
  } catch (e) { $("ierr").textContent = e.message || "Could not read this file."; }
});
/* chapter names in the notebook sheet that the subject does not have yet */
async function impScanCh(wb, alias) {
  const ws = wb.Sheets["Notebook record"]; if (!ws) return [];
  const out = {}, loaded = new Set(); let ord = 0;
  for (const r of XLSX.utils.sheet_to_json(ws, { defval: "" })) {
    const c = cc(r.Class), sb = cs(r.Subject); if (!S.cfg.classes.includes(c) || !pairs().some(p => p.cls === c && p.sub === sb) || !impStu(c, String(r.Student ?? ""), alias)) continue;
    const path = P.syl(c, sb); if (!loaded.has(path)) { loaded.add(path); await load([path], true); }
    const ch = (D[path] || {}).chapters || [];
    chapterPairs(r["Chapter details"]).forEach(([cn]) => { if (ch.some(x => nk(x.n) === nk(cn))) return; const k = `${c}|${sb}|${nk(cn)}`; if (!out[k]) { const cands = ch.map(x => ({ n: x.n, sc: nameSim(nk(cn), nk(x.n)) })).sort((x, y) => y.sc - x.sc).slice(0, 12); cands.forEach((q, i) => q.best = i === 0 && q.sc >= .6); out[k] = { key: k, c, sb, name: cn, n: 0, ord: ++ord, cands, sel: cands[0] && cands[0].sc >= .85 ? cands[0].n : "new" }; } out[k].n++; });
  }
  return Object.values(out).sort((x, y) => x.ord - y.ord);
}
async function impChapters(wb, alias, created) {
  const chl = await impScanCh(wb, alias); IM = Object.assign({}, IM, { wb, alias, created, chl });
  if (chl.length) return impChDraw();
  await impFinish(wb, alias, created, {}, 0);
}
function impChDraw() {
  const L = IM.chl;
  sheetL(`<h2>Chapters not found</h2><p class="sub">${L.length} chapter ${L.length === 1 ? "name" : "names"} in the notebook sheet ${L.length === 1 ? "is" : "are"} not in that subject's chapter list. For each, pick the chapter it matches (name difference), add it as a new chapter at the end of the list, or ignore it.</p><div class="row"><button class="btn alt sm" data-a="imChAll" data-v="new">Add all as new</button><button class="btn alt sm" data-a="imChAll" data-v="skip">Ignore all</button></div>
   <div class="mlist">${L.map((r, i) => `<div class="mrow"><div><b>${esc(r.name)}</b><br><small>${esc(r.c)} · ${esc(r.sb)} · ${r.n} ${r.n === 1 ? "entry" : "entries"}</small></div><select data-c="imChSel" data-i="${i}" aria-label="Match ${esc(r.name)}"><option value="new" ${r.sel === "new" ? "selected" : ""}>Add as new chapter</option><option value="skip" ${r.sel === "skip" ? "selected" : ""}>Ignore this chapter</option>${r.cands.map(c => `<option value="${esc(c.n)}" ${r.sel === c.n ? "selected" : ""}>= ${esc(c.n)}${c.best ? " (closest)" : ""}</option>`).join("")}</select></div>`).join("")}</div>
   <p class="sub">New chapters are added to the end of the subject's list (as “Full”), so existing ticks stay in place.</p><div class="row"><button class="btn" data-a="imChGo" style="flex:2">Continue</button><button class="btn alt" data-a="close">Cancel</button></div>`);
}
A.imChSel = b => { IM.chl[+b.dataset.i].sel = b.value; };
A.imChAll = b => { IM.chl.forEach(r => r.sel = b.dataset.v); impChDraw(); };
A.imChGo = b => busy(b, async () => {
  const chAlias = {}, add = {}; let added = 0;
  IM.chl.forEach(r => { if (r.sel === "skip") chAlias[r.key] = "skip"; else if (r.sel === "new") { (add[`${r.c}|${r.sb}`] = add[`${r.c}|${r.sb}`] || []).push(r); chAlias[r.key] = r.name; } else chAlias[r.key] = r.sel; });
  try {
    for (const [k, rs] of Object.entries(add)) {
      const [c, sb] = k.split("|"), path = P.syl(c, sb); await load([path], true); const list = [...((D[path] || {}).chapters || [])];
      rs.forEach(r => { if (!list.some(x => nk(x.n) === nk(r.name))) { list.push({ n: r.name, st: "full" }); added++; } });
      await patch(path, [{ k: "chapters", v: list }]);
    }
    await impFinish(IM.wb, IM.alias, IM.created, chAlias, added);
  } catch (x) { toast(x.message, true); }
});
function impMatchDraw() {
  sheetL(`<h2>Students not found</h2><p class="sub">${IM.list.length} ${IM.list.length === 1 ? "name" : "names"} in the file ${IM.list.length === 1 ? "is" : "are"} not in the student list. For each one, create a new student, choose the existing student it really is (spelling difference), or skip its rows.</p><div class="row"><button class="btn alt sm" data-a="imAll" data-v="new">Create all as new</button><button class="btn alt sm" data-a="imAll" data-v="skip">Skip all</button></div>
   <div class="mlist">${IM.list.map((r, i) => `<div class="mrow"><div><b>${esc(r.name)}</b><br><small>Class ${esc(r.c)} · ${r.n} ${r.n === 1 ? "row" : "rows"}</small></div><select data-c="imSel" data-i="${i}" aria-label="Match ${esc(r.name)}">${r.canNew ? `<option value="new" ${r.sel === "new" ? "selected" : ""}>Create new student</option>` : ""}<option value="skip" ${r.sel === "skip" ? "selected" : ""}>Skip these rows</option>${r.cands.map(c => `<option value="${esc(c.id)}" ${r.sel === c.id ? "selected" : ""}>${c.arch ? "↺ Restore archived: " : "= "}${esc(c.name)}${c.best ? " (closest)" : ""}</option>`).join("")}</select></div>`).join("")}</div>
   <p class="sub">New students are added to the class as soon as you continue. Only the class incharge or admin can create students.</p><div class="row"><button class="btn" data-a="imMatchGo" style="flex:2">Continue</button><button class="btn alt" data-a="close">Cancel</button></div>`);
}
A.imSel = b => { IM.list[+b.dataset.i].sel = b.value; };
A.imAll = b => { IM.list.forEach(r => r.sel = b.dataset.v === "new" && r.canNew ? "new" : "skip"); impMatchDraw(); };
A.imMatchGo = b => busy(b, async () => {
  const alias = {}, byCls = {}, created = [], restores = [];
  IM.list.forEach(r => { const k = r.c + "|" + nk(r.name); if (r.sel === "skip") alias[k] = "skip"; else if (r.sel === "new") (byCls[r.c] = byCls[r.c] || []).push(r); else if (r.sel.startsWith("arch:")) restores.push({ k, id: r.sel.slice(5) }); else alias[k] = r.sel; });
  try {
    for (const q of restores) { const res = await api("POST", "/students/restore", { id: q.id }); upsertStu(res.student); S.arch = S.arch.filter(a => a.id !== q.id); alias[q.k] = res.student.id; }
    for (const [c, rs] of Object.entries(byCls)) { const res = await api("POST", "/students/add", { students: rs.map(r => ({ name: r.name, cls: c })) }); res.students.forEach((st, i) => { upsertStu(st); alias[c + "|" + nk(rs[i].name)] = st.id; if (res.created.includes(st.id)) created.push(st.id); }); }
    await impChapters(IM.wb, alias, created);
  } catch (x) { toast(x.message, true); }
});
async function impFinish(wb, alias, created, chAlias = {}, newCh = 0) {
  IMP = await impPlan(wb, alias, chAlias); IMP.stu = created;
  if (!IMP.n) { if (!$("ierr")) closeSheet(true); const m = "Nothing to import. " + (IMP.warn.slice(0, 3).join(" · ") || "No sheets in the expected format were found."); if ($("ierr")) $("ierr").textContent = m; throw new Error(m); }
  sheetL(`<h2>Ready to import</h2><div class="hist">${created.length ? `<div class="hr"><span>New students created</span><b>${created.length}</b></div>` : ""}${newCh ? `<div class="hr"><span>New chapters added</span><b>${newCh}</b></div>` : ""}${IMP.sum.map(x => `<div class="hr"><span>${esc(x[0])}</span><b>${x[1]}</b></div>`).join("")}</div>${IMP.warn.length ? `<p class="sub">Skipped: ${IMP.warn.slice(0, 6).map(esc).join(" · ")}${IMP.warn.length > 6 ? ` … and ${IMP.warn.length - 6} more` : ""}</p>` : ""}${IMP.note.length ? `<p class="sub">Notes: ${IMP.note.map(esc).join(" · ")}</p>` : ""}<p class="sub">Existing entries for the same student and test / date are replaced.</p><div class="row"><button class="btn" data-a="impGo" style="flex:2">Import ${IMP.n} records</button><button class="btn alt" data-a="close">Cancel</button></div>`);
}
A.impGo = b => busy(b, async () => {
  let done = 0;
  try { for (const p of Object.keys(IMP.ops)) for (const part of chunk(IMP.ops[p], 150)) { await patch(p, part); done += part.length; } }
  catch (x) { return toast("Stopped: " + x.message + " (" + done + " changes were saved)", true); }
  const n = IMP.n, cls = [...new Set(Object.keys(IMP.undo || {}).map(q => (/^data\/\w+\/([A-Za-z0-9]+)/.exec(q) || [])[1]).filter(Boolean))];
  api("POST", "/imports", { n, sum: IMP.sum, undo: IMP.undo, stu: IMP.stu || [], classes: cls }).then(impHistLoad).catch(() => { });
  IMP = null; closeSheet(true); toast(n + " records imported");
});


/* ----- import history: kept on the server, so the importer, the admin and the class incharge can see who imported what ----- */
let IH = null, IH_N = 5;
async function impHistLoad() { try { IH = (await api("GET", "/imports")).imports || []; } catch { IH = IH || []; } if ($("impu")) $("impu").innerHTML = impHistHTML(); }
function impHistHTML() {
  const all = (IH || []).slice().reverse(), l = all.slice(0, IH_N); if (!l.length) return "";
  return `<hr><b>Import history</b>${l.map(x => `<div class="lrow"><div class="lm"><b>${esc(x.by)}</b> imported ${x.n} ${x.n === 1 ? "record" : "records"}${x.stuN ? ` and ${x.stuN} new ${x.stuN === 1 ? "student" : "students"}` : ""}<small>${esc(new Date(x.t).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }))}${(x.classes || []).length ? " · " + esc(x.classes.join(", ")) : ""}${(x.sum || []).length ? " · " + esc(x.sum.map(q => q[0] + " " + q[1]).join(", ")) : ""}${x.undone ? ` · undone by ${esc(x.undone.by)}` : ""}</small></div>${x.canUndo ? `<button class="btn alt sm" data-a="impUndo" data-id="${esc(x.id)}">Undo</button>` : ""}</div>`).join("")}${all.length > IH_N ? `<p><button class="link" data-a="impHistMore">Show more (${all.length - IH_N})</button></p>` : ""}`;
}
A.impHistMore = () => { IH_N += 10; $("impu").innerHTML = impHistHTML(); };
/* undo removes only what that import created (nothing that existed before it) */
A.impUndo = b => busy(b, async () => {
  let rec; try { rec = (await api("POST", "/imports/get", { id: b.dataset.id })).import; } catch (x) { return toast(x.message, true); }
  if (!rec.undo) return toast("This import cannot be undone any more.", true);
  const stu = rec.stu || [];
  if (!confirm(`Delete everything created by ${rec.by}'s import of ${new Date(rec.t).toLocaleDateString("en-IN")}${stu.length ? ", including the " + stu.length + " students it added" : ""}? This cannot be undone.`)) return;
  let done = 0;
  try {
    for (const [path, keys] of Object.entries(rec.undo)) {
      const ops = keys.map(k => ({ k, v: null })); keys.filter(k => /^tests\.[\w-]+$/.test(k)).forEach(k => ops.push({ k: "marks." + k.slice(6), v: null }));
      await load([path], true); for (const part of chunk(ops, 150)) { await patch(path, part); done += part.length; }
    }
  } catch (x) { return toast("Stopped: " + x.message + " (" + done + " removed)", true); }
  if (stu.length) { try { await api("POST", "/students/remove", { ids: stu, purge: true }); S.students = S.students.filter(x => !stu.includes(x.id)); } catch (x) { toast("Entries removed, but the new students stayed: " + x.message, true); } }
  try { await api("POST", "/imports/done", { id: rec.id }); } catch { }
  await impHistLoad(); toast("Import undone");
});
/* ===== app.js ===== */
/* ===== App shell: login, navigation, dashboard, profile ===== */
let cur = "home", pin = "", sel = "", sw = false;
const deviceId = () => localStorage.did || (localStorage.did = crypto.randomUUID());
const rec = () => { try { return JSON.parse(localStorage.recent || "[]"); } catch { return []; } };
const remember = (u, n, s) => localStorage.recent = JSON.stringify([{ u, n, s }, ...rec().filter(x => x.u !== u)].slice(0, 4));

/* ----- login ----- */
/* ===== themes: day, three night styles; follows the phone, always day / night, or the clock ===== */
const TH_DEF = { mode: "system", night: "legacy", from: "19:00", to: "06:00" };
const TH_BAR = { day: "#0b4a4a", legacy: "#0b1f1f", dark: "#060f12", neon: "#050e13" };
const themeGet = u => { try { return Object.assign({}, TH_DEF, JSON.parse(localStorage["theme_" + (u || "")] || localStorage.theme || "{}")); } catch { return Object.assign({}, TH_DEF); } };
function themeResolve(t) {
  const mins = s => { const [h, m] = String(s).split(":").map(Number); return (h || 0) * 60 + (m || 0); }, d = new Date(), now = d.getHours() * 60 + d.getMinutes();
  let night; if (t.mode === "day") night = false; else if (t.mode === "night") night = true;
  else if (t.mode === "time") { const a = mins(t.from), b = mins(t.to); night = a > b ? now >= a || now < b : now >= a && now < b; }
  else night = matchMedia("(prefers-color-scheme: dark)").matches;
  return night ? (["legacy", "dark", "neon"].includes(t.night) ? t.night : "legacy") : "day";
}
let TH = themeGet();
function themeApply() { const v = themeResolve(TH); document.documentElement.dataset.theme = v; const m = document.querySelector("meta[name=theme-color]"); if (m) m.content = TH_BAR[v]; }
function themeSave() { try { localStorage.theme = JSON.stringify(TH); if (S.me) localStorage["theme_" + S.me.username] = JSON.stringify(TH); } catch { } themeApply(); }
themeApply(); matchMedia("(prefers-color-scheme: dark)").addEventListener("change", themeApply); setInterval(() => { if (TH.mode === "time") themeApply(); }, 60000);
function themeSheet() {
  const t = TH, tile = (k, name, sub) => `<button class="thtile th-${k}${t.night === k ? " on" : ""}" data-a="thNight" data-k="${k}" aria-pressed="${t.night === k}"><span class="thprev"><i></i><i></i></span><b>${name}</b><small>${sub}</small></button>`;
  sheetL(`<h2>Appearance</h2><p class="sub">Choose when night mode is used and how it looks.</p>
   <h4>Day or night</h4><div class="seg wrap">${[["system", "Phone setting"], ["day", "Always day"], ["night", "Always night"], ["time", "By time"]].map(([k, v]) => `<button class="${t.mode === k ? "on" : ""}" data-a="thMode" data-k="${k}">${v}</button>`).join("")}</div>
   ${t.mode === "time" ? `<div class="row"><label class="fl">Night starts<input type="time" id="thf" value="${esc(t.from)}" data-c="thTime"></label><label class="fl">Day starts<input type="time" id="tht" value="${esc(t.to)}" data-c="thTime"></label></div>` : ""}
   <h4>Night style</h4><div class="thgrid">${tile("legacy", "Classic night", "The original dark teal")}${tile("dark", "Darker night", "Deeper and calm, no glow")}${tile("neon", "Darker + neon", "Glowing edges and accents")}</div>
   <p class="sub">${t.mode === "day" ? "Night style applies when night mode is on." : "Now showing: " + (themeResolve(t) === "day" ? "day" : "night") + " mode."}</p><button class="btn" data-a="close">Done</button>`);
}
A.theme = themeSheet;
A.thMode = b => { TH.mode = b.dataset.k; themeSave(); themeSheet(); };
A.thNight = b => { TH.night = b.dataset.k; if (TH.mode === "day") TH.mode = "system"; themeSave(); themeSheet(); };
A.thTime = () => { TH.from = $("thf").value || TH.from; TH.to = $("tht").value || TH.to; themeSave(); };

/* ===== session guard: activity tracking, 1-minute idle sign-out (10 s warning), wipe of local data on every sign-out ===== */
const IDLE_MS = 60000, WARN_S = 10, KEEP_KEYS = ["theme", "did", "recent", "apiUrl", "q", "logo", "logoh", "rcopt", "tmOpt"];
let lastAct = Date.now(), lastPing = 0, BG = 0, BUSYN = 0, outBusy = false, printing = false;
const wipeLocal = () => { try { Object.keys(localStorage).forEach(k => { if (!KEEP_KEYS.includes(k) && !k.startsWith("theme_")) localStorage.removeItem(k); }); sessionStorage.removeItem("tok"); } catch { } };
function endSession(msg) { token = ""; wipeLocal(); try { if (msg) sessionStorage.msg = msg; } catch { } location.reload(); }
function deviceLabel() {
  const ua = navigator.userAgent, b = /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "device", kind = /Mobile/.test(ua) ? "phone" : /Android|iPad/.test(ua) ? "tablet" : "computer";
  return `${b} · ${os} ${kind} · #${deviceId().slice(0, 4)}`;
}
function actHandler() {
  if (!token || !S.me) return; const now = Date.now(); lastAct = now; if (!$("idle").classList.contains("hide")) hideIdle();
  if (now - lastPing > 20000) { lastPing = now; api("POST", "/session/ping", {}).catch(() => { }); }          // tells the server this profile is in use right now
}
["pointerdown", "pointermove", "keydown", "touchstart", "touchmove", "wheel", "scroll", "input", "click"].forEach(ev => addEventListener(ev, actHandler, { passive: true, capture: true }));
addEventListener("beforeprint", () => { printing = true; lastAct = Date.now(); }); addEventListener("afterprint", () => { printing = false; lastAct = Date.now(); });
const showIdle = n => { $("idlen").textContent = n; $("idle").classList.remove("hide"); }, hideIdle = () => $("idle").classList.add("hide");
function idleCheck() {
  if (!token || !S.me || outBusy) return;
  if (pend() > 0 || BUSYN > 0 || printing) lastAct = Date.now();                       // saving / importing / printing counts as activity
  const idle = Date.now() - lastAct;
  if (idle >= IDLE_MS) return signOut("idle");
  if (idle >= IDLE_MS - WARN_S * 1000) showIdle(Math.max(1, Math.ceil((IDLE_MS - idle) / 1000))); else hideIdle();
}
setInterval(idleCheck, 1000); document.addEventListener("visibilitychange", idleCheck);
async function signOut(why) {
  if (outBusy) return; outBusy = true; hideIdle();
  for (let i = 0; i < 20 && pend() > 0; i++) await new Promise(r => setTimeout(r, 200));            // let unsaved entries reach the server first
  try { await Promise.race([api("POST", "/logout", { reason: why }), new Promise(r => setTimeout(r, 3000))]); } catch { }
  endSession(why === "idle" ? "Signed out after a minute of inactivity." : "");
}
A.stay = () => { lastAct = Date.now(); hideIdle(); };
A.logout = () => signOut("manual");
/* where has this profile been signed in? */
A.sessInfo = async () => {
  sheetL(`<h2>Recent logins</h2><p class="sub">Loading…</p>`); let r; try { r = await api("GET", "/session/info"); } catch (x) { return toast(x.message, true); }
  const me = deviceId(), when = t => new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }), why = { idle: "inactivity", manual: "signed out", admin: "admin" };
  sheetL(`<h2>Recent logins</h2><p class="sub">Only one device can use this profile at a time. This list shows where it was opened and closed.</p>${r.cur ? `<p>Active now: <b>${esc(r.cur.label)}</b>${r.cur.dev === me ? ` <span class="pill">this device</span>` : ""}</p>` : ""}<div class="mlist">${(r.hist || []).map(h => `<div class="lrow"><div class="lm"><b>${h.ev === "in" ? "Signed in" : "Signed out"} · ${esc(h.label || "device")}${h.dev === me ? ` <span class="pill">this device</span>` : ""}</b><small>${esc(when(h.t))}${h.ev === "in" && h.took ? " · replaced another session" : ""}${h.ev === "out" ? " · " + esc(why[h.why] || h.why || "") : ""}${h.country ? " · " + esc(h.country) : ""}</small></div></div>`).join("") || `<p class="sub">No history yet.</p>`}</div><p></p><button class="btn alt" data-a="profile">Back to profile</button>`);
};

/* ----- login (SchoolDesk) ----- */
const loginSub = u => u.role === "admin" ? "Admin" : u.inchargeOf ? "Teacher · Incharge of " + u.inchargeOf : "Teacher";
function renderAcct() {
  const r = rec(), a = $("acct"), inp = $("user"); $("login").classList.toggle("pick", sw && r.length > 0);
  if (!sw && r.length) { const c = r.find(x => x.u === sel) || r[0]; sel = c.u; inp.classList.add("hide"); a.innerHTML = `<div class="av">${esc((c.n[0] || "?").toUpperCase())}</div><b class="lname">${esc(c.n)}</b><small class="lsub">${esc(c.s || "Teacher")} · @${esc(c.u)}</small><p><button class="lk" data-a="lgSwitch">${ic("swap", 16)} Switch user</button></p>`; }
  else if (r.length) { inp.classList.add("hide"); a.innerHTML = `<h2 class="lh">Choose a profile</h2>` + r.map(x => `<div class="prwrap"><button class="prow" data-a="lgPick" data-u="${esc(x.u)}"><span class="av sm">${esc((x.n[0] || "?").toUpperCase())}</span><span class="pm"><b>${esc(x.n)}</b><small>${esc(x.s || "Teacher")} · @${esc(x.u)}</small></span>${ic("chevr", 18)}</button><button class="pforget" data-a="lgForget" data-u="${esc(x.u)}" aria-label="Remove ${esc(x.n)} from this device">✕</button></div>`).join("") + `<button class="prow dash" data-a="lgOther"><span class="av sm">${ic("plus", 18)}</span><span class="pm"><b>Another user</b><small>Sign in with a username</small></span></button>`; }
  else { a.innerHTML = ""; inp.classList.remove("hide"); }
  if (!sw && r.length) loginWarm(sel);
}
A.lgSwitch = () => { sw = true; pin = ""; drawPad(); renderAcct(); };
A.lgPick = b => { sel = b.dataset.u; sw = false; pin = ""; renderAcct(); drawPad(); };
A.lgOther = () => { sel = ""; $("login").classList.remove("pick"); $("acct").innerHTML = ""; $("user").classList.remove("hide"); $("user").focus(); };
/* PIN dots: the first digit pops in; every next digit slides the dots left while a new one pops in */
let dotEls = [];
function drawPad() {
  const box = $("dots"), n = pin.length;
  if (!n) { dotEls = []; box.innerHTML = `<span class="phint">Enter your PIN</span>`; return; }
  const first = dotEls.map(d => d.getBoundingClientRect().left);
  if (!dotEls.length) box.innerHTML = "";
  while (dotEls.length < n) { const i = document.createElement("i"); i.className = "f pop"; box.appendChild(i); dotEls.push(i); }
  while (dotEls.length > n) dotEls.pop().remove();
  dotEls.forEach((d, k) => { if (k >= first.length) return; const dx = first[k] - d.getBoundingClientRect().left; if (Math.abs(dx) < .5) return; d.style.transition = "none"; d.style.transform = `translateX(${dx}px)`; d.getBoundingClientRect(); d.style.transition = ""; d.style.transform = ""; });
}
$("pad").innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, "⌫", 0, "Go"].map(k => `<button data-k="${k}" aria-label="${k === "⌫" ? "Delete" : k === "Go" ? "Sign in" : k}">${k === "⌫" ? ic("backspace", 24) : k === "Go" ? ic("arrow", 26) : k}</button>`).join("");
drawPad();
let logBusy = false;
const logLock = on => { logBusy = on; const p = $("pad"); p.classList.toggle("lb", on); const g = p.querySelector("[data-k=Go]"); if (g) { g.disabled = on; g.classList.toggle("ld", on); } };
async function doLogin(force) {
  if (logBusy) return;
  const uname = (sel || $("user").value).trim().toLowerCase(); $("err").textContent = "";
  if (!uname) return $("err").textContent = "Enter your username.";
  if (pin.length < 4) return $("err").textContent = "PIN must be 4 to 6 digits.";
  logLock(true);   // stays locked once signed in; unlocked only if the sign-in fails so the PIN can be retyped
  try { const r = await api("POST", "/login", { username: uname, pin, device: deviceId(), label: deviceLabel(), force: force === true, lh: localStorage.logoh || "" }); token = r.token; localStorage.tok = token; remember(uname, r.user.name, loginSub(r.user)); S.me = r.user; await start(r); }
  catch (x) { logLock(false); if (x.code === "active_elsewhere") return takeoverAsk(x.other); $("err").textContent = x.message; pin = ""; drawPad(); }
}
$("pad").onclick = e => { const b = e.target.closest("[data-k]"); if (!b || logBusy) return; const k = b.dataset.k; if (k === "⌫") pin = pin.slice(0, -1); else if (k === "Go") return doLogin(); else if (pin.length < 6) pin += k; drawPad(); };

A.lgForget = b => { localStorage.recent = JSON.stringify(rec().filter(x => x.u !== b.dataset.u)); if (sel === b.dataset.u) sel = ""; renderAcct(); };
/* this profile is open on another device right now */
function takeoverAsk(o) {
  sheetL(`<h2>Already signed in</h2><p class="sub">This profile is in use on <b>${esc(o.label)}</b> (active ${o.ago <= 1 ? "just now" : o.ago + " seconds ago"}). If you continue, that device will be signed out.</p><div class="row"><button class="btn" data-a="lgForce">Sign in here</button><button class="btn alt" data-a="lgCancel">Cancel</button></div>`);
}
A.lgForce = () => { closeSheet(true); doLogin(true); };
A.lgCancel = () => { closeSheet(true); pin = ""; drawPad(); };
const lnoteShow = () => { try { const m = sessionStorage.msg; if (m) { $("lnote").textContent = m; $("lnote").classList.remove("hide"); sessionStorage.removeItem("msg"); } } catch { } };
lnoteShow();

/* while the person is still choosing a profile / typing a username, the server loads everything the sign-in needs, so pressing Go only has to check the PIN */
const warmed = {};
function loginWarm(u) {
  u = String(u || "").trim().toLowerCase(); if (u.length < 3 || document.hidden || Date.now() - (warmed[u] || 0) < 45000) return; warmed[u] = Date.now();
  api("POST", "/login/warm", { username: u }).then(r => { if (r && r.wait > 0 && (sel || $("user").value.trim().toLowerCase()) === u) $("err").textContent = `This profile is locked for ${r.wait > 90 ? Math.ceil(r.wait / 60) + " minutes" : r.wait + " seconds"}.`; }).catch(() => { });
}
let warmT = 0; $("user").addEventListener("input", () => { clearTimeout(warmT); warmT = setTimeout(() => loginWarm($("user").value), 800); });
addEventListener("keydown", e => { if (!$("login").classList.contains("hide") && !e.target.matches("#user")) { if (logBusy) return; if (/^\d$/.test(e.key) && pin.length < 6) { pin += e.key; drawPad(); } else if (e.key === "Backspace") { pin = pin.slice(0, -1); drawPad(); } else if (e.key === "Enter") doLogin(); } else if (e.key === "Enter" && e.target.matches("#user")) $("pad").querySelector("[data-k=Go]").focus(); });

/* ----- start / shell ----- */
async function start(pre) {
  if (pre && pre.config && pre.students) { S.cfg = pre.config; S.students = pre.students; } else [S.cfg, S.students] = await Promise.all([api("GET", "/config"), api("GET", "/students")]);   // a fresh sign-in already brings both

  $("login").classList.add("hide"); $("app").classList.remove("hide"); $("avb").textContent = S.me.name[0].toUpperCase();
  lastAct = Date.now(); TH = themeGet(S.me.username); themeApply(); loadAssets(pre); buildNav(); renderSide(); go("home"); flushQueue(); syncBadge();
  setTimeout(() => { const c = inchargeClasses()[0]; if (c && c !== H.cls) bundleFast(c, () => { }, true).catch(() => { }); }, 3000);   // warm up the incharge screens
}
function buildNav() {
  const items = [["home", "home", "Home"], ["marks", "marks", "Test marks"], ["term", "cap", "Term exams"], ["nb", "book", "Notebooks"]];
  if (inchargeClasses().length) items.push(["cls", "cls", "My class"]);
  items.push(["ins", "chart", "Insights"]); if (S.me.role === "admin") items.push(["admin", "admin", "Admin"]);
  items.push(["out", "out", "Log out"]);
  $("nav").innerHTML = items.map(([v, i, t]) => `<button data-a="nav" data-v="${v}" aria-label="${t}" title="${t}" class="${v === cur ? "on" : ""}">${ic(i)}</button>`).join("");
}
A.nav = b => b.dataset.v === "out" ? A.logout() : go(b.dataset.v);

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
/* ----- profile: avatar, name, username + role, theme, signature screen, PIN ----- */
A.profile = () => sheet(`<div class="pf"><div class="av">${esc(S.me.name[0].toUpperCase())}</div><h2>${esc(S.me.name)}</h2><p class="sub">@${esc(S.me.username)} · ${esc(roleLine())}</p></div>
  <div class="plist"><button class="prow2" data-a="theme"><span>${ic("moon", 18)}</span><b>Theme &amp; night mode</b>${ic("chevr", 18)}</button><button class="prow2" data-a="sigScreen"><span>${ic("pen", 18)}</span><b>${S.sig ? "Edit signature" : "Add signature"}</b>${S.sig ? `<img class="sgthumb" src="${S.sig}" alt="">` : ""}${ic("chevr", 18)}</button><button class="prow2" data-a="sessInfo"><span>${ic("lock", 18)}</span><b>Recent logins</b>${ic("chevr", 18)}</button></div>
  <h3 style="margin-top:18px">Change PIN</h3><div class="form"><input id="op" type="password" inputmode="numeric" maxlength="6" placeholder="Current PIN" aria-label="Current PIN" autocomplete="current-password"><input id="np" type="password" inputmode="numeric" maxlength="6" placeholder="New PIN (4–6 digits)" aria-label="New PIN" autocomplete="new-password"><input id="np2" type="password" inputmode="numeric" maxlength="6" placeholder="Repeat new PIN" aria-label="Repeat new PIN" autocomplete="new-password"></div>
  <p></p><div class="row"><button class="btn" data-a="pinSave" style="flex:2">Save new PIN</button><button class="btn alt" data-a="logout">Log out</button></div><div class="err" id="e2"></div>`);
A.sigScreen = () => sheetL(`<h2>My signature</h2><p class="sub">Printed on mark sheets and report cards wherever “Class teacher” is ticked.</p><div class="sgprev sgsig">${S.sig ? `<img src="${S.sig}" alt="Signature">` : `<small>No signature saved yet.</small>`}</div><div class="row"><button class="btn alt sm" data-a="sigDraw">Draw</button><button class="btn alt sm" data-a="sigUp">Upload image</button>${S.sig ? `<button class="btn alt sm" data-a="sigDel">Remove</button>` : ""}</div><p></p><button class="btn alt" data-a="profile">Back to profile</button>`);
A.pinSave = b => busy(b, async () => { if ($("np").value !== $("np2").value) return $("e2").textContent = "The two new PINs do not match."; try { await api("POST", "/pin/change", { oldPin: $("op").value, newPin: $("np").value }); closeSheet(true); toast("PIN changed"); } catch (x) { $("e2").textContent = x.message; } });

/* ----- right panel (profile + this week's monitors over the school skyline) ----- */
const SKY = `<svg class="sky" viewBox="0 0 300 250" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs><linearGradient id="gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d8a7a"/><stop offset="1" stop-color="#0b4a4a"/></linearGradient></defs>
 <circle cx="238" cy="52" r="20" fill="#dfe97a" opacity=".9"/><g fill="#fff" opacity=".35"><ellipse cx="60" cy="40" rx="30" ry="7"/><ellipse cx="90" cy="48" rx="22" ry="6"/></g>
 <rect x="0" y="212" width="300" height="38" fill="url(#gw)"/>
 <g><path d="M0 212 Q40 188 90 206 T190 204 T300 196 V214 H0z" fill="#5bb98c"/><path d="M0 220 Q70 204 150 218 T300 212 V232 H0z" fill="#2d8a7a" opacity=".8"/></g>
 <g><rect x="92" y="150" width="116" height="62" fill="#e9f5ef"/><rect x="72" y="172" width="26" height="40" fill="#cfe8dd"/><rect x="202" y="172" width="26" height="40" fill="#cfe8dd"/><polygon points="86,150 150,112 214,150" fill="#0b4a4a"/><rect x="138" y="128" width="24" height="22" fill="#dfe97a"/><line x1="150" y1="112" x2="150" y2="88" stroke="#e9f5ef" stroke-width="2"/><polygon points="150,88 170,95 150,102" fill="#e2574c"/>
 ${[104, 124, 166, 186].map(x => `<rect x="${x}" y="164" width="14" height="18" rx="2" fill="#2d8a7a"/>`).join("")}<rect x="140" y="186" width="20" height="26" rx="3" fill="#0b4a4a"/>${[78, 206].map(x => `<rect x="${x}" y="182" width="14" height="14" rx="2" fill="#2d8a7a"/>`).join("")}</g>
 <g><rect x="34" y="180" width="5" height="32" fill="#0b4a4a"/><circle cx="36" cy="172" r="17" fill="#5bb98c"/><rect x="258" y="186" width="5" height="26" fill="#0b4a4a"/><circle cx="260" cy="178" r="14" fill="#2d8a7a"/></g></svg>`;
const CREDIT = `<div class="credit"><img src="logo.svg" alt="" width="24" height="24" decoding="async"><span>Designed by <b>Anmol Virk</b></span></div>`;
function renderSide() {
  const cls = myClasses().includes(H.cls) ? H.cls : myClasses()[0];
  $("side").innerHTML = `<div class="sp"><div class="av big2">${esc(S.me.name[0].toUpperCase())}</div><b>${esc(S.me.name)}</b><small>${esc(roleLine())}</small><button class="btn pillbtn" data-a="profile">${ic("edit", 16)} Edit profile</button>
   <div class="sbox"><small>Class</small><b>${cls ? esc(cls) : "—"}</b><span class="arrow">${esc(todayLabel())}</span></div></div><h2 class="sch">${esc(S.cfg.school)}</h2>${SKY}${CREDIT}`;
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
  const fdue = inch ? fineDue(cls) : 0, fdef = inch ? all.filter(s => fyDef(cls, ayStart(), s.id)).length : 0;
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
  const cats = monCats(cls);
  host.innerHTML = `${cs.length > 1 ? `<div class="row chips">${cs.map(c => `<button class="chip ${c === cls ? "on" : ""}" data-a="hCls" data-c="${esc(c)}">Class ${esc(c)}</button>`).join("")}</div>` : ""}
   <div class="hero"><div class="stats">${cards}</div>
   <div class="card statc"><h3>Statistics</h3><div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="var(--line)" stroke-width="6"/><circle cx="60" cy="60" r="52" fill="none" stroke="var(--deep)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C2 * ring / 100} ${C2}" transform="rotate(-90 60 60)"/></svg><div class="rc2">${ic("cap", 34)}</div></div>${cov.map(c => `<div class="hb2"><div class="row between"><small>${c[0]}</small><b>${Math.round(c[1])}%</b></div><div class="bar"><i style="width:${c[1]}%"></i></div></div>`).join("")}</div></div>
   <div class="grid2"><div class="card"><h3>${inch && cats.length ? "This week's monitors" : "Your subjects"}</h3>${inch && cats.length ? `<div class="gantt">${cats.map((c, i) => { const m = monitorFor(cls, 0, i); return `<div class="grow"><span>${esc(c)}</span><i class="mp p${i % 3}" style="margin-left:${(i * 9) % 36}%">${m.s ? esc(m.s.name) : "—"}</i></div>`; }).join("")}</div>` : `<div class="row chips">${subs.map(s => `<span class="chip">${esc(s)}</span>`).join("")}</div>`}</div>
   <div class="card"><h3>To do</h3>${todo.slice(0, 5).map(t => `<button class="todo" data-a="nav" data-v="${t[0]}"><span class="tic">${ic(t[1], 20)}</span><span><b>${esc(t[2])}</b><small>${esc(t[3])}</small></span></button>`).join("") || `<p class="sub">All caught up. 🎉</p>`}<p style="text-align:center"><button class="btn" data-a="nav" data-v="marks">Enter test marks</button></p></div></div>`;
  renderSide();
}
A.hCls = b => { H.cls = b.dataset.c; V.home($("view")); };

/* ----- auto-sync: other teachers' entries appear in the incharge's screens without reloading ----- */
const refreshView = () => { BG++; try { refreshViewInner(); } finally { BG--; } };
function refreshViewInner() {
  if (document.hidden || !navigator.onLine || !token || !S.me || !$("sheet").classList.contains("hide")) return;
  if (document.activeElement && document.activeElement.matches("input,select,textarea")) return;
  const t = VT, ok = () => !stale(t);
  if (cur === "home" && H.cls) bundleFast(H.cls, () => ok() && homeDraw($("view")), true).catch(() => { });
  else if (cur === "cls" && C.cls) bundleFast(C.cls, () => ok() && $("cbody") && cTab(), true).catch(() => { });
  else if (cur === "ins" && I.cls) bundleFast(I.cls, () => ok() && $("ibody") && iTab(), true).catch(() => { });
  else if (cur === "marks" && M.path && $("m-ls")) { if (!fresh([M.path], 40000)) loadX([M.path], true).then(r => { if (ok() && r.changed.length) entryDraw("m"); }).catch(() => { }); }
  else if (cur === "nb" && N.ep && $("n-ls")) { if (!fresh([N.ep], 40000)) loadX([N.ep], true).then(r => { if (ok() && r.changed.length) entryDraw("n"); }).catch(() => { }); }
}
setInterval(refreshView, 75000); document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshView(); });

/* ----- admin student screen: same instant add / edit / archive as the class incharge ----- */
A.sSave = b => {
  const name = $("sn").value.trim(), roll = $("sr").value.trim(), cls = $("sc").value, id = b.dataset.id; if (!name) return $("e2").textContent = "Enter a name.";
  const old = id && stuById(id);
  if (old && old.cls !== cls) {                                    // moving to another class rewrites the list (records stay with the old class)
    return busy(b, async () => { try { await saveStudents(S.students.map(s => s.id === id ? { id, name, cls, roll: roll || undefined } : s)); } catch (x) { return $("e2").textContent = x.message; } AD.cls = cls; closeSheet(true); adStudents($("adb")); });
  }
  if (old) { stuUpdQ(id, name, roll); return closeSheet(true); }
  const ar = S.arch.find(a => a.cls === cls && nk(a.name) === nk(name));
  if (ar && confirm(`“${ar.name}” is in the archive. Restore them with all their earlier records?\n\nOK = restore, Cancel = add as a brand-new student.`)) { AD.cls = cls; stuRestoreQ(ar.id, ar.name); return closeSheet(true); }
  if (classStudents(cls).some(s => nk(s.name) === nk(name))) return $("e2").textContent = "That student is already in the class.";
  AD.cls = cls; stuAddQ([{ name, cls, roll }]); closeSheet(true);
};
A.sDel = b => { const s = stuById(b.dataset.id); if (!s || !confirm(`Remove ${s.name}? They move to the Archive with all their records and can be restored later.`)) return; stuArchiveQ([s.id]); };

/* ----- boot ----- */
renderAcct(); drawPad(); document.querySelector(".gi").innerHTML = ic("search", 18);
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => { });
if (token) api("GET", "/boot?lh=" + encodeURIComponent(localStorage.logoh || "")).then(r => { S.me = r.user; return start(r); }).catch(e => { if (e.message === "Not found.") return api("GET", "/me").then(r => { S.me = r; return start(); }).catch(() => { }); });
