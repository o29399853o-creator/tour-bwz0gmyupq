/* Page transition (top-bar tour line / next stop / keyboard). A dark panel sweeps across the page area in the direction of
   travel (forward = left to right, back = right to left). Its leading edge is the glowing yellow "pen" of the opening,
   followed by the four work-zone colour stripes. While the page is covered: "第 NN 站", the destination title rises
   character by character and a small runway draws under it (the destination zone lights up). Reduced-motion: no panel. */
(function(){
'use strict';
const {h,el,$,$$,tween,ease,L,COL}=G;const S=window.SITE;
const w=h('div','',`<div class="pn"><div class="stripes"><i></i><i></i><i></i><i></i></div><div class="edge"></div>
  <div class="lb"><small class="idx"></small><h2></h2><p></p><svg viewBox="0 0 420 34"></svg></div></div>`,document.body);w.id='wipe';
const pn=$('.pn',w),h2=$('h2',w),sub=$('p',w),idx=$('.idx',w),svg=$('svg',w);
$$('.stripes i',w).forEach((s,i)=>s.style.background=COL[i+1]);
const EASE='cubic-bezier(.75,0,.25,1)';
let state='idle',seq=0;
function place(x,ms){pn.style.transition=ms?`transform ${ms}ms ${EASE}`:'none';pn.style.transform=`translateX(${x}%)`}
function label(route){
  const m=/#\/zone\/(\d)/.exec(route);const zi=m?+m[1]:0;const i=G.idx(route);
  const [name,cap]=(G.titleOf(route)+'　').split('　');
  idx.textContent=i>=0?G.stopNo(i):'';h2.textContent=name;sub.textContent=cap||'';
  h2.style.setProperty('--zc',zi?COL[zi]:'#ffcc00');
  h2.classList.remove('on');const show=G.chars(h2,32);
  // small runway: outline draws, destination zone (or all zones on the other pages) fills in
  svg.innerHTML='';const X0=10,X1=410,T=8,B=26,sx=s=>X0+(X1-X0)*s/L;
  const fills=[],O={sx,TOP:T,BOT:B,RY:(T+B)/2,HI:(B-T)/2-5,SD:5};
  el('path',{d:G.runwayOutline(X0,X1,O).d,fill:'rgba(255,255,255,.04)'},svg);   // zones 1 / 2 hammer-shaped
  for(let k=1;k<=4;k++){const z=S.zones[k];if(zi&&!(zi<=2?[1,2]:[zi]).includes(k))continue;/* zones 1, 2: one stop since 2026-10-16 */const zx=sx(z.span[0]),zw=sx(z.span[1])-zx;
    G.zoneRects(z,O).forEach(r=>fills.push({r:el('rect',{x:r.x,y:r.y,width:0,height:r.h,fill:COL[k],opacity:zi?1:.75},svg),w:r.w,o:r.x-zx,zw}))}   // zone 3 with its taxiway mouths
  const OL=G.runwayOutline(X0,X1,O),len=OL.len;const ol=el('path',{d:OL.d,fill:'none',stroke:'#ffcc00','stroke-width':1.6,'stroke-dasharray':len,'stroke-dashoffset':len},svg);
  return ()=>{show();tween(520,k=>ol.setAttribute('stroke-dashoffset',len*(1-k)),ease.io);
    setTimeout(()=>tween(420,k=>fills.forEach(f=>f.r.setAttribute('width',Math.max(0,Math.min(f.w,f.zw*k-f.o)))),ease.out),200)};
}
G.Wipe={
  /* cover the page area; resolves when the destination label has been shown.
     state: idle -> covering -> covered -> revealing -> idle; a new request while revealing pulls the panel back. */
  cover(dir,route){
    if(G.reduced)return Promise.resolve();
    const my=++seq;const start=label(route);
    if(state==='covered'){start();return G.wait(380)}
    if(state==='idle'){w.classList.add('on');w.classList.toggle('rev',dir<0);place(dir>0?-104:104,0);void pn.offsetWidth}
    state='covering';place(0,440);
    return new Promise(res=>setTimeout(()=>{if(my===seq)state='covered';start();setTimeout(res,430)},450));
  },
  /* sweep out the same way */
  reveal(dir){
    if(G.reduced)return Promise.resolve();
    const my=++seq;state='revealing';place(dir>0?104:-104,520);
    return new Promise(res=>setTimeout(()=>{if(my===seq){w.classList.remove('on');state='idle'}res()},540));
  }
};
})();
