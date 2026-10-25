/* Pages. Each factory returns {el, enter(), destroy()}. 2026-10-10: one flat tour, no "related pages" cross links;
   the only ways to move are the tour line in the top bar, the next / previous stop at the bottom, and ← →. */
(function(){
'use strict';
const {h,$,$$,el}=G;const S=window.SITE,A=window.ASSETS;
G.pages={};
G.idx=r=>S.stops.findIndex(s=>s.route===r);
const nameOf=s=>s.name||(s.zone?S.zones[s.zone].name:s.label),subOf=s=>s.cap||(s.zone?S.zones[s.zone].cap:s.sub);   // name / cap: the merged zone 1 + 2 stop
G.zoneStop=i=>G.idx(i<=2?'#/zone/1':'#/zone/'+i);   // the stop that shows zone i (zones 1, 2 share one since 2026-10-16)
G.titleOf=r=>{const s=S.stops[G.idx(r)];return s?nameOf(s)+'　'+subOf(s):r};
G.stopNo=i=>i?`第 ${G.pad(i)} 站 ／ 共 ${G.pad(S.stops.length-1)} 站`:'起點';
const head=(route,extra)=>{const i=G.idx(route),st=S.stops[i],z=st.zone;
  return `<header class="pg-head" style="--zc:${z?G.COL[z]:'#ffcc00'}"><div class="row"><div class="znum">${G.pad(i)}</div><div><small class="stopno">${G.stopNo(i)}</small><h1>${nameOf(st)}</h1><p>${subOf(st)}</p></div></div>${extra||''}</header>`};
G.pager=route=>{const i=G.idx(route),p=S.stops[i-1],n=S.stops[i+1];const chev='<i class="chev"><b></b><b></b><b></b></i>';
  return `<nav class="pager">${p?`<a class="prev" href="${p.route}"><small>‹ 上一站</small><b>${nameOf(p)}</b></a>`:'<span></span>'}`+
    (n?`<a class="next" href="${n.route}" style="--zc:${n.zone?G.COL[n.zone]:'#ffcc00'}"><small>下一站　${G.stopNo(i+1)}</small><b>${nameOf(n)}</b><em>${subOf(n)}</em>${chev}</a>`
      :`<a class="next" href="#/"><small>導覽結束</small><b>回到起點</b><em>回到跑道總覽</em>${chev}</a>`)+'</nav>'};
G.footer=()=>`<footer class="foot">模型為示意，位置依設計展示配準，非測量成果。　<a href="#/" data-replay-intro>重播片頭</a><br>
  飛機模型（示意，非 MSFS 素材）："Boeing 747-100" by Marine, CC BY 4.0／"Boeing-787- Dreamliner" by themaker845, CC BY 4.0</footer>`;
const sec=(kick,title,lead)=>`<h2 class="sec rv"><span class="kick">${kick}</span>${title}</h2>${lead?`<p class="lead rv">${lead}</p>`:''}`;
const page=(cls,html)=>{const r=h('div','page '+cls);r.innerHTML=`<div class="wrap">${html}</div>`;return r};
const titleIn=root=>{const t=$('.pg-head h1',root);return t?G.chars(t,70):()=>{}};
G._pg={head,sec,page,titleIn};   // B 2026-10-11: shared with js/insp.js

/* ================= home ================= */
/* B (2026-10-10): back on the home page after a visit -> "continue where you were" + how many stops have been seen */
function resume(){const last=G.store.get('last'),i=G.idx(last||'');let seen=[];try{seen=JSON.parse(G.store.get('visited')||'[]')}catch(e){}
  const n=S.stops.filter((s,k)=>k&&seen.includes(s.route)).length;if(i<1)return '';const st=S.stops[i];
  return `<a class="resume" href="${st.route}" style="--zc:${st.zone?G.COL[st.zone]:'#ffcc00'}"><small>繼續上次的位置　已看過 ${n}／${S.stops.length-1} 站</small><b>${G.stopNo(i).split(' ／')[0]}　${nameOf(st)} ›</b></a>`}
G.pages.home=function(p,ctx){
  const root=page('home',`<div class="home-head"><h1>${S.title}</h1><div class="rule"></div><p class="sub">${S.sub}</p></div>
    <div class="hub-wrap"><svg class="hub" aria-label="跑道總圖"></svg>
      <div class="peek"><div class="im"><img alt=""></div><div class="tx"><small></small><b></b><span></span><em>點一下進入 ›</em></div></div></div>
    <div class="zbtns">${[1,2,3,4].map(i=>`<a class="zbtn" href="#/zone/${i}" style="--zc:${G.COL[i]}"><i></i><span><small>${G.stopNo(G.zoneStop(i))}</small><b>${S.zones[i].name}</b><em>${S.zones[i].cap}</em></span></a>`).join('')}</div>
    <div class="chips">${Object.entries(S.layers).map(([k,v])=>`<button class="chip${k==='zones'?' on':''}" data-layer="${k}">${v.label}</button>`).join('')}</div>
    <div class="layer-info"></div>
    <div class="start rv"><a class="go-btn" href="${S.stops[1].route}"><span>開始導覽</span><i class="chev"><b></b><b></b><b></b></i></a>${resume()}
      <p>共 ${S.stops.length-1} 站，跟著上方的路線一站一站走，也可以直接點跑道上的工區。<span class="keys"><br><kbd>→</kbd> 下一站　<kbd>←</kbd> 上一站　<kbd>?</kbd> 快捷鍵</span></p></div>
    <section class="block"><div class="stats rv">${S.stats.map(s=>`<div class="stat"><div class="v"><span data-v="${s.v}">0</span><small>${s.u}</small></div><div class="l">${s.l}</div><div class="bar"></div></div>`).join('')}</div></section>
    ${G.footer()}`);
  const headEl=$('.home-head',root);const showT=G.chars($('h1',headEl),45);
  const peek=$('.peek',root),wrap=$('.hub-wrap',root);
  // B: the hover card plays 16 small frames of the zone's shot (8 per second) while the pointer is on the zone
  let pk=null;const loop=i=>{clearInterval(pk);pk=null;if(!i){peek.dataset.z='';return}const P=A.hero[i].peek;if(!P)return;
    P.forEach(s=>{const im=new Image();im.src=s});let k=0;const img=$('img',peek);img.classList.add('live');pk=setInterval(()=>{k=(k+1)%P.length;img.src=P[k]},125)};
  const hub=G.Hub($('.hub',root),{
    onZone:async i=>{peek.classList.remove('on');await hub.zoomTo(i);ctx.noWipe=true;location.hash=`#/zone/${i}`},   // the zoom is this transition
    onHover:(i,x,y)=>{if(!i){peek.classList.remove('on');loop(0);return}const r=wrap.getBoundingClientRect(),z=S.zones[i];
      if(peek.dataset.z!==String(i)){peek.dataset.z=i;$('img',peek).src=A.hero[i].thumb;loop(i);$('small',peek).textContent=G.stopNo(G.zoneStop(i));$('b',peek).textContent=z.name;$('span',peek).textContent=z.cap;peek.style.setProperty('--zc',G.COL[i])}
      let px=x-r.left+22,py=y-r.top+22;if(px+300>r.width)px=x-r.left-322;if(py+250>r.height)py=y-r.top-260;
      peek.style.left=px+'px';peek.style.top=Math.max(0,py)+'px';peek.classList.add('on')}});
  const info=$('.layer-info',root);
  const setInfo=k=>{info.classList.remove('in');void info.offsetWidth;info.textContent=(G.touch&&S.layers[k].infoTouch)||S.layers[k].info;info.classList.add('in')};setInfo('zones');
  $$('.chip',root).forEach(b=>b.onclick=()=>{$$('.chip',root).forEach(x=>x.classList.toggle('on',x===b));hub.setLayer(b.dataset.layer);setInfo(b.dataset.layer)});
  const statsEl=$('.stats',root);
  return {el:root,
    enter(){const go=()=>{showT();headEl.classList.add('on');hub.enter(true)};if(ctx.intro)ctx.intro.then(go);else go();
      G.onView(statsEl,()=>$$('.stat',root).forEach((s,i)=>setTimeout(()=>{G.countUp($('[data-v]',s),+$('[data-v]',s).dataset.v);$('.bar',s).style.width='100%'},i*160)),.3)},
    destroy(){hub.destroy();clearInterval(pk)}};
};

/* ================= zone ================= */
// B: phones read the 640 px copies of the viewer frames (srcm), about a quarter of the data
const vf=fr=>G.narrow()?fr.map(f=>f.srcm?Object.assign({},f,{src:f.srcm}):f):fr;
function wz3Viewer(host){
  const W=A.wz3,C=W.captions;
  return G.StateViewer(host,{frames:vf(W.frames),live:G.LiveWZ3,notes:S.wz3.notes,defOffset:[90,-120],
    tag:{text:W.tag[0],on:W.rest.map((f,i)=>f<=W.tag[2]?i:-1)},
    states:S.wz3.states.map((s,i)=>({f:W.rest[i],title:s.title||C[s.titleCap!=null?s.titleCap:s.cap][1],sub:C[s.cap][2],short:s.short,thumb:W.thumbs[i]}))});
}
// zones 1 / 2 (2026-10-12, user:「第一工區的水泥混凝土表面有掃紋 他還要鋸縫變成版塊 然後填縫」「直接拉出一塊好了」「工區二也一併做」): a block
// pulled out of the PCC pavement (S03c / S04c, work/wz1_pcc_20261012); step titles come from the shot's captions unless site.js gives them
function pccViewer(host,W){
  const C=W.captions,cap=f=>C.filter(c=>c[0]<=f).pop()||C[0];
  return G.StateViewer(host,{frames:vf(W.frames),notes:S.pcc.notes,offsets:W.label_offsets,defOffset:[120,-120],
    tag:{text:W.tag[0],on:W.rest.map((_,i)=>i)},
    states:S.pcc.states.map((s,i)=>({f:W.rest[i],title:s.title||cap(W.rest[i])[1],sub:s.sub||cap(W.rest[i])[2],short:s.short,thumb:W.thumbs[i]}))});
}
function wz4Viewer(host){
  const W=A.wz4,C=W.captions,t=c=>c[1].replace(/^工區四　/,'');
  const clean=G.narrow()&&W.clean_m?W.clean_m:W.clean;
  return G.StateViewer(host,{frames:vf(W.frames),live:G.LiveWZ4,notes:S.wz4.notes,
    offsets:Object.assign({},W.label_offsets,{'反射裂縫抑制網（玻璃纖維，寬 1 m）':[-80,-130],'接縫處（約每 7 m 一道）':[110,120],'既有水泥混凝土版塊':[100,-130],'20 cm 密級配改質瀝青混凝土':[100,-140]}),
    tag:{text:'反射裂縫抑制材鋪設位置',on:[0,1,2,3]},
    states:[{f:W.rest[1],title:t(C[0]),sub:C[0][2],short:'刨除既有瀝青',thumb:W.thumbs[1],spots:[['既有水泥混凝土版塊',.47,.66]]},
            {f:W.rest[2],title:t(C[1]),sub:C[1][2],short:'接縫鋪抑制網',thumb:W.thumbs[2]},
            {src:clean[1],title:t(C[2]),sub:C[2][2],short:'加鋪改質瀝青',thumb:W.thumbs[3],spots:[['20 cm 密級配改質瀝青混凝土',.5,.62]]},
            {f:W.rest[4],enter:300,title:t(C[3]),sub:C[3][2],short:'接縫斷面',thumb:W.thumbs[4]}]});
}
G.pages.zone=function(n){
  // 2026-10-16 (user:「工區一二這兩站合併」, 一頁上下兩段): #/zone/1 and #/zone/2 are one page, zone 1 above and zone 2 below;
  // both are PCC 40 + CTB 30. r2 (user:「鋪面分層還有從掃紋到填縫這兩個重複地拿掉，然後工區二的動畫部分移到工區一下面」): the two model
  // loops first (工區一, 工區二), then 鋪面分層 and 從掃紋到填縫 once, with zone 1's pictures
  n=+n;const parts=n<=2?[1,2]:[n],route='#/zone/'+parts[0],VV={1:A.wz1&&S.pcc,2:A.wz2&&S.pcc,3:S.wz3,4:S.wz4},two=parts.length>1;
  const hero=z=>{const Z=S.zones[z];
    return `${two?`<h2 class="zpart-h rv" id="zp-${z}" style="--zc:${G.COL[z]}"><i></i>${Z.name}<small>${Z.cap}</small></h2>`:''}
    <div class="zone-hero" data-z="${z}"><div class="player rv"></div><aside class="facts rv" data-d="150"><h3>重點數據</h3>${Z.facts.map(f=>`<div class="fact"><span>${f[0]}</span><b>${f[1]}</b></div>`).join('')}</aside></div>`};
  const z0=parts[0],Z0=S.zones[z0],V=VV[z0],same=two?'工區一、二相同；':'';
  const shared=`<section class="block">${sec('斷面','鋪面分層',`${same}依厚度比例由下往上疊出各層；${G.touch?'點':'滑鼠移到'}任一層看說明。${G.stacked()?'下方':'右邊'}是影片裡的分層模型。`)}
      <div class="sec-grid"><div class="sec-card rv"><svg></svg></div><figure class="model rv" data-d="150"><img src="${A.layers[z0]}" alt="${Z0.name}分層模型"><figcaption>影片中的分層模型（浮起示意）</figcaption></figure></div>
      ${Z0.note?`<p class="note">${Z0.note}</p>`:''}</section>
    ${V?`<section class="block" data-z="${z0}">${sec(V.kick,V.title,same+((G.touch&&V.leadTouch)||V.lead))}<div class="sv-host rv"></div>${V.quote?`<p class="note">${V.quote}</p>`:''}</section>`:''}`;
  const root=page('zone',`${head(route,'<svg class="zone-strip"></svg>')}${parts.map(hero).join('')}${shared}${G.pager(route)}${G.footer()}`);
  root.style.setProperty('--zc',G.COL[parts[0]]);
  const showT=titleIn(root);const strip=G.ZoneStrip($('.zone-strip',root),parts);
  // whole shot, ends on the exploded layers. B: phones take every second frame at half the rate (same length, half the data)
  // the MP4 when there is one (prep_site_extras_B.py), otherwise the frames
  const players=parts.map(z=>{const H=A.hero[z],HF=H.frames,half=G.narrow(),hf=half?HF.filter((_,i)=>i%2===0||i===HF.length-1):HF,el_=$(`.zone-hero[data-z="${z}"] .player`,root);
    return H.mp4?G.HeroVideo(el_,H.mp4,HF,H.fps,H.hold):G.FramePlayer(el_,hf,half?H.fps/2:H.fps,null,H.hold)});
  const secv=G.Section($('.sec-card svg',root),S.zones[parts[0]].section,{total:S.zones[parts[0]].total});
  const svs=parts.map(z=>{const host=$(`section[data-z="${z}"] .sv-host`,root);if(!host)return null;
    return z===3?wz3Viewer(host):z===4?wz4Viewer(host):z===1&&A.wz1?pccViewer(host,A.wz1):z===2&&A.wz2?pccViewer(host,A.wz2):null});
  return {el:root,
    enter(){showT();strip.play();G.onView($('.sec-card',root),()=>secv.play(),.35)},
    destroy(){players.forEach(p=>p.destroy());svs.forEach(v=>v&&v.destroy())}};
};

/* ================= 施工階段 ================= */
const staOf=s=>{const m=/(\d)K([+-])(\d{3})/.exec(s);return m?(+m[1])*1000+(m[2]==='-'?-1:1)*(+m[3]):0};
G.pages.phase=function(){
  const route='#/phase',P=A.phase,N=S.phase.length;
  const steps=S.phase.map(s=>{const imgs=s.img.map(k=>P[k]);const main=imgs.find(x=>x.caption[0].startsWith(s.k))||imgs[0];
    const st=imgs[imgs.length-1].strips;
    return Object.assign({},s,{imgs,title:s.k==='施工前'?'施工前':main.caption[0],sub:main.caption[1].replace(/^施工前：/,''),cov:[staOf(st[0]),staOf(st[1].split('→')[1])],strips:st})});
  const root=page('phase-page',`${head(route)}
    <section class="ph-board">
      <div class="ph-mapwrap rv"><svg class="ph-map" aria-label="跑道示意圖"></svg></div>
      <div class="ph-ctrl"><div class="rail-host"></div><button class="play" type="button"><i>▶</i><span>自動播放</span></button></div>
      <div class="ph-view"><div class="cmp-host stage"></div>
        <aside class="side"><div class="no"><b>01</b><span>/ ${G.pad(N)}</span></div><h3></h3><p></p><div class="legend"></div>
          <button class="obl" type="button"><img alt=""><span>斜看新跑道頭 ›</span></button></aside></div>
      <p class="tdz-note" hidden></p>
      <p class="note">跑道示意圖的長度依 STA 比例、寬度放大；照片為同視角俯視全景，上下兩條分別是虛線框標示的兩段。</p>
    </section>
    <section class="block">${sec('標線','著陸區標線：修改前與修改後',S.tdzCalc.lead)}<div class="tdz-host rv"></div><p class="note">${S.tdzCalc.note}</p></section>
    ${G.pager(route)}${G.footer()}`);
  const tdz=G.TdzCalc($('.tdz-host',root),S.tdzCalc);   // 2026-10-19 著陸區標線計算器
  const showT=titleIn(root);const map=G.PhaseMap($('.ph-map',root));const cmp=G.Compare($('.cmp-host',root));const side=$('.side',root);
  new Set(steps.flatMap(s=>s.imgs.map(x=>x.img))).forEach(src=>{const im=new Image();im.src=src});
  let cur=-1,timer=null;
  const rail=G.Rail($('.rail-host',root),steps.map(s=>({label:s.k})),i=>{stop();go(i)});   // numbered 1..6 (no 施工前 since 2026-10-12)
  function go(i){i=Math.max(0,Math.min(N-1,i));if(i===cur)return;cur=i;const s=steps[i];rail.set(i);map.go(i,s);
    const rg=s.strips.map(t=>{const p=t.split('→');return [staOf(p[0]),staOf(p[1])]});   // the two photo strips (STA from - to)
    const marks=(s.chk||[]).map(([sta,stt,t,p])=>{const k=sta<=rg[0][1]?0:1;return {x:(sta-rg[k][0])/(rg[k][1]-rg[k][0]),y:s.chkY[k],st:stt,t,p}});
    cmp.show(s.imgs[0].img,s.imgs[1]&&s.imgs[1].img,s.lab&&s.lab[0],s.lab&&s.lab[1],s.strips,marks,marks.length?2:50);
    const no=$('.no b',side);no.classList.remove('flip');void no.offsetWidth;no.textContent=G.pad(i+1);no.classList.add('flip');
    const h3=$('h3',side);h3.classList.remove('on');h3.textContent=s.title;setTimeout(G.chars(h3,24),30);$('p',side).textContent=s.sub;
    $('.legend',side).innerHTML=(s.imgs[1]?`<span><i class="l"></i>左：${s.lab[0]}</span><span><i class="r"></i>右：${s.lab[1]}</span><small>拖曳畫面中間的把手比較前後</small>`:'<small>施工前的既有跑道標線</small>')
      +(s.chk?`<small class="chk-key">${[['ok','✓','符合'],['tbd','？','待確認'],['ng','✗','不符']].filter(([k])=>s.chk.some(c=>c[1]===k)).map(([k,b,t])=>`<b class="${k}">${b}</b>${t}`).join('　')}</small>`:'')
;
    const tz=$('.tdz-note',root);tz.hidden=!s.tdz;if(s.tdz)tz.innerHTML=`<b>著陸區標線</b>${S.tdzNote}`;   // r2: under the photo, full width
    const ob=$('.obl',side);ob.style.display=s.obl?'':'none';if(s.obl){$('img',ob).src=P[s.obl].img;ob.onclick=()=>G.lightbox(P[s.obl].img,P[s.obl].caption.join('　'))}
    side.classList.remove('swap');void side.offsetWidth;side.classList.add('swap')}
  const playB=$('.play',root);
  function stop(){clearTimeout(timer);timer=null;playB.classList.remove('on');$('span',playB).textContent='自動播放';$('i',playB).textContent='▶'}
  playB.onclick=()=>{if(timer){stop();return}playB.classList.add('on');$('span',playB).textContent='暫停';$('i',playB).textContent='❚❚';
    let i=cur>=N-1?0:cur+1;const next=()=>{go(i);i++;timer=i<N?setTimeout(next,4200):setTimeout(stop,4200)};next()};
  const onKey=e=>{if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||!G.onScreen($('.ph-view',root)))return;
    if(e.key==='ArrowRight'&&cur<N-1){stop();go(cur+1);e.preventDefault()}else if(e.key==='ArrowLeft'&&cur>0){stop();go(cur-1);e.preventDefault()}};
  document.addEventListener('keydown',onKey);
  return {el:root,enter(){showT();G.onView($('.ph-map',root),()=>{if(cur<0)go(0)},.2)},
    destroy(){stop();cmp.destroy();rail.destroy();document.removeEventListener('keydown',onKey)}};
};

/* ================= 施工管制 ================= */
G.pages.control=function(){
  const route='#/control',C=A.control;
  const root=page('control-page',`${head(route)}
    <section class="block">${sec('時鐘','現在哪些圍籬在場？','拖曳時鐘指針，或點下面的時間；兩張畫面會跟著時間亮起或變暗。')}
      <div class="clock-board rv"><div class="clock-host"></div>
        <div class="clock-side"><div class="jump"><span>試試看</span><button type="button" data-h="now" class="now">現在</button>${[['03:00',3],['16:30',16.5],['18:00',18],['21:30',21.5]].map(([t,v])=>`<button type="button" data-h="${v}">${t}</button>`).join('')}</div>
          <div class="ctl-cards">${S.rings.map((r,i)=>`<div class="ctl" style="--c:${r.col}"><div class="player"></div><div class="tx"><b>${r.name}</b><span>${r.t}</span><em class="st"></em><small>${C[r.media].caption[1].split('｜')[0].replace(/\s*\d+\s*座/,'')}</small></div></div>`).join('')}</div></div></div></section>
    <section class="block">${sec('位置','在跑道上的哪裡','紅白虛線框是工區一木製圍籬的範圍；黃色 X 是跑道北側二號聯絡道的封閉位置（約 STA 0K+629）；圖上也標出工區三的覆工板示範段。')}
      <div class="hub-wrap still rv"><svg class="hub" aria-label="施工管制位置"></svg></div></section>
    ${G.pager(route)}${G.footer()}`);
  const showT=titleIn(root);const cards=$$('.ctl',root);
  const players=S.rings.map((r,i)=>G.Loop($('.player',cards[i]),C[r.media]));
  const clock=G.Clock($('.clock-host',root),S.rings,(hr,on)=>on.forEach((v,i)=>{cards[i].classList.toggle('on',v);$('.st',cards[i]).textContent=v?'● 圍設中':'未圍設'}));
  $$('.jump button',root).forEach(b=>b.onclick=()=>{const d=new Date();clock.jump(b.dataset.h==='now'?d.getHours()+d.getMinutes()/60:+b.dataset.h)});   // 現在 = this device's clock
  const hub=G.Hub($('.hub',root),{still:true});hub.show();
  return {el:root,enter(){showT();G.onView($('.clock-host',root),()=>clock.intro(),.3);G.onView($('.hub',root),()=>setTimeout(()=>hub.setLayer('ctrl'),300),.3)},
    destroy(){players.forEach(p=>p.destroy());clock.destroy();hub.destroy()}};
};

/* ================= 助航設施 ================= */
G.pages.aids=function(){
  const route='#/aids',X=A.aids,cap=X.captions;
  const root=page('aids-page',`${head(route)}
    <nav class="toc" aria-label="本頁段落">${[['迴路','.circ-host'],['末端燈','.end-grid'],['PAPI','.papi-host'],['地下','.aids-page .sv-host'],['標誌牌','.sign']].map(([t,s])=>`<button type="button" data-s="${s}">${t}</button>`).join('')}</nav>
    <section class="block">${sec('迴路','跑道邊燈：R1、R3 兩個迴路',`切換${G.stacked()?'下方':'右邊'}的開關：只開 R1、只開 R3 或全開，看哪些燈會亮；下方示意圖的燈會從 03 端依序亮起。`)}<div class="circ-host rv"></div></section>
    <section class="block">${sec('末端燈',cap[0][1],cap[0][2]+'。下面的小飛機示範：進場時看到綠光，在跑道上看到紅光。')}
      <div class="end-grid rv"><div class="thr-host"></div><div class="end-demo"><svg></svg></div></div></section>
    <section class="block papi-block">${sec('PAPI',S.papi.title,S.papi.lead)}<div class="papi-host rv"></div>
      <div class="papi-more rv"><dl class="src">${S.papi.facts.map(f=>`<dt>${f[0]}</dt><dd>${f[1]}</dd>`).join('')}</dl>
        <div class="papi-photo"></div></div>
      <p class="note">上方仰角圖為示意，角度放大畫出，決斷高度也是示意位置；${G.stacked()?'下方':'右側'}為模型畫面（兩個迴路全開的夜間畫面）。</p></section>
    <section class="block">${sec('地下',X.s10.title,X.s10.sub+'。點畫面，地面打開看地下的管路。')}<div class="sv-host rv"></div></section>
    <section class="block">${sec('標誌牌',S.signs.title,S.signs.sub)}<div class="sign rv"><div class="player"></div></div></section>
    ${G.pager(route)}${G.footer()}`);
  const showT=titleIn(root);
  const circ=G.Circuits($('.circ-host',root),X);
  const thr=G.EndVideo($('.thr-host',root),S.endVideo);   // user 2026-10-13: model video (was the 2026-10-11 still); plays while on screen
  const end=G.EndLights($('.end-demo svg',root));end.follow(thr.video,S.endVideo,thr.fade);   // the plane follows the video
  const sv=G.StateViewer($('.sv-host',root),{frames:X.s10.frames,offsets:Object.assign({},X.s10.label_offsets,{'手孔（RC 75×75×75 cm，含蓋板）':[70,-110,'c']}),defOffset:[-90,-100],   // 2026-10-11: up-right, off the secondary-pipe dot
    
    states:[{f:1,title:'地面',sub:'跑道邊線外的草地，看不到地下的手孔與管路。',short:'地面',thumb:X.s10.thumbs[0],spots:[]},   // video labels start at frame 121
            {f:121,title:'打開看地下',sub:X.s10.sub,short:'地下管路',thumb:X.s10.thumbs[1]}]});
  const sign=G.Loop($('.sign .player',root),X.s11);
  const papi=G.Papi($('.papi-host',root),S.papi);G.PapiPhoto($('.papi-photo',root),X.papi.img,X.papi.units,'模型夜間畫面：在 3° 進場斜面上看，跑道左側一排 4 盞 PAPI 為 2 白 2 紅（兩個迴路全開）',S.papi.edge);
  // B: the chips jump to a section; the one on screen is lit while scrolling
  const tocB=$$('.toc button',root),secs=tocB.map(b=>$(b.dataset.s,root).closest('section'));
  tocB.forEach((b,i)=>b.onclick=()=>{const y=secs[i].getBoundingClientRect().top+scrollY-120;window.scrollTo({top:y,behavior:G.reduced?'auto':'smooth'})});
  const lit=()=>{let k=0;secs.forEach((s,i)=>{if(s.getBoundingClientRect().top<innerHeight*.4)k=i});tocB.forEach((b,i)=>b.classList.toggle('on',i===k))};
  window.addEventListener('scroll',lit,{passive:true});setTimeout(lit,300);
  return {el:root,enter(){showT();G.onView($('.circ-host',root),()=>circ.play(),.3);G.onView($('.papi-host',root),()=>papi.play(),.4)},
    destroy(){thr.destroy();end.destroy();sv.destroy();sign.destroy();papi.destroy();window.removeEventListener('scroll',lit)}};
};

/* ================= 導覽影片 ================= */
G.pages.film=function(){
  const route='#/film',F=A.film,CH=F.chap.chapters,dur=F.chap.duration;
  const root=page('film-page',`${head(route)}
    <div class="film rv"><div><div class="video-wrap"><video controls playsinline preload="metadata" src="${F.src}"></video></div><div class="chapter-bar"></div></div><ol class="chapters"></ol></div>
    ${G.pager(route)}${G.footer()}`);
  const showT=titleIn(root);const v=$('video',root),list=$('.chapters',root),bar=$('.chapter-bar',root);
  const tip=h('div','cb-tip','<img alt=""><span><small></small><b></b></span>',$('.chapter-bar',root).parentNode);   // chapter preview above the bar
  const colorOf=c=>{const m=/工區([一二三四])/.exec(c.title);if(m)return G.COL['一二三四'.indexOf(m[1])+1];return c.shot==='S01'||c.shot==='S13'?'#6b7a88':'#ffcc00'};
  const seek=t=>{v.currentTime=t+.05;v.play().catch(()=>{});if(G.narrow())v.scrollIntoView({behavior:'smooth',block:'center'})};
  CH.forEach(c=>{if(S.chapterTitles[c.shot])c.title=S.chapterTitles[c.shot]});
  CH.forEach((c,i)=>{const end=i<CH.length-1?CH[i+1].start:dur;
    const li=h('li','',`<span class="th">${c.thumb?`<img src="${c.thumb}" alt="" loading="lazy">`:''}<span class="t">${G.fmtT(c.start)}</span></span><span class="n">${c.title.replace('　','<br>')}${c.sub?`<span class="s">${c.sub}</span>`:''}</span>`,list);
    li.onclick=()=>seek(c.start);li.style.setProperty('--c',colorOf(c));
    const d=h('div','',null,bar);d.style.flex=String(end-c.start);d.style.background=colorOf(c);d.onclick=()=>seek(c.start);
    d.addEventListener('mouseenter',()=>{if(c.thumb)$('img',tip).src=c.thumb;$('b',tip).textContent=c.title;$('small',tip).textContent=G.fmtT(c.start);
      tip.style.left=Math.min(Math.max(d.offsetLeft+d.offsetWidth/2,110),bar.clientWidth-110)+'px';tip.classList.add('on')});
    d.addEventListener('mouseleave',()=>tip.classList.remove('on'))});
  const ph=h('div','ph',null,bar);let last=-1;
  // B: remember where the film was left; offer to continue from there
  const saved=+G.store.get('filmT')||0;let lastSave=0;
  if(saved>5&&saved<dur-5){const rb=h('button','resume-film',`▶ 從 ${G.fmtT(saved)} 繼續播放`,$('.video-wrap',root));rb.type='button';
    rb.onclick=()=>{seek(saved);rb.remove()};v.addEventListener('play',()=>rb.remove(),{once:true})}
  v.addEventListener('timeupdate',()=>{if(Math.abs(v.currentTime-lastSave)>4){lastSave=v.currentTime;G.store.set('filmT',v.currentTime>dur-5?0:v.currentTime.toFixed(1))}});
  v.addEventListener('timeupdate',()=>{let i=0;CH.forEach((c,k)=>{if(v.currentTime>=c.start-.05)i=k});ph.style.left=(v.currentTime/dur*100)+'%';if(i===last)return;last=i;
    $$('li',list).forEach((li,k)=>li.classList.toggle('on',k===i));$$('div:not(.ph)',bar).forEach((d,k)=>d.classList.toggle('on',k===i));
    const li=list.children[i];if(li)list.scrollTo({top:li.offsetTop-list.clientHeight/2+li.clientHeight/2,behavior:'smooth'})});
  return {el:root,enter(){showT()},destroy(){v.pause()}};
};

/* ================= 製作過程 ================= */
G.pages.making=function(){
  const route='#/making',M=S.making;   // user 2026-10-10: the before / after section ("改了什麼") is removed
  const root=page('making-page',`${head(route)}
    <section class="block">${sec('流程','從模型到網站','同一套 Blender 模型做出影片，再把影片的影格變成網頁上可以點的互動。')}<div class="pipe-card rv"><svg class="pipe"></svg></div></section>
    <section class="block">${sec('紀錄','時間軸')}<ol class="tl">${M.timeline.map((x,i)=>`<li class="rv" data-d="${i*60}"><time>${x[0]}</time><b>${x[1]}</b>${x[2]?`<span>${x[2]}</span>`:''}</li>`).join('')}</ol></section>
    <section class="block">${sec('工具','分工')}<div class="tools">${M.tools.map((x,i)=>`<div class="tool rv" data-d="${i*90}"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div></section>
    <section class="block">${sec('說明','資料來源與說明')}<dl class="src rv">${M.sources.map(x=>`<dt>${x[0]}</dt><dd>${x[1]}</dd>`).join('')}</dl></section>
    ${G.pager(route)}${G.footer()}`);
  const showT=titleIn(root);const pipe=G.Pipeline($('.pipe',root),M.flow);
  return {el:root,enter(){showT();G.onView($('.pipe',root),()=>pipe.play(),.3)},destroy(){}};
};
})();
