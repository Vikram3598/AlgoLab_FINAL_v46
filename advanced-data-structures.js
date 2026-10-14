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
  const colors=['#f1c40f','#ff6b6b','#00d4ff','#48d0b0','#9b59b6','#e84393'];
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

function svgEl(tag,attrs){
  const e=document.createElementNS('http://www.w3.org/2000/svg',tag);
  for(const k in attrs)e.setAttribute(k,attrs[k]);
  return e;
}
function txt(parent,x,y,t,attrs){
  const a=Object.assign({x:x,y:y,fill:'#e0e0e0','font-size':13,'text-anchor':'middle','dominant-baseline':'central','font-family':'Consolas,monospace'},attrs||{});
  const e=svgEl('text',a);e.textContent=t;parent.appendChild(e);return e;
}
function clearSvg(id){const s=E(id);if(s)s.innerHTML='';return s;}

function chipsUI(kind,n,items,cur,opStyle){
  const w=E(kind+n);if(!w)return;
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

/* ===================== 0: AVL ===================== */
const AVLSEQ=[50,30,70,20,40,60,80,25,35,45,90,95,5,3,1,55,58,85,82];
function avlBuild(){
  let root=null,rotC=0;
  const rots=[];
  const steps=[];
  const H=function(n){return n?n.h:0;};
  const upd=function(n){if(n){n.h=1+Math.max(H(n.left),H(n.right));n.bf=H(n.left)-H(n.right);}};
  const cl=function(n){return n?{v:n.v,h:n.h,bf:n.bf,left:cl(n.left),right:cl(n.right)}:null;};
  const cnt=function(n){return n?1+cnt(n.left)+cnt(n.right):0;};
  function snap(msg,o){
    o=o||{};o.msg=msg;o.tree=cl(root);
    if(o.seqI===undefined)o.seqI=AVLSEQ.length;
    o.hl=o.hl||[];
    o.stats=[['Nodes',cnt(root)],['Height',H(root)],['Rotations',rots.length?rots.join(' '):0]];
    steps.push(o);
  }
  function rotR(y){const x=y.left;y.left=x.right;x.right=y;upd(y);upd(x);return x;}
  function rotL(x){const y=x.right;x.right=y.left;y.left=x;upd(x);upd(y);return y;}
  AVLSEQ.forEach(function(v,i){
    snap('Insert '+v+' — start at root',{seqI:i});
    let cur=root;
    const anc=[];
    while(cur){
      anc.push(cur);
      if(v<cur.v){snap(v+' < '+cur.v+' → go left',{seqI:i,hl:[cur.v]});cur=cur.left;}
      else if(v>cur.v){snap(v+' > '+cur.v+' → go right',{seqI:i,hl:[cur.v]});cur=cur.right;}
      else{snap(v+' already in tree — ignored',{seqI:i,cls:'err',sfx:'bad'});return;}
    }
    const nn={v:v,h:1,bf:0,left:null,right:null};
    if(!anc.length)root=nn;
    else{const p=anc[anc.length-1];if(v<p.v)p.left=nn;else p.right=nn;}
    snap('Inserted '+v+' as leaf (h=1)',{seqI:i,hl:[v],cls:'hl',log:'inserted '+v,lcls:'hl'});
    for(let k=anc.length-1;k>=0;k--){
      const a=anc[k];
      upd(a);
      snap('Update '+a.v+': h='+a.h+', bf='+(a.bf>0?'+':'')+a.bf,{seqI:i,hl:[a.v]});
      if(Math.abs(a.bf)===2){
        let child,gc,cn;
        if(a.bf===2){child=a.left;cn=child.bf>=0?'LL':'LR';gc=cn==='LL'?child.left:child.right;}
        else{child=a.right;cn=child.bf<=0?'RR':'RL';gc=cn==='RR'?child.right:child.left;}
        const hls=[a.v];if(child)hls.push(child.v);if(gc)hls.push(gc.v);
        snap('Balance factor '+(a.bf>0?'+':'')+a.bf+' at '+a.v+' — '+cn+' case (child '+child.v+(gc?', grandchild '+gc.v:'')+')',
          {seqI:i,hl:hls,cls:'err',sfx:'bad',log:cn+' rotation at '+a.v,lcls:'bad'});
        let ns;
        if(cn==='LL')ns=rotR(a);
        else if(cn==='RR')ns=rotL(a);
        else if(cn==='LR'){a.left=rotL(a.left);ns=rotR(a);}
        else{a.right=rotR(a.right);ns=rotL(a);}
        const par=k>0?anc[k-1]:null;
        if(!par)root=ns;
        else if(par.left===a)par.left=ns;
        else par.right=ns;
        rotC++;rots.push(cn+'@'+a.v);
        snap(cn+' rotation applied — subtree restored (|bf| ≤ 1)',{seqI:i,hl:[ns.v],good:true,axis:ns.v,cls:'ok',sfx:'good'});
      }
    }
  });
  let ok=true,bad='';
  (function chk(n){
    if(!n||bad)return;
    const exp=1+Math.max(H(n.left),H(n.right));
    if(n.h!==exp){bad='stale height at node '+n.v+' (stored '+n.h+', actual '+exp+')';return;}
    if(Math.abs(n.bf)>1){bad='bf '+n.bf+' at node '+n.v;return;}
    chk(n.left);chk(n.right);
  })(root);
  ok=!bad;
  snap(ok?'AVL valid — every node |bf| ≤ 1, height '+H(root):'INVALID — '+bad,
    {seqI:AVLSEQ.length,cls:ok?'ok':'err',done:true,bad:!ok,
     res:ok?('✓ AVL valid — '+cnt(root)+' nodes, height '+H(root)+', '+rots.length+' rotations ('+rots.join(', ')+')'):('✗ '+bad+' | rots: '+(rots.join(', ')||'none')),
     sfx:ok?'done':'bad'});
  return steps;
}
function renderAVL(st,n){
  const svg=clearSvg('svg'+n);
  chipsUI('seq',n,AVLSEQ,st.seqI);
  statsUI(n,st);
  if(!svg)return;
  const t=st.tree;
  if(!t){txt(svg,460,260,'∅ empty tree',{fill:'#667080','font-size':20});return;}
  const pos={},dep={};let x=0;
  (function ino(nn,d){
    if(!nn)return;
    ino(nn.left,d+1);
    pos[nn.v]=x++;dep[nn.v]=d;
    ino(nn.right,d+1);
  })(t,0);
  const P=function(nn){return{x:52+pos[nn.v]*46,y:32+dep[nn.v]*78};};
  (function edges(nn){
    if(!nn)return;
    if(nn.left){const a=P(nn),b=P(nn.left);svg.appendChild(svgEl('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#2a3142','stroke-width':2}));edges(nn.left);}
    if(nn.right){const a=P(nn),b=P(nn.right);svg.appendChild(svgEl('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#2a3142','stroke-width':2}));edges(nn.right);}
  })(t);
  (function draw(nn){
    if(!nn)return;
    draw(nn.left);
    const p=P(nn);
    const isA=st.axis===nn.v,isG=(st.good||[]).indexOf(nn.v)>=0,isH=(st.hl||[]).indexOf(nn.v)>=0;
    let fill='#1a1d3e',stroke='#34495e',tc='#e0e0e0',sw=1.5;
    if(Math.abs(nn.bf)>=2){fill='rgba(255,107,107,.3)';stroke='#ff6b6b';}
    if(isH){fill='rgba(241,196,15,.25)';stroke='#f1c40f';sw=2.5;}
    if(isG){fill='rgba(72,208,168,.3)';stroke='#48d0b0';sw=2.5;}
    if(isA){fill='rgba(0,212,255,.3)';stroke='#00d4ff';sw=3;}
    svg.appendChild(svgEl('circle',{cx:p.x,cy:p.y,r:20,fill:fill,stroke:stroke,'stroke-width':sw}));
    txt(svg,p.x,p.y,nn.v,{fill:tc,'font-size':14,'font-weight':'bold'});
    const bf=nn.bf,good=Math.abs(bf)<=1;
    svg.appendChild(svgEl('circle',{cx:p.x+15,cy:p.y-15,r:9,fill:good?'#0d2b25':'#3d1111',stroke:good?'#48d0b0':'#ff6b6b','stroke-width':1.5}));
    txt(svg,p.x+15,p.y-15,(bf>0?'+':'')+bf,{fill:good?'#48d0b0':'#ff6b6b','font-size':9,'font-weight':'bold'});
    draw(nn.right);
  })(t);
}

/* ===================== 1: RED-BLACK ===================== */
const RBSEQ=[10,30,20,15,25,5,1,40,35,45];
function rbBuild(){
  let root=null,c1=0,c2=0,c3=0;
  const steps=[];
  const cl=function(n){return n?{v:n.v,red:n.red,left:cl(n.left),right:cl(n.right)}:null;};
  const cnt=function(n){return n?1+cnt(n.left)+cnt(n.right):0;};
  const hgt=function(n){return n?1+Math.max(hgt(n.left),hgt(n.right)):0;};
  function snap(msg,o){
    o=o||{};o.msg=msg;o.tree=cl(root);
    if(o.seqI===undefined)o.seqI=RBSEQ.length;
    o.hl=o.hl||[];o.hl2=o.hl2||[];
    o.stats=[['Nodes',cnt(root)],['Height',hgt(root)],['Cases',c1+'×1 '+c2+'×2 '+c3+'×3']];
    steps.push(o);
  }
  function rotL(x){
    const y=x.right,par=x.p;
    x.right=y.left;if(y.left)y.left.p=x;
    y.left=x;x.p=y;y.p=par;
    if(!par)root=y;else if(par.left===x)par.left=y;else par.right=y;
    return y;
  }
  function rotR(x){
    const y=x.left,par=x.p;
    x.left=y.right;if(y.right)y.right.p=x;
    y.right=x;x.p=y;y.p=par;
    if(!par)root=y;else if(par.left===x)par.left=y;else par.right=y;
    return y;
  }
  function fixup(x,i){
    while(x.p&&x.p.red){
      const g=x.p.p;
      if(!g)break;
      if(x.p===g.left){
        const u=g.right;
        if(u&&u.red){
          c1++;
          snap('Fix-up — parent '+x.p.v+' RED, uncle '+(u?u.v:'nil')+' RED → Case 1: recolor',{seqI:i,hl:[x.v,x.p.v,g.v],hl2:u?[u.v]:[],cls:'hl',log:'case 1 recolor',lcls:'hl'});
          x.p.red=false;if(u)u.red=false;g.red=true;x=g;
          snap('Parent & uncle BLACK, grandparent RED — continue at '+g.v,{seqI:i,hl:[g.v],cls:'hl'});
          continue;
        }
        if(x===x.p.right){
          c2++;
          snap('Fix-up — uncle BLACK, zig-zag (LR): left-rotate parent '+x.p.v,{seqI:i,hl:[x.p.v],hl2:[x.v,g.v],cls:'hl',log:'case 2 straighten',lcls:'hl'});
          x=x.p;rotL(x);
          snap('Straightened — now zig-zig (LL) above grandparent',{seqI:i,hl:[x.p?x.p.v:x.v],hl2:[x.v],cls:'hl'});
        }
        c3++;
        snap('Fix-up — zig-zig: parent '+x.p.v+' BLACK, grandparent '+x.p.p.v+' RED, right-rotate grandparent',{seqI:i,hl:[x.p.p.v],hl2:[x.p.v,x.v],cls:'hl',log:'case 3 rotate',lcls:'hl'});
        x.p.red=false;
        const gg=x.p.p;gg.red=true;rotR(gg);
        snap('Rotated — subtree rebalanced, parent now '+x.p.v,{seqI:i,hl:[x.p.v],axis:x.p.p?x.p.p.v:x.v,cls:'ok',sfx:'good'});
      }else{
        const u=g.left;
        if(u&&u.red){
          c1++;
          snap('Fix-up — parent '+x.p.v+' RED, uncle '+(u?u.v:'nil')+' RED → Case 1: recolor',{seqI:i,hl:[x.v,x.p.v,g.v],hl2:u?[u.v]:[],cls:'hl',log:'case 1 recolor',lcls:'hl'});
          x.p.red=false;if(u)u.red=false;g.red=true;x=g;
          snap('Parent & uncle BLACK, grandparent RED — continue at '+g.v,{seqI:i,hl:[g.v],cls:'hl'});
          continue;
        }
        if(x===x.p.left){
          c2++;
          snap('Fix-up — uncle BLACK, zig-zag (RL): right-rotate parent '+x.p.v,{seqI:i,hl:[x.p.v],hl2:[x.v,g.v],cls:'hl',log:'case 2 straighten',lcls:'hl'});
          x=x.p;rotR(x);
          snap('Straightened — now zig-zig (RR) above grandparent',{seqI:i,hl:[x.p?x.p.v:x.v],hl2:[x.v],cls:'hl'});
        }
        c3++;
        snap('Fix-up — zig-zig: parent '+x.p.v+' BLACK, grandparent '+x.p.p.v+' RED, left-rotate grandparent',{seqI:i,hl:[x.p.p.v],hl2:[x.p.v,x.v],cls:'hl',log:'case 3 rotate',lcls:'hl'});
        x.p.red=false;
        const gg=x.p.p;gg.red=true;rotL(gg);
        snap('Rotated — subtree rebalanced, parent now '+x.p.v,{seqI:i,hl:[x.p.v],axis:x.p.p?x.p.p.v:x.v,cls:'ok',sfx:'good'});
      }
    }
    if(root)root.red=false;
  }
  RBSEQ.forEach(function(v,i){
    snap('Insert '+v+' — start at root',{seqI:i});
    let cur=root,par=null;
    while(cur){
      par=cur;
      if(v<cur.v){snap(v+' < '+cur.v+' → go left',{seqI:i,hl:[cur.v]});cur=cur.left;}
      else if(v>cur.v){snap(v+' > '+cur.v+' → go right',{seqI:i,hl:[cur.v]});cur=cur.right;}
      else{snap(v+' already in tree — ignored',{seqI:i,cls:'err',sfx:'bad'});return;}
    }
    if(!par){
      root={v:v,red:false,p:null,left:null,right:null};
      snap('Inserted '+v+' as root — force BLACK (property: root is black)',{seqI:i,hl:[v],cls:'ok',log:v+' = root',lcls:'ok'});
      return;
    }
    const nn={v:v,red:true,p:par,left:null,right:null};
    if(v<par.v)par.left=nn;else par.right=nn;
    snap('Inserted '+v+' as RED child of '+par.v,{seqI:i,hl:[v],hl2:[par.v],cls:'hl',log:'inserted '+v,lcls:'hl'});
    fixup(nn,i);
    snap('Insert '+v+' complete — tree valid, root '+root.v+' BLACK',{seqI:i,cls:'ok',sfx:'good'});
  });
  let ok=true,bh0=null;
  (function chk(n,isRoot){
    if(!n)return 1;
    if(isRoot&&n.red)ok=false;
    if(n.red&&((n.left&&n.left.red)||(n.right&&n.right.red)))ok=false;
    const l=chk(n.left,false),r=chk(n.right,false);
    if(l!==r)ok=false;
    let lo=n.v,hi=n.v;
    (function bmin(x){if(!x)return;bmin(x.left);if(x.v<lo)lo=x.v;})(n.left);
    (function bmax(x){if(!x)return;if(x.v>hi)hi=x.v;bmax(x.right);})(n.right);
    if(n.left){let m=-Infinity;(function gmax(x){if(!x)return;gmax(x.right);if(x.v>m)m=x.v;})(n.left);if(m>=n.v)ok=false;}
    if(n.right){let m=Infinity;(function gmin(x){if(!x)return;gmin(x.left);if(x.v<m)m=x.v;})(n.right);if(m<=n.v)ok=false;}
    return l+(n.red?0:1);
  })(root,true);
  snap(ok?'Red-black tree valid — black-height uniform, no red-red':'INVALID red-black tree',
    {seqI:RBSEQ.length,cls:ok?'ok':'err',done:true,bad:!ok,
     res:ok?('✓ Red-black valid — '+cnt(root)+' nodes, '+c1+'×case1 '+c2+'×case2 '+c3+'×case3'):'✗ properties violated',
     sfx:ok?'done':'bad'});
  return steps;
}
function renderRB(st,n){
  const svg=clearSvg('svg'+n);
  chipsUI('seq',n,RBSEQ,st.seqI);
  statsUI(n,st);
  if(!svg)return;
  const t=st.tree;
  if(!t){txt(svg,460,250,'∅ empty tree',{fill:'#667080','font-size':20});return;}
  const pos={},dep={};let x=0;
  (function ino(nn,d){
    if(!nn)return;
    ino(nn.left,d+1);
    pos[nn.v]=x++;dep[nn.v]=d;
    ino(nn.right,d+1);
  })(t,0);
  const P=function(nn){return{x:52+pos[nn.v]*46,y:34+dep[nn.v]*82};};
  (function edges(nn){
    if(!nn)return;
    if(nn.left){const a=P(nn),b=P(nn.left);svg.appendChild(svgEl('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#2a3142','stroke-width':2}));edges(nn.left);}
    if(nn.right){const a=P(nn),b=P(nn.right);svg.appendChild(svgEl('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#2a3142','stroke-width':2}));edges(nn.right);}
  })(t);
  (function draw(nn){
    if(!nn)return;
    draw(nn.left);
    const p=P(nn);
    const isA=st.axis===nn.v,isH2=(st.hl2||[]).indexOf(nn.v)>=0,isH=(st.hl||[]).indexOf(nn.v)>=0;
    let fill=nn.red?'#a83232':'#12141f',stroke='#34495e',sw=1.5;
    if(isH2){fill=nn.red?'#c05555':'#1e3a34';stroke='#48d0b0';sw=2.5;}
    if(isH){fill='#5a4a12';stroke='#f1c40f';sw=3;}
    if(isA){fill='#0b4a5a';stroke='#00d4ff';sw=3;}
    svg.appendChild(svgEl('circle',{cx:p.x,cy:p.y,r:20,fill:fill,stroke:stroke,'stroke-width':sw}));
    txt(svg,p.x,p.y,nn.v,{fill:'#ffffff','font-size':14,'font-weight':'bold'});
    txt(svg,p.x,p.y+31,nn.red?'R':'B',{fill:nn.red?'#ff8a8a':'#8892a4','font-size':9});
    draw(nn.right);
  })(t);
}

/* ===================== 2: UNION-FIND ===================== */
const UFOPS=[
  {t:'u',a:0,b:1},{t:'u',a:2,b:3},{t:'u',a:4,b:5},{t:'u',a:6,b:7},{t:'u',a:8,b:9},
  {t:'u',a:0,b:2},{t:'u',a:4,b:6},{t:'u',a:0,b:4},{t:'f',a:7},{t:'f',a:5},{t:'u',a:8,b:4},{t:'f',a:9}
];
const UFLBL=UFOPS.map(function(o){return o.t==='u'?('u('+o.a+','+o.b+')'):('f('+o.a+')');});
function ufBuild(){
  const N=10;
  let parent=[],rank=[],comps=0,opDone=0;
  const steps=[];
  for(let i=0;i<N;i++){parent[i]=i;rank[i]=0;}
  function snap(msg,o){
    o=o||{};o.msg=msg;o.parent=parent.slice();o.rank=rank.slice();
    if(o.opI===undefined)o.opI=UFOPS.length;
    o.hl=o.hl||[];
    let sets=0,dep=0;
    for(let i=0;i<N;i++)if(parent[i]===i)sets++;
    for(let i=0;i<N;i++){let c=0,x=i;while(parent[x]!==x){x=parent[x];c++;}if(c>dep)dep=c;}
    o.stats=[['Ops',opDone+'/'+UFOPS.length],['Sets',sets],['Max depth',dep],['Compressions',comps]];
    steps.push(o);
  }
  function find(x,i,prefix){
    let path=[],cur=x;
    snap(prefix+'find('+x+') — walk parent pointers',{opI:i,hl:[x]});
    while(parent[cur]!==cur){
      path.push(cur);
      snap('  node '+cur+' → parent '+parent[cur],{opI:i,hl:[cur],path:path.slice()});
      cur=parent[cur];
    }
    path.push(cur);
    snap('Root of '+x+' = '+cur+(path.length>2?' (chain length '+path.length+')':' (already direct)'),{opI:i,hl:[cur],path:path.slice(),cls:'ok'});
    const inner=path.slice(0,-1);
    if(path.length>2){
      snap('Compress: '+inner.join(' → ')+' point directly at root '+cur,{opI:i,hl:inner.concat([cur]),path:path.slice(),cls:'hl',log:'compress '+inner.join('→'),lcls:'hl'});
      inner.forEach(function(nd){parent[nd]=cur;});
      comps++;
      snap('Path compressed — '+x+' now depth '+(parent[x]===cur?1:0)+', every node on path links to root',{opI:i,hl:inner.concat([cur]),compNodes:inner.slice(),cls:'ok',sfx:'good'});
    }
    return cur;
  }
  function uni(a,b,i){
    snap('Union('+a+', '+b+') — combine their sets',{opI:i,hl:[a,b]});
    const ra=find(a,i,'  '),rb=find(b,i,'  ');
    if(ra===rb){
      snap(a+' and '+b+' already connected — union is a no-op',{opI:i,hl:[ra],cls:'hl',log:'u('+a+','+b+') no-op',lcls:'hl'});
      opDone++;return;
    }
    let big=ra,sm=rb;
    if(rank[ra]<rank[rb]){big=rb;sm=ra;}
    const same=rank[big]===rank[sm];
    snap('Ranks: rank('+big+')='+rank[big]+' vs rank('+sm+')='+rank[sm]+' → attach '+sm+' under '+big+(same?' (equal ranks → rank++)':' (rank unchanged)'),{opI:i,hl:[big,sm],cls:'hl'});
    parent[sm]=big;
    if(same)rank[big]++;
    snap('Linked '+sm+' → '+big+(same?'; rank('+big+') = '+rank[big]:''),{opI:i,hl:[big,sm],newEdge:[sm,big],cls:'ok',sfx:'good',log:'u('+a+','+b+'): '+sm+'→'+big,lcls:'ok'});
    opDone++;
  }
  UFOPS.forEach(function(op,i){
    if(op.t==='u')uni(op.a,op.b,i);
    else{find(op.a,i,'');opDone++;}
  });
  const roots={};
  for(let i=0;i<N;i++){let x=i;while(parent[x]!==x)x=parent[x];roots[x]=1;}
  const nSets=Object.keys(roots).length;
  let dep=0;
  for(let i=0;i<N;i++){let c=0,x=i;while(parent[x]!==x){x=parent[x];c++;}if(c>dep)dep=c;}
  snap(nSets===1?'All 10 elements connected — single set':'STILL '+nSets+' separate sets',
    {opI:UFOPS.length,cls:nSets===1?'ok':'err',done:true,bad:nSets!==1,
     res:nSets?('✓ single set {0..9} — root '+Object.keys(roots)[0]+', max depth '+dep+', '+comps+' compressions'):'✗ sets remain',
     sfx:nSets===1?'done':'bad'});
  return steps;
}
function renderUF(st,n){
  const svg=clearSvg('svg'+n);
  chipsUI('ops',n,UFLBL,st.opI,true);
  statsUI(n,st);
  if(!svg)return;
  const PX=[110,280,450,620,790];
  const P=function(i){return{x:PX[i%5],y:i<5?110:290};};
  const pathEdges={};
  if(st.path){
    for(let k=0;k+1<st.path.length;k++)pathEdges[st.path[k]+'>'+st.path[k+1]]=1;
    if(st.path.length>=1&&st.parent){
      const last=st.path[st.path.length-1];
      if(st.parent[last]!==undefined&&st.parent[last]!==last)pathEdges[last+'>'+st.parent[last]]=1;
    }
  }
  const compEdges={};
  if(st.compNodes){
    st.compNodes.forEach(function(nd){compEdges[nd+'>'+st.parent[nd]]=1;});
  }
  const newEdge=st.newEdge?(st.newEdge[0]+'>'+st.newEdge[1]):null;
  for(let i=0;i<10;i++){
    const p=st.parent[i];
    if(p===i)continue;
    const a=P(i),b=P(p),key=i+'>'+p;
    let stroke='#2a3142',w=2,dash='';
    if(pathEdges[key]){stroke='#f1c40f';w=3;}
    if(compEdges[key]){stroke='#00d4ff';w=3.5;}
    if(newEdge===key){stroke='#e84393';w=3.5;dash='6 4';}
    const ln=svgEl('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:stroke,'stroke-width':w});
    if(dash)ln.setAttribute('stroke-dasharray',dash);
    svg.appendChild(ln);
  }
  for(let i=0;i<10;i++){
    const p=P(i);
    const isH=(st.hl||[]).indexOf(i)>=0;
    const isRoot=st.parent[i]===i;
    let fill='#1a1d3e',stroke='#34495e',sw=1.5;
    if(isRoot){fill='rgba(72,208,168,.3)';stroke='#48d0b0';sw=2.5;}
    if(isH){fill='rgba(241,196,15,.3)';stroke='#f1c40f';sw=3;}
    svg.appendChild(svgEl('circle',{cx:p.x,cy:p.y,r:24,fill:fill,stroke:stroke,'stroke-width':sw}));
    txt(svg,p.x,p.y,i,{fill:'#e0e0e0','font-size':15,'font-weight':'bold'});
    if(isRoot)txt(svg,p.x,p.y+38,'rank '+st.rank[i],{fill:'#48d0b0','font-size':10});
    else txt(svg,p.x,p.y+38,'p='+st.parent[i],{fill:'#667080','font-size':10});
  }
}

/* ===================== 3: SEGMENT / FENWICK ===================== */
const SEGA0=[5,3,7,2,8,6,1,4];
const SEGLBL=['build','upd a[3] +10','sum [2..6]','upd a[5] −2','sum [0..4]','sum [4..7]'];
const SEGOPS=[{k:'build'},{k:'upd',i:3,d:10},{k:'qry',l:2,r:6},{k:'upd',i:5,d:-2},{k:'qry',l:0,r:4},{k:'qry',l:4,r:7}];
const SEGRNG={};
(function mk(i,l,r){
  SEGRNG[i]=[l,r];
  if(l<r){const m=(l+r)>>1;mk(i*2,l,m);mk(i*2+1,m+1,r);}
})(1,0,7);
let SEGMODE='seg';

function segBuild(){
  const steps=[];
  const a=SEGA0.slice();
  const seg=new Array(16).fill(0);
  let curOp=0;
  const qres=[];
  function snap(msg,o){
    o=o||{};o.msg=msg;o.a=a.slice();o.seg=seg.slice();
    if(o.opI===undefined)o.opI=curOp;
    o.hl=o.hl||[];o.sk=o.sk||[];o.taken=o.taken||[];
    o.stats=[['a',a.join(' ')],['Queries',qres.length?qres.join(' · '):'—']];
    steps.push(o);
  }
  for(let i=0;i<8;i++)seg[8+i]=a[i];
  snap('Build — leaves 8..15 hold the array values',{opI:0,hl:[8,9,10,11,12,13,14,15]});
  for(let i=7;i>=1;i--){
    const rg=SEGRNG[i];
    seg[i]=seg[i*2]+seg[i*2+1];
    snap('seg['+i+'] range ['+rg[0]+'..'+rg[1]+'] = '+seg[i*2]+' + '+seg[i*2+1]+' = '+seg[i],
      {opI:0,hl:[i*2,i*2+1,i],log:'seg['+i+']='+seg[i],lcls:'ok'});
  }
  SEGOPS.forEach(function(op,idx){
    if(idx===0)return;
    curOp=idx;
    if(op.k==='upd'){
      snap('Update a['+op.i+'] '+(op.d>0?'+':'')+op.d+' — descend root → leaf',{opI:idx});
      const path=[];
      (function desc(i){
        const rg=SEGRNG[i];
        path.push(i);
        if(rg[0]===rg[1]){
          a[rg[0]]+=op.d;seg[i]=a[rg[0]];
          snap('Leaf ['+rg[0]+'..'+rg[0]+'] updated → a['+rg[0]+'] = '+a[rg[0]],{opI:idx,hl:[i],path:path.slice(),cls:'ok'});
          return;
        }
        const m=(rg[0]+rg[1])>>1;
        snap('seg['+i+'] covers ['+rg[0]+'..'+rg[1]+'] — '+((op.i<=m)?'go left':'go right'),
          {opI:idx,hl:[i],path:path.slice()});
        desc(op.i<=m?i*2:i*2+1);
      })(1);
      for(let k=path.length-2;k>=0;k--){
        const i=path[k];
        seg[i]=seg[i*2]+seg[i*2+1];
        snap('Recompute seg['+i+'] = '+seg[i*2]+' + '+seg[i*2+1]+' = '+seg[i],
          {opI:idx,hl:[i*2,i*2+1,i],path:path.slice()});
      }
      snap('Update done — ancestors corrected to the root',{opI:idx,hl:[1],cls:'ok',sfx:'good',log:'upd a['+op.i+'] '+op.d,lcls:'ok'});
    }else{
      snap('Sum ['+op.l+'..'+op.r+'] — traverse from root',{opI:idx,hl:[1]});
      const taken=[],sk=[];
      let ans=0;
      (function q(i){
        const rg=SEGRNG[i],L=rg[0],R=rg[1];
        if(op.l<=L&&R<=op.r){
          taken.push(i);ans+=seg[i];
          snap('Take seg['+i+'] = ['+L+'..'+R+'] → +'+seg[i]+' (fully covered)',{opI:idx,hl:[i],taken:taken.slice(),cls:'ok'});
          return;
        }
        if(R<op.l||op.r<L){
          sk.push(i);
          snap('Skip seg['+i+'] = ['+L+'..'+R+'] — no overlap',{opI:idx,sk:[i],taken:taken.slice(),cls:'hl'});
          return;
        }
        snap('Descend seg['+i+'] = ['+L+'..'+R+'] — partial overlap',{opI:idx,hl:[i],taken:taken.slice()});
        q(i*2);q(i*2+1);
      })(1);
      qres.push(ans);
      snap('sum ['+op.l+'..'+op.r+'] = '+taken.map(function(i){return seg[i];}).join(' + ')+' = '+ans,
        {opI:idx,hl:taken,taken:taken.slice(),cls:'ok',sfx:'good',log:'sum['+op.l+'..'+op.r+']='+ans,lcls:'ok'});
    }
  });
  curOp=SEGOPS.length;
  const ok=qres.join(',')==='34,35,17';
  snap(ok?'Segment tree answers: '+qres.join(' · '):'Wrong answers: '+qres.join(','),
    {opI:SEGOPS.length,cls:ok?'ok':'err',done:true,bad:!ok,
     res:ok?('✓ range sums: '+qres.join(' · ')+' — segment tree correct'):'✗ got '+qres.join(','),
     sfx:ok?'done':'bad'});
  return steps;
}

function fenBuild(){
  const steps=[];
  const a=SEGA0.slice();
  const t=new Array(9).fill(0);
  let curOp=0;
  const qres=[];
  const lsb=function(i){return i&-i;};
  function snap(msg,o){
    o=o||{};o.msg=msg;o.a=a.slice();o.t=t.slice();
    if(o.opI===undefined)o.opI=curOp;
    o.active=o.active||[];o.acc=o.acc||[];o.lane=o.lane||[];
    o.stats=[['a',a.join(' ')],['Queries',qres.length?qres.join(' · '):'—']];
    steps.push(o);
  }
  snap('Fenwick build — tree[i] = sum of a[i−lsb(i)+1 .. i]',{});
  for(let i=1;i<=8;i++){
    const lo=i-lsb(i)+1;
    let s=0;
    for(let j=lo;j<=i;j++)s+=a[j-1];
    t[i]=s;
    const parts=[];
    for(let j=lo;j<=i;j++)parts.push(a[j-1]);
    snap('tree['+i+'] = a['+lo+'..'+i+'] = '+parts.join('+')+' = '+s,
      {active:[i],lane:['i='+i],ro:'tree['+i+'] = '+s});
  }
  SEGOPS.forEach(function(op,idx){
    if(idx===0)return;
    curOp=idx;
    if(op.k==='upd'){
      a[op.i]+=op.d;
      const i0=op.i+1;
      snap('a['+op.i+'] → '+a[op.i]+'; propagate: i = '+i0+', i += lsb(i)',{active:[i0],ro:'a['+op.i+'] = '+a[op.i]});
      let x=i0;
      const lane=[];
      while(x<=8){
        t[x]+=op.d;
        lane.push(x);
        snap('tree['+x+'] += '+op.d+' → '+t[x],{active:[x],lane:lane.slice(),ro:'tree['+x+'] = '+t[x],cls:'hl'});
        x+=lsb(x);
        if(x<=8)snap('i = i + lsb(i): '+lane[lane.length-1]+' + '+lsb(lane[lane.length-1])+' = '+x,{lane:lane.slice(),active:[x],ro:'next i = '+x});
      }
      snap('Update done — '+lane.join(' → ')+', all ancestors fixed',{lane:lane,acc:lane.slice(),cls:'ok',sfx:'good',log:'upd a['+op.i+'] '+op.d,lcls:'ok'});
    }else{
      const pref=function(i,label){
        snap('prefix('+i+'): acc += tree[i], then i −= lsb(i)',{lane:[]});
        let acc=0,x=i;
        const lane=[];
        while(x>0){
          acc+=t[x];
          lane.push(x);
          snap('  acc += tree['+x+'] = '+t[x]+' → '+acc,{active:[x],acc:lane.slice(),lane:lane.slice(),ro:'prefix('+i+') = '+acc});
          const nx=x-lsb(x);
          if(nx>0)snap('  i − lsb(i): '+x+' − '+lsb(x)+' = '+nx,{lane:lane.slice(),ro:'i = '+nx});
          x=nx;
        }
        if(i===0)snap('prefix(0) = 0 (empty range)',{ro:'prefix(0) = 0'});
        return acc;
      };
      snap('Sum ['+op.l+'..'+op.r+'] = prefix('+(op.r+1)+') − prefix('+op.l+')',{});
      const p1=pref(op.r+1,'');
      const p2=pref(op.l,'');
      const ans=p1-p2;
      qres.push(ans);
      snap('sum = prefix('+(op.r+1)+') − prefix('+op.l+') = '+p1+' − '+p2+' = '+ans,
        {acc:[op.r+1,op.l],ro:p1+' − '+p2+' = '+ans,cls:'ok',sfx:'good',log:'sum['+op.l+'..'+op.r+']='+ans,lcls:'ok'});
    }
  });
  curOp=SEGOPS.length;
  const ok=qres.join(',')==='34,35,17';
  snap(ok?'Fenwick answers: '+qres.join(' · ')+' — matches segment tree':'Wrong answers: '+qres.join(','),
    {opI:SEGOPS.length,cls:ok?'ok':'err',done:true,bad:!ok,
     res:ok?('✓ range sums: '+qres.join(' · ')+' — BIT ≡ segment tree'):'✗ got '+qres.join(','),
     sfx:ok?'done':'bad'});
  return steps;
}

function renderSeg(st,n){
  const svg=clearSvg('svg'+n);
  chipsUI('ops',n,SEGLBL,st.opI,true);
  statsUI(n,st);
  if(!svg)return;
  const pos={},dep={};
  (function p(i){
    const rg=SEGRNG[i];
    dep[i]=Math.floor(Math.log2(i));
    if(rg[0]===rg[1]){pos[i]=46+rg[0]*92;return;}
    p(i*2);p(i*2+1);
    pos[i]=(pos[i*2]+pos[i*2+1])/2;
  })(1);
  for(let i=1;i<=7;i++){
    const a={x:pos[i],y:40+dep[i]*100};
    const b1={x:pos[i*2],y:40+dep[i*2]*100};
    const b2={x:pos[i*2+1],y:40+dep[i*2+1]*100};
    svg.appendChild(svgEl('line',{x1:a.x,y1:a.y,x2:b1.x,y2:b1.y,stroke:'#2a3142','stroke-width':2}));
    svg.appendChild(svgEl('line',{x1:a.x,y1:a.y,x2:b2.x,y2:b2.y,stroke:'#2a3142','stroke-width':2}));
  }
  for(let i=1;i<=15;i++){
    const rg=SEGRNG[i];
    const x=pos[i],y=40+dep[i]*100;
    const isT=(st.taken||[]).indexOf(i)>=0;
    const isS=(st.sk||[]).indexOf(i)>=0;
    const isH=(st.hl||[]).indexOf(i)>=0;
    let fill='#1a1d3e',stroke='#34495e',tc='#e0e0e0',rc='#667080';
    if(isS){fill='rgba(255,107,107,.15)';stroke='#7a3030';tc='#8a6060';rc='#6b4040';}
    if(isH){fill='rgba(241,196,15,.22)';stroke='#f1c40f';tc='#f1c40f';rc='#b09040';}
    if(isT){fill='rgba(72,208,168,.25)';stroke='#48d0b0';tc='#48d0b0';rc='#3f9a85';}
    svg.appendChild(svgEl('rect',{x:x-30,y:y-19,width:60,height:38,rx:7,fill:fill,stroke:stroke,'stroke-width':(isH||isT?2.5:1.5)}));
    txt(svg,x,y-6,'['+rg[0]+'..'+rg[1]+']',{fill:rc,'font-size':9});
    txt(svg,x,y+9,st.seg[i],{fill:tc,'font-size':13,'font-weight':'bold'});
  }
}
function renderFen(st,n){
  chipsUI('ops',n,SEGLBL,st.opI,true);
  statsUI(n,st);
  const wrap=E('fenArr');
  const lane=E('fenLane');
  const ro=E('fenRo');
  if(!wrap)return;
  wrap.innerHTML='';
  const lab=document.createElement('div');
  lab.className='stat';
  lab.innerHTML='array a (0-based) — leaf values';
  wrap.appendChild(lab);
  const rowA=document.createElement('div');
  rowA.className='farr';
  for(let i=0;i<8;i++){
    const b=document.createElement('div');
    b.className='ab'+((st.active||[]).indexOf(i+1)>=0?' active':'');
    b.innerHTML='<span class="ai">a['+i+']</span><span class="av">'+st.a[i]+'</span>';
    rowA.appendChild(b);
  }
  wrap.appendChild(rowA);
  const lab2=document.createElement('div');
  lab2.className='stat';
  lab2.innerHTML='fenwick tree t[1..8] — i in binary';
  wrap.appendChild(lab2);
  const rowT=document.createElement('div');
  rowT.className='farr';
  for(let i=1;i<=8;i++){
    const b=document.createElement('div');
    let cls='ab';
    if((st.active||[]).indexOf(i)>=0)cls+=' active';
    else if((st.acc||[]).indexOf(i)>=0)cls+=' done';
    b.className=cls;
    b.innerHTML='<span class="ai">t['+i+']</span><span class="av">'+st.t[i]+'</span><span class="abin">'+i.toString(2).padStart(4,'0')+' lsb'+(i&-i)+'</span>';
    rowT.appendChild(b);
  }
  wrap.appendChild(rowT);
  if(lane){
    const l=st.lane||[];
    lane.innerHTML=l.length?l.map(function(s,i){
      return '<span class="sq op'+(i===l.length-1?' cur':'')+'">'+s+'</span>'+(i<l.length-1?'<span class="arrowsep">→</span>':'');
    }).join(''):'<span style="color:#667080;font-size:.72rem">walk lane — index steps shown here</span>';
  }
  if(ro)ro.innerHTML=st.ro?st.ro:'&nbsp;';
}

/* ===================== 4: TRIE ===================== */
const TRIEWORDS=['car','card','cat','dog'];
const TRIEOPS=[{k:'ins',w:'cart'},{k:'srch',w:'cart'},{k:'srch',w:'cab'},{k:'auto',w:'ca'},{k:'auto',w:'d'},{k:'srch',w:'dog'}];
const TRIELBL=['ins "cart"','srch "cart"','srch "cab"','auto "ca"','auto "d"','srch "dog"'];
const TRIECOORD={'':{x:330,y:45},'c':{x:245,y:140},'d':{x:455,y:140},'ca':{x:170,y:235},'do':{x:455,y:235},
  'car':{x:115,y:330},'cat':{x:240,y:330},'dog':{x:455,y:330},'card':{x:60,y:425},'cart':{x:170,y:425}};

function trieBuild(){
  const steps=[];
  let root,outList=[],checks=[];
  function newNode(path,ch){return{path:path,ch:ch,end:false,kids:{}};}
  function resetTrie(){
    root=newNode('','');
    TRIEWORDS.forEach(function(w){
      let nd=root;
      for(let i=0;i<w.length;i++){
        const c=w[i];
        if(!nd.kids[c])nd.kids[c]=newNode(nd.path+c,c);
        nd=nd.kids[c];
      }
      nd.end=true;
    });
  }
  resetTrie();
  const cl=function(nd){const k={};for(const kk in nd.kids)k[kk]=cl(nd.kids[kk]);return{path:nd.path,ch:nd.ch,end:nd.end,kids:k};};
  function allNodes(){const out=[];(function w(nd){out.push(nd);for(const kk in nd.kids)w(nd.kids[kk]);})(root);return out;}
  function snap(msg,o){
    o=o||{};o.msg=msg;o.trie=cl(root);
    if(o.opI===undefined)o.opI=TRIEOPS.length;
    o.hl=o.hl||[];o.hl2=o.hl2||[];
    o.outsAll=outList.slice();
    const ns=allNodes();
    o.stats=[['Nodes',ns.length],['Words',ns.filter(function(x){return x.end;}).length],['Checks',checks.length?checks.join(' · '):'—']];
    steps.push(o);
  }
  function follow(w,i,opName){
    snap(opName+' "'+w+'" — walk edges from root',{opI:i,hl:['']});
    let nd=root;
    for(let j=0;j<w.length;j++){
      const c=w[j];
      if(!nd.kids[c]){
        snap('no edge "'+c+'" from "'+(nd.path||'root')+'" — DEAD END',{opI:i,hl:[nd.path],ghost:{from:nd.path,ch:c},cls:'err'});
        return null;
      }
      nd=nd.kids[c];
      snap('follow "'+c+'" → "'+nd.path+'"',{opI:i,hl:[nd.path],cls:'ok'});
    }
    return nd;
  }
  TRIEOPS.forEach(function(op,i){
    outList=[];
    if(op.k==='ins'){
      snap('Insert "'+op.w+'" — create missing edges',{opI:i,hl:['']});
      let nd=root;
      for(let j=0;j<op.w.length;j++){
        const c=op.w[j];
        if(nd.kids[c]){
          nd=nd.kids[c];
          snap('edge "'+c+'" exists → "'+nd.path+'"',{opI:i,hl:[nd.path],cls:'ok'});
        }else{
          nd.kids[c]=newNode(nd.path+c,c);
          nd=nd.kids[c];
          snap('no edge "'+c+'" — CREATE node "'+nd.path+'" (new)',{opI:i,hl:[nd.path],cls:'hl',log:'+ node '+nd.path,lcls:'hl'});
        }
      }
      nd.end=true;
      snap('"'+op.w+'" complete — mark ★ terminal',{opI:i,hl:[nd.path],cls:'ok',sfx:'good',log:'inserted '+op.w,lcls:'ok'});
      checks.push('ins✓');
    }else if(op.k==='srch'){
      const nd=follow(op.w,i,'Search');
      if(!nd){
        outList.push({t:op.w+' ✗',bad:true});
        checks.push(op.w+'✗');
        snap('"'+op.w+'" not in dictionary',{opI:i,cls:'err',sfx:'bad',log:'✗ '+op.w,lcls:'bad'});
        return;
      }
      if(nd.end){
        outList.push({t:op.w+' ✓'});
        checks.push(op.w+'✓');
        snap('reached "'+op.w+'" and it has ★ — FOUND',{opI:i,hl:[nd.path],cls:'ok',sfx:'good',log:'✓ '+op.w,lcls:'ok'});
      }else{
        outList.push({t:op.w+' (prefix only)',bad:true});
        checks.push(op.w+'pfx');
        snap('"'+op.w+'" exists but has no ★ — prefix only, not a word',{opI:i,hl:[nd.path],cls:'err',sfx:'bad'});
      }
    }else{
      const nd=follow(op.w,i,'Autocomplete');
      if(!nd){
        outList.push({t:'no match for "'+op.w+'"',bad:true});
        checks.push(op.w+'✗');
        snap('prefix "'+op.w+'" missing — no completions',{opI:i,cls:'err',sfx:'bad'});
        return;
      }
      snap('prefix "'+op.w+'" located — scan subtree for ★',{opI:i,hl:[nd.path],cls:'hl'});
      const found=[];
      (function collect(x){
        if(x.end)found.push(x.path);
        for(const kk in x.kids)collect(x.kids[kk]);
      })(nd);
      found.forEach(function(w){
        outList.push({t:w});
        snap('★ match: "'+w+'"',{opI:i,hl:[nd.path],hl2:[w],cls:'ok'});
      });
      checks.push(op.w+'→'+found.length);
      snap('"' +op.w+'" → '+found.length+' word'+(found.length===1?'':'s')+': '+found.join(', '),
        {opI:i,hl:[nd.path],cls:'ok',sfx:'good',log:'auto '+op.w+' → '+found.length,lcls:'ok'});
    }
  });
  const ok=checks.join('|')==='ins✓|cart✓|cab✗|ca→4|d→1|dog✓';
  snap(ok?'All trie operations correct':'Some operations wrong: '+checks.join(','),
    {opI:TRIEOPS.length,cls:ok?'ok':'err',done:true,bad:!ok,
     res:ok?'✓ cart found · cab rejected · ca→4 words · d→1 word · dog found':'✗ '+checks.join(','),
     sfx:ok?'done':'bad'});
  return steps;
}
function renderTrie(st,n){
  const svg=clearSvg('svg'+n);
  chipsUI('ops',n,TRIELBL,st.opI,true);
  statsUI(n,st);
  const outs=E('outs'+n);
  if(outs){
    outs.innerHTML=(st.outsAll||[]).map(function(o){
      return '<span class="oc'+(o.bad?' bad':'')+'">'+o.t+'</span>';
    }).join('');
  }
  if(!svg)return;
  const t=st.trie;
  const all=[];
  (function w(nd){all.push(nd);for(const kk in nd.kids)w(nd.kids[kk]);})(t);
  all.forEach(function(nd){
    for(const kk in nd.kids){
      const c=nd.kids[kk];
      const p=tcoord(nd.path),q=tcoord(c.path);
      svg.appendChild(svgEl('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,stroke:'#2a3142','stroke-width':2}));
      txt(svg,(p.x+q.x)/2,(p.y+q.y)/2-9,c.ch,{fill:'#667080','font-size':11,'font-weight':'bold'});
    }
  });
  if(st.ghost){
    const p=tcoord(st.ghost.from);
    svg.appendChild(svgEl('circle',{cx:p.x+55,cy:p.y+62,r:19,fill:'none',stroke:'#ff6b6b','stroke-width':2,'stroke-dasharray':'5 4'}));
    txt(svg,p.x+55,p.y+62,st.ghost.ch,{fill:'#ff6b6b','font-size':13,'font-weight':'bold'});
    txt(svg,p.x+55,p.y+92,'missing',{fill:'#ff6b6b','font-size':9});
  }
  all.forEach(function(nd){
    const p=tcoord(nd.path);
    const isH=(st.hl||[]).indexOf(nd.path)>=0;
    const isH2=(st.hl2||[]).indexOf(nd.path)>=0;
    let fill='#1a1d3e',stroke='#34495e',sw=1.5;
    if(isH){fill='rgba(72,208,168,.35)';stroke='#48d0b0';sw=2.5;}
    if(isH2){fill='rgba(241,196,15,.4)';stroke='#f1c40f';sw=3;}
    svg.appendChild(svgEl('circle',{cx:p.x,cy:p.y,r:20,fill:fill,stroke:stroke,'stroke-width':sw}));
    txt(svg,p.x,p.y,nd.ch||'ε',{fill:'#e0e0e0','font-size':14,'font-weight':'bold'});
    if(nd.end){
      svg.appendChild(svgEl('circle',{cx:p.x+16,cy:p.y-16,r:8,fill:'#f1c40f'}));
      txt(svg,p.x+16,p.y-16,'★',{fill:'#060912','font-size':10,'font-weight':'bold'});
    }
  });
}
function tcoord(path){
  return TRIECOORD[path]||{x:330,y:45};
}

/* ===================== wiring ===================== */
makeCtrl(0,avlBuild,renderAVL);
makeCtrl(1,rbBuild,renderRB);
makeCtrl(2,ufBuild,renderUF);
makeCtrl(3,function(){return SEGMODE==='seg'?segBuild():fenBuild();},function(st,n){
  if(SEGMODE==='seg')renderSeg(st,n);
  else renderFen(st,n);
});
makeCtrl(4,trieBuild,renderTrie);

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

function setMode(m){
  if(SEGMODE===m)return;
  SEGMODE=m;
  stopAll();
  const a=E('tg3s'),b=E('tg3f'),sv=E('segView'),fv=E('fenView');
  if(a)a.classList.toggle('on',m==='seg');
  if(b)b.classList.toggle('on',m==='fen');
  if(sv)sv.style.display=m==='seg'?'block':'none';
  if(fv)fv.style.display=m==='fen'?'block':'none';
  if(!CTRLS[3])return;
  const rd=document.getElementById('res3');if(rd)rd.className='result';
  const lg=document.getElementById('log3');if(lg)lg.innerHTML='';
  CTRLS[3].reset(true);
}
if(E('tg3s'))E('tg3s').addEventListener('click',function(){setMode('seg');});
if(E('tg3f'))E('tg3f').addEventListener('click',function(){setMode('fen');});

document.addEventListener('click',function(){AC();},{once:true});
