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
  await bundle(C.cls, true); cTab();
};
A.cClass = b => { C.cls = b.value; bundle(C.cls, true).then(cTab); };
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
