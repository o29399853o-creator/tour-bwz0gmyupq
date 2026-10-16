/* The runway: one drawing used as the home map (G.Hub, also the location map on the control page) and the zone-page strip (G.ZoneStrip).
   Lengths to scale along the runway (STA 0 ~ 2755.244 m); widths exaggerated (schematic). Top = west (v-, taxiway 2 side; the runway heads 026° so with 03 on the left the west side is up), bottom = east (v+). */
(function(){
'use strict';
const {el,svgText:T,tween,ease,L,E1,E2,COL}=G;
const SITE=window.SITE;
/* taxiways 2-4 leaving the zone-3 mouths: short grey stubs fading out (context only, like the photo of the pink stickers) */
function twyStubs(g,o,len,gid){const defs=g.ownerSVGElement.querySelector('defs');
  [['U',1,0],['D',0,1]].forEach(([n,a,b])=>{const lg=el('linearGradient',{id:gid+n,x1:0,y1:0,x2:0,y2:1},defs);
    el('stop',{offset:0,'stop-color':'#2a323c','stop-opacity':a},lg);el('stop',{offset:1,'stop-color':'#2a323c','stop-opacity':b},lg)});
  G.zoneRects(SITE.zones[3],o).filter(r=>r.mouth).forEach(r=>el('rect',{x:r.x,y:r.mouth<0?r.y-len:r.y+r.h,width:r.w,height:len,fill:`url(#${gid}${r.mouth<0?'D':'U'})`,'pointer-events':'none'},g))}

/* ================= home map ================= */
G.Hub=function(svg,opt){
  opt=opt||{};const W=1600,H=560,X0=110,X1=1490,RY=262,HI=46,SD=26,TOP=RY-HI-SD,BOT=RY+HI+SD;
  const sx=s=>X0+(X1-X0)*s/L;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.innerHTML='';
  const defs=el('defs',{},svg);
  const gl=el('filter',{id:'hubGlow',x:'-20%',y:'-200%',width:'140%',height:'500%'},defs);el('feGaussianBlur',{stdDeviation:6,result:'b'},gl);
  const gm=el('feMerge',{},gl);el('feMergeNode',{in:'b'},gm);el('feMergeNode',{in:'SourceGraphic'},gm);
  const dg=el('filter',{id:'dotGlow',x:'-300%',y:'-300%',width:'700%',height:'700%'},defs);el('feGaussianBlur',{stdDeviation:3,result:'b'},dg);
  const dm=el('feMerge',{},dg);el('feMergeNode',{in:'b'},dm);el('feMergeNode',{in:'SourceGraphic'},dm);
  const sh=el('linearGradient',{id:'hubShine',x1:0,y1:0,x2:0,y2:1},defs);el('stop',{offset:0,'stop-color':'#fff','stop-opacity':.16},sh);el('stop',{offset:.45,'stop-color':'#fff','stop-opacity':0},sh);
  const ht=el('pattern',{id:'hubHatch',width:12,height:12,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},defs);
  el('rect',{width:12,height:12,fill:'rgba(217,46,38,.16)'},ht);el('line',{x1:0,y1:0,x2:0,y2:12,stroke:'rgba(255,90,80,.75)','stroke-width':3},ht);
  const clip=el('clipPath',{id:'hubReveal'},defs);const rv=el('rect',{x:X0-12,y:0,width:0,height:H},clip);
  const world=el('g',{},svg);
  function hover(node,i){if(!opt.onHover)return;node.addEventListener('mousemove',e=>opt.onHover(i,e.clientX,e.clientY));node.addEventListener('mouseleave',()=>opt.onHover(0))}
  const g=el('g',{'clip-path':'url(#hubReveal)'},world);
  const O={sx,TOP,BOT,RY,HI,SD};
  el('path',{d:G.runwayOutline(X0,X1,O).d,fill:'#18202a'},g);   // the runway: narrower at both ends (zones 1 / 2 hammers)
  twyStubs(g,O,34,'hubTwy');
  // taxiway numbers above the west stubs (the east stubs run into the zone cards)
  G.zoneRects(SITE.zones[3],O).filter(r=>r.mouth<0).forEach((r,k)=>{const x=r.x+r.w/2,y=r.y-48;
    el('circle',{cx:x,cy:y,r:13,fill:'#0d131a',stroke:'#93a3b3','stroke-width':1.5,'pointer-events':'none'},g);
    T(g,x,y+5,String(k+2),{fill:'#dfe6ee','font-size':15,'font-weight':700,'text-anchor':'middle','pointer-events':'none'});
    T(g,x+19,y+5,'號聯絡道',{fill:'#93a3b3','font-size':14,'pointer-events':'none'})});
  const zones=[];
  for(let i=1;i<=4;i++){const z=SITE.zones[i];const zg=el('g',{class:'zone'},g);
    G.zoneRects(z,O).forEach(r=>{el('rect',{x:r.x,y:r.y,width:r.w,height:r.h,fill:COL[i]},zg);el('rect',{x:r.x,y:r.y,width:r.w,height:r.h,fill:'url(#hubShine)'},zg)});
    zg.style.transformBox='fill-box';zg.style.transformOrigin=i===2?'right center':'left center';zg.style.transform='scaleX(0)';
    zg.style.transition='transform .8s cubic-bezier(.3,.9,.3,1),opacity .45s';
    zg.addEventListener('click',()=>opt.onZone&&opt.onZone(i));hover(zg,i);zones.push(zg);
    if(!opt.still){zg.setAttribute('tabindex',0);zg.setAttribute('role','link');zg.setAttribute('aria-label',`${z.name}　${z.cap}`);   // keyboard: Tab to a zone, Enter opens it
      zg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();opt.onZone&&opt.onZone(i)}})}}
  for(let x=X0+80;x<X1-80;x+=72)el('line',{x1:x,y1:RY,x2:Math.min(x+36,X1-80),y2:RY,stroke:'#fff','stroke-width':3,opacity:.85,'pointer-events':'none'},g);
  for(const xa of [X0+10,X1-32])for(let i=0;i<8;i++){const yy=RY-44.5+i*11+(i>=4?6:0);el('rect',{x:xa,y:yy,width:22,height:6,fill:'#fff',opacity:.9,'pointer-events':'none'},g)}   // inside the runway width
  for(const sta of [400,L-400])for(const yy of [RY-34,RY+25])el('rect',{x:sx(sta)-14,y:yy,width:28,height:9,fill:'#fff',opacity:.85,'pointer-events':'none'},g);
  T(g,X0+54,RY,'03',{fill:'#fff','font-size':40,'font-weight':700,'text-anchor':'middle','dominant-baseline':'central',transform:`rotate(90 ${X0+54} ${RY})`,'pointer-events':'none'});
  T(g,X1-54,RY,'21',{fill:'#fff','font-size':40,'font-weight':700,'text-anchor':'middle','dominant-baseline':'central',transform:`rotate(-90 ${X1-54} ${RY})`,'pointer-events':'none'});
  const plane=el('g',{opacity:0,'pointer-events':'none'},world);const ps=el('g',{},plane),pb=el('g',{},plane);
  el('path',{d:G.PLANE,fill:'rgba(0,0,0,.5)'},ps);el('path',{d:G.PLANE,fill:'#eef3f8',stroke:'#6f7f8e','stroke-width':1.2},pb);
  const OL=G.runwayOutline(X0,X1,O),len=OL.len;   // the pen also traces the zone-3 taxiway mouths
  const outline=el('path',{d:OL.d,fill:'none',stroke:'#ffcc00','stroke-width':3.5,filter:'url(#hubGlow)','stroke-dasharray':len,'stroke-dashoffset':len,'pointer-events':'none'},world);
  [RY-HI,RY+HI].forEach(y=>el('line',{x1:X0,y1:y,x2:X1,y2:y,stroke:'#ffcc00','stroke-width':1.6,opacity:.45,'clip-path':'url(#hubReveal)','pointer-events':'none'},world));
  const ticks=el('g',{opacity:0,style:'transition:opacity .8s'},world);
  [0,500,1000,1500,2000,2500,L].forEach(s=>{el('line',{x1:sx(s),y1:TOP-6,x2:sx(s),y2:TOP-20,stroke:'#fff',opacity:.5},ticks);T(ticks,sx(s),TOP-28,G.fmtSTA(s),{fill:'#c8d2dc','font-size':16,'text-anchor':'middle'})});
  const pen=el('g',{opacity:0,'pointer-events':'none'},world);
  el('rect',{x:-3,y:TOP-6,width:6,height:BOT-TOP+12,fill:'#ffd76a',filter:'url(#hubGlow)'},pen);
  el('circle',{cx:0,cy:TOP,r:8,fill:'#fff6d8',filter:'url(#hubGlow)'},pen);el('circle',{cx:0,cy:BOT,r:8,fill:'#fff6d8',filter:'url(#hubGlow)'},pen);

  /* ---- B (2026-10-10): station finder. Moving over the runway shows a hairline and the STA there; over a zone-3 mouth also its taxiway ---- */
  const finder=el('g',{opacity:0,'pointer-events':'none',style:'transition:opacity .2s'},world);
  const fl=el('line',{y1:TOP-8,y2:BOT+40,stroke:'#fff','stroke-width':1.5,'stroke-dasharray':'4 4',opacity:.85},finder);
  const fb=el('rect',{y:BOT+40,height:30,rx:8,fill:'rgba(13,19,26,.95)',stroke:'#ffcc00','stroke-width':1.5},finder);   // below the east mouths
  const ft=T(finder,0,BOT+61,'',{fill:'#fff','font-size':17,'text-anchor':'middle','font-weight':700});
  const MO=G.zoneRects(SITE.zones[3],O).filter(r=>r.mouth);
  if(!opt.still)svg.addEventListener('mousemove',e=>{if(layer!=='zones'||zooming)return finder.setAttribute('opacity',0);
    const m=svg.getScreenCTM();if(!m)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());
    const mo=MO.find(r=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y-2&&p.y<=r.y+r.h+2);
    if(p.x<X0||p.x>X1||((p.y<TOP-4||p.y>BOT+4)&&!mo))return finder.setAttribute('opacity',0);
    const s=(p.x-X0)/(X1-X0)*L,k=mo?MO.filter(r=>r.mouth===mo.mouth).indexOf(mo)+2:0;
    ft.textContent='STA '+G.fmtSTA(s)+(mo?`　${k} 號聯絡道口（${mo.mouth<0?'西':'東'}側）`:'');
    const w=ft.getComputedTextLength()+28,x=Math.min(Math.max(p.x,X0+w/2),X1-w/2);
    fl.setAttribute('x1',p.x);fl.setAttribute('x2',p.x);fb.setAttribute('x',x-w/2);fb.setAttribute('width',w);ft.setAttribute('x',x);finder.setAttribute('opacity',1)});
  svg.addEventListener('mouseleave',()=>finder.setAttribute('opacity',0));

  /* ---- layer: zone cards ---- */
  const L_zones=el('g',{},world);const cards=[];
  const ax={1:sx(E1/2),2:sx((E2+L)/2),3:sx(E1+(E2-E1)*.15),4:sx(E1+(E2-E1)*.70)};
  for(let i=1;i<=4;i++){const z=SITE.zones[i];const x=ax[i],y0=z.part==='core'?RY:z.part==='sides'?BOT-SD/2:BOT,y1=BOT+52+z.lvl*84;
    const cg=el('g',{class:'zcard',opacity:0},L_zones);cg.addEventListener('click',()=>opt.onZone&&opt.onZone(i));hover(cg,i);
    el('line',{x1:x,y1:y0,x2:x,y2:y1,stroke:'#fff','stroke-width':2,opacity:.8},cg);el('circle',{cx:x,cy:y0,r:5,fill:'#fff'},cg);
    const ring=el('circle',{cx:x,cy:y0,r:6,fill:'none',stroke:COL[i],'stroke-width':2.5,opacity:0},cg);
    const box=el('g',{},cg);const w=48+z.name.length*30+z.cap.length*26+30,bx=Math.min(Math.max(x-w/2,30),W-30-w);
    el('rect',{class:'box',x:bx,y:y1,width:w,height:54,rx:10,fill:'rgba(13,19,26,.94)',stroke:'#ffcc00','stroke-opacity':.75,'stroke-width':2},box);
    el('rect',{x:bx+2,y:y1+2,width:6,height:50,rx:3,fill:COL[i]},box);el('rect',{x:bx+20,y:y1+17,width:20,height:20,rx:4,fill:COL[i]},box);
    T(box,bx+52,y1+28,z.name,{fill:'#fff','font-size':29,'font-weight':700,'dominant-baseline':'central'});
    T(box,bx+60+z.name.length*30,y1+29,z.cap,{fill:'#e1e8f0','font-size':25,'dominant-baseline':'central'});
    box.style.transformBox='fill-box';box.style.transformOrigin='center';box.style.transform='scale(.2)';box.style.transition='transform .55s cubic-bezier(.2,1.6,.4,1)';
    cards.push({cg,box,ring})}

  /* ---- layer: relocated thresholds (STEP2 / STEP6) ---- */
  const L_relo=el('g',{opacity:0,style:'transition:opacity .4s','pointer-events':'none'},world);const reloItems=[];
  [[1,'03 端封閉施工'],[2,'21 端封閉施工']].forEach(([zi,t])=>{const z=SITE.zones[zi],[a,b]=z.span;   // the closed end: zone 1 / 2 (hammer)
    G.zoneRects(z,O).forEach(q=>reloItems.push(el('rect',{x:q.x,y:q.y,width:q.w,height:q.h,fill:'url(#hubHatch)',opacity:0},L_relo)));
    reloItems.push(T(L_relo,(sx(a)+sx(b))/2,BOT+34,t,{fill:'#ff8a7a','font-size':17,'text-anchor':'middle',opacity:0}))});
  [[712,'STEP2　03 端跑道頭移設','STA 0K+712',-1],[2043,'STEP6　21 端跑道頭移設','STA 2K+043',1]].forEach(([s,a,b,dir])=>{
    const gg=el('g',{opacity:0},L_relo);const x=sx(s);
    el('rect',{x:x-4,y:TOP-8,width:8,height:BOT-TOP+16,fill:'#ffcc00',filter:'url(#hubGlow)'},gg);
    el('line',{x1:x,y1:TOP-8,x2:x,y2:96,stroke:'#ffcc00','stroke-width':2},gg);
    const bw=290,bx=dir<0?x-20:x-bw+20;el('rect',{x:bx,y:44,width:bw,height:56,rx:10,fill:'rgba(13,19,26,.95)',stroke:'#ffcc00','stroke-width':2},gg);
    T(gg,bx+16,68,a,{fill:'#fff','font-size':19,'font-weight':700});T(gg,bx+16,91,b,{fill:'#ffcc00','font-size':16});
    for(let k=0;k<4;k++){const cx=x+dir*(24+k*22);   // chevrons lie in the displaced section before the new threshold, pointing at it
    el('path',{d:`M${cx+dir*8},${RY-14} L${cx-dir*6},${RY} L${cx+dir*8},${RY+14}`,fill:'none',stroke:'#fff','stroke-width':3.5},gg)}
    reloItems.push(gg)});

  /* ---- layer: site controls ---- */
  const L_ctrl=el('g',{opacity:0,style:'transition:opacity .4s','pointer-events':'none'},world);const ctrlItems=[];
  // wood barriers of zone 1: up 24 h (user 2026-10-10); label below the runway
  (function(){const a=sx(-9.35)-6,b=sx(E1)+6,y0=TOP-16,y1=BOT+16;const gg=el('g',{opacity:0},L_ctrl);
    el('rect',{x:a,y:y0,width:b-a,height:y1-y0,rx:4,fill:'none',stroke:'#fff','stroke-width':4,'stroke-dasharray':'10 10'},gg);
    el('rect',{x:a,y:y0,width:b-a,height:y1-y0,rx:4,fill:'none',stroke:'#e0312a','stroke-width':4,'stroke-dasharray':'10 10','stroke-dashoffset':10},gg);
    el('line',{x1:(a+b)/2,y1:y1,x2:(a+b)/2,y2:BOT+56,stroke:'#ff6b5e','stroke-width':2},gg);
    el('rect',{x:a,y:BOT+56,width:360,height:58,rx:10,fill:'rgba(13,19,26,.95)',stroke:'#ff6b5e','stroke-width':2},gg);
    T(gg,a+16,BOT+80,'木製圍籬　工區一（03 端）',{fill:'#fff','font-size':19,'font-weight':700});T(gg,a+16,BOT+104,'24 小時圍設',{fill:'#ff9b90','font-size':16});ctrlItems.push(gg)})();
  // taxiway 2 is on the west (v-) side = top of this drawing: stub, barriers in front of the yellow X, label.
  // Drawn on the taxiway-2 stub beyond the zone-3 mouth (the X itself is out on the taxiway, about STA 0K+629 on drawing D-17-1)
  (function(){const m=SITE.zones[3].mouths[0],x=sx((m[0]+m[1])/2),y0=TOP-m[3]*SD/15;const gg=el('g',{opacity:0},L_ctrl);
    el('rect',{x:x-16,y:TOP-96,width:32,height:y0-(TOP-96),fill:'#2a323c'},gg);
    for(let k=0;k<5;k++)el('rect',{x:x-14+k*6.2,y:TOP-50,width:4,height:12,fill:k%2?'#fff':'#e0312a'},gg);
    el('path',{d:`M${x-12},${TOP-86} L${x+12},${TOP-62} M${x+12},${TOP-86} L${x-12},${TOP-62}`,stroke:'#ffcc00','stroke-width':6,'stroke-linecap':'round'},gg);
    el('line',{x1:x+16,y1:TOP-74,x2:x+70,y2:TOP-74,stroke:'#ffcc00','stroke-width':2},gg);
    el('rect',{x:x+70,y:TOP-106,width:470,height:62,rx:10,fill:'rgba(13,19,26,.95)',stroke:'#ffcc00','stroke-width':2},gg);
    T(gg,x+86,TOP-81,'二號聯絡道封閉　黃色 X＋木製圍籬',{fill:'#fff','font-size':19,'font-weight':700});
    T(gg,x+86,TOP-56,'17:00～21:00 圍設，21:00 撤收供戰機使用',{fill:'#ffcc00','font-size':16});ctrlItems.push(gg)})();
  // cover-plate demonstration section, east (v+) side = bottom
  (function(){const a=sx(770),b=sx(791);const gg=el('g',{opacity:0},L_ctrl);
    el('rect',{x:a-3,y:BOT-SD,width:b-a+6,height:SD,fill:'#c9d2da',stroke:'#fff','stroke-width':1.5},gg);
    el('line',{x1:(a+b)/2,y1:BOT,x2:(a+b)/2+60,y2:BOT+70,stroke:'#fff','stroke-width':2},gg);
    el('rect',{x:(a+b)/2+60,y:BOT+56,width:330,height:52,rx:10,fill:'rgba(13,19,26,.95)',stroke:'#fff','stroke-width':1.5},gg);
    T(gg,(a+b)/2+76,BOT+78,'覆工板示範段（工區三東側）',{fill:'#fff','font-size':18,'font-weight':700});T(gg,(a+b)/2+76,BOT+100,'STA 0K+770～0K+791　70 片',{fill:'#c9d2da','font-size':15});ctrlItems.push(gg)})();

  /* ---- layer: navaids ---- */
  const L_aids=el('g',{opacity:0,style:'transition:opacity .4s','pointer-events':'none'},world);const dots=[];
  // edge lights: 39 per side for the 99 on drawings E-11~E-18; the 21 nearest each end are yellow / white (yellow face towards the middle)
  const N=39,NY=Math.round(N*21/99);for(let k=0;k<N;k++){const x=X0+20+(X1-X0-40)*k/(N-1),yw=k<NY?1:k>=N-NY?-1:0;
    [RY-HI,RY+HI].forEach(y=>{const gg=el('g',{transform:`translate(${x},${y})`},L_aids);
      const parts=yw?[[el('path',{d:`M0,-5.5 A5.5,5.5 0 0 ${yw>0?1:0} 0,5.5 Z`,fill:'#39424c'},gg),'#ffc53d'],[el('path',{d:`M0,-5.5 A5.5,5.5 0 0 ${yw>0?0:1} 0,5.5 Z`,fill:'#39424c'},gg),'#f4f8ff']]
        :[[el('circle',{r:5.5,fill:'#39424c'},gg),'#f4f8ff']];dots.push({g:gg,parts,x})})}
  [[X0,-1],[X1,1]].forEach(([x,s])=>{for(let k=-4;k<=4;k++){el('circle',{cx:x+s*5,cy:RY+k*11,r:4,fill:'#3ecf8e',filter:'url(#dotGlow)'},L_aids);el('circle',{cx:x-s*5,cy:RY+k*11,r:4,fill:'#ff4d4d',filter:'url(#dotGlow)'},L_aids)}});
  for(let k=0;k<26;k++){const x=X0+30+(X1-X0-60)*k/25;[TOP-10,BOT+10].forEach(y=>el('rect',{x:x-4,y:y-4,width:8,height:8,fill:'none',stroke:'#93a3b3','stroke-width':1.5},L_aids))}
  const aidLabels=el('g',{opacity:0,style:'transition:opacity .5s'},L_aids);
  [[X0+300,40,'跑道邊燈　R1 100＋R3 98 盞交錯；每側兩端各 21 盞黃/白','#ffc53d',RY-HI],[X0+40,BOT+70,'跑道頭末端燈　綠光朝進場航機、紅光朝跑道','#3ecf8e',RY+40],[X1-560,BOT+70,'助航燈光手孔 195 座（跑道兩側）','#93a3b3',BOT+10]].forEach(([x,y,t,c,ty])=>{
    const w=t.length*17+36;el('rect',{x,y,width:w,height:46,rx:10,fill:'rgba(13,19,26,.95)',stroke:c,'stroke-width':1.6},aidLabels);T(aidLabels,x+18,y+29,t,{fill:'#fff','font-size':17})});

  const layers={zones:L_zones,relo:L_relo,ctrl:L_ctrl,aids:L_aids};let layer='zones',vb=[0,0,W,H],stopZ=null,alive=true,planeT=null,zooming=false;
  function fly(){if(!alive)return;if(layer!=='zones'||zooming||document.hidden){planeT=setTimeout(fly,3000);return}
    const xa=X0-300,xt=X0+250,xb=X0+820;plane.setAttribute('opacity',1);
    const put=(x,alt)=>{pb.setAttribute('transform',`translate(${x},${RY}) scale(${.9+.55*alt})`);ps.setAttribute('transform',`translate(${x+alt*46},${RY+alt*70}) scale(${.9+.2*alt})`);ps.setAttribute('opacity',1-.55*alt)};
    tween(2600,k=>put(xa+(xt-xa)*k,1-k),ease.lin,()=>tween(2400,k=>put(xt+(xb-xt)*k,0),ease.out,()=>tween(600,k=>plane.setAttribute('opacity',1-k),ease.lin,()=>{planeT=setTimeout(fly,9000+Math.random()*5000)})))}
  world.appendChild(finder);   // station finder above everything else
  const self={
    enter(fast){const D=fast?600:1500;
      const t0=performance.now();
      tween(D,k=>{const px=X0+(X1-X0)*k;rv.setAttribute('width',px-X0+24);outline.setAttribute('stroke-dashoffset',len*(1-k));pen.setAttribute('transform',`translate(${px},0)`);pen.setAttribute('opacity',k<1?1:0)},ease.io,()=>pen.setAttribute('opacity',0));
      setTimeout(()=>ticks.setAttribute('opacity',1),D*.3);
      zones.forEach((zg,i)=>setTimeout(()=>zg.style.transform='scaleX(1)',D+i*(fast?90:260)));
      cards.forEach((c,i)=>setTimeout(()=>{c.cg.setAttribute('opacity',1);c.box.style.transform='scale(1)';
        tween(700,k=>{c.ring.setAttribute('r',6+26*k);c.ring.setAttribute('opacity',1-k)})},D+250+i*(fast?90:260)));
      if(!opt.still)planeT=setTimeout(fly,D+2600);
      return G.wait(D+(fast?600:1400))},
    destroy(){alive=false;clearTimeout(planeT)},
    show(){outline.setAttribute('stroke-dashoffset',0);rv.setAttribute('width',X1-X0+30);ticks.setAttribute('opacity',1);zones.forEach(z=>z.style.transform='scaleX(1)');
      cards.forEach(c=>{c.cg.setAttribute('opacity',1);c.box.style.transform='scale(1)'})},
    setLayer(name){if(name===layer)return;layer=name;
      L_zones.style.transition='opacity .35s';L_zones.style.opacity=name==='zones'?1:0;L_zones.style.pointerEvents=name==='zones'?'auto':'none';
      ['relo','ctrl','aids'].forEach(k=>layers[k].setAttribute('opacity',k===name?1:0));
      zones.forEach(z=>z.style.opacity=name==='zones'?1:.35);
      const pop=(items)=>items.forEach((it,i)=>{it.setAttribute('opacity',0);setTimeout(()=>{if(layer!==name)return;tween(450,k=>it.setAttribute('opacity',k))},120+i*170)});
      if(name==='relo')pop(reloItems);
      if(name==='ctrl')pop(ctrlItems);
      if(name==='aids'){aidLabels.setAttribute('opacity',0);dots.forEach(d=>{d.parts.forEach(([p])=>p.setAttribute('fill','#39424c'));d.g.removeAttribute('filter')});
        dots.forEach(d=>setTimeout(()=>{if(layer!=='aids')return;d.parts.forEach(([p,c])=>p.setAttribute('fill',c));d.g.setAttribute('filter','url(#dotGlow)')},120+(d.x-X0)/(X1-X0)*900));
        setTimeout(()=>{if(layer==='aids')aidLabels.setAttribute('opacity',1)},900)}},
    zoomTo(i){zooming=true;plane.setAttribute('opacity',0);return new Promise(res=>{const z=SITE.zones[i];const a=sx(z.span[0]),b=sx(z.span[1]);const pad=(b-a)*.12+30;
      const w=Math.max(b-a+2*pad,360),h=w*H/W,to=[(a+b)/2-w/2,RY-h/2,w,h],from=vb.slice();
      zones.forEach((zg,k)=>zg.style.opacity=k===i-1?1:.15);L_zones.style.opacity=0;ticks.setAttribute('opacity',0);
      if(stopZ)stopZ();stopZ=tween(780,k=>{vb=from.map((v,j)=>v+(to[j]-v)*k);svg.setAttribute('viewBox',vb.join(' '))},ease.io,res)})}};
  return self;
};

/* ================= zone strip (zone page header) ================= */
G.ZoneStrip=function(svg,zi){
  const zs=[].concat(zi);   // 2026-10-16: one zone, or several (the merged zone 1 + 2 page)
  // about 1.3 drawing units per screen pixel on phones (the page is not in the document yet, so the window width is used)
  const W=innerWidth<820?Math.max(440,Math.round((innerWidth-32)*1.3)):1320,H=96,X0=24,X1=W-24,RY=52,HI=11,SD=7,TOP=RY-HI-SD,BOT=RY+HI+SD;const sx=s=>X0+(X1-X0)*s/L;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.innerHTML='';
  const O={sx,TOP,BOT,RY,HI,SD};
  el('path',{d:G.runwayOutline(X0,X1,O).d,fill:'#18202a'},svg);
  for(let i=1;i<=4;i++){const z=SITE.zones[i];G.zoneRects(z,O).forEach(r=>el('rect',{x:r.x,y:r.y,width:r.w,height:r.h,fill:COL[i],opacity:zs.includes(i)?0:.16},svg))}
  const parts=[];zs.forEach(q=>{const z=SITE.zones[q],zx=sx(z.span[0]),zw=sx(z.span[1])-zx;   // filled from the 03 side, mouths as the fill passes them
    G.zoneRects(z,O).forEach(r=>parts.push({r,zx,zw,e:el('rect',{x:r.x,y:r.y,width:0,height:r.h,fill:COL[q]},svg)}))});
  const OL=G.runwayOutline(X0,X1,O),len=OL.len;const ol=el('path',{d:OL.d,fill:'none',stroke:'#ffcc00','stroke-width':1.6,'stroke-dasharray':len,'stroke-dashoffset':len},svg);
  T(svg,X0-4,RY+5,'03',{'text-anchor':'end',fill:'#93a3b3','font-size':13});T(svg,X1+4,RY+5,'21',{fill:'#93a3b3','font-size':13});
  const br=el('g',{opacity:0},svg);
  zs.forEach(q=>{const z=SITE.zones[q],a=sx(z.span[0]),b=sx(z.span[1]);
    el('path',{d:`M${a},${TOP-6} L${a},${TOP-14} L${b},${TOP-14} L${b},${TOP-6}`,fill:'none',stroke:COL[q],'stroke-width':2},br);
    T(br,a,TOP-20,'STA '+G.fmtSTAx(z.span[0]),{fill:'#dfe6ee','font-size':13,'text-anchor':a<X0+80?'start':'middle'});
    T(br,b,TOP-20,'STA '+G.fmtSTAx(z.span[1]),{fill:'#dfe6ee','font-size':13,'text-anchor':b>X1-80?'end':'middle'});
    if(z.mouths)T(br,(a+b)/2,BOT+20,'凸出處＝2、3、4 號聯絡道口（跑道邊線外 30 m）',{fill:COL[q],'font-size':13,'text-anchor':'middle'})});
  return {play(){tween(900,k=>ol.setAttribute('stroke-dashoffset',len*(1-k)),ease.io);
    setTimeout(()=>tween(800,k=>parts.forEach(p=>p.e.setAttribute('width',Math.max(0,Math.min(p.r.w,p.zw*k-(p.r.x-p.zx))))),ease.out),400);
    setTimeout(()=>tween(500,k=>br.setAttribute('opacity',k)),900)}};
};
})();

/* ================= construction phases (施工階段): thresholds move, closed sections hatch, X / chevrons / red marks pop.
   cov = STA range covered by the top-view picture beside it (drawn as a bracket so the map and the picture line up). ================= */
(function(){
const {el,svgText:T,tween,ease,L}=G;
G.PhaseMap=function(svg){
  const NW=G.narrow(),W=NW?560:1000,F=NW?1.3:1;   // phones: narrower drawing, larger lettering
  // phones: three label rows above the runway (photo frame note / 跑道頭 / closed + red notes) so they never overlap
  svg.setAttribute('viewBox',`0 0 ${W} ${NW?206:184}`);const X0=NW?40:60,X1=W-(NW?40:60),RY=NW?118:96,H=30;
  const Y=NW?{covR:4,covH:160,covT:24,tri:[52,63],thrT:48,row3:80}:{covR:RY-H-34,covH:2*H+46,covT:RY-H-40,tri:[RY-H-16,RY-H-5],thrT:RY-H-22,row3:RY-H-8};const sx=s=>X0+(X1-X0)*Math.max(-60,Math.min(L+45,s))/L;
  const defs=el('defs',{},svg);const pat=el('pattern',{id:'phHatch',width:10,height:10,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},defs);
  el('rect',{width:10,height:10,fill:'rgba(217,46,38,.18)'},pat);el('line',{x1:0,y1:0,x2:0,y2:10,stroke:'rgba(217,46,38,.75)','stroke-width':3},pat);
  const cov=el('g',{opacity:0,style:'transition:opacity .4s'},svg);const covR=el('rect',{y:Y.covR,height:Y.covH,rx:6,fill:'rgba(255,255,255,.05)',stroke:'rgba(255,255,255,.35)','stroke-dasharray':'4 4'},cov);
  const covT=T(cov,0,Y.covT,'虛線框＝下方照片的範圍',{fill:'#93a3b3','font-size':12*F,'text-anchor':'end'});
  el('rect',{x:X0,y:RY-H,width:X1-X0,height:2*H,fill:'#1a222c',stroke:'rgba(255,255,255,.25)'},svg);
  for(let x=X0+30;x<X1-30;x+=34)el('line',{x1:x,y1:RY,x2:x+16,y2:RY,stroke:'#fff',opacity:.55,'stroke-width':1.5},svg);
  T(svg,X0-(NW?26:30),RY+5,'03',{fill:'#fff','font-weight':700,'font-size':15*F});T(svg,X1+(NW?4:10),RY+5,'21',{fill:'#fff','font-weight':700,'font-size':15*F});
  [0,500,1000,1500,2000,2500].forEach(s=>{el('line',{x1:sx(s),y1:RY+H+6,x2:sx(s),y2:RY+H+14,stroke:'#93a3b3'},svg);T(svg,sx(s),RY+H+30,G.fmtSTA(s),{'text-anchor':'middle',fill:'#93a3b3','font-size':12*F})});
  const layer=el('g',{},svg);
  const thr=[0,1].map(()=>{const g=el('g',{},svg);el('rect',{x:-3,y:RY-H-4,width:6,height:2*H+8,fill:'#ffcc00',style:'filter:drop-shadow(0 0 6px #ffcc00)'},g);
    if(NW)el('line',{x1:0,y1:Y.tri[1],x2:0,y2:RY-H,stroke:'#ffcc00','stroke-width':1.5},g);
    el('path',{d:`M-9,${Y.tri[0]} L9,${Y.tri[0]} L0,${Y.tri[1]} Z`,fill:'#ffcc00'},g);const t=T(g,0,Y.thrT,'跑道頭',{fill:'#ffcc00','font-size':12*F,'text-anchor':'middle'});
    const s=T(g,0,RY+H+46,'',{fill:'#ffcc00','font-size':12*F,'text-anchor':'middle'});return {g,s}});
  let a03=0,a21=L,cur=-1;
  const pos=()=>{thr[0].g.setAttribute('transform',`translate(${sx(a03)},0)`);thr[1].g.setAttribute('transform',`translate(${sx(a21)},0)`)};pos();
  function go(i,s){cur=i;layer.innerHTML='';
    thr[0].s.textContent=s.thr03>0?'STA '+G.fmtSTA(s.thr03):'';thr[1].s.textContent=s.thr21<L-1?'STA '+G.fmtSTA(s.thr21):'';
    if(s.cov){covR.setAttribute('x',sx(s.cov[0]));covR.setAttribute('width',sx(s.cov[1])-sx(s.cov[0]));covT.setAttribute('x',sx(s.cov[1])-4);cov.setAttribute('opacity',1)}else cov.setAttribute('opacity',0);
    const f03=a03,f21=a21;tween(900,t=>{a03=f03+(s.thr03-f03)*t;a21=f21+(s.thr21-f21)*t;pos()},ease.io);
    if(s.closed){const r=el('rect',{x:sx(s.closed[0]),y:RY-H,width:sx(s.closed[1])-sx(s.closed[0]),height:2*H,fill:'url(#phHatch)',opacity:0},layer);tween(500,t=>r.setAttribute('opacity',t));
      if(NW)T(layer,sx(s.closed[1])-6,Y.row3,'封閉施工',{'text-anchor':'end',fill:'#ff8a7a','font-size':13*F});
      else T(layer,(sx(s.closed[0])+sx(s.closed[1]))/2,RY-H-8,'封閉施工',{'text-anchor':'middle',fill:'#ff8a7a','font-size':13})}
    (s.x||[]).forEach((st,k)=>setTimeout(()=>{if(cur!==i)return;const g=el('g',{transform:`translate(${sx(st)},${RY})`},layer);const gg=el('g',{},g);
      el('path',{d:'M-12,-12 L12,12 M12,-12 L-12,12',stroke:'#fff','stroke-width':4,'stroke-linecap':'round'},gg);
      tween(500,t=>gg.setAttribute('transform',`scale(${ease.back(t)})`))},500+k*220));
    if(s.chev){const n=5,dir=s.thr03>0?1:-1;for(let k=0;k<n;k++)setTimeout(()=>{if(cur!==i)return;const x=sx(s.chev[0])+(sx(s.chev[1])-sx(s.chev[0]))*(k+.5)/n;
      const p=el('path',{d:`M${x-8*dir},${RY-14} L${x+6*dir},${RY} L${x-8*dir},${RY+14}`,fill:'none',stroke:'#fff','stroke-width':3,opacity:0},layer);tween(300,t=>p.setAttribute('opacity',t))},700+k*120)}
    (s.chk||[]).forEach(([st,k],n)=>setTimeout(()=>{if(cur!==i)return;   // 2026-10-16 規範檢核 dots (colours as on the photo)
      const c=el('circle',{cx:sx(st),cy:RY+H-9,r:5.5,fill:{ok:'#3ecf8e',ng:'#ff4d4d',tbd:'#ffcc00'}[k],stroke:'#0b1016','stroke-width':1.5,opacity:0},layer);tween(300,t=>c.setAttribute('opacity',t))},900+n*90));
    (s.red||[]).forEach(([a,b])=>{const g=el('g',{},layer);for(let x=sx(a)+6;x<sx(b)-6;x+=16){el('rect',{x,y:RY-22,width:9,height:5,fill:'#ff3b30'},g);el('rect',{x,y:RY+17,width:9,height:5,fill:'#ff3b30'},g)}
      let n=0;const blink=()=>{if(cur!==i||n>8)return g.setAttribute('opacity',1);g.setAttribute('opacity',n%2?.35:1);n++;setTimeout(blink,260)};blink();
      if(!NW)T(layer,(sx(a)+sx(b))/2,RY-H-8,'紅色＝黑漆覆蓋或抹除',{'text-anchor':'middle',fill:'#ff8a7a','font-size':12});
      else{const w=10*12*F,left=sx(a)+4+w<W-4;T(layer,left?sx(a)+4:sx(b)-4,Y.row3,'紅色＝黑漆覆蓋或抹除',{'text-anchor':left?'start':'end',fill:'#ff8a7a','font-size':12*F})}});
  }
  return {go};
};
})();
