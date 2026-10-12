/* App shell: hash router, page transitions, the tour line in the top bar (stops, sliding "train", visited marks, hover card),
   keyboard ← → (previous / next stop), P = presentation mode, opening animation on the first visit (short on repeat visits). */
(function(){
'use strict';
const {h,$,$$}=G;const S=window.SITE;
const view=$('#view');
/* ---------- the tour line ---------- */
const route=$('#route');
route.innerHTML='<div class="line"><i></i></div>'+S.stops.map((s,i)=>`<a href="${s.route}" class="st" style="--c:${s.zone?G.COL[s.zone]:'#ffcc00'}" data-i="${i}"><span class="d"></span><span class="t">${s.zone?S.zones[s.zone].name:s.label}</span></a>`).join('')+
  '<span class="train"></span><div class="tip"><small></small><b></b><span></span></div>';
const stops=$$('.st',route),fill=$('.line i',route),line=$('.line',route),train=$('.train',route),tip=$('.tip',route);
const menuBtn=$('#menuBtn');
let visited=new Set();try{visited=new Set(JSON.parse(G.store.get('visited')||'[]'))}catch(e){}
let curI=0;
function place(){const r=route.getBoundingClientRect();if(!r.width||getComputedStyle(route).position==='fixed')return;
  const c=i=>{const d=$('.d',stops[i]).getBoundingClientRect();return [d.left-r.left+d.width/2,d.top-r.top+d.height/2]};
  const [x0,y]=c(0),[x1]=c(stops.length-1),[xc]=c(curI);
  line.style.left=x0+'px';line.style.width=(x1-x0)+'px';line.style.top=y+'px';fill.style.width=(xc-x0)+'px';train.style.left=xc+'px';train.style.top=y+'px'}
function setStop(i){const moved=i!==curI;curI=i;visited.add(S.stops[i].route);G.store.set('visited',JSON.stringify([...visited]));if(i)G.store.set('last',S.stops[i].route);
  stops.forEach((s,k)=>{s.classList.toggle('on',k===i);s.classList.toggle('v',visited.has(S.stops[k].route))});
  if(moved){train.classList.remove('go');void train.offsetWidth;train.classList.add('go')}place();
  const st=S.stops[i];menuBtn.querySelector('b').textContent=i?G.pad(i):'起點';menuBtn.querySelector('span').textContent=st.zone?S.zones[st.zone].name:st.label}
stops.forEach((a,i)=>{a.addEventListener('mouseenter',()=>{const st=S.stops[i];$('small',tip).textContent=G.stopNo(i);$('b',tip).textContent=st.zone?S.zones[st.zone].name:st.label;
    $('span',tip).textContent=st.zone?S.zones[st.zone].cap:st.sub;tip.style.setProperty('--c',st.zone?G.COL[st.zone]:'#ffcc00');
    const r=route.getBoundingClientRect(),d=a.getBoundingClientRect();tip.style.left=Math.min(r.width-150,Math.max(150,d.left-r.left+d.width/2))+'px';tip.classList.add('on')});
  a.addEventListener('mouseleave',()=>tip.classList.remove('on'))});
menuBtn.onclick=()=>{route.classList.toggle('open');menuBtn.classList.toggle('x')};
route.addEventListener('click',e=>{if(e.target.closest('a')){route.classList.remove('open');menuBtn.classList.remove('x')}});
// B: the phone menu also closes on a tap outside it
document.addEventListener('pointerdown',e=>{if(route.classList.contains('open')&&!route.contains(e.target)&&!menuBtn.contains(e.target)){route.classList.remove('open');menuBtn.classList.remove('x')}});
/* B: back to the top on long pages (appears after about one and a half screens) */
const topBtn=h('button','to-top','↑',document.body);topBtn.type='button';topBtn.setAttribute('aria-label','回到頂端');topBtn.onclick=()=>window.scrollTo({top:0,behavior:G.reduced?'auto':'smooth'});
let tb=false;window.addEventListener('scroll',()=>{const on=scrollY>innerHeight*1.5;if(on!==tb){tb=on;topBtn.classList.toggle('on',on)}},{passive:true});
window.addEventListener('resize',place);
/* ---------- router ---------- */
function parse(hash){hash=hash||'#/';let m;
  if(hash==='#/'||hash==='#'||hash==='')return {page:'home',route:'#/'};
  if((m=/^#\/zone\/([1-4])$/.exec(hash)))return {page:'zone',param:m[1],route:hash};
  m=/^#\/(phase|control|aids|insp|film|making)$/.exec(hash);if(m)return {page:m[1],route:hash};
  if(hash==='#/about')return {page:'making',route:'#/making'};
  return {page:'home',route:'#/'}}
let cur=null,token=0;const ctx={intro:null};
async function go(){
  const r=parse(location.hash);const my=++token;
  const wipe=!!cur&&!ctx.noWipe&&cur.route!==r.route;ctx.noWipe=false;
  const fi=cur?G.idx(cur.route):-1,ti=G.idx(r.route),dir=ti>=fi?1:-1;
  if(cur){setStop(ti);
    if(wipe)await G.Wipe.cover(dir,r.route);                         // panel sweeps in, destination title rises
    else{cur.el.classList.add('leaving');await G.wait(260)}
    if(my!==token)return;
    if(cur.destroy)cur.destroy();cur.el.remove()}
  const p=G.pages[r.page](r.param,ctx);view.appendChild(p.el);window.scrollTo(0,0);cur=p;cur.route=r.route;setStop(ti);
  document.title=(r.page==='home'?'':G.titleOf(r.route).split('　')[0]+'｜')+'花蓮機場施工導覽';
  if(wipe)G.Wipe.reveal(dir);                                         // panel sweeps out the same way
  if(p.enter)p.enter();G.reveal(p.el);
  setTimeout(()=>{if(my===token)prefetch(ti+1)},2500);                // B: warm up the next stop's first pictures
  $$('[data-replay-intro]',p.el).forEach(a=>a.onclick=e=>{e.preventDefault();G.Intro({short:false})});
}
/* B (2026-10-10): fetch the first pictures of the next stop at low priority, so the next page starts without waiting */
const warm=new Set();
function prefetch(i){const st=S.stops[i],A=window.ASSETS;if(!st||!A||warm.has(i))return;warm.add(i);let L=[];
  if(st.zone){const H=A.hero[st.zone];if(H.mp4){L=[H.frames[0]];if(!G.narrow())fetch(H.mp4,{priority:'low'}).catch(()=>{})}   // the zone video itself (not on phones: data)
    else L=H.frames.filter((_,k)=>!G.narrow()||k%2===0).slice(0,24)}
  else if(st.route==='#/phase')L=[...new Set(S.phase.slice(0,2).flatMap(p=>p.img))].map(k=>A.phase[k].img);
  else if(st.route==='#/control')L=[A.control.barrier,A.control.taxiway].flatMap(m=>m.mp4?[m.frames[0]]:m.frames.slice(0,8));
  else if(st.route==='#/aids')L=[A.aids.circuits.r1,A.aids.circuits.r3,A.aids.circuits.all1];
  else if(st.route==='#/film')L=A.film.chap.chapters.map(c=>c.thumb).filter(Boolean);
  L.forEach(s=>{const im=new Image();try{im.fetchPriority='low'}catch(e){}im.decoding='async';im.src=s})}
window.addEventListener('hashchange',go);
/* ---------- keyboard: ← → previous / next stop (viewers on screen take the arrows first and call preventDefault) ---------- */
G.app={cur:()=>cur};
const toast=G.toast=msg=>{const t=h('div','toast',msg,document.body);setTimeout(()=>t.classList.add('on'),20);setTimeout(()=>{t.classList.remove('on');setTimeout(()=>t.remove(),400)},2600)};
window.addEventListener('keydown',e=>{if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey)return;const t=e.target;if(t&&/^(INPUT|TEXTAREA|VIDEO|SELECT)$/.test(t.tagName))return;
  if(e.key==='p'||e.key==='P'){const on=!document.body.classList.contains('present');document.body.classList.toggle('present',on);
    try{if(on&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});else if(!on&&document.fullscreenElement)document.exitFullscreen()}catch(_){}
    toast(on?'簡報模式：← → 換站，P 離開':'已離開簡報模式');setTimeout(place,400);return}
  if(/^[0-9]$/.test(e.key)){const j=+e.key;if(j<S.stops.length&&j!==curI)location.hash=S.stops[j].route;return}   // B: 0 = home, 1-9 = that stop
  if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;const j=curI+(e.key==='ArrowRight'?1:-1);
  if(j>=0&&j<S.stops.length)location.hash=S.stops[j].route});
/* ---------- ? = keyboard help (B 2026-10-10) ---------- */
let helpBox=null;
function help(){if(helpBox){helpBox.classList.remove('on');const b=helpBox;helpBox=null;setTimeout(()=>b.remove(),300);return}
  helpBox=h('div','help',`<div class="hb"><h3>快捷鍵</h3><dl>
    <dt><kbd>→</kbd> <kbd>←</kbd></dt><dd>下一站／上一站（畫面上有步驟切換時，先切換步驟）</dd>
    <dt><kbd>0</kbd>～<kbd>9</kbd></dt><dd>直接跳到第幾站（0 回首頁）</dd>
    <dt><kbd>P</kbd></dt><dd>簡報模式（全螢幕，滑鼠不動時游標自動隱藏；再按一次離開）</dd>
    <dt><kbd>Esc</kbd></dt><dd>關閉放大圖、片頭或這個說明</dd>
    <dt><kbd>?</kbd></dt><dd>顯示／關閉這個說明</dd></dl><p>手機與平板：左右滑動畫面切換步驟，點右上角按鈕看全部站點。</p></div>`,document.body);
  helpBox.onclick=help;setTimeout(()=>helpBox&&helpBox.classList.add('on'),20)}
window.addEventListener('keydown',e=>{const t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;
  if(e.key==='?'||(e.key==='/'&&e.shiftKey)){e.preventDefault();help()}else if(e.key==='Escape'&&helpBox){e.preventDefault();help()}});
/* B: presentation mode hides the pointer after 2.5 s without movement */
let idleT=null;document.addEventListener('mousemove',()=>{document.body.classList.remove('idle');clearTimeout(idleT);
  if(document.body.classList.contains('present'))idleT=setTimeout(()=>document.body.classList.add('idle'),2500)},{passive:true});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)document.body.classList.remove('present');setTimeout(place,300)});
/* ---------- boot ---------- */
if(parse(location.hash).page==='home')ctx.intro=G.Intro({short:G.store.get('introSeen')==='1'});
go();
})();
