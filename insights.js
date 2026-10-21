/* ===== Insights: class analytics, single-student page, printable reports ===== */
const I = { cls: "", tab: "ov", sid: "" };
V.ins = async host => {
  setTitle("Insights", "How the class is doing, student by student");
  const cs = myClasses(); if (!cs.length) return host.innerHTML = noAccess("Ask the admin to assign you a class first.");
  if (!cs.includes(I.cls)) I.cls = cs[0];
  host.innerHTML = `<div class="row" style="align-items:center"><select id="icls" data-c="iClass" aria-label="Class" style="max-width:160px">${cs.map(c => `<option ${c === I.cls ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div><div class="seg" id="itabs"></div><div id="ibody"></div>`;
  await bundle(I.cls, true); iTab();
};
A.iClass = b => { I.cls = b.value; I.sid = ""; bundle(I.cls, true).then(iTab); };
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
