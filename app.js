const $=s=>document.querySelector(s);
const TABS=[["trench","Trenches"],["trend","Trending"],["safe","Trusted"],["whale","Whales"],["snipe","Snipers"],["wallets","My wallets"],["import","Import wallets"]];
const S={tab:"trench",q:"",minLiq:5000,hide:true,sort:{k:"v1",d:-1},W:JSON.parse(localStorage.getItem("tl.w")||"[]"),WD:{},recN:0};
const saveW=()=>localStorage.setItem("tl.w",JSON.stringify(S.W));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const usd=n=>{n=+n||0;return n>=1e9?"$"+(n/1e9).toFixed(2)+"B":n>=1e6?"$"+(n/1e6).toFixed(2)+"M":n>=1e3?"$"+(n/1e3).toFixed(1)+"K":"$"+n.toFixed(0)};
const pc=n=>n==null?'<span class="mu">–</span>':`<span class="${n>=0?"up":"dn"}">${n>=0?"+":""}${(+n).toFixed(1)}%</span>`;
const ago=ms=>{const m=(Date.now()-ms)/6e4;return m<1?"<1m":m<60?Math.round(m)+"m":m<1440?Math.round(m/60)+"h":Math.round(m/1440)+"d"};
const sh=a=>a.slice(0,4)+"…"+a.slice(-4);
const toast=t=>{const e=$("#toast");e.textContent=t;e.classList.add("on");setTimeout(()=>e.classList.remove("on"),1500)};
const rk=r=>`<span class="rk ${r>=70?"g":r>=40?"y":"r"}">${r}</span>`;
const av=t=>t.img?`<img class="av" src="${esc(t.img)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:`<div class="av">${esc((t.sym||"?")[0])}</div>`;
const buy=t=>`<a class="btn buy" href="https://gmgn.ai/sol/token/${esc(t.addr)}" target="_blank" rel="noopener">Buy</a>`;
const isCurve=t=>t.dex==="pumpfun";
const migrated=t=>t.dex==="pumpswap"||(t.pump&&!isCurve(t));

function list(){
  const q=S.q.toLowerCase();
  return[...TL.coins.values()].filter(t=>t.liq>=S.minLiq&&(!S.hide||t.r>=40)&&(!q||(t.sym+t.name+t.addr).toLowerCase().includes(q)));
}
const bar=()=>`<div class="bar"><select id="ml" aria-label="Min liquidity">${[[0,"Any liq"],[5000,"$5K+ liq"],[20000,"$20K+ liq"],[50000,"$50K+ liq"]].map(([v,l])=>`<option value="${v}" ${v==S.minLiq?"selected":""}>${l}</option>`).join("")}</select><label><input type="checkbox" id="hr" ${S.hide?"checked":""}> Hide likely rugs</label><span class="mu">${TL.coins.size} coins loaded</span></div>`;

/* Trenches: pump.fun style 3 columns */
function pcard(t,bar){
  const p=Math.min(100,t.mc/69000*100);
  return `<div class="pc">${av(t)}<div><span class="sy">${esc(t.sym)}</span> <span class="mu">${ago(t.created)}</span></div><div>${rk(t.r)} ${buy(t)}</div>
  <div class="m"><span>MC <b>${usd(t.mc)}</b></span><span>V <b>${usd(t.v1)}</b></span><span>Tx <b>${t.b1+t.s1}</b></span>${bar?`<span class="pg" title="Estimated bonding curve progress"><i style="width:${p}%"></i></span><b>${Math.round(p)}%</b>`:`<span>${pc(t.c1)}</span>`}</div></div>`;
}
function trench(){
  const L=list(),by=(f,s)=>L.filter(f).sort(s).slice(0,40);
  const cols=[["New pairs",by(t=>Date.now()-t.created<36e5,(a,b)=>b.created-a.created),0],["Final stretch",by(t=>isCurve(t)&&t.mc>=15000,(a,b)=>b.mc-a.mc),1],["Migrated",by(t=>migrated(t)&&Date.now()-t.created<864e5,(a,b)=>b.created-a.created),0]];
  return bar()+`<div class="cols">${cols.map(([n,l,b])=>`<section class="col"><h3>${n}<span class="mu">${l.length}</span></h3><div class="cl">${l.map(t=>pcard(t,b)).join("")||'<div class="empty">Nothing yet. Turn off the rug filter or lower liquidity.</div>'}</div></section>`).join("")}</div>`;
}

/* Tables */
const C={
 tok:["Token",t=>`<div class="tk">${av(t)}<div><div class="sy">${esc(t.sym)}</div><div class="nm"><a href="${esc(t.url)}" target="_blank" rel="noopener" data-copy="${esc(t.addr)}">${sh(t.addr)}</a></div></div></div>`,t=>t.sym],
 age:["Age",t=>ago(t.created),t=>-t.created],liq:["Liq",t=>usd(t.liq),t=>t.liq],mc:["MC",t=>usd(t.mc),t=>t.mc],
 v1:["Vol 1h",t=>usd(t.v1),t=>t.v1],v5:["Vol 5m",t=>usd(t.v5),t=>t.v5],tx:["Txns 1h",t=>`${t.b1}/${t.s1}`,t=>t.b1+t.s1],
 c5:["5m",t=>pc(t.c5),t=>t.c5||0],c1:["1h",t=>pc(t.c1),t=>t.c1||0],c24:["24h",t=>pc(t.c24),t=>t.c24||0],
 r:["Risk",t=>rk(t.r),t=>t.r],buy:["",buy,null],
 avg:["Avg trade",t=>usd(avg(t)),avg],bs:["Buy share",t=>Math.round(t.b1/((t.b1+t.s1)||1)*100)+"%",t=>t.b1/((t.b1+t.s1)||1)],
 b5:["Buys 5m",t=>t.b5,t=>t.b5],s5:["Sells 5m",t=>t.s5,t=>t.s5]
};
function avg(t){return t.v1/((t.b1+t.s1)||1)}
function table(keys,rows,empty){
  const s=S.sort,col=C[s.k]&&C[s.k][2]?C[s.k][2]:null;
  if(col)rows=rows.slice().sort((a,b)=>{const x=col(a),y=col(b);return(x>y?1:x<y?-1:0)*s.d});
  return bar()+`<div class="tw"><table><thead><tr>${keys.map(k=>`<th data-sort="${k}">${C[k][0]}${s.k===k?(s.d<0?" ▾":" ▴"):""}</th>`).join("")}</tr></thead><tbody>${rows.slice(0,150).map(t=>`<tr>${keys.map(k=>`<td>${C[k][1](t)}</td>`).join("")}</tr>`).join("")||`<tr><td colspan="${keys.length}" class="empty">${empty}</td></tr>`}</tbody></table></div>`;
}
const V={
 trench,
 trend:()=>table(["tok","age","liq","mc","v1","tx","c5","c1","c24","r","buy"],list().filter(t=>t.v1>0),"No coins match."),
 safe:()=>table(["tok","age","liq","mc","v1","c1","c24","r","buy"],list().filter(t=>t.r>=70),"No coins reach the lower-risk bar yet."),
 whale:()=>`<div class="note">Whale flow ranks coins by average trade size over the last hour. Big averages suggest large wallets are active. Open the chart to see which ones.</div>`+table(["tok","age","mc","v1","avg","bs","c1","r","buy"],list().filter(t=>avg(t)>=300&&t.b1+t.s1>=5),"No large-ticket activity right now."),
 snipe:()=>`<div class="note">Pairs under two hours old ranked by buys in the last 5 minutes. Lots of early buys and few sells can mean snipers are holding, or that bots are faking volume. Check the risk score.</div>`+table(["tok","age","mc","b5","s5","v5","c5","r","buy"],list().filter(t=>Date.now()-t.created<72e5),"No fresh launches match."),
 wallets:()=>`<form class="f" id="wf"><input id="wa" placeholder="Solana wallet address" aria-label="Wallet address" required><input id="wl" placeholder="Label" aria-label="Label" style="max-width:200px;flex:none"><button class="btn buy">Track</button><button type="button" class="btn" id="wr">Refresh</button></form>`+
  (S.W.length?`<div class="tw"><table><thead><tr><th>Wallet</th><th>SOL</th><th>Last activity</th><th>Recent txs</th><th></th></tr></thead><tbody>${S.W.map(w=>{const d=S.WD[w.addr];return`<tr><td><div class="sy">${esc(w.label)}</div><div class="nm">${sh(w.addr)}</div></td><td>${d?.ok?d.sol.toFixed(3):"…"}</td><td>${d?.ok&&d.sigs[0]?.blockTime?ago(d.sigs[0].blockTime*1000):"–"}</td><td>${d?.ok?d.sigs.slice(0,3).map(s=>`<a class="btn" href="https://solscan.io/tx/${esc(s.signature)}" target="_blank" rel="noopener">${sh(s.signature)}</a>`).join(" "):d?"RPC busy":"…"}</td><td><a class="btn" href="https://gmgn.ai/sol/address/${esc(w.addr)}" target="_blank" rel="noopener">GMGN</a> <button class="btn" data-rm="${esc(w.addr)}">Remove</button></td></tr>`}).join("")}</tbody></table></div>`:`<div class="empty">No wallets tracked. Paste an address above or use Import wallets to add many at once.</div>`),
 import:()=>`<div class="note">Paste wallet addresses, one per line or separated by commas. Add a label after an address if you like (<code>address, My label</code>). Up to 500 wallets. Everything stays in your browser.</div><textarea id="ta" rows="10" placeholder="Paste Solana wallet addresses here" aria-label="Wallet addresses"></textarea><div class="bar" style="margin-top:10px"><button class="btn buy" id="ib">Import wallets</button><label class="btn">Upload .txt or .csv<input type="file" id="fi" accept=".txt,.csv" hidden></label><button class="btn" id="ex">Export my wallets</button><button class="btn" id="cl">Remove all</button></div>`
};

/* Wallets */
const B58=/^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const rpc=(m,p)=>fetch("https://api.mainnet-beta.solana.com",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:m,params:p})}).then(r=>r.json()).then(r=>r.result);
let wq=[],wr=0;
function refW(a){if(!wq.includes(a))wq.push(a);wpump()}
function wpump(){while(wr<2&&wq.length){const a=wq.shift();wr++;fetchW(a).finally(()=>setTimeout(()=>{wr--;wpump()},300))}}
async function fetchW(a){try{const[b,g]=await Promise.all([rpc("getBalance",[a]),rpc("getSignaturesForAddress",[a,{limit:5}])]);S.WD[a]=b==null?{ok:false}:{ok:true,sol:(b.value||0)/1e9,sigs:g||[]}}catch{S.WD[a]={ok:false}}if(S.tab==="wallets")draw()}
function parseW(txt){const out=[];txt.split(/\r?\n/).forEach(l=>{const tk=l.split(/[,\t;]+|\s+/).filter(Boolean),ad=tk.filter(x=>B58.test(x)),lb=ad.length===1?tk.filter(x=>x!==ad[0]).join(" "):"";ad.forEach(a=>out.push({addr:a,label:lb||"Wallet "+sh(a)}))});return out}
function addW(list){let n=0,d=0;list.forEach(w=>{if(S.W.some(x=>x.addr===w.addr))d++;else if(S.W.length<500){S.W.push(w);n++}});saveW();toast("Added "+n+(d?", "+d+" already tracked":""));return n}

/* Render */
let raf=0;const draw=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(render)};
function render(){
  $("#side").innerHTML=`<div class="logo">🪼 Trenchling</div>`+TABS.map(([k,l])=>`<button data-tab="${k}" ${k===S.tab?'aria-current="true"':""}>${l}${k==="wallets"&&S.W.length?" ("+S.W.length+")":""}</button>`).join("");
  const a=$("#app"),sc=window.scrollY;a.innerHTML=!TL.coins.size&&!["wallets","import"].includes(S.tab)?'<div class="empty">Loading coins…</div>':V[S.tab]();
  window.scrollTo(0,sc);
  const top=[...TL.coins.values()].filter(t=>t.liq>=20000&&t.c1!=null).sort((a,b)=>b.c1-a.c1).slice(0,10);
  $("#tick").innerHTML=top.map(t=>`<span><b>${esc(t.sym)}</b>${pc(t.c1)}</span>`).join("");
}
function go(){$("#st").textContent="Updating…";loadAll(()=>{$("#st").textContent=TL.coins.size+" coins · "+new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});if(!["wallets","import"].includes(S.tab)&&document.activeElement.id!=="q")draw()})}
document.addEventListener("click",e=>{const t=e.target.closest("[data-tab],[data-sort],[data-copy],[data-rm],[data-track],#wr,#ib,#ex,#cl");if(!t)return;
  const d=t.dataset;
  if(d.tab){S.tab=d.tab;S.sort={k:{trend:"v1",safe:"r",whale:"avg",snipe:"b5"}[d.tab]||"v1",d:-1};window.scrollTo(0,0);draw();if(d.tab==="wallets")S.W.filter(w=>!S.WD[w.addr]?.ok).slice(0,60).forEach(w=>refW(w.addr))}
  else if(d.sort){S.sort={k:d.sort,d:S.sort.k===d.sort?-S.sort.d:-1};draw()}
  else if(d.copy){navigator.clipboard?.writeText(d.copy);toast("Address copied")}
  else if(d.rm){S.W=S.W.filter(w=>w.addr!==d.rm);saveW();draw()}
  else if(t.id==="wr")S.W.slice(0,60).forEach(w=>refW(w.addr))
  else if(t.id==="ib"){const l=parseW($("#ta").value);if(!l.length)return toast("No valid addresses found");addW(l);S.tab="wallets";draw();S.W.filter(w=>!S.WD[w.addr]?.ok).slice(0,60).forEach(w=>refW(w.addr))}
  else if(t.id==="ex"){if(!S.W.length)return toast("Nothing to export");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([S.W.map(w=>w.addr+", "+w.label).join("\n")],{type:"text/plain"}));a.download="trenchling-wallets.txt";a.click()}
  else if(t.id==="cl"){if(S.W.length&&confirm("Remove all "+S.W.length+" tracked wallets?")){S.W=[];S.WD={};saveW();toast("Removed all")}}});
document.addEventListener("input",e=>{if(e.target.id==="q"){S.q=e.target.value;draw()}if(e.target.id==="hr"){S.hide=e.target.checked;draw()}});
document.addEventListener("change",e=>{if(e.target.id==="fi"){const f=e.target.files[0];if(f)f.text().then(t=>{$("#ta").value=t;toast("File loaded. Press Import wallets")})}if(e.target.id==="ml"){S.minLiq=+e.target.value;draw()}});
document.addEventListener("submit",e=>{if(e.target.id!=="wf")return;e.preventDefault();const a=$("#wa").value.trim(),l=$("#wl").value.trim();
  if(!B58.test(a))return toast("Not a valid Solana address");if(S.W.some(w=>w.addr===a))return toast("Already tracking");
  S.W.push({addr:a,label:l||"Wallet "+sh(a)});saveW();refW(a);draw()});
loadCache();render();go();setInterval(go,60000);
