/* 監造查驗 — what is inspected (version B, 2026-10-12; user: 「查驗項目介紹好了(但現在只有助導航跟工區三)」「細節看照片不要看表」,
   then 「數值都寫標準值就好，數值去看細部設計報告的規範」: the values are the standards of the detailed-design specification / drawings;
   then 「封閉燈不用，照片你挑」「我加入材料取樣(抽樣)及實驗室會驗的照片，請加入」「分為「施工查驗」和「材料取樣與試驗」」;
   then 「實驗室會驗的照片你沒加入」「一次側的管是上2下2」「警示帶是在CLSM回填與覆土之間」「PAPI拿掉」;
   then 「查驗這個站，幫我區分成工區一~四，目前只有工區三，所以其他三工區就寫待補充」: zone tabs 1–4, zone 3 open, the others 待補充).
   Data: window.INSPI from work/web_site_20261009/prep_insp_items.py — items (kind field = 施工查驗, lab = 材料取樣與試驗),
   standard values with their source, and the picked photos (lab photos carry a role: take = 現場取樣, lab = 實驗室會驗; an item with
   both shows them side by side). Zone 3: the pavement builds up layer by layer (click a layer), each layer's cards in two groups;
   navaids: two tabs. The trench / handhole sketches only use numbers from drawings E-40 / E-41 and the user's notes (schematic). */
(function(){
'use strict';
const {h,el,$,$$,svgText:T,tween,ease}=G;const S=window.SITE;
const Z3=[{k:'soil',n:'原土層',sub:'開挖到設計深度、整平',c:'#8a6a4a'},{k:'agg',n:'碎石級配',sub:'第一層底層',c:'#7a6650'},
          {k:'ctb',n:'水泥處理級配',sub:'第二層底層',c:'#a8987a'},{k:'ac',n:'瀝青混凝土',sub:'面層',c:'#2b2f35'}];
const NAV=[{k:'duct1',n:'一次側管道',sub:'手孔與手孔之間'},{k:'duct2',n:'二次側管道',sub:'手孔到邊燈'}];
const ZN=[1,2,3,4],CN={1:'一',2:'二',3:'三',4:'四'};
const GRP=[{k:'field',n:'施工查驗',sub:'現場量測、檢查'},{k:'lab',n:'材料取樣與試驗',sub:'現場取樣，送實驗室會驗'}];
const ROLE={take:'現場取樣',lab:'實驗室會驗'};
function photos(it){   // field: one photo + a small inset; sampling with an in-lab photo: the two side by side, tagged
  const duo=it.photos.some(p=>p.role==='lab'),tag=p=>p.role?`<i class="iq-tag ${p.role}">${ROLE[p.role]}</i>`:'';
  if(duo)return `<div class="iq-ph duo">${it.photos.map((p,j)=>`<div class="iq-cell"><img src="${p.src}" alt="" loading="lazy" data-j="${j}">${tag(p)}</div>`).join('')}</div>`;
  return `<div class="iq-ph">${it.photos.map((p,j)=>`<img src="${p.src}" alt="" loading="lazy" data-j="${j}" class="${j?'sm':''}">`).join('')}${it.photos[0]?tag(it.photos[0]):''}</div>`}
function cards(host,items,label,d0=0){
  host.innerHTML=items.map((it,i)=>`<article class="iq-card" style="animation-delay:${(d0+i)*70}ms">${photos(it)}
    <div class="iq-tx"><b>${it.name}</b>${it.val?`<em>${it.val}</em>`:''}</div></article>`).join('');   // only standard values: the photos' own notes (measured values) are not shown
  $$('.iq-card',host).forEach((c,i)=>$$('img',c).forEach(im=>im.onclick=()=>{const p=items[i].photos[+im.dataset.j];G.lightbox(p.src,`${label}・${items[i].name}${p.role?`（${ROLE[p.role]}）`:''}　照片 ${p.roc}`)}))}
// zone 3: the excavation and the layers filling it (thicknesses from SITE.zones[3].section, depth = their sum, as drawing E-41);
// the pit sits flush right, against the existing runway (user 2026-10-12: 「示意不要放中間，靠右貼著放」), the depth on its left
function stack(svg,on){
  const sec=S.zones[3].section,PX=4,top=56,W=372,X0=142,X1=W,thick={agg:sec[0].cm,ctb:sec[1].cm,ac:sec[2].cm},depth=sec.reduce((a,l)=>a+l.cm,0),bot=top+depth*PX;
  svg.setAttribute('viewBox',`0 0 ${W} ${bot+40}`);
  el('rect',{x:0,y:top,width:W,height:bot+40-top,fill:'#3b2f22'},svg);el('rect',{x:0,y:top-6,width:X0,height:6,fill:'#3d5a2a'},svg);el('rect',{x:X1,y:top-6,width:W-X1,height:6,fill:'#3d5a2a'},svg);
  el('rect',{x:X0,y:top,width:X1-X0,height:bot-top,fill:'#0b1016'},svg);                       // the pit
  T(svg,(X0+X1)/2,top-16,'跑道兩側擴建　路面',{'text-anchor':'middle',fill:'#c8d2dc','font-size':14});
  const g={};let y=bot;
  [['agg',thick.agg],['ctb',thick.ctb],['ac',thick.ac]].forEach(([k,cm])=>{const z=Z3.find(q=>q.k===k),hh=cm*PX;y-=hh;const yy=y;
    const gg=el('g',{class:'iq-l','data-k':k},svg);const r=el('rect',{x:X0,y:yy+hh,width:X1-X0,height:0,fill:z.c,stroke:k==='ac'?'#5d646c':'rgba(0,0,0,.35)'},gg);
    const t=T(gg,(X0+X1)/2,yy+hh/2+5,`${z.n}　${cm} cm`,{'text-anchor':'middle',fill:k==='ctb'?'#111':'#fff','font-size':14,opacity:0});
    g[k]={gg,r,t,yy,hh}});
  const soil=el('g',{class:'iq-l','data-k':'soil'},svg);el('rect',{x:X0,y:bot,width:X1-X0,height:30,fill:'#8a6a4a',opacity:.0},soil);
  const dl=el('g',{opacity:0},svg);el('line',{x1:X0-18,y1:top,x2:X0-18,y2:bot,stroke:'#ffcc00','stroke-width':1.6},dl);
  [top,bot].forEach(yy=>el('line',{x1:X0-24,y1:yy,x2:X0-12,y2:yy,stroke:'#ffcc00','stroke-width':1.6},dl));
  T(dl,X0-30,(top+bot)/2-4,'開挖',{'text-anchor':'end',fill:'#ffcc00','font-size':13});T(dl,X0-30,(top+bot)/2+14,`${depth} cm`,{'text-anchor':'end',fill:'#ffcc00','font-size':13,'font-weight':700});
  T(svg,(X0+X1)/2,bot+24,'原土層（開挖面）',{'text-anchor':'middle',fill:'#d8c2a2','font-size':13});
  $$('.iq-l',svg).forEach(n=>{n.style.cursor='pointer';n.addEventListener('click',()=>on(n.dataset.k))});
  return {set(k){const lv=Z3.findIndex(z=>z.k===k);dl.setAttribute('opacity',lv===0?1:.35);
    ['agg','ctb','ac'].forEach((q,i)=>{const L=g[q],show=i+1<=lv,cur=i+1===lv;L.gg.classList.toggle('cur',cur);
      if(!!L.on===show)return;L.on=show;   // only the layers that change grow in / slide out
      tween(show?560:260,t=>{const f=show?t:1-t;L.r.setAttribute('y',L.yy+L.hh*(1-f));L.r.setAttribute('height',L.hh*f)},ease.out);
      L.t.setAttribute('opacity',show?1:0)})}};
}
// navaid sketches: only the design numbers (E-40 / E-41) and the user's notes (pipes 2 over 2; the warning tape lies between the CLSM
// and the soil cover on top of it); no depth is dimensioned there, so none is drawn
function duct1(svg){svg.setAttribute('viewBox','0 0 520 230');const g0=60,X0=170,X1=290,tape=112,yb=206,cx=[216,244],cy=[152,180];
  el('rect',{x:0,y:g0,width:520,height:170,fill:'#3b2f22'},svg);el('rect',{x:0,y:g0-6,width:X0,height:6,fill:'#3d5a2a'},svg);el('rect',{x:X1,y:g0-6,width:520-X1,height:6,fill:'#3d5a2a'},svg);
  el('rect',{x:X0,y:g0,width:X1-X0,height:tape-g0,fill:'#8a6a4a'},svg);                                    // soil cover
  el('rect',{x:X0,y:tape,width:X1-X0,height:yb-tape,fill:'#6f7880'},svg);                                  // CLSM
  T(svg,X0-10,(g0+tape)/2+5,'覆土',{'text-anchor':'end',fill:'#e2cba8','font-size':13});
  T(svg,X0-10,(tape+yb)/2+5,'CLSM 回填',{'text-anchor':'end',fill:'#dfe6ee','font-size':13});
  el('line',{x1:X0+3,y1:tape,x2:X1-3,y2:tape,stroke:'#ff5a4e','stroke-width':3.5,'stroke-dasharray':'8 5'},svg);
  T(svg,X1+12,tape+5,'警示帶（CLSM 與覆土之間）',{fill:'#ff8a7a','font-size':13});
  el('rect',{x:cx[0]-16,y:cy[0]-16,width:cx[1]-cx[0]+32,height:cy[1]-cy[0]+32,rx:3,fill:'none',stroke:'#c9d2da','stroke-width':2},svg);   // the rack
  el('line',{x1:cx[0]-16,y1:(cy[0]+cy[1])/2,x2:cx[1]+16,y2:(cy[0]+cy[1])/2,stroke:'#c9d2da','stroke-width':1.5},svg);
  cy.forEach(y=>cx.forEach(x=>el('circle',{cx:x,cy:y,r:9,fill:'#e9eef2',stroke:'#4aa3ff','stroke-width':2},svg)));
  T(svg,X1+12,cy[0]+2,'2" PVC 管 × 4 支',{fill:'#9fd0ff','font-size':13,'font-weight':700});T(svg,X1+12,cy[0]+19,'上 2 支、下 2 支',{fill:'#9fd0ff','font-size':12.5});
  el('line',{x1:cx[1]+16,y1:cy[1]+12,x2:X1+8,y2:cy[1]+12,stroke:'#c9d2da','stroke-width':1},svg);T(svg,X1+12,cy[1]+16,'管架',{fill:'#c9d2da','font-size':12.5});
  T(svg,(X0+X1)/2,g0-18,'一次側管道斷面（示意）',{'text-anchor':'middle',fill:'#c8d2dc','font-size':14})}
function duct2(svg){svg.setAttribute('viewBox','0 0 520 170');const y=92;
  el('rect',{x:0,y:y-40,width:520,height:118,fill:'#2b3424'},svg);
  el('rect',{x:40,y:y-26,width:52,height:52,rx:4,fill:'#6b747c',stroke:'#c9d2da','stroke-width':2},svg);T(svg,66,y+46,'手孔',{'text-anchor':'middle',fill:'#dfe6ee','font-size':13});
  el('line',{x1:92,y1:y,x2:430,y2:y,stroke:'#9fd0ff','stroke-width':5,'stroke-dasharray':'2 0'},svg);
  el('circle',{cx:446,cy:y,r:14,fill:'#ffe08a',stroke:'#fff','stroke-width':2},svg);T(svg,446,y+38,'邊燈',{'text-anchor':'middle',fill:'#dfe6ee','font-size':13});
  T(svg,262,y-42,'2" PVC 管 × 1 支　140 kgf/cm² PC 包覆',{'text-anchor':'middle',fill:'#ffcc00','font-size':14,'font-weight':700});
  T(svg,260,24,'二次側管道平面（示意）',{'text-anchor':'middle',fill:'#c8d2dc','font-size':14})}
G.pages.insp=function(){
  const {head,sec,page,titleIn}=G._pg;const route='#/insp',D=(window.INSPI||{}).groups||{};
  const root=page('insp-page',`${head(route)}
    <p class="lead rv">查驗依工區一～四分開介紹，目前有資料的是工區三，工區一、二、四待補充；另外是助航燈光的管線查驗。路面每一層分成「施工查驗」（現場量測、檢查）與「材料取樣與試驗」（現場取樣，送實驗室會驗；有實驗室會驗照片的項目，兩張並排）兩組；黃字是標準值，沒有標準值的項目不寫數字。點照片可以放大。</p>
    <section class="block">${sec('路面','分區查驗','點工區切換。')}
      <div class="iq-ztabs rv">${ZN.map(n=>`<button type="button" data-z="${n}" style="--zc:var(--z${n})"><b>工區${CN[n]}</b><small>${S.zones[n].cap}</small>${n===3?'':'<em>待補充</em>'}</button>`).join('')}</div>
      ${ZN.filter(n=>n!==3).map(n=>`<div class="iq-zp iq-todo" data-z="${n}" style="--zc:var(--z${n})"><span>工區${CN[n]}・${S.zones[n].cap}</span><b>待補充</b><small>查驗項目與照片待補充</small></div>`).join('')}
      <div class="iq-zp" data-z="3"><p class="iq-zdesc">工區三・${S.zones[3].cap}：原土層開挖後，依序鋪碎石級配、水泥處理級配、瀝青混凝土，每一層完成都要做施工查驗，並取樣送實驗室試驗。點斷面圖上的任一層，或用下面的按鈕切換。</p>
      <div class="iq-z3 rv"><div class="iq-stack"><svg></svg><div class="iq-steps">${Z3.map((z,i)=>`<button type="button" data-k="${z.k}"><i>${i+1}</i>${z.n}</button>`).join('')}</div></div>
        <div class="iq-panel"><h3 class="iq-h"></h3><p class="iq-sub"></p>${GRP.map(g=>`<div class="iq-grp" data-g="${g.k}"><h4><span>${g.n}</span><small>${g.sub}</small></h4><div class="iq-cards"></div></div>`).join('')}</div></div></div></section>
    <section class="block">${sec('助航燈光','管線查驗','手孔與手孔之間的一次側管道，以及手孔到邊燈的二次側管道。')}
      <div class="iq-nav rv"><div class="iq-tabs">${NAV.filter(n=>D[n.k]&&D[n.k].length).map(n=>`<button type="button" data-k="${n.k}">${n.n}<small>${n.sub}</small></button>`).join('')}</div>
        <div class="iq-navbody"><svg class="iq-sk"></svg><div class="iq-cards"></div></div></div>
      <p class="note">資料來源：查驗項目與照片取自監造施工查驗照片與實驗室會驗照片。斷面與平面圖為示意，不依比例。</p></section>
    ${G.pager(route)}${G.footer()}`);
  const showT=titleIn(root);
  // zone 3
  const panel=$('.iq-panel',root),st=stack($('.iq-stack svg',root),k=>z3(k));
  function z3(k){const z=Z3.find(q=>q.k===k);if(!z)return;st.set(k);$$('.iq-steps button',root).forEach(b=>b.classList.toggle('on',b.dataset.k===k));
    $('.iq-h',panel).textContent=z.n;$('.iq-sub',panel).textContent=z.sub;let d0=0;
    GRP.forEach(g=>{const box=$(`.iq-grp[data-g="${g.k}"]`,panel),its=(D[k]||[]).filter(i=>(i.kind||'field')===g.k);box.hidden=!its.length;
      cards($('.iq-cards',box),its,`工區三・${z.n}・${g.n}`,d0);d0+=its.length})}
  $$('.iq-steps button',root).forEach(b=>b.onclick=()=>z3(b.dataset.k));
  function zone(n){$$('.iq-ztabs button',root).forEach(b=>b.classList.toggle('on',+b.dataset.z===n));$$('.iq-zp',root).forEach(d=>d.classList.toggle('on',+d.dataset.z===n))}
  $$('.iq-ztabs button',root).forEach(b=>b.onclick=()=>zone(+b.dataset.z));zone(3);
  // navaids
  const nb=$('.iq-navbody',root),sk=$('.iq-sk',root);
  function nav(k){const n=NAV.find(q=>q.k===k);$$('.iq-tabs button',root).forEach(b=>b.classList.toggle('on',b.dataset.k===k));
    sk.innerHTML='';sk.classList.toggle('off',!(k==='duct1'||k==='duct2'));
    if(k==='duct1')duct1(sk);
    if(k==='duct2')duct2(sk);
    cards($('.iq-cards',nb),D[k]||[],n.n)}
  $$('.iq-tabs button',root).forEach(b=>b.onclick=()=>nav(b.dataset.k));
  z3('soil');const first=$('.iq-tabs button',root);if(first)nav(first.dataset.k);
  return {el:root,enter(){showT();let i=0;G.onView($('.iq-z3',root),()=>{const steps=Z3.map(z=>z.k);const go=()=>{if(i<steps.length&&!root.dataset.touched){z3(steps[i++]);setTimeout(go,1100)}};setTimeout(go,300)},.35);
      root.addEventListener('pointerdown',()=>root.dataset.touched=1,{once:true})},destroy(){}};
};
})();
