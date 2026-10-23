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
