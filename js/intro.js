/* Opening animation (web version of the accepted video opening, plan v2): pen draws the runway from the 03 end,
   work-zone bands wipe in, cards pop with a ripple, the runway steps back, title rises per character, rule grows,
   "施工導覽" tracks in, a light sweep crosses the title. Full ~7 s; repeat visits ~2 s; "略過" or any key skips. */
(function(){
'use strict';
const {el,svgText:T,tween,ease,L,E1,E2,COL}=G;
G.Intro=function(opt){
  opt=opt||{};const short=!!opt.short;const S=short?.3:1;   // time scale
  return new Promise(done=>{
    const ov=G.h('div','',null,document.body);ov.id='intro';
    const svg=el('svg',{viewBox:'0 0 1920 1080',preserveAspectRatio:'xMidYMid meet'},ov);
    const it=G.h('div','it','<h1><span class="c">'+SITE.title+'</span><span class="shine" aria-hidden="true">'+SITE.title+'</span></h1><div class="rule"></div><p class="sub">'+SITE.sub+'</p>',ov);
    const skip=G.h('button','skip','略過片頭 ›',ov);
    const h1c=it.querySelector('.c'),shine=it.querySelector('.shine'),rule=it.querySelector('.rule'),sub=it.querySelector('.sub');
    const showChars=G.chars(h1c,short?20:55);
    const X0=160,X1=1760,RY=640,HI=50,SD=28,TOP=RY-HI-SD,BOT=RY+HI+SD;const sx=s=>X0+(X1-X0)*s/L;
    const defs=el('defs',{},svg);
    const f=el('filter',{id:'iGlow',x:'-20%',y:'-200%',width:'140%',height:'500%'},defs);el('feGaussianBlur',{stdDeviation:6,result:'b'},f);
    const m=el('feMerge',{},f);el('feMergeNode',{in:'b'},m);el('feMergeNode',{in:'SourceGraphic'},m);
    const gr=el('linearGradient',{id:'iShine',x1:0,y1:0,x2:0,y2:1},defs);el('stop',{offset:0,'stop-color':'#fff','stop-opacity':.16},gr);el('stop',{offset:.45,'stop-color':'#fff','stop-opacity':0},gr);
    const cp=el('clipPath',{id:'iReveal'},defs);const rv=el('rect',{x:X0-12,y:0,width:0,height:1080},cp);
    const world=el('g',{},svg);
    const g=el('g',{'clip-path':'url(#iReveal)'},world);
    const O={sx,TOP,BOT,RY,HI,SD};
    el('path',{d:G.runwayOutline(X0,X1,O).d,fill:'#18202a'},g);   // narrower at both ends: zones 1 / 2 are hammers
    [['U',1,0],['D',0,1]].forEach(([n,a,b])=>{const lg=el('linearGradient',{id:'iTwy'+n,x1:0,y1:0,x2:0,y2:1},defs);el('stop',{offset:0,'stop-color':'#2a323c','stop-opacity':a},lg);el('stop',{offset:1,'stop-color':'#2a323c','stop-opacity':b},lg)});
    G.zoneRects(SITE.zones[3],O).filter(r=>r.mouth).forEach(r=>el('rect',{x:r.x,y:r.mouth<0?r.y-40:r.y+r.h,width:r.w,height:40,fill:`url(#iTwy${r.mouth<0?'D':'U'})`},g));   // taxiways 2-4 leaving the mouths
    const bands=[];
    for(let i=1;i<=4;i++){const z=SITE.zones[i];const zg=el('g',{},g);
      G.zoneRects(z,O).forEach(r=>{el('rect',{x:r.x,y:r.y,width:r.w,height:r.h,fill:COL[i]},zg);el('rect',{x:r.x,y:r.y,width:r.w,height:r.h,fill:'url(#iShine)'},zg)});
      zg.style.transformBox='fill-box';zg.style.transformOrigin=i===2?'right center':'left center';zg.style.transform='scaleX(0)';zg.style.transition=`transform ${.75*S+.1}s cubic-bezier(.3,.9,.3,1)`;bands.push(zg)}
    for(let x=X0+80;x<X1-80;x+=72)el('line',{x1:x,y1:RY,x2:Math.min(x+36,X1-80),y2:RY,stroke:'#fff','stroke-width':3,opacity:.85},g);
    for(const xa of [X0+10,X1-32])for(let i=0;i<8;i++){const yy=RY-44.5+i*11+(i>=4?6:0);el('rect',{x:xa,y:yy,width:22,height:6,fill:'#fff',opacity:.9},g)}
    T(g,X0+54,RY,'03',{fill:'#fff','font-size':42,'font-weight':700,'text-anchor':'middle','dominant-baseline':'central',transform:`rotate(90 ${X0+54} ${RY})`});
    T(g,X1-54,RY,'21',{fill:'#fff','font-size':42,'font-weight':700,'text-anchor':'middle','dominant-baseline':'central',transform:`rotate(-90 ${X1-54} ${RY})`});
    const OL=G.runwayOutline(X0,X1,O),len=OL.len;   // the pen also traces the zone-3 taxiway mouths
    const outline=el('path',{d:OL.d,fill:'none',stroke:'#ffcc00','stroke-width':3.5,filter:'url(#iGlow)','stroke-dasharray':len,'stroke-dashoffset':len},world);
    const pen=el('g',{opacity:0},world);
    el('rect',{x:-3,y:TOP-6,width:6,height:BOT-TOP+12,fill:'#ffd76a',filter:'url(#iGlow)'},pen);
    el('circle',{cx:0,cy:TOP,r:8,fill:'#fff6d8',filter:'url(#iGlow)'},pen);el('circle',{cx:0,cy:BOT,r:8,fill:'#fff6d8',filter:'url(#iGlow)'},pen);
    const cards=[];const ax={1:sx(E1/2),2:sx((E2+L)/2),3:sx(E1+(E2-E1)*.15),4:sx(E1+(E2-E1)*.70)};
    if(!short)for(let i=1;i<=4;i++){const z=SITE.zones[i];const x=ax[i],y0=z.part==='core'?RY:z.part==='sides'?BOT-SD/2:BOT,y1=BOT+56+z.lvl*84;
      const cg=el('g',{opacity:0},world);el('line',{x1:x,y1:y0,x2:x,y2:y1,stroke:'#fff','stroke-width':2,opacity:.8},cg);el('circle',{cx:x,cy:y0,r:5,fill:'#fff'},cg);
      const ring=el('circle',{cx:x,cy:y0,r:6,fill:'none',stroke:COL[i],'stroke-width':2.5,opacity:0},cg);const box=el('g',{},cg);
      const w=48+z.name.length*30+z.cap.length*26+30,bx=Math.min(Math.max(x-w/2,30),1890-w);
      el('rect',{x:bx,y:y1,width:w,height:54,rx:10,fill:'rgba(13,19,26,.94)',stroke:'#ffcc00','stroke-opacity':.75,'stroke-width':2},box);
      el('rect',{x:bx+2,y:y1+2,width:6,height:50,rx:3,fill:COL[i]},box);el('rect',{x:bx+20,y:y1+17,width:20,height:20,rx:4,fill:COL[i]},box);
      T(box,bx+52,y1+28,z.name,{fill:'#fff','font-size':29,'font-weight':700,'dominant-baseline':'central'});T(box,bx+60+z.name.length*30,y1+29,z.cap,{fill:'#e1e8f0','font-size':25,'dominant-baseline':'central'});
      box.style.transformBox='fill-box';box.style.transformOrigin='center';box.style.transform='scale(.2)';box.style.transition='transform .55s cubic-bezier(.2,1.6,.4,1)';cards.push({cg,box,ring})}
    const timers=[];const at=(ms,fn)=>timers.push(setTimeout(fn,ms*S));let finished=false;
    const D=1500;
    tween(D*S,k=>{const px=X0+(X1-X0)*k;rv.setAttribute('width',px-X0+24);outline.setAttribute('stroke-dashoffset',len*(1-k));pen.setAttribute('transform',`translate(${px},0)`);pen.setAttribute('opacity',1)},ease.io,()=>tween(250,k=>pen.setAttribute('opacity',1-k)));
    bands.forEach((b,i)=>at(D+i*300,()=>b.style.transform='scaleX(1)'));
    // B: the taxiway numbers pop up above the west mouths once zone 3 is in (as on the home map)
    const tw=el('g',{opacity:0},g);G.zoneRects(SITE.zones[3],O).filter(r=>r.mouth<0).forEach((r,k)=>{const x=r.x+r.w/2,y=r.y-58;
      el('circle',{cx:x,cy:y,r:16,fill:'#0d131a',stroke:'#93a3b3','stroke-width':2},tw);T(tw,x,y+6,String(k+2),{fill:'#fff','font-size':19,'font-weight':700,'text-anchor':'middle'});
      T(tw,x+23,y+6,'號聯絡道',{fill:'#93a3b3','font-size':17})});
    at(D+3*300+500,()=>tween(500,k=>tw.setAttribute('opacity',k)));
    cards.forEach((c,i)=>at(D+250+i*300,()=>{c.cg.setAttribute('opacity',1);c.box.style.transform='scale(1)';tween(700,k=>{c.ring.setAttribute('r',6+26*k);c.ring.setAttribute('opacity',1-k)})}));
    at(3500,()=>{cards.forEach(c=>tween(400,k=>c.cg.setAttribute('opacity',1-k)));tween(1000*S+200,k=>{world.setAttribute('transform',`translate(0,${110*k})`);world.setAttribute('opacity',1-.62*k)},ease.io)});
    at(3700,()=>{showChars();rule.style.transition=`width ${S+.2}s cubic-bezier(.6,0,.25,1)`});
    at(4300,()=>rule.style.width='46%');
    at(4500,()=>sub.classList.add('on'));
    at(5300,()=>shine.classList.add('go'));
    const finish=()=>{if(finished)return;finished=true;timers.forEach(clearTimeout);document.removeEventListener('keydown',onKey);
      ov.classList.add('out');setTimeout(()=>{ov.remove();},750);G.store.set('introSeen','1');done()};
    const onKey=e=>{if(['Escape','Enter',' '].includes(e.key))finish()};
    skip.onclick=finish;document.addEventListener('keydown',onKey);
    at(short?6200:7000,finish);
  });
};
})();
