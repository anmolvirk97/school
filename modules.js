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
