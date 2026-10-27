/* Reusable components. One interaction language for the whole site: a "line of stops" (G.Rail) like the tour line in the
   top bar; click a stop, click the picture, or press ← → and the model changes to that state. Never a progress bar.
   FramePlayer (caption-free loop), Section (cross-section build-up), Rail, StateViewer (+ live mini sections),
   Compare (before / after handle), Clock (24 h, draggable), Circuits (edge-light switches), EndLights, Pipeline. */
(function(){
'use strict';
const {el,svgText:T,tween,ease,$,$$,h}=G;

/* ---------- loop from shot frames: two image layers, cross-fade at the loop seam, pauses when off screen.
   B (2026-10-10): frames load in order once the player is on screen; playback never runs ahead of the loaded frames
   (it holds the current picture instead of flashing an empty one) and a thin bar shows the loading progress. ---------- */
G.FramePlayer=function(root,frames,fps,badge,hold){
  const a=h('img','',null,root),b=h('img','hidden',null,root);a.alt='';b.alt='';
  h('div','badge',`<i></i>${badge||'模型畫面'}<span class="hp">　已暫停，點畫面繼續</span>`,root);const pb=h('div','fp-load','<i></i>',root);
  let k=0,timer=null,visible=false,alive=true,front=a,back=b,loaded=false,ready=0;const dt=1000/(fps||12),pre=[];
  front.src=frames[0];
  const ok=i=>!pre.length||(pre[i]&&pre[i].complete);   // loaded (or failed: then it is not waited for)
  // B: click the picture to pause / resume (to look at a frame, e.g. the exploded layers at the end)
  let held=false;root.title='點畫面暫停／繼續';root.addEventListener('click',()=>{held=!held;root.classList.toggle('held',held)});
  const step=()=>{if(!alive)return;
    if(visible&&!held){const nk=k+1>=frames.length?0:k+1;
      if(!ok(nk)){timer=setTimeout(step,80);return}   // wait for the next frame
      k=nk;
      if(k===0){back.src=frames[0];back.classList.remove('hidden');front.classList.add('hidden');[front,back]=[back,front];timer=setTimeout(step,650);return}
      front.src=frames[k];if(hold&&k===frames.length-1){timer=setTimeout(step,hold);return}}
    timer=setTimeout(step,dt)};
  const load=()=>{if(loaded)return;loaded=true;let next=0,busy=0;
    const done=()=>{busy--;ready++;$('i',pb).style.width=(ready/frames.length*100)+'%';if(ready>=frames.length)pb.classList.add('done');pump()};
    const pump=()=>{while(alive&&busy<6&&next<frames.length){const im=new Image();im.decoding='async';im.onload=im.onerror=done;pre[next]=im;im.src=frames[next];next++;busy++}};pump()};
  // visibility: IntersectionObserver, plus a position check while it has not reported (some embedded views never deliver it)
  let io=null,ioOn=false;if('IntersectionObserver' in window){io=new IntersectionObserver(en=>{ioOn=true;visible=en[0].isIntersecting;if(visible)load()},{threshold:.05});io.observe(root)}
  const poll=()=>{if(!alive||ioOn)return;const r=root.getBoundingClientRect();visible=r.width>0&&r.bottom>0&&r.top<innerHeight;if(visible)load();setTimeout(poll,400)};poll();
  timer=setTimeout(step,500);
  return {destroy(){alive=false;clearTimeout(timer);if(io)io.disconnect()}};
};

/* ---------- loading gate (user 2026-10-21:「我希望載入還未完成之前就顯示他還在載入，不要看似可以操作 實則還在載入畫面很卡」): a viewer
   that runs through many pictures is covered until they are all loaded - progress and count shown, clicks, drags and arrow keys held.
   Shown after 250 ms only (pictures already in the cache: no flash). G.LoadGate(host,urls|null,{title,note}); start(urls) when the
   list comes later; then(fn) runs fn once loaded; cancel() on destroy. Failed pictures count as done (the gate always opens). ---------- */
G.LoadGate=function(host,urls,o={}){
  host.classList.add('lg-host');
  const el=h('div','lgate',`<div class="lg-card"><i class="lg-spin"></i><b>${o.title||'畫面載入中'}</b><div class="lg-bar"><i></i></div><span class="lg-n">準備中</span><small>${o.note||'載入完成前暫時無法操作'}</small></div>`,host);
  const bar=$('.lg-bar i',el),num=$('.lg-n',el),card=$('.lg-card',el),C=o.conc||12;let n=0,ok=0,next=0,busy=0,fin=false,alive=true,list=[],cbs=[];
  // the card sits in the middle of the part of the block that is on screen (a tall block on a phone: its middle may be off screen)
  const pos=()=>{const r=host.getBoundingClientRect(),t=Math.max(r.top,64),b=Math.min(r.bottom,innerHeight),ch=card.offsetHeight;
    card.style.top=Math.max(8,Math.min(r.height-ch-8,(t+b)/2-r.top-ch/2))+'px'};
  addEventListener('scroll',pos,{passive:true});addEventListener('resize',pos);requestAnimationFrame(pos);
  const unpos=()=>{removeEventListener('scroll',pos);removeEventListener('resize',pos)};
  const show=setTimeout(()=>{if(!fin)el.classList.add('on')},o.delay==null?250:o.delay);
  const upd=()=>{const p=n?ok/n:1;bar.style.width=(p*100)+'%';num.textContent=`${Math.floor(p*100)}%　${ok.toLocaleString()}／${n.toLocaleString()} 張`};
  const finish=()=>{if(fin)return;fin=true;clearTimeout(show);unpos();el.classList.add('done');setTimeout(()=>{el.remove();host.classList.remove('lg-host')},450);const f=cbs;cbs=[];f.forEach(g=>g())};
  const pump=()=>{while(alive&&busy<C&&next<n){const im=new Image();im.decoding='async';busy++;
    im.onload=im.onerror=()=>{busy--;ok++;upd();if(ok>=n)finish();else pump()};im.src=list[next++]}};
  const start=u=>{list=[...new Set(u||[])];n=list.length;if(!n){finish();return}upd();pump()};
  if(urls)start(urls);
  // follow another loader: set(ok,n) shows its progress, open() lifts the gate
  return {start,set(a,b){ok=a;n=b;upd()},open(){finish()},get done(){return fin},then(f){if(fin)f();else cbs.push(f)},cancel(){alive=false;clearTimeout(show);unpos()}};
};

/* ---------- PAPI live pictures, one loader for the whole visit (2026-10-22, user:「有辦法在進入首頁時開始載入嗎?」): app.js starts it at low
   priority once the home page has settled (desktop only), G.Papi speeds it up (32 at a time) when the visitor arrives early. Every picture
   stays referenced, so the browser keeps it in memory for the rest of the visit (the site never reloads the page). ---------- */
G.PapiPre=(()=>{let st=0,d=null,list=[],ok=0,next=0,busy=0,C=0,keep=[],subs=[],cbs=[];
  const fin=()=>{const f=cbs;cbs=[];f.forEach(g=>g())};
  const pump=()=>{while(busy<C&&next<list.length){const im=new Image();im.decoding='async';try{im.fetchPriority=C>12?'high':'low'}catch(e){}
    busy++;keep.push(im);im.onload=im.onerror=()=>{busy--;ok++;subs.forEach(f=>f(ok,list.length));if(ok>=list.length)fin();else pump()};im.src=list[next++]}};
  const begin=()=>{d=window.PAPI_VIEWS||null;st=2;if(!d){fin();return}const U=(k,id)=>`assets/aids/pilot/${k}/${id}.jpg?v=${d.v}`,q=[];
    const by=sg=>d.views.filter(v=>v.seg===sg);['app','land','roll','ga','gab'].forEach(sg=>by(sg).forEach(v=>{q.push(U('main',v.id));if(v.tele)q.push(U('tele',v.id))}));
    list=[...new Set(q)];subs.forEach(f=>f(0,list.length));if(!list.length)fin();else pump()};
  return {start(c){C=Math.max(C,c||12);if(st===2){pump();return}if(st===1)return;st=1;
      if(window.PAPI_VIEWS){begin();return}const s=document.createElement('script');s.src='assets/aids/pilot/views.js?v=129';s.onload=s.onerror=begin;document.head.appendChild(s)},
    get data(){return d},get done(){return st===2&&(!d||ok>=list.length)},
    progress(f){subs.push(f);if(list.length)f(ok,list.length)},off(f){subs=subs.filter(g=>g!==f)},then(f){if(this.done)f();else cbs.push(f)}};
})();

/* ---------- B (2026-10-10): zone hero as a small MP4 (about 2.5 MB instead of about 9 MB of frames). Same look and behaviour as
   FramePlayer: plays while on screen, holds the last picture (exploded layers) before looping, click to pause.
   If the video cannot play, it hands over to FramePlayer with the frames. ---------- */
G.HeroVideo=function(root,src,frames,fps,hold,badge){
  const v=h('video','',null,root);v.muted=true;v.defaultMuted=true;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('muted','');
  v.preload='auto';v.poster=frames[0];v.loop=!hold;v.src=src;   // no hold: a plain loop
  h('div','badge',`<i></i>${badge||'模型畫面'}<span class="hp">　已暫停，點畫面繼續</span>`,root);const pb=h('div','fp-load','<i></i>',root);
  let visible=false,held=false,alive=true,holdT=null,fb=null;root.title='點畫面暫停／繼續';
  const play=()=>{if(alive&&visible&&!held&&!holdT&&v.paused)v.play().catch(()=>{})};
  v.addEventListener('ended',()=>{holdT=setTimeout(()=>{holdT=null;v.currentTime=0;play()},hold||1500)});
  v.addEventListener('progress',()=>{try{const b=v.buffered;if(b.length&&v.duration){const p=b.end(b.length-1)/v.duration;$('i',pb).style.width=(p*100)+'%';if(p>.99)pb.classList.add('done')}}catch(e){}});
  v.addEventListener('canplaythrough',()=>{$('i',pb).style.width='100%';pb.classList.add('done')});
  v.addEventListener('error',()=>{if(fb||!alive)return;root.innerHTML='';fb=G.FramePlayer(root,frames,fps,badge,hold)});   // fall back to the frames
  root.addEventListener('click',()=>{if(fb)return;held=!held;root.classList.toggle('held',held);if(held)v.pause();else play()});
  const setVis=on=>{visible=on;if(on)play();else v.pause()};
  const onTab=()=>{if(!document.hidden)play()};document.addEventListener('visibilitychange',onTab);   // browsers pause muted video in background tabs
  let io=null,ioOn=false;if('IntersectionObserver' in window){io=new IntersectionObserver(en=>{ioOn=true;setVis(en[0].isIntersecting)},{threshold:.05});io.observe(root)}
  const poll=()=>{if(!alive||ioOn)return;const r=root.getBoundingClientRect();setVis(r.width>0&&r.bottom>0&&r.top<innerHeight);setTimeout(poll,400)};poll();
  return {destroy(){alive=false;clearTimeout(holdT);document.removeEventListener('visibilitychange',onTab);v.pause();if(io)io.disconnect();if(fb)fb.destroy();v.removeAttribute('src');v.load()}};
};

/* a loop from the asset data: its MP4 when there is one, otherwise the frames */
G.Loop=(root,m,badge)=>m.mp4?G.HeroVideo(root,m.mp4,m.frames,m.fps,null,badge):G.FramePlayer(root,m.frames,m.fps,badge);

/* ---------- construction order (工區三 施工順序, 2026-10-25): one MP4 with a line of stops (G.Rail) for its steps underneath; the
   current step lights up and its caption sits on the picture.
   2026-10-26 (user:「整體都再加速1.3倍，然後跟一步一步游標點了之後再播放」): played at opt.rate and one step at a time - a click on
   the picture plays the next step, a click on a stop plays that step, each step stops on its last frame. Nothing plays before the
   first click; the MP4 is fetched once the block comes into view.
   2026-10-27 (user, a picture of the 覆工板施工循環 tag:「我要你標住的是這樣子」): opt.spots {step key: [[label, x, y]]} puts the
   State viewer's labels (dot, leader, tag; opt.notes behind ⓘ) on that step's stopped picture.
   2026-10-27 (user:「678合併 9 10 11合併」): the steps (segments) in opt.join run on from the one before without a stop of their own,
   each with its own caption and speed; opt.hold {key: s} pauses that long on a segment's last frame with its labels, then plays on. ---------- */
G.SeqPlayer=function(root,m,opt){
  opt=opt||{};const SG=m.steps,rate=opt.rate||1,fast=opt.fast,join=opt.join||[],hold=opt.hold||{};
  const ST=SG.filter(s=>join.indexOf(s.key)<0),n=ST.length;        // the stops
  const after=(L,t)=>{let k=0;L.forEach((s,j)=>{if(s.t<=t+1e-6)k=j});return k};
  const segAt=t=>after(SG,t),stopOf=SG.map(s=>after(ST,s.t));
  const rateOf=j=>rate*(fast&&fast.keys.indexOf(SG[j].key)>=0?fast.x:1);   // 10/27 user:「第1-9及11-12、15速度快兩倍」
  root.innerHTML=`<div class="player seq-stage"><video muted playsinline preload="none"></video><div class="hotlayer"></div>
    <div class="badge"><i></i>模型畫面</div><div class="seq-next"></div><div class="seq-cap"><b></b><span></span></div><div class="fp-load"><i></i></div></div>
    <div class="seq-rail"></div>`;
  const v=$('video',root),stage=$('.seq-stage',root),cap=$('.seq-cap',root),pb=$('.fp-load',root),nx=$('.seq-next',root),hot=$('.hotlayer',root);
  // (10/27 user:「覆工板規格字卡太慢顯示了」: leader and tag drawn in quicker than in the State viewer)
  let labKey=null;
  function labels(key){hot.innerHTML='';labKey=null;const sp=key&&(opt.spots||{})[key];if(!sp)return;labKey=key;const W=stage.clientWidth,H=stage.clientHeight;
    sp.forEach(([txt,x,y],k)=>{const o=opt.offset||[90,-120],dx=o[0]/1920*W,dy=o[1]/1080*H,note=(opt.notes||{})[txt];
      const e=h('div','lab',`<svg width="1" height="1"><line x1="0" y1="0" x2="${dx}" y2="${dy}" stroke="#ffcc00" stroke-width="2.5" stroke-dasharray="400" stroke-dashoffset="400" style="animation:dash .25s ${k*.1}s forwards"/><circle r="5" fill="#ffcc00"/></svg>`+
        `<span class="${note?'more':''}" style="left:${dx}px;top:${dy-16}px;animation-delay:${k*.1+.1}s"><b>${txt}</b>${note?`<em>${note}</em>`:''}</span>`,hot);
      e.style.left=(x*100)+'%';e.style.top=(y*100)+'%';const s=$('span',e);if(note)s.onclick=ev=>{ev.stopPropagation();s.classList.toggle('open')}
      const over=x*W+dx+s.offsetWidth-(W-4);if(over>0){s.style.left=(dx-over)+'px';$('line',e).setAttribute('x2',dx-over)}})}   // phones: keep the tag inside
  v.muted=true;v.defaultMuted=true;v.setAttribute('muted','');v.poster=m.poster;
  let alive=true,cur=-1,endT=0,raf=0,last=-1,seg=-1,held={},holdT=0,holdJ=-1;
  const endOf=i=>i<n-1?ST[i+1].t:(m.duration||v.duration||1e9);
  const say=t=>{nx.textContent=t;nx.classList.toggle('on',!!t)};
  const hint=()=>say(!v.paused?'':cur<0?'點畫面開始播放 ▶':cur>=n-1?'播完了，點畫面從頭看 ↺':`點畫面播下一步：${ST[cur+1].short} ▶`);
  const rail=G.Rail($('.seq-rail',root),ST.map(s=>({label:s.short})),i=>playStep(i));
  function show(j){if(j===last)return;last=j;$('b',cap).textContent=SG[j].title;$('span',cap).textContent=SG[j].sub||'';rail.set(stopOf[j])}
  function stopAt(t,j){v.pause();cancelAnimationFrame(raf);try{v.currentTime=Math.max(SG[j].t,t)}catch(e){};labels(SG[j].key)}
  // per screen refresh while playing: the segment's caption and speed, a hold, the stop on the step's last frame.
  // 10/27 user:「3.4.6.7.，最後一針都會閃現其他車輛」: the next step's machine is there from its first frame, and a check per screen
  // refresh let the picture run a frame or two into it before the pause took hold -> stop a little early (more at 2x) and step
  // forward to the last frame (a hold the same way)
  function tick(){if(cur<0||v.paused)return false;const t=v.currentTime,lead=Math.max(.1,v.playbackRate*.06);
    const hAt=k=>SG[k].t+hold[SG[k].key][0];
    const hj=SG.findIndex((s,k)=>hold[s.key]&&!held[k]&&hAt(k)>ST[cur].t&&hAt(k)<endT-.01&&t>=hAt(k)-lead);
    if(hj>=0){held[hj]=1;seg=hj;show(hj);stopAt(hAt(hj),hj);holdJ=hj;  // (also when a slow check ran past it)
      holdT=setTimeout(()=>{holdT=0;if(alive&&v.paused&&holdJ>=0)run()},hold[SG[hj].key][1]*1000);return true}
    if(t>=endT-.06-lead){const je=segAt(endT-.07);seg=je;show(je);stopAt(endT-.06,je);hint();return true}   // (before the next step's caption)
    const j=segAt(t);if(j!==seg){seg=j;show(j);v.playbackRate=rateOf(j);if(labKey&&labKey!==SG[j].key)labels(null)}
    return false}
  function watch(){cancelAnimationFrame(raf);if(!alive||tick()||v.paused)return;raf=requestAnimationFrame(watch)}
  v.addEventListener('timeupdate',tick);                           // backup: rAF does not run in background tabs
  // the end of a hold (its time up or a click): with a third value the rest of that segment is a still picture - go on from its end
  // (10/27 user:「單片覆工鈑浮起來後顯示太久了」)
  function release(){const k=holdJ;holdJ=-1;clearTimeout(holdT);holdT=0;if(k>=0&&hold[SG[k].key][2])try{v.currentTime=SG[k+1].t-.04}catch(e){}}
  const run=()=>{say('');release();v.playbackRate=rateOf(segAt(v.currentTime));v.play().then(()=>{hint();watch()}).catch(()=>{})};
  function playStep(i){if(!alive)return;labels(null);holdJ=-1;clearTimeout(holdT);holdT=0;cur=(i+n)%n;endT=endOf(cur);held={};seg=SG.indexOf(ST[cur]);show(seg);
    if(!v.src){v.preload='auto';v.src=m.mp4}
    v.defaultPlaybackRate=rateOf(seg);const go=()=>{try{v.currentTime=ST[cur].t+.02}catch(e){};run()};
    if(v.readyState>=1)go();else v.addEventListener('loadedmetadata',go,{once:true})}
  show(0);hint();
  stage.addEventListener('click',()=>{
    if(!v.paused){v.pause();cancelAnimationFrame(raf);say('已暫停，點畫面繼續 ▶');return}
    if(cur>=0&&v.currentTime<endT-.1){run();return}               // resume a step paused half way (or held: go on now)
    playStep(cur<0||cur>=n-1?0:cur+1)});
  v.addEventListener('ended',()=>{cancelAnimationFrame(raf);hint()});
  v.addEventListener('progress',()=>{try{const b=v.buffered;if(b.length&&v.duration){const p=b.end(b.length-1)/v.duration;$('i',pb).style.width=(p*100)+'%';if(p>.99)pb.classList.add('done')}}catch(e){}});
  v.addEventListener('canplaythrough',()=>{$('i',pb).style.width='100%';pb.classList.add('done')});
  G.onView(stage,()=>{if(alive&&!v.src){v.preload='auto';v.src=m.mp4}},.1);
  return {destroy(){alive=false;cancelAnimationFrame(raf);clearTimeout(holdT);v.pause();rail.destroy();v.removeAttribute('src');v.load()}};
};

/* ---------- cross-section: layers drop in with overshoot, dimension lines draw, thickness counts up; hover a layer for its role ---------- */
G.Section=function(svg,layers,opt){
  opt=opt||{};let run=0;const M=(window.SITE.materials)||{};
  function play(){
    const my=++run;svg.innerHTML='';svg.setAttribute('viewBox','0 0 900 380');
    const F=G.narrow()?1.45:1;   // lettering scale on phones (narrower layers leave room for the long zone-4 names)
    const PX=3.8,X=G.narrow()?170:180,W=G.narrow()?210:400,base=340;
    el('line',{x1:40,y1:base,x2:860,y2:base,stroke:'rgba(255,255,255,.25)','stroke-width':1.5},svg);
    for(let x=50;x<860;x+=18)el('line',{x1:x,y1:base,x2:x-10,y2:base+10,stroke:'rgba(255,255,255,.12)'},svg);
    let y=base;const items=[];
    layers.forEach(l=>{const hh=Math.max(l.cm*PX,9);y-=hh;items.push({l,y,h:hh})});
    const tip=el('g',{opacity:0,'pointer-events':'none',style:'transition:opacity .2s'},svg);
    const tipR=el('rect',{x:X,y:4,width:280,height:54*F,rx:10,fill:'rgba(13,19,26,.95)',stroke:'#ffcc00','stroke-width':1.5},tip);
    const tipA=T(tip,X+16,4+22*F,'',{fill:'#ffcc00','font-size':16*F,'font-weight':700}),tipB=T(tip,X+16,4+43*F,'',{fill:'#dfe6ee','font-size':14*F});
    const groups=[];
    items.forEach((it,i)=>setTimeout(()=>{if(my!==run)return;
      const g=el('g',{opacity:0,class:'lay'},svg);groups.push(g);
      const r=el('rect',{x:X,y:it.y,width:W,height:it.h,fill:it.l.c,stroke:it.l.dash?'rgba(255,255,255,.5)':'rgba(0,0,0,.35)','stroke-dasharray':it.l.dash?'6 5':'none'},g);
      if(it.l.mesh){r.setAttribute('fill','rgba(0,0,0,0)');r.setAttribute('stroke','none');el('rect',{x:X+W/2-60,y:it.y,width:120,height:it.h,fill:'#ffcc00',opacity:.9},g)}
      el('rect',{x:X,y:it.y,width:W,height:Math.min(4,it.h),fill:'#fff',opacity:.12,'pointer-events':'none'},g);
      g.addEventListener('mouseenter',()=>{groups.forEach(o=>o.classList.toggle('dim',o!==g));g.classList.add('hl');
        tipA.textContent=it.l.n;tipB.textContent=(it.l.dash?'厚度為示意':it.l.mesh?'':it.l.cm+' cm　')+(M[it.l.n]||'');
        tipR.setAttribute('width',Math.max(tipA.getComputedTextLength(),tipB.getComputedTextLength())+34);tip.setAttribute('opacity',1)});
      g.addEventListener('mouseleave',()=>{groups.forEach(o=>o.classList.remove('dim','hl'));tip.setAttribute('opacity',0)});
      tween(620,k=>g.setAttribute('transform',`translate(0,${-(1-k)*170})`),ease.back);tween(250,k=>g.setAttribute('opacity',k));
      setTimeout(()=>{if(my!==run)return;const dx=X+W+22;
        el('path',{d:`M${dx},${it.y} L${dx},${it.y+it.h}`,stroke:'#ffcc00','stroke-width':1.6},svg);
        el('line',{x1:dx-5,y1:it.y,x2:dx+5,y2:it.y,stroke:'#ffcc00'},svg);el('line',{x1:dx-5,y1:it.y+it.h,x2:dx+5,y2:it.y+it.h,stroke:'#ffcc00'},svg);
        const lab=T(svg,dx+14,it.y+it.h/2+5*F,'',{fill:'#fff','font-size':15*F});
        if(it.l.dash)lab.textContent=it.l.n+'　厚度為示意';else if(it.l.mesh)lab.textContent=it.l.n;
        else tween(500,k=>lab.textContent=`${it.l.n}　${Math.round(it.l.cm*k)} cm`)},420)},i*480));
    setTimeout(()=>{if(my!==run)return;svg.appendChild(tip);if(!opt.total)return;const top=items[items.length-1].y;const dx=X-26;
      el('path',{d:`M${dx},${top} L${dx},${base}`,stroke:'#fff','stroke-width':1.4},svg);el('line',{x1:dx-5,y1:top,x2:dx+5,y2:top,stroke:'#fff'},svg);
      const t=T(svg,dx-10,(top+base)/2+6*F,opt.total,{'text-anchor':'end',fill:'#ffcc00','font-size':17*F,'font-weight':700,opacity:0});tween(400,k=>t.setAttribute('opacity',k))},items.length*480+450);
  }
  return {play};
};

/* ---------- Rail: a line of stops (thumbnail, numbered dot, label); the yellow "train" slides to the current stop ---------- */
G.Rail=function(root,items,onPick,first){const n0=first==null?1:first;
  root.classList.add('rail');
  root.innerHTML=`<div class="track"><i></i></div>`+items.map((it,i)=>`<button class="stop" type="button">${it.thumb?`<span class="th"><img src="${it.thumb}" alt=""></span>`:''}<span class="dot"><b>${i+n0}</b></span><span class="lb">${it.label}</span></button>`).join('')+'<span class="train"></span>';
  const stops=$$('.stop',root),track=$('.track',root),fill=$('.track i',root),train=$('.train',root);let cur=0;
  stops.forEach((b,i)=>b.onclick=()=>onPick(i));
  function place(){const r=root.getBoundingClientRect();if(!r.width)return;
    const c=s=>{const d=$('.dot',s).getBoundingClientRect();return [d.left-r.left+d.width/2,d.top-r.top+d.height/2]};
    const [x0,y]=c(stops[0]),[x1]=c(stops[stops.length-1]),[xc]=c(stops[cur]);
    track.style.left=x0+'px';track.style.width=(x1-x0)+'px';track.style.top=y+'px';fill.style.width=(xc-x0)+'px';train.style.left=xc+'px';train.style.top=y+'px'}
  function set(i){cur=i;stops.forEach((s,k)=>{s.classList.toggle('on',k===i);s.classList.toggle('past',k<i)});place()}
  window.addEventListener('resize',place);setTimeout(place,60);$$('img',root).forEach(im=>im.addEventListener('load',place));
  return {set,place,destroy(){window.removeEventListener('resize',place)}};
};

/* ---------- live mini sections beside the state viewers (zone 3 trench / zone 4 overlay) ---------- */
function dropRect(parent,attrs,delay){const r=el('rect',Object.assign({opacity:0},attrs),parent);
  if(delay<0){r.setAttribute('opacity',1);return r}   // already there: no drop
  setTimeout(()=>{tween(560,k=>{r.setAttribute('transform',`translate(0,${-(1-k)*60})`);r.setAttribute('opacity',Math.min(1,k*3))},ease.back)},delay||0);return r}
/* B (2026-10-10): poured layers (as in the S06 video since r4): grains rain into the trench while the layer rises from the bottom */
function pourRect(parent,fx,attrs,delay,grain){const r=el('rect',Object.assign({},attrs,{height:0,y:attrs.y+attrs.height}),parent);
  if(delay<0){r.setAttribute('y',attrs.y);r.setAttribute('height',attrs.height);return r}
  setTimeout(()=>{if(!parent.isConnected)return;const D=900,bot=attrs.y+attrs.height;
    tween(D,k=>{r.setAttribute('y',bot-attrs.height*k);r.setAttribute('height',attrs.height*k)},ease.lin);
    for(let n=0;n<46;n++){const x=attrs.x+4+Math.random()*(attrs.width-8),t0=Math.random()*(D-260),c=el('circle',{cx:x,cy:-6,r:1.2+Math.random()*1.6,fill:grain[n%grain.length],opacity:0},fx);
      setTimeout(()=>{if(!parent.isConnected)return c.remove();const land=bot-attrs.height*Math.min(1,(t0+300)/D);tween(300,k=>{c.setAttribute('cy',8+(land-8)*k*k);c.setAttribute('opacity',k<.9?1:(1-k)*10)},ease.lin,()=>c.remove())},t0)}},delay||0);
  return r}
G.LiveWZ3=function(svg){
  svg.setAttribute('viewBox','0 0 300 182');const PX=1.6,G0=46,TX0=88,TX1=286,BOT=G0+60*PX;
  el('rect',{x:0,y:G0,width:TX0,height:BOT-G0+10,fill:'#2a3038'},svg);T(svg,8,G0-8,'既有跑道',{fill:'#93a3b3','font-size':13.5});
  el('rect',{x:0,y:BOT,width:300,height:12,fill:'#3b3026'},svg);
  const trench=el('path',{d:`M${TX0},${G0} V${BOT} H${TX1} V${G0}`,fill:'none',stroke:'#ffcc00','stroke-width':1.6,'stroke-dasharray':'5 4'},svg);
  const dim=el('g',{},svg);el('line',{x1:TX1+6,y1:G0,x2:TX1+6,y2:BOT,stroke:'#ffcc00'},dim);T(dim,TX1-4,G0+16,'60 cm',{fill:'#ffcc00','font-size':14,'text-anchor':'end'});
  T(svg,TX0+6,G0-8,'工區三擴建帶',{fill:'#ffcc00','font-size':13.5});
  const lay=el('g',{},svg),fx=el('g',{},svg);let shown=0,stopFx=null;
  const L=[{n:'碎石級配 30 cm',cm:30,c:'#7a6650',grain:['#5c4c3a','#8a7660','#a8967e']},{n:'水泥處理級配 15 cm',cm:15,c:'#a8987a',grain:['#cfc6b4','#e6e0d2','#9c8f78']},{n:'鋼製覆工板 15 cm',cm:15,c:'#b8734f',plate:1}];
  const ys=[];let y=BOT;L.forEach(l=>{y-=l.cm*PX;ys.push(y)});
  function build(n,anim){lay.innerHTML='';for(let i=0;i<n;i++){const l=L[i],g=el('g',{},lay);
      const d=anim&&i>=shown?(i-shown)*260:-1,at={x:TX0+1,y:ys[i],width:TX1-TX0-2,height:l.cm*PX,fill:l.c,stroke:'rgba(0,0,0,.35)'};
      if(l.plate)dropRect(g,at,d);else pourRect(g,fx,at,d,l.grain);
      if(l.plate)for(let x=TX0+40;x<TX1-4;x+=40)el('line',{x1:x,y1:ys[i],x2:x,y2:ys[i]+l.cm*PX,stroke:'rgba(0,0,0,.45)'},g);
      const t=T(g,TX0+10,ys[i]+l.cm*PX/2+4,l.n,{fill:l.plate?'#fff':'#111','font-size':14,'font-weight':700,opacity:d<0?1:0});if(d>=0)setTimeout(()=>t.setAttribute('opacity',1),d+(l.plate?380:900))}
    shown=n}
  return {set(i){if(stopFx){stopFx();stopFx=null}fx.innerHTML='';const n=[0,1,2,3,3,3][i];build(n,true);trench.setAttribute('opacity',n?.45:1);
    if(i===4){el('rect',{x:TX1-82,y:ys[2],width:40,height:15*PX,fill:'#1b2129'},fx);   // the slot left by the lifted plate
      const g=el('g',{},fx);const pl=el('rect',{x:TX1-82,y:ys[2],width:40,height:15*PX,fill:'#c98762',stroke:'#fff','stroke-width':1},g);
      const lb=T(fx,TX1-62,ys[2]-30,'3 m × 1.5 m × 15 cm',{fill:'#fff','font-size':13.5,'text-anchor':'middle',opacity:0});
      tween(700,k=>{pl.setAttribute('transform',`translate(0,${-18*k}) rotate(${-8*k} ${TX1-82} ${ys[2]})`);lb.setAttribute('opacity',k)},ease.back)}
    if(i===5){const p=el('g',{},fx);el('path',{d:G.PLANE,fill:'#eef3f8',transform:'scale(.5)'},p);const lb=T(fx,150,22,'航機照常起降',{fill:'#3ecf8e','font-size':14,'text-anchor':'middle'});
      let alive=true;const loop=()=>{if(!alive)return;tween(2600,k=>p.setAttribute('transform',`translate(${-30+340*k},${30-8*k})`),ease.lin,()=>setTimeout(loop,500))};loop();stopFx=()=>{alive=false}}}};
};
G.LiveWZ4=function(svg){
  svg.setAttribute('viewBox','0 0 300 176');const PX=1.5,X0=12,X1=288,BOT=164,JX=150;
  const gb=BOT-25*PX,pc=gb-25*PX,mesh=pc-3,top=pc-20*PX;
  el('rect',{x:X0,y:gb,width:X1-X0,height:25*PX,fill:'#6d5c48',stroke:'rgba(255,255,255,.5)','stroke-dasharray':'5 4'},svg);
  el('rect',{x:X0,y:pc,width:X1-X0,height:25*PX,fill:'#8e979f',stroke:'rgba(255,255,255,.5)','stroke-dasharray':'5 4'},svg);
  el('line',{x1:JX,y1:pc,x2:JX,y2:gb,stroke:'#222',"stroke-width":2.5},svg);
  T(svg,X0+6,gb+22,'既有級配粒料底層',{fill:'#fff','font-size':13.5});T(svg,X0+6,pc+22,'既有水泥混凝土底層',{fill:'#111','font-size':13.5});
  const ghost=el('rect',{x:X0,y:top,width:X1-X0,height:20*PX,fill:'none',stroke:'#ff8a7a','stroke-dasharray':'4 4'},svg);
  const ghostT=T(svg,X1-6,top+19,'刨除既有瀝青',{fill:'#ff8a7a','font-size':13.5,'text-anchor':'end'});
  const lay=el('g',{},svg),fx=el('g',{},svg);
  return {set(i){lay.innerHTML='';fx.innerHTML='';ghost.setAttribute('opacity',i===0?1:0);ghostT.setAttribute('opacity',i===0?1:0);
    if(i>=1){dropRect(lay,{x:JX-24,y:mesh,width:48,height:4,fill:'#ffcc00'},i===1?0:-1);if(i===1)T(fx,JX,mesh-10,'抑制網 1 m',{fill:'#ffcc00','font-size':13.5,'text-anchor':'middle'})}
    if(i>=2){dropRect(lay,{x:X0,y:top,width:X1-X0,height:20*PX-3,fill:'#24282d',stroke:'rgba(255,255,255,.2)'},i===2?120:-1);T(lay,X0+6,top+19,'改質瀝青 20 cm',{fill:'#fff','font-size':13.5})}
    if(i===3){const r=el('circle',{cx:JX,cy:mesh,r:18,fill:'none',stroke:'#ffcc00','stroke-width':2},fx);tween(900,k=>{r.setAttribute('r',10+14*k);r.setAttribute('opacity',1-k*.6)},ease.out);T(fx,JX+20,mesh+28,'接縫處',{fill:'#ffcc00','font-size':13.5})}}};
};

/* ---------- State viewer: picture + side panel + line of steps. cfg:
   frames [{f,src,anchors}], states [{f|src, enter, title, sub, short, thumb, spots, labels}], tag {text, on:[i]},
   notes {label: text}, offsets {label: [dx,dy] in 1920x1080 px}, live (svg)->{set(i)}, unit ('步' default) ---------- */
G.StateViewer=function(root,cfg){
  const N=cfg.states.length;const touch=(()=>{try{return matchMedia('(pointer:coarse)').matches}catch(e){return false}})();
  const HINT=touch?'點畫面或左右滑動看下一步':'點畫面或按 → 看下一步';
  root.innerHTML=`<div class="sv"><div class="stage"><img alt=""><img alt="" class="hidden"><div class="hotlayer"></div><div class="tag"></div>
      <button class="nav-b prev" aria-label="上一步">‹</button><button class="nav-b next" aria-label="下一步">›</button><div class="hint"><i></i><span>${HINT}</span></div></div><ol class="lab-legend"></ol>
    <aside class="side" aria-live="polite"><div class="no"><b>01</b><span>/ ${G.pad(N)}</span></div><h3></h3><p></p>${cfg.live?'<div class="live"><svg></svg></div>':''}</aside>
    <div class="rail-host"></div></div>`;
  const stage=$('.stage',root),hot=$('.hotlayer',root),tag=$('.tag',root),hint=$('.hint',root),side=$('.side',root);const imgs=$$('.stage>img',root);
  const F=cfg.frames,srcs=F.map(x=>x.src),S=cfg.states;
  const idxOf=f=>{let b=0;F.forEach((x,k)=>{if(Math.abs(x.f-f)<Math.abs(F[b].f-f))b=k});return b};
  S.forEach(s=>{if(s.f!=null){s.k=idxOf(s.f);s.ke=s.enter!=null?idxOf(s.enter):s.k}});
  const live=cfg.live?cfg.live($('.live svg',root)):null;
  const rail=G.Rail($('.rail-host',root),S.map(s=>({label:s.short,thumb:s.thumb})),i=>{used();go(i)});
  let gate=null;G.onView(root,()=>{gate=G.LoadGate($('.sv',root),[...srcs,...S.filter(s=>s.src).map(s=>s.src)],{title:'步驟畫面載入中'})},0);   // 2026-10-21: covered until all frames are in
  let front=imgs[0],back=imgs[1],cur=-1,frame=-1,token=0;
  function cross(src,done){const my=token;back.onload=null;
    // 2026-10-11: drop the load handler once it has fired; otherwise the morph that follows changes this (now front) picture's
    // src frame by frame, the handler fires again, swaps the pictures back and starts a second morph (the step ran twice)
    const swap=()=>{back.onload=null;if(my!==token)return;back.classList.remove('hidden');front.classList.add('hidden');[front,back]=[back,front];setTimeout(()=>{if(my===token)done()},480)};
    back.src=src;if(back.complete&&back.naturalWidth)swap();else back.onload=swap}
  function morph(to,done){const from=frame,dur=Math.max(500,Math.min(2400,Math.abs(F[to].f-F[from].f)*14)),t0=performance.now(),my=token;
    const step=()=>{if(my!==token)return;const t=Math.min(1,(performance.now()-t0)/dur),k=Math.round(from+(to-from)*ease.io(t));
      if(k!==frame){frame=k;front.src=srcs[k]}if(t<1)G.tick(step);else done()};G.tick(step)}
  function texts(i){const s=S[i];const no=$('.no b',side);no.classList.remove('flip');void no.offsetWidth;no.textContent=G.pad(i+1);no.classList.add('flip');
    const h3=$('h3',side);h3.classList.remove('on');h3.textContent=s.title;setTimeout(G.chars(h3,28),30);$('p',side).textContent=s.sub||'';side.classList.remove('swap');void side.offsetWidth;side.classList.add('swap')}
  const svEl=$('.sv',root),legend=$('.lab-legend',root);
  const plain=()=>{hot.classList.remove('num');svEl.classList.remove('has-legend');legend.innerHTML=''};
  // labels that still cover each other after relax(): numbered dots on the picture, the texts listed under it
  function compact(labs){hot.classList.add('num');labs.forEach((l,n)=>l.nb.textContent=n+1);
    legend.innerHTML=labs.map((l,n)=>`<li><b>${n+1}</b><span>${l.txt}${l.note?`<small>${l.note}</small>`:''}</span></li>`).join('');svEl.classList.add('has-legend')}
  function settle(i){const s=S[i];hot.innerHTML='';hot.classList.remove('moving');plain();
    const spots=s.spots||(s.k!=null?F[s.k].anchors:[]);
    const labs=spots.map(([txt,x,y],n)=>addLabel(txt,x,y,n));if(labs.length)setTimeout(()=>{if(relax(labs))compact(labs)},0)}
  // overlapping label boxes are pushed apart vertically (and kept inside the picture); the leader lines follow
  function relax(labs){const H=stage.clientHeight,W=stage.clientWidth,P=6;
    const box=l=>{const w=l.span.offsetWidth,hh=l.span.offsetHeight,left=l.x+l.dx-(l.mode==='c'?w/2:l.mode==='r'?w:0),top=l.y+l.dy-16;return {left,top,right:left+w,bottom:top+hh}};
    for(let it=0;it<60;it++){let moved=false;
      for(let a=0;a<labs.length;a++)for(let b=a+1;b<labs.length;b++){const A=box(labs[a]),B=box(labs[b]);
        if(A.right+P<=B.left||B.right+P<=A.left||A.bottom+P<=B.top||B.bottom+P<=A.top)continue;
        const up=(A.top+A.bottom)<=(B.top+B.bottom),need=up?A.bottom+P-B.top:B.bottom+P-A.top;
        labs[a].dy+=up?-need/2:need/2;labs[b].dy+=up?need/2:-need/2;moved=true}
      // 2026-10-11: a label box must not sit on another label's anchor dot (the dot hid part of the text)
      labs.forEach((l,a)=>{const B=box(l);labs.forEach((m,b)=>{if(a===b)return;const R=8;
        if(m.x<B.left-R||m.x>B.right+R||m.y<B.top-R||m.y>B.bottom+R)return;
        const down=m.y+R-B.top,up=B.bottom-(m.y-R);l.dy+=down<up?down:-up;moved=true})});
      labs.forEach(l=>{const B=box(l);if(B.top<4)l.dy+=4-B.top;else if(B.bottom>H-4)l.dy-=B.bottom-H+4;
        if(B.right>W-4)l.dx-=B.right-W+4;else if(B.left<4)l.dx+=4-B.left});   // B: keep inside left / right too (narrow screens)
      if(!moved)break}
    labs.forEach(l=>{l.span.style.top=(l.dy-16)+'px';l.span.style.left=l.dx+'px';l.line.setAttribute('y2',l.dy);l.line.setAttribute('x2',l.dx)});
    // still crowded? (two boxes overlap, a box covers another label's dot, or a box is outside the picture)
    return labs.some((l,a)=>{const A=box(l);if(A.left<0||A.top<0||A.right>W||A.bottom>H)return true;
      return labs.some((m,b)=>{if(a===b)return false;const B=box(m);
        if(b>a&&!(A.right<=B.left||B.right<=A.left||A.bottom<=B.top||B.bottom<=A.top))return true;
        return m.x>=A.left-3&&m.x<=A.right+3&&m.y>=A.top-3&&m.y<=A.bottom+3})})}
  function addLabel(txt,x,y,n){const o=(cfg.offsets||{})[txt]||cfg.defOffset||[80,-90],dx=o[0]/1920*stage.clientWidth,dy=o[1]/1080*stage.clientHeight;const note=(cfg.notes||{})[txt];
    const e=h('div','lab',`<svg width="1" height="1"><line x1="0" y1="0" x2="${dx}" y2="${dy}" stroke="#ffcc00" stroke-width="2.5" stroke-dasharray="400" stroke-dashoffset="400" style="animation:dash .5s ${n*.15}s forwards"/><circle r="5" fill="#ffcc00"/></svg><b class="nb"></b>`+
      `<span class="${note?'more':''}" style="left:${dx}px;top:${dy-16}px;animation-delay:${n*.15+.3}s;${o[2]==='c'?'translate:-50% 0;':dx<0?'translate:-100% 0;':''}"><b>${txt}</b>${note?`<em>${note}</em>`:''}</span>`,hot);
    e.style.left=(x*100)+'%';e.style.top=(y*100)+'%';const sp=$('span',e);if(note)sp.onclick=ev=>{ev.stopPropagation();sp.classList.toggle('open')}
    return {x:x*stage.clientWidth,y:y*stage.clientHeight,dx,dy,mode:o[2]==='c'?'c':dx<0?'r':'l',span:sp,line:$('line',e),nb:$('.nb',e),txt,note}}
  function go(i){i=Math.max(0,Math.min(N-1,i));if(i===cur)return;token++;const a=S[cur]||{},b=S[i];const first=cur<0;cur=i;
    rail.set(i);$('.prev',root).disabled=i===0;$('.next',root).disabled=i===N-1;hint.querySelector('span').textContent=i===N-1?'點畫面從頭再看一次':HINT;
    hot.classList.add('moving');plain();texts(i);if(live)live.set(i);
    const on=cfg.tag&&cfg.tag.on.includes(i);tag.textContent=cfg.tag?cfg.tag.text:'';tag.classList.toggle('on',!!on);
    const done=()=>settle(i);
    if(first){if(b.src){front.src=b.src;frame=-1}else{frame=b.k;front.src=srcs[frame]}setTimeout(done,300);return}
    if(b.src)cross(b.src,()=>{frame=-1;done()});
    else if(a.src==null&&frame>=0)morph(b.k,done);
    else cross(srcs[b.ke],()=>{frame=b.ke;if(b.ke!==b.k)morph(b.k,done);else done()})}
  let usedOnce=false;const used=()=>{if(!usedOnce){usedOnce=true;hint.classList.add('used')}};
  $('.prev',root).onclick=e=>{e.stopPropagation();used();go(cur-1)};$('.next',root).onclick=e=>{e.stopPropagation();used();go(cur+1)};
  stage.addEventListener('click',()=>{used();go(cur===N-1?0:cur+1)});
  G.swipe(stage,d=>{used();go(cur+d)});
  // ← → step through the states while the viewer is on screen; at either end the key falls through to the page (previous / next stop)
  const onKey=e=>{if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||!G.onScreen(stage)||(gate&&!gate.done))return;
    if(e.key==='ArrowRight'&&cur<N-1){used();go(cur+1);e.preventDefault()}else if(e.key==='ArrowLeft'&&cur>0){used();go(cur-1);e.preventDefault()}};
  document.addEventListener('keydown',onKey);
  go(0);
  return {go,destroy(){token++;if(gate)gate.cancel();document.removeEventListener('keydown',onKey);rail.destroy()}};
};

/* ---------- before / after: drag the handle; each new pair sweeps in by itself ---------- */
G.Compare=function(root){
  root.classList.add('cmp');
  root.innerHTML=`<img class="b" alt=""><div class="a"><img alt=""></div><div class="mk"></div><div class="handle"><i>‹ ›</i></div><span class="la"></span><span class="lb"></span><div class="strips"></div>`;
  const A=$('.a img',root),B=$('img.b',root),top=$('.a',root),hd=$('.handle',root),la=$('.la',root),lb=$('.lb',root),st=$('.strips',root),mk=$('.mk',root);
  let pos=50,stop=null,single=false;
  const set=p=>{pos=Math.max(0,Math.min(100,p));top.style.clipPath=`inset(0 ${100-pos}% 0 0)`;hd.style.left=pos+'%';mk.style.clipPath=`inset(0 0 0 ${pos}%)`;
    la.style.opacity=pos>18?1:0;lb.style.opacity=pos<82?1:0};
  G.drag(root,(x,y,r)=>{if(single)return;if(stop){stop();stop=null}set((x-r.left)/r.width*100)});
  const ready=(im,src)=>new Promise(res=>{if(im.getAttribute('src')===src&&im.complete){res();return}im.onload=()=>res();im.onerror=()=>res();im.src=src});
  let tk=0;
  return {set,
    // marks (2026-10-16): [{x,y,st:'ok'|'ng'|'tbd',t,p:'u'|'u2'|'d'|'d2'}] on the after picture; end: handle position after the intro slide
    show(before,after,labA,labB,strips,marks,end){const my=++tk;root.classList.add('busy');
      Promise.all([ready(A,before),ready(B,after||before)]).then(()=>{if(my!==tk)return;root.classList.remove('busy');single=!after;root.classList.toggle('single',single);
        la.textContent=labA?'◀ '+labA:'';lb.textContent=labB?labB+' ▶':'';
        st.innerHTML=(strips||[]).map(s=>`<span>${s}</span>`).join('');
        root.classList.toggle('has-mk',!!(marks&&marks.length));   // phones hide the corner labels then (they cover the marks)
        mk.innerHTML=(marks||[]).map(m=>`<span class="mi ${m.st} ${m.p}${m.x<.12?' l':m.x>.88?' r':''}" style="left:${(m.x*100).toFixed(2)}%;top:${(m.y*100).toFixed(2)}%"><b>${{ok:'✓',ng:'✗',tbd:'？'}[m.st]}</b><em>${m.t}</em></span>`).join('');
        const e=end==null?50:end;if(stop)stop();if(single){set(100);return}set(100);stop=tween(1300,k=>set(100-(100-e)*k),ease.io)})},
    destroy(){tk++;if(stop)stop()}};
};

/* ---------- 24 h clock: rings = time windows; drag the hand (or tap the dial) to any time ---------- */
G.Clock=function(root,rings,onTime){
  root.innerHTML='<svg viewBox="0 0 460 460" class="clock"></svg>';const svg=$('svg',root);const cx=230,cy=230,R=170;
  const ang=h=>(h/24)*Math.PI*2-Math.PI/2,P=(h,r)=>[cx+r*Math.cos(ang(h)),cy+r*Math.sin(ang(h))];
  el('circle',{cx,cy,r:R+30,fill:'#0e151c',stroke:'rgba(255,255,255,.12)'},svg);
  // night / day shading of the dial
  for(let h=0;h<24;h++){const [x1,y1]=P(h,R+8),[x2,y2]=P(h,R+(h%6?14:20));el('line',{x1,y1,x2,y2,stroke:'rgba(255,255,255,.45)','stroke-width':h%6?1:2.4},svg);
    if(h%3===0){const [tx,ty]=P(h,R+44);T(svg,tx,ty+5,G.pad(h),{'text-anchor':'middle',fill:'#93a3b3','font-size':14})}}
  const RR=[R-16,R-50];
  const arc=(h0,h1,r,col)=>{const span=((h1-h0+24)%24)||24;const [x0,y0]=P(h0,r),[x1,y1]=P(h0+span,r),[xm,ym]=P(h0+12,r);
    const d=span>=24?`M${x0},${y0} A${r},${r} 0 1 1 ${xm},${ym} A${r},${r} 0 1 1 ${x0},${y0}`:`M${x0},${y0} A${r},${r} 0 ${span>12?1:0} 1 ${x1},${y1}`;
    const p=el('path',{d,fill:'none',stroke:col,'stroke-width':24,'stroke-linecap':'butt'},svg);const len=p.getTotalLength();
    p.setAttribute('stroke-dasharray',len);p.setAttribute('stroke-dashoffset',len);return {p,len}};
  RR.forEach(r=>el('circle',{cx,cy,r,fill:'none',stroke:'rgba(255,255,255,.06)','stroke-width':24},svg));
  const arcs=rings.map((a,i)=>Object.assign(arc(a.h0,a.h1,RR[i],a.col),a));
  // ring end labels (time at both ends)
  rings.forEach((a,i)=>{if(a.h1-a.h0<24)[a.h0,a.h1].forEach(hh=>{const [x,y]=P(hh,RR[i]);el('circle',{cx:x,cy:y,r:4,fill:'#fff'},svg)})});
  const hand=el('line',{x1:cx,y1:cy,x2:cx,y2:cy-R,stroke:'#fff','stroke-width':3,'stroke-linecap':'round'},svg);
  const knob=el('circle',{cx,cy:cy-R,r:13,fill:'#ffcc00',stroke:'#fff','stroke-width':3,class:'knob'},svg);el('circle',{cx,cy,r:6,fill:'#fff'},svg);
  const now=T(svg,cx,cy+50,'',{'text-anchor':'middle',fill:'#fff','font-size':34,'font-weight':700});
  const stat=T(svg,cx,cy+78,'',{'text-anchor':'middle',fill:'#93a3b3','font-size':14});
  const inR=(h,a)=>a.h0<a.h1?(h>=a.h0&&h<a.h1):(h>=a.h0||h<a.h1);
  let hour=16,stopRun=null;
  function set(h){hour=(h+24)%24;const a=ang(hour);hand.setAttribute('x2',cx+(R-14)*Math.cos(a));hand.setAttribute('y2',cy+(R-14)*Math.sin(a));
    knob.setAttribute('cx',cx+R*Math.cos(a));knob.setAttribute('cy',cy+R*Math.sin(a));
    const hh=Math.floor(hour),mm=Math.floor((hour-hh)*60);now.textContent=`${G.pad(hh)}:${G.pad(mm)}`;
    const work=inR(hour,{h0:21,h1:17});stat.textContent=work?'施工時段（每日 21:00～隔日 17:00）':'非施工時段';stat.setAttribute('fill',work?'#ff9b90':'#3ecf8e');
    arcs.forEach(a=>a.p.style.filter=inR(hour,a)?`drop-shadow(0 0 8px ${a.col})`:'none');
    onTime(hour,rings.map(r=>inR(hour,r)))}
  G.drag(svg,(x,y,r)=>{if(stopRun){stopRun();stopRun=null}const px=(x-r.left)/r.width*460-cx,py=(y-r.top)/r.height*460-cy;
    let h=(Math.atan2(py,px)+Math.PI/2)/(Math.PI*2)*24;h=(h+24)%24;set(Math.round(h*4)/4)});
  set(16);
  return {set,
    jump(to){if(stopRun)stopRun();const from=hour;let d=((to-from)%24+24)%24;if(d>12)d-=24;stopRun=tween(700,k=>set(from+d*k),ease.io)},
    intro(){arcs.forEach((a,i)=>setTimeout(()=>tween(800,t=>a.p.setAttribute('stroke-dashoffset',a.len*(1-t)),ease.io),200+i*400));
      setTimeout(()=>{stopRun=tween(6000,t=>set(16+28*t),ease.io)},1200)},
    destroy(){if(stopRun)stopRun()}};
};

/* ---------- edge-light circuits: three switches (R1 only / R3 only / all on, user 2026-10-10); picture + runway schematic follow.
   All three pictures share the R1 / R3 camera (user 2026-10-10: "全開時的視角請改成跟R1 R3一樣"; all1 = R1 and R3 frames combined).
   Schematic (user 2026-10-10: "邊燈前後都有一黃一白", "示意圖而已，先依比例放入，但要說明正確數量"): drawings E-11～E-18 have 99 lights
   per side, the 21 nearest each end yellow / white (yellow face towards the runway middle) and 57 white / white between; the schematic
   draws 39 per side with the same share at each end (39 × 21 / 99 ≈ 8) and states the real numbers under it. ---------- */
G.Circuits=function(root,A){
  const cap={R1:A.captions[1],R3:A.captions[2],ALL:A.captions[3]};
  root.innerHTML=`<div class="circ"><div class="stage lstage"><img alt="跑道邊燈"><img alt="" class="hidden"><div class="loupe"></div>
      <div class="lhint">${G.touch?'點畫面可放大看燈':'滑鼠移到畫面上可放大看燈'}</div></div>
    <aside class="board"><h3>迴路開關</h3>
      <button class="sw on" data-c="R1" type="button"><i></i><span><b>R1 迴路</b><small>${cap.R1[2]}</small></span></button>
      <button class="sw" data-c="R3" type="button"><i></i><span><b>R3 迴路</b><small>${cap.R3[2]}</small></span></button>
      <button class="sw" data-c="ALL" type="button"><i></i><span><b>全開</b><small>R1、R3 兩個迴路一起開</small></span></button>
      <div class="state"><b></b><span></span></div></aside>
    <svg class="lstrip"></svg><div class="lleg"><span><i class="w"></i>白/白</span><span><i class="y"></i>黃/白（黃光朝跑道中段）</span><span class="mut">相鄰的燈分屬 R1、R3 兩個迴路</span></div><p class="lnote">示意圖依比例縮畫。實際每側 99 盞（R1、R3 相鄰交錯）：兩端各 21 盞黃/白，中間 57 盞白/白。</p></div>`;
  const stage=$('.lstage',root),imgs=$$('.lstage>img',root),loupe=$('.loupe',root);
  const on={R1:true,R3:false};let front=imgs[0],back=imgs[1],cur='';
  Object.values(A.circuits).forEach(s=>{const im=new Image();im.src=s});
  // schematic: lights alternate between the two circuits (R1 at both ends, as on the drawings), both ends bidirectional end lights
  const svg=$('.lstrip',root);svg.setAttribute('viewBox','0 0 1000 140');const X0=60,X1=940,RY=70,HW=36,N=39,NY=Math.round(N*21/99),lights=[];
  const YEL='#ffc53d',WHT='#f4f8ff',OFF='#39424c';
  const half=(g,dir)=>el('path',{d:`M0,-5.5 A5.5,5.5 0 0 ${dir>0?1:0} 0,5.5 Z`,fill:OFF},g);   // dir +1 = right half (faces 21), -1 = left half (faces 03)
  el('rect',{x:X0,y:RY-HW,width:X1-X0,height:2*HW,fill:'#151b22'},svg);
  for(let x=X0+30;x<X1-30;x+=34)el('line',{x1:x,y1:RY,x2:x+16,y2:RY,stroke:'#fff',opacity:.25,'stroke-width':1.4},svg);
  const defs=el('defs',{},svg);const f=el('filter',{id:'cgl',x:'-200%',y:'-200%',width:'500%',height:'500%'},defs);el('feGaussianBlur',{stdDeviation:3.2,result:'b'},f);
  const m=el('feMerge',{},f);el('feMergeNode',{in:'b'},m);el('feMergeNode',{in:'SourceGraphic'},m);
  for(let i=0;i<N;i++){const x=X0+12+(X1-X0-24)*i/(N-1),yw=i<NY?1:i>=N-NY?-1:0;   // yw: which way the yellow face looks (towards the middle)
    [RY-HW,RY+HW].forEach(y=>{const g=el('g',{transform:`translate(${x},${y})`},svg);
      const parts=yw?[[half(g,yw),YEL],[half(g,-yw),WHT]]:[[el('circle',{r:5.5,fill:OFF},g),WHT]];lights.push({g,parts,x,y,circ:i%2?'R3':'R1'})})}
  [[X0,-1],[X1,1]].forEach(([x,s])=>{for(let k=-2;k<=2;k++){el('circle',{cx:x+s*4,cy:RY+k*13,r:3.2,fill:'#3ecf8e',filter:'url(#cgl)'},svg);el('circle',{cx:x-s*4,cy:RY+k*13,r:3.2,fill:'#ff4d4d',filter:'url(#cgl)'},svg)}});
  T(svg,X0-14,RY+5,'03',{'text-anchor':'end',fill:'#fff','font-weight':700});T(svg,X1+14,RY+5,'21',{fill:'#fff','font-weight':700});
  // the legend is page text under the drawing (.lleg); the drawing marks where the yellow / white lights are
  [[X0+12,X0+12+(X1-X0-24)*(NY-1)/(N-1)],[X1-12-(X1-X0-24)*(NY-1)/(N-1),X1-12]].forEach(([a,b])=>{
    el('path',{d:`M${a-6},${RY-HW-14} V${RY-HW-19} H${b+6} V${RY-HW-14}`,fill:'none',stroke:YEL,'stroke-width':1.4,opacity:.8},svg);
    T(svg,(a+b)/2,RY-HW-24,'黃/白',{'text-anchor':'middle',fill:YEL,'font-size':13})});
  function pic(src){if(src===cur)return;cur=src;back.src=src;back.classList.remove('hidden');front.classList.add('hidden');[front,back]=[back,front];
    loupe.style.backgroundImage=`url(${src})`}
  function update(){$$('.sw',root).forEach(b=>b.classList.toggle('on',b.dataset.c==='ALL'?on.R1&&on.R3:on[b.dataset.c]));
    const k=on.R1&&on.R3?'ALL':on.R1?'R1':on.R3?'R3':'';const st=$('.state',root);
    pic(k==='ALL'?A.circuits.all1:k==='R1'?A.circuits.r1:A.circuits.r3);
    $('b',st).textContent=cap[k][1];$('span',st).textContent=cap[k][2];
    lights.forEach(l=>{const lit=on[l.circ];setTimeout(()=>{l.parts.forEach(([p,c])=>p.setAttribute('fill',lit?c:OFF));
      l.g.setAttribute('transform',`translate(${l.x},${l.y}) scale(${lit?1.18:1})`);if(lit)l.g.setAttribute('filter','url(#cgl)');else l.g.removeAttribute('filter')},(l.x-X0)/(X1-X0)*700)})}
  // R1 only / R3 only / all on: one circuit is always on (both off would only be a darkened picture)
  $$('.sw',root).forEach(b=>b.onclick=()=>{const c=b.dataset.c;if(c==='ALL')on.R1=on.R3=true;else{on.R1=c==='R1';on.R3=c==='R3'}update()});
  const Z=3;stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    loupe.style.left=(x-110)+'px';loupe.style.top=(y-110)+'px';loupe.style.backgroundSize=`${r.width*Z}px ${r.height*Z}px`;
    loupe.style.backgroundPosition=`${-(x*Z-110)}px ${-(y*Z-110)}px`;stage.classList.add('lens')});
  stage.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')stage.classList.remove('lens')});
  // touch: a tap shows the magnifier at that spot for a few seconds
  let lensT=null;stage.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')return;const r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
    loupe.style.left=(x-110)+'px';loupe.style.top=(y-110)+'px';loupe.style.backgroundSize=`${r.width*Z}px ${r.height*Z}px`;loupe.style.backgroundPosition=`${-(x*Z-110)}px ${-(y*Z-110)}px`;
    stage.classList.add('lens');clearTimeout(lensT);lensT=setTimeout(()=>stage.classList.remove('lens'),2600)});
  front.src=A.circuits.r1;cur=A.circuits.r1;loupe.style.backgroundImage=`url(${cur})`;
  return {play:update};
};

/* ---------- end lights: green faces approaching aircraft, red faces the runway (both ends) ---------- */
G.EndLights=function(svg){
  const NW=G.narrow();svg.setAttribute('viewBox',NW?'60 0 680 260':'0 0 800 260');const RY=130,X0=150,X1=650,HW=46;let alive=true;
  const defs=el('defs',{},svg);
  [['gG','#3ecf8e'],['gR','#ff4d4d']].forEach(([id,c])=>{const g=el('linearGradient',{id,x1:0,y1:0,x2:1,y2:0},defs);el('stop',{offset:0,'stop-color':c,'stop-opacity':.7},g);el('stop',{offset:1,'stop-color':c,'stop-opacity':0},g)});
  el('rect',{x:X0,y:RY-HW,width:X1-X0,height:2*HW,fill:'#18202a',stroke:'rgba(255,255,255,.15)'},svg);
  for(let x=X0+30;x<X1-30;x+=34)el('line',{x1:x,y1:RY,x2:x+16,y2:RY,stroke:'#fff',opacity:.35,'stroke-width':1.6},svg);
  T(svg,X0+26,RY+6,'03',{fill:'#fff','font-size':18,'font-weight':700,'text-anchor':'middle',transform:`rotate(90 ${X0+26} ${RY})`});
  T(svg,X1-26,RY+6,'21',{fill:'#fff','font-size':18,'font-weight':700,'text-anchor':'middle',transform:`rotate(-90 ${X1-26} ${RY})`});
  // beams: outward green, inward red, at both ends
  const beam=(x,dir,id)=>{const p=el('path',{d:`M${x},${RY-HW+6} L${x+dir*150},${RY-HW-40} L${x+dir*150},${RY+HW+40} L${x},${RY+HW-6} Z`,fill:`url(#${id})`,opacity:.12,style:'transition:opacity .5s'},svg);
    if(dir<0)p.setAttribute('fill',`url(#${id}L)`);return p};
  [['gGL','#3ecf8e'],['gRL','#ff4d4d']].forEach(([id,c])=>{const g=el('linearGradient',{id,x1:1,y1:0,x2:0,y2:0},defs);el('stop',{offset:0,'stop-color':c,'stop-opacity':.7},g);el('stop',{offset:1,'stop-color':c,'stop-opacity':0},g)});
  const b03g=beam(X0,-1,'gG'),b03r=beam(X0,1,'gR'),b21g=beam(X1,1,'gG'),b21r=beam(X1,-1,'gR');
  [[X0,-1],[X1,1]].forEach(([x,s])=>{for(let k=-3;k<=3;k++){el('circle',{cx:x+s*4,cy:RY+k*12,r:3.6,fill:'#3ecf8e'},svg);el('circle',{cx:x-s*4,cy:RY+k*12,r:3.6,fill:'#ff4d4d'},svg)}});
  const msg=T(svg,400,NW?44:40,'',{'text-anchor':'middle',fill:'#fff','font-size':NW?30:18,'font-weight':700});
  if(!NW)T(svg,400,240,'兩端跑道頭末端燈每盞雙向：外側綠光朝進場航機、內側紅光朝跑道',{'text-anchor':'middle',fill:'#93a3b3','font-size':14});
  const pl=el('g',{},svg);const body=el('path',{d:G.PLANE,fill:'#eef3f8',stroke:'#6f7f8e','stroke-width':1.2},pl);
  const glow=(b,on)=>b.setAttribute('opacity',on?.9:.12);
  // 2026-10-13: follow(video, tl) = the plane sits where the model video's camera is (tl = S.endVideo); the runway part to scale,
  // the approach squeezed into x -40..X0; the plane (and the video, through fade) dims over the loop seam
  let raf=0,phase=-1;
  function follow(v,tl,fade){
    const {off,t1,t2,hold,n,sEnd}=tl,v1=sEnd/(t2*n/(n+1)),s0=-v1*t1,vlen=t1+t2+hold-off;
    const sta=t=>{if(t<=t1)return s0+v1*t;const u=Math.min(1,(t-t1)/t2);return v1*t2*(u-u**(n+1)/(n+1))};
    const sStart=sta(off),sx=s=>s<0?X0+(X0+40)*s/(-sStart):X0+(X1-X0)*s/G.L;
    const tick=()=>{if(!alive)return;
      const tv=Math.min(vlen,v.currentTime||0),t=tv+off,s=sta(t),sc=t<t1?1.25-.35*Math.min(1,(t-off)/(t1-off)):.9;
      pl.setAttribute('transform',`translate(${sx(s)-36*sc},${RY}) scale(${sc})`);   // nose (x 36) at the camera's station
      const ph=t<t1?0:1;
      if(ph!==phase){phase=ph;
        if(!ph){msg.textContent='進場航機：看到 03 端的綠光';msg.setAttribute('fill','#3ecf8e');glow(b03g,1);glow(b21r,0)}
        else{msg.textContent='在跑道上：看到 21 端的紅光';msg.setAttribute('fill','#ff6b5e');glow(b03g,0);glow(b21r,1)}}
      const f=Math.max(0,Math.min(1,(tv-(vlen-.5))/.5),1-tv/.3);pl.setAttribute('opacity',1-f);if(fade)fade.style.opacity=f;
      raf=requestAnimationFrame(tick)};
    tick()}
  function loop(){if(!alive)return;
    msg.textContent='進場航機：看到 03 端的綠光';msg.setAttribute('fill','#3ecf8e');glow(b03g,1);glow(b21r,0);
    tween(2600,k=>pl.setAttribute('transform',`translate(${-40+(X0+60+40)*k},${RY}) scale(${1.25-.35*k})`),ease.lin,()=>{
      glow(b03g,0);msg.textContent='在跑道上：看到 21 端的紅光';msg.setAttribute('fill','#ff6b5e');glow(b21r,1);
      tween(2600,k=>pl.setAttribute('transform',`translate(${X0+60+(X1-120-X0-60)*k},${RY}) scale(.9)`),ease.out,()=>setTimeout(()=>{if(!alive)return;
        tween(500,k=>pl.setAttribute('opacity',1-k),ease.lin,()=>{pl.setAttribute('opacity',1);glow(b21r,0);setTimeout(loop,400)})},900))})}
  return {play(){loop()},follow,destroy(){alive=false;cancelAnimationFrame(raf)}};
};

/* ---------- making-of pipeline: four stations, dots travel along the line ---------- */
G.Pipeline=function(svg,steps){
  if(G.narrow())return G.PipelineV(svg,steps);
  svg.setAttribute('viewBox','0 0 1200 230');const xs=steps.map((_,i)=>150+i*300),Y=86;
  const ln=el('path',{d:`M${xs[0]},${Y} H${xs[xs.length-1]}`,stroke:'#ffcc00','stroke-width':3,fill:'none','stroke-dasharray':1000,'stroke-dashoffset':1000},svg);
  const ICON=[ // cube, film frame, film strip, cursor
    'M-22,-10 L0,-22 L22,-10 L22,14 L0,26 L-22,14 Z M-22,-10 L0,2 L22,-10 M0,2 V26',
    'M-26,-18 H26 V18 H-26 Z M-26,-8 H26 M-18,-18 V-8 M-6,-18 V-8 M6,-18 V-8 M18,-18 V-8',
    'M-26,-18 H26 V18 H-26 Z M-8,-8 L10,0 L-8,8 Z',
    'M-12,-22 L14,4 L2,6 L10,22 L4,25 L-4,9 L-12,17 Z'];
  const nodes=steps.map((s,i)=>{const g=el('g',{opacity:0,transform:`translate(${xs[i]},${Y})`},svg);
    el('circle',{r:46,fill:'#0f161e',stroke:'rgba(255,204,0,.8)','stroke-width':2.5},g);el('path',{d:ICON[i],fill:'none',stroke:'#fff','stroke-width':2.4,'stroke-linejoin':'round'},g);
    T(g,0,82,s[0],{'text-anchor':'middle',fill:'#fff','font-size':20,'font-weight':700});
    T(g,0,108,s[1],{'text-anchor':'middle',fill:'#93a3b3','font-size':14});return g});
  return {play(){tween(1600,k=>ln.setAttribute('stroke-dashoffset',1000*(1-k)),ease.io);
    nodes.forEach((g,i)=>setTimeout(()=>tween(600,k=>{g.setAttribute('opacity',k);g.setAttribute('transform',`translate(${xs[i]},${Y}) scale(${.6+.4*ease.back(k)})`)},ease.lin),i*380));
    setTimeout(()=>{for(let d=0;d<3;d++){const c=el('circle',{r:6,fill:'#ffcc00',cy:Y,cx:xs[0]},svg);svg.insertBefore(c,nodes[0]);
      const run=()=>tween(3000,k=>c.setAttribute('cx',xs[0]+(xs[xs.length-1]-xs[0])*k),ease.lin,()=>{if(svg.isConnected)run()});setTimeout(run,d*1000)}},1600)}};
};

/* phones: the same four stations top to bottom, text beside each */
G.PipelineV=function(svg,steps){
  const X=56,ys=steps.map((_,i)=>56+i*128),H=ys[ys.length-1]+70;svg.setAttribute('viewBox',`0 0 400 ${H}`);
  const ln=el('path',{d:`M${X},${ys[0]} V${ys[ys.length-1]}`,stroke:'#ffcc00','stroke-width':3,fill:'none','stroke-dasharray':1000,'stroke-dashoffset':1000},svg);
  const ICON=['M-22,-10 L0,-22 L22,-10 L22,14 L0,26 L-22,14 Z M-22,-10 L0,2 L22,-10 M0,2 V26','M-26,-18 H26 V18 H-26 Z M-26,-8 H26 M-18,-18 V-8 M-6,-18 V-8 M6,-18 V-8 M18,-18 V-8',
    'M-26,-18 H26 V18 H-26 Z M-8,-8 L10,0 L-8,8 Z','M-12,-22 L14,4 L2,6 L10,22 L4,25 L-4,9 L-12,17 Z'];
  const nodes=steps.map((s,i)=>{const g=el('g',{opacity:0,transform:`translate(${X},${ys[i]})`},svg);
    el('circle',{r:42,fill:'#0f161e',stroke:'rgba(255,204,0,.8)','stroke-width':2.5},g);el('path',{d:ICON[i],fill:'none',stroke:'#fff','stroke-width':2.4,'stroke-linejoin':'round'},g);
    T(g,62,-6,s[0],{fill:'#fff','font-size':24,'font-weight':700});
    const words=s[1].split('，');T(g,62,24,words[0]+(words[1]?'，':''),{fill:'#93a3b3','font-size':17});if(words[1])T(g,62,46,words[1],{fill:'#93a3b3','font-size':17});return g});
  return {play(){tween(1600,k=>ln.setAttribute('stroke-dashoffset',1000*(1-k)),ease.io);
    nodes.forEach((g,i)=>setTimeout(()=>tween(600,k=>g.setAttribute('opacity',k),ease.lin),i*380));
    setTimeout(()=>{for(let d=0;d<3;d++){const c=el('circle',{r:6,fill:'#ffcc00',cx:X,cy:ys[0]},svg);svg.insertBefore(c,nodes[0]);
      const run=()=>tween(3000,k=>c.setAttribute('cy',ys[0]+(ys[ys.length-1]-ys[0])*k),ease.lin,()=>{if(svg.isConnected)run()});setTimeout(run,d*1000)}},1600)}};
};

/* ---------- PAPI (drawing E-38): four units A-D with elevation settings; above a unit's setting the pilot sees white, below red.
   Side view after E-38 "3°PAPI仰角示視圖" (angles exaggerated so the fan is readable). ---------- */
/* user 2026-10-11: until the visitor first drags, the aircraft sways up and down by itself and a "try it" prompt flashes; both go after
   the first drag and come back only on a page reload (this flag lives in memory).
   2026-10-16 r2 (user:「不要只新增一條決斷點的線，請融入並增加互動」): 決斷高度 (DH) is a level line, the 決斷點 where it meets the 3° slope;
   低雲 puts a cloud base under DH. DH and cloud base are schematic heights.
   r3 (user:「決斷高度那部分，沒有示意出什麼狀況要重飛」「我要在自己拖移時也能了解，並且我不需要拖移到進場面以內吧，無意義」): the four rules sit
   under the drawing (看得到跑道→落地；雲中看不到、太高 PAPI 全白、太低 PAPI 全紅→重飛); while dragging, the rule that applies lights up and the
   pilot panel says why; a click on a rule flies that case (parallel to the 3° slope: on it, above it or below it). The aircraft stays in
   the approach before the threshold (not on the ground; r5 range below). With the PAPI at OX the A-D fan at one height spans x in a 1 : 1.4
   ratio from the PAPI, so DH sits at the height (178) where all white / all red fall just inside that range.
   r4 (user:「決斷點那個互動，可以改成我拖移然後放掉就會沿著虛線進場嗎?」): dragging places the aircraft above DH and draws the dashed path it will
   fly (parallel to the 3° slope) down to the DH line; on release it flies that path, stops at DH while the rule lights up, then lands along
   the same line or goes around. The rule buttons fly the same way from a set start.
   r5 (user:「現在的決斷點可以往下移一點嗎? 太高重飛的範圍太小」): DH 178 -> 110 and the threshold 380 -> 200, so along the DH line the all-white
   part (threshold to x 305) is about as long as the 2-3 white part (305-395); the aircraft is dragged in x 250-600.
   r6 (user:「你的飛行軌跡不對，藍色虛線應該跟白色虛線相同」「重飛後飛機應該回右上角不是去左上角」): the path is the white sight line itself, from
   the aircraft straight at the PAPI, so the angle (and the lights) stay as they were at the release all the way to DH; a go-around pulls
   up ahead, turns and flies back out to where the approach started (upper right).
   r7 (user:「飛的速度再加快」「爬升重飛到左上角再回右上角」): about twice as fast; a go-around climbs out to the upper left corner first,
   then turns and flies back along the top to the start.
   r8 (user:「不要掉頭」): no turn: the aircraft climbs out of the picture at the upper left, fades, and comes back in at the start.
   r9 (user:「決斷點拿掉 保留決斷高度」): the 決斷點 marker and its label are gone; the DH line stays.
   r10 (user:「到決斷高度時那個閃綠光跟紅光保留，同時決斷高度時的停留少一點點」): the green / red flash comes back, where the aircraft meets
   DH (and the path's end dot takes that colour); the stop at DH 1.4 -> 1.0 s.
   r12 (user:「低雲有關的刪掉」): the 晴天／低雲 switch, the cloud band, the pilot-view fog and the 雲太低 rule are gone; three rules remain. */
let papiTried=false;
G.Papi=function(root,P){
  const D=P.dh;
  root.innerHTML=`<div class="papi"><div class="papi-side"><svg viewBox="0 0 640 330" aria-label="PAPI 仰角示意"></svg><div class="phint ${papiTried?'used':'demo'}"><i></i>${G.touch?'用手指':'用滑鼠'}拖曳飛機到起點，放開就沿虛線進場</div></div>
    <aside class="papi-pilot"><small>駕駛員看到的（左起 A～D，A 離跑道最遠）</small><div class="pmodel" hidden><img class="pm-main" alt="模型駕駛員畫面"><div class="pm-tele" hidden><img alt="PAPI 特寫"><span>PAPI 特寫</span></div><span class="pm-tag"></span><span class="pm-na">這個角度的模型畫面算圖中</span></div><svg viewBox="0 0 300 200"></svg><b class="pst"></b><span class="pen"></span>
      <p class="pdh"><span></span><button type="button" class="pga">重飛 ↗</button></p></aside></div>
    <div class="papi-rules"><div class="ph"><span><b>${D.head}</b><small>${D.sub}</small></span></div>
      <ul>${D.rules.map(([k,ok,t,r])=>`<li><button type="button" data-r="${k}" class="${ok?'ok':'ng'}"><i>${ok?'✓':'✗'}</i><span>${t}<em>→ ${r}</em></span></button></li>`).join('')}</ul></div>`;
  const sv=$('.papi-side svg',root),pv=$('.papi-pilot svg',root),st=$('.pst',root),en=$('.pen',root),hint=$('.phint',root);
  const pdh=$('.pdh',root),pdt=$('.pdh span',root),pga=$('.pga',root),rbs=$$('.papi-rules [data-r]',root);
  const F=G.narrow()?1.45:1;   // lettering scale on phones
  const E=8,OX=80,OY=282,TH=200,XMIN=250,XMAX=600,YMAX=OY-30,rad=d=>d*Math.PI/180,disp=a=>Math.atan(E*Math.tan(rad(a))),real=t=>Math.atan(Math.tan(t)/E)*180/Math.PI;
  const g3=disp(3),k3=Math.tan(g3),slopeY=x=>OY-(x-OX)*k3,angY=(x,a)=>OY-(x-OX)*Math.tan(disp(a));
  const YDH=OY-110,XDH=OX+110/k3,PX0=Math.round(XDH);   // schematic DH (XDH: where the 3° slope meets it; the marker was dropped 2026-10-16 r9)
  const halo={stroke:'#0b1016','stroke-width':4,'paint-order':'stroke','stroke-linejoin':'round'};
  el('rect',{x:10,y:OY,width:TH-10,height:9,fill:'#2a313a'},sv);el('line',{x1:10,y1:OY,x2:630,y2:OY,stroke:'rgba(255,255,255,.35)','stroke-width':2},sv);
  el('line',{x1:TH,y1:OY-8,x2:TH,y2:OY+12,stroke:'#fff','stroke-width':2.5},sv);
  T(sv,OX,OY+32,'PAPI 架設位置',{'text-anchor':'middle',fill:'#93a3b3','font-size':13*F});T(sv,TH,OY+32,'跑道頭',{'text-anchor':'middle',fill:'#93a3b3','font-size':13*F});
  // one line per unit at its setting: the line turns white while the aircraft is above it, red while below
  const rays=P.units.map(([n,a,lab])=>{const t=disp(a),x=OX+540*Math.cos(t),y=OY-540*Math.sin(t);
    const ln=el('line',{x1:OX,y1:OY,x2:x,y2:y,'stroke-width':2,style:'transition:stroke .3s'},sv);
    T(sv,x+2,y-6,`${n}　${lab}`,{'text-anchor':'end',fill:'#dfe6ee','font-size':Math.min(13*F,17)});return ln});
  if(F===1)T(sv,624,24,'每條線以上看到白光、以下看到紅光',{'text-anchor':'end',fill:'#93a3b3','font-size':12});   // phones: the drag hint sits there; the lead says it
  el('line',{x1:OX,y1:OY,x2:OX+600*Math.cos(g3),y2:OY-600*Math.sin(g3),stroke:'#ffcc00','stroke-width':1.6,'stroke-dasharray':'7 6',opacity:.8},sv);
  T(sv,OX+200*Math.cos(g3),OY-200*Math.sin(g3)+18,'3° 進場斜面',{fill:'#ffcc00','font-size':12.5*F,transform:`rotate(${-g3*180/Math.PI} ${OX+200*Math.cos(g3)} ${OY-200*Math.sin(g3)+18})`});
  // decision height: a level line from the threshold out (its height marked over the threshold); the 決斷點 turns green / red when reached
  el('line',{x1:TH,y1:YDH,x2:632,y2:YDH,stroke:'#ffcc00','stroke-width':1.5,'stroke-dasharray':'2 5'},sv);
  el('line',{x1:TH,y1:YDH,x2:TH,y2:OY-10,stroke:'#ffcc00','stroke-width':1,'stroke-dasharray':'2 4',opacity:.6},sv);
  T(sv,TH-6,YDH+5,D.line,Object.assign({'text-anchor':'end',fill:'#ffcc00','font-size':12.5*F,'font-weight':700},halo));
  el('rect',{x:OX-13,y:OY-12,width:26,height:10,rx:2,fill:'#dfe6ee'},sv);el('rect',{x:OX-9,y:OY-2,width:3,height:6,fill:'#93a3b3'},sv);el('rect',{x:OX+6,y:OY-2,width:3,height:6,fill:'#93a3b3'},sv);
  const sight=el('line',{x1:OX,y1:OY,x2:PX0,y2:OY,stroke:'#fff','stroke-width':1.4,'stroke-dasharray':'3 5',opacity:.7},sv);
  const path=el('line',{stroke:'#4fd2ff','stroke-width':2.6,'stroke-dasharray':'8 6','stroke-linecap':'round',opacity:0,'pointer-events':'none'},sv);   // the approach the aircraft will fly (cyan: apart from the white / red PAPI lines)
  const pend=el('circle',{r:5,fill:'#4fd2ff',stroke:'#0b1016','stroke-width':1.5,opacity:0,'pointer-events':'none'},sv);   // where it meets the DH line
  const flash=[0,1].map(()=>el('circle',{r:9,fill:'none','stroke-width':3,opacity:0,'pointer-events':'none'},sv));   // green / red flash at DH
  const plane=el('g',{style:'cursor:move;transition:opacity .3s'},sv);
  el('path',{d:'M-42,0 Q-38,-7 -27,-8 L22,-8 L36,-26 L45,-26 L40,-7 Q46,-1 42,4 L-27,7 Q-39,6 -42,0 Z',fill:'#eef3f8',stroke:'#6f7f8e','stroke-width':1.2},plane);
  el('path',{d:'M-8,2 L8,14 L19,14 L7,2 Z',fill:'#c9d2da'},plane);el('circle',{cx:-33,cy:-3,r:2.4,fill:'#1b2129'},plane);
  const arr=papiTried?null:el('path',{class:'p-arr',d:'M-8,-36 L0,-45 L8,-36 M-8,24 L0,33 L8,24 M-52,-7 L-60,0 L-52,7 M56,-7 L64,0 L56,7',fill:'none',stroke:'#ffcc00','stroke-width':3.5,'stroke-linecap':'round','stroke-linejoin':'round'},plane);   // drag me: four ways

  // pilot view: the runway looks taller or flatter (E-38 跑道狀態) and bigger when nearer; four lights; outer units turn white first
  const rw=el('path',{fill:'#2a313a',stroke:'rgba(255,255,255,.55)','stroke-width':1.5},pv),cl=el('line',{stroke:'#fff','stroke-width':2,'stroke-dasharray':'6 6',opacity:.7},pv);
  const lamps=[0,1,2,3].map(i=>{const g=el('g',{transform:`translate(${66+i*56},166)`},pv);el('rect',{x:-22,y:-14,width:44,height:28,rx:5,fill:'#11171e',stroke:'rgba(255,255,255,.18)'},g);
    T(g,0,30,P.units[i][0],{'text-anchor':'middle',fill:'#93a3b3','font-size':13});return el('circle',{r:9,fill:'#fff'},g)});
  let px=PX0,py=OY,cur=3,wh=2,mode='',anim=null,idle=null,tok=0,lastR='',auto=false,face=1;const COLS=['#ffffff','#ff4d4d'];   // face -1: flying back out (mirrored)
  const RULE={go:'go',land:'go',high:'high',low:'low'},NG=['high','low'];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function place(x,y,rot,free){px=free?x:clamp(x,XMIN,XMAX);py=free?clamp(y,14,OY-8):clamp(y,16,YMAX);
    plane.setAttribute('transform',`translate(${px},${py}) scale(${face},1) rotate(${rot==null?-7:rot})`);sight.setAttribute('x2',px);sight.setAttribute('y2',py);   // the sight line ends at the aircraft
    if(px>OX+40&&mode!=='goa'){cur=real(Math.atan(Math.max(.5,OY-py)/(px-OX)));   // landing roll and go-around: the lights stay as they were
      wh=P.units.filter(u=>cur>u[1]).length;rays.forEach((ln,i)=>ln.setAttribute('stroke',cur>P.units[i][1]?'rgba(255,255,255,.85)':'rgba(255,90,80,.85)'));
      lamps.forEach((c,i)=>{const w=i<wh;c.setAttribute('fill',w?COLS[0]:COLS[1]);c.style.filter=`drop-shadow(0 0 8px ${w?'#fff':'#ff4d4d'})`});
      const sc=clamp(.8+.55*(XMAX-px)/(XMAX-XMIN),.8,1.35),a=clamp(cur,1.3,4.6);
      const h=Math.min(108,(26+(a-1.3)*22)*sc),top=118-h,hw=70*sc,tw=14*sc;
      rw.setAttribute('d',`M${150-hw},118 L${150+hw},118 L${150+tw},${top} L${150-tw},${top} Z`);cl.setAttribute('x1',150);cl.setAttribute('y1',116);cl.setAttribute('x2',150);cl.setAttribute('y2',top+4);
      const s=P.states[4-wh];st.textContent=s[1];en.textContent=`${s[0]}　仰角約 ${cur.toFixed(2)}°`;st.dataset.k=4-wh}
    const at=py>=YDH-1;   // reached the decision height: the rules apply
    const k=mode||(!at?'above':wh>=4?'high':wh<=0?'low':'go');
    if(pdh.dataset.k!==k){pdh.dataset.k=k;pdt.textContent=D.st[k];pga.style.display=NG.includes(k)&&!mode&&!auto?'':'none';
      if(RULE[k]&&k!=='land'){const c=RULE[k]==='go'?'#3ecf8e':'#ff4d4d';pend.setAttribute('fill',c);   // reached DH: flash where the aircraft is
        flash.forEach((f,i)=>{f.setAttribute('cx',px);f.setAttribute('cy',py);f.setAttribute('stroke',c);
          setTimeout(()=>tween(800,t=>{f.setAttribute('r',10+30*t);f.setAttribute('opacity',1-t)},ease.out),i*220)})}}
    const r=k==='goa'?lastR:(RULE[k]||'');lastR=r;rbs.forEach(b=>b.classList.toggle('hit',b.dataset.r===r));
    mvShow();
  }
  // model pilot views (user 2026-10-20:「我要的是包含我在拖移時、放開游標飛機進場的過程以及重飛等等，都要有即時畫面喔」「以電腦為主」):
  // pictures rendered from the model (work/papi_pilot_20261020) along 13 rays of constant elevation (approach, landing, roll, go-around);
  // the one nearest the aircraft is shown, taken from a ray in the same PAPI colour interval so the lights in it are always right
  const pm=$('.pmodel',root),pmi=$('.pm-main',root),pmt=$('.pm-tele',root),pmti=$('.pm-tele img',root),pmg=$('.pm-tag',root);
  const KMP=60/(110/E),TS=P.units.map(u=>u[1]).sort((a,b)=>a-b),band=a=>TS.filter(t=>a>t).length;
  let MV=null,mvD=null,mvCur='',mvV=null,mvRay=null,mvGa=null;
  const mvURL=(k,id)=>`assets/aids/pilot/${k}/${id}.jpg?v=${MV.v}`;
  // 2026-10-21: no half-loaded model views. 32 at a time: on GitHub Pages a picture takes ~0.24 s to arrive whatever its size, so 8 at a
  // time needed ~65 s for the 2,114 pictures (measured online, HTTP/2) - the count of requests, not the MB, set the time
  // 2026-10-22: the pictures come from G.PapiPre - started on the home page in the background (desktop), so they are usually in before the
  // visitor gets here; arriving earlier, the gate shows its progress (and it speeds up to 32 at a time); nothing is usable half-loaded
  const pgate=G.LoadGate(root,null,{title:'模型畫面載入中',note:'載入完成前暫時無法操作'});
  const prog=(ok,n)=>{pgate.set(ok,n);const d=G.PapiPre.data;if(d&&d.mb)$('.lg-card small',root).textContent=`共 ${n.toLocaleString()} 張、約 ${Math.round(d.mb)} MB；載入完成前暫時無法操作`};
  G.PapiPre.progress(prog);G.PapiPre.start(32);
  G.PapiPre.then(()=>{const d=G.PapiPre.data;if(!d){pgate.open();return}const rays={},gab=[];
    d.views.forEach(v=>{v.lr=Math.log(Math.max(1,Math.hypot(v.d,v.h)));if(v.seg==='gab'){gab.push(v);return}
      const r=rays[v.ray]||(rays[v.ray]={a:+v.ray,band:band(+v.ray),app:[],land:[],roll:[],ga:[]});r[v.seg].push(v)});
    MV={v:d.v,rays:Object.values(rays),gab};pgate.open();pm.hidden=false;pv.setAttribute('viewBox','0 138 300 62');$('.papi',root).classList.add('has-mv');mvCur='';place(px,py)});
  function mvPick(x,y){
    if(mode==='goa'&&mvGa){const L=mvGa.gab?MV.gab:(mvGa.r?mvGa.r.ga:[]);if(!L.length)return null;
      const k=clamp(mvGa.t||0,0,1),i=Math.round(k*L.length)-1;return i<0?(mvGa.v0||L[0]):L[Math.min(i,L.length-1)]}
    const d=(x-OX)*KMP,h=(OY-y)*KMP/E,onRw=y>=OY-8.5;let ray=null;
    if(onRw&&mvRay&&mvRay.roll.length)ray=mvRay;   // landing roll: the ray it landed on
    else{const a=d>1?Math.atan(h/d)*180/Math.PI:3,b=band(a);let bd=1e9;MV.rays.forEach(r=>{if(r.band===b&&Math.abs(r.a-a)<bd){bd=Math.abs(r.a-a);ray=r}})}
    if(!ray)return null;mvRay=ray;
    const C=onRw?[...ray.land.slice(-1),...ray.roll]:[...ray.app,...ray.land],lr=Math.log(Math.max(1,Math.hypot(d,h)));
    let v=null,vd=1e9;C.forEach(c=>{const e=onRw?Math.abs(c.x-x):Math.abs(c.lr-lr);if(e<vd){vd=e;v=c}});return v}
  function mvShow(){if(!MV)return;const v=mvPick(px,py);pm.classList.toggle('na',!v);if(!v||v.id===mvCur)return;mvCur=v.id;mvV=v;
    pmi.src=mvURL('main',v.id);pmt.hidden=!v.tele;if(v.tele)pmti.src=mvURL('tele',v.id);
    const d=(px-OX)*KMP,h=(OY-py)*KMP/E;pmg.textContent=d>0?`模型畫面　距 PAPI ${Math.round(Math.hypot(d,h)).toLocaleString()} m　高 ${Math.round(h)} m`:`模型畫面　高 ${Math.round(h)} m`}
  const tried=()=>{if(papiTried)return;papiTried=true;hint.classList.remove('demo');hint.classList.add('used');if(arr)arr.remove()};
  const xdOf=(x,y)=>OX+(x-OX)*(OY-YDH)/(OY-y);   // where the sight line (aircraft -> PAPI) meets the DH line
  function showPath(x,y){const xd=xdOf(x,y);path.setAttribute('x1',x);path.setAttribute('y1',y);path.setAttribute('x2',xd);path.setAttribute('y2',YDH);
    pend.setAttribute('cx',xd);pend.setAttribute('cy',YDH);pend.setAttribute('fill','#4fd2ff');path.setAttribute('opacity',.85);pend.setAttribute('opacity',1);return xd}
  const hidePath=()=>{path.setAttribute('opacity',0);pend.setAttribute('opacity',0)};
  function halt(){tok++;plane.style.opacity=1;if(anim){anim();anim=null}if(idle){clearInterval(idle);idle=null}rbs.forEach(b=>b.classList.remove('run'));auto=false;if(mode){mode='';place(px,py)}}
  const fly=(ms,x0,y0,x1,y1,r0,r1,ez,free)=>new Promise(res=>{anim=tween(ms,k=>place(x0+(x1-x0)*k,y0+(y1-y0)*k,r0+(r1-r0)*k,free),ez||ease.lin,()=>{anim=null;res()})});
  const wait=ms=>new Promise(res=>setTimeout(res,ms));
  const done=at=>{mode='';auto=false;face=1;hidePath();rbs.forEach(b=>b.classList.remove('run'));place(at?at[0]:PX0,at?at[1]:angY(PX0,3.6))};
  // go-around: climb out ahead to the upper left corner and out of the picture, then come back in at the start of the approach (upper right)
  // 2026-10-22 (user:「重飛應該是一個曲線從往下到往上比較自然，不應該是直接改斜上」): a curve - it leaves along the approach (still
  // descending), bends and climbs to the upper left; the nose follows its direction. Same curve as work/papi_pilot_20261020/plan_views.py
  async function goAround(my,back){mvGa={x0:px,t:0,gab:!back,r:mvRay,v0:mvV};mode='goa';place(px,py);const x0=px,y0=py,b=back||[560,angY(560,3.4)];
    let ux=OX-x0,uy=OY-y0;const L=Math.hypot(ux,uy)||1;ux/=L;uy/=L;const D=.3*Math.hypot(30-x0,18-y0),x1=x0+ux*D,y1=y0+uy*D;
    const ang=t=>Math.atan2(-(2*(1-t)*(y1-y0)+2*t*(18-y1)),-(2*(1-t)*(x1-x0)+2*t*(30-x1)))*180/Math.PI,a0=ang(0);
    await new Promise(res=>{anim=tween(1300,k=>{mvGa.t=k;place((1-k)*(1-k)*x0+2*(1-k)*k*x1+k*k*30,(1-k)*(1-k)*y0+2*(1-k)*k*y1+k*k*18,
      clamp(-7+(ang(k)-a0)*.5,-12,18),true)},ease.io,()=>{anim=null;res()})});if(my!==tok)return;
    plane.style.opacity=0;await wait(350);if(my!==tok)return;done(b);plane.style.opacity=1}
  // fly the dashed path (the sight line) from (x0, y0) to the DH line; there the rule that applies lights up; 'go' carries on down it to the runway
  async function approach(x0,y0,my){auto=true;const xd=showPath(x0,y0);place(x0,y0,-7,true);
    await fly(Math.max(450,(x0-xd)*3),x0,y0,xd,YDH,-7,-7,ease.lin,true);if(my!==tok)return;   // same pace as the descent after DH (user:「前段的也加速」)
    await wait(1000);if(my!==tok)return;                                                  // at DH: the rule lights up, the panel says why
    if(pdh.dataset.k!=='go'){await goAround(my,[x0,y0]);return}
    const xt=xd+(OX-xd)*(OY-8-YDH)/(OY-YDH);path.setAttribute('x2',xt);path.setAttribute('y2',OY-8);pend.setAttribute('opacity',0);
    await fly((xd-xt)*3,xd,YDH,xt,OY-8,-7,-2,ease.lin,true);if(my!==tok)return;             // down to the runway
    mode='land';await fly(900,xt,OY-8,Math.max(34,xt-60),OY-8,-2,0,ease.out,true);if(my!==tok)return;   // roll
    await wait(1000);if(my!==tok)return;done([x0,y0])}
  // a rule's case: a start at a set angle (3° on the slope, 3.9° all white, 2.2° all red)
  const SA={go:[560,3],high:[470,3.9],low:[600,2.2]};
  function demo(r,b){halt();tried();const my=tok;b.classList.add('run');approach(SA[r][0],angY(...SA[r]),my)}
  rbs.forEach(b=>b.onclick=()=>demo(b.dataset.r,b));
  pga.onclick=()=>{halt();tried();auto=true;goAround(tok)};
  // drag: the start (in the approach, above DH) and its dashed path; release: fly it
  G.drag(sv,(x,y,r)=>{halt();tried();place((x-r.left)/r.width*640,Math.min((y-r.top)/r.height*330,YDH-12));showPath(px,py)},()=>approach(px,py,tok));
  place(PX0,angY(PX0,4));
  // idle sway 4.0° -> 1.8° -> 4.0° at the 決斷點 distance, 8 s a round: all five states pass by, and the aircraft crosses the DH line
  const sway=()=>{if(idle)return;const t0=Date.now();idle=setInterval(()=>{if(!document.hidden)place(PX0,angY(PX0,2.9+1.1*Math.cos((Date.now()-t0)/8000*2*Math.PI)))},40)};
  return {play(){if(!papiTried)sway();else{halt();const my=tok;anim=tween(4200,k=>{if(my===tok)place(PX0,angY(PX0,4-.4*k))},ease.io,()=>{anim=null})}},destroy(){halt();pgate.cancel();G.PapiPre.off(prog)}};
};

/* ---------- end lights as a model video (user 2026-10-13, replaces the 2026-10-11 still with the green row framed): approach over the
   03 end, braking to a stop short of the 21 end; G.EndLights.follow() moves its plane on this video's clock. Click = pause / play. ---------- */
G.EndVideo=function(root,m){
  root.innerHTML=`<div class="endvid"><div class="player"></div><span class="pp-cap">${m.cap}</span></div>`;
  const pl=$('.player',root),hv=G.HeroVideo(pl,m.mp4,[m.poster],24,null);
  const fade=h('div','ev-fade','',pl);   // darkens over the loop seam (driven by follow)
  return {video:$('video',pl),fade,destroy(){hv.destroy()}};
};

/* ---------- PAPI in the night frame (both circuits on): the row of four circled, with a 4x magnified inset ---------- */
G.PapiPhoto=function(root,src,units,cap,edge){   // edge (2026-10-16): {x,t} a dimension from unit D to the shoulder edge line, inside the 4x inset
  const xs=units.map(u=>u[0]),y=units[0][1],cx=(Math.min(...xs)+Math.max(...xs))/2,Z=4;
  const bx0=(Math.min(...xs)-.018)*1920,bx1=(Math.max(...xs)+.018)*1920,by0=(y-.022)*1080,by1=(y+.022)*1080;
  root.innerHTML=`<div class="pphoto"><img src="${src}" alt="${cap}"><svg viewBox="0 0 1920 1080" preserveAspectRatio="none">
      <rect x="${bx0}" y="${by0}" width="${bx1-bx0}" height="${by1-by0}" rx="22" fill="none" stroke="#ffcc00" stroke-width="5" class="pp-box"/>
      <line x1="${(bx0+bx1)/2}" y1="${by0}" x2="${(bx0+bx1)/2}" y2="${by0-120}" stroke="#ffcc00" stroke-width="4"/>
      <rect x="${(bx0+bx1)/2-150}" y="${by0-196}" width="300" height="76" rx="14" fill="rgba(12,17,22,.92)" stroke="#ffcc00" stroke-width="3"/>
      <text x="${(bx0+bx1)/2}" y="${by0-146}" text-anchor="middle" fill="#fff" font-size="40" font-weight="700" font-family="Microsoft JhengHei">PAPI　一排 4 盞</text></svg>
    <div class="pp-zoom" style="background-image:url(${src});background-size:${Z*100}% ${Z*100}%;background-position:${((cx-.5/Z)*Z/(Z-1)*100).toFixed(2)}% ${((y-.5/Z)*Z/(Z-1)*100).toFixed(2)}%"><span>放大 4 倍</span>${edge?`<i class="pp-dim" style="left:${((Math.max(...xs)-(cx-.5/Z))*Z*100).toFixed(2)}%;width:${((edge.x-Math.max(...xs))*Z*100).toFixed(2)}%;top:${((y-(y-.5/Z))*Z*100+7).toFixed(2)}%"><b>${edge.t}</b></i>`:''}</div>
    <span class="pp-cap">${cap}</span></div>`;
  root.querySelector('.pphoto').onclick=()=>G.lightbox(src,cap);
};

/* ---------- 05 站 著陸區標線：修改前與細設圖 (2026-10-19). r1 was a schematic calculator; r2 (user:「我要你用這個模型空照圖去做 上面放修改後，
   下面放修改前，然後橫移」): two model top-view strips, 修改後 above / 修改前 below, aligned on the threshold, in one sideways-scrolling box
   (drag with the mouse, swipe, or the range under it). On each strip, per 150 m slot, the code's pattern (5.2.6.3 / 5.2.6.4 / 表 5-1, as
   SITE.tdzCalc.cls / aim) against what is painted (row.draw): ✓ / ✗ 多畫 / 刪去 (near the aiming point). ---------- */
G.TdzCalc=function(root,D){
  const Sx=D.strip,X=d=>(d-Sx.d0)*Sx.pxm,YC=Sx.yc,HW=22.5*Sx.pxm,SL=22.5;
  const clsOf=l=>{let c=D.cls[0];D.cls.forEach(x=>{if(l>=x[0])c=x});return c},aimOf=l=>{let c=D.aim[0];D.aim.forEach(x=>{if(l>=x[0])c=x});return c};
  const sta=m=>{const t=Math.round(m);return `${Math.floor(t/1000)}K+${String(t%1000).padStart(3,'0')}`};
  const pat=arr=>{let s='';const last=arr.reduce((k,x,i)=>x>0?i:k,-1);for(let i=0;i<=last;i++)s+=arr[i]>0?arr[i]:'(無)';return s||'—'};
  const rows=D.rows.map(r=>{const c=clsOf(r.lda),am=aimOf(r.lda),L=am[2];
    const slots=[1,2,3,4,5,6].map(k=>{const p=150*k,n=c[2][k-1]||0,gap=Math.max(r.aim-(p+SL),p-(r.aim+L)),del=n>0&&gap<=50,d=(r.draw.find(x=>x[0]===p)||[0,0])[1];
      return {p,n,del,eff:del?0:n,d}});
    const extra=slots.filter(s=>s.d&&!s.eff).map(s=>s.p),diff=slots.filter(s=>s.d&&s.eff&&s.d!==s.eff).map(s=>s.p),miss=slots.filter(s=>s.eff&&!s.d).map(s=>s.p);
    return Object.assign({},r,{c,am,L,slots,code:pat(slots.map(s=>s.eff)),drawn:pat(slots.map(s=>s.d)),extra,diff,miss,ok:!extra.length&&!diff.length&&!miss.length})});
  const verdict=r=>r.ok?'✓ 配置正確':'✗ '+[r.extra.length?`多畫 ${r.extra.join('、')} m`:'',r.diff.length?`${r.diff.join('、')} m 條數不同`:'',r.miss.length?`少畫 ${r.miss.join('、')} m`:''].filter(Boolean).join('；');
  const rowHTML=r=>`<div class="tda-row" data-k="${r.k}" style="--h:${Sx.h}"><img src="${r.img}" alt="${r.label}俯視" draggable="false"><svg viewBox="0 0 ${Sx.w} ${Sx.h}" aria-hidden="true"></svg>
      <span class="tda-tag ${r.ok?'ok':'ng'}"><b>${r.label}</b>${r.sub}</span></div>`;
  root.innerHTML=`<div class="tda">
    <div class="chips tda-jump">${D.jumps.map(([t,d])=>`<button type="button" class="chip" data-d="${d}">${t}</button>`).join('')}</div>
    <div class="tda-scroll"><div class="tda-track">${rowHTML(rows[0])}<svg class="tda-axis" viewBox="0 0 ${Sx.w} 46" aria-hidden="true"></svg>${rowHTML(rows[1])}</div></div>
    <div class="tda-bar"><span>← 拖曳左右移動 →</span><input type="range" min="0" max="1000" value="0" aria-label="左右移動"></div>
    <dl class="tda-info">${rows.map(r=>`<dt>${r.label}<small>${r.lda.toLocaleString()} m</small></dt><dd>應為 <code>${r.code}</code>　${r.name} <code>${r.drawn}</code>　<span class="${r.ok?'ok':'ng'}">${verdict(r)}</span></dd>`).join('')}
      <dt>配置原則</dt><dd>1,500～2,400 m 為 4 對（6、6、4、4 條），2,400 m 以上為 6 對（6、6、4、4、2、2 條）；自跑道頭 150 m 起每 150 m 一對，離著陸點標線 50 m 內的刪去。</dd></dl></div>`;
  const GR='#3ecf8e',RD='#ff4d4d',WH='#eef3f8',YE='#ffcc00',MU='#c9d2db';
  const lab=(g,x,y,t,col,anchor)=>{const tx=T(g,x,y,t,{'text-anchor':anchor||'middle',fill:col,'font-size':17,'font-weight':700,stroke:'rgba(11,16,22,.85)','stroke-width':5,'paint-order':'stroke'});return tx};
  rows.forEach(r=>{const svg=$(`.tda-row[data-k="${r.k}"] svg`,root);
    r.slots.forEach(s=>{const x0=X(s.p)-5,x1=X(s.p+SL)+5,cx=(x0+x1)/2;
      if(!s.n&&!s.d)return;
      const bad=s.d!==s.eff;
      if(s.d&&bad)el('rect',{x:x0,y:YC-HW+2,width:x1-x0,height:2*HW-4,fill:'rgba(255,77,77,.18)',stroke:RD,'stroke-width':3,'stroke-dasharray':'8 5',rx:4},svg);
      else if(s.d)el('rect',{x:x0,y:YC-HW+2,width:x1-x0,height:2*HW-4,fill:'none',stroke:GR,'stroke-width':2,rx:4,opacity:.8},svg);
      const t=s.del&&!s.d?`${s.p} m 刪去（近著陸點）✓`:s.d&&!s.eff?`✗ 多畫 ${s.d} 條`:bad?`✗ ${s.d} 條（應 ${s.eff}）`:`✓ ${s.d} 條`;
      lab(svg,cx,YC-HW-12,t,s.del&&!s.d?MU:bad?'#ff6b5e':GR);
      lab(svg,cx,Sx.h-10,sta(r.sta0+s.p),WH)});
    const ax=X(r.aim),ax1=X(r.aim+r.L);lab(svg,(ax+ax1)/2,YC+HW+24,`著陸點 ${r.aim} m`,YE);
    lab(svg,X(0)+6,YC+HW+24,`跑道頭 ${sta(r.sta0)}`,YE,'start')});
  const axis=$('.tda-axis',root);el('line',{x1:X(0),y1:14,x2:X(1000),y2:14,stroke:'rgba(255,255,255,.35)'},axis);
  [0,150,300,450,600,750,900].forEach(d=>{el('line',{x1:X(d),y1:6,x2:X(d),y2:22,stroke:'rgba(255,255,255,.6)','stroke-width':2},axis);
    T(axis,X(d),40,d?`${d} m`:'跑道頭 0',{'text-anchor':'middle',fill:'#93a3b3','font-size':16})});
  // panning: native scroll (trackpad / touch), mouse drag, the range, and the jump chips
  const sc=$('.tda-scroll',root),rg=$('.tda-bar input',root),track=$('.tda-track',root);
  const sync=()=>{const m=sc.scrollWidth-sc.clientWidth;rg.value=m>0?Math.round(sc.scrollLeft/m*1000):0};
  sc.addEventListener('scroll',sync,{passive:true});
  rg.addEventListener('input',()=>{sc.scrollLeft=(sc.scrollWidth-sc.clientWidth)*rg.value/1000});
  let dx=null,sl=0;
  sc.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;dx=e.clientX;sl=sc.scrollLeft;sc.classList.add('grab');try{sc.setPointerCapture(e.pointerId)}catch(_){}});
  sc.addEventListener('pointermove',e=>{if(dx==null)return;sc.scrollLeft=sl-(e.clientX-dx)});
  const end=()=>{dx=null;sc.classList.remove('grab')};sc.addEventListener('pointerup',end);sc.addEventListener('pointercancel',end);
  $$('.tda-jump .chip',root).forEach(b=>b.onclick=()=>{const k=track.clientWidth/Sx.w;sc.scrollTo({left:Math.max(0,X(+b.dataset.d)*k-sc.clientWidth/2),behavior:G.reduced?'auto':'smooth'})});
  return {rows};
};

})();
