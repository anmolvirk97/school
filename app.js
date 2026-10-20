/* School Records - front end (GitHub Pages). Backend = Cloudflare Worker (worker.js). */
"use strict";
const WORKER_URL = "https://school-api.anmolvirk1997.workers.dev";   // empty = demo mode (data stays in this browser)
const CLASSES = ["7A", "8B"], SUBJECTS = ["Math", "Science", "English"];
const MONITOR_CATS = ["Discipline", "Uniform", "Diary", "English Speaking", "Cleanliness"];
const CALL_RESPS = ["Informed", "Will visit", "Promised improvement", "Not reachable", "Not available"];
const FINE_TYPES = { nonEnglish: "Non-English speaking", icard: "I-card fee", other: "Other" };
const DEMO_STUDENTS = [["Aarav Singh","7A"],["Riya Sharma","7A"],["Rohan Verma","7A"],["Simran Kaur","7A"],["Ananya Gupta","7A"],["Rahul Yadav","7A"],["Veer Kapoor","7A"],["Meera Joshi","8B"],["Kabir Malik","8B"],["Zoya Khan","8B"]]
  .map((s,i)=>({id:"s"+(i+1),name:s[0],cls:s[1],roll:i+1}));

/* ================= state & helpers ================= */
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let token=localStorage.tok||"", me=null, students=[];
const cache={};
const todayISO=()=>new Date().toISOString().slice(0,10);
const slug=s=>String(s).replace(/\W+/g,"-").replace(/^-|-$/g,"");
const fmtD=d=>{try{return new Date(d+"T00:00").toLocaleDateString(undefined,{day:"numeric",month:"short"})}catch{return d}};
let toastT; function toast(m){const t=$("toast");t.textContent=m;t.classList.remove("hide");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.add("hide"),2200);}

async function api(method,path,body){
  if(!WORKER_URL){ // demo mode
    if(path==="login"){const u=DEMO_USERS().find(x=>x.username===body.username&&x.pin===body.pin);
      if(!u)throw "Wrong username or PIN";return{token:"demo",user:u};}
    if(path==="me")return{user:JSON.parse(localStorage.d_user)};
    if(method==="GET"){const v=localStorage["d_"+path];return v?JSON.parse(v):path.endsWith("/")?[]:path==="students.json"?DEMO_STUDENTS:{};}
    if(method==="PUT"){localStorage["d_"+path]=JSON.stringify(body.data!==undefined?body.data:body);return{ok:1};}
    throw "Demo mode";
  }
  const r=await fetch(WORKER_URL+"/"+path,{method,headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:body?JSON.stringify(body):undefined});
  const j=await r.json().catch(()=>({}));
  if(r.status===401&&path!=="login"){localStorage.removeItem("tok");toast(j.error||"Please log in again");setTimeout(()=>location.reload(),600);}
  if(!r.ok)throw j.error||("Request failed ("+r.status+")");
  return j;
}
function DEMO_USERS(){return[{username:"admin",pin:"1234",name:"Admin",role:"admin",active:true,inchargeOf:"",assignments:[]},
  {username:"anmolvirk",pin:"1997",name:"Anmol Singh",role:"incharge",active:true,inchargeOf:"7A",assignments:[{cls:"8B",sub:"Math"}]}];}

/* file helpers */
const readFile=async p=>{const r=await api("GET","file/"+p);return r.json??(r.listing?[]:{})};
const readDir=async p=>{const r=await api("GET","file/"+p.replace(/\/?$/,"/"));return r.listing?r.json:[]};
const writeFile=async(p,data,msg)=>api("PUT","file/"+p,{data,message:msg});
const myClasses=()=>CLASSES.filter(c=>me.role==="admin"||me.inchargeOf===c||(me.assignments||[]).some(a=>a.cls===c));
const mySubjects=c=>me.role==="admin"||me.inchargeOf===c?SUBJECTS:[...new Set((me.assignments||[]).filter(a=>a.cls===c).map(a=>a.sub))];
const isIncharge=c=>me.role==="admin"||me.inchargeOf===c;

/* ================= sheet (slide-up card) ================= */
let scrimEl=null;
function sheet(html){const sh=$("sheet");if(!scrimEl){scrimEl=document.createElement("div");scrimEl.className="scrim";scrimEl.onclick=()=>closeSheet();document.body.appendChild(scrimEl);}
  sh.innerHTML=html;sh.classList.remove("hide");scrimEl.classList.remove("hide");}
function closeSheet(){$("sheet").classList.add("hide");scrimEl&&scrimEl.classList.add("hide");$("sheet").onkeydown=null;}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeSheet();});

/* ================= LOGIN ================= */
let pin="";
function drawDots(){$("dots").innerHTML=[0,1,2,3,4,5].map(i=>`<i class="${i<pin.length?"f":""}"></i>`).join("");}
$("pad").innerHTML=[1,2,3,4,5,6,7,8,9,"⌫",0,"Go"].map(k=>`<button data-k="${k}" class="${k==="Go"?"go":""}">${k==="Go"?"Sign in":k}</button>`).join("");
$("pad").onclick=async e=>{const k=e.target.dataset.k;if(!k)return;
  if(k==="⌫")pin=pin.slice(0,-1);
  else if(k==="Go"){const un=$("user").value.trim().toLowerCase();
    if(!un)return $("err").textContent="Enter your username.";
    $("err").textContent="Signing in…";
    try{const r=await api("POST","login",{username:un,pin});
      if(!WORKER_URL)localStorage.d_user=JSON.stringify(r.user);
      token=r.token;localStorage.tok=token;me=r.user;pin="";startApp();}
    catch(x){$("err").textContent=x;pin="";}
    drawDots();return;}
  else if(pin.length<6)pin+=k;
  drawDots();};
$("user").addEventListener("input",()=>{const v=$("user").value.trim();$("lav").textContent=(v[0]||"S").toUpperCase();});
drawDots();

/* ================= APP SHELL ================= */
const NAV=[
  ["dash","📊","Dashboard"],["marks","📝","Test marks"],["nb","📒","Notebooks"],
  ["mon","🛡","Monitors"],["fines","💰","Fines & dues"],["calls","📞","Parent calls"],
  ["fees","🧾","Fees"],["students","👥","Students"],["admin","⚙️","Admin"]];
function buildNav(){const hideAdmin=me.role!=="admin";
  $("nav").innerHTML=NAV.filter(n=>!(hideAdmin&&n[0]==="admin")).map(n=>`<button data-v="${n[0]}">${n[1]}<span class="lbl">${n[2]}</span></button>`).join("");}
$("nav").onclick=e=>{const b=e.target.closest("[data-v]");if(b)show(b.dataset.v);};
$("outBtn").onclick=async()=>{try{await api("POST","logout")}catch{};localStorage.removeItem("tok");location.reload();};
(function theme(){const t=localStorage.theme||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");
  document.documentElement.dataset.theme=t;$("themeBtn").textContent=t==="dark"?"☀️":"🌙";})();
$("themeBtn").onclick=()=>{const t=document.documentElement.dataset.theme==="dark"?"light":"dark";
  document.documentElement.dataset.theme=t;localStorage.theme=t;$("themeBtn").textContent=t==="dark"?"☀️":"🌙";};

function startApp(){$("login").classList.add("hide");$("app").classList.remove("hide");buildNav();show("dash");}
let lastView="dash";
async function show(v){lastView=v;document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));
  students=await readFile("students.json");
  const views={dash:vDash,marks:()=>vEntry("marks"),nb:()=>vEntry("nb"),mon:vMonitors,fines:vFines,calls:vCalls,fees:vFees,students:vStudents,admin:vAdmin};
  (views[v]||vDash)();}

/* ================= DASHBOARD ================= */
async function vDash(){const el=$("view");
  const clsCount=new Set(students.map(s=>s.cls)).size;
  const tests=await readDir("data/marks");
  const mySubj=(me.assignments||[]).map(a=>a.sub+" "+a.cls);
  el.innerHTML=`<h1>Hello, ${esc(me.name.split(" ")[0])} 👋</h1><p class="sub">${new Date().toDateString()} · ${me.role==="admin"?"Administrator":me.role==="incharge"?("Incharge of "+me.inchargeOf):"Teacher"}</p>
  <div class="stats">
    <div class="stat lime"><div class="tag">👥<b>${students.length}</b></div><div><small>Students</small><strong>${clsCount} classes</strong></div></div>
    <div class="stat green"><div class="tag">📝<b>${tests.length}</b></div><div><small>Tests recorded</small><strong>all subjects</strong></div></div>
    <div class="stat deep"><div class="tag">📚<b>${(me.role==="admin"?CLASSES:myClasses()).length}</b></div><div><small>My classes</small><strong>${esc(mySubj.join(" · ")||"All")}</strong></div></div>
  </div>
  <div class="card"><b>Quick entry</b><p class="sub">The same fast alphabet flow for every data type.</p>
    <div class="row">${[["marks","📝 Test marks"],["nb","📒 Notebooks"],["fines","💰 Fines"],["calls","📞 Calls"],["fees","🧾 Fees"]].map(q=>`<button class="btn alt" data-go="${q[0]}">${q[1]}</button>`).join("")}</div></div>
  <div id="dashExtra"></div>`;
  el.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>show(b.dataset.go));
  // monitors this week (incharge/admin)
  if(me.role!=="teacher"){const wk=weekKey(new Date());
    const html=await Promise.all(myClasses().map(async c=>{let m={};try{m=await readFile(`data/monitors/${c}_${wk}.json`)}catch{}
      return `<div class="card"><b>🛡 ${esc(c)} monitors — this week</b><div class="klist">${MONITOR_CATS.map(cat=>{const s=students.find(x=>x.id===m[cat]);return `<div class="st"><span>${cat}</span><span class="m">${s?esc(s.name):"—"}</span></div>`}).join("")}</div></div>`;}));
    $("dashExtra").innerHTML=html.join("");}
  if(me.role==="admin"){$("dashExtra").innerHTML+=`<div class="card"><b>⚙️ Admin</b><p class="sub">Manage teacher profiles, roles and subject assignments.</p><button class="btn" data-go="admin">Open admin panel</button></div>`;
    $("dashExtra").querySelector("[data-go]").onclick=()=>show("admin");}}

/* ================= UNIVERSAL ENTRY ENGINE (spec §4) ================= */
function weekKey(d){const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  const day=(t.getUTCDay()+6)%7;t.setUTCDate(t.getUTCDate()-day+3);
  const fst=new Date(Date.UTC(t.getUTCFullYear(),0,4));const fday=(fst.getUTCDay()+6)%7;fst.setUTCDate(fst.getUTCDate()-fday+3);
  const wk=1+Math.round((t-fst)/(7*864e5));return t.getUTCFullYear()+"-W"+String(wk).padStart(2,"0");}

function alphaHTML(has,cur){return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l=>`<button data-l="${l}" class="${l===cur?"on":""}" ${has.has(l)?"":"disabled"}>${l}</button>`).join("");}

/* cfg: {kind,title,sub,needSubject,needTest,needDate,filtersExtra,path,load,card,summary,bulk,onStart} */
async function vEntry(kind){
  if(kind==="marks")return marksSetup();
  if(kind==="nb")return nbSetup();
  return finesSetup();
}
function filterCard(cfg){return `<div class="card"><b>${cfg.title}</b><p class="sub">${cfg.sub}</p><div class="row">
  <select id="fcls">${cfg.classes.map(c=>`<option>${c}</option>`).join("")}</select>
  ${cfg.needSubject?`<select id="fsub">${SUBJECTS.map(s=>`<option>${s}</option>`).join("")}</select>`:""}
  ${cfg.needDate?`<input id="fdate" type="date" value="${todayISO()}">`:""}
  ${cfg.extra||""}</div><p></p><div class="row"><button class="btn fixed" id="fgo">Start entry →</button>${cfg.extraBtns||""}</div><div class="err" id="ferr"></div></div>`;}

function bindClassSubject(){const upd=()=>{const c=$("fcls").value,s=$("fsub");if(!s)return;
    s.innerHTML=mySubjects(c).map(x=>`<option>${x}</option>`).join("");};$("fcls").onchange=upd;upd();}

async function runList(cfg){ // cfg: {cls,data,keyFn,card,summary,bulk,students}
  const el=$("view");
  const all=students.filter(s=>s.cls===cfg.cls).sort((a,b)=>a.name.localeCompare(b.name));
  let letter="",q="";
  const draw=()=>{const done=all.filter(s=>cfg.keyFn(s)).length;
    el.innerHTML=`<button class="btn ghost sm fixed" id="bk">← Back</button>${cfg.head||""}
    <div class="card"><div class="row fixed" style="justify-content:space-between"><b id="cnt">${done}/${all.length} entered</b>
      <input id="find" placeholder="Search name" style="max-width:220px"></div>
      <div class="bar" style="margin:12px 0"><i style="width:${all.length?done/all.length*100:0}%"></i></div>
      <div class="alpha" id="alpha"></div><div id="list"></div>
      ${cfg.foot||""}</div>`;
    $("bk").onclick=()=>show(lastView);
    const has=new Set(all.map(s=>s.name[0].toUpperCase()));
    $("alpha").innerHTML=alphaHTML(has,letter);
    $("alpha").onclick=e=>{const b=e.target.closest("[data-l]");if(b){letter=letter===b.dataset.l?"":b.dataset.l;draw();}};
    $("find").value=q;$("find").oninput=()=>{q=$("find").value.toLowerCase();paintList();};
    cfg.bind&&cfg.bind();
    paintList();};
  function paintList(){const list=all.filter(s=>q?s.name.toLowerCase().includes(q):(!letter||s.name[0].toUpperCase()===letter));
    $("list").innerHTML=list.map(s=>{const ex=cfg.keyFn(s);return `<button class="st ${ex?"done":""}" data-id="${s.id}"><span>${esc(s.name)}</span><span class="m">${cfg.summary(s,ex)||""}</span></button>`}).join("")||`<p class="empty">No students found.</p>`;
    $("list").querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>openCard(b.dataset.id));}
  async function openCard(id){const s=all.find(x=>x.id===id);
    await cfg.card(s,async(newVal)=>{cfg.data[id]=newVal;try{await cfg.save();paintList();const nxt=all.slice(all.indexOf(s)+1).find(x=>!cfg.keyFn(x));if(nxt)openCard(nxt.id);else{closeSheet();paintList();toast("All caught up 🎉");}}catch(x){delete cfg.data[id];toast(x);}},()=>{const nxt=all.slice(all.indexOf(s)+1).find(x=>!cfg.keyFn(x));nxt?openCard(nxt.id):closeSheet();paintList();});}
  draw();}

/* ================= TEST MARKS (spec §5) ================= */
async function marksSetup(){const el=$("view"),classes=myClasses();
  el.innerHTML=filterCard({title:"📝 Test marks",sub:"Set the test once, then tap names to enter marks.",classes,needSubject:true,needDate:true,
    extra:`<input id="ftname" placeholder="Test name (e.g. Unit 1)"><input id="fmax" type="number" inputmode="numeric" placeholder="Max marks (e.g. 20)">`});
  bindClassSubject();
  $("fgo").onclick=()=>{const max=+$("fmax").value,name=$("ftname").value.trim();
    if(!name||!max)return $("ferr").textContent="Add a test name and max marks.";
    marksRun({cls:$("fcls").value,sub:$("fsub").value,date:$("fdate").value,name,max});};}

async function marksRun(T){T.path=`data/marks/${T.cls}_${T.sub}_${T.date}_${slug(T.name)}.json`;
  let data={};try{data=await readFile(T.path)}catch{}
  await runList({cls:T.cls,data,keyFn:s=>data[s.id],
    head:`<h1>${esc(T.name)}</h1><p class="sub">${esc(T.cls)} · ${esc(T.sub)} · ${fmtD(T.date)} · Max ${T.max}</p>`,
    summary:(s,ex)=>ex?`${ex.m}/${ex.max}`:"",
    save:()=>writeFile(T.path,data,`Marks ${T.cls} ${T.sub} ${T.name}`),
    card:async(s,save,skip)=>{const m=data[s.id]||{m:"",max:T.max,r:""};
      sheet(`<h2>${esc(s.name)}</h2><p class="sub">${esc(T.name)} · ${fmtD(T.date)}</p>
        <div class="row" style="align-items:center;flex-wrap:nowrap"><input class="big" id="m" type="number" inputmode="decimal" value="${m.m}" placeholder="0"><b class="fixed">/</b><input class="big" id="x" type="number" value="${m.max}"></div>
        <p><input id="r" placeholder="Remark (optional)" value="${esc(m.r||"")}"></p>
        <div class="row"><button class="btn" id="sv" style="flex:2">Save &amp; next</button><button class="btn ghost fixed" id="sk">Skip</button></div><div class="err" id="e2"></div>`);
      $("m").focus();$("m").select();
      $("sk").onclick=skip;
      const doSave=async()=>{const v=$("m").value,mx=+$("x").value;
        if(v===""||isNaN(+v)||+v<0||+v>mx)return $("e2").textContent="Marks must be between 0 and "+mx+".";
        await save({m:+v,max:mx,r:$("r").value.trim(),by:me.name,t:Date.now()});};
      $("sv").onclick=doSave;
      $("sheet").onkeydown=e=>{if(e.key==="Enter")doSave();}}});}
/* ================= NOTEBOOKS (spec §6) ================= */
const NBSYM=["✖","✔","➖"], NBNAME=["Pending","Done","Partial"];
async function nbSetup(){const el=$("view"),classes=myClasses();
  el.innerHTML=filterCard({title:"📒 Notebooks",sub:"One tap per chapter — cycle ✖ → ✔ → ➖. Use Individual mode for detailed entry.",classes,needSubject:true,needDate:true,
    extraBtns:`<button class="btn ghost fixed" id="fsyl">Edit chapters</button><button class="btn ghost fixed" id="fheat">Heatmap</button>`});
  bindClassSubject();
  $("fsyl").onclick=()=>editSyllabus($("fcls").value,$("fsub").value);
  $("fheat").onclick=()=>nbHeatmap($("fcls").value,$("fsub").value);
  $("fgo").onclick=async()=>{const cls=$("fcls").value,sub=$("fsub").value,date=$("fdate").value;
    const sy=await readFile(`data/syllabus/${cls}_${sub}.json`);
    if(!sy.chapters||!sy.chapters.length){toast("Add chapters first");return editSyllabus(cls,sub,()=>nbRun({cls,sub,date}));}
    nbRun({cls,sub,date,chapters:sy.chapters});};}

async function editSyllabus(cls,sub,cb){const sp=`data/syllabus/${cls}_${sub}.json`;
  let sy={};try{sy=await readFile(sp)}catch{}
  sheet(`<h2>Chapters: ${esc(cls)} ${esc(sub)}</h2><p class="sub">One chapter per line, in order. Status: Full / Summary only / Not started.</p>
    <textarea id="chs" rows="8" style="width:100%">${esc((sy.chapters||[]).map(c=>c.name).join("\n"))}</textarea><p></p>
    <div class="row"><button class="btn" id="csv" style="flex:2">Save chapters</button><button class="btn ghost fixed" id="ccl">Cancel</button></div><div class="err" id="e2"></div>`);
  $("ccl").onclick=closeSheet;
  $("csv").onclick=async()=>{const names=$("chs").value.split("\n").map(x=>x.trim()).filter(Boolean);
    const old=sy.chapters||[];const chapters=names.map((n,i)=>{const o=old.find(c=>c.name===n);return{name:n,status:o?o.status:"full"}});
    try{await writeFile(sp,{chapters},`Syllabus ${cls} ${sub}`);closeSheet();toast("Chapters saved");cb&&cb();}catch(x){$("e2").textContent=x;}};}

let nbCtx=null;
async function nbRun(NB){NB.path=`data/notebook/${NB.cls}_${NB.sub}_${NB.date}.json`;
  let data={};try{data=await readFile(NB.path)}catch{}
  let mode=localStorage.nbMode||"strip";
  nbCtx=NB;
  await runList({cls:NB.cls,data,keyFn:s=>data[s.id],
    head:`<h1>Notebooks · ${esc(NB.sub)}</h1><p class="sub">${esc(NB.cls)} · ${fmtD(NB.date)} · ${NB.chapters.length} chapters</p>`,
    summary:(s,ex)=>ex?`${ex.s.filter(x=>x===1).length}/${NB.chapters.length} ✔`:"",
    save:()=>writeFile(NB.path,data,`Notebook ${NB.cls} ${NB.sub} ${NB.date}`),
    bind(){const seg=document.createElement("div");seg.className="seg";seg.style.margin="0 0 10px";
      seg.innerHTML=`<button data-m="strip" class="${mode==="strip"?"on":""}">⚡ Fast strip</button><button data-m="ind" class="${mode==="ind"?"on":""}">👤 Individual</button>`;
      seg.onclick=e=>{const b=e.target.closest("[data-m]");if(b){mode=b.dataset.m;localStorage.nbMode=mode;nbCtx?nbRun(nbCtx):show("nb");}};
      $("view").querySelector(".card").prepend(seg);},
    card:async(s,save,skip)=>{const ex=data[s.id];const st=ex?ex.s.slice():NB.chapters.map(()=>0);let remark=ex?ex.r||"":"";
      const draw=()=>{mode==="strip"
        ?sheet(`<h2>${esc(s.name)}</h2><p class="sub">Tap a chapter to cycle ✖ → ✔ → ➖</p>
            <div class="chs">${st.map((v,i)=>`<button class="ch s${v}" data-i="${i}">Ch ${i+1}<br>${NBSYM[v]}</button>`).join("")}</div>
            <p class="sub small">${NB.chapters.map((c,i)=>`Ch${i+1} ${esc(c.name)}`).join(" · ")}</p>
            <div class="row"><button class="btn alt fixed" id="nall">All done</button><button class="btn" id="nsv" style="flex:2">Save &amp; next</button><button class="btn ghost fixed" id="nsk">Skip</button></div><div class="err" id="e2"></div>`)
        :sheet(`<h2>${esc(s.name)}</h2><p class="sub">Individual entry — set each chapter explicitly</p>
            ${NB.chapters.map((c,i)=>`<div class="row" style="margin-bottom:8px"><span class="fixed" style="min-width:110px;font-weight:800">Ch ${i+1} ${esc(c.name)}</span>
              <select data-i="${i}">${NBNAME.map((n,v)=>`<option value="${v}" ${st[i]===v?"selected":""}>${n}</option>`).join("")}</select></div>`).join("")}
            <p><input id="nr" placeholder="Remark (optional)" value="${esc(remark)}"></p>
            <div class="row"><button class="btn" id="nsv" style="flex:2">Save &amp; next</button><button class="btn ghost fixed" id="nsk">Skip</button></div><div class="err" id="e2"></div>`);
        const chs=$("sheet").querySelector(".chs");if(chs)chs.onclick=e=>{const b=e.target.closest("[data-i]");if(b){const i=+b.dataset.i;st[i]=(st[i]+1)%3;draw();}};
        $("sheet").querySelectorAll("select[data-i]").forEach(se=>se.onchange=()=>st[+se.dataset.i]=+se.value);
        $("nall")&&($("nall").onclick=()=>{st.fill(1);draw();});
        $("nr")&&( $("nr").oninput=e=>remark=e.target.value);
        $("nsk").onclick=skip;
        $("nsv").onclick=async()=>{if(remark===""&&$("nr"))remark=$("nr").value;await save({s:st,r:remark,by:me.name,t:Date.now()});};};
      draw();}});}

/* clean heatmap cell logic */
async function nbHeatmap(cls,sub){
  const files=(await readDir("data/notebook")).filter(f=>f.name.startsWith(`${cls}_${sub}_`));
  const entries=await Promise.all(files.map(async f=>({date:f.name.replace(`${cls}_${sub}_`,"").replace(".json",""),data:await readFile("data/notebook/"+f.name)})));
  entries.sort((a,b)=>a.date.localeCompare(b.date));
  const sy=await readFile(`data/syllabus/${cls}_${sub}.json`);const nch=(sy.chapters||[]).length||1;
  const rows=students.filter(s=>s.cls===cls).sort((a,b)=>a.name.localeCompare(b.name));
  const cell=d=>{if(!d)return '<td class="hnull">·</td>';const s=d.s.slice(0,nch);const done=s.filter(v=>v===1).length;
    const cls2=done===s.length?1:done===0?0:2;return `<td class="h${cls2}" title="${done}/${s.length} done">${done}/${s.length}</td>`;};
  sheet(`<h2>Heatmap · ${esc(cls)} ${esc(sub)}</h2><p class="sub">Rows = students · Columns = dates · Green=all done · Amber=partial · Red=none</p>
    <div class="heat"><table><tr><th>Student</th>${entries.map(e=>`<th>${fmtD(e.date)}</th>`).join("")}</tr>
    ${rows.map(s=>`<tr><th>${esc(s.name)}</th>${entries.map(e=>cell(e.data[s.id])).join("")}</tr>`).join("")}
    </table></div><p></p><button class="btn" onclick="closeSheet()">Close</button>`);}

/* ================= MONITORS (spec §7.1) ================= */
async function vMonitors(){const el=$("view"),classes=myClasses();
  el.innerHTML=`<h1>🛡 Monitor rotation</h1><p class="sub">Auto round-robin — every student gets a turn. Incharge can override.</p>
    <div class="card"><div class="row"><select id="mcls">${classes.map(c=>`<option>${c}</option>`).join("")}</select><input id="mweek" type="week" value="${weekKey(new Date())}"></div><p></p><button class="btn" id="mgo">Open week</button></div><div id="mview"></div>`;
  const open=async()=>{const cls=$("mcls").value,wk=$("mweek").value;
    const roster=students.filter(s=>s.cls===cls).sort((a,b)=>(a.roll||99)-(b.roll||99));
    let saved={};try{saved=await readFile(`data/monitors/${cls}_${wk}.json`)}catch{}
    const over=!!saved._overridden;
    const pick=cat=>{if(saved[cat])return saved[cat];
      const i=(MONITOR_CATS.indexOf(cat)*3+wkNum(wk))%Math.max(roster.length,1);return roster[i]?roster[i].id:"";};
    $("mview").innerHTML=`<div class="card"><b>${esc(cls)} · week ${wk}</b> ${over?'<span class="pill amber">manual override</span>':""}
      <div class="klist" style="margin-top:10px">${MONITOR_CATS.map(cat=>{const s=roster.find(x=>x.id===pick(cat));return `<div class="st"><span>${cat}</span><span class="row fixed" style="gap:6px">${isIncharge(cls)?`<button class="btn sm ghost" data-cat="${cat}">Change</button>`:""}<b>${s?esc(s.name):"—"}</b></span></div>`}).join("")}</div>
      ${isIncharge(cls)?`<p></p><div class="row"><button class="btn alt" id="mroster">View full roster</button><button class="btn ghost" id="mclear">Reset to auto</button></div>`:""}</div>`;
    $("mview").querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{sheet(`<h2>Pick monitor: ${b.dataset.cat}</h2><div class="klist">${roster.map(s=>`<button class="st" data-id="${s.id}"><span>${esc(s.name)}</span><span class="m">Roll ${s.roll||"—"}</span></button>`).join("")}</div>`);
      $("sheet").querySelectorAll("[data-id]").forEach(x=>x.onclick=async()=>{saved[x.dataset.cat]=x.dataset.id;saved._overridden=true;
        try{await writeFile(`data/monitors/${cls}_${wk}.json`,saved,`Monitors ${cls} ${wk}`);closeSheet();open();}catch(e){toast(e);}});});
    const ro=$("mroster");if(ro)ro.onclick=()=>{sheet(`<h2>${esc(cls)} roster (week ${wk})</h2><p class="sub">Round-robin across the whole year.</p>
      <div class="klist">${MONITOR_CATS.map(cat=>`<div class="st"><span>${cat}</span><span class="m">${roster.map((s,i)=>{const w=wkNum(wk)+i;const id=roster[(MONITOR_CATS.indexOf(cat)*3+w)%roster.length].id;const st=students.find(x=>x.id===id);return st?esc(st.name.split(" ")[0]):""}).join(" → ")}</span></div>`).join("")}</div><p></p><button class="btn" onclick="closeSheet()">Close</button>`);};
    const mc=$("mclear");if(mc)mc.onclick=async()=>{try{await writeFile(`data/monitors/${cls}_${wk}.json`,{},`Monitors ${cls} ${wk} reset`);open();}catch(e){toast(e);}};};
  $("mgo").onclick=open;open();}
function wkNum(wk){const m=/W(\d+)/.exec(wk||"");return m?+m[1]:1;}

/* ================= FINES & DUES (spec §7.2) ================= */
const vFines=finesSetup;
async function finesSetup(){const el=$("view"),classes=myClasses().filter(isIncharge);
  if(!classes.length)return el.innerHTML=`<h1>💰 Fines & dues</h1><p class="sub">Only the class incharge or admin can manage fines.</p>`;
  el.innerHTML=filterCard({title:"💰 Fines & dues",sub:"Non-English speaking, I-card and other dues with a running ledger.",classes});
  $("fgo").onclick=async()=>{const cls=$("fcls").value;finesRun(cls);};}
async function finesRun(cls){const path=`data/fines/${cls}.json`;let data={};try{data=await readFile(path)}catch{}
  const total=id=>(data[id]||[]).reduce((a,f)=>a+(+f.amount||0),0), paid=id=>(data[id]||[]).filter(f=>f.paid).reduce((a,f)=>a+(+f.amount||0),0);
  const el=$("view");let q="";
  const draw=()=>{const list=students.filter(s=>s.cls===cls&&(!q||s.name.toLowerCase().includes(q))).sort((a,b)=>a.name.localeCompare(b.name));
    const defaulters=list.filter(s=>total(s.id)-paid(s.id)>0).length;
    el.innerHTML=`<h1>💰 Fines · ${esc(cls)}</h1><p class="sub">${defaulters} students with dues · tap a name for the ledger</p>
      <div class="card"><input id="find" placeholder="Search name" value="${esc(q)}"><p></p><div class="klist">
      ${list.map(s=>{const due=total(s.id)-paid(s.id);return `<button class="st" data-id="${s.id}"><span>${esc(s.name)}</span><span>${due>0?`<span class="pill red">₹${due} due</span>`:`<span class="pill green">clear</span>`} <span class="m">₹${paid(s.id)}/${total(s.id)} paid</span></span></button>`}).join("")}</div></div>`;
    $("find").oninput=e=>{q=e.target.value.toLowerCase();draw();};
    el.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>ledger(b.dataset.id));};
  async function ledger(id){const s=students.find(x=>x.id===id);let fines=data[id]||[];
    const drawL=()=>{sheet(`<h2>${esc(s.name)}</h2><p class="sub">Ledger — total ₹${total(id)} · paid ₹${paid(id)} · due ₹${total(id)-paid(id)}</p>
      <div class="klist">${fines.length?fines.map((f,i)=>`<div class="st"><span>${FINE_TYPES[f.type]||f.type} · ₹${f.amount}<br><span class="m">${fmtD(f.date)} · ${esc(f.by||"")}</span></span><button class="btn sm ${f.paid?"ghost":"alt"}" data-i="${i}">${f.paid?"Paid ✓":"Mark paid"}</button></div>`).join(""):`<p class="empty">No fines yet.</p>`}</div>
      <p></p><div class="row"><select id="ftype">${Object.entries(FINE_TYPES).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select><input id="famt" type="number" inputmode="numeric" placeholder="Amount (₹)" value="20"><input id="fdate2" type="date" value="${todayISO()}"></div>
      <p><input id="frem" placeholder="Remark (optional)"></p><div class="row"><button class="btn" id="fadd" style="flex:2">Add fine</button><button class="btn ghost fixed" id="fclose">Done</button></div><div class="err" id="e2"></div>`);
      $("sheet").querySelectorAll("[data-i]").forEach(b=>b.onclick=async()=>{fines[+b.dataset.i].paid=!fines[+b.dataset.i].paid;data[id]=fines;
        try{await writeFile(path,data,`Fines ${cls}`);drawL();draw();}catch(e){$("e2").textContent=e;}});
      $("ftype").onchange=()=>{$("famt").value=$("ftype").value==="nonEnglish"?"20":$("ftype").value==="icard"?"50":"";};
      $("fclose").onclick=()=>{closeSheet();draw();};
      $("fadd").onclick=async()=>{const amt=+$("famt").value;if(!amt)return $("e2").textContent="Enter an amount.";
        fines.push({id:"f"+Date.now(),type:$("ftype").value,amount:amt,date:$("fdate2").value,remark:$("frem").value.trim(),paid:false,by:me.name,t:Date.now()});data[id]=fines;
        try{await writeFile(path,data,`Fines ${cls}`);drawL();draw();toast("Fine added");}catch(e){$("e2").textContent=e;}};};
    drawL();}
  draw();}

/* ================= PARENT CALLS (spec §7.3) ================= */
async function vCalls(){const el=$("view"),classes=myClasses().filter(isIncharge);
  if(!classes.length)return el.innerHTML=`<h1>📞 Parent calls</h1><p class="sub">Only the class incharge or admin can log calls.</p>`;
  el.innerHTML=filterCard({title:"📞 Parent calls",sub:"Log this week's calls — response + remark per student.",classes,needDate:true,extraBtns:`<button class="btn ghost fixed" id="fsug">Who to call</button>`});
  $("fsug").onclick=()=>callSuggestions($("fcls").value);
  $("fgo").onclick=async()=>{const cls=$("fcls").value,date=$("fdate").value,path=`data/calls/${cls}_${date}.json`;
    let data={};try{data=await readFile(path)}catch{}
    await runList({cls,data,keyFn:s=>data[s.id],
      head:`<h1>Calls · ${esc(cls)}</h1><p class="sub">${fmtD(date)} — tap a student to log the parent's response</p>`,
      summary:(s,ex)=>ex?CALL_RESPS[Math.max(0,CALL_RESPS.indexOf(ex.resp))]||esc(ex.resp):"",
      save:()=>writeFile(path,data,`Calls ${cls} ${date}`),
      card:async(s,save,skip)=>{const ex=data[s.id]||{resp:CALL_RESPS[0],remark:""};
        sheet(`<h2>${esc(s.name)}</h2><p class="sub">Parent call · ${fmtD(date)}</p>
          <p><select id="cr">${CALL_RESPS.map(r=>`<option ${ex.resp===r?"selected":""}>${r}</option>`).join("")}</select></p>
          <p><input id="cm" placeholder="Remark (optional)" value="${esc(ex.remark||"")}"></p>
          <div class="row"><button class="btn" id="sv" style="flex:2">Save &amp; next</button><button class="btn ghost fixed" id="sk">Skip</button></div><div class="err" id="e2"></div>`);
        $("sk").onclick=skip;
        $("sv").onclick=async()=>await save({resp:$("cr").value,remark:$("cm").value.trim(),by:me.name,t:Date.now()});}});};}

async function callSuggestions(cls){ // students with 2+ pending notebook chapters in latest entries
  const files=(await readDir("data/notebook")).filter(f=>f.name.startsWith(cls+"_"));
  if(!files.length)return toast("No notebook data yet");
  const latest={};for(const f of files){const[,,date]=f.name.replace(".json","").split("_");const d=await readFile("data/notebook/"+f.name);
    for(const[sid,v]of Object.entries(d)){const pen=v.s.filter(x=>x===0).length;
      if(!latest[sid]||date>latest[sid].date)latest[sid]={date,pen}};}
  const sug=Object.entries(latest).filter(([,v])=>v.pen>=2).sort((a,b)=>b[1].pen-a[1].pen);
  sheet(`<h2>📞 Suggested calls · ${esc(cls)}</h2><p class="sub">Students with 2+ pending chapters (latest notebook check)</p>
    <div class="klist">${sug.length?sug.map(([sid,v])=>{const s=students.find(x=>x.id===sid);return s?`<div class="st"><span>${esc(s.name)}</span><span class="pill red">${v.pen} pending</span></div>`:""}).join(""):`<p class="empty">Nobody is behind on notebooks 🎉</p>`}</div><p></p><button class="btn" onclick="closeSheet()">Close</button>`);}
/* ================= FEES (spec §7.4) ================= */
async function vFees(){const el=$("view"),classes=myClasses().filter(isIncharge);
  if(!classes.length)return el.innerHTML=`<h1>🧾 Fees</h1><p class="sub">Only the class incharge or admin can manage fees.</p>`;
  el.innerHTML=filterCard({title:"🧾 Fee clearance",sub:"Term-wise dues with partial payments. Tap a student to record a payment.",classes});
  $("fgo").onclick=async()=>{const cls=$("fcls").value,path=`data/fees/${cls}.json`;
    let data={};try{data=await readFile(path)}catch{}
    const el2=$("view");let q="";
    const draw=()=>{const list=students.filter(s=>s.cls===cls&&(!q||s.name.toLowerCase().includes(q))).sort((a,b)=>a.name.localeCompare(b.name));
      const due=id=>Math.max(0,+(data[id]?.due||0)-payments(id));
      el2.innerHTML=`<h1>🧾 Fees · ${esc(cls)}</h1><p class="sub">Tap a student to set dues / record a payment</p>
        <div class="card"><input id="find" placeholder="Search name" value="${esc(q)}"><p></p><div class="klist">
        ${list.map(s=>{const d=due(s.id);return `<button class="st" data-id="${s.id}"><span>${esc(s.name)}</span><span>${d>0?`<span class="pill red">₹${d} due</span>`:`<span class="pill green">clear</span>`} <span class="m">₹${payments(s.id)}/${data[s.id]?.due||0}</span></span></button>`}).join("")}</div></div>`;
      $("find").oninput=e=>{q=e.target.value.toLowerCase();draw();};
      el2.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>payCard(b.dataset.id));};
    function payments(id){return(data[id]?.payments||[]).reduce((a,p)=>a+(+p.amount||0),0);}
    function payCard(id){const s=students.find(x=>x.id===id);const rec=data[id]||{due:0,payments:[]};
      sheet(`<h2>${esc(s.name)}</h2><p class="sub">Total due ₹${rec.due} · paid ₹${payments(id)} · remaining ₹${Math.max(0,rec.due-payments(id))}</p>
        <div class="klist">${rec.payments.length?rec.payments.map(p=>`<div class="st"><span>₹${p.amount}</span><span class="m">${fmtD(p.date)}</span></div>`).join(""):`<p class="empty">No payments yet.</p>`}</div>
        <p></p><div class="row"><input id="pdue" type="number" inputmode="numeric" placeholder="Total due (₹)" value="${rec.due||""}"><button class="btn alt fixed" id="pset">Set due</button></div>
        <p></p><div class="row"><input id="pamt" type="number" inputmode="numeric" placeholder="Payment amount (₹)"><input id="pdate" type="date" value="${todayISO()}"><button class="btn fixed" id="padd">Add</button></div>
        <p></p><button class="btn ghost" id="pclose">Done</button><div class="err" id="e2"></div>`);
      $("pclose").onclick=()=>{closeSheet();draw();};
      $("pset").onclick=async()=>{rec.due=+$("pdue").value||0;data[id]=rec;try{await writeFile(path,data,`Fees ${cls}`);draw();toast("Due updated");}catch(e){$("e2").textContent=e;}};
      $("padd").onclick=async()=>{const amt=+$("pamt").value;if(!amt)return $("e2").textContent="Enter an amount.";
        rec.payments.push({amount:amt,date:$("pdate").value});data[id]=rec;try{await writeFile(path,data,`Fees ${cls}`);payCard(id);draw();toast("Payment recorded");}catch(e){$("e2").textContent=e;}};}
    draw();};}

/* ================= STUDENTS + STUDENT PAGE (spec §8.2) ================= */
async function vStudents(){const el=$("view");let q="",cl="";
  const draw=()=>{const list=students.filter(s=>(!cl||s.cls===cl)&&(!q||s.name.toLowerCase().includes(q))).sort((a,b)=>a.cls.localeCompare(b.cls)||a.name.localeCompare(b.name));
    el.innerHTML=`<h1>👥 Students</h1><p class="sub">${students.length} students · tap for full record</p>
      <div class="card"><div class="row"><select id="scls"><option value="">All classes</option>${CLASSES.map(c=>`<option ${c===cl?"selected":""}>${c}</option>`).join("")}</select><input id="find" placeholder="Search name" value="${esc(q)}"></div><p></p>
      <div class="klist">${list.map(s=>`<button class="st" data-id="${s.id}"><span>${esc(s.name)}</span><span class="m">${esc(s.cls)} · Roll ${s.roll||"—"}</span></button>`).join("")}</div></div>`;
    $("scls").onchange=e=>{cl=e.target.value;draw();};$("find").oninput=e=>{q=e.target.value.toLowerCase();draw();};
    el.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>studentPage(b.dataset.id));};
  draw();}

async function studentPage(id){const s=students.find(x=>x.id===id);
  const[mkFiles,nbFiles]=await Promise.all([readDir("data/marks"),readDir("data/notebook")]);
  const myMk=mkFiles.filter(f=>f.name.startsWith(s.cls+"_"));
  const tests=await Promise.all(myMk.map(async f=>{const d=await readFile("data/marks/"+f.name);const seg=f.name.replace(".json","").split("_");
    return{sub:seg[1],date:seg[2],name:seg.slice(3).join(" "),max:d[s.id]?.max,v:d[s.id]?.m,avg:avgOf(d)};}));
  tests.sort((a,b)=>a.date.localeCompare(b.date));
  const fines=(await readFile(`data/fines/${s.cls}.json`))[id]||[];
  const calls=await Promise.all((await readDir("data/calls")).filter(f=>f.name.startsWith(s.cls+"_")).map(async f=>({date:f.name.replace(".json","").split("_")[1],d:await readFile("data/calls/"+f.name)})));
  const myCalls=calls.map(c=>({date:c.date,...c.d[id]})).filter(x=>x.resp);
  const fee=(await readFile(`data/fees/${s.cls}.json`))[id];
  const feePaid=(fee?.payments||[]).reduce((a,p)=>a+(+p.amount||0),0);
  const chart=lineChart(tests.map(t=>t.v===undefined?undefined:Math.round(t.v/t.max*100)),tests.map(t=>`${t.sub} ${fmtD(t.date)}`),tests.map(t=>Math.round(t.avg)));
  $("view").innerHTML=`<button class="btn ghost sm" id="back">← Back</button>
    <div class="card" style="text-align:center"><div class="av">${esc(s.name[0])}</div><h1 style="font-size:24px">${esc(s.name)}</h1><p class="sub">${esc(s.cls)} · Roll ${s.roll||"—"}</p></div>
    <div class="grid2">
      <div class="card"><b>📈 Marks trend</b>${tests.length?chart:`<p class="empty">No marks yet</p>`}
        <div class="klist">${tests.slice(-5).reverse().map(t=>`<div class="st"><span>${esc(t.sub)} · ${esc(t.name)}</span><span class="${t.v===undefined?"m":(+t.v>=t.max*0.4?"":"pill red")}">${t.v===undefined?"—":`${t.v}/${t.max} · class avg ${Math.round(t.avg*10)/10}`}</span></div>`).join("")}</div></div>
      <div class="card"><b>📒 Notebook</b>${await nbSummary(s)}</div>
      <div class="card"><b>💰 Fines</b>${fines.length?`<table class="tbl">${fines.map(f=>`<tr><td>${FINE_TYPES[f.type]||f.type}</td><td class="mono">₹${f.amount}</td><td>${fmtD(f.date)}</td><td>${f.paid?'<span class="pill green">paid</span>':'<span class="pill red">due</span>'}</td></tr>`).join("")}</table>`:`<p class="empty">No fines 🎉</p>`}</div>
      <div class="card"><b>📞 Calls</b>${myCalls.length?`<table class="tbl">${myCalls.slice().reverse().map(c=>`<tr><td>${fmtD(c.date)}</td><td>${esc(c.resp)}</td><td class="m">${esc(c.remark||"")}</td></tr>`).join("")}</table>`:`<p class="empty">No calls logged</p>`}</div>
      <div class="card"><b>🧾 Fees</b>${fee?`<p>Due <b>₹${fee.due}</b> · Paid <b>₹${feePaid}</b> · <b class="${fee.due-feePaid>0?"":"pill green"}" style="color:${fee.due-feePaid>0?"var(--red)":"inherit"}">${fee.due-feePaid>0?`₹${fee.due-feePaid} remaining`:"Clear ✓"}</b></p>`:`<p class="empty">No fee record</p>`}</div>
    </div>`;
  $("back").onclick=vStudents;}
function avgOf(obj){const v=Object.values(obj).filter(x=>x&&x.m!==undefined).map(x=>x.m/x.max*100);return v.length?v.reduce((a,b)=>a+b,0)/v.length:0;}
async function nbSummary(s){const files=(await readDir("data/notebook")).filter(f=>f.name.startsWith(s.cls+"_"));
  if(!files.length)return `<p class="empty">No notebook entries</p>`;
  const bySub={};for(const f of files){const seg=f.name.replace(".json","").split("_");const d=await readFile("data/notebook/"+f.name);const v=d[s.id];
    if(v&&(!bySub[seg[1]]||seg[2]>bySub[seg[1]].date))bySub[seg[1]]={date:seg[2],s:v.s,r:v.r};}
  return Object.entries(bySub).map(([sub,v])=>{const done=v.s.filter(x=>x===1).length,part=v.s.filter(x=>x===2).length;
    return `<div class="st"><span>${esc(sub)}</span><span class="m">${fmtD(v.date)} · ${done}✔ ${part}➖ ${v.s.length-done-part}✖</span></div>`}).join("")||`<p class="empty">No notebook entries</p>`;}
function lineChart(vals,labels,avgs){const W=520,H=160,P=26;const vs=vals.filter(v=>v!==undefined);
  if(!vs.length)return "";const max=Math.max(...vals.map((v,i)=>v===undefined?0:v),10)*1.15;
  const pt=(i,v)=>[P+i*(W-2*P)/Math.max(vals.length-1,1),H-P-(v/max)*(H-2*P)];
  const path=vals.map((v,i)=>v===undefined?null:`${i?"L":"M"}${pt(i,v).map(n=>n.toFixed(1)).join(",")}`).filter(Boolean).join(" ");
  const apath=avgs.map((v,i)=>`${i?"L":"M"}${pt(i,v).map(n=>n.toFixed(1)).join(",")}`).join(" ");
  return `<div class="spark"><svg viewBox="0 0 ${W} ${H}" style="width:100%"><line x1="${P}" y1="${H-P}" x2="${W-P}" y2="${H-P}" stroke="var(--line)" stroke-width="2"/>
    <path d="${apath}" fill="none" stroke="var(--amber)" stroke-width="2" stroke-dasharray="5 4"/><path d="${path}" fill="none" stroke="var(--green)" stroke-width="3.5" stroke-linecap="round"/>
    ${vals.map((v,i)=>v===undefined?"":`<circle cx="${pt(i,v)[0]}" cy="${pt(i,v)[1]}" r="4.5" fill="var(--green)"><title>${labels[i]}: ${v}</title></circle>`).join("")}</svg>
    <p class="sub small" style="margin:4px 0 0">Green = student · dashed amber = class average</p></div>`;}

/* ================= ADMIN (spec §3.3) ================= */
async function vAdmin(){const el=$("view");let users=[];
  async function load(){users=(await api("GET","admin/users")).users;draw();}
  function draw(){el.innerHTML=`<h1>⚙️ Admin</h1><p class="sub">Teacher profiles, roles, class incharge & subject assignments</p>
    <div class="card"><b>Teachers</b><p></p><div class="klist">${users.map(u=>`<div class="st"><span><b>${esc(u.name)}</b> <span class="m">@${esc(u.username)}</span><br>
      <span class="pill ${u.role==="admin"?"green":u.role==="incharge"?"amber":"red"}">${u.role}</span>
      ${u.inchargeOf?`<span class="pill green">incharge ${esc(u.inchargeOf)}</span>`:""}
      ${u.assignments.map(a=>`<span class="pill">${esc(a.sub)}→${esc(a.cls)}</span>`).join(" ")}
      ${u.active?"":'<span class="pill red">deactivated</span>'}</span>
      <span class="row fixed" style="gap:6px;flex-wrap:wrap;justify-content:flex-end">
        <button class="btn sm ghost" data-e="${u.username}">Edit</button><button class="btn sm alt" data-p="${u.username}">Reset PIN</button>
        <button class="btn sm ${u.active?"danger":"alt"}" data-t="${u.username}">${u.active?"Deactivate":"Activate"}</button></span></div>`).join("")}</div>
      <p></p><button class="btn" id="newu">＋ New teacher</button></div>`;
    $("newu").onclick=()=>editUser(null);
    el.querySelectorAll("[data-e]").forEach(b=>b.onclick=()=>editUser(users.find(x=>x.username===b.dataset.e)));
    el.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{const pin=prompt("New PIN (4-8 digits) for @"+b.dataset.p);if(!pin)return;
      api("POST","admin/user",{action:"reset-pin",username:b.dataset.p,pin}).then(()=>{toast("PIN reset");load();}).catch(e=>toast(e));});
    el.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>api("POST","admin/user",{action:"toggle",username:b.dataset.t}).then(load).catch(e=>toast(e)));}
  function editUser(u){const isNew=!u;u=u||{username:"",name:"",role:"teacher",inchargeOf:"",assignments:[]};
    sheet(`<h2>${isNew?"New teacher":"Edit @"+esc(u.username)}</h2><div class="err" id="e2"></div>
      ${isNew?`<p><input id="au" placeholder="Username (a-z 0-9 _ . -)" value="${esc(u.username)}" autocapitalize="none"></p>`:""}
      <p><input id="an" placeholder="Full name" value="${esc(u.name)}"></p>
      <p><select id="ar">${["teacher","incharge","admin"].map(r=>`<option ${u.role===r?"selected":""}>${r}</option>`).join("")}</select></p>
      <p><select id="aic"><option value="">Not a class incharge</option>${CLASSES.map(c=>`<option ${u.inchargeOf===c?"selected":""}>${c}</option>`).join("")}</select></p>
      <p class="sub">Subject assignments (for non-incharge teachers):</p><div id="aas">${u.assignments.map((a,i)=>`<div class="row" style="margin-bottom:6px"><select data-i="${i}" class="acls">${CLASSES.map(c=>`<option ${a.cls===c?"selected":""}>${c}</option>`).join("")}</select><select data-i="${i}" class="asub">${SUBJECTS.map(x=>`<option ${a.sub===x?"selected":""}>${x}</option>`).join("")}</select><button class="btn sm danger fixed" data-del="${i}">✕</button></div>`).join("")}</div>
      <button class="btn sm ghost" id="aadd">＋ Add assignment</button><p></p>
      ${isNew?`<p><input id="ap" type="password" inputmode="numeric" placeholder="PIN (4-8 digits)"></p>`:""}
      <div class="row"><button class="btn" id="asv" style="flex:2">${isNew?"Create teacher":"Save changes"}</button><button class="btn ghost fixed" id="acancel">Cancel</button></div>`);
    let asg=u.assignments.slice();
    $("aadd").onclick=()=>{asg.push({cls:CLASSES[0],sub:SUBJECTS[0]});repaint();};
    function repaint(){const box=$("aas");box.innerHTML=asg.map((a,i)=>`<div class="row" style="margin-bottom:6px"><select data-i="${i}" class="acls">${CLASSES.map(c=>`<option ${a.cls===c?"selected":""}>${c}</option>`).join("")}</select><select data-i="${i}" class="asub">${SUBJECTS.map(x=>`<option ${a.sub===x?"selected":""}>${x}</option>`).join("")}</select><button class="btn sm danger fixed" data-del="${i}">✕</button></div>`).join("");
      box.querySelectorAll(".acls").forEach(s=>s.onchange=()=>asg[+s.dataset.i].cls=s.value);
      box.querySelectorAll(".asub").forEach(s=>s.onchange=()=>asg[+s.dataset.i].sub=s.value);
      box.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{asg.splice(+b.dataset.del,1);repaint();});}
    repaint();
    $("acancel").onclick=closeSheet;
    $("asv").onclick=async()=>{const body={action:isNew?"create":"update",username:isNew?$("au").value.trim().toLowerCase():u.username,
        name:$("an").value.trim(),role:$("ar").value,inchargeOf:$("aic").value,assignments:asg.filter(a=>a.cls&&a.sub)};
      if(isNew)body.pin=$("ap").value;
      try{await api("POST","admin/user",body);closeSheet();toast(isNew?"Teacher created":"Saved");load();}catch(e){$("e2").textContent=e;}};}
  await load();}

/* ================= BOOT ================= */
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
(async()=>{if(!token)return;try{const r=await api("GET","me");me=r.user;startApp();}catch{}})();
