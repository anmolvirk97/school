// ===== CONFIG: paste your Cloudflare Worker URL. Empty = demo mode (data stays in this browser) =====
const WORKER_URL = "https://school-api.anmolvirk1997.workers.dev";
const CLASSES=["7A","8B"], SUBJECTS=["Math","Science","English"];
const DEMO=[["Aarav Singh","7A"],["Riya Sharma","7A"],["Rohan Verma","7A"],["Simran Kaur","7A"],["Ananya Gupta","7A"],["Rahul Yadav","7A"],["Kabir Malik","8B"],["Meera Joshi","8B"]].map((s,i)=>({id:"s"+i,name:s[0],cls:s[1]}));
const $=id=>document.getElementById(id);let token=localStorage.tok||"",me=null,students=[],T={},marks={},letter="",pin="";

async function api(method,path,body){
 if(!WORKER_URL){ // demo storage
  if(path==="login"){return body.username?{token:"demo",user:{name:body.username,role:"admin"}}:Promise.reject("Enter username")}
  if(path==="data/students.json")return DEMO;
  if(method==="GET")return JSON.parse(localStorage["d_"+path]||"{}");
  localStorage["d_"+path]=JSON.stringify(body);return{ok:1};}
 const r=await fetch(WORKER_URL+"/"+path,{method,headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:body?JSON.stringify(body):undefined});
 const j=await r.json().catch(()=>({}));if(!r.ok)throw j.error||"Request failed";return j;}

// ----- login -----
function drawPad(){$("dots").innerHTML=[0,1,2,3,4,5].map(i=>`<i class="${i<pin.length?"f":""}"></i>`).join("");}
$("pad").innerHTML=[1,2,3,4,5,6,7,8,9,"⌫",0,"Go"].map(k=>`<button data-k="${k}">${k}</button>`).join("");
$("pad").onclick=async e=>{const k=e.target.dataset.k;if(!k)return;
 if(k==="⌫")pin=pin.slice(0,-1);else if(k==="Go"){
  try{const r=await api("POST","login",{username:$("user").value.trim(),pin});token=r.token;localStorage.tok=token;me=r.user;start();}
  catch(x){$("err").textContent=x;pin="";}}
 else if(pin.length<6)pin+=k;drawPad();};drawPad();

async function start(){
 $("login").classList.add("hide");$("app").classList.remove("hide");
 $("who").textContent=me.name;$("date").textContent=new Date().toDateString();
 students=await api("GET","data/students.json");
 $("stats").innerHTML=[["Mon","Class avg","—","Notebooks","—"],["Tue","Fine dues","—","Fee defaulters","—"],["Wed","Calls due","—","Monitors set","—"]]
  .map(s=>`<div class="stat"><div class="tag">${s[0]}<b>${new Date().getDate()}</b></div><div><small>${s[1]}</small><strong>${s[2]}</strong></div><div><small>${s[3]}</small><strong>${s[4]}</strong></div></div>`).join("");
 $("cls").innerHTML=CLASSES.map(c=>`<option>${c}</option>`).join("");$("sub").innerHTML=SUBJECTS.map(c=>`<option>${c}</option>`).join("");
 $("tdate").value=new Date().toISOString().slice(0,10);}

// ----- nav -----
function show(v){["home","marks"].forEach(x=>$(x).classList.toggle("hide",x!==v));document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));}
document.querySelector("nav").onclick=e=>{const v=e.target.dataset.v;if(!v)return;if(v==="out"){localStorage.removeItem("tok");location.reload();}else show(v);};

// ----- marks entry (alphabet flow) -----
$("go").onclick=async()=>{const max=+$("max").value;if(!$("tname").value||!max)return alert("Add a test name and max marks.");
 T={cls:$("cls").value,sub:$("sub").value,name:$("tname").value.trim(),max,date:$("tdate").value};
 T.path=`data/marks/${T.cls}_${T.sub}_${T.date}_${T.name.replace(/\W+/g,"-")}.json`;
 marks=await api("GET",T.path);letter="";$("entry").classList.remove("hide");render();};
$("find").oninput=render;
function render(){const all=students.filter(s=>s.cls===T.cls).sort((a,b)=>a.name.localeCompare(b.name));
 const done=all.filter(s=>marks[s.id]).length;$("cnt").textContent=`${done}/${all.length} entered`;$("prog").style.width=(all.length?done/all.length*100:0)+"%";
 const L="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");const has=new Set(all.map(s=>s.name[0].toUpperCase()));
 $("alpha").innerHTML=L.map(l=>`<button data-l="${l}" class="${l===letter?"on":""}" ${has.has(l)?"":"disabled"}>${l}</button>`).join("");
 const q=$("find").value.toLowerCase();
 const list=all.filter(s=>q?s.name.toLowerCase().includes(q):(!letter||s.name[0].toUpperCase()===letter));
 $("list").innerHTML=list.map(s=>`<button class="st ${marks[s.id]?"done":""}" data-id="${s.id}"><span>${s.name}</span><span>${marks[s.id]?marks[s.id].m+"/"+marks[s.id].max:""}</span></button>`).join("")||"<p class='sub'>No students found.</p>";}
$("alpha").onclick=e=>{const l=e.target.dataset.l;if(l){letter=letter===l?"":l;render();}};
$("list").onclick=e=>{const b=e.target.closest("[data-id]");if(b)open(b.dataset.id);};

function open(id){const s=students.find(x=>x.id===id),m=marks[id]||{m:"",max:T.max,r:""};
 const sh=$("sheet");sh.classList.remove("hide");
 sh.innerHTML=`<h2 style="margin:0 0 12px">${s.name}</h2>
  <div class="row" style="align-items:center"><input class="big" id="m" type="number" inputmode="decimal" value="${m.m}" placeholder="0"><b>/</b><input class="big" id="x" type="number" value="${m.max}"></div>
  <p><input id="r" placeholder="Remark (optional)" value="${m.r||""}" style="width:100%"></p>
  <div class="row"><button class="btn" id="sv" style="flex:2">Save &amp; next</button><button class="btn alt" id="sk">Skip</button></div><div class="err" id="e2"></div>`;
 $("m").focus();
 const next=()=>{const all=students.filter(x=>x.cls===T.cls).sort((a,b)=>a.name.localeCompare(b.name));
  const n=all.slice(all.findIndex(x=>x.id===id)+1).find(x=>!marks[x.id]);n?open(n.id):sh.classList.add("hide");render();};
 $("sk").onclick=next;
 $("sv").onclick=async()=>{const v=$("m").value,mx=+$("x").value;if(v===""||+v<0||+v>mx)return $("e2").textContent="Marks must be between 0 and "+mx+".";
  marks[id]={m:+v,max:mx,r:$("r").value,by:me.name,t:Date.now()};
  try{await api("PUT",T.path,marks);next();}catch(x){delete marks[id];$("e2").textContent=x;}};
 sh.onkeydown=e=>{if(e.key==="Enter")$("sv").click();if(e.key==="Escape")sh.classList.add("hide");};}

if(token&&WORKER_URL){api("GET","me").then(r=>{me=r;start();}).catch(()=>{});}
