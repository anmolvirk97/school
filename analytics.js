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
