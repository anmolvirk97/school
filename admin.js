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
  host.innerHTML = `<div class="card"><h3>School settings</h3><div class="form"><label>School name<input id="cs" value="${esc(c.school)}"></label><label>Classes (comma separated, letters/digits)<input id="cc" value="${esc(c.classes.join(", "))}"></label><label>Subjects<input id="cu" value="${esc(c.subjects.join(", "))}"></label><label>Monitor categories<input id="cm" value="${esc(c.monitorCategories.join(", "))}"></label><label>Fee terms<input id="ct" value="${esc(c.terms.join(", "))}"></label><label>Non-English fine (₹)<input id="cf" type="number" value="${c.nonEnglishFine}"></label><label>Pass mark (%)<input id="cp" type="number" value="${c.passPercent}"></label></div><p></p><button class="btn" data-a="cfgSave">Save settings</button><div class="err" id="e2"></div></div><div class="card"><h3>Recent admin activity</h3><div id="aud" class="sub">Loading…</div></div>`;
  try { const l = (await api("GET", "/admin/audit")).log.slice(0, 12); $("aud").innerHTML = l.map(x => `<div class="li"><span>${esc(x.who)} ${esc(x.what)}</span><small>${new Date(x.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small></div>`).join("") || "Nothing yet."; } catch { $("aud").textContent = ""; }
}
A.cfgSave = b => busy(b, async () => {
  const l = id => $(id).value.split(",").map(x => x.trim()).filter(Boolean);
  const config = { school: $("cs").value.trim(), classes: l("cc"), subjects: l("cu"), monitorCategories: l("cm"), terms: l("ct"), nonEnglishFine: +$("cf").value, passPercent: +$("cp").value };
  try { await api("POST", "/admin/config", { config }); S.cfg = await api("GET", "/config"); toast("Settings saved"); buildNav(); } catch (x) { $("e2").textContent = x.message; }
});
