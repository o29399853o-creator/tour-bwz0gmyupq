/* core helpers shared by every page. Animations run on timers (requestAnimationFrame never fires in some embedded panes). */
(function(){
'use strict';
const G=window.G={};
G.$=(s,r)=>(r||document).querySelector(s);
G.$$=(s,r)=>[...(r||document).querySelectorAll(s)];
G.NS='http://www.w3.org/2000/svg';
G.el=(tag,attrs,parent)=>{const e=document.createElementNS(G.NS,tag);for(const k in attrs||{})e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e};
G.svgText=(parent,x,y,s,attrs)=>{const t=G.el('text',Object.assign({x,y,fill:'#dfe6ee','font-size':14,'font-family':'Microsoft JhengHei'},attrs||{}),parent);t.textContent=s;return t};
G.h=(tag,cls,html,parent)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;if(parent)parent.appendChild(e);return e};
/* touch screens (no hover): hover hints and keyboard hints are replaced or hidden */
G.touch=(()=>{try{return matchMedia('(hover: none)').matches}catch(e){return false}})();
if(G.touch)document.documentElement.classList.add('touch');
/* phones: diagrams drawn for about 1000 px get narrower drawings or bigger lettering (checked when a diagram is built) */
G.narrow=()=>innerWidth<820;
G.stacked=()=>innerWidth<=1100;   // the two-column blocks (picture + side panel) are stacked at this width (css @media 1100px)
G.reduced=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}})();
G.tick=cb=>setTimeout(()=>cb(performance.now()),16);
G.ease={lin:t=>t,out:t=>1-Math.pow(1-t,3),io:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,
  back:t=>{const c=1.9;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}};
/* tween(ms, fn(k), easing, done) -> cancel() */
G.tween=(dur,fn,e,done)=>{let dead=false;if(G.reduced)dur=1;const t0=performance.now();
  const f=()=>{if(dead)return;const t=Math.min(1,(performance.now()-t0)/dur);fn((e||G.ease.out)(t));if(t<1)G.tick(f);else if(done)done()};G.tick(f);return()=>{dead=true}};
G.wait=ms=>new Promise(r=>setTimeout(r,G.reduced?0:ms));
G.store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
/* wrap every character of an element in a span; .chars.on animates them in one after another */
G.chars=(el,step)=>{const s=el.textContent;el.classList.add('chars');el.innerHTML=[...s].map((c,i)=>`<span style="transition-delay:${i*(step||45)}ms">${c===' '?'&nbsp;':c}</span>`).join('');
  return ()=>el.classList.add('on')};
/* run fn once when el scrolls into view. B (2026-10-10): if the IntersectionObserver never reports (some embedded / background
   views), a position check takes over, so content never stays hidden */
G.onView=(el,fn,th)=>{let done=false,heard=false,seen=false;const run=()=>{if(!done){done=true;fn()}};
  if(!('IntersectionObserver' in window)){run();return}
  const io=new IntersectionObserver((en,o)=>{heard=true;if(en[0].isIntersecting){o.disconnect();run()}},{threshold:th==null?.25:th});io.observe(el);
  const poll=()=>{if(done||heard||(seen&&!el.isConnected))return;   // stops once the page is gone
    if(el.isConnected){seen=true;const r=el.getBoundingClientRect();if(r.width&&r.bottom>innerHeight*.05&&r.top<innerHeight*.95){io.disconnect();run();return}}
    setTimeout(poll,500)};setTimeout(poll,900);return io};
/* reveal .rv children of root with a stagger when they come into view */
G.reveal=root=>{G.$$('.rv',root).forEach(e=>G.onView(e,()=>setTimeout(()=>e.classList.add('in'),(+e.dataset.d||0)),.08))};
G.countUp=(el,to,dur)=>G.tween(dur||1400,k=>{el.textContent=Math.round(to*k).toLocaleString('en-US')},G.ease.out);
/* is the element mostly on screen (used by components that answer ← →) */
G.onScreen=el=>{const r=el.getBoundingClientRect();return r.bottom>innerHeight*.25&&r.top<innerHeight*.75};
/* pointer drag: fn(x,y,rect,e) while the button is down */
G.drag=(el,fn,end)=>{let on=false;
  el.addEventListener('pointerdown',e=>{if(e.button!==0)return;on=true;try{el.setPointerCapture(e.pointerId)}catch(_){}fn(e.clientX,e.clientY,el.getBoundingClientRect(),e)});
  el.addEventListener('pointermove',e=>{if(on)fn(e.clientX,e.clientY,el.getBoundingClientRect(),e)});
  const up=()=>{if(on){on=false;if(end)end()}};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)};
/* horizontal swipe on touch screens: cb(+1 | -1) */
G.swipe=(el,cb)=>{let x0=null,y0=0;
  el.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
  el.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;x0=null;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)cb(dx<0?1:-1)},{passive:true})};
/* full-screen picture with caption; the backdrop, × or Esc closes.
   B (2026-10-10): click / tap the picture to magnify 2.5x at that spot, move to look around, click again to go back */
G.lightbox=(src,cap)=>{const b=G.h('div','lbox',`<figure><div class="lz"><img src="${src}" alt=""></div><figcaption>${cap||''}<small>點圖片可放大</small></figcaption></figure><button aria-label="關閉">×</button>`,document.body);
  const close=()=>{b.classList.add('out');document.removeEventListener('keydown',k);setTimeout(()=>b.remove(),300)};
  const k=e=>{if(e.key==='Escape'){e.preventDefault();close()}};document.addEventListener('keydown',k);
  const z=b.querySelector('.lz'),im=z.querySelector('img');let on=false;
  const at=e=>{const r=z.getBoundingClientRect();im.style.transformOrigin=`${(e.clientX-r.left)/r.width*100}% ${(e.clientY-r.top)/r.height*100}%`};
  z.onclick=e=>{e.stopPropagation();on=!on;at(e);z.classList.toggle('zoom',on)};
  z.addEventListener('pointermove',e=>{if(on)at(e)});
  b.onclick=close;setTimeout(()=>b.classList.add('on'),20)};
/* runway geometry (STA, metres) */
G.L=2755.244;G.E1=512.65;G.E2=2238.384;
G.COL={1:'#d92e26',2:'#3373f2',3:'#f2bf1a',4:'#33b359'};
/* zone shapes on the schematic runway drawings (home map, opening, zone strip, page transition).
   o = {sx, TOP, BOT, RY, HI, SD}: TOP / BOT = outer edges of the 15 m widening, RY ± HI = runway edges, SD = widening width in px.
   Zone 3 also takes in the taxiway mouths (SITE.zones[3].mouths), drawn outward from the widening at the same scale across. */
G.zoneRects=(z,o)=>{const k=o.SD/15,r=[];
  const P=z.part==='full'?[[o.TOP,o.BOT]]:z.part==='sides'?[[o.TOP,o.RY-o.HI],[o.RY+o.HI,o.BOT]]:[[o.RY-o.HI,o.RY+o.HI]];
  P.forEach(([a,b])=>r.push({x:o.sx(z.span[0]),y:a,w:o.sx(z.span[1])-o.sx(z.span[0]),h:b-a}));
  if(z.head){const x=o.sx(z.head[0]),w=o.sx(z.head[1])-x;   // zones 1 / 2: the hammer head, both sides of the runway width
    r.push({x,y:o.TOP,w,h:o.RY-o.HI-o.TOP,head:1},{x,y:o.RY+o.HI,w,h:o.BOT-o.RY-o.HI,head:1})}
  (z.mouths||[]).forEach(([s0,s1,side,m])=>{const h=m*k;r.push({x:o.sx(s0),y:side<0?o.TOP-h:o.BOT,w:o.sx(s1)-o.sx(s0),h,mouth:side})});
  return r};
/* the runway outline with the taxiway mouths bumped out; {d, len} for the dash-drawn pen line. 2026-10-11: the runway width (RY±HI) at
   both ends, the full width (TOP..BOT) from the zone-1 head to the zone-2 head, so zones 1 / 2 read as hammers */
G.runwayOutline=(X0,X1,o)=>{const Z=window.SITE.zones,ms=G.zoneRects(Z[3],o).filter(r=>r.mouth);
  const a=Z[1].head?o.sx(Z[1].head[0]):X0,b=Z[2].head?o.sx(Z[2].head[1]):X1,t=o.RY-o.HI,u=o.RY+o.HI;
  let d=`M${X0},${t} H${a} V${o.TOP}`,len=2*(X1-X0)+2*(u-t)+2*(t-o.TOP)+2*(o.BOT-u);
  ms.filter(r=>r.mouth<0).sort((p,q)=>p.x-q.x).forEach(r=>{d+=` H${r.x} V${r.y} H${r.x+r.w} V${o.TOP}`;len+=2*r.h});d+=` H${b} V${t} H${X1} V${u} H${b} V${o.BOT}`;
  ms.filter(r=>r.mouth>0).sort((p,q)=>q.x-p.x).forEach(r=>{d+=` H${r.x+r.w} V${r.y+r.h} H${r.x} V${o.BOT}`;len+=2*r.h});return {d:d+` H${a} V${u} H${X0} Z`,len}};
G.fmtSTA=s=>`${Math.floor(s/1000)}K+${String(Math.round(s)%1000).padStart(3,'0')}`;
G.fmtSTAx=s=>{const k=Math.floor(s/1000),r=+(s-k*1000).toFixed(3);const [i,d]=String(r).split('.');return `${k}K+${i.padStart(3,'0')}${d?'.'+d:''}`};
G.fmtT=s=>{s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
G.pad=n=>String(n).padStart(2,'0');
/* top-view airliner pointing +x (about 72 x 62 units), used by the home map and the light demos */
G.PLANE='M36,0 C34,-3 30,-3.5 26,-3.5 L6,-3.5 L-10,-31 L-17,-31 L-8,-3.5 L-26,-3.5 L-33,-13 L-38,-13 L-34,-2 L-36,0 L-34,2 L-38,13 L-33,13 L-26,3.5 L-8,3.5 L-17,31 L-10,31 L6,3.5 L26,3.5 C30,3.5 34,3 36,0 Z';
})();
