(()=>{
const $=s=>document.querySelector(s);
const INKS=["#111111","#d14d69","#e3aebc","#dfc9ad","#8aa4a8","#737684","#9e9c9a","#856569"];
const THREADS=["#111111","#d14d69","#e3aebc","#dfc9ad","#8aa4a8","#737684","#9e9c9a","#856569"];

// 8 Couleurs d'enveloppe calquées sur la palette avec ombrages 3D
const ENV_COLORS = [
  {c:"#111111", cd:"#000000", cf:"#1a1a1a"},
  {c:"#d14d69", cd:"#b33f57", cf:"#e05a76"},
  {c:"#e3aebc", cd:"#c995a3", cf:"#edb8c6"},
  {c:"#dfc9ad", cd:"#c4af94", cf:"#ebd4b7"},
  {c:"#8aa4a8", cd:"#738c90", cf:"#99b3b8"},
  {c:"#737684", cd:"#5c5e6b", cf:"#828594"},
  {c:"#9e9c9a", cd:"#858381", cf:"#a8a6a4"},
  {c:"#856569", cd:"#6e5154", cf:"#916f73"}
];

const NOTES=[880,783.99,659.25,587.33,523.25,392];
const steps=[["letter","Lettre"],["sticker","Sticker"],["stitch","Broderie"],["tune","Mélodie"]];

const S={cur:0, ink:INKS[1], nib:8, thread:1, envCol:2, seq:Array.from({length:6},()=>Array(8).fill(0)), st:Array(441).fill(-1), strokes:[], bpm:100, date:""};

const PATTERNS = { flower: Array(441).fill(-1), bow: Array(441).fill(-1), star: Array(441).fill(-1), free: Array(441).fill(-1) };

const bowCoords = [];
[
  [3,5],[3,6], [4,4],[4,7], [5,3],[5,8], [6,3],[6,8], [7,3],[7,8], [8,4],[8,7], [9,5],[9,6],
  [6,10], [7,9],[7,11], [8,10],
  [3,14],[3,15], [4,13],[4,16], [5,12],[5,17], [6,12],[6,17], [7,12],[7,17], [8,13],[8,16], [9,14],[9,15],
  [10,4], [11,3],[11,4], [12,5], [13,6],[13,7], [14,8],
  [10,16], [11,16],[11,17], [12,15], [13,13],[13,14], [14,12]
].forEach(([r,c]) => bowCoords.push(r*21 + c));
bowCoords.forEach(i => PATTERNS.bow[i] = 1); // Fil rose/rouge

const flwCoords = [];
[
  [2,9],[2,10],[2,11], [3,8],[3,9],[3,10],[3,11],[3,12], [4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13], [5,8],[5,9],[5,10],[5,11],[5,12],
  [6,6],[6,7],[6,8], [7,6],[7,7], [8,6],[8,7], [9,7],
  [6,12],[6,13],[6,14], [7,13],[7,14], [8,13],[8,14], [9,13],
  [6,10], [7,9],[7,10],[7,11], [8,10],
  [9,10], [10,10], [11,10], [12,10], [13,10], [14,10], [15,10], [16,10], [17,10], [18,10],
  [10,5],[10,6], [11,4],[11,5],[11,6], [12,5],[12,6],[12,7], [13,6],[13,7],[13,8], [14,7],[14,8],[14,9], [15,7],[15,8], [16,8],
  [10,14],[10,15], [11,13],[11,14],[11,15], [12,12],[12,13],[12,14], [13,11],[13,12],[13,13], [14,11],[14,12], [15,11],
  [15,13],[15,14], [16,12],[16,13], [17,11],[17,12]
].forEach(([r,c]) => flwCoords.push(r*21 + c));
flwCoords.forEach(i => PATTERNS.flower[i] = 0); // Fil noir

const starCoords = [];
[
  [3,10],
  [4,9],[4,10],[4,11],
  [5,8],[5,9],[5,10],[5,11],[5,12],
  [6,3],[6,4],[6,5],[6,6],[6,7],[6,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[6,15],[6,16],[6,17],
  [7,4],[7,5],[7,6],[7,7],[7,8],[7,9],[7,10],[7,11],[7,12],[7,13],[7,14],[7,15],[7,16],
  [8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[8,15],
  [9,6],[9,7],[9,8],[9,9],[9,10],[9,11],[9,12],[9,13],[9,14],
  [10,7],[10,8],[10,9],[10,10],[10,11],[10,12],[10,13],
  [11,6],[11,7],[11,8],[11,9], [11,11],[11,12],[11,13],[11,14],
  [12,5],[12,6],[12,7],[12,8], [12,12],[12,13],[12,14],[12,15],
  [13,4],[13,5],[13,6], [13,14],[13,15],[13,16],
  [14,3],[14,4], [14,16],[14,17]
].forEach(([r,c]) => starCoords.push(r*21 + c));
starCoords.forEach(i => PATTERNS.star[i] = 3); // Fil beige doré

const tabs=$("#tabs");
steps.forEach(([id,l],i)=>{
  const b=document.createElement("button");b.type="button";b.className="tab";b.innerHTML=l;
  b.onclick=()=>{S.cur=i; updateTabs();}; tabs.append(b);
});

function updateTabs(){
  steps.forEach(([id],k)=>{
    $("#p-"+id).hidden=k!==S.cur;
    tabs.children[k].setAttribute("aria-selected", k===S.cur);
  });

  const nextBtn = $("#next");
  if(S.cur === steps.length-1) {
    nextBtn.textContent = "Sceller l'enveloppe →";
  } else {
    nextBtn.textContent = "Suivant →";
  }
}

$("#next").onclick=()=>{ if(S.cur<steps.length-1){S.cur++; updateTabs();} else {seal();} };
$("#unlockDate").onchange = (e) => { S.date = e.target.value; };

// Setup Envelope Color Picker
ENV_COLORS.forEach((col, i) => {
  const b = document.createElement("button"); b.type = "button"; b.className = "env-sw"; b.style.background = col.c;
  b.onclick = () => { S.envCol = i; updateEnvColors(); };
  $("#envColors").append(b);
});

function updateEnvColors() {
  [...$("#envColors").children].forEach((b, i) => b.setAttribute("aria-pressed", i === S.envCol));
  const ec = ENV_COLORS[S.envCol];
  document.documentElement.style.setProperty("--env-c", ec.c);
  document.documentElement.style.setProperty("--env-cd", ec.cd);
  document.documentElement.style.setProperty("--env-cf", ec.cf);
}
updateEnvColors();

function palette(el,list,get,set){
  list.forEach((c,i)=>{
    const b=document.createElement("button");b.type="button";b.className="sw";b.style.background=c;
    b.onclick=()=>{set(i); [...el.children].forEach(x=>x.setAttribute("aria-pressed",x===b))};
    b.setAttribute("aria-pressed",get(i)); el.append(b);
  });
}
palette($("#inks"),INKS, i=>INKS[i]===S.ink, i=>S.ink=INKS[i]);
palette($("#threads"),THREADS, i=>i===S.thread, i=>S.thread=i);

document.querySelectorAll(".nib").forEach(b => {
  b.onclick = () => {
    S.nib = parseInt(b.dataset.w);
    document.querySelectorAll(".nib").forEach(x => x.setAttribute("aria-pressed", x===b));
  };
});

const cv=$("#draw"),cx=cv.getContext("2d");
function redraw(){
  cx.clearRect(0,0,240,240); cx.lineCap=cx.lineJoin="round";
  S.strokes.forEach(s=>{
    cx.strokeStyle=s.c; cx.lineWidth=s.w; cx.beginPath();
    s.p.forEach(([x,y],i)=>i?cx.lineTo(x,y):cx.moveTo(x,y));
    if(s.p.length===1) cx.lineTo(s.p[0][0]+.1,s.p[0][1]);
    cx.stroke();
  });
}
let cur=null;
const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*240/r.width,(e.clientY-r.top)*240/r.height]};
cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);cur={c:S.ink,w:S.nib,p:[pt(e)]};S.strokes.push(cur);redraw()};
cv.onpointermove=e=>{if(!cur)return;cur.p.push(pt(e));redraw()};
cv.onpointerup=cv.onpointercancel=()=>{cur=null;};
$("#undo").onclick=()=>{S.strokes.pop();redraw();};

const stg=$("#stitch");
for(let i=0;i<441;i++){const b=document.createElement("b");b.dataset.i=i;stg.append(b);}
function renderSt(){
  [...stg.children].forEach((b,i)=>{
    const v=S.st[i]; b.className=v>=0?"on":""; b.style.color=v>=0?THREADS[v]:"";
  });
}
let down=false,mode=null;
stg.onpointerdown=e=>{const b=e.target.closest("b");if(!b)return;down=true;stg.setPointerCapture(e.pointerId);const i=+b.dataset.i;mode=S.st[i]===S.thread?"erase":"paint";apply(i)};
stg.onpointermove=e=>{if(!down)return;const el=document.elementFromPoint(e.clientX,e.clientY);const b=el&&el.closest&&el.closest("#stitch b");if(b)apply(+b.dataset.i)};
stg.onpointerup=stg.onpointercancel=()=>down=false;
function apply(i){if(mode==="erase")S.st[i]=-1; else S.st[i]=S.thread; renderSt();}
$("#stClear").onclick=()=>{S.st.fill(-1);renderSt();};

document.querySelectorAll(".pattern-btn").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll(".pattern-btn").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    const p = b.dataset.pat;
    S.st = [...PATTERNS[p]];
    renderSt();
  };
});

const sq=$("#seq");
for(let r=0;r<6;r++)for(let c=0;c<8;c++){const b=document.createElement("b");b.dataset.r=r;b.dataset.c=c;sq.append(b)}
sq.onclick=e=>{const b=e.target.closest("b");if(!b)return;const r=+b.dataset.r,c=+b.dataset.c;S.seq[r][c]^=1;b.classList.toggle("on",!!S.seq[r][c]);if(S.seq[r][c])ping(NOTES[r]);};
$("#seqClear").onclick=()=>{S.seq.forEach(r=>r.fill(0));[...sq.children].forEach(b=>b.className="");};
$("#bpm").oninput=e=>{S.bpm=+e.target.value;};

let ac=null;
function ctx(){if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(A)ac=new A()}if(ac&&ac.state==="suspended")ac.resume();return ac}
function ping(f,t){
  const a=ctx();if(!a)return;t=t||a.currentTime;
  const o1=a.createOscillator(), g1=a.createGain(); o1.type="sine"; o1.frequency.value=f;
  g1.gain.setValueAtTime(0,t); g1.gain.linearRampToValueAtTime(0.6,t+0.01); g1.gain.exponentialRampToValueAtTime(0.001,t+1.5);
  o1.connect(g1).connect(a.destination); o1.start(t); o1.stop(t+2);
  const o2=a.createOscillator(), g2=a.createGain(); o2.type="triangle"; o2.frequency.value=f*2.05;
  g2.gain.setValueAtTime(0,t); g2.gain.linearRampToValueAtTime(0.3,t+0.005); g2.gain.exponentialRampToValueAtTime(0.001,t+0.2);
  o2.connect(g2).connect(a.destination); o2.start(t); o2.stop(t+0.5);
}

let timer=null;
function playSeq(seq,bpm,cells,btn,loops){stopSeq(btn);const a=ctx();if(!a)return;let step=0,n=0;if(btn){btn.textContent="Stop";btn.dataset.on="1";}
  const tick=()=>{cells&&[...cells].forEach(b=>b.classList.toggle("now",+b.dataset.c===step));
    for(let r=0;r<6;r++)if(seq[r][step])ping(NOTES[r]);
    step=(step+1)%8;if(step===0&&++n>=loops){clearInterval(timer);timer=null;setTimeout(()=>stopSeq(btn),60000/bpm/2)}};
  tick();timer=setInterval(tick,60000/bpm/2)}
function stopSeq(btn){if(timer){clearInterval(timer);timer=null}document.querySelectorAll(".seq b.now").forEach(b=>b.classList.remove("now"));if(btn){btn.textContent=btn.dataset.label||"Écouter";btn.dataset.on=""}}
$("#play").dataset.label="Écouter";
$("#play").onclick=e=>{const b=e.currentTarget;b.dataset.on?stopSeq(b):playSeq(S.seq,S.bpm,sq.children,b,99)};

const b64=u8=>{let s="";for(let i=0;i<u8.length;i++)s+=String.fromCharCode(u8[i]);return btoa(s)};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function pack(o){
  const raw=new TextEncoder().encode(JSON.stringify(o));
  if(window.CompressionStream){const cs=new Blob([raw]).stream().pipeThrough(new CompressionStream("gzip"));return"C1."+b64(new Uint8Array(await new Response(cs).arrayBuffer()))}
  return"C0."+b64(raw)
}
async function unpack(s){
  s=s.trim(); if(s.includes('?c=')) s = s.split('?c=')[1]; if(s.includes('#')) s = s.split('#')[0];
  s = decodeURIComponent(s);
  const k=s.slice(0,3),body=s.slice(3).replace(/\s/g,"");let raw=unb64(body);
  if(k==="C1."){const ds=new Blob([raw]).stream().pipeThrough(new DecompressionStream("gzip"));raw=new Uint8Array(await new Response(ds).arrayBuffer())}else if(k!=="C0.")throw 0;
  return JSON.parse(new TextDecoder().decode(raw))
}

function collect(){return{v:1,to:$("#to").value.trim(),from:$("#from").value.trim(),letter:$("#letter").value,sticker:S.strokes.length?S.strokes:null,stitch:S.st,seq:S.seq,bpm:S.bpm, env:S.envCol, date:$("#unlockDate").value};}

let countdownInterval = null;

function render(d, el){
  if(countdownInterval) clearInterval(countdownInterval);

  if (d.env !== undefined && ENV_COLORS[d.env]) {
    const ec = ENV_COLORS[d.env];
    document.documentElement.style.setProperty("--env-c", ec.c);
    document.documentElement.style.setProperty("--env-cd", ec.cd);
    document.documentElement.style.setProperty("--env-cf", ec.cf);
  }

  if (d.date) {
      const target = new Date(d.date).getTime();
      if (target > Date.now()) {
          el.innerHTML = `<article class="capsule-view" style="align-items:center; text-align:center;">
              <div style="font-size:3rem">⏳</div>
              <h2 style="color:var(--ink); font-family:var(--display); margin:0;">Patience...</h2>
              <p style="color:var(--text-muted);">Cette enveloppe est verrouillée par le temps.</p>
              <div id="cd" class="cd-timer"></div>
          </article>`;
          const cd = el.querySelector("#cd");
          countdownInterval = setInterval(() => {
              const diff = target - Date.now();
              if (diff <= 0) { clearInterval(countdownInterval); render(d, el); }
              else {
                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                  const hrs = Math.floor((diff / (1000 * 60 * 60)) % 24);
                  const mins = Math.floor((diff / 1000 / 60) % 60);
                  const secs = Math.floor((diff / 1000) % 60);
                  cd.textContent = `${days}j ${hrs}h ${mins}m ${secs}s`;
              }
          }, 1000);
          return;
      }
  }

  const st=(d.stitch||[]).some(v=>v>=0)?'<div class="grid stitch ro" style="grid-template-columns:repeat(21,1fr); width:180px;">'+d.stitch.map(v=>'<b'+(v>=0?' class="on" style="color:'+(THREADS[v]||"#c93a73")+'"':'')+'></b>').join("")+'</div>':"";
  let imgHTML = d.sticker ? `<canvas id="rendercv" width="240" height="240" style="width:180px;background:transparent;"></canvas>` : "";

  el.innerHTML=`<article class="capsule-view">`+
   (d.to?`<div class="to">Pour ${d.to}</div>`:"")+
   (d.letter?`<div class="text">${d.letter}</div>`:"")+
   (d.from?`<div class="from">De ${d.from}</div>`:"")+
   ((imgHTML||st)?`<div class="items">${imgHTML}${st}</div>`:"")+
   `</article>`;

  if(d.sticker && Array.isArray(d.sticker)){
    const rcv = el.querySelector('#rendercv');
    if(rcv){
      const rcx = rcv.getContext('2d'); rcx.lineCap=rcx.lineJoin="round";
      d.sticker.forEach(s=>{
        rcx.strokeStyle=s.c; rcx.lineWidth=s.w; rcx.beginPath();
        s.p.forEach(([x,y],i)=>i?rcx.lineTo(x,y):rcx.moveTo(x,y));
        if(s.p.length===1)rcx.lineTo(s.p[0][0]+.1,s.p[0][1]);
        rcx.stroke();
      });
    }
  }
}

function show(which){
  stopSeq($("#play"));
  ["create","seal","envelope-screen","view"].forEach(k=>{
    const e=$("#"+k); if(e) e.hidden = k!==which;
  });
  if(which==="view" || which==="envelope-screen") { $("#main-header").hidden=true; }
  else { $("#main-header").hidden=false; }
}

async function seal(){
  const d=collect(); show("seal");
  const code = await pack(d);
  const link = window.location.href.split('?')[0].split('#')[0] + "?c=" + encodeURIComponent(code);
  $("#hidden-link").value = link;
  $("#toast").textContent="";
}

$("#edit").onclick=()=>show("create");

$("#copy").onclick=async()=>{
  const t=$("#hidden-link").value;
  try{ await navigator.clipboard.writeText(t); $("#toast").textContent="Lien copié."; }
  catch(e){ $("#hidden-link").style.opacity=1; $("#hidden-link").select(); $("#toast").textContent="Lien copié."; }
};

async function triggerOpen(code) {
  try{
    const d=await unpack(code);

    if (d.env !== undefined && ENV_COLORS[d.env]) {
      const ec = ENV_COLORS[d.env];
      document.documentElement.style.setProperty("--env-c", ec.c);
      document.documentElement.style.setProperty("--env-cd", ec.cd);
      document.documentElement.style.setProperty("--env-cf", ec.cf);
    }

    show("envelope-screen");
    const env = $("#the-envelope");
    env.onclick = () => {
      env.classList.add("open");
      env.parentElement.classList.add("fade-out");
      setTimeout(() => {
        render(d,$("#view"));
        show("view");
        const isLocked = d.date && (new Date(d.date).getTime() > Date.now());
        if (!isLocked) {
            const hasSeq=(d.seq||[]).some(r=>r.some(Boolean));
            if(hasSeq) { playSeq(d.seq, d.bpm||100, null, null, 2); }
        }
      }, 1300);
    };
  }catch(e){
    alert("Ce lien est invalide.");
  }
}

(async () => {
  updateTabs(); renderSt();
  const urlParams = new URLSearchParams(window.location.search);
  const capsuleCode = urlParams.get('c');
  if (capsuleCode) {
    window.history.replaceState({}, document.title, window.location.pathname);
    triggerOpen(capsuleCode);
  } else {
    show("create");
  }
})();
})();