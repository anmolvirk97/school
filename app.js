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
  if (!closeSheet()) return; cur = v; buildNav(); $("view").innerHTML = ""; $("gres").innerHTML = "";
  try { await V[v]($("view")); } catch (e) { $("view").innerHTML = `<div class="card empty"><b>Could not load this page</b><p class="sub">${esc(e.message)}</p></div>`; }
  scrollTo(0, 0);
}
const roleLine = () => S.me.role === "incharge" ? "Class incharge · " + S.me.inchargeOf : ROLE[S.me.role] || S.me.role;

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
const SKY = `<svg class="sky" viewBox="0 0 300 250" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><linearGradient id="gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d8a7a"/><stop offset="1" stop-color="#0b4a4a"/></linearGradient></defs>
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
  host.innerHTML = `<p class="sub">Loading…</p>`;
  const cls = H.cls, b = await bundle(cls, true), st = stats(cls), inch = b.inch, all = classStudents(cls), subs = subjectsOf(cls), T = today();
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
};
A.hCls = b => { H.cls = b.dataset.c; V.home($("view")); };

/* ----- boot ----- */
renderAcct(); drawPad(); document.querySelector(".gi").innerHTML = ic("search", 18);
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => { });
if (token) api("GET", "/me").then(r => { S.me = r; return start(); }).catch(() => { });
