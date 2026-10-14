'use strict';
function E(id){return document.getElementById(id);}
const CTRLS=[];
function stopAll(){CTRLS.forEach(function(c){if(c&&c.stop)c.stop();});}

let _ac=null;
function AC(){
  if(!_ac){try{_ac=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}
  if(_ac.state==='suspended'){try{_ac.resume();}catch(e){}}
  return _ac;
}
function beep(f,d,t,type,g){
  const a=AC();if(!a)return;
  try{
    const o=a.createOscillator(),gn=a.createGain();
    o.type=type||'sine';o.frequency.value=f;o.connect(gn);gn.connect(a.destination);
    const n=a.currentTime+(t||0);
    gn.gain.setValueAtTime(0.0001,n);
    gn.gain.linearRampToValueAtTime(g||0.07,n+0.012);
    gn.gain.exponentialRampToValueAtTime(0.0001,n+(d||0.12));
    o.start(n);o.stop(n+(d||0.12)+0.03);
  }catch(e){}
}
function sfxStep(){beep(520,0.07,0,'triangle',0.045);}
function sfxGood(){beep(660,0.1,0,'sine',0.06);beep(880,0.13,0.08,'sine',0.05);}
function sfxBad(){beep(210,0.16,0,'sawtooth',0.05);}
function sfxDone(){beep(523,0.12,0,'sine',0.06);beep(659,0.12,0.1,'sine',0.06);beep(784,0.12,0.2,'sine',0.06);beep(1046,0.32,0.3,'sine',0.06);}

function confetti(){
  const host=E('confetti');if(!host)return;
  const colors=['#00d4ff','#9b59b6','#f1c40f','#48d0b0','#ff6b6b','#e84393'];
  for(let i=0;i<70;i++){
    const s=document.createElement('span');
    s.className='pc';
    s.style.left=(Math.random()*100)+'%';
    s.style.width=(5+Math.random()*7)+'px';
    s.style.height=(8+Math.random()*10)+'px';
    s.style.background=colors[i%colors.length];
    s.style.borderRadius=Math.random()>0.5?'50%':'2px';
    s.style.animationDuration=(1.6+Math.random()*1.6)+'s';
    s.style.animationDelay=(Math.random()*0.5)+'s';
    host.appendChild(s);
  }
  setTimeout(function(){host.innerHTML='';},3600);
}

function chipsUI(kind,n,items,cur,opStyle){
  const w=E(kind+n);if(!w)return;
  if(!items||!items.length){w.innerHTML='';return;}
  let h='';
  for(let i=0;i<items.length;i++){
    h+='<span class="sq'+(opStyle?' op':'')+(i<cur?' done':'')+(i===cur?' cur':'')+'">'+items[i]+'</span>';
  }
  w.innerHTML=h;
}
function statsUI(n,st){
  const w=E('stats'+n);if(!w)return;
  if(!st||!st.stats){w.innerHTML='';return;}
  w.innerHTML=st.stats.map(function(p){return '<span class="stat">'+p[0]+'<b>'+p[1]+'</b></span>';}).join('');
}

function makeCtrl(n,buildSteps,render){
  const playBtn=E('play'+n),stepBtn=E('step'+n),resetBtn=E('reset'+n);
  const spd=E('spd'+n),spdv=E('spdv'+n);
  const status=E('s'+n),prog=E('prog'+n),res=E('res'+n),log=E('log'+n);
  let steps=[],idx=0,timer=null;
  function delay(){return spd?+spd.value:600;}
  if(spd&&spdv){spdv.textContent=(spd.value/1000).toFixed(2)+'s';
    spd.addEventListener('input',function(){spdv.textContent=(spd.value/1000).toFixed(2)+'s';});}
  function addLog(t,cls){
    if(!log)return;
    const d=document.createElement('div');
    d.className='log-line'+(cls?' '+cls:'');
    d.textContent=t;
    log.appendChild(d);
    log.scrollTop=log.scrollHeight;
  }
  function show(silent){
    try{
      const st=steps[idx];
      if(!st)return;
      render(st,n);
      if(status){status.textContent=st.msg;status.className='status'+(st.cls?' '+st.cls:'');}
      if(prog){prog.style.width=(steps.length>1?(idx/(steps.length-1))*100:100)+'%';}
      if(st.log)addLog(st.log,st.lcls);
      if(res){
        if(st.done){res.textContent=st.res||'';res.className='result show'+(st.bad?' bad':'');}
        else{res.className='result';}
      }
      if(!silent){
        if(st.sfx==='good')sfxGood();
        else if(st.sfx==='bad')sfxBad();
        else if(st.sfx==='done'){sfxDone();confetti();}
        else sfxStep();
      }
    }catch(e){
      if(status){status.textContent='Error: '+e.message;status.className='status err';}
      stop();
    }
  }
  function stop(){
    if(timer){clearTimeout(timer);timer=null;}
    if(playBtn)playBtn.innerHTML='&#9654; Play';
  }
  function atEnd(){return idx>=steps.length-1;}
  function advance(){
    if(atEnd()){stop();return false;}
    idx++;show(false);return true;
  }
  function tick(){
    timer=setTimeout(function(){
      timer=null;
      if(!advance())return;
      if(atEnd()){stop();return;}
      tick();
    },delay());
  }
  function play(){
    if(timer){stop();return;}
    if(atEnd())reset(false);
    if(playBtn)playBtn.innerHTML='&#9646;&#9646; Pause';
    if(atEnd()){stop();return;}
    tick();
  }
  function stepOnce(){stop();if(!atEnd()){idx++;show(false);}}
  function reset(silent){
    stop();
    try{steps=buildSteps();}catch(e){steps=[{msg:'Error: '+e.message,cls:'err'}];}
    idx=0;
    if(log)log.innerHTML='';
    if(res)res.className='result';
    show(silent!==false);
  }
  reset(true);
  if(playBtn)playBtn.addEventListener('click',play);
  if(stepBtn)stepBtn.addEventListener('click',stepOnce);
  if(resetBtn)resetBtn.addEventListener('click',function(){reset(false);});
  const api={reset:reset,stop:stop,step:stepOnce};
  CTRLS[n]=api;
  return api;
}

/* ===================== shared: CLRS flow network ===================== */
const FN_NAMES=['s','v1','v2','v3','v4','t'];
const FN_DEFS=[[0,1,16],[0,2,13],[1,2,10],[2,1,4],[1,3,12],[3,2,9],[2,4,14],[4,3,7],[3,5,20],[4,5,4]];
function mkEdges(){return FN_DEFS.map(function(e){return{u:e[0],v:e[1],cap:e[2],flow:0};});}
function resid(edges,u,v){
  let r=0;
  for(let i=0;i<edges.length;i++){
    const e=edges[i];
    if(e.u===u&&e.v===v)r+=e.cap-e.flow;
    else if(e.u===v&&e.v===u)r+=e.flow;
  }
  return r;
}
function buildPath(parent){
  const p=[];
  let v=5;
  while(v!==0){p.push(v);v=parent[v];if(v===undefined||v<0)return null;}
  p.push(0);
  p.reverse();
  return p;
}
function bfsPath(edges){
  const parent=new Array(6).fill(-1);
  const dist=new Array(6).fill(-1);
  parent[0]=0;dist[0]=0;
  const order=[0];
  let head=0;
  while(head<order.length){
    const u=order[head++];
    for(let v=0;v<6;v++){
      if(parent[v]<0&&resid(edges,u,v)>0){parent[v]=u;dist[v]=dist[u]+1;order.push(v);}
    }
  }
  const path=buildPath(parent);
  if(!path)return null;
  const levels=[];
  for(let i=0;i<order.length;i++){
    const d=dist[order[i]];
    if(!levels[d])levels[d]=[];
    levels[d].push(order[i]);
  }
  return {path:path,levels:levels};
}
function dfsPath(edges){
  const parent=new Array(6).fill(-1);
  parent[0]=0;
  const stack=[0];
  while(stack.length){
    const u=stack.pop();
    if(u===5)break;
    const cands=[];
    for(let v=0;v<6;v++)if(parent[v]<0&&resid(edges,u,v)>0)cands.push(v);
    for(let i=cands.length-1;i>=0;i--){parent[cands[i]]=u;stack.push(cands[i]);}
  }
  const path=buildPath(parent);
  if(!path)return null;
  return {path:path,levels:null};
}
function hopInfo(edges,u,v){
  let r=resid(edges,u,v);
  for(let i=0;i<edges.length;i++){
    const e=edges[i];
    if(e.u===u&&e.v===v&&e.flow<e.cap)return {i:i,dir:1,r:r};
  }
  for(let i=0;i<edges.length;i++){
    const e=edges[i];
    if(e.u===v&&e.v===u&&e.flow>0)return {i:i,dir:-1,r:r};
  }
  return {i:-1,dir:0,r:r};
}
function pathInfo(edges,path){
  const hops=[];
  let f=Infinity;
  for(let k=0;k<path.length-1;k++){
    const h=hopInfo(edges,path[k],path[k+1]);
    hops.push(h);
    if(h.r<f)f=h.r;
  }
  return {f:f,hops:hops};
}
function hopApply(edges,u,v,amount){
  let rem=amount;
  for(let i=0;i<edges.length&&rem>0;i++){
    const e=edges[i];
    if(e.u===u&&e.v===v){
      const add=Math.min(e.cap-e.flow,rem);
      e.flow+=add;rem-=add;
    }
  }
  for(let i=0;i<edges.length&&rem>0;i++){
    const e=edges[i];
    if(e.u===v&&e.v===u){
      const take=Math.min(e.flow,rem);
      e.flow-=take;rem-=take;
    }
  }
}
function flowOut(edges){
  let f=0;
  for(let i=0;i<edges.length;i++){
    if(edges[i].u===0)f+=edges[i].flow;
    if(edges[i].v===0)f-=edges[i].flow;
  }
  return f;
}
function consViolation(edges){
  let viol=0;
  for(let v=1;v<=4;v++){
    let inF=0,outF=0;
    for(let i=0;i<edges.length;i++){
      if(edges[i].v===v)inF+=edges[i].flow;
      if(edges[i].u===v)outF+=edges[i].flow;
    }
    viol+=Math.abs(inF-outF);
  }
  return viol;
}
function reachSet(edges){
  const seen=new Array(6).fill(false);
  seen[0]=true;
  const q=[0];
  let head=0;
  while(head<q.length){
    const u=q[head++];
    for(let v=0;v<6;v++)if(!seen[v]&&resid(edges,u,v)>0){seen[v]=true;q.push(v);}
  }
  return seen;
}
function namesOf(set){
  const a=[];
  for(let i=0;i<6;i++)if(set[i])a.push(FN_NAMES[i]);
  return '{'+a.join(', ')+'}';
}
function flowBuild(mode){
  const steps=[];
  const edges=mkEdges();
  const chips=['init'];
  const bfs=mode==='bfs';
  let curPath=null,curHops=null,curLevels=null,reach=null,cutEdges=null,iter=0;
  const augList=[];
  function snap(msg,o){
    o=o||{};
    o.msg=msg;
    o.edges=edges.map(function(e){return{u:e.u,v:e.v,cap:e.cap,flow:e.flow};});
    o.path=curPath?curPath.slice():null;
    o.pathTxt=curPath?curPath.map(function(i){return FN_NAMES[i];}).join(' → '):null;
    o.pathEdge=curHops?curHops.filter(function(h){return h.i>=0;}).map(function(h){return{i:h.i,dir:h.dir};}):null;
    o.levels=curLevels?curLevels.map(function(l){return l.slice();}):null;
    o.reach=reach?reach.slice():null;
    o.cutEdge=cutEdges?cutEdges.slice():null;
    o.chips=chips.slice();
    o.chipI=chips.length-1;
    const F=flowOut(edges);
    o.stats=[['Flow',F],['Rounds',iter],['Edges','10']];
    if(reach)o.stats.push(['Min cut',curCutCap]);
    steps.push(o);
  }
  let curCutCap=0;
  snap(bfs?'Edmonds-Karp: BFS shortest augmenting paths on the CLRS network — flows start at 0':'Ford-Fulkerson: DFS augmenting paths on the CLRS network — flows start at 0',{chipI:0});
  while(true){
    const r=bfs?bfsPath(edges):dfsPath(edges);
    if(!r)break;
    iter++;
    curPath=r.path;
    curLevels=r.levels;
    const pi=pathInfo(edges,r.path);
    curHops=pi.hops;
    chips.push('P'+iter);
    snap((bfs?'BFS':'DFS')+' augmenting path: '+curPath.map(function(i){return FN_NAMES[i];}).join(' → '),{cls:'hl',log:'P'+iter+': '+curPath.map(function(i){return FN_NAMES[i];}).join(' → ')+' (len '+(curPath.length-1)+')',lcls:'hl'});
    snap('bottleneck = min residual along path = '+pi.f,{log:'bottleneck '+pi.f,lcls:'hl'});
    for(let k=0;k<curPath.length-1;k++)hopApply(edges,curPath[k],curPath[k+1],pi.f);
    augList.push(pi.f);
    const F=flowOut(edges);
    snap('augment +'+pi.f+' — total flow = '+F,{log:'flow → '+F,lcls:'ok',cls:'ok'});
  }
  curPath=null;curHops=null;curLevels=null;
  reach=reachSet(edges);
  cutEdges=[];
  curCutCap=0;
  for(let i=0;i<edges.length;i++){
    if(reach[edges[i].u]&&!reach[edges[i].v]){cutEdges.push(i);curCutCap+=edges[i].cap;}
  }
  chips.push('cut');
  snap('no augmenting path remains in the residual network — max flow reached',{log:'residual cut off',lcls:'ok'});
  snap('min cut: '+namesOf(reach)+' | '+namesOf(reach.map(function(x){return !x;}))+' — capacity = '+curCutCap,{cls:'ok',log:'min cut cap '+curCutCap,lcls:'ok'});
  const F=flowOut(edges);
  const viol=consViolation(edges);
  const ok=(F===23&&curCutCap===23&&viol===0);
  chips.push('verify');
  const cutName=namesOf(reach);
  snap(ok?'max flow = min cut = 23 — verified':'VERIFICATION FAILED',
    {done:true,bad:!ok,cls:ok?'ok':'err',
     res:ok?('✓ Max flow = 23 · '+(bfs?'Edmonds-Karp (BFS)':'Ford-Fulkerson (DFS)')+' · '+iter+' augmentations ['+augList.join('+')+'] · min cut '+cutName+' = 23 — conservation OK, max-flow min-cut theorem holds'):'✗ flow '+F+' cut '+curCutCap+' viol '+viol,
     sfx:ok?'done':'bad'});
  return steps;
}
function renderFlow(st,n){
  chipsUI('ops',n,st.chips||[],st.chipI||0,true);
  statsUI(n,st);
  const g=E('fgraph'+n);
  if(g){
    const cols=[1,2,2,3,3,4],rows=[2,1,2,1,2,2];
    let h='';
    for(let i=0;i<6;i++){
      let cls='fnode';
      if(i===0)cls+=' src';
      if(i===5)cls+=' snk';
      if(st.path&&st.path.indexOf(i)>=0)cls+=' path';
      let role=i===0?'source':(i===5?'sink':'');
      if(st.reach){cls+=st.reach[i]?' cutin':' cutout';role=st.reach[i]?'set S':'set T';}
      h+='<div class="'+cls+'" style="grid-column:'+cols[i]+';grid-row:'+rows[i]+'"><span>'+FN_NAMES[i]+'</span><span class="fnrole">'+role+'</span></div>';
    }
    g.innerHTML=h;
  }
  const fp=E('fpath'+n);
  if(fp)fp.textContent=st.pathTxt||st.cutTxt||'';
  const bl=E('bfs'+n);
  if(bl){
    if(st.levels){
      bl.innerHTML=st.levels.map(function(l,i){
        return '<span class="flv">L'+i+': '+l.map(function(k){return FN_NAMES[k];}).join(' ')+'</span>';
      }).join('');
    }else bl.innerHTML='';
  }
  const fe=E('fedges'+n);
  if(fe){
    let h='';
    for(let i=0;i<st.edges.length;i++){
      const e=st.edges[i];
      let cls='fedge',hl=false,rev=false;
      if(st.pathEdge){
        for(let k=0;k<st.pathEdge.length;k++){
          if(st.pathEdge[k].i===i){hl=true;if(st.pathEdge[k].dir===-1)rev=true;}
        }
      }
      if(hl)cls+=' onpath';
      if(rev)cls+=' rev';
      if(e.flow===e.cap&&e.cap>0)cls+=' sat';
      if(st.cutEdge&&st.cutEdge.indexOf(i)>=0)cls+=' cutedge';
      const pct=e.cap?Math.round(e.flow/e.cap*100):0;
      h+='<div class="'+cls+'"><span class="feu">'+FN_NAMES[e.u]+' → '+FN_NAMES[e.v]+'</span>'+
         '<span class="fef">'+e.flow+'/'+e.cap+'</span>'+
         '<div class="etrack"><div class="efill" style="width:'+pct+'%"></div></div></div>';
    }
    fe.innerHTML=h;
  }
}

/* ===================== 2: VERTEX COVER (2-approx) ===================== */
const VC_NAMES=['A','B','C','D','E','F','G','H'];
const VC_EDGES=[[0,1],[1,2],[2,3],[3,0],[1,4],[2,5],[4,5],[5,6],[5,7]];
function vcOpt(){
  let best=99,bestMask=-1;
  for(let mask=0;mask<256;mask++){
    let pc=0;
    for(let i=0;i<8;i++)if(mask&(1<<i))pc++;
    if(pc>=best)continue;
    let all=true;
    for(let k=0;k<VC_EDGES.length&&all;k++){
      const u=VC_EDGES[k][0],v=VC_EDGES[k][1];
      if(!((mask>>u)&1)&&!((mask>>v)&1))all=false;
    }
    if(all){best=pc;bestMask=mask;}
  }
  const set=[];
  for(let i=0;i<8;i++)if((bestMask>>i)&1)set.push(VC_NAMES[i]);
  return {size:best,mask:bestMask,set:set};
}
function vcBuild(){
  const steps=[];
  const chips=['graph'];
  const picked=new Array(8).fill(false);
  const coverOrder=[];
  let curEdge=-1,opt=null;
  function snap(msg,o){
    o=o||{};
    o.msg=msg;
    o.picked=picked.slice();
    o.coverOrder=coverOrder.slice();
    o.curEdge=curEdge;
    o.chips=chips.slice();
    o.chipI=chips.length-1;
    if(opt)o.optSet=opt.set.slice();
    let cnt=0;for(let i=0;i<8;i++)if(picked[i])cnt++;
    o.stats=[['Covered',cnt+'/8'],['Edges',9],['Phase',chips[chips.length-1]]];
    if(opt){o.stats.push(['OPT',opt.size]);o.stats.push(['Ratio',(cnt/opt.size).toFixed(2)]);}
    steps.push(o);
  }
  snap('Min vertex cover is NP-hard — 2-approximation: scan every edge, take BOTH endpoints if uncovered',{});
  for(let k=0;k<VC_EDGES.length;k++){
    const u=VC_EDGES[k][0],v=VC_EDGES[k][1];
    curEdge=k;
    const nm=VC_NAMES[u]+'–'+VC_NAMES[v];
    if(picked[u]||picked[v]){
      snap('edge ('+nm+') already covered — skip',{log:'skip '+nm});
    }else{
      picked[u]=true;picked[v]=true;
      coverOrder.push(VC_NAMES[u]);coverOrder.push(VC_NAMES[v]);
      snap('edge ('+nm+') uncovered → add both '+VC_NAMES[u]+' and '+VC_NAMES[v],{cls:'hl',log:'+ '+VC_NAMES[u]+', '+VC_NAMES[v],lcls:'hl'});
    }
  }
  curEdge=-1;
  let cnt=0;for(let i=0;i<8;i++)if(picked[i])cnt++;
  chips.push('scan');
  snap('greedy scan complete — cover has '+cnt+' vertices',{cls:'ok',log:'cover = '+cnt,lcls:'ok'});
  opt=vcOpt();
  chips.push('OPT');
  snap('brute force over 2⁸ = 256 subsets → OPT = '+opt.size+' = {'+opt.set.join(', ')+'}',{cls:'ok',log:'OPT='+opt.size,lcls:'ok'});
  const ratio=cnt/opt.size;
  const ok=(ratio<=2.0001&&cnt>=opt.size);
  chips.push('ratio');
  snap(ok?'ratio = '+cnt+' / '+opt.size+' = '+ratio.toFixed(2)+' ≤ 2 — guarantee holds':'ratio '+ratio.toFixed(2)+' exceeds 2?',
    {done:true,bad:!ok,cls:ok?'ok':'err',
     res:ok?('✓ Greedy cover {A, B, C, D, E, F} = '+cnt+' vertices · brute-force OPT = '+opt.size+' {'+opt.set.join(', ')+'} · ratio = '+cnt+'/'+opt.size+' = '+ratio.toFixed(2)+' ≤ 2 — worst case of the 2-approximation bound'):'✗ ratio '+ratio.toFixed(2),
     sfx:ok?'done':'bad'});
  return steps;
}
function renderVC(st,n){
  chipsUI('ops',n,st.chips||[],st.chipI||0,true);
  statsUI(n,st);
  const v=E('vcVerts');
  if(v){
    let h='';
    for(let i=0;i<8;i++){
      let cls='vcv';
      if(st.picked[i])cls+=' pick';
      if(st.optSet&&st.optSet.indexOf(VC_NAMES[i])>=0)cls+=' inopt';
      h+='<div class="'+cls+'">'+VC_NAMES[i]+'</div>';
    }
    v.innerHTML=h;
  }
  const e=E('vcEdges');
  if(e){
    let h='';
    for(let k=0;k<VC_EDGES.length;k++){
      const u=VC_EDGES[k][0],vv=VC_EDGES[k][1];
      const covered=st.picked[u]||st.picked[vv];
      let cls='vce';
      if(covered)cls+=' cov';
      if(k===st.curEdge)cls+=' cur';
      h+='<div class="'+cls+'"><span class="vcen">'+VC_NAMES[u]+' — '+VC_NAMES[vv]+'</span>'+
         '<span class="vces">'+(covered?'covered':'exposed')+'</span></div>';
    }
    e.innerHTML=h;
  }
  const c=E('vcCover');
  if(c){
    c.innerHTML=(st.coverOrder||[]).map(function(nm,i,arr){
      return '<span class="sq op'+(i<arr.length-1?' done':' cur')+'">'+nm+'</span>';
    }).join('');
  }
}

/* ===================== 3: GREEDY SET COVER ===================== */
const SC_SETS=[
  {name:'S1',elems:[1,2,3]},
  {name:'S2',elems:[4,5,6]},
  {name:'S3',elems:[1,2,4,5]},
  {name:'S4',elems:[1,3,5]},
  {name:'S5',elems:[2,4,6]}
];
function scOpt(){
  let best=99,bestMask=-1;
  for(let mask=0;mask<32;mask++){
    let pc=0;
    for(let i=0;i<5;i++)if(mask&(1<<i))pc++;
    if(pc>=best)continue;
    const cov=new Array(7).fill(false);
    for(let i=0;i<5;i++)if((mask>>i)&1){
      const el=SC_SETS[i].elems;
      for(let k=0;k<el.length;k++)cov[el[k]]=true;
    }
    let all=true;
    for(let x=1;x<=6;x++)if(!cov[x])all=false;
    if(all){best=pc;bestMask=mask;}
  }
  const names=[];
  for(let i=0;i<5;i++)if((bestMask>>i)&1)names.push(SC_SETS[i].name);
  return {size:best,mask:bestMask,names:names};
}
function scBuild(){
  const steps=[];
  const chips=['input'];
  const covered=new Array(7).fill(false); // 1..6
  const chosen=[];
  let scores=null,lastPick=-1,newElems=null,opt=null;
  function snap(msg,o){
    o=o||{};
    o.msg=msg;
    o.covered=covered.slice();
    o.chosen=chosen.slice();
    o.scores=scores?scores.slice():null;
    o.lastPick=lastPick;
    o.newElems=newElems?newElems.slice():null;
    o.chips=chips.slice();
    o.chipI=chips.length-1;
    if(opt)o.optNames=opt.names.slice();
    let cov=0;for(let x=1;x<=6;x++)if(covered[x])cov++;
    o.stats=[['Covered',cov+'/6'],['Picked',chosen.length],['Sets',5]];
    if(opt){o.stats.push(['OPT',opt.size]);o.stats.push(['Ratio',(chosen.length/opt.size).toFixed(2)]);}
    steps.push(o);
  }
  snap('Universe {1..6}, 5 sets — greedy set cover: pick max uncovered coverage each round',{});
  let round=0;
  while(true){
    let cov=0;for(let x=1;x<=6;x++)if(covered[x])cov++;
    if(cov>=6)break;
    round++;
    scores=SC_SETS.map(function(s){
      let c=0;
      for(let k=0;k<s.elems.length;k++)if(!covered[s.elems[k]])c++;
      return c;
    });
    lastPick=-1;newElems=null;
    chips.push('score '+round);
    snap('score round '+round+': '+SC_SETS.map(function(s,i){return s.name+'→'+scores[i];}).join(' · '),{log:'scores r'+round,lcls:'hl'});
    let best=-1,bestV=0;
    for(let i=0;i<5;i++)if(scores[i]>bestV){bestV=scores[i];best=i;}
    if(best<0||bestV<=0)break;
    newElems=SC_SETS[best].elems.filter(function(x){return !covered[x];});
    for(let k=0;k<SC_SETS[best].elems.length;k++)covered[SC_SETS[best].elems[k]]=true;
    chosen.push(SC_SETS[best].name);
    lastPick=best;
    scores=null;
    chips.push('pick '+SC_SETS[best].name);
    snap('pick '+SC_SETS[best].name+' — '+bestV+' new element'+(bestV>1?'s':'')+' {'+newElems.join(', ')+'} covered',{cls:'hl',log:'+ '+SC_SETS[best].name+' {'+newElems.join(',')+'}',lcls:'hl'});
  }
  scores=null;lastPick=-1;newElems=null;
  opt=scOpt();
  chips.push('OPT');
  snap('brute force over 2⁵ = 32 subsets → OPT = '+opt.size+' = {'+opt.names.join(', ')+'}',{cls:'ok',log:'OPT='+opt.size,lcls:'ok'});
  const ratio=chosen.length/opt.size;
  const ok=(ratio<=(Math.log(6)/Math.log(Math.E)+1.01)&&chosen.length>=opt.size);
  chips.push('ratio');
  const covCount=(function(){let c=0;for(let x=1;x<=6;x++)if(covered[x])c++;return c;})();
  snap('ratio = '+chosen.length+' / '+opt.size+' = '+ratio.toFixed(2)+' ≤ H(6) ≈ 2.45 — guarantee holds',
    {done:true,bad:!ok,cls:ok?'ok':'err',
     res:ok?('✓ Greedy cover {'+chosen.join(', ')+'} = '+chosen.length+' sets (covers '+covCount+'/6) · OPT = '+opt.size+' {'+opt.names.join(', ')+'} · ratio = '+ratio.toFixed(2)+' ≤ H(6) ≈ 2.45 — greedy is suboptimal here, as expected'):'✗ ratio '+ratio.toFixed(2),
     sfx:ok?'done':'bad'});
  return steps;
}
function renderSC(st,n){
  chipsUI('ops',n,st.chips||[],st.chipI||0,true);
  statsUI(n,st);
  const u=E('uRow');
  if(u){
    let h='';
    for(let x=1;x<=6;x++){
      let cls='ue';
      if(st.covered[x])cls+=' cov';
      if(st.newElems&&st.newElems.indexOf(x)>=0)cls+=' newc';
      h+='<div class="'+cls+'">'+x+'</div>';
    }
    u.innerHTML=h;
  }
  const s=E('sRows');
  if(s){
    let h='';
    for(let i=0;i<5;i++){
      const set=SC_SETS[i];
      let cls='srow';
      if(st.chosen.indexOf(set.name)>=0)cls+=' pick';
      else if(st.scores)cls+=' scoring';
      if(st.optNames&&st.optNames.indexOf(set.name)>=0)cls+=' inopt';
      let right='';
      if(st.scores)right='<b>'+st.scores[i]+'</b> new';
      else if(st.chosen.indexOf(set.name)>=0)right='picked';
      h+='<div class="'+cls+'"><span class="sn">'+set.name+'</span><span class="smem">'+
        set.elems.map(function(x){
          let mc='mchip';
          if(st.newElems&&st.newElems.indexOf(x)>=0&&st.lastPick===i)mc+=' newc';
          else if(st.covered[x])mc+=' cov';
          return '<span class="'+mc+'">'+x+'</span>';
        }).join('')+'</span><span class="snew">'+right+'</span></div>';
    }
    s.innerHTML=h;
  }
}

/* ===================== wiring ===================== */
makeCtrl(0,function(){return flowBuild('dfs');},renderFlow);
makeCtrl(1,function(){return flowBuild('bfs');},renderFlow);
makeCtrl(2,vcBuild,renderVC);
makeCtrl(3,scBuild,renderSC);

const homeScreen=E('homeScreen'),algoScreen=E('algoScreen'),backBtn=E('backBtn');
function showAlgo(i){
  stopAll();
  homeScreen.style.display='none';
  algoScreen.style.display='block';
  if(backBtn)backBtn.classList.add('show');
  const ps=algoScreen.querySelectorAll('.panel');
  for(let k=0;k<ps.length;k++)ps[k].classList.toggle('on',k===i);
  window.scrollTo(0,0);
}
const cards=document.querySelectorAll('.card');
for(let i=0;i<cards.length;i++){
  (function(c){c.addEventListener('click',function(){showAlgo(+c.dataset.a);});})(cards[i]);
}
if(backBtn)backBtn.addEventListener('click',function(){
  stopAll();
  algoScreen.style.display='none';
  homeScreen.style.display='block';
  backBtn.classList.remove('show');
});
document.addEventListener('click',function(){AC();},{once:true});
