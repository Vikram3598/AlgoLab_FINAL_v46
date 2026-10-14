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

/* ===================== shared helpers ===================== */
function mkSnap(steps,chips){
  return function(msg,o){
    o=o||{};
    o.msg=msg;
    o.chips=chips.slice();
    o.chipI=chips.length-1;
    steps.push(o);
  };
}
function idxHas(x,i){
  if(x===undefined||x===null)return false;
  if(Object.prototype.toString.call(x)==='[object Array]')return x.indexOf(i)>=0;
  return x===i;
}
function formulaPaint(st,n){const f=E('ft'+n);if(f)f.textContent=st.formula||'';}
function mkCells(vals,tags,cls){
  const a=[];
  for(let i=0;i<vals.length;i++){
    const v=vals[i];
    const has=!(v===undefined||v===null||v==='');
    const cs=[];
    if(!has)cs.push('empty');
    if(cls&&cls[i])cs.push(cls[i]);
    const c={v:has?v:'',idx:i,cls:cs.join(' ')};
    if(tags&&tags[i])c.tag=tags[i];
    a.push(c);
  }
  return a;
}
function tagEnds(arr,frontTag,rearTag){
  const tags={};
  const filled=[];
  for(let i=0;i<arr.length;i++){
    const v=arr[i];
    if(!(v===undefined||v===null||v===''))filled.push(i);
  }
  if(filled.length){
    if(frontTag)tags[filled[0]]=frontTag;
    if(rearTag)tags[filled[filled.length-1]]=rearTag;
  }
  return tags;
}
/* ===================== renderer: primitives (p0-p3) ===================== */
function renderPrim(st,n){
  chipsUI('ops',n,st.chips||[],st.chipI||0,true);
  statsUI(n,st);
  const pi=E('pinfo'+n);
  if(pi){
    const info=st.info||[];let h='';
    for(let i=0;i<info.length;i++){
      let cls='pbox';
      if(idxHas(st.infoHl,i))cls+=' hl';
      if(idxHas(st.infoOk,i))cls+=' ok';
      if(idxHas(st.infoBad,i))cls+=' bad';
      h+='<div class="'+cls+'"><div class="pk">'+info[i][0]+'</div><div class="pv">'+info[i][1]+'</div></div>';
    }
    pi.innerHTML=h;
  }
  const sr=E('segrow'+n);
  if(sr){
    const segs=st.segs||[];let h='';
    for(let i=0;i<segs.length;i++)h+='<div class="seg '+(segs[i][2]||'')+'" style="flex:'+segs[i][1]+'">'+segs[i][0]+'</div>';
    sr.innerHTML=h;
  }
  const bw=E('bits'+n);
  if(bw){
    const segs=st.segs||[];const segOf=[];let pos=0;
    for(let i=0;i<segs.length;i++){
      for(let k=0;k<segs[i][1];k++)segOf[pos+k]=segs[i][2]||'';
      pos+=segs[i][1];
    }
    const bits=st.bits||'';let h='';
    for(let i=0;i<bits.length;i++){
      let cls='pbit';
      if(bits.charAt(i)==='1')cls+=' on';
      if(segOf[i])cls+=' '+segOf[i];
      if(idxHas(st.hlb,i))cls+=' hl';
      if(idxHas(st.okb,i))cls+=' ok';
      h+='<div class="'+cls+'">'+bits.charAt(i)+'</div>';
    }
    bw.innerHTML=h;
  }
  formulaPaint(st,n);
}

/* ===================== renderer: cell rows (arrays / stack / queue) ===================== */
function cellsPaint(st,n){
  const w=E('cells'+n);
  if(!w)return;
  const cells=st.cells||[];let h='';
  for(let i=0;i<cells.length;i++){
    const c=cells[i];
    let cls='cell'+(c.cls?' '+c.cls:'');
    h+='<div class="'+cls+'">';
    if(c.tag)h+='<div class="ct'+(c.tagCls?' '+c.tagCls:'')+'">'+c.tag+'</div>';
    h+='<div class="cv">'+(c.v===''||c.v===undefined||c.v===null?'&#183;':c.v)+'</div>';
    h+='<div class="ci">'+(c.idx===undefined?i:c.idx)+'</div></div>';
  }
  if(st.dir)h+='<div class="dirline">'+st.dir+'</div>';
  w.innerHTML=h;
}
function renderCells(st,n){
  chipsUI('ops',n,st.chips||[],st.chipI||0,true);
  statsUI(n,st);
  cellsPaint(st,n);
  formulaPaint(st,n);
}

/* ===================== renderer: linked lists (p6-p8) ===================== */
function renderList(st,n){
  chipsUI('ops',n,st.chips||[],st.chipI||0,true);
  statsUI(n,st);
  const w=E('list'+n);
  if(w){
    const nodes=st.nodes||[];let h='';
    for(let i=0;i<nodes.length;i++){
      const nd=nodes[i];
      if(i>0){
        h+='<div class="larrow'+(st.dbl?' dbl':'')+((st.arrowHl===i-1)?' hl':'')+'">'+(st.dbl?'&#8596;':'&#8594;')+'</div>';
      }
      h+='<div class="lnode'+(nd.cls?' '+nd.cls:'')+'">';
      if(nd.tag)h+='<div class="ltag'+(nd.tagCls?' '+nd.tagCls:'')+'">'+nd.tag+'</div>';
      h+='<div class="lv">'+nd.v+'</div></div>';
    }
    if(st.null)h+='<div class="lnull">NULL</div>';
    w.innerHTML=h;
  }
  const lw=E('lwrap'+n);
  if(lw)lw.textContent=st.wrap||'';
  formulaPaint(st,n);
}

/* ===================== renderer: binary trees (p14-p19) ===================== */
function binLayout(root){
  const cx={},depth={},cls={},bf={},color={};
  let slot=0,maxD=0;
  function place(n,d){
    if(!n)return null;
    depth[n.v]=d;
    cls[n.v]=n.cls||'';
    bf[n.v]=(n.bf===undefined?null:n.bf);
    color[n.v]=n.color||'';
    if(!n.l&&!n.r){
      const c=53+slot*56;
      slot++;
      cx[n.v]=c;
      return c;
    }
    const a=place(n.l,d+1),b=place(n.r,d+1);
    let c;
    if(a===null)c=b;
    else if(b===null)c=a;
    else c=(a+b)/2;
    cx[n.v]=c;
    return c;
  }
  place(root,0);
  const nodes=[],edges=[];
  function emit(n,px,py,pv){
    const y=8+depth[n.v]*72;
    if(depth[n.v]>maxD)maxD=depth[n.v];
    nodes.push({v:n.v,cx:cx[n.v],y:y,cls:cls[n.v],bf:bf[n.v],color:color[n.v]});
    if(px!==null)edges.push({x:px,y:py+40,dx:cx[n.v]-px,dy:y-(py+40),from:pv,to:n.v});
    if(n.l)emit(n.l,cx[n.v],y,n.v);
    if(n.r)emit(n.r,cx[n.v],y,n.v);
  }
  emit(root,null,null,null);
  return {nodes:nodes,edges:edges,w:slot*56+50,h:maxD*72+66};
}
function renderBin(st,n){
  chipsUI('ops',n,st.chips||[],st.chipI||0,true);
  statsUI(n,st);
  const t=E('tree'+n);
  if(t){
    if(!st.tree){t.innerHTML='';t.style.width='auto';t.style.height='auto';}
    else{
      const lay=binLayout(st.tree);
      t.style.width=lay.w+'px';
      t.style.height=lay.h+'px';
      const path=st.path||[];
      const inPath=function(v){return path.indexOf(v)>=0;};
      let h='';
      for(let i=0;i<lay.edges.length;i++){
        const e=lay.edges[i];
        const len=Math.sqrt(e.dx*e.dx+e.dy*e.dy);
        const th=Math.atan2(e.dx,e.dy);
        const on=path.length>0&&inPath(e.from)&&(inPath(e.to)||st.cur===e.to);
        h+='<div class="tedge'+(on?' on':'')+'" style="left:'+(e.x-0.75)+'px;top:'+e.y+'px;height:'+len+'px;transform:rotate('+th+'rad)"></div>';
      }
      for(let i=0;i<lay.nodes.length;i++){
        const nd=lay.nodes[i];
        let cls='tlabel';
        if(nd.color)cls+=' '+nd.color;
        if(inPath(nd.v))cls+=' onpath';
        if(nd.v===st.cur)cls+=st.hit?' hit':' cur';
        if(nd.cls)cls+=' '+nd.cls;
        h+='<div class="'+cls+'" style="left:'+(nd.cx-23)+'px;top:'+nd.y+'px">'+nd.v;
        if(st.showBF&&nd.bf!==null&&nd.bf!==undefined)h+='<div class="tbadge">bf '+nd.bf+'</div>';
        h+='</div>';
      }
      t.innerHTML=h;
    }
  }
  cellsPaint(st,n);
  formulaPaint(st,n);
}
/* ===================== renderer: b-tree (p18) ===================== */
function btLayout(root){
  let slot=0,maxD=0;
  const rec=[];
  function nodeW(k){return k*40+18;}
  function place(n,d){
    if(!n)return null;
    n._d=d;
    if(!n.children||!n.children.length){
      const w=nodeW(n.keys.length);
      const x=slot*104+w/2+14;
      slot++;
      n._x=x;
      return x;
    }
    let first=null,last=null;
    for(let i=0;i<n.children.length;i++){
      const c=place(n.children[i],d+1);
      if(c!==null){if(first===null)first=c;last=c;}
    }
    n._x=(first===null)?nodeW(n.keys.length)/2+14:(first+last)/2;
    return n._x;
  }
  function depthSet(n,d){
    if(d>maxD)maxD=d;
    if(n.children)for(let i=0;i<n.children.length;i++)depthSet(n.children[i],d+1);
  }
  function walk(n,px,py){
    const w=nodeW(n.keys.length);
    const y=14+n._d*88;
    rec.push({node:n,x:n._x,y:y,w:w});
    if(px!==null)rec.push({edge:{x:px,y:py+44,dx:n._x-px,dy:y-(py+44)}});
    if(n.children)for(let i=0;i<n.children.length;i++)walk(n.children[i],n._x,y);
  }
  if(root){place(root,0);depthSet(root,0);walk(root,null,null);}
  const nodes=[],edges=[];
  for(let i=0;i<rec.length;i++){
    if(rec[i].node)nodes.push({x:rec[i].x,y:rec[i].y,w:rec[i].w,keys:rec[i].node.keys,cls:rec[i].node.cls||''});
    else edges.push(rec[i].edge);
  }
  return {nodes:nodes,edges:edges,w:slot*104+40,h:maxD*88+74};
}
function renderBTree(st,n){
  chipsUI('ops',n,st.chips||[],st.chipI||0,true);
  statsUI(n,st);
  const w=E('btree'+n);
  if(w){
    if(!st.btree){w.innerHTML='';w.style.width='auto';w.style.height='auto';}
    else{
      const lay=btLayout(st.btree);
      w.style.width=lay.w+'px';
      w.style.height=lay.h+'px';
      let h='';
      for(let i=0;i<lay.edges.length;i++){
        const e=lay.edges[i];
        const len=Math.sqrt(e.dx*e.dx+e.dy*e.dy);
        const th=Math.atan2(e.dx,e.dy);
        h+='<div class="bedge" style="left:'+(e.x-0.75)+'px;top:'+e.y+'px;height:'+len+'px;transform:rotate('+th+'rad)"></div>';
      }
      for(let i=0;i<lay.nodes.length;i++){
        const nd=lay.nodes[i];
        h+='<div class="bnode'+(nd.cls?' '+nd.cls:'')+'" style="left:'+(nd.x-nd.w/2)+'px;top:'+nd.y+'px">';
        for(let k=0;k<nd.keys.length;k++)h+='<div class="bkey">'+nd.keys[k]+'</div>';
        h+='</div>';
      }
      w.innerHTML=h;
    }
  }
  formulaPaint(st,n);
}

/* ===================== renderer: trie (p20) ===================== */
function trieLayout(root){
  let slot=0,maxD=0;
  const rec=[];
  function kidList(n){
    const kids=[];
    if(n.kids)for(const k in n.kids)kids.push(n.kids[k]);
    return kids;
  }
  function place(n,d){
    if(!n)return null;
    n._d=d;
    if(d>maxD)maxD=d;
    const kids=kidList(n);
    if(!kids.length){
      const x=60+slot*58;
      slot++;
      n._x=x;
      return x;
    }
    let first=null,last=null;
    for(let i=0;i<kids.length;i++){
      const c=place(kids[i],d+1);
      if(c!==null){if(first===null)first=c;last=c;}
    }
    if(first===null){
      const x=60+slot*58;
      slot++;
      n._x=x;
      return x;
    }
    n._x=(first+last)/2;
    return n._x;
  }
  function walk(n,px,py,pv){
    const y=16+n._d*66;
    rec.push({id:n.id,x:n._x,y:y,ch:n.ch,root:n.root,term:n.term,cls:n.cls||''});
    if(px!==null)rec.push({edge:{x:px,y:py+34,dx:n._x-px,dy:y-(py+34),from:pv,to:n.id}});
    const kids=kidList(n);
    for(let i=0;i<kids.length;i++)walk(kids[i],n._x,y,n.id);
  }
  if(root){place(root,0);walk(root,null,null,null);}
  const nodes=[],edges=[];
  for(let i=0;i<rec.length;i++){
    if(rec[i].id!==undefined)nodes.push(rec[i]);
    else edges.push(rec[i].edge);
  }
  return {nodes:nodes,edges:edges,w:slot*58+90,h:maxD*66+70};
}
function renderTrie(st,n){
  chipsUI('ops',n,st.chips||[],st.chipI||0,true);
  statsUI(n,st);
  const w=E('trie'+n);
  if(w){
    if(!st.root){w.innerHTML='';w.style.width='auto';w.style.height='auto';}
    else{
      const lay=trieLayout(st.root);
      w.style.width=lay.w+'px';
      w.style.height=lay.h+'px';
      const path=st.path||[];
      let h='';
      for(let i=0;i<lay.edges.length;i++){
        const e=lay.edges[i];
        const len=Math.sqrt(e.dx*e.dx+e.dy*e.dy);
        const th=Math.atan2(e.dx,e.dy);
        const on=path.indexOf(e.to)>=0&&path.indexOf(e.from)>=0;
        h+='<div class="tredge'+(on?' on':'')+'" style="left:'+(e.x-0.75)+'px;top:'+e.y+'px;height:'+len+'px;transform:rotate('+th+'rad)"></div>';
      }
      for(let i=0;i<lay.nodes.length;i++){
        const nd=lay.nodes[i];
        let cls='trn';
        if(nd.root)cls+=' root';
        if(nd.term)cls+=' term';
        if(nd.cls)cls+=' '+nd.cls;
        h+='<div class="'+cls+'" style="left:'+(nd.x-17)+'px;top:'+nd.y+'px">'+(nd.root?'&#8709;':nd.ch)+'</div>';
      }
      w.innerHTML=h;
    }
  }
  formulaPaint(st,n);
}

/* ===================== renderer: graphs (p21-p23) ===================== */
const GL4=['A','B','C','D'];
const GPOS4={A:[2,1],B:[1,2],C:[3,2],D:[2,3]};
function renderGraphW(st,n){
  chipsUI('ops',n,st.chips||[],st.chipI||0,true);
  statsUI(n,st);
  const g=E('gnodes'+n);
  if(g){
    let h='';
    for(let i=0;i<4;i++){
      const lab=GL4[i];
      let cls='gnode';
      if(st.ncls&&st.ncls[lab])cls+=' '+st.ncls[lab];
      h+='<div class="'+cls+'" style="grid-column:'+GPOS4[lab][0]+';grid-row:'+GPOS4[lab][1]+'">'+lab+'</div>';
    }
    g.innerHTML=h;
  }
  const al=E('alist'+n);
  if(al){
    const rows=st.alist||[];let h='';
    for(let i=0;i<rows.length;i++){
      const r=rows[i];
      h+='<div class="arow'+(r.cls?' '+r.cls:'')+'"><span class="an">'+r.n+'</span><span>'+(r.dir==='u'?'&#8596;':'&#8594;')+'</span>';
      if(!r.e||!r.e.length)h+='<span class="bempty">none</span>';
      for(let k=0;r.e&&k<r.e.length;k++){
        const e=r.e[k];
        let cls='aw'+(e[2]?' '+e[2]:'');
        const hasW=(e[1]!==null&&e[1]!==undefined);
        if(hasW)cls+=' w';
        h+='<span class="'+cls+'">'+e[0]+(hasW?'('+e[1]+')':'')+'</span>';
      }
      h+='</div>';
    }
    al.innerHTML=h;
  }
  const q=E('gq'+n);
  if(q){
    let h='<span class="qlab">'+(st.qLab||'frontier')+'</span>';
    const arr=st.q||[];
    if(!arr.length)h+='<span class="sq">empty</span>';
    for(let i=0;i<arr.length;i++)h+='<span class="sq op'+(i===0?' cur':'')+'">'+arr[i]+'</span>';
    q.innerHTML=h;
  }
  const o=E('gord'+n);
  if(o){
    const ord=st.order||[];
    o.innerHTML=ord.map(function(v,i){
      return '<span class="sq op'+(i===ord.length-1?' cur':' done')+'">'+v+'</span>';
    }).join('');
  }
  formulaPaint(st,n);
}

/* ===================== renderer: hash buckets (p24-p26) ===================== */
function renderBuckets(st,n){
  chipsUI('ops',n,st.chips||[],st.chipI||0,true);
  statsUI(n,st);
  const w=E('buckets'+n);
  if(w){
    const rows=st.buckets||[];let h='';
    for(let i=0;i<rows.length;i++){
      const r=rows[i];
      h+='<div class="brow'+(r.cls?' '+r.cls:'')+'"><div class="bidx">'+r.i+'</div><div class="bchain">';
      if(!r.chain||!r.chain.length)h+='<span class="bempty">empty</span>';
      for(let k=0;r.chain&&k<r.chain.length;k++){
        const c=r.chain[k];
        if(k>0)h+='<span class="barrow">&#8594;</span>';
        h+='<span class="bchip'+(c.cls?' '+c.cls:'')+'">'+c.v+'</span>';
      }
      h+='</div></div>';
    }
    w.innerHTML=h;
  }
  formulaPaint(st,n);
}
/* ===================== 0: INTEGER ===================== */
function intBuild(){
  const steps=[],chips=['int32'],snap=mkSnap(steps,chips);
  const SEG=[['sign',1,'sign'],['two’s-complement value bits',31,'man']];
  const SEGN=[['sign',1,'sign'],['twos complement',31,'man']];
  snap('int32: a signed whole number stored in 32-bit two’s-complement representation',
    {info:[['Type','int32'],['Decimal','13'],['Bits','32'],['Hex','0x0000000D']],infoHl:1,segs:SEG,bits:'',
     formula:'int x = 13;    range −2^31 … 2^31−1    4 bytes',
     stats:[['Bits',32],['Bytes',4],['Value',13]]});
  chips.push('÷2');
  snap('divide 13 by two repeatedly — the remainders read bottom to top give 1101',
    {info:[['Type','int32'],['Decimal','13'],['Bits','4 so far'],['Hex','0x0D']],infoHl:2,
     segs:[['bits so far',4,'man']],bits:'1101',hlb:[0,1,2,3],
     formula:'13÷2=6 r1 · 6÷2=3 r0 · 3÷2=1 r1 · 1÷2=0 r1   →   13 = 1101',
     stats:[['Remainders','1 0 1 1'],['Bits',4],['Value',13]],
     log:'13 → 1101',lcls:'hl'});
  chips.push('pad 32');
  snap('encode −13 in 32-bit two’s complement: invert the bits of 13 and add one; the leading bit is 1 for a negative value',
    {info:[['Type','int32'],['Decimal','13'],['Bits','32'],['Hex','0x0000000D']],infoHl:3,
     segs:SEG,bits:'00000000000000000000000000001101',okb:[28,29,30,31],
     formula:'sign = 0   magnitude = 0…01101   →   0x0000000D',
     stats:[['Bits',32],['Sign','+'],['Value',13]],
     log:'13 = 00…01101',lcls:'ok'});
  chips.push('negate');
  snap('twos complement of −13: first invert every bit of 13 (NOT)',
    {info:[['Type','int32'],['Decimal','−13'],['Bits','32'],['Hex','0x…FFF2']],infoHl:1,
     segs:SEGN,bits:'11111111111111111111111111110010',
     formula:'~13 = NOT(0…01101) = 1…10010     (still need +1)',
     stats:[['Bits',32],['Sign','−'],['Value','invert']],
     log:'invert → …11110010',lcls:'hl'});
  chips.push('+1');
  snap('add one: 1…10010 + 1 = 1…10011 — that is exactly how −13 is stored',
    {info:[['Type','int32'],['Decimal','−13'],['Bits','32'],['Hex','0xFFFFFFF3']],infoHl:3,infoOk:3,
     segs:SEGN,bits:'11111111111111111111111111110011',
     formula:'~13 + 1 = 1…10011   →   −13 = 0xFFFFFFF3',
     stats:[['Bits',32],['Sign','−'],['Value',-13]],
     log:'−13 stored',lcls:'ok'});
  chips.push('check');
  snap('add 13 + (−13): the patterns cancel perfectly and the carry falls off the left — zero',
    {info:[['Type','int32'],['Decimal','−13'],['Bits','32'],['Hex','0xFFFFFFF3']],infoOk:3,
     segs:SEGN,bits:'11111111111111111111111111110011',hlb:[],
     formula:'0000…1101 + 1111…0011 = 1…0000…0000 → carry out ignored → 0',
     stats:[['13 + (−13)',0],['Bits',32],['Bytes',4]],
     log:'13 + (−13) = 0',lcls:'ok'});
  chips.push('done');
  snap('✓ one add circuit handles positives and negatives — that is twos complement',
    {info:[['Type','int32'],['Decimal','−13'],['Bits','32'],['Hex','0xFFFFFFF3']],infoOk:3,
     segs:SEGN,bits:'11111111111111111111111111110011',
     formula:'two’s complement lets addition and subtraction share the same arithmetic hardware',
     stats:[['Bits',32],['13 =','0x0000000D'],['−13 =','0xFFFFFFF3']],
     done:true,cls:'ok',log:'int32 done',lcls:'ok',
     res:'✓ int32 twos complement · 13 = 0x0000000D · −13 = 0xFFFFFFF3 · range −2^31 … 2^31−1 · O(1) arithmetic',
     sfx:'done'});
  return steps;
}

/* ===================== 1: FLOAT (IEEE-754) ===================== */
function floatBuild(){
  const steps=[],chips=['float32'],snap=mkSnap(steps,chips);
  const SIG=[['sign',1,'sign'],['exp 8',8,'exp'],['mantissa 23',23,'man']];
  const BITS='01000000010010001111010111000011';
  snap('IEEE-754 single precision: 1 sign bit + 8 exponent bits + 23 mantissa bits',
    {info:[['Type','float32'],['Decimal','3.14'],['Bits','32'],['Hex','0x4048F5C3']],infoHl:1,segs:SIG,bits:'',
     formula:'value = (−1)^S × 2^(E−127) × 1.M',
     stats:[['Bits',32],['Bytes',4],['Value','3.14']]});
  chips.push('sign');
  snap('3.14 is positive → sign bit S = 0',
    {info:[['Type','float32'],['Decimal','3.14'],['Bits','32'],['Hex','0x4048F5C3']],infoHl:0,segs:SIG,
     bits:'0',hlb:0,
     formula:'3.14 ≥ 0   →   S = 0',
     stats:[['Sign','+ (0)'],['Bits',32],['Value','3.14']],
     log:'sign = 0',lcls:'hl'});
  chips.push('exponent');
  snap('normalize: 3.14 = 1.57 × 2¹ → biased exponent E = 127 + 1 = 128 = 10000000',
    {info:[['Type','float32'],['Decimal','3.14'],['Exponent','128'],['Hex','0x4048F5C3']],infoHl:2,segs:SIG,
     bits:'010000000',hlb:[1,2,3,4,5,6,7,8],
     formula:'1.57 × 2¹   →   E = 127 + 1 = 128 = 10000000',
     stats:[['Exponent','10000000'],['Bias',127],['Power','2^1']],
     log:'E = 128',lcls:'hl'});
  chips.push('mantissa');
  snap('store the fraction of 1.57 in the 23-bit mantissa (the leading 1 is implicit)',
    {info:[['Type','float32'],['Decimal','3.14'],['Exponent','128'],['Hex','0x4048F5C3']],infoHl:2,segs:SIG,
     bits:BITS,hlb:[9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],
     formula:'1.10010001111010111000011 × 2¹   →   M = 10010001111010111000011',
     stats:[['Mantissa bits',23],['Hidden bit',1],['Exponent',128]],
     log:'mantissa set',lcls:'hl'});
  chips.push('assemble');
  snap('concatenate the three fields and group into hex nibbles: 0x4048F5C3',
    {info:[['Type','float32'],['Decimal','3.14'],['Exponent','128'],['Hex','0x4048F5C3']],infoHl:3,infoOk:3,
     segs:SIG,bits:BITS,
     formula:'0 10000000 10010001111010111000011 → 0100 0000 0100 1000 1111 0101 1100 0011',
     stats:[['Hex','0x4048F5C3'],['Bits',32],['Bytes',4]],
     log:'0x4048F5C3',lcls:'ok'});
  chips.push('decode');
  snap('read it back: 1.5700000524520874 × 2 = 3.1400001049041748 — not exactly 3.14',
    {info:[['Type','float32'],['Stored','3.1400001049'],['Exact','3.14'],['Error','1.05e−7']],infoHl:1,infoBad:3,
     segs:SIG,bits:BITS,
     formula:'1.5700000524520874 × 2¹ = 3.1400001049041748   →   error +1.049×10⁻⁷',
     stats:[['Stored','3.1400001'],['Error','1.05e−7'],['Digits','~7']],
     log:'rounding error 1.05e-7',lcls:'hl'});
  chips.push('done');
  snap('✓ floats trade exactness for range — 23 mantissa bits give about 7 significant digits',
    {info:[['Type','float32'],['Stored','3.1400001049'],['Hex','0x4048F5C3'],['Digits','~7']],infoOk:2,
     segs:SIG,bits:BITS,
     formula:'S · exponent · mantissa · rounding at bit 24 → 1.05e−7 error',
     stats:[['Hex','0x4048F5C3'],['Sign','0'],['E','128']],
     done:true,cls:'ok',log:'float32 done',lcls:'ok',
     res:'✓ IEEE-754 float32 · 3.14 → 0x4048F5C3 · stored 3.1400001049041748 · error 1.049×10⁻⁷ · 1+8+23 bits',
     sfx:'done'});
  return steps;
}

/* ===================== 2: CHARACTER ===================== */
function charBuild(){
  const steps=[],chips=['char'],snap=mkSnap(steps,chips);
  const SEG=[['8-bit storage byte',8,'man']];
  snap('a character is just a small integer — ASCII maps letters to codes 0…127',
    {info:[['Type','char'],['Char','A'],['Code',65],['Encoding','ASCII']],infoHl:1,segs:SEG,bits:'',
     formula:"char c = 'A';    7-bit ASCII: A = 65 · a = 97 · 0 = 48",
     stats:[['Code',65],['Bits',8],['Max','127']]});
  chips.push('table');
  snap('the printable range: A = 65 … Z = 90, a = 97 … z = 122 — lower case starts 32 after upper',
    {info:[['Type','char'],['Char','A'],['Code',65],['Range','32…126']],infoHl:3,segs:SEG,bits:'',
     formula:'A=65  Z=90  a=97  z=122      a − A = 32 = 0x20',
     stats:[['Codes','65…122'],['Bits',8],['Offset',32]],
     log:'ASCII table',lcls:'hl'});
  chips.push('65 → bits');
  snap('65 = 64 + 1 → binary 01000001 (that is the whole character)',
    {info:[['Type','char'],['Char','A'],['Code',65],['Binary','01000001']],infoHl:3,segs:SEG,
     bits:'01000001',hlb:[1,6],
     formula:'65 = 64 + 1 = 1000001 → 01000001  (8 bits, leading zero)',
     stats:[['Code',65],['Hex','0x41'],['Bits',8]],
     log:'A = 01000001',lcls:'ok'});
  chips.push('lower case');
  snap("'a' = 97 = 65 + 32 — exactly one bit (bit 5) separates the two cases",
    {info:[['Type','char'],['Char','a'],['Code',97],['Binary','01100001']],infoHl:3,segs:SEG,
     bits:'01100001',hlb:[5],
     formula:"'a' − 'A' = 32 = 0x20   →   only bit 5 differs: 01100001",
     stats:[['Code',97],['Hex','0x61'],['Diff',32]],
     log:'case = bit 5',lcls:'hl'});
  chips.push('toggle');
  snap("flip bit 5 of 'Z' (90) and you get 'z' (122) — case conversion is one XOR",
    {info:[['Type','char'],['Char','z'],['Code',122],['Binary','01111010']],infoHl:3,segs:SEG,
     bits:'01111010',hlb:[5],
     formula:"'Z' = 01011010  XOR 00100000 = 01111010 = 'z'",
     stats:[['Code',122],['Hex','0x7A'],['Op','XOR 32']],
     log:'Z → z',lcls:'ok'});
  chips.push('done');
  snap('✓ characters are numbers — compare them, sort them, even do arithmetic on them',
    {info:[['Type','char'],['Char','A'],['Code',65],['Hex','0x41']],infoOk:3,segs:SEG,
     bits:'01000001',
     formula:'same pattern for every encoding: code point → bits',
     stats:[['A =',65],['0x41','01000001'],['Encoding','ASCII']],
     done:true,cls:'ok',log:'char done',lcls:'ok',
     res:"✓ 'A' = 65 = 0x41 = 01000001 · case differs by bit 5 (0x20) · UTF-8 extends the same idea to 1–4 bytes",
     sfx:'done'});
  return steps;
}

/* ===================== 3: BOOLEAN ===================== */
function boolBuild(){
  const steps=[],chips=['bool'],snap=mkSnap(steps,chips);
  const SEG=[['flag byte 8 bits',8,'man']];
  snap('a boolean holds two logical states; one bit is enough in theory, but implementations commonly use a byte or larger word',
    {info:[['Type','bool'],['true','1'],['false','0'],['Size','1 byte']],infoHl:1,segs:SEG,bits:'',
     formula:'bool ok = true;    every if, every flag, every loop condition',
     stats:[['Bits',1],['States',2],['Byte','8 bits']]});
  chips.push('true');
  snap('true → the lowest bit is set: 00000001',
    {info:[['Type','bool'],['true','1'],['false','0'],['Value','true']],infoHl:3,segs:SEG,
     bits:'00000001',hlb:7,
     formula:'true  →  00000001',
     stats:[['Value','true'],['Bit 0',1],['Bytes',1]],
     log:'set → 1',lcls:'ok'});
  chips.push('false');
  snap('false → every bit clear: 00000000',
    {info:[['Type','bool'],['true','1'],['false','0'],['Value','false']],infoHl:3,segs:SEG,
     bits:'00000000',hlb:[],
     formula:'false →  00000000',
     stats:[['Value','false'],['Bit 0',0],['Bytes',1]],
     log:'clear → 0',lcls:'hl'});
  chips.push('logic');
  snap('combine flags with AND, OR and NOT — truth tables are just bit operations',
    {info:[['T AND F','false'],['T OR F','true'],['NOT T','false'],['Size','1 byte']],infoHl:1,segs:SEG,
     bits:'00000000',
     formula:'true ∧ false = false    true ∨ false = true    ¬true = false',
     stats:[['AND','F'],['OR','T'],['NOT','F']],
     log:'truth table',lcls:'hl'});
  chips.push('use');
  snap('in code: a visited marker, a permission flag, a loop guard — all one bit each',
    {info:[['visited','true'],['authorized','false'],['loop again','true'],['Size','1 byte']],infoHl:0,segs:SEG,
     bits:'00000001',hlb:7,
     formula:'if (visited) skip;    while (again) { … }',
     stats:[['Flags',3],['true',2],['false',1]],
     log:'flags in use',lcls:'ok'});
  chips.push('done');
  snap('✓ the simplest type in every language — two states, one bit, zero ambiguity',
    {info:[['Type','bool'],['true','1'],['false','0'],['Size','1 byte']],infoOk:2,segs:SEG,
     bits:'00000001',
     formula:'true = 1 · false = 0 · powers every decision a program makes',
     stats:[['true',1],['false',0],['Size','1 byte']],
     done:true,cls:'ok',log:'bool done',lcls:'ok',
     res:'✓ boolean · true = 1, false = 0 · 1 bit (1 byte in memory) · AND / OR / NOT gate the logic of every program',
     sfx:'done'});
  return steps;
}
/* ===================== 4: STATIC ARRAY ===================== */
function staticArrayBuild(){
  const steps=[],chips=['alloc'],snap=mkSnap(steps,chips);
  snap('allocate a fixed block: int a[5] — five contiguous slots, size decided at compile time',
    {cells:mkCells([null,null,null,null,null]),
     dir:'index 0 → 4   (contiguous memory)',
     formula:'int a[5];    addr(i) = base + i × 4 bytes',
     stats:[['Size',5],['Capacity',5],['Resize','never']]});
  chips.push('a[0]=10');
  snap('a[0] ← 10 : write straight into the first slot',
    {cells:mkCells([10,null,null,null,null],{0:'front'},{0:'ok'}),
     dir:'index 0 → 4   (contiguous memory)',
     formula:'a[0] ← 10     one write, no scanning',
     stats:[['Size',5],['Used',1],['Wasted',4]],
     log:'a[0] = 10',lcls:'ok'});
  chips.push('a[2]=30');
  snap('a[2] ← 30 : jump two slots ahead — index arithmetic does the work',
    {cells:mkCells([10,null,30,null,null],{2:'front'},{0:'ok',2:'ok'}),
     dir:'index 0 → 4   (contiguous memory)',
     formula:'addr(2) = base + 2 × 4   →   a[2] ← 30',
     stats:[['Size',5],['Used',2],['Wasted',3]],
     log:'a[2] = 30',lcls:'ok'});
  chips.push('a[4]=50');
  snap('a[4] ← 50 : last slot filled — slots 1 and 3 stay empty, that is fine',
    {cells:mkCells([10,null,30,null,50],{4:'front'},{0:'ok',2:'ok',4:'ok'}),
     dir:'index 0 → 4   (contiguous memory)',
     formula:'a[4] ← 50     3 of 5 slots used, 2 permanently wasted',
     stats:[['Size',5],['Used',3],['Wasted',2]],
     log:'a[4] = 50',lcls:'ok'});
  chips.push('read a[2]');
  snap('read a[2]: one address calculation → 30 — no walking, no searching',
    {cells:mkCells([10,null,30,null,50],{2:'front'},{0:'ok',2:'hl',4:'ok'}),
     dir:'index 0 → 4   (contiguous memory)',
     formula:'base + 2 × 4  →  30     O(1), always exactly one step',
     stats:[['Index',2],['Value',30],['Steps',1]],
     log:'a[2] read = 30',lcls:'hl'});
  chips.push('grow?');
  snap('try a[5] ← 99 — the block ends at index 4, a static array never grows',
    {cells:mkCells([10,null,30,null,50],{},{0:'bad',2:'bad',4:'bad'}),
     dir:'index 0 → 4   (block full at the memory level)',
     formula:'index 5 ≥ size 5   →   out of bounds (no resize possible)',
     stats:[['Index',5],['Size',5],['Resize','impossible']],
     log:'a[5] out of bounds',lcls:'bad',cls:'err',sfx:'bad'});
  chips.push('done');
  snap('✓ static arrays trade flexibility for speed — allocate once, index in constant time',
    {cells:mkCells([10,null,30,null,50],{},{0:'ok',2:'ok',4:'ok'}),
     dir:'index 0 → 4   (contiguous memory)',
     formula:'fixed size · O(1) index · holes allowed · cache-friendly layout',
     stats:[['Size',5],['Used',3],['Index','O(1)']],
     done:true,cls:'ok',log:'static array done',lcls:'ok',
     res:'✓ static array · 5 fixed slots · O(1) indexing via base + i×4 · cannot resize (use a dynamic array for that)',
     sfx:'done'});
  return steps;
}

/* ===================== 5: DYNAMIC ARRAY ===================== */
function dynamicArrayBuild(){
  const steps=[],chips=['new[]'],snap=mkSnap(steps,chips);
  snap('start small: capacity 4, size 0 — four reserved slots waiting to be filled',
    {cells:mkCells([null,null,null,null]),
     dir:'index 0 → 3   (capacity 4)',
     formula:'new array() → capacity 4, size 0',
     stats:[['Size',0],['Capacity',4],['Load','0%']]});
  chips.push('push 10');
  snap('push 10 → size 1',
    {cells:mkCells([10,null,null,null],{0:'rear'},{0:'ok'}),
     dir:'index 0 → 3   (capacity 4)',
     formula:'a[size++] ← 10',
     stats:[['Size',1],['Capacity',4],['Load','25%']],
     log:'push 10',lcls:'ok'});
  chips.push('push 20');
  snap('push 20 → size 2',
    {cells:mkCells([10,20,null,null],{1:'rear'},{0:'ok',1:'ok'}),
     dir:'index 0 → 3   (capacity 4)',
     formula:'a[size++] ← 20',
     stats:[['Size',2],['Capacity',4],['Load','50%']],
     log:'push 20',lcls:'ok'});
  chips.push('push 30');
  snap('push 30 → size 3, only one free slot left',
    {cells:mkCells([10,20,30,null],{2:'rear'},{0:'ok',1:'ok',2:'ok'}),
     dir:'index 0 → 3   (capacity 4)',
     formula:'a[size++] ← 30     3 of 4 slots full',
     stats:[['Size',3],['Capacity',4],['Load','75%']],
     log:'push 30',lcls:'ok'});
  chips.push('push 40');
  snap('push 40 → size 4 = capacity — the buffer is FULL, next push needs room',
    {cells:mkCells([10,20,30,40],{3:'rear'},{0:'ok',1:'ok',2:'ok',3:'hl'}),
     dir:'index 0 → 3   (capacity 4 — FULL)',
     formula:'size 4 = capacity 4   →   array is full',
     stats:[['Size',4],['Capacity',4],['Load','100%']],
     log:'buffer full',lcls:'hl'});
  chips.push('resize ×2');
  snap('resize: allocate 8 slots and copy the 4 elements across — capacity doubles',
    {cells:mkCells([10,20,30,40,null,null,null,null],{},{0:'move',1:'move',2:'move',3:'move'}),
     dir:'index 0 → 7   (capacity 8 after doubling)',
     formula:'new cap = 4 × 2 = 8    copy 4 items    old block freed',
     stats:[['Size',4],['Capacity',8],['Load','50%']],
     log:'resize 4 → 8, copied 4',lcls:'ok',sfx:'good'});
  chips.push('push 50');
  snap('push 50 into the fresh space → size 5, no copy needed this time',
    {cells:mkCells([10,20,30,40,50,null,null,null],{4:'rear'},{0:'ok',1:'ok',2:'ok',3:'ok',4:'hl'}),
     dir:'index 0 → 7   (capacity 8)',
     formula:'a[size++] ← 50     next resize only at size 8',
     stats:[['Size',5],['Capacity',8],['Load','63%']],
     log:'push 50',lcls:'ok'});
  chips.push('done');
  snap('✓ pushes cost almost nothing — the expensive copy happens only on the rare doubling',
    {cells:mkCells([10,20,30,40,50,null,null,null],{},{0:'ok',1:'ok',2:'ok',3:'ok',4:'ok'}),
     dir:'index 0 → 7   (capacity 8)',
     formula:'amortized cost = (copy of k) / k pushes → constant on average',
     stats:[['Size',5],['Capacity',8],['Avg push','O(1)']],
     done:true,cls:'ok',log:'dynamic array done',lcls:'ok',
     res:'✓ dynamic array · push amortized O(1) · capacity doubles 4 → 8 · occasional O(n) copy spreads the cost · contiguous memory kept',
     sfx:'done'});
  return steps;
}

/* ===================== 6: SINGLY LINKED LIST ===================== */
function singlyBuild(){
  const steps=[],chips=['head'],snap=mkSnap(steps,chips);
  snap('empty list: the head pointer is NULL — nothing to walk yet',
    {nodes:[],null:true,dir:'',
     formula:'head = NULL',
     stats:[['Head','NULL'],['Length',0],['Search','O(n)']]});
  chips.push('push 30');
  snap('insertFront(30): the new node becomes the head',
    {nodes:[{v:30,tag:'head',cls:'ok'}],null:true,
     formula:'n.next ← head;   head ← 30',
     stats:[['Head',30],['Length',1],['Insert','O(1)']],
     log:'head = 30',lcls:'ok'});
  chips.push('push 20');
  snap('insertFront(20): relink two pointers, nothing else moves',
    {nodes:[{v:20,tag:'head',cls:'ok'},{v:30}],null:true,
     formula:'n.next ← head(30);   head ← 20   →   20 → 30 → NULL',
     stats:[['Head',20],['Length',2],['Insert','O(1)']],
     log:'head = 20',lcls:'ok'});
  chips.push('push 10');
  snap('insertFront(10): still just two pointer writes — O(1) no matter the length',
    {nodes:[{v:10,tag:'head',cls:'ok'},{v:20},{v:30}],null:true,
     formula:'n.next ← head(20);  head ← 10   →   10 → 20 → 30',
     stats:[['Head',10],['Length',3],['Insert','O(1)']],
     log:'head = 10',lcls:'ok'});
  chips.push('append 40');
  snap('append must start at head and walk to the last node — this is the O(n) side',
    {nodes:[{v:10,tag:'head'},{v:20},{v:30,cls:'hl'}],null:true,arrowHl:1,
     formula:'walk 10 → 20 → 30 (tail) … then link',
     stats:[['Head',10],['Steps',3],['Length',3]],
     log:'walk to tail',lcls:'hl'});
  chips.push('link 40');
  snap('30.next ← 40 — append done, the new node has no next (NULL)',
    {nodes:[{v:10,tag:'head'},{v:20},{v:30},{v:40,cls:'ok'}],null:true,
     formula:'tail.next ← 40   →   10 → 20 → 30 → 40 → NULL',
     stats:[['Head',10],['Length',4],['Tail',40]],
     log:'append 40',lcls:'ok'});
  chips.push('pop front');
  snap('deleteFront: head jumps to head.next — node 10 is freed',
    {nodes:[{v:20,tag:'head',cls:'ok'},{v:30},{v:40}],null:true,
     formula:'head ← head.next   (old head 10 released)',
     stats:[['Head',20],['Length',3],['Deleted',10]],
     log:'removed 10',lcls:'hl'});
  chips.push('find 30');
  snap('search 30: compare at 20 — not a match, follow next',
    {nodes:[{v:20,tag:'head',cls:'hl'},{v:30},{v:40}],null:true,
     formula:'20 ≠ 30   →   follow next pointer',
     stats:[['Steps',1],['Found','no'],['Length',3]],
     log:'20 ≠ 30',lcls:'hl'});
  chips.push('found');
  snap('next → 30 = 30: found on the second comparison — no random access, only walking',
    {nodes:[{v:20,tag:'head'},{v:30,cls:'ok'},{v:40}],null:true,
     formula:'30 = 30   →   MATCH after 2 comparisons',
     stats:[['Steps',2],['Found','yes @2'],['Length',3]],
     log:'found 30',lcls:'ok'});
  chips.push('done');
  snap('✓ singly linked list: one pointer per node, cheapest possible insert at the head',
    {nodes:[{v:20,tag:'head'},{v:30},{v:40}],null:true,
     formula:'insert front O(1) · search / append O(n) · 1 pointer per node',
     stats:[['Length',3],['Head',20],['Pointers','1/node']],
     done:true,cls:'ok',log:'singly list done',lcls:'ok',
     res:'✓ singly linked list · 20 → 30 → 40 · push front O(1) · search O(n) · one next pointer per node',
     sfx:'done'});
  return steps;
}

/* ===================== 7: DOUBLY LINKED LIST ===================== */
function doublyBuild(){
  const steps=[],chips=['head'],snap=mkSnap(steps,chips);
  snap('empty doubly list: head and tail are both NULL',
    {nodes:[],null:true,dbl:true,wrap:'',
     formula:'head = NULL   tail = NULL',
     stats:[['Head','NULL'],['Length',0],['Pointers','2/node']]});
  chips.push('append 10');
  snap('insert 10: the first node points both ways at NULL',
    {nodes:[{v:10,tag:'head',cls:'ok'}],null:true,dbl:true,
     formula:'10.prev = NULL · 10.next = NULL · head = tail = 10',
     stats:[['Head',10],['Tail',10],['Length',1]],
     log:'append 10',lcls:'ok'});
  chips.push('append 20');
  snap('append 20: link the tail forward and the new node backward',
    {nodes:[{v:10,tag:'head'},{v:20,tag:'tail',tagCls:'g',cls:'ok'}],null:true,dbl:true,
     formula:'10.next ← 20   and   20.prev ← 10',
     stats:[['Head',10],['Tail',20],['Length',2]],
     log:'append 20',lcls:'ok'});
  chips.push('append 30');
  snap('append 30 — the doubly list is now 10 ↔ 20 ↔ 30',
    {nodes:[{v:10,tag:'head'},{v:20},{v:30,tag:'tail',tagCls:'g',cls:'ok'}],null:true,dbl:true,
     formula:'20.next ← 30   and   30.prev ← 20',
     stats:[['Head',10],['Tail',30],['Length',3]],
     log:'append 30',lcls:'ok'});
  chips.push('← from tail');
  snap('walk BACKWARD from the tail — impossible in a singly list, free here',
    {nodes:[{v:10,tag:'head'},{v:20},{v:30,tag:'tail',tagCls:'g',cls:'hl'}],null:true,dbl:true,arrowHl:1,
     formula:'start at tail 30, follow prev pointers ←',
     stats:[['At',30],['Direction','← backward'],['Length',3]],
     log:'30.prev → 20',lcls:'hl'});
  chips.push('prev 20');
  snap('30.prev → 20: reached the middle from the end in one step',
    {nodes:[{v:10,tag:'head'},{v:20,cls:'hl'},{v:30,tag:'tail',tagCls:'g'}],null:true,dbl:true,arrowHl:0,
     formula:'20.prev → 10 next — traversal works in both directions',
     stats:[['At',20],['Direction','← backward'],['Length',3]],
     log:'20.prev → 10',lcls:'hl'});
  chips.push('push 5');
  snap('insertFront(5): only head and the old first node change',
    {nodes:[{v:5,tag:'head',cls:'ok'},{v:10},{v:20},{v:30,tag:'tail',tagCls:'g'}],null:true,dbl:true,
     formula:'5.next ← 10 · 10.prev ← 5 · head ← 5',
     stats:[['Head',5],['Tail',30],['Length',4]],
     log:'push 5',lcls:'ok'});
  chips.push('find 20');
  snap('locate node 20 in the middle — with a direct pointer to it, deletion is constant time',
    {nodes:[{v:5,tag:'head'},{v:10},{v:20,cls:'hl'},{v:30,tag:'tail',tagCls:'g'}],null:true,dbl:true,
     formula:'have node 20 in hand → relink neighbours, no walk needed',
     stats:[['Target',20],['Cost','O(1)'],['Length',4]],
     log:'found 20',lcls:'hl'});
  chips.push('unlink 20');
  snap('delete 20: 10.next ← 30 and 30.prev ← 10 — two writes, node gone',
    {nodes:[{v:5,tag:'head',cls:'ok'},{v:10,cls:'hl'},{v:30,tag:'tail',tagCls:'g',cls:'ok'}],null:true,dbl:true,arrowHl:1,
     formula:'10.next ← 30 · 30.prev ← 10   →   5 ↔ 10 ↔ 30',
     stats:[['Head',5],['Tail',30],['Length',3]],
     log:'deleted 20',lcls:'ok'});
  chips.push('done');
  snap('✓ the prev pointer is what makes middle deletion and reverse walking cheap',
    {nodes:[{v:5,tag:'head'},{v:10},{v:30,tag:'tail',tagCls:'g'}],null:true,dbl:true,
     formula:'delete known node O(1) · walk both ways · 2 pointers per node',
     stats:[['Length',3],['Head',5],['Tail',30]],
     done:true,cls:'ok',log:'doubly list done',lcls:'ok',
     res:'✓ doubly linked list · 5 ↔ 10 ↔ 30 · delete known node O(1) · bidirectional walk · costs one extra pointer per node',
     sfx:'done'});
  return steps;
}

/* ===================== 8: CIRCULAR LINKED LIST ===================== */
function circularBuild(){
  const steps=[],chips=['head'],snap=mkSnap(steps,chips);
  snap('empty circular list: nothing yet — soon the tail will point all the way back to the head',
    {nodes:[],dbl:false,wrap:'',
     formula:'head = NULL',
     stats:[['Head','NULL'],['Length',0],['Ends','none']]});
  chips.push('insert 10');
  snap('insert 10: a single node points at itself — already a circle',
    {nodes:[{v:10,tag:'head',cls:'ok'}],
     wrap:'↺  next(10) = 10  (it is its own head)',
     formula:'10.next ← 10   →   head = tail = 10',
     stats:[['Head',10],['Length',1],['Last','10']],
     log:'insert 10',lcls:'ok'});
  chips.push('insert 20');
  snap('insert 20: the circle grows, the wrap-around now sits after 20',
    {nodes:[{v:10,tag:'head'},{v:20,cls:'ok'}],
     wrap:'↺  next(20) = head(10)',
     formula:'20.next ← head(10) · tail ← 20',
     stats:[['Head',10],['Length',2],['Last',20]],
     log:'insert 20',lcls:'ok'});
  chips.push('insert 30');
  snap('insert 30: 10 → 20 → 30 → back to 10 — no NULL anywhere',
    {nodes:[{v:10,tag:'head'},{v:20},{v:30,cls:'ok'}],
     wrap:'↺  next(30) = head(10)',
     formula:'30.next ← head(10)   →   closed ring',
     stats:[['Head',10],['Length',3],['Last',30]],
     log:'insert 30',lcls:'ok'});
  chips.push('start at head');
  snap('traverse: begin at head 10 and keep following next',
    {nodes:[{v:10,tag:'head',cls:'hl'},{v:20},{v:30}],
     wrap:'↺  next(30) = head(10)',
     formula:'cur ← head = 10',
     stats:[['At',10],['Visited',1],['Length',3]],
     log:'visit 10',lcls:'hl'});
  chips.push('→ 20');
  snap('next → 20: ordinary step, exactly like a normal list',
    {nodes:[{v:10,tag:'head'},{v:20,cls:'hl'},{v:30}],arrowHl:0,
     wrap:'↺  next(30) = head(10)',
     formula:'10.next → 20',
     stats:[['At',20],['Visited',2],['Length',3]],
     log:'visit 20',lcls:'hl'});
  chips.push('→ 30');
  snap('next → 30: the last node, but there is no NULL to stop us',
    {nodes:[{v:10,tag:'head'},{v:20},{v:30,cls:'hl'}],arrowHl:1,
     wrap:'↺  next(30) = head(10)',
     formula:'20.next → 30   (30.next = head, not NULL)',
     stats:[['At',30],['Visited',3],['Length',3]],
     log:'visit 30',lcls:'hl'});
  chips.push('↺ wrap');
  snap('next → head again: seeing 10 twice means the full turn is complete',
    {nodes:[{v:10,tag:'head',cls:'ok'},{v:20},{v:30}],arrowHl:2,
     wrap:'↺  back at head(10) — traversal stops here',
     formula:'30.next → 10 = head   →   stop (visited once already)',
     stats:[['At',10],['Visited',4],['Cycles',1]],
     log:'wrapped to head',lcls:'ok',sfx:'good'});
  chips.push('insert 40');
  snap('insert 40 at the tail — one pointer write, then re-close the ring',
    {nodes:[{v:10,tag:'head'},{v:20},{v:30},{v:40,cls:'ok'}],
     wrap:'↺  next(40) = head(10)',
     formula:'30.next ← 40 · 40.next ← head(10) · tail ← 40',
     stats:[['Head',10],['Length',4],['Last',40]],
     log:'append 40',lcls:'ok'});
  chips.push('done');
  snap('✓ no NULL terminator means round-robin traversal never falls off the end',
    {nodes:[{v:10,tag:'head'},{v:20},{v:30},{v:40}],
     wrap:'↺  10 → 20 → 30 → 40 → 10 …',
     formula:'append at tail O(1) · traverse until head again · cycle by design',
     stats:[['Head',10],['Length',4],['Cycle','yes']],
     done:true,cls:'ok',log:'circular list done',lcls:'ok',
     res:'✓ circular linked list · 10 → 20 → 30 → 40 → back to 10 · no NULL end · O(1) tail append · powers round-robin scheduling',
     sfx:'done'});
  return steps;
}
/* ===================== 9: STACK (LIFO) ===================== */
function stackBuild(){
  const steps=[],chips=['new stack'],snap=mkSnap(steps,chips);
  const DIR='bottom ← → top   (LIFO — only the top is reachable)';
  snap('empty stack: top = −1, nothing to pop',
    {cells:mkCells([null,null,null,null,null,null]),dir:DIR,
     formula:'empty: top = −1',
     stats:[['Size',0],['Top','—'],['Order','LIFO']]});
  chips.push('push 10');
  snap('push 10 → it lands on the bottom',
    {cells:mkCells([10,null,null,null,null,null],{0:'top'},{0:'ok'}),dir:DIR,
     formula:'a[++top] ← 10',
     stats:[['Size',1],['Top',10],['Order','LIFO']],
     log:'push 10',lcls:'ok'});
  chips.push('push 20');
  snap('push 20 → pile grows upward',
    {cells:mkCells([10,20,null,null,null,null],{1:'top'},{0:'ok',1:'ok'}),dir:DIR,
     formula:'a[++top] ← 20',
     stats:[['Size',2],['Top',20],['Order','LIFO']],
     log:'push 20',lcls:'ok'});
  chips.push('push 30');
  snap('push 30 → three items, only 30 can be touched next',
    {cells:mkCells([10,20,30,null,null,null],{2:'top'},{0:'ok',1:'ok',2:'ok'}),dir:DIR,
     formula:'a[++top] ← 30     bottom = 10, top = 30',
     stats:[['Size',3],['Top',30],['Order','LIFO']],
     log:'push 30',lcls:'ok'});
  chips.push('peek');
  snap('peek reads the top WITHOUT removing it → 30',
    {cells:mkCells([10,20,30,null,null,null],{2:'top'},{0:'ok',1:'ok',2:'hl'}),dir:DIR,
     formula:'a[top] = 30     read only, size stays 3',
     stats:[['Size',3],['Peek',30],['Cost','O(1)']],
     log:'peek = 30',lcls:'hl'});
  chips.push('pop');
  snap('pop returns 30 and shrinks the stack — the newest item leaves first',
    {cells:mkCells([10,20,null,null,null,null],{1:'top'},{0:'ok',1:'hl'}),dir:DIR,
     formula:'return a[top--] → 30',
     stats:[['Size',2],['Top',20],['Popped',30]],
     log:'pop 30',lcls:'hl'});
  chips.push('push 40');
  snap('push 40 on top of 20',
    {cells:mkCells([10,20,40,null,null,null],{2:'top'},{0:'ok',1:'ok',2:'ok'}),dir:DIR,
     formula:'a[++top] ← 40',
     stats:[['Size',3],['Top',40],['Order','LIFO']],
     log:'push 40',lcls:'ok'});
  chips.push('pop 40');
  snap('pop → 40 leaves immediately: last in, first out',
    {cells:mkCells([10,20,null,null,null,null],{1:'top'},{0:'ok',1:'hl'}),dir:DIR,
     formula:'return a[top--] → 40     (10 was pushed first, still waiting)',
     stats:[['Size',2],['Top',20],['Popped',40]],
     log:'pop 40',lcls:'hl'});
  chips.push('pop 20');
  snap('pop → 20 — everything is unwound in exact reverse order of insertion',
    {cells:mkCells([10,null,null,null,null,null],{0:'top'},{0:'hl'}),dir:DIR,
     formula:'return a[top--] → 20',
     stats:[['Size',1],['Top',10],['Popped',20]],
     log:'pop 20',lcls:'hl'});
  chips.push('done');
  snap('✓ LIFO at its purest: 10, 20, 30, 40 went in that order, 40, 30… came back out',
    {cells:mkCells([10,null,null,null,null,null],{0:'top'},{0:'ok'}),dir:DIR,
     formula:'push / pop / peek — all O(1), all at the top',
     stats:[['Size',1],['Top',10],['Ops','O(1)']],
     done:true,cls:'ok',log:'stack done',lcls:'ok',
     res:'✓ LIFO stack · push / pop / peek O(1) · 10 stays until last · used by undo history, DFS and the call stack',
     sfx:'done'});
  return steps;
}

/* ===================== 10: QUEUE (FIFO) ===================== */
function queueBuild(){
  const steps=[],chips=['new queue'],snap=mkSnap(steps,chips);
  const DIR='front → rear   (FIFO — leave at front, arrive at rear)';
  snap('empty queue: front and rear sit together at slot 0',
    {cells:mkCells([null,null,null,null,null,null]),dir:DIR,
     formula:'front = rear = 0  →  empty',
     stats:[['Size',0],['Front','—'],['Rear','—']]});
  chips.push('enq A');
  snap('enqueue A at the rear',
    {cells:mkCells(['A',null,null,null,null,null],{0:'front'},{0:'ok'}),dir:DIR,
     formula:'a[rear++] ← A',
     stats:[['Size',1],['Front','A'],['Rear','A']],
     log:'enqueue A',lcls:'ok'});
  chips.push('enq B');
  snap('enqueue B behind A — order of arrival is preserved',
    {cells:mkCells(['A','B',null,null,null,null],{0:'front',1:'rear'},{0:'ok',1:'ok'}),dir:DIR,
     formula:'a[rear++] ← B     A waits in front',
     stats:[['Size',2],['Front','A'],['Rear','B']],
     log:'enqueue B',lcls:'ok'});
  chips.push('enq C');
  snap('enqueue C — three waiting in line',
    {cells:mkCells(['A','B','C',null,null,null],{0:'front',2:'rear'},{0:'ok',1:'ok',2:'ok'}),dir:DIR,
     formula:'a[rear++] ← C',
     stats:[['Size',3],['Front','A'],['Rear','C']],
     log:'enqueue C',lcls:'ok'});
  chips.push('deq');
    snap('dequeue removes the FRONT: A leaves first — first in, first out',
    {cells:mkCells([null,'B','C',null,null,null],{1:'front',2:'rear'},{1:'ok',2:'ok'}),dir:DIR,
     formula:'return a[front++] → A     front = 1',
     stats:[['Size',2],['Front','B'],['Out','A']],
     log:'dequeue A',lcls:'hl'});
  chips.push('enq D');
  snap('enqueue D at the back of the line',
    {cells:mkCells([null,'B','C','D',null,null],{1:'front',3:'rear'},{1:'ok',2:'ok',3:'ok'}),dir:DIR,
     formula:'a[rear++] ← D     line: B, C, D',
     stats:[['Size',3],['Front','B'],['Rear','D']],
     log:'enqueue D',lcls:'ok'});
  chips.push('deq B');
  snap('dequeue B — C is now at the front, nothing was ever shifted',
    {cells:mkCells([null,null,'C','D',null,null],{2:'front',3:'rear'},{2:'ok',3:'ok'}),dir:DIR,
     formula:'return a[front++] → B     only the pointer moved',
     stats:[['Size',2],['Front','C'],['Out','B']],
     log:'dequeue B',lcls:'hl'});
  chips.push('done');
  snap('✓ head and tail pointers make enqueue and dequeue constant time without shifting anything',
    {cells:mkCells([null,null,'C','D',null,null],{2:'front',3:'rear'},{2:'ok',3:'ok'}),dir:DIR,
     formula:'enqueue O(1) at rear · dequeue O(1) at front · strictly FIFO',
     stats:[['Size',2],['Front','C'],['Rear','D']],
     done:true,cls:'ok',log:'queue done',lcls:'ok',
     res:'✓ FIFO queue · A, B left first (first in, first out) · enqueue / dequeue O(1) · the workhorse of BFS and task schedulers',
     sfx:'done'});
  return steps;
}

/* ===================== 11: CIRCULAR QUEUE ===================== */
function circularQueueBuild(){
  const steps=[],chips=['ring[5]'],snap=mkSnap(steps,chips);
  const DIR='front → rear   (ring of 5 — rear wraps 4 → 0)';
  const cells=(a,front,rear,cls)=>{
    const tags={};
    if(front>=0&&front<a.length&&!((a[front]===null||a[front]===undefined||a[front]==='')))tags[front]='front';
    if(rear>=0&&rear<a.length)tags[rear]='rear';
    return mkCells(a,tags,cls||{});
  };
  snap('circular queue with capacity 5: front = rear = 0 means empty',
    {cells:cells([null,null,null,null,null],0,0),dir:DIR,
     formula:'ring[5]: front = 0, rear = 0, size = 0',
     stats:[['Size',0],['Front',0],['Rear',0],['Cap',5]]});
  chips.push('enq 4');
  snap('enqueue 4 at slot 0, rear advances to 1',
    {cells:cells([4,null,null,null,null],0,1,{0:'ok'}),dir:DIR,
     formula:'ring[rear++] ← 4   →   rear = 1',
     stats:[['Size',1],['Front',0],['Rear',1],['Cap',5]],
     log:'enq 4',lcls:'ok'});
  chips.push('enq 8');
  snap('enqueue 8 at slot 1',
    {cells:cells([4,8,null,null,null],0,2,{1:'ok'}),dir:DIR,
     formula:'ring[rear++] ← 8   →   rear = 2',
     stats:[['Size',2],['Front',0],['Rear',2],['Cap',5]],
     log:'enq 8',lcls:'ok'});
  chips.push('enq 12');
  snap('enqueue 12 at slot 2 — three of five slots used',
    {cells:cells([4,8,12,null,null],0,3,{2:'ok'}),dir:DIR,
     formula:'ring[rear++] ← 12   →   rear = 3',
     stats:[['Size',3],['Front',0],['Rear',3],['Cap',5]],
     log:'enq 12',lcls:'ok'});
  chips.push('deq 4');
  snap('dequeue: slot 0 is freed and front advances to 1 — in a plain queue that space would be lost',
    {cells:cells([null,8,12,null,null],1,3,{1:'hl'}),dir:DIR,
     formula:'front = (front + 1) % 5 → 1    out: 4',
     stats:[['Size',2],['Front',1],['Rear',3],['Cap',5]],
     log:'deq 4',lcls:'hl'});
  chips.push('deq 8');
  snap('dequeue 8 — front now points at slot 2',
    {cells:cells([null,null,12,null,null],2,3,{2:'hl'}),dir:DIR,
     formula:'front = (front + 1) % 5 → 2    out: 8',
     stats:[['Size',1],['Front',2],['Rear',3],['Cap',5]],
     log:'deq 8',lcls:'hl'});
  chips.push('enq 16');
  snap('enqueue 16 at slot 3, rear moves to 4',
    {cells:cells([null,null,12,16,null],2,4,{3:'ok'}),dir:DIR,
     formula:'ring[rear++] ← 16   →   rear = 4',
     stats:[['Size',2],['Front',2],['Rear',4],['Cap',5]],
     log:'enq 16',lcls:'ok'});
  chips.push('enq 20');
  snap('enqueue 20 at slot 4 — the rear now WRAPS: (4 + 1) % 5 = 0',
    {cells:cells([null,null,12,16,20],2,0,{4:'ok'}),dir:DIR,
     formula:'ring[4] ← 20   →   rear = (4+1) % 5 = 0   (wrap!)',
     stats:[['Size',3],['Front',2],['Rear',0],['Cap',5]],
     log:'rear wrapped 4 → 0',lcls:'good',sfx:'good'});
  chips.push('enq 24');
  snap('enqueue 24 reuses slot 0 — the space the dequeues freed is back in service',
    {cells:cells([24,null,12,16,20],2,1,{0:'hl'}),dir:DIR,
     formula:'ring[0] ← 24   →   rear = 1    (slot 0 recycled)',
     stats:[['Size',4],['Front',2],['Rear',1],['Cap',5]],
     log:'enq 24 at slot 0',lcls:'ok'});
  chips.push('done');
  snap('✓ all five slots usable — front at 2, rear at 1, wrap point 4 → 0',
    {cells:cells([24,null,12,16,20],2,1,{0:'ok',2:'ok',3:'ok',4:'ok'}),dir:DIR,
     formula:'(rear + 1) % 5 = front → full? · (front == rear) → empty? · never waste a slot',
     stats:[['Size',4],['Front',2],['Rear',1],['Cap',5]],
     done:true,cls:'ok',log:'circular queue done',lcls:'ok',
     res:'✓ circular queue · capacity 5, all slots usable · slots [24, ·, 12, 16, 20] · front 2, rear 1 (wrapped 4 → 0) · O(1) enqueue and dequeue',
     sfx:'done'});
  return steps;
}

/* ===================== 12: DEQUE ===================== */
function dequeBuild(){
  const steps=[],chips=['deque'],snap=mkSnap(steps,chips);
  const DIR='front ⇄ rear   (both ends open)';
  const cells=(a,cls,tags)=>mkCells(a,tags||{},cls||{});
  snap('empty deque: head and tail pointers, both ends ready to work',
    {cells:cells([null,null,null,null,null,null]),dir:DIR,
     formula:'empty: front = rear',
     stats:[['Size',0],['Front','—'],['Rear','—']]});
  chips.push('pushFront 5');
  snap('pushFront(5) — enter at the front door',
    {cells:cells([5,null,null,null,null,null],{0:'ok'},{0:'front'}),dir:DIR,
     formula:'front-- ; a[front] ← 5',
     stats:[['Size',1],['Front',5],['Rear',5]],
     log:'pushFront 5',lcls:'ok'});
  chips.push('pushBack 40');
  snap('pushBack(40) — the other door opens too',
    {cells:cells([5,40,null,null,null,null],{0:'ok',1:'ok'},{0:'front',1:'rear'}),dir:DIR,
     formula:'a[rear++] ← 40',
     stats:[['Size',2],['Front',5],['Rear',40]],
     log:'pushBack 40',lcls:'ok'});
  chips.push('pushBack 60');
  snap('pushBack(60) — the line grows at the rear',
    {cells:cells([5,40,60,null,null,null],{0:'ok',1:'ok',2:'ok'},{0:'front',2:'rear'}),dir:DIR,
     formula:'a[rear++] ← 60',
     stats:[['Size',3],['Front',5],['Rear',60]],
     log:'pushBack 60',lcls:'ok'});
  chips.push('pushFront 2');
  snap('pushFront(2) — insert at the head without disturbing the rest',
    {cells:cells([2,5,40,60,null,null],{0:'ok'},{0:'front',3:'rear'}),dir:DIR,
     formula:'front-- ; a[front] ← 2   →   2, 5, 40, 60',
     stats:[['Size',4],['Front',2],['Rear',60]],
     log:'pushFront 2',lcls:'ok'});
  chips.push('popFront');
  snap('popFront removes 2 — it was the last one in at that end',
    {cells:cells([null,5,40,60,null,null],{1:'hl'},{1:'front',3:'rear'}),dir:DIR,
     formula:'return a[front++] → 2',
     stats:[['Size',3],['Front',5],['Out',2]],
     log:'popFront 2',lcls:'hl'});
  chips.push('popBack');
  snap('popBack removes 60 from the opposite end — queue rules still work',
    {cells:cells([null,5,40,null,null,null],{2:'hl'},{1:'front',2:'rear'}),dir:DIR,
     formula:'return a[--rear] → 60',
     stats:[['Size',2],['Front',5],['Out',60]],
     log:'popBack 60',lcls:'hl'});
  chips.push('popFront');
  snap('popFront removes 5 — one deque can serve as a queue AND a stack',
    {cells:cells([null,null,40,null,null,null],{2:'hl'},{2:'front',2:'rear'}),dir:DIR,
     formula:'return a[front++] → 5',
     stats:[['Size',1],['Front',40],['Out',5]],
     log:'popFront 5',lcls:'hl'});
  chips.push('done');
  snap('✓ four operations, every one of them O(1) — no shifting, no resizing',
    {cells:cells([null,null,40,null,null,null],{2:'ok'},{2:'front',2:'rear'}),dir:DIR,
     formula:'push/pop × front/rear = 4 ops, all constant time',
     stats:[['Size',1],['Front',40],['Ops','O(1)']],
     done:true,cls:'ok',log:'deque done',lcls:'ok',
     res:'✓ deque · push and pop at BOTH ends O(1) · works as a queue and a stack at once · backs sliding-window and undo buffers',
     sfx:'done'});
  return steps;
}

/* ===================== 13: PRIORITY QUEUE ===================== */
function pqBuild(){
  const steps=[],chips=['pq'],snap=mkSnap(steps,chips);
  const DIR='array view: index 0 = highest priority (max-heap)';
  const cells=(a,cls)=>mkCells(a,a.length?{0:'front'}:{},cls||{});
  snap('empty priority queue: the biggest value will always sit at index 0',
    {cells:cells([]),dir:DIR,
     formula:'max-heap: parent ≥ children · peek = a[0]',
     stats:[['Size',0],['Front','—'],['Structure','heap']]});
  chips.push('enq 15');
  snap('enqueue 15 — alone at the root',
    {cells:cells([15],{0:'ok'}),dir:DIR,
     formula:'a[size++] ← 15',
     stats:[['Size',1],['Front',15],['Heap','ok']],
     log:'enqueue 15',lcls:'ok'});
  chips.push('enq 40');
  snap('enqueue 40 → 40 > 15, so it sifts up and takes the front seat',
    {cells:cells([40,15],{0:'ok',1:'move'}),dir:DIR,
     formula:'append 40 → swap with parent → [40, 15]',
     stats:[['Size',2],['Front',40],['Heap','ok']],
     log:'enqueue 40 (sift up)',lcls:'ok'});
  chips.push('enq 25');
  snap('enqueue 25 → smaller than 40, it stays below',
    {cells:cells([40,15,25],{0:'ok',1:'ok',2:'ok'}),dir:DIR,
     formula:'parent(2) = 0 → 40 ≥ 25 → no swap → [40, 15, 25]',
     stats:[['Size',3],['Front',40],['Heap','ok']],
     log:'enqueue 25',lcls:'ok'});
  chips.push('enq 10');
  snap('enqueue 10 → 10 < parent 15, heap order holds',
    {cells:cells([40,15,25,10],{0:'ok',1:'ok',2:'ok',3:'ok'}),dir:DIR,
     formula:'parent(3) = 1 → 15 ≥ 10 → done → [40, 15, 25, 10]',
     stats:[['Size',4],['Front',40],['Heap','ok']],
     log:'enqueue 10',lcls:'ok'});
  chips.push('peek');
  snap('peek → 40 in O(1): the highest priority is always at the root',
    {cells:cells([40,15,25,10],{0:'hl',1:'ok',2:'ok',3:'ok'}),dir:DIR,
     formula:'return a[0] → 40     (one array read)',
     stats:[['Size',4],['Front',40],['Cost','O(1)']],
     log:'peek = 40',lcls:'hl'});
  chips.push('deq 40');
  snap('dequeue: 40 leaves, the LAST element (10) jumps into the root — order temporarily broken',
    {cells:cells([10,15,25],{0:'move',1:'ok',2:'ok'}),dir:DIR,
     formula:'out 40 · a[0] ← last(10) → [10, 15, 25] · now sift down',
     stats:[['Size',3],['Front',10],['Out',40]],
     log:'dequeue 40, move 10 up',lcls:'hl'});
  chips.push('sift 10');
  snap('sift down: 10 < bigger child 25 → swap them',
    {cells:cells([25,15,10],{0:'ok',1:'ok',2:'move'}),dir:DIR,
     formula:'10 → swap with child 25 → [25, 15, 10]',
     stats:[['Size',3],['Front',25],['Swaps',1]],
     log:'sift down: 10 ↔ 25',lcls:'ok'});
  chips.push('enq 35');
  snap('enqueue 35: appended at the end of the array',
    {cells:cells([25,15,10,35],{0:'ok',1:'ok',2:'ok',3:'hl'}),dir:DIR,
     formula:'a[size++] ← 35 → [25, 15, 10, 35]',
     stats:[['Size',4],['Front',25],['Heap','repairing']],
     log:'append 35',lcls:'hl'});
  chips.push('sift 35');
  snap('sift up: 35 > parent 25 → swap, and 35 becomes the new front',
    {cells:cells([35,15,10,25],{0:'ok',1:'ok',2:'ok',3:'move'}),dir:DIR,
     formula:'35 ↔ 25 → [35, 15, 10, 25] ✓ heap restored',
     stats:[['Size',4],['Front',35],['Heap','ok']],
     log:'sift up 35',lcls:'good',sfx:'good'});
  chips.push('done');
  snap('✓ enqueue and dequeue only walk one root-to-leaf path — logarithmic, never linear',
    {cells:cells([35,15,10,25],{0:'ok',1:'ok',2:'ok',3:'ok'}),dir:DIR,
     formula:'enqueue O(log n) · dequeue O(log n) · peek O(1) · array-backed, zero pointers',
     stats:[['Size',4],['Front',35],['Ops','O(log n)']],
     done:true,cls:'ok',log:'priority queue done',lcls:'ok',
     res:'✓ priority queue on a max-heap · [40, 15, 25, 10] → dequeue 40 → [25, 15, 10] → enqueue 35 → [35, 15, 10, 25] · O(log n) each way',
     sfx:'done'});
  return steps;
}
/* ===================== 14: TREE TRAVERSALS ===================== */
function traversalsBuild(){
  const steps=[],chips=['pre-order'],snap=mkSnap(steps,chips);
  const T14={v:1,l:{v:2,l:{v:4},r:{v:5}},r:{v:3,l:{v:6},r:{v:7}}};
  const S0={tree:T14,path:[],cur:null,order:[],tinfo:[['Type','binary tree'],['Nodes',7],['Height',3],['Method','pre-order']],tinfoHl:0,
    stats:[['Nodes',7],['Visited',0],['Method','pre-order']]};
  snap('a perfect binary tree of height 3 — visiting every node exactly once, in a fixed order',
    Object.assign({},S0,
     {formula:'pre-order = visit, then left subtree, then right subtree',
      chips:['pre-order']}));
  const PRE=[1,2,4,5,3,6,7], IN=[4,2,5,1,6,3,7], POST=[4,5,2,6,7,3,1];
  const visits=[];
  const PATHS={'1':[],'2':['l'],'4':['l','l'],'5':['l','r'],'3':['r'],'6':['r','l'],'7':['r','r']};
  const BASE={tree:T14,tinfo:[['Type','binary tree'],['Nodes',7],['Height',3],['Method','pre-order']],tinfoHl:0};
  // PRE
  visits.push(['pre',1,PRE]);
  visits.push(['pre',2,PRE]);
  visits.push(['pre',4,PRE]);
  visits.push(['pre',5,PRE]);
  visits.push(['pre',3,PRE]);
  visits.push(['pre',6,PRE]);
  visits.push(['pre',7,PRE]);
  for(let i=0;i<visits.length;i++){
    const m=visits[i],v=m[1],seq=m[2];
    const doneIdx=seq.indexOf(v);
    snap('visit '+v+' — record it, then descend into its left subtree',
      Object.assign({},BASE,
       {path:seq.slice(0,doneIdx+1),
        cur:v,
        order:seq.slice(0,doneIdx+1),
        formula:'pre-order: root → left → right   ·   visited: '+seq.slice(0,doneIdx+1).join(', '),
        stats:[['Nodes',7],['Visited',doneIdx+1],['Method','pre-order']]}));
  }
  snap('✓ pre-order finished: 1 → 2 → 4 → 5 → 3 → 6 → 7 (root first — good for copying a tree)',
    Object.assign({},BASE,
     {path:PRE,
      order:PRE,cls:'ok',
      tinfo:[['Type','binary tree'],['Nodes',7],['pre-order','1 2 4 5 3 6 7'],['Method','✓ done']],tinfoHl:3,
      formula:'root → left subtree → right subtree   ·   7 / 7 visited',
      stats:[['Nodes',7],['Visited',7],['Method','pre-order']],
      done:true,sfx:'good',
      log:'pre: 1 2 4 5 3 6 7',lcls:'ok',
      res:'✓ pre-order (root first) → 1 2 4 5 3 6 7 · O(n) · used to serialize / copy a tree'}));
  // IN
  chips.push('in-order');
  snap('in-order: left subtree → root → right subtree — in a BST this prints sorted values',
    Object.assign({},BASE,
     {tinfo:[['Type','binary tree'],['Nodes',7],['Height',3],['Method','in-order']],tinfoHl:3,
      path:[],cur:null,order:[],
      formula:'in-order: left → root → right',
      stats:[['Nodes',7],['Visited',0],['Method','in-order']]}));
  const inVisits=[4,2,5,1,6,3,7];
  for(let i=0;i<inVisits.length;i++){
    const v=inVisits[i],seq=IN;
    const doneIdx=seq.indexOf(v);
    snap('visit '+v+' — emit it after the whole left subtree is done',
      Object.assign({},BASE,
       {path:seq.slice(0,doneIdx+1),
        cur:v,
        order:seq.slice(0,doneIdx+1),
        tinfo:[['Type','binary tree'],['Nodes',7],['Height',3],['Method','in-order']],tinfoHl:3,
        formula:'in-order: left → root → right   ·   visited: '+seq.slice(0,doneIdx+1).join(', '),
        stats:[['Nodes',7],['Visited',doneIdx+1],['Method','in-order']]}));
  }
  snap('✓ in-order finished: 4 → 2 → 5 → 1 → 6 → 3 → 7 (ascending order for a BST)',
    Object.assign({},BASE,
     {path:IN,order:IN,cls:'ok',
      tinfo:[['Type','binary tree'],['Nodes',7],['in-order','4 2 5 1 6 3 7'],['Method','✓ done']],tinfoHl:3,
      formula:'left → root → right   ·   7 / 7 visited',
      stats:[['Nodes',7],['Visited',7],['Method','in-order']],
      done:true,sfx:'good',
      log:'in: 4 2 5 1 6 3 7',lcls:'ok',
      res:'✓ in-order (root second) → 4 2 5 1 6 3 7 · O(n) · ascending on a BST'}));
  // POST
  chips.push('post-order');
  snap('post-order: left → right → root — children before parent',
    Object.assign({},BASE,
     {tinfo:[['Type','binary tree'],['Nodes',7],['Height',3],['Method','post-order']],tinfoHl:3,
      path:[],cur:null,order:[],
      formula:'post-order: left → right → root',
      stats:[['Nodes',7],['Visited',0],['Method','post-order']]}));
  const postVisits=[4,5,2,6,7,3,1];
  for(let i=0;i<postVisits.length;i++){
    const v=postVisits[i],seq=POST;
    const doneIdx=seq.indexOf(v);
    snap('visit '+v+' — emit it only after BOTH children are finished',
      Object.assign({},BASE,
       {path:seq.slice(0,doneIdx+1),
        cur:v,
        order:seq.slice(0,doneIdx+1),
        tinfo:[['Type','binary tree'],['Nodes',7],['Height',3],['Method','post-order']],tinfoHl:3,
        formula:'post-order: left → right → root   ·   visited: '+seq.slice(0,doneIdx+1).join(', '),
        stats:[['Nodes',7],['Visited',doneIdx+1],['Method','post-order']]}));
  }
  chips.push('done');
  snap('✓ post-order finished: 4 → 5 → 2 → 6 → 7 → 3 → 1 (deleting a tree needs this)',
    Object.assign({},BASE,
     {path:POST,order:POST,cls:'ok',
      tinfo:[['Type','binary tree'],['Nodes',7],['post-order','4 5 2 6 7 3 1'],['Method','✓ done']],tinfoHl:3,
      formula:'left → right → root   ·   7 / 7 visited',
      stats:[['Nodes',7],['Visited',7],['Method','post-order']],
      done:true,sfx:'done',
      log:'post: 4 5 2 6 7 3 1',lcls:'ok',
      res:'✓ all three traversals · pre 1 2 4 5 3 6 7 · in 4 2 5 1 6 3 7 · post 4 5 2 6 7 3 1 · each O(n), same tree different orders'}));
  return steps;
}

/* ===================== 15: BINARY SEARCH TREE ===================== */
function bstBuild(){
  const steps=[],chips=['empty'],snap=mkSnap(steps,chips);
  snap('empty BST: insertions go left or right by comparison — no scanning ever',
    {tree:null,tinfo:[['Type','BST'],['Nodes',0],['Height',0],['Order','sorted']],tinfoHl:0,
     formula:'for each node: key < node → left · key > node → right',
     stats:[['Nodes',0],['Height',0],['Search','O(log n)']]});
  chips.push('ins 20');
  snap('insert 20 — the root, chosen with no comparisons at all',
    {tree:{v:20},tinfo:[['Type','BST'],['Nodes',1],['Height',1],['Root',20]],tinfoHl:3,
     path:[20],cur:20,
     formula:'empty → root ← 20',
     stats:[['Nodes',1],['Height',1],['Root',20]],
     log:'root = 20',lcls:'ok'});
  chips.push('ins 30');
  snap('insert 30: 30 > 20 → go right → place at the right slot',
    {tree:{v:20,r:{v:30}},path:[20,30],cur:30,
     tinfo:[['Type','BST'],['Nodes',2],['Height',2],['Root',20]],tinfoHl:3,
     formula:'30 > 20 → right → insert',
     stats:[['Nodes',2],['Height',2],['Root',20]],
     log:'30 right of 20',lcls:'ok'});
  chips.push('ins 10');
  snap('insert 10: 10 < 20 → go left',
    {tree:{v:20,l:{v:10},r:{v:30}},path:[20,10],cur:10,
     tinfo:[['Type','BST'],['Nodes',3],['Height',2],['Root',20]],tinfoHl:3,
     formula:'10 < 20 → left → insert',
     stats:[['Nodes',3],['Height',2],['Root',20]],
     log:'10 left of 20',lcls:'ok'});
  chips.push('ins 25');
  snap('insert 25: right of 20, left of 30 — two comparisons',
    {tree:{v:20,l:{v:10},r:{v:30,l:{v:25}}},path:[20,30,25],cur:25,
     tinfo:[['Type','BST'],['Nodes',4],['Height',3],['Root',20]],tinfoHl:3,
     formula:'25 > 20 → right · 25 < 30 → left → insert',
     stats:[['Nodes',4],['Height',3],['Comparisons',2]],
     log:'25 left of 30',lcls:'ok'});
  chips.push('ins 5');
  snap('insert 5: left of 20, left of 10 — the left branch deepens',
    {tree:{v:20,l:{v:10,l:{v:5}},r:{v:30,l:{v:25}}},path:[20,10,5],cur:5,
     tinfo:[['Type','BST'],['Nodes',5],['Height',3],['Root',20]],tinfoHl:3,
     formula:'5 < 20 → left · 5 < 10 → left → insert',
     stats:[['Nodes',5],['Height',3],['Comparisons',2]],
     log:'5 left of 10',lcls:'ok'});
  chips.push('search 25');
  snap('search 25: at 20, 25 > 20 → right (1 comparison)',
    {tree:{v:20,l:{v:10,l:{v:5}},r:{v:30,l:{v:25}}},path:[20],cur:20,
     tinfo:[['Type','BST'],['Search','25'],['At',20],['Comparisons',1]],tinfoHl:2,
     formula:'25 > 20 → go right',
     stats:[['Steps',1],['At',20],['Found','no yet']],
     log:'25 > 20 →',lcls:'hl'});
  chips.push('at 30');
  snap('at 30: 25 < 30 → left (2 comparisons)',
    {tree:{v:20,l:{v:10,l:{v:5}},r:{v:30,l:{v:25}}},path:[20,30],cur:30,
     tinfo:[['Type','BST'],['Search','25'],['At',30],['Comparisons',2]],tinfoHl:2,
     formula:'25 < 30 → go left',
     stats:[['Steps',2],['At',30],['Found','no yet']],
     log:'25 < 30 →',lcls:'hl'});
  chips.push('found');
  snap('25 = 25 — FOUND after exactly 2 comparisons instead of scanning all 5 nodes',
    {tree:{v:20,l:{v:10,l:{v:5}},r:{v:30,l:{v:25,cls:'ok'}}},path:[20,30,25],cur:25,hit:true,
     tinfo:[['Type','BST'],['Search','25'],['Result','found'],['Comparisons',2]],tinfoHl:3,infoOk:3,
     formula:'3rd node checked is the match → done',
     stats:[['Steps',3],['At',25],['Found','yes']],
     log:'found 25',lcls:'ok',sfx:'good'});
  chips.push('in-order');
  snap('in-order of a BST always prints the keys in ascending order: 5 → 10 → 20 → 25 → 30',
    {tree:{v:20,l:{v:10,l:{v:5,cls:'ok'}},r:{v:30,l:{v:25,cls:'ok'}}},path:[],cur:null,
     tinfo:[['Type','BST'],['in-order','5 10 20 25 30'],['Nodes',5],['Sorted','✓']],tinfoHl:1,
     formula:'left → root → right   =   sorted output',
     stats:[['Nodes',5],['Height',3],['in-order','5 10 20 25 30']],
     log:'sorted: 5 10 20 25 30',lcls:'ok'});
  chips.push('done');
  snap('✓ every comparison eliminates a whole subtree — that is where the speed comes from',
    {tree:{v:20,l:{v:10,l:{v:5}},r:{v:30,l:{v:25}}},
     tinfo:[['Type','BST'],['Nodes',5],['Height',3],['Balance','slightly left']],tinfoHl:3,
     path:[],cur:[],
     formula:'balanced → O(log n) · degenerate (sorted inserts) → O(n) · self-balancing fixes this',
     stats:[['Nodes',5],['Height',3],['Search','O(h)']],
     done:true,cls:'ok',log:'BST done',lcls:'ok',
     res:'✓ BST · in-order prints 5 10 20 25 30 · search 25 = 3 comparisons (vs 5 linear) · balanced O(log n), worst O(n)',
     sfx:'done'});
  return steps;
}
/* ===================== 16: AVL TREE ===================== */
function avlBuild(){
  const steps=[],chips=['ins 30'],snap=mkSnap(steps,chips);
  const AI=[['Type','AVL'],['|bf|','≤ 1'],['Height','h'],['Rotations','n']];
  snap('AVL tree: every node keeps a balance factor bf = h(left) − h(right), and |bf| must stay ≤ 1',
    {tree:{v:30,bf:0},showBF:true,tinfo:[['Type','AVL'],['Root',30],['Height',1],['bf',0]],tinfoHl:3,
     path:[],cur:null,
     formula:'bf = h(left) − h(right)   ·   h(null) = 0   ·   |bf| ≤ 1 everywhere',
     stats:[['Nodes',1],['Height',1],['Rotations',0]],
     log:'insert 30',lcls:'ok'});
  chips.push('ins 20');
  snap('insert 20 — bf(30) becomes 1, still inside the ±1 window',
    {tree:{v:30,bf:1,l:{v:20,bf:0}},showBF:true,
     tinfo:[['Type','AVL'],['Root',30],['Height',2],['bf(30)',1]],tinfoHl:3,
     path:[30,20],cur:20,
     formula:'insert 20 left of 30 → h(left)=1, h(right)=0 → bf(30) = 1 ✓',
     stats:[['Nodes',2],['Height',2],['bf(30)',1]],
     log:'insert 20',lcls:'ok'});
  chips.push('ins 10');
  snap('insert 10 — bf(30) = 2: AVL VIOLATION (LL case, left-heavy and deeper on the left)',
    {tree:{v:30,bf:2,cls:'bad',l:{v:20,bf:1,l:{v:10,bf:0}}},showBF:true,
     tinfo:[['Type','AVL'],['Violation','LL case'],['bf(30)',2],['Fix','right rotate']],tinfoHl:3,
     path:[30,20,10],cur:10,
     formula:'30 → 20 → 10 in a line → bf(30) = 2 ✗ → one right rotation',
     stats:[['Nodes',3],['Height',3],['bf(30)',2]],
     log:'violation: bf = 2',lcls:'bad',cls:'err',sfx:'bad'});
  chips.push('rotate');
  snap('right rotation at 30 lifts 20 into the root — all balance factors reset to 0',
    {tree:{v:20,bf:0,l:{v:10,bf:0},r:{v:30,bf:0}},showBF:true,cls:'ok',
     tinfo:[['Type','AVL'],['Rotation','right @30'],['Height',2],['bf','all 0']],tinfoHl:2,
     path:[20],cur:20,
     formula:'20 takes 30’s place · 30 becomes 20’s right child → |bf| ≤ 1 restored',
     stats:[['Nodes',3],['Height',2],['Rotations',1]],
     log:'right rotate @30',lcls:'good',sfx:'good'});
  chips.push('ins 25');
  snap('insert 25 — bf(30) = 1, bf(20) = −1: both legal, no rotation needed',
    {tree:{v:20,bf:-1,l:{v:10,bf:0},r:{v:30,bf:1,l:{v:25,bf:0}}},showBF:true,
     tinfo:[['Type','AVL'],['Root',20],['Height',3],['bf(30)',1]],tinfoHl:3,
     path:[20,30,25],cur:25,
     formula:'25 < 30 → left · bf(30)=1, bf(20)=−1 ✓',
     stats:[['Nodes',4],['Height',3],['Rotations',1]],
     log:'insert 25',lcls:'ok'});
  chips.push('ins 40');
  snap('insert 40 — the right subtree fills out and every factor returns toward zero',
    {tree:{v:20,bf:-1,l:{v:10,bf:0},r:{v:30,bf:0,l:{v:25,bf:0},r:{v:40,bf:0}}},showBF:true,
     tinfo:[['Type','AVL'],['Root',20],['Height',3],['bf','all ≤ 1']],tinfoHl:3,
     path:[20,30,40],cur:40,
     formula:'bf(40)=0 · bf(30)=0 · bf(20)=−1 ✓   all |bf| ≤ 1',
     stats:[['Nodes',5],['Height',3],['Rotations',1]],
     log:'insert 40',lcls:'ok'});
  chips.push('done');
  snap('✓ one rotation fixed the imbalance — AVL trees guarantee O(log n) for every operation',
    {tree:{v:20,bf:-1,l:{v:10,bf:0},r:{v:30,bf:0,l:{v:25,bf:0},r:{v:40,bf:0}}},showBF:true,cls:'ok',
     tinfo:[['Type','AVL'],['Nodes',5],['Height',3],['|bf|','≤ 1 ✓']],tinfoHl:3,
     path:[],cur:null,
     formula:'rotate on violation · |bf| ≤ 1 everywhere → height ≈ 1.44 log₂ n',
     stats:[['Nodes',5],['Height',3],['Search','O(log n)']],
     done:true,log:'AVL done',lcls:'ok',
     res:'✓ AVL tree · LL case fixed by one right rotation at 30 · |bf| ≤ 1 at every node · height 3, 5 nodes · search O(log n) guaranteed',
     sfx:'done'});
  return steps;
}

/* ===================== 17: RED-BLACK TREE ===================== */
function rbBuild(){
  const steps=[],chips=['ins 10'],snap=mkSnap(steps,chips);
  const B='black',R='red';
  snap('red-black tree: colour every node red or black so no red touches red and every path holds the same black count',
    {tree:{v:10,color:B},cls:'ok',
     tinfo:[['Root','black'],['Rule','root = black'],['Red-red','0'],['Black-height',1]],tinfoHl:0,
     path:[],cur:null,
     formula:'rule 1 root black · rule 2 no red-red · rule 3 equal blacks per path · rule 4 red parent ⇒ black children',
     stats:[['Nodes',1],['Heights','bh 1'],['Violations',0]],
     log:'insert 10 (black)',lcls:'ok'});
  chips.push('ins 20');
  snap('insert 20 as RED — new nodes start red so black-height never changes',
    {tree:{v:10,color:B,r:{v:20,color:R}},
     tinfo:[['Root','black'],['New','20 red'],['Red-red','0'],['Black-height',1]],tinfoHl:3,
     path:[10],cur:20,
     formula:'20 < 10? no → right · parent 10 is black → no violation yet',
     stats:[['Nodes',2],['Heights','bh 1'],['Violations',0]],
     log:'insert 20 (red)',lcls:'ok'});
  chips.push('ins 30');
  snap('insert 30 as RED — its parent 20 is also RED: red-red violation',
    {tree:{v:10,color:B,r:{v:20,color:R,cls:'bad',r:{v:30,color:R,cls:'bad'}}},
     tinfo:[['Violation','red-red'],['Nodes','20, 30'],['Uncle','none'],['Fix','rotate + recolour']],tinfoHl:0,
     path:[10,20,30],cur:30,
     formula:'parent 20 is red ✗ · uncle of 30 is NULL (black) → rotation case',
     stats:[['Nodes',3],['Heights','bh 1'],['Violations',1]],
     log:'red-red violation',lcls:'bad',cls:'err',sfx:'bad'});
  chips.push('fix');
  snap('left rotation at 10 with a colour swap: 20 becomes the black root, 10 and 30 go red',
    {tree:{v:20,color:B,l:{v:10,color:R},r:{v:30,color:R}},cls:'ok',
     tinfo:[['Root','20 black'],['Left','10 red'],['Right','30 red'],['Red-red','0 ✓']],tinfoHl:3,
     path:[20],cur:20,
     formula:'left rotate @10 + swap 10↔20 colours → rules restored',
     stats:[['Nodes',3],['Heights','bh 1'],['Violations',0]],
     log:'rotate @10, recolour',lcls:'good',sfx:'good'});
  chips.push('ins 5');
  snap('insert 5 (red) under 10 (red) — red-red again, but now the UNCLE 30 is red',
    {tree:{v:20,color:B,l:{v:10,color:R,cls:'bad',l:{v:5,color:R,cls:'bad'}},r:{v:30,color:R}},
     tinfo:[['Violation','red-red'],['Nodes','10, 5'],['Uncle','30 red'],['Fix','recolour']],tinfoHl:0,
     path:[20,10,5],cur:5,
     formula:'uncle 30 is red → flip colours instead of rotating',
     stats:[['Nodes',4],['Heights','bh 1'],['Violations',1]],
     log:'red-red, uncle red',lcls:'bad',cls:'err',sfx:'bad'});
  chips.push('recolour');
  snap('recolour: parent 10 and uncle 30 go black, grandparent 20 would go red — root stays black',
    {tree:{v:20,color:B,l:{v:10,color:B,l:{v:5,color:R}},r:{v:30,color:B}},cls:'ok',
     tinfo:[['Root','black ✓'],['10','black'],['30','black'],['Nodes',4]],tinfoHl:3,
     path:[20,10,5],cur:5,
     formula:'10 → black · 30 → black · 20 → red then re-blackened (root rule)',
     stats:[['Nodes',4],['Heights','bh 2'],['Violations',0]],
     log:'recolour fix',lcls:'good',sfx:'good'});
  chips.push('verify');
  snap('✓ all three properties hold: root black · no red-red · black-height 2 on every path',
    {tree:{v:20,color:B,l:{v:10,color:B,l:{v:5,color:R}},r:{v:30,color:B}},cls:'ok',
     tinfo:[['Root','black ✓'],['Red-red','none ✓'],['Black-height','2 ✓'],['Nodes',4]],tinfoHl:3,
     path:[],cur:null,
     formula:'20→10→5 = 2 blacks · 20→10 = 2 · 20→30 = 2  ✓ balanced',
     stats:[['Nodes',4],['Heights','bh 2'],['Violations',0]],
     log:'all rules verified',lcls:'ok'});
  chips.push('done');
  snap('✓ two colour fixes and a rotation keep every path within a factor of two — O(log n)',
    {tree:{v:20,color:B,l:{v:10,color:B,l:{v:5,color:R}},r:{v:30,color:B}},cls:'ok',
     tinfo:[['Fixes','2'],['Rotations',1],['Black-height',2],['Search','O(log n)']],tinfoHl:3,
     path:[],cur:null,
     formula:'fewer rotations than AVL → faster inserts, slightly looser balance',
     stats:[['Nodes',4],['Heights','bh 2'],['Fixes',2]],
     done:true,log:'red-black done',lcls:'ok',
     res:'✓ red-black tree · 2 colour fixes (rotate @10, recolour with red uncle) · no red-red · black-height 2 · O(log n)',
     sfx:'done'});
  return steps;
}
/* ===================== 18: B-TREE (order 3) ===================== */
function btreeBuild(){
  const steps=[],chips=['order 3'],snap=mkSnap(steps,chips);
  function N(keys,cls,children){return {keys:keys,cls:cls||'',children:children||[]};}
  const BTI=[['Order',3],['Max keys',2],['Children',3],['Disks','-']];
  snap('B-tree of order 3: each node holds at most 2 keys and up to 3 children — built for slow disks',
    {btree:null,tinfo:BTI.slice(0),tinfoHl:1,
     formula:'order m = 3 → max 2 keys · min ⌈3/2⌉−1 = 1 key · all leaves at the same depth',
     stats:[['Keys',0],['Nodes',0],['Max',2]],
     log:'empty B-tree',lcls:'hl'});
  chips.push('ins 10');
  snap('insert 10 — a single key in the root',
    {btree:N([10],'newn'),
     tinfo:[['Root','10'],['Keys',1],['Max',2],['Full','no']],tinfoHl:3,
     formula:'root ← [10]',
     stats:[['Keys',1],['Nodes',1],['Max',2]],
     log:'insert 10',lcls:'ok'});
  chips.push('ins 20');
  snap('insert 20 — the root now holds [10, 20] and is FULL',
    {btree:N([10,20],'hl'),
     tinfo:[['Root','10 20'],['Keys',2],['Max',2],['Full','YES ✓']],tinfoHl:3,
     formula:'10 < 20 → [10, 20]   ·   capacity reached: next insert must split',
     stats:[['Keys',2],['Nodes',1],['Max',2]],
     log:'root full [10,20]',lcls:'hl'});
  chips.push('ins 30');
  snap('insert 30 overflows: three keys in an order-3 node — split it',
    {btree:N([10,20,30],'split'),
     tinfo:[['Root','10 20 30'],['Keys',3],['Max',2],['Action','SPLIT ✗']],tinfoHl:3,
     formula:'[10, 20, 30] exceeds 2 keys → promote the middle key 20',
     stats:[['Keys',3],['Nodes',1],['Max',2]],
     log:'overflow: [10,20,30]',lcls:'bad',cls:'err',sfx:'bad'});
  chips.push('split');
  snap('split: 20 rises to a new root, 10 and 30 become its children — all leaves stay level',
    {btree:N([20],'promo',[N([10]),N([30])]),
     tinfo:[['Root','20'],['Left','10'],['Right','30'],['Height',2]],tinfoHl:0,
     formula:'promote 20 → root · children [10] and [30] · height 1 → 2',
     stats:[['Keys',3],['Nodes',3],['Height',2]],
     log:'split root, promote 20',lcls:'good',sfx:'good'});
  chips.push('ins 40');
  snap('insert 40 into the right leaf — fits, no structural change',
    {btree:N([20],'',[N([10]),N([30,40],'newn')]),
     tinfo:[['Root','20'],['Right leaf','30 40'],['Keys',4],['Full','no']],tinfoHl:3,
     formula:'40 > 20 → right child → [30, 40]',
     stats:[['Keys',4],['Nodes',3],['Height',2]],
     log:'insert 40',lcls:'ok'});
  chips.push('ins 50');
  snap('insert 50 overflows the right leaf: [30, 40, 50] — split THIS time',
    {btree:N([20],'',[N([10]),N([30,40,50],'split')]),
     tinfo:[['Root','20'],['Leaf','30 40 50'],['Keys',5],['Action','SPLIT ✗']],tinfoHl:3,
     formula:'leaf overflow → promote middle key 40 up to the root',
     stats:[['Keys',5],['Nodes',3],['Max',2]],
     log:'leaf overflow',lcls:'bad',cls:'err',sfx:'bad'});
  chips.push('split leaf');
  snap('promote 40: root becomes [20, 40] with three children — perfectly ordered',
    {btree:N([20,40],'promo',[N([10]),N([30]),N([50])]),
     tinfo:[['Root','20 40'],['Children','3'],['Keys',5],['Full','no ✓']],tinfoHl:3,
     formula:'[10] | [30 40 50] → [10] · [30] · [50], 40 joins the root',
     stats:[['Keys',5],['Nodes',5],['Height',2]],
     log:'promote 40, split leaf',lcls:'good',sfx:'good'});
  chips.push('done');
  snap('✓ order-3 B-tree: two splits kept every node within capacity and every leaf at depth 2',
    {btree:N([20,40],'hl',[N([10]),N([30]),N([50])]),
     tinfo:[['Root','20 40'],['Keys',5],['Height',2],['Splits',2]],tinfoHl:0,
     formula:'insert / search O(log n) · nodes are disk blocks · sibling pointers make range scans cheap',
     stats:[['Keys',5],['Nodes',5],['Splits',2]],
     done:true,log:'B-tree done',lcls:'ok',
     res:'✓ B-tree order 3 · [20, 40] root with leaves [10] [30] [50] · splits at every overflow · O(log n), disk-friendly',
     sfx:'done'});
  return steps;
}

/* ===================== 19: BINARY HEAP ===================== */
function heapBuild(){
  const steps=[],chips=['new heap'],snap=mkSnap(steps,chips);
  function heapTree(a,cls){
    function build(i){
      if(i>=a.length||a[i]===null)return null;
      const n={v:a[i]};
      if(cls&&cls[i])n.cls=cls[i];
      n.l=build(2*i+1);n.r=build(2*i+2);
      return n;
    }
    return build(0);
  }
  function S(arr,cls,tcl){
    const tags={};
    if(arr.length)tags[0]='min';
    return {cells:mkCells(arr,tags,cls||{}),tree:heapTree(arr,tcl||cls),
      dir:'array view: index 0 = min (parent ≤ children)'};
  }
  snap('empty min-heap: an array that is also a complete tree — parent ≤ children',
    Object.assign(S([],{},{}),
     {tinfo:[['Type','min-heap'],['Size',0],['Rule','parent ≤ kids'],['Shape','complete']],tinfoHl:2,
      formula:'parent(i) at ⌊(i−1)/2⌋ · children at 2i+1, 2i+2',
      stats:[['Size',0],['Min','—'],['Height',0]]}));
  chips.push('ins 5');
  snap('insert 5 — alone at the root, heap property trivially holds',
    Object.assign(S([5],{0:'ok'}),
     {tinfo:[['Heap','[5]'],['Min',5],['Size',1],['Rule','✓']],tinfoHl:3,
      formula:'append 5 → done (nothing to compare)',
      stats:[['Size',1],['Min',5],['Height',1]],
      log:'insert 5',lcls:'ok'}));
  chips.push('ins 3');
  snap('append 3 at the next free slot — but 3 < its parent 5',
    Object.assign(S([5,3],{0:'hl',1:'hl'},{1:'bad'}),
     {tinfo:[['Heap','[5, 3]'],['Min',5],['Fix','sift up'],['Size',2]],tinfoHl:3,
      formula:'parent(1) = 5 > 3 ✗ → swap',
      stats:[['Size',2],['Min',5],['Fix','sifting']],
      log:'append 3, parent 5 > 3',lcls:'hl'}));
  chips.push('sift 3');
  snap('sift up: 3 swaps with 5 and becomes the new minimum',
    Object.assign(S([3,5],{0:'ok',1:'ok'}),
     {tinfo:[['Heap','[3, 5]'],['Min',3],['Size',2],['Rule','✓']],tinfoHl:3,
      formula:'3 ↔ 5 → [3, 5]  ✓ parent ≤ children',
      stats:[['Size',2],['Min',3],['Height',1]],
      log:'sift up 3',lcls:'good',sfx:'good'}));
  chips.push('ins 8');
  snap('insert 8: 8 ≥ parent 5, so it settles immediately',
    Object.assign(S([3,5,8],{0:'ok',1:'ok',2:'ok'}),
     {tinfo:[['Heap','[3, 5, 8]'],['Min',3],['Size',3],['Rule','✓']],tinfoHl:3,
      formula:'parent(2) = 5 ≤ 8 → no swap',
      stats:[['Size',3],['Min',3],['Height',2]],
      log:'insert 8',lcls:'ok'}));
  chips.push('ins 1');
  snap('append 1: 1 < parent 5 → swap with it',
    Object.assign(S([3,1,8,5],{0:'hl',1:'move',2:'ok',3:'move'},{1:'ok'}),
     {tinfo:[['Heap','[3, 1, 8, 5]'],['Min',1],['Fix','sift up'],['Size',4]],tinfoHl:3,
      formula:'parent(1) = 5 > 1 → swap → [3, 1, 8, 5]',
      stats:[['Size',4],['Min',1],['Fix','sifting']],
      log:'swap 1 ↔ 5',lcls:'hl'}));
  chips.push('sift 1');
  snap('1 climbs again past 3 — root is now the true minimum',
    Object.assign(S([1,3,8,5],{0:'ok',1:'ok',2:'ok',3:'ok'}),
     {tinfo:[['Heap','[1, 3, 8, 5]'],['Min',1],['Size',4],['Rule','✓']],tinfoHl:3,
      formula:'1 ↔ 3 → [1, 3, 8, 5]  ✓ complete + ordered',
      stats:[['Size',4],['Min',1],['Height',2]],
      log:'sift up 1',lcls:'good',sfx:'good'}));
  chips.push('ins 9');
  snap('insert 9 at the end: 9 ≥ parent 3, stays put',
    Object.assign(S([1,3,8,5,9],{0:'ok',1:'ok',2:'ok',3:'ok',4:'ok'}),
     {tinfo:[['Heap','[1, 3, 8, 5, 9]'],['Min',1],['Size',5],['Rule','✓']],tinfoHl:3,
      formula:'parent(4) = 3 ≤ 9 → no swap',
      stats:[['Size',5],['Min',1],['Height',3]],
      log:'insert 9',lcls:'ok'}));
  chips.push('deq 1');
  snap('dequeue min: 1 leaves, the LAST element 9 jumps into the root — order broken on purpose',
    Object.assign(S([9,3,8,5],{0:'move',1:'ok',2:'ok',3:'ok'},{0:'bad'}),
     {tinfo:[['Out','1'],['New root','9'],['Size',4],['Fix','sift down']],tinfoHl:3,
      formula:'a[0] ← last(9) → [9, 3, 8, 5] · now sift 9 down',
      stats:[['Size',4],['Min',3],['Out',1]],
      log:'dequeue 1, move 9 up',lcls:'hl'}));
  chips.push('sift 9');
  snap('9 is bigger than child 3 → swap down one level',
    Object.assign(S([3,9,8,5],{0:'ok',1:'move',2:'ok',3:'ok'}),
     {tinfo:[['Heap','[3, 9, 8, 5]'],['Min',3],['Fix','sifting'],['Size',4]],tinfoHl:3,
      formula:'9 > 3 → swap → [3, 9, 8, 5]',
      stats:[['Size',4],['Min',3],['Swaps',1]],
      log:'swap 9 ↔ 3',lcls:'hl'}));
  chips.push('sift 9 again');
  snap('9 > child 5 → swap again, and 9 finds its leaf position',
    Object.assign(S([3,5,8,9],{0:'ok',1:'ok',2:'ok',3:'ok'}),
     {tinfo:[['Heap','[3, 5, 8, 9]'],['Min',3],['Rule','✓'],['Size',4]],tinfoHl:3,
      formula:'9 > 5 → swap → [3, 5, 8, 9]  ✓ heap restored in 2 swaps',
      stats:[['Size',4],['Min',3],['Height',2]],
      log:'sift down 9',lcls:'good',sfx:'good'}));
  chips.push('done');
  snap('✓ every operation follows one root-to-leaf path — log₂ n comparisons, never more',
    Object.assign(S([3,5,8,9],{0:'ok',1:'ok',2:'ok',3:'ok'}),
     {tinfo:[['Heap','[3, 5, 8, 9]'],['Min',3],['Size',4],['Ops','O(log n)']],tinfoHl:3,
      formula:'enqueue O(log n) · dequeue O(log n) · peek O(1) · array-backed, zero pointers',
      stats:[['Size',4],['Min',3],['Peek','O(1)']],
      done:true,log:'heap done',lcls:'ok',
      res:'✓ min-heap · [1, 3, 8, 5, 9] → dequeue 1 → [3, 5, 8, 9] in 2 sift-down swaps · enqueue / dequeue O(log n), peek O(1)',
      sfx:'done'}));
  return steps;
}

/* ===================== 20: TRIE (PREFIX TREE) ===================== */
function trieBuild(){
  const steps=[],chips=['ins cat'],snap=mkSnap(steps,chips);
  function T(id,ch,term){return {id:id,ch:ch,root:id==='r',term:!!term,kids:{}};}
  function mk(mode){
    const r=T('r','');
    if(mode>=1){
      const c=T('c','');r.kids.c=c;
      if(mode>=2){
        const ca=T('ca','');c.kids.a=ca;
        if(mode>=3)ca.kids.t=T('cat','t',true);
        if(mode>=4)ca.kids.r=T('car','r',true);
      }
    }
    if(mode>=5){
      const d=T('d','d');r.kids.d=d;d.kids.o=T('do','o',true);
    }
    return r;
  }
  const TD=[['Type','trie'],['Words',0],['Nodes',1],['Lookup','O(L)']];
  snap('a trie stores whole words as PATHS: one node per letter, no node ever compares keys',
    {root:null,tinfo:TD.slice(0),tinfoHl:3,
     formula:'lookup cost = length of the query word, never the size of the dictionary',
     stats:[['Words',0],['Nodes',0],['Depth',0]],
     log:'empty trie',lcls:'hl'});
  chips.push('ins cat');
  snap('start from the root (∅) — every walk begins here',
    {root:mk(0),path:['r'],tinfo:TD.slice(0),
     formula:'root → ...',
     stats:[['Words',0],['Nodes',1],['Depth',0]],
     log:'root created',lcls:'ok'});
  snap('add edge c → the branch for words starting with c',
    {root:mk(1),path:['r','c'],tinfo:TD.slice(0),
     formula:'root --c--> c',
     stats:[['Words',0],['Nodes',2],['Depth',1]],
     log:'add c',lcls:'ok'});
  snap('add edge a → ca',
    {root:mk(2),path:['r','c','ca'],tinfo:TD.slice(0),
     formula:'root --c--> c --a--> ca',
     stats:[['Words',0],['Nodes',3],['Depth',2]],
     log:'add a',lcls:'ok'});
  snap('add edge t → cat is now a COMPLETE word (green star marks terminal)',
    {root:mk(3),path:['r','c','ca','cat'],tinfo:[['Type','trie'],['Words',1],['Nodes',4],['Lookup','O(3)']],tinfoHl:3,
     formula:'root --c--> c --a--> ca --t--> cat ★   → "cat" stored',
     stats:[['Words',1],['Nodes',4],['Depth',3]],
     log:'cat ★ inserted',lcls:'good',sfx:'good'});
  chips.push('ins car');
  snap('add "car": branch at ca with r → car ★ — cat and car SHARE c and a',
    {root:mk(4),path:['r','c','ca','car'],tinfo:[['Type','trie'],['Words',2],['Nodes',5],['Shared','ca']],tinfoHl:3,
     formula:'ca --r--> car ★   ·   prefix "ca" reused by both words',
     stats:[['Words',2],['Nodes',5],['Depth',3]],
     log:'car ★ inserted',lcls:'good',sfx:'good'});
  chips.push('ins do');
  snap('add "do": a second top-level branch from the root',
    {root:mk(5),path:['r','d','do'],tinfo:[['Type','trie'],['Words',3],['Nodes',7],['Branches','c, d']],tinfoHl:3,
     formula:'root --d--> d --o--> do ★   ·   3 words, 7 nodes total',
     stats:[['Words',3],['Nodes',7],['Depth',3]],
     log:'do ★ inserted',lcls:'good'});
  chips.push('search car');
  snap('search "car": walk c → a — both edges exist, still matching',
    (function(){const r=mk(5);r.kids.c.cls='hl';r.kids.c.kids.a.cls='hl';
      return {root:r,path:['r','c','ca'],tinfo:[['Search','car'],['Matched','ca'],['Remaining','r'],['Result','…']],tinfoHl:1,
       formula:'c ✓ → a ✓ → next letter: r',
       stats:[['Matched','ca'],['Steps',2],['Found','no yet']],
       log:'match c, a',lcls:'hl'};})());
  snap('edge r exists → reach car, which is terminal: FOUND',
    (function(){const r=mk(5);r.kids.c.cls='hl';r.kids.c.kids.a.cls='hl';r.kids.c.kids.a.kids.r.cls='hl';
      return {root:r,path:['r','c','ca','car'],tinfo:[['Search','car'],['Matched','car'],['Terminal','★'],['Result','FOUND']],tinfoHl:3,
       formula:'c ✓ → a ✓ → r ✓ and car is a word node → match in 3 steps',
       stats:[['Matched','car'],['Steps',3],['Found','yes']],
       log:'found car ★',lcls:'good',sfx:'good'};})());
  chips.push('search cab');
  snap('search "cab": c → a match, then look for edge b at ca…',
    (function(){const r=mk(5);r.kids.c.cls='hl';r.kids.c.kids.a.cls='hl';
      return {root:r,path:['r','c','ca'],tinfo:[['Search','cab'],['Matched','ca'],['Missing','b'],['Result','…']],tinfoHl:1,
       formula:'c ✓ → a ✓ → next letter: b',
       stats:[['Matched','ca'],['Steps',2],['Found','no yet']],
       log:'match c, a',lcls:'hl'};})());
  snap('ca has no b-child — "cab" is NOT in the dictionary, even though "ca" matched',
    (function(){const r=mk(5);r.kids.c.cls='hl';r.kids.c.kids.a.cls='miss';
      return {root:r,path:['r','c','ca'],tinfo:[['Search','cab'],['Matched','ca'],['Missing','b'],['Result','MISS ✗']],tinfoHl:3,
       formula:'ca.kids.b = undefined → miss after 3 comparisons (of 3 letters)',
       stats:[['Matched','ca'],['Steps',3],['Found','no']],
       log:'cab not found',lcls:'bad',sfx:'bad'};})());
  chips.push('done');
  snap('✓ 3 words, 7 nodes — prefix sharing is exactly what makes lookups scale',
    {root:mk(5),path:[],tinfo:[['Type','trie'],['Words',3],['Nodes',7],['Lookup','O(L)']],tinfoHl:3,
     formula:'insert O(L) · search O(L) · L = word length · no hashing, no balancing',
     stats:[['Words',3],['Nodes',7],['Max depth',3]],
     done:true,log:'trie done',lcls:'ok',
     res:'✓ trie · cat, car, do in 7 nodes · "car" found in 3 steps · "cab" rejected at the missing b-edge · O(L) regardless of dictionary size',
     sfx:'done'});
  return steps;
}
/* ===================== 21: DIRECTED GRAPH ===================== */
function digraphBuild(){
  const steps=[],chips=['add edge'],snap=mkSnap(steps,chips);
  function rows(edges){
    const out=[
      {n:'A',dir:'d',e:[]},
      {n:'B',dir:'d',e:[]},
      {n:'C',dir:'d',e:[]},
      {n:'D',dir:'d',e:[]}
    ];
    const map={A:out[0],B:out[1],C:out[2],D:out[3]};
    for(let i=0;i<edges.length;i++)map[edges[i][0]].e.push([edges[i][1],null,edges[i][2]||'']);
    return out;
  }
  const E4=[];
  const gi=(e)=>({alist:rows(E4)});
  snap('directed graph: edges have direction — A → B says nothing about B → A',
    Object.assign(gi(),
     {ncls:{},q:[],qLab:'frontier',order:[],
      tinfo:null,
      formula:'V = {A, B, C, D}  ·  E = ∅ so far  ·  arrows are one-way',
      stats:[['V',4],['E',0],['Σ out',0],['Mode','directed']],
      log:'empty digraph',lcls:'hl'}));
  chips.push('A→B');
  E4.push(['A','B','']);
  snap('add A → B',
    Object.assign(gi(),
     {ncls:{},q:[],order:[],
      formula:'A → B   ·   out-degree(A) = 1',
      stats:[['V',4],['E',E4.length],['Σ out',E4.length],['Mode','directed']],
      log:'add A→B',lcls:'ok'}));
  chips.push('A→C');
  E4.push(['A','C','']);
  snap('add A → C — A now forks to two neighbours',
    Object.assign(gi(),
     {ncls:{},q:[],order:[],
      formula:'A → {B, C}   ·   out-degree(A) = 2',
      stats:[['V',4],['E',E4.length],['Σ out',E4.length],['Mode','directed']],
      log:'add A→C',lcls:'ok'}));
  chips.push('B→D');
  E4.push(['B','D','']);
  snap('add B → D',
    Object.assign(gi(),
     {ncls:{},q:[],order:[],
      formula:'B → D   ·   still no way back from D to anyone',
      stats:[['V',4],['E',E4.length],['Σ out',E4.length],['Mode','directed']],
      log:'add B→D',lcls:'ok'}));
  chips.push('C→D');
  E4.push(['C','D','']);
  snap('add C → D — two paths now reach D, but D cannot reply',
    Object.assign(gi(),
     {ncls:{},q:[],order:[],
      formula:'A → B → D  and  A → C → D   ·   D out-degree 0',
      stats:[['V',4],['E',4],['Σ out',4],['Mode','directed']],
      log:'add C→D',lcls:'ok'}));
  chips.push('adjacency');
  snap('adjacency list: every row lists what that node POINTS TO',
    (function(){const r=rows(E4);r.forEach(function(x){x.cls='hl';});
     return {alist:r,ncls:{},q:[],order:[],
      formula:'A → B, C  ·  B → D  ·  C → D  ·  D → none   ·   Σ out-degrees = 4 = |E|',
      stats:[['Rows',4],['Edges',4],['Σ out',4],['|E|',4]],
      log:'Σ out = |E| = 4',lcls:'ok'};})());
  chips.push('bfs');
  snap('BFS from A: the frontier starts with the source alone',
    (function(){return {alist:rows(E4),ncls:{A:'cur'},q:['A'],qLab:'frontier',order:[],
      formula:'queue ← [A]   ·   visit in waves',
      stats:[['Visited',0],['Frontier',1],['Order','-'],['Start','A']],
      log:'start BFS at A',lcls:'hl'};})());
  snap('expand A: mark it visited and queue its neighbours B and C',
    (function(){const r=rows(E4);r[0].e[0][2]='done';r[0].e[1][2]='done';
     return {alist:r,ncls:{A:'vst',B:'qd',C:'qd'},q:['B','C'],qLab:'frontier',order:['A'],
      formula:'A out → B, C   ·   queue ← [B, C]',
      stats:[['Visited',1],['Frontier',2],['Order','A'],['Start','A']],
      log:'visit A',lcls:'ok'};})());
  snap('expand B: visit it and queue D (only unseen neighbour)',
    (function(){const r=rows(E4);r[0].e[0][2]='done';r[0].e[1][2]='done';r[1].e[0][2]='done';
     return {alist:r,ncls:{A:'vst',B:'vst',C:'qd',D:'qd'},q:['C','D'],qLab:'frontier',order:['A','B'],
      formula:'B out → D (new)   ·   queue ← [C, D]',
      stats:[['Visited',2],['Frontier',2],['Order','A B'],['Start','A']],
      log:'visit B',lcls:'ok'};})());
  snap('expand C: visit it; its out-edge C → D points to an ALREADY queued node',
    (function(){const r=rows(E4);r[0].e[0][2]='done';r[0].e[1][2]='done';r[1].e[0][2]='done';r[2].e[0][2]='dim';
     return {alist:r,ncls:{A:'vst',B:'vst',C:'vst',D:'qd'},q:['D'],qLab:'frontier',order:['A','B','C'],
      formula:'C out → D   ·   D already in queue → skip (no duplicate enqueue)',
      stats:[['Visited',3],['Frontier',1],['Order','A B C'],['Start','A']],
      log:'visit C (D queued already)',lcls:'ok'};})());
  snap('expand D: nothing to queue — BFS finished in wave order',
    (function(){const r=rows(E4);r[0].e[0][2]='done';r[0].e[1][2]='done';r[1].e[0][2]='done';r[2].e[0][2]='dim';
     return {alist:r,ncls:{A:'vst',B:'vst',C:'vst',D:'vst'},q:[],qLab:'frontier',order:['A','B','C','D'],
      formula:'D out → none   ·   queue empty → done',
      stats:[['Visited',4],['Frontier',0],['Order','A B C D'],['Start','A']],
      log:'visit D',lcls:'ok'};})());
  chips.push('done');
  snap('✓ BFS explores one whole wave before the next — shortest path by hop count',
    (function(){const r=rows(E4);r.forEach(function(x){x.cls='hl';});
     return {alist:r,ncls:{A:'vst',B:'vst',C:'vst',D:'vst'},q:[],qLab:'frontier',order:['A','B','C','D'],
      formula:'Σ out-degrees = 4 = |E| ✓  ·  BFS queue = FIFO  ·  O(V + E)',
      stats:[['Visited',4],['Order','A B C D'],['Σ out',4],['|E|',4]],
      done:true,log:'directed graph done',lcls:'ok',
      res:'✓ digraph · BFS from A → A, B, C, D · Σ out-degrees 4 = |E| · directions never symmetrized · O(V+E)',
      sfx:'done'};})());
  return steps;
}

/* ===================== 22: UNDIRECTED GRAPH ===================== */
function undirectedBuild(){
  const steps=[],chips=['add edge'],snap=mkSnap(steps,chips);
  const E22=[];
  function rows(){
    const out=[
      {n:'A',dir:'u',e:[]},
      {n:'B',dir:'u',e:[]},
      {n:'C',dir:'u',e:[]},
      {n:'D',dir:'u',e:[]}
    ];
    const map={A:out[0],B:out[1],C:out[2],D:out[3]};
    for(let i=0;i<E22.length;i++){
      map[E22[i][0]].e.push([E22[i][1],null,E22[i][2]||'']);
      map[E22[i][1]].e.push([E22[i][0],null,E22[i][2]||'']);
    }
    return out;
  }
  const deg=function(){
    const r=rows(),d={};
    for(let i=0;i<r.length;i++)d[r[i].n]=r[i].e.length;
    return d;
  };
  snap('undirected graph: every edge runs BOTH ways — a line, not an arrow',
    {alist:rows(),ncls:{},q:[],qLab:'stack',order:[],
     formula:'V = {A, B, C, D}  ·  E = ∅  ·  A—B means A and B are simply adjacent',
     stats:[['V',4],['E',0],['Σ deg',0],['Mode','undirected']],
     log:'empty graph',lcls:'hl'});
  chips.push('A—B');
  E22.push(['A','B','']);
  snap('add A — B: it appears in BOTH adjacency rows',
    {alist:rows(),ncls:{},q:[],order:[],
     formula:'A ↔ B   ·   deg(A) = 1, deg(B) = 1',
     stats:[['V',4],['E',1],['Σ deg',2],['Mode','undirected']],
     log:'add A—B',lcls:'ok'});
  chips.push('A—C');
  E22.push(['A','C','']);
  snap('add A — C — A now has two neighbours',
    {alist:rows(),ncls:{},q:[],order:[],
     formula:'A ↔ {B, C}   ·   deg(A) = 2',
     stats:[['V',4],['E',2],['Σ deg',4],['Mode','undirected']],
     log:'add A—C',lcls:'ok'});
  chips.push('B—C');
  E22.push(['B','C','']);
  snap('add B — C — the first triangle closes (A, B, C)',
    {alist:rows(),ncls:{},q:[],order:[],
     formula:'A—B—C—A   ·   cycle of length 3',
     stats:[['V',4],['E',3],['Σ deg',6],['Mode','undirected']],
     log:'add B—C',lcls:'ok'});
  chips.push('C—D');
  E22.push(['C','D','']);
  snap('add C — D — D hangs off the triangle',
    {alist:rows(),ncls:{},q:[],order:[],
     formula:'C ↔ D   ·   deg(D) = 1',
     stats:[['V',4],['E',4],['Σ deg',8],['Mode','undirected']],
     log:'add C—D',lcls:'ok'});
  chips.push('B—D');
  E22.push(['B','D','']);
  snap('add B — D — the graph is now fully wired',
    {alist:rows(),ncls:{},q:[],order:[],
     formula:'B ↔ D   ·   every node has a neighbour',
     stats:[['V',4],['E',5],['Σ deg',10],['Mode','undirected']],
     log:'add B—D',lcls:'ok'});
  chips.push('degrees');
  snap('count degrees: A 2, B 3, C 3, D 2 — sum them and the handshaking lemma appears',
    (function(){const r=rows();r.forEach(function(x){x.cls='hl';});
     const d=deg();
     return {alist:r,ncls:{},q:[],order:[],
      formula:'deg A='+d.A+' · deg B='+d.B+' · deg C='+d.C+' · deg D='+d.D+'   →   Σ = '+(d.A+d.B+d.C+d.D),
      stats:[['Σ deg',(d.A+d.B+d.C+d.D)],['2E',2*E22.length],['E',E22.length],['Lemma','Σ = 2E']],
      log:'Σ deg = 10',lcls:'ok'};})());
  chips.push('dfs');
  snap('DFS from A with a STACK: push A, take the top, repeat',
    {alist:rows(),ncls:{A:'cur'},q:['A'],qLab:'stack',order:[],
     formula:'stack ← [A]   ·   go DEEP, not wide',
     stats:[['Popped',0],['Stack',1],['Order','-'],['Start','A']],
     log:'start DFS at A',lcls:'hl'});
  snap('pop A: visited, push its neighbours B and C',
    (function(){const r=rows();r[0].e.forEach(function(e){e[2]='done';});
     return {alist:r,ncls:{A:'vst',B:'qd',C:'qd'},q:['C','B'],qLab:'stack',order:['A'],
      formula:'visit A · push B, C → stack [C, B] (B on top)',
      stats:[['Popped',1],['Stack',2],['Order','A'],['Start','A']],
      log:'visit A',lcls:'ok'};})());
  snap('pop B: visited, push its unseen neighbour D (C already queued)',
    (function(){const r=rows();r[0].e.forEach(function(e){e[2]='done';});
     r[1].e.forEach(function(e){e[2]=(e[0]==='D')?'done':'';});
     return {alist:r,ncls:{A:'vst',B:'vst',C:'qd',D:'qd'},q:['C','D'],qLab:'stack',order:['A','B'],
      formula:'visit B · push D → stack [C, D] (D on top)',
      stats:[['Popped',2],['Stack',2],['Order','A B'],['Start','A']],
      log:'visit B',lcls:'ok'};})());
  snap('pop D: visited — deeper first, exactly what DFS means',
    (function(){const r=rows();r[0].e.forEach(function(e){e[2]='done';});
     r[1].e.forEach(function(e){e[2]='done';});
     return {alist:r,ncls:{A:'vst',B:'vst',C:'qd',D:'vst'},q:['C'],qLab:'stack',order:['A','B','D'],
      formula:'visit D · its neighbour C already queued → stack [C]',
      stats:[['Popped',3],['Stack',1],['Order','A B D'],['Start','A']],
      log:'visit D',lcls:'ok'};})());
  snap('pop C: stack empty — DFS finished',
    (function(){const r=rows();r.forEach(function(x){x.cls='hl';});
     return {alist:r,ncls:{A:'vst',B:'vst',C:'vst',D:'vst'},q:[],qLab:'stack',order:['A','B','D','C'],
      formula:'visit C · stack [] → done   ·   A → B → D → C descends then backtracks',
      stats:[['Popped',4],['Stack',0],['Order','A B D C'],['Start','A']],
      log:'visit C',lcls:'ok'};})());
  chips.push('done');
  snap('✓ Σ degrees = 10 = 2 × 5 edges — the handshaking lemma for undirected graphs',
    (function(){const r=rows();r.forEach(function(x){x.cls='hl';});
     const d=deg();
     return {alist:r,ncls:{A:'vst',B:'vst',C:'vst',D:'vst'},q:[],qLab:'stack',order:['A','B','D','C'],
      formula:'Σ deg = '+(d.A+d.B+d.C+d.D)+' = 2E = 2 × 5 ✓   ·   DFS stack, BFS would give A B C D',
      stats:[['Σ deg',(d.A+d.B+d.C+d.D)],['E',5],['Order','A B D C'],['O(V+E)','✓']],
      done:true,log:'undirected graph done',lcls:'ok',
      res:'✓ undirected · degrees A2 B3 C3 D2 → Σ = 10 = 2E → E = 5 ✓ · DFS A, B, D, C (stack) vs BFS A, B, C, D (queue)',
      sfx:'done'};})());
  return steps;
}
/* ===================== 23: DIJKSTRA ===================== */
function dijkstraBuild(){
  const steps=[],chips=['intro'],snap=mkSnap(steps,chips);
  const WE=[
    ['A','B',12],['A','C',5],['A','D',19],
    ['B','A',12],['B','C',4],['B','D',8],
    ['C','A',5],['C','B',4],['C','D',14],
    ['D','A',19],['D','B',8],['D','C',14]
  ];
  function rows(edgeCls){
    const out=[
      {n:'A',dir:'d',e:[]},
      {n:'B',dir:'d',e:[]},
      {n:'C',dir:'d',e:[]},
      {n:'D',dir:'d',e:[]}
    ];
    const map={A:out[0],B:out[1],C:out[2],D:out[3]};
    for(let i=0;i<WE.length;i++){
      const k=WE[i][0]+'-'+WE[i][1];
      map[WE[i][0]].e.push([WE[i][1],WE[i][2],(edgeCls&&edgeCls[k])||'']);
    }
    return out;
  }
  function P(ncls,q,order,extra){
    return Object.assign({ncls:ncls,q:q,qLab:'tentative',order:order,alist:rows(extra&&extra.edges)},extra||{});
  }
  snap('weighted graph, source A: d[A] = 0, every other distance starts at ∞',
    P({},{},[],
     {formula:'d[A]=0 · d[B]=∞ · d[C]=∞ · d[D]=∞   ·   relax: if d[u] + w < d[v] → d[v] = d[u] + w',
      stats:[['Settled',0],['d[B]','∞'],['d[C]','∞'],['d[D]','∞']],
      log:'init distances',lcls:'hl'}));
  chips.push('settle A');
  snap('settle A — the tentative node with the smallest distance (0) is now final',
    P({A:'vst'},['A 0'],[],
     {edges:{'A-B':'done','A-C':'done','A-D':'done'},
      formula:'settled = {A}  ·  A’s out-edges are about to relax',
      stats:[['Settled',1],['d[B]','∞'],['d[C]','∞'],['d[D]','∞']],
      log:'settle A',lcls:'ok'}));
  snap('relax A: d[B] = 12, d[C] = 5, d[D] = 19 — the frontier lights up',
    P({A:'vst',B:'qd',C:'qd',D:'qd'},['B 12','C 5','D 19'],[],
     {edges:{'A-B':'done','A-C':'done','A-D':'done'},
      formula:'0+12=12 · 0+5=5 · 0+19=19   →   tentative: B12 C5 D19',
      stats:[['Settled',1],['d[B]',12],['d[C]',5],['d[D]',19]],
      log:'relax A: C5 B12 D19',lcls:'ok'}));
  chips.push('settle C');
  snap('settle C — 5 is the smallest tentative distance, so C comes off the frontier',
    P({A:'vst',C:'vst',B:'qd',D:'qd'},['B 12','D 19'],['A','C'],
     {edges:{'A-B':'done','A-C':'done','A-D':'done'},
      formula:'min{12, 5, 19} = 5 → C   ·   settled {A, C}',
      stats:[['Settled',2],['d[B]',12],['d[C]',5],['d[D]',19]],
      log:'settle C (5)',lcls:'ok'}));
  snap('relax C: 5 + 4 = 9 beats 12 → d[B] improves; 5 + 14 = 19 ties, no change for D',
    P({A:'vst',C:'vst',B:'qd',D:'qd'},['B 9','D 19'],['A','C'],
     {edges:{'A-B':'done','A-C':'done','A-D':'done','C-B':'done','C-D':'dim'},
      formula:'via C: d[B] = 5+4 = 9 < 12 ✓  ·  d[D] = 5+14 = 19 ≤ 19 ✗',
      stats:[['Settled',2],['d[B]',9],['d[C]',5],['d[D]',19]],
      log:'improve B: 12 → 9',lcls:'good',sfx:'good'}));
  chips.push('settle B');
  snap('settle B — distance 9, reached through C rather than directly',
    P({A:'vst',B:'vst',C:'vst',D:'qd'},['D 19'],['A','C','B'],
     {edges:{'A-B':'dim','A-C':'done','A-D':'done','C-B':'done','C-D':'dim'},
      formula:'min{9, 19} = 9 → B   ·   path A → C → B (5 + 4)',
      stats:[['Settled',3],['d[B]',9],['d[C]',5],['d[D]',19]],
      log:'settle B (9)',lcls:'ok'}));
  snap('relax B: 9 + 8 = 17 beats 19 → d[D] improves to 17',
    P({A:'vst',B:'vst',C:'vst',D:'qd'},['D 17'],['A','C','B'],
     {edges:{'A-B':'dim','A-C':'done','A-D':'dim','C-B':'done','C-D':'dim','B-D':'done'},
      formula:'via B: d[D] = 9+8 = 17 < 19 ✓   ·   frontier = {D:17}',
      stats:[['Settled',3],['d[B]',9],['d[C]',5],['d[D]',17]],
      log:'improve D: 19 → 17',lcls:'good',sfx:'good'}));
  chips.push('settle D');
  snap('settle D with 17 — every node now has its final distance',
    P({A:'vst',B:'vst',C:'vst',D:'vst'},[],['A','C','B','D'],
     {edges:{'A-B':'dim','A-C':'done','A-D':'dim','C-B':'done','C-D':'dim','B-D':'done'},
      formula:'settled {A, C, B, D}  ·  distances final: A0 C5 B9 D17',
      stats:[['Settled',4],['d[B]',9],['d[C]',5],['d[D]',17]],
      log:'settle D (17)',lcls:'ok'}));
  snap('relax D: 17 + anything exceeds the settled nodes — nothing left to improve',
    P({A:'vst',B:'vst',C:'vst',D:'vst'},[],['A','C','B','D'],
     {edges:{'A-B':'dim','A-C':'done','A-D':'dim','C-B':'done','C-D':'dim','B-D':'done'},
      formula:'17+8=25 > 9 · 17+14=31 > 5 · 17+19=36 > 0   →   no improvements',
      stats:[['Settled',4],['d[B]',9],['d[C]',5],['d[D]',17]],
      log:'all distances final',lcls:'ok'}));
  chips.push('done');
  snap('✓ shortest path A → C → B → D = 5 + 4 + 8 = 17, beating the direct A → D = 19',
    P({A:'vst',B:'vst',C:'vst',D:'vst'},[],['A','C','B','D'],
     {edges:{'A-B':'dim','A-C':'done','A-D':'dim','C-B':'done','C-D':'dim','B-D':'done'},
      formula:'greedy choice always safe with non-negative weights · O((V+E) log V) with a heap',
      stats:[['Path','A C B D'],['Cost',17],['Direct A-D',19],['Settled',4]],
      done:true,log:'dijkstra done',lcls:'ok',
      res:'✓ Dijkstra from A · distances A0 C5 B9 D17 · path A → C → B → D = 17 (direct A → D would cost 19)',
      sfx:'done'}));
  return steps;
}

/* ===================== 24: HASH TABLE ===================== */
function hashTableBuild(){
  const steps=[],chips=['new table'],snap=mkSnap(steps,chips);
  function B(buckets,hlIdx){
    const out=[];
    for(let i=0;i<7;i++){
      out.push({i:i,cls:(hlIdx===i?'hl':''),chain:(buckets[i]||[]).map(function(c,k){
        return {v:c.v,cls:c.cls||(k>0?'collide':'ok')};
      })});
    }
    return out;
  }
  function st(buckets,hlIdx,items,col,extra){
    return Object.assign({buckets:B(buckets,hlIdx),
      stats:[['Items',items],['Buckets',7],['Load',(items+'/7')],['Collisions',col]]},extra||{});
  }
  const BK=[];for(let i=0;i<7;i++)BK.push([]);
  snap('hash table with 7 buckets and separate chaining — collisions just grow a list',
    st(BK,null,0,0,
     {formula:'hash(k) = k mod 7   ·   empty buckets are dashed slots',
      log:'empty table',lcls:'hl'}));
  chips.push('ins 10');
  BK[3].push({v:'10'});
  snap('insert 10 → 10 mod 7 = 3 → bucket 3',
    st(BK,3,1,0,
     {formula:'10 mod 7 = 3   →   table[3].add(10)',
      log:'10 → bucket 3',lcls:'ok'}));
  chips.push('ins 22');
  BK[1].push({v:'22'});
  snap('insert 22 → 22 mod 7 = 1 → bucket 1, no trouble',
    st(BK,1,2,0,
     {formula:'22 mod 7 = 1   →   table[1].add(22)',
      log:'22 → bucket 1',lcls:'ok'}));
  chips.push('ins 31');
  BK[3].push({v:'31',cls:'collide'});
  snap('insert 31 → 31 mod 7 = 3 too: COLLISION with 10 — chain them',
    st(BK,3,3,1,
     {formula:'31 mod 7 = 3 = bucket of 10 → collision → push onto the same chain',
      log:'collision at bucket 3: [10 → 31]',lcls:'hl'}));
  chips.push('ins 4');
  BK[4].push({v:'4'});
  snap('insert 4 → 4 mod 7 = 4 → bucket 4',
    st(BK,4,4,1,
     {formula:'4 mod 7 = 4   →   table[4].add(4)',
      log:'4 → bucket 4',lcls:'ok'}));
  chips.push('ins 15');
  BK[1].push({v:'15',cls:'collide'});
  snap('insert 15 → 15 mod 7 = 1: second collision, this time with 22',
    st(BK,1,5,2,
     {formula:'15 mod 7 = 1 = bucket of 22 → collision → chain [22 → 15]',
      log:'collision at bucket 1: [22 → 15]',lcls:'hl'}));
  chips.push('ins 28');
  BK[0].push({v:'28'});
  snap('insert 28 → 28 mod 7 = 0 → bucket 0 — 6 items, 2 collisions',
    st(BK,0,6,2,
     {formula:'28 mod 7 = 0   →   table[0].add(28)   ·   load factor 6/7 ≈ 0.86',
      log:'28 → bucket 0',lcls:'ok'}));
  chips.push('get 15');
  BK[1][1].cls='hl';
  snap('lookup 15: hash straight to bucket 1, walk past 22, hit 15 — two comparisons',
    st(BK,1,6,2,
     {formula:'15 mod 7 = 1 → chain: 22 ≠ 15 → 15 = 15 ✓ found',
      log:'get(15) found in 2 steps',lcls:'good',sfx:'good'}));
  BK[1][1].cls='collide';
  chips.push('done');
  snap('✓ average lookups stay near constant — chains only grow when hashes collide',
    st(BK,null,6,2,
     {formula:'average O(1) when load stays low · worst O(n) if every key lands in one bucket',
      done:true,log:'hash table done',lcls:'ok',
      res:'✓ hash table (mod 7, chaining) · 6 items, 2 collisions (31, 15) · load 6/7 ≈ 0.86 · average O(1), worst O(n)',
      sfx:'done'}));
  return steps;
}

/* ===================== 25: HASH MAP ===================== */
function hashMapBuild(){
  const steps=[],chips=['new map'],snap=mkSnap(steps,chips);
  const BK=[];for(let i=0;i<5;i++)BK.push([]);
  function B(hlIdx){
    const out=[];
    for(let i=0;i<5;i++){
      out.push({i:i,cls:(hlIdx===i?'hl':''),chain:(BK[i]||[]).map(function(c,k){
        return {v:c.v,cls:c.cls||(k>0?'collide':'ok')};
      })});
    }
    return out;
  }
  function st(hlIdx,items,col,extra){
    return Object.assign({buckets:B(hlIdx),
      stats:[['Pairs',items],['Buckets',5],['Hash','ASCII % 5'],['Collisions',col]]},extra||{});
  }
  const AH=function(ch){return ch.charCodeAt(0)%5;};
  snap('hash map: key → value, bucketed by the key’s FIRST letter code mod 5',
    st(null,0,0,
     {formula:'hash(key) = firstLetter.charCodeAt(0) mod 5   ·   a=97 → 97%5=2',
      log:'empty map',lcls:'hl'}));
  chips.push('set ant');
  BK[2].push({v:'ant'});
  snap('set("ant","leap") → a = 97 → 97 mod 5 = 2 → bucket 2',
    st(2,1,0,
     {formula:"'a' = 97 · 97 mod 5 = 2   →   map[2] = {ant → leap}",
      log:'ant → bucket 2',lcls:'ok'}));
  chips.push('set cat');
  BK[4].push({v:'cat'});
  snap('set("cat","meow") → c = 99 → 99 mod 5 = 4 → bucket 4',
    st(4,2,0,
     {formula:"'c' = 99 · 99 mod 5 = 4   →   map[4] = {cat → meow}",
      log:'cat → bucket 4',lcls:'ok'}));
  chips.push('set dog');
  BK[0].push({v:'dog'});
  snap('set("dog","woof") → d = 100 → 100 mod 5 = 0 → bucket 0',
    st(0,3,0,
     {formula:"'d' = 100 · 100 mod 5 = 0   →   map[0] = {dog → woof}",
      log:'dog → bucket 0',lcls:'ok'}));
  chips.push('get dog');
  snap('get("dog"): hash to bucket 0, compare one key, return the value',
    st(0,3,0,
     {formula:'hash("dog") = 0 → dog = dog ✓ → "woof"   ·   O(1) probe',
      log:'get(dog) → "woof"',lcls:'good',sfx:'good'}));
  chips.push('set emu');
  BK[1].push({v:'emu'});
  snap('set("emu","run") → e = 101 → 101 mod 5 = 1 → bucket 1',
    st(1,4,0,
     {formula:"'e' = 101 · 101 mod 5 = 1   →   map[1] = {emu → run}",
      log:'emu → bucket 1',lcls:'ok'}));
  chips.push('set owl');
  BK[1].push({v:'owl',cls:'collide'});
  snap('set("owl","hoot") → o = 111 → 111 mod 5 = 1: COLLISION with emu — chain them',
    st(1,5,1,
     {formula:"'o' = 111 · 111 mod 5 = 1 = bucket of emu → chain [emu → owl]",
      log:'collision at bucket 1',lcls:'hl'}));
  chips.push('get owl');
  BK[1][1].cls='hl';
  snap('get("owl"): bucket 1 → emu ≠ owl → next in chain → found',
    st(1,5,1,
     {formula:'bucket 1: emu ✗ → owl ✓ → "hoot"   ·   2 comparisons',
      log:'get(owl) → "hoot"',lcls:'good',sfx:'good'}));
  BK[1][1].cls='collide';
  chips.push('done');
  snap('✓ key → bucket in one arithmetic step; values ride along in the chain',
    st(null,5,1,
     {formula:'5 pairs · 1 collision · average O(1) get/set · chaining keeps it correct under collisions',
      done:true,log:'hash map done',lcls:'ok',
      res:'✓ hash map · ant→b2, cat→b4, dog→b0, emu→b1, owl→b1 (collision with emu) · get("dog") → "woof" · O(1) average',
      sfx:'done'}));
  return steps;
}

/* ===================== 26: HASH SET ===================== */
function hashSetBuild(){
  const steps=[],chips=['new set'],snap=mkSnap(steps,chips);
  const BK=[];for(let i=0;i<5;i++)BK.push([]);
  function B(hlIdx){
    const out=[];
    for(let i=0;i<5;i++){
      out.push({i:i,cls:(hlIdx===i?'hl':''),chain:(BK[i]||[]).map(function(c){
        return {v:c.v,cls:c.cls||''};
      })});
    }
    return out;
  }
  function st(hlIdx,items,col,extra){
    return Object.assign({buckets:B(hlIdx),
      stats:[['Members',items],['Buckets',5],['Hash','n % 5'],['Collisions',col]]},extra||{});
  }
  snap('hash set: just KEYS — membership tests that never scan the whole collection',
    st(null,0,0,
     {formula:'hash(x) = x mod 5   ·   add / contains / remove all follow the same path',
      log:'empty set',lcls:'hl'}));
  chips.push('add 12');
  BK[2].push({v:'12'});
  snap('add 12 → 12 mod 5 = 2 → bucket 2',
    st(2,1,0,
     {formula:'12 mod 5 = 2   →   set[2] = {12}',
      log:'12 → bucket 2',lcls:'ok'}));
  chips.push('add 45');
  BK[0].push({v:'45'});
  snap('add 45 → 45 mod 5 = 0 → bucket 0',
    st(0,2,0,
     {formula:'45 mod 5 = 0   →   set[0] = {45}',
      log:'45 → bucket 0',lcls:'ok'}));
  chips.push('add 7');
  BK[2].push({v:'7',cls:'collide'});
  snap('add 7 → 7 mod 5 = 2: collision with 12 — the chain keeps the set UNIQUE-checked',
    st(2,3,1,
     {formula:'7 mod 5 = 2 = bucket of 12 → collision → chain [12 → 7]',
      log:'collision at bucket 2',lcls:'hl'}));
  chips.push('contains 7');
  BK[2][1].cls='hl';
  snap('contains(7): hash to bucket 2 → 12 ≠ 7 → 7 ✓ found',
    st(2,3,1,
     {formula:'bucket 2: 12 ✗ → 7 ✓   ·   already a member, add would be rejected',
      log:'contains(7) = true',lcls:'good',sfx:'good'}));
  BK[2][1].cls='';
  chips.push('remove 12');
  snap('remove(12): unlink 12 from the chain, 7 takes over the bucket',
    st(2,2,0,
     {formula:'bucket 2: 12 removed → chain now [7]',
      log:'removed 12',lcls:'ok'}));
  chips.push('contains 12');
  snap('contains(12) again: bucket 2 holds only 7 → MISS after one comparison',
    st(2,2,0,
     {formula:'bucket 2: 7 ≠ 12 → chain ends → not a member ✗',
      log:'contains(12) = false',lcls:'bad',sfx:'bad'}));
  chips.push('done');
  snap('✓ add, contains and remove all walk just one bucket — that is the whole trick',
    st(null,2,1,
     {formula:'average O(1) for all three ops · duplicates die at the membership check',
      done:true,log:'hash set done',lcls:'ok',
      res:'✓ hash set · 45, 12→7 in bucket 2 (7%5=2) · remove 12 → contains(12) false · add/contains/remove O(1) average',
      sfx:'done'}));
  return steps;
}
/* ===================== navigation ===================== */
function showAlgo(i){
  stopAll();
  const home=E('homeScreen'),algo=E('algoScreen');
  if(!home||!algo)return;
  home.style.display='none';
  algo.style.display='block';
  const ps=document.querySelectorAll('.algo .panel');
  for(let k=0;k<ps.length;k++){
    if(k===i)ps[k].classList.add('on');
    else ps[k].classList.remove('on');
  }
  window.scrollTo(0,0);
}
function goHome(){
  stopAll();
  const home=E('homeScreen'),algo=E('algoScreen');
  if(home)home.style.display='block';
  if(algo)algo.style.display='none';
  window.scrollTo(0,0);
}
const CARDS=document.querySelectorAll('.card[data-a]');
for(let ci=0;ci<CARDS.length;ci++){
  CARDS[ci].addEventListener('click',function(){
    showAlgo(parseInt(this.getAttribute('data-a'),10));
  });
}
const BBTN=E('backBtn');
if(BBTN)BBTN.addEventListener('click',goHome);

/* ===================== wire every panel ===================== */
makeCtrl(0,intBuild,renderPrim);
makeCtrl(1,floatBuild,renderPrim);
makeCtrl(2,charBuild,renderPrim);
makeCtrl(3,boolBuild,renderPrim);
makeCtrl(4,staticArrayBuild,renderCells);
makeCtrl(5,dynamicArrayBuild,renderCells);
makeCtrl(6,singlyBuild,renderList);
makeCtrl(7,doublyBuild,renderList);
makeCtrl(8,circularBuild,renderList);
makeCtrl(9,stackBuild,renderCells);
makeCtrl(10,queueBuild,renderCells);
makeCtrl(11,circularQueueBuild,renderCells);
makeCtrl(12,dequeBuild,renderCells);
makeCtrl(13,pqBuild,renderCells);
makeCtrl(14,traversalsBuild,renderBin);
makeCtrl(15,bstBuild,renderBin);
makeCtrl(16,avlBuild,renderBin);
makeCtrl(17,rbBuild,renderBin);
makeCtrl(18,btreeBuild,renderBTree);
makeCtrl(19,heapBuild,renderBin);
makeCtrl(20,trieBuild,renderTrie);
makeCtrl(21,digraphBuild,renderGraphW);
makeCtrl(22,undirectedBuild,renderGraphW);
makeCtrl(23,dijkstraBuild,renderGraphW);
makeCtrl(24,hashTableBuild,renderBuckets);
makeCtrl(25,hashMapBuild,renderBuckets);
makeCtrl(26,hashSetBuild,renderBuckets);
