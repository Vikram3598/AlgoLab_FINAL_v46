'use strict';
function $(id){return document.getElementById(id);}
var COLORS=['#ff6b6b','#ff9f43','#f1c40f','#48d0b0','#00d4ff','#9b59b6','#e84393','#fd79a8'];

// SOUND
var actx=null;
function beep(f,d,t){try{if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();var o=actx.createOscillator(),g=actx.createGain();o.connect(g);g.connect(actx.destination);o.frequency.value=f||440;o.type=t||'sine';g.gain.setValueAtTime(.07,actx.currentTime);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+(d||.12));o.start();o.stop(actx.currentTime+(d||.12));}catch(e){}}
function sfxStep(){beep(550,.08,'sine');}
function sfxBad(){beep(180,.15,'sawtooth');}
function sfxDone(){[523,659,784,1047].forEach(function(f,i){setTimeout(function(){beep(f,.18,'triangle');},i*110);});}

// CONFETTI
function confetti(){var c=$('confetti');if(!c)return;for(var i=0;i<55;i++){var p=document.createElement('div');p.className='pc';p.style.left=Math.random()*100+'%';p.style.background=COLORS[i%8];p.style.width=(4+Math.random()*7)+'px';p.style.height=(4+Math.random()*7)+'px';p.style.borderRadius=Math.random()>.5?'50%':'2px';p.style.animationDuration=(1.5+Math.random()*2)+'s';p.style.animationDelay=(Math.random()*.4)+'s';c.appendChild(p);(function(el){setTimeout(function(){el.remove();},4000);})(p);}}

// NAV
var currentAlgo=-1,ctrls=[];
var homeScreen=$('homeScreen'),algoScreen=$('algoScreen'),backBtn=$('backBtn');
var panels=document.querySelectorAll('.panel');
document.querySelectorAll('.card').forEach(function(card){
  card.addEventListener('click',function(){
    currentAlgo=parseInt(card.getAttribute('data-a'));
    homeScreen.style.display='none';algoScreen.style.display='block';backBtn.classList.add('show');
    for(var i=0;i<panels.length;i++)panels[i].classList.remove('on');
    var p=$('p'+currentAlgo);if(p)p.classList.add('on');
    beep(500,.1,'sine');
  });
});
backBtn.addEventListener('click',function(){stopAll();currentAlgo=-1;homeScreen.style.display='block';algoScreen.style.display='none';backBtn.classList.remove('show');});
function stopAll(){for(var i=0;i<7;i++){if(ctrls[i]&&ctrls[i].stop)ctrls[i].stop();}}

// CONTROLLER
function makeCtrl(n,buildSteps,render){
  var steps=[],idx=0,playing=false,timer=null,speed=700;
  var btnPlay=$('play'+n),btnStep=$('step'+n),btnReset=$('reset'+n);
  var statusEl=$('s'+n),progEl=$('prog'+n),spdEl=$('spd'+n),spdvEl=$('spdv'+n);
  function upProg(){if(progEl)progEl.style.width=(steps.length?idx/steps.length*100:0)+'%';}
  function rebuild(){try{steps=buildSteps();}catch(e){steps=[{msg:'Error: '+e.message,fail:true}];}idx=0;render(null,statusEl);statusEl.textContent='Press Play or Step to begin';statusEl.className='status';upProg();}
  function doStep(){
    if(idx>=steps.length)return false;
    var s=steps[idx];render(s,statusEl);
    statusEl.textContent=s.msg;statusEl.className='status'+(s.done?' ok':s.fail?' err':' hl');
    idx++;upProg();
    if(idx>=steps.length){if(s.done){sfxDone();confetti();}else if(s.fail){sfxBad();}return false;}
    if(s.fail)sfxBad();else sfxStep();
    return true;
  }
  function startPlay(){if(playing)return;playing=true;btnPlay.innerHTML='⏸ Pause';timer=setInterval(function(){if(!doStep())stopPlay();},speed);}
  function stopPlay(){playing=false;clearInterval(timer);timer=null;btnPlay.innerHTML='▶ Play';}
  btnPlay.addEventListener('click',function(){if(playing)stopPlay();else startPlay();});
  btnStep.addEventListener('click',function(){if(!playing)doStep();});
  btnReset.addEventListener('click',function(){stopPlay();rebuild();});
  if(spdEl)spdEl.addEventListener('input',function(){speed=parseInt(spdEl.value);if(spdvEl)spdvEl.textContent=(speed/1000).toFixed(1)+'s';if(playing){stopPlay();startPlay();}});
  rebuild();ctrls[n]={stop:stopPlay};return ctrls[n];
}

// ===== GENERIC HELPERS =====
var MK=['#2c3e50','#00d4ff','#48d0b0','#f1c40f','#ff6b6b','#9b59b6'];
function drawGraph(svgId,nodes,edges,dir,o){
  var svg=$(svgId);if(!svg)return;
  var R=o.r||24;
  var h='<defs>';
  for(var i=0;i<MK.length;i++)h+='<marker id="'+svgId+'_m'+i+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto"><path d="M0,0L10,5L0,10z" fill="'+MK[i]+'"/></marker>';
  h+='<filter id="'+svgId+'_g"><feGaussianBlur stdDeviation="4.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
  var byId={};nodes.forEach(function(n){byId[n.id]=n;});
  edges.forEach(function(e){
    var a=byId[e[0]],b=byId[e[1]];if(!a||!b)return;
    var st=(o.edge&&o.edge(e[0],e[1]))||{color:'#2c3e50',w:1.5};
    var dx=b.x-a.x,dy=b.y-a.y,L=Math.sqrt(dx*dx+dy*dy)||1;
    var ux=dx/L,uy=dy/L;
    var x1=a.x+ux*(R+3),y1=a.y+uy*(R+3),x2=b.x-ux*(R+6),y2=b.y-uy*(R+6);
    var mk='';
    if(dir){var mi=MK.indexOf(st.color);if(mi<0)mi=0;mk=' marker-end="url(#'+svgId+'_m'+mi+')"';}
    h+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+st.color+'" stroke-width="'+(st.w||1.5)+'"'+(st.dash?' stroke-dasharray="'+st.dash+'"':'')+mk+' opacity="'+(st.op||1)+'"/>';
  });
  nodes.forEach(function(n){
    var st=(o.node&&o.node(n.id))||{};
    var fill=st.fill||'#1a1d3e',stroke=st.stroke||'#34495e',lf=st.lf||'#667080';
    h+='<g class="node-g"><circle cx="'+n.x+'" cy="'+n.y+'" r="'+R+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3"'+(st.glow?' filter="url(#'+svgId+'_g)"':'')+'/>';
    h+='<text x="'+n.x+'" y="'+(n.y+6)+'" fill="'+lf+'" font-size="15" text-anchor="middle" font-weight="700">'+(st.label!==undefined?st.label:n.id)+'</text>';
    (st.badges||[]).forEach(function(b){
      var by=b.pos==='top'?n.y-R-8:n.y+R+15;
      h+='<text x="'+n.x+'" y="'+by+'" fill="'+b.color+'" font-size="10.5" text-anchor="middle" font-weight="700" font-family="monospace">'+b.text+'</text>';
    });
    h+='</g>';
  });
  svg.innerHTML=h;
}
function drawBoxes(id,items){
  var el=$(id);if(!el)return;
  if(!items||!items.length){el.innerHTML='<span class="empty">— empty —</span>';return;}
  var h='';
  items.forEach(function(it,i){
    h+='<div class="bx '+(it.c||'')+'">'+it.t+'</div>';
    if(i<items.length-1)h+='<span class="arrow-sep">→</span>';
  });
  el.innerHTML=h;
}
function logAdd(id,msg,cls){var el=$(id);if(!el)return;el.innerHTML+='<div class="log-line '+(cls||'')+'">'+msg+'</div>';el.scrollTop=el.scrollHeight;}
function panelReset(logId,resId){var l=$(logId);if(l)l.innerHTML='';var r=$(resId);if(r){r.textContent='';r.className='result';}}
function showRes(id,msg,bad){var el=$(id);if(!el)return;if(msg){el.textContent=msg;el.className='result show'+(bad?' bad':'');}}

// ===== GRAPH DATA =====
// Undirected graph (BFS / DFS / Bipartite)
var UND={
  nodes:[{id:0,x:320,y:55},{id:1,x:170,y:150},{id:2,x:470,y:150},{id:3,x:80,y:285},{id:4,x:320,y:275},{id:5,x:560,y:285},{id:6,x:320,y:375}],
  edges:[[0,1],[0,2],[1,3],[1,4],[2,4],[2,5],[3,6],[4,6],[5,6]],
  adj:{0:[1,2],1:[0,3,4],2:[0,4,5],3:[1,6],4:[1,2,6],5:[2,6],6:[3,4,5]},
  n:7
};
// DAG (Topological sort / Kahn's)
var DAGG={
  nodes:[{id:5,x:70,y:70},{id:4,x:70,y:310},{id:2,x:270,y:60},{id:3,x:455,y:100},{id:1,x:455,y:300},{id:0,x:615,y:190}],
  edges:[[5,2],[5,0],[4,0],[4,1],[2,3],[3,1]],
  adj:{5:[2,0],4:[0,1],2:[3],3:[1],1:[],0:[]},
  n:6
};
// Directed graph with 3 SCCs (Kosaraju / Tarjan): {0,1,2} {3,4} {5}
var SCCG={
  nodes:[{id:0,x:80,y:80},{id:1,x:230,y:55},{id:2,x:150,y:215},{id:3,x:415,y:75},{id:4,x:435,y:220},{id:5,x:575,y:135}],
  edges:[[0,1],[1,2],[2,0],[1,3],[3,4],[4,3],[4,5]],
  adj:{0:[1],1:[2,3],2:[0],3:[4],4:[3,5],5:[]},
  n:6
};
function edgeKey(a,b){return Math.min(a,b)+'-'+Math.max(a,b);}
var SCC_COL=['#ff6b6b','#00d4ff','#f1c40f','#9b59b6'];

// ============================================================
// 0: BFS
// ============================================================
try{(function(){
  function build(){
    var steps=[],vis=[],lvl={},q=[],tree=[],order=[0];
    for(var i=0;i<UND.n;i++)vis[i]=false;
    function snap(cur,msg,kind){steps.push({q:q.slice(),vis:vis.slice(),lvl:JSON.parse(JSON.stringify(lvl)),cur:cur,tree:tree.slice(),order:order.slice(),msg:msg,kind:kind||''});}
    vis[0]=true;lvl[0]=0;q.push(0);
    snap(0,'Start at node 0 (level 0) — enqueue','enq');
    while(q.length){
      var u=q.shift();
      snap(u,'Dequeue '+u+' (FIFO front) — explore neighbors','deq');
      for(var k=0;k<UND.adj[u].length;k++){
        var v=UND.adj[u][k];
        if(!vis[v]){
          vis[v]=true;lvl[v]=lvl[u]+1;q.push(v);tree.push([u,v]);order.push(v);
          snap(v,'Neighbor '+v+' unvisited — reached via '+u+', level '+lvl[v]+' — enqueue','tree');
        }else{
          snap(u,'Neighbor '+v+' already visited — skip','skip');
        }
      }
    }
    var byLvl={};order.forEach(function(x){var L=lvl[x];(byLvl[L]=byLvl[L]||[]).push(x);});
    var lvlStr=Object.keys(byLvl).sort(function(a,b){return a-b;}).map(function(L){return 'L'+L+':['+byLvl[L].join(',')+']';}).join('  ');
    steps.push({q:[],vis:vis.slice(),lvl:lvl,cur:-1,tree:tree.slice(),order:order.slice(),done:true,msg:'BFS complete! Level order → '+lvlStr});
    return steps;
  }
  function render(s,el){
    if(!s)panelReset('log0','res0');
    var st=s||{q:[],vis:[],lvl:{},cur:-1,tree:[],order:[]};
    drawGraph('svg0',UND.nodes,UND.edges,false,{
      node:function(i){
        var f='#1a1d3e',sr='#34495e',lf='#667080',bad=[];
        if(st.vis[i]){f='rgba(72,208,176,.14)';sr='#48d0b0';lf='#48d0b0';bad.push({pos:'bottom',text:'L'+st.lvl[i],color:'#f1c40f'});}
        if(st.q.indexOf(i)>=0){f='rgba(255,159,67,.15)';sr='#ff9f43';lf='#ff9f43';}
        if(st.cur===i){f='rgba(241,196,15,.2)';sr='#f1c40f';lf='#f1c40f';}
        return {fill:f,stroke:sr,lf:lf,glow:st.cur===i,badges:bad};
      },
      edge:function(a,b){
        for(var i=0;i<st.tree.length;i++){var t=st.tree[i];if((t[0]===a&&t[1]===b)||(t[0]===b&&t[1]===a))return {color:'#00d4ff',w:3};}
        return {color:'#2c3e50',w:1.5,op:.75};
      }
    });
    drawBoxes('q0',st.q.map(function(id){return {t:id,c:'q'+(st.cur===id?' cur':'')};}));
    drawBoxes('o0',st.order.map(function(id){return {t:id,c:'vis'+(st.cur===id?' cur':'')};}));
    if(s){logAdd('log0',s.msg,s.done?'ok':s.fail?'bad':s.kind==='skip'?'':'hl');if(s.done)showRes('res0',s.msg);el.textContent=s.msg;el.className='status'+(s.done?' ok':s.fail?' err':' hl');}
  }
  makeCtrl(0,build,render);
})();}catch(e){var el=$('s0');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 1: DFS
// ============================================================
try{(function(){
  function build(){
    var steps=[],color=[],stk=[],order=[],et={};
    for(var i=0;i<UND.n;i++)color[i]=0;
    function snap(cur,msg,kind){steps.push({color:color.slice(),stk:stk.slice(),order:order.slice(),cur:cur,et:JSON.parse(JSON.stringify(et)),msg:msg,kind:kind||''});}
    function dfs(u,p){
      color[u]=1;stk.push(u);
      snap(u,'Discover '+u+' (gray) — push onto stack, depth '+stk.length,'enter');
      for(var k=0;k<UND.adj[u].length;k++){
        var v=UND.adj[u][k];
        if(v===p)continue;
        if(color[v]===0){
          et[edgeKey(u,v)]=et[edgeKey(u,v)]||'tree';
          snap(u,'Tree edge '+u+'→'+v+' — recurse into '+v,'tree');
          dfs(v,u);
        }else if(color[v]===1){
          if(!et[edgeKey(u,v)])et[edgeKey(u,v)]='back';
          snap(u,'Edge '+u+'→'+v+': '+v+' is GRAY (in stack) → BACK EDGE (cycle!)','back');
        }else{
          if(!et[edgeKey(u,v)])et[edgeKey(u,v)]='cross';
          snap(u,'Edge '+u+'→'+v+': '+v+' is BLACK (finished) → cross edge','cross');
        }
      }
      color[u]=2;stk.pop();order.push(u);
      snap(u,'Finish '+u+' (black) — pop stack, postorder ['+order.join(', ')+']','exit');
    }
    dfs(0,-1);
    steps.push({color:color.slice(),stk:[],order:order.slice(),cur:-1,et:et,done:true,msg:'DFS complete! Postorder: ['+order.join(', ')+']'});
    return steps;
  }
  function render(s,el){
    if(!s)panelReset('log1','res1');
    var st=s||{color:[0,0,0,0,0,0,0],stk:[],order:[],cur:-1,et:{}};
    drawGraph('svg1',UND.nodes,UND.edges,false,{
      node:function(i){
        var c=st.color[i]||0;
        var f='#1a1d3e',sr='#34495e',lf='#667080';
        if(c===2){f='rgba(72,208,168,.16)';sr='#48d0b0';lf='#48d0b0';}
        if(c===1){f='rgba(255,159,67,.18)';sr='#ff9f43';lf='#ff9f43';}
        if(st.cur===i){f='rgba(241,196,15,.22)';sr='#f1c40f';lf='#f1c40f';}
        var bad=[];
        if(c===1)bad.push({pos:'bottom',text:'in stack',color:'#ff9f43'});
        if(c===2)bad.push({pos:'bottom',text:'done',color:'#48d0b0'});
        return {fill:f,stroke:sr,lf:lf,glow:st.cur===i,badges:bad};
      },
      edge:function(a,b){
        var t=st.et[edgeKey(a,b)];
        if(t==='tree')return {color:'#00d4ff',w:3};
        if(t==='back')return {color:'#ff6b6b',w:3,dash:'7 4'};
        if(t==='cross')return {color:'#9b59b6',w:2.5,dash:'2 4'};
        return {color:'#2c3e50',w:1.5,op:.75};
      }
    });
    drawBoxes('q1',st.stk.map(function(id,i){return {t:id,c:(i===st.stk.length-1?'cur':'gray')};}));
    drawBoxes('o1',st.order.map(function(id){return {t:id,c:'blk'};}));
    if(s){logAdd('log1',s.msg,s.done?'ok':s.fail?'bad':s.kind==='back'?'bad':s.kind==='tree'?'acc':'');if(s.done)showRes('res1',s.msg);el.textContent=s.msg;el.className='status'+(s.done?' ok':s.fail?' err':' hl');}
  }
  makeCtrl(1,build,render);
})();}catch(e){var el=$('s1');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 2: TOPOLOGICAL SORT (DFS / Kahn toggle)
// ============================================================
try{(function(){
  var mode2='dfs';
  function buildDfs(){
    var steps=[],color=[],stk=[],order=[],cycle=false;
    for(var i=0;i<DAGG.n;i++)color[i]=0;
    function snap(cur,msg,kind){steps.push({mode:'dfs',color:color.slice(),stk:stk.slice(),order:order.slice(),indeg:null,cur:cur,msg:msg,kind:kind||''});}
    function dfs(u){
      if(cycle)return;
      color[u]=1;stk.push(u);
      snap(u,'Enter '+u+' (gray) — push','enter');
      for(var k=0;k<DAGG.adj[u].length;k++){
        if(cycle)return;
        var v=DAGG.adj[u][k];
        if(color[v]===0){snap(u,'Follow dependency '+u+'→'+v+' — recurse','tree');dfs(v);}
        else if(color[v]===1){cycle=true;snap(u,'Back edge '+u+'→'+v+' — CYCLE detected! Graph is NOT a DAG','fail');return;}
        else snap(u,'Dependency '+u+'→'+v+': '+v+' already ordered — skip','skip');
      }
      if(cycle)return;
      stk.pop();color[u]=2;order.unshift(u);
      snap(u,'Finish '+u+' → prepend to order = ['+order.join(', ')+']','exit');
    }
    for(var u=0;u<DAGG.n&&!cycle;u++)if(color[u]===0)dfs(u);
    if(cycle){steps.push({mode:'dfs',color:color.slice(),stk:stk.slice(),order:order.slice(),cur:-1,fail:true,msg:'Cannot topologically sort — the back edge forms a cycle'});return steps;}
    steps.push({mode:'dfs',color:color.slice(),stk:[],order:order.slice(),cur:-1,done:true,msg:'Topological order: '+order.join(' → ')+' — every dependency comes before its dependent'});
    return steps;
  }
  function buildKahn(){
    var steps=[],indeg={},q=[],order=[],relaxed={};
    for(var u=0;u<DAGG.n;u++)indeg[u]=0;
    DAGG.edges.forEach(function(e){indeg[e[1]]++;});
    for(var u=0;u<DAGG.n;u++)if(indeg[u]===0)q.push(u);
    function snap(cur,msg,kind){steps.push({mode:'kahn',color:null,indeg:JSON.parse(JSON.stringify(indeg)),q:q.slice(),order:order.slice(),relaxed:JSON.parse(JSON.stringify(relaxed)),cur:cur,msg:msg,kind:kind||''});}
    snap(-1,'Indegrees: ['+Object.keys(indeg).map(function(k){return k+':'+indeg[k];}).join('  ')+'] — enqueue indegree-0: ['+q.join(', ')+']','init');
    while(q.length){
      var u=q.shift();order.push(u);
      snap(u,'Emit '+u+' → order ['+order.join(', ')+']','emit');
      for(var k=0;k<DAGG.adj[u].length;k++){
        var v=DAGG.adj[u][k];
        relaxed[edgeKey(u,v)]=true;
        indeg[v]--;
        if(indeg[v]===0){q.push(v);snap(v,'Relax '+u+'→'+v+': indegree of '+v+' hit 0 — enqueue','enq');}
        else snap(v,'Relax '+u+'→'+v+': indegree of '+v+' = '+indeg[v]+' — still waiting','dec');
      }
    }
    if(order.length<DAGG.n){steps.push({mode:'kahn',color:null,indeg:indeg,q:[],order:order.slice(),cur:-1,fail:true,msg:'Cycle! Only '+order.length+' of '+DAGG.n+' nodes emitted'});return steps;}
    steps.push({mode:'kahn',color:null,indeg:indeg,q:[],order:order.slice(),cur:-1,done:true,msg:'Topological order: '+order.join(' → ')+' — all dependencies satisfied'});
    return steps;
  }
  function build(){return mode2==='dfs'?buildDfs():buildKahn();}
  function render(s,el){
    if(!s)panelReset('log2','res2');
    var isK=mode2==='kahn';
    var st=s||{mode:mode2,color:isK?null:[0,0,0,0,0,0],stk:[],q:[],order:[],indeg:isK?null:{},relaxed:{},cur:-1};
    $('qlbl2').textContent=isK?'Queue of indegree-0 nodes':'Recursion stack';
    drawGraph('svg2',DAGG.nodes,DAGG.edges,true,{
      node:function(i){
        var f='#1a1d3e',sr='#34495e',lf='#667080',bad=[];
        if(isK){
          if(st.order.indexOf(i)>=0){f='rgba(72,208,168,.16)';sr='#48d0b0';lf='#48d0b0';}
          else if(st.q&&st.q.indexOf(i)>=0){f='rgba(255,159,67,.16)';sr='#ff9f43';lf='#ff9f43';}
          if(st.cur===i){f='rgba(241,196,15,.22)';sr='#f1c40f';lf='#f1c40f';}
          if(st.indeg)bad.push({pos:'bottom',text:'indeg:'+st.indeg[i],color:st.indeg[i]===0?'#48d0b0':'#ff9f43'});
        }else{
          var c=st.color?st.color[i]:0;
          if(c===2){f='rgba(72,208,168,.16)';sr='#48d0b0';lf='#48d0b0';}
          if(c===1){f='rgba(255,159,67,.18)';sr='#ff9f43';lf='#ff9f43';}
          if(st.cur===i){f='rgba(241,196,15,.22)';sr='#f1c40f';lf='#f1c40f';}
          var pos=st.order.indexOf(i);if(pos>=0)bad.push({pos:'bottom',text:'#'+(pos+1),color:'#48d0b0'});
        }
        return {fill:f,stroke:sr,lf:lf,glow:st.cur===i,badges:bad};
      },
      edge:function(a,b){
        var k=edgeKey(a,b);
        if(isK){
          if(st.relaxed&&st.relaxed[k])return {color:'#48d0b0',w:3};
          if(st.cur===a)return {color:'#f1c40f',w:2.5,dash:'5 4'};
          return {color:'#2c3e50',w:1.5,op:.75};
        }
        if(st.color&&st.color[a]===2&&st.color[b]===2)return {color:'#48d0b0',w:2.5,op:.9};
        if(st.cur===a)return {color:'#00d4ff',w:2.5};
        return {color:'#2c3e50',w:1.5,op:.75};
      }
    });
    if(isK){
      drawBoxes('q2',(st.q||[]).map(function(id){return {t:id,c:'q'+(st.cur===id?' cur':'')};}));
      drawBoxes('o2',(st.order||[]).map(function(id){return {t:id,c:'vis'};}));
    }else{
      drawBoxes('q2',(st.stk||[]).map(function(id,i){return {t:id,c:i===st.stk.length-1?'cur':'gray'};}));
      drawBoxes('o2',(st.order||[]).map(function(id){return {t:id,c:'vis'};}));
    }
    if(s){logAdd('log2',s.msg,s.done?'ok':s.fail?'bad':s.kind==='skip'?'':'hl');if(s.done)showRes('res2',s.msg);else if(s.fail)showRes('res2',s.msg,true);el.textContent=s.msg;el.className='status'+(s.done?' ok':s.fail?' err':' hl');}
  }
  makeCtrl(2,build,render);
  $('tg2d').addEventListener('click',function(){mode2='dfs';$('tg2d').classList.add('on');$('tg2k').classList.remove('on');$('reset2').click();});
  $('tg2k').addEventListener('click',function(){mode2='kahn';$('tg2k').classList.add('on');$('tg2d').classList.remove('on');$('reset2').click();});
})();}catch(e){var el=$('s2');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 3: KOSARAJU
// ============================================================
try{(function(){
  var trans={};
  for(var u=0;u<SCCG.n;u++)trans[u]=[];
  SCCG.edges.forEach(function(e){trans[e[1]].push(e[0]);});
  function build(){
    var steps=[],vis1=[],vis2=[],sccOf=[],sccs=[],stk=[],fin=[],pass=1;
    function snap(cur,msg,kind){
      steps.push({pass:pass,vis1:vis1.slice(),vis2:vis2.slice(),sccOf:sccOf.slice(),stk:stk.slice(),fin:fin.slice(),sccs:sccs.map(function(c){return c.slice();}),cur:cur,msg:msg,kind:kind||''});
    }
    function dfs1(u){
      vis1[u]=true;stk.push(u);
      snap(u,'Pass 1: DFS visit '+u+' — push (depth '+stk.length+')','enter');
      for(var k=0;k<SCCG.adj[u].length;k++){
        var v=SCCG.adj[u][k];
        if(!vis1[v]){snap(u,'Follow '+u+'→'+v+' — recurse','tree');dfs1(v);}
        else snap(u,'Edge '+u+'→'+v+' leads to visited node — skip','skip');
      }
      stk.pop();fin.push(u);
      snap(u,'Finish '+u+' — finishing order ['+fin.join(', ')+']','exit');
    }
    for(var u=0;u<SCCG.n;u++)if(!vis1[u])dfs1(u);
    snap(-1,'Pass 1 done! Now TRANSPOSE every edge and process in reverse finish order: ['+fin.slice().reverse().join(', ')+']','switch');
    pass=2;stk=[];
    function dfs2(u,comp){
      vis2[u]=true;sccOf[u]=sccs.length;comp.push(u);stk.push(u);
      snap(u,'Pass 2 (Gᵀ): visit '+u+' — assign SCC #'+(sccs.length+1),'enter');
      for(var k=0;k<trans[u].length;k++){
        var v=trans[u][k];
        if(!vis2[v]){snap(u,'Transposed edge '+u+'→'+v+' — recurse','tree');dfs2(v,comp);}
        else snap(u,'Transposed edge '+u+'→'+v+' already claimed — skip','skip');
      }
      stk.pop();
    }
    for(var k=fin.length-1;k>=0;k--){
      var u=fin[k];
      if(vis2[u]){snap(u,'Node '+u+' already belongs to an SCC — skip','skip');continue;}
      snap(u,'Root '+u+' (highest finish time remaining) — grow SCC','root');
      var comp=[];
      dfs2(u,comp);
      sccs.push(comp);
      snap(u,'SCC '+sccs.length+' closed: {'+comp.slice().sort(function(a,b){return a-b;}).join(', ')+'}','scc');
    }
    steps.push({pass:2,vis1:vis1,vis2:vis2,sccOf:sccOf,stk:[],fin:fin,sccs:sccs.map(function(c){return c.slice();}),cur:-1,done:true,
      msg:'Done! '+sccs.length+' SCCs: '+sccs.map(function(c){return '{'+c.slice().sort(function(a,b){return a-b;}).join(',')+'}';}).join('  ')});
    return steps;
  }
  function render(s,el){
    if(!s)panelReset('log3','res3');
    var st=s||{pass:1,vis1:[],vis2:[],sccOf:[],stk:[],fin:[],sccs:[],cur:-1};
    var lab=$('pass3');
    if(st.pass===2){lab.textContent='Pass 2 — TRANSPOSED graph (Gᵀ) · DFS in reverse finish order';lab.className='passlab p2';$('qlbl3').textContent='DFS stack (transpose)';$('olbl3').textContent='Finishing order (dimmed = consumed ▸)';}
    else{lab.textContent='Pass 1 — Original graph · compute finishing times';lab.className='passlab';$('qlbl3').textContent='DFS stack';$('olbl3').textContent='Finishing order (fill)';}
    var edges=st.pass===2?SCCG.edges.map(function(e){return [e[1],e[0]];}):SCCG.edges;
    drawGraph('svg3',SCCG.nodes,edges,true,{
      node:function(i){
        var f='#1a1d3e',sr='#34495e',lf='#667080',bad=[];
        if(st.pass===1){
          var inStk=st.stk.indexOf(i)>=0;
          if(st.vis1[i]&&!inStk){f='rgba(72,208,168,.16)';sr='#48d0b0';lf='#48d0b0';bad.push({pos:'bottom',text:'f:'+(st.fin.indexOf(i)+1),color:'#48d0b0'});}
          if(inStk){f='rgba(255,159,67,.16)';sr='#ff9f43';lf='#ff9f43';}
        }else{
          if(st.sccOf[i]!==undefined&&st.sccOf[i]>=0){var col=SCC_COL[st.sccOf[i]%4];f=col+'2e';sr=col;lf=col;bad.push({pos:'bottom',text:'SCC '+(st.sccOf[i]+1),color:col});}
          else if(st.stk.indexOf(i)>=0){f='rgba(255,159,67,.16)';sr='#ff9f43';lf='#ff9f43';}
        }
        if(st.cur===i){f='rgba(241,196,15,.25)';sr='#f1c40f';lf='#f1c40f';}
        return {fill:f,stroke:sr,lf:lf,glow:st.cur===i,badges:bad};
      },
      edge:function(a,b){
        if(st.pass===2)return {color:'#e84393',w:2,op:.85};
        return {color:'#2c3e50',w:1.8,op:.85};
      }
    });
    drawBoxes('q3',st.stk.map(function(id,i){return {t:id,c:i===st.stk.length-1?'cur':'gray'};}));
    drawBoxes('o3',st.fin.map(function(id){var used=st.pass===2&&st.vis2[id];return {t:id,c:used?'dim':'acc'};}));
    var sc=$('scc3');
    if(sc){var h='';st.sccs.forEach(function(c,i){h+='<div class="sccc c'+(i%4)+'">{'+c.slice().sort(function(a,b){return a-b;}).join(', ')+'}</div>';});sc.innerHTML=h;}
    if(s){logAdd('log3',s.msg,s.done?'ok':s.fail?'bad':s.kind==='scc'?'ok':s.kind==='switch'?'acc':'hl');if(s.done)showRes('res3',s.msg);el.textContent=s.msg;el.className='status'+(s.done?' ok':s.fail?' err':' hl');}
  }
  makeCtrl(3,build,render);
})();}catch(e){var el=$('s3');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 4: TARJAN
// ============================================================
try{(function(){
  function build(){
    var steps=[],disc=[],low=[],onSt=[],stk=[],sccOf=[],sccs=[],time=0;
    for(var i=0;i<SCCG.n;i++){disc[i]=-1;low[i]=-1;onSt[i]=false;sccOf[i]=-1;}
    function snap(cur,msg,kind){
      steps.push({disc:disc.slice(),low:low.slice(),onSt:onSt.slice(),stk:stk.slice(),sccOf:sccOf.slice(),sccs:sccs.map(function(c){return c.slice();}),cur:cur,msg:msg,kind:kind||''});
    }
    function dfs(u){
      disc[u]=low[u]=++time;stk.push(u);onSt[u]=true;
      snap(u,'Enter '+u+': disc='+disc[u]+', low='+low[u]+' — push to aux stack','enter');
      for(var k=0;k<SCCG.adj[u].length;k++){
        var v=SCCG.adj[u][k];
        if(disc[v]===-1){
          snap(u,'Tree edge '+u+'→'+v+' — recurse','tree');
          dfs(v);
          low[u]=Math.min(low[u],low[v]);
          snap(u,'Return from '+v+': low['+u+'] = min(low['+u+'], low['+v+']) = '+low[u],'low');
        }else if(onSt[v]){
          low[u]=Math.min(low[u],disc[v]);
          snap(u,'Edge '+u+'→'+v+' is on stack: low['+u+'] = min(..., disc['+v+']='+disc[v]+') = '+low[u],'low');
        }else{
          snap(u,'Edge '+u+'→'+v+' already in a closed SCC — ignore','skip');
        }
      }
      if(low[u]===disc[u]){
        var comp=[],w;
        do{w=stk.pop();onSt[w]=false;sccOf[w]=sccs.length;comp.push(w);}while(w!==u);
        sccs.push(comp);
        snap(u,'low['+u+'] = disc['+u+'] = '+disc[u]+' → '+u+' is an SCC ROOT! Pop {'+comp.slice().sort(function(a,b){return a-b;}).join(', ')+'}','scc');
      }else{
        snap(u,'Finish '+u+': low='+low[u]+' ≠ disc='+disc[u]+' — not a root, stays on stack','exit');
      }
    }
    for(var u=0;u<SCCG.n;u++)if(disc[u]===-1){snap(u,'Start DFS from '+u,'root');dfs(u);}
    steps.push({disc:disc,low:low,onSt:onSt,stk:[],sccOf:sccOf,sccs:sccs.map(function(c){return c.slice();}),cur:-1,done:true,
      msg:'Tarjan complete — '+sccs.length+' SCCs: '+sccs.map(function(c){return '{'+c.slice().sort(function(a,b){return a-b;}).join(',')+'}';}).join('  ')});
    return steps;
  }
  function render(s,el){
    if(!s)panelReset('log4','res4');
    var st=s||{disc:[-1,-1,-1,-1,-1,-1],low:[-1,-1,-1,-1,-1,-1],onSt:[],stk:[],sccOf:[],sccs:[],cur:-1};
    drawGraph('svg4',SCCG.nodes,SCCG.edges,true,{
      node:function(i){
        var f='#1a1d3e',sr='#34495e',lf='#667080',bad=[];
        if(st.sccOf[i]!==undefined&&st.sccOf[i]>=0){var col=SCC_COL[st.sccOf[i]%4];f=col+'2e';sr=col;lf=col;}
        else if(st.onSt[i]){f='rgba(255,159,67,.16)';sr='#ff9f43';lf='#ff9f43';}
        if(st.disc[i]>=0)bad.push({pos:'top',text:'d'+st.disc[i],color:'#f1c40f'});
        if(st.low[i]>=0)bad.push({pos:'bottom',text:'l'+st.low[i],color:st.low[i]===st.disc[i]&&st.disc[i]>=0?'#48d0b0':'#00d4ff'});
        if(st.cur===i){f='rgba(241,196,15,.25)';sr='#f1c40f';lf='#f1c40f';}
        return {fill:f,stroke:sr,lf:lf,glow:st.cur===i,badges:bad};
      },
      edge:function(a,b){
        return {color:'#2c3e50',w:1.8,op:.85};
      }
    });
    drawBoxes('q4',st.stk.map(function(id,i){return {t:id,c:i===st.stk.length-1?'cur':'gray'};}));
    drawBoxes('o4',st.sccs.map(function(c,i){return {t:'{'+c.slice().sort(function(a,b){return a-b;}).join(',')+'}',c:'s'+(i%3)};}));
    var sc=$('scc4');
    if(sc){var h='';st.sccs.forEach(function(c,i){h+='<div class="sccc c'+(i%4)+'">SCC '+(i+1)+': {'+c.slice().sort(function(a,b){return a-b;}).join(', ')+'}</div>';});sc.innerHTML=h;}
    if(s){logAdd('log4',s.msg,s.done?'ok':s.fail?'bad':s.kind==='scc'?'ok':s.kind==='low'?'acc':'hl');if(s.done)showRes('res4',s.msg);el.textContent=s.msg;el.className='status'+(s.done?' ok':s.fail?' err':' hl');}
  }
  makeCtrl(4,build,render);
})();}catch(e){var el=$('s4');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 5: KAHN'S ALGORITHM
// ============================================================
try{(function(){
  function build(){
    var steps=[],indeg={},q=[],order=[],relaxed={};
    for(var u=0;u<DAGG.n;u++)indeg[u]=0;
    DAGG.edges.forEach(function(e){indeg[e[1]]++;});
    for(var u=0;u<DAGG.n;u++)if(indeg[u]===0)q.push(u);
    function snap(cur,msg,kind){steps.push({indeg:JSON.parse(JSON.stringify(indeg)),q:q.slice(),order:order.slice(),relaxed:JSON.parse(JSON.stringify(relaxed)),cur:cur,msg:msg,kind:kind||''});}
    snap(-1,'Step 0: compute indegrees ['+Object.keys(indeg).map(function(k){return k+':'+indeg[k];}).join('  ')+']','init');
    snap(-1,'Nodes with indegree 0 have no unmet dependencies → enqueue ['+q.join(', ')+']','init');
    while(q.length){
      var u=q.shift();order.push(u);
      snap(u,'Emit '+u+' — its dependents get one dependency satisfied. Order: ['+order.join(', ')+']','emit');
      for(var k=0;k<DAGG.adj[u].length;k++){
        var v=DAGG.adj[u][k];
        relaxed[edgeKey(u,v)]=true;
        indeg[v]--;
        if(indeg[v]===0){q.push(v);snap(v,'Decrement '+u+'→'+v+': indegree('+v+')=0 → ENQUEUE','enq');}
        else snap(v,'Decrement '+u+'→'+v+': indegree('+v+')='+indeg[v]+' — still blocked','dec');
      }
    }
    if(order.length<DAGG.n){steps.push({indeg:indeg,q:[],order:order.slice(),relaxed:relaxed,cur:-1,fail:true,msg:'Cycle! Only '+order.length+'/'+DAGG.n+' nodes emitted — graph is not a DAG'});return steps;}
    steps.push({indeg:indeg,q:[],order:order.slice(),relaxed:relaxed,cur:-1,done:true,msg:'All '+DAGG.n+' dependencies resolved: '+order.join(' → ')});
    return steps;
  }
  function render(s,el){
    if(!s)panelReset('log5','res5');
    var st=s||{indeg:{},q:[],order:[],relaxed:{},cur:-1};
    drawGraph('svg5',DAGG.nodes,DAGG.edges,true,{
      node:function(i){
        var f='#1a1d3e',sr='#34495e',lf='#667080',bad=[];
        if(st.order.indexOf(i)>=0){f='rgba(72,208,168,.16)';sr='#48d0b0';lf='#48d0b0';}
        else if(st.q.indexOf(i)>=0){f='rgba(255,159,67,.16)';sr='#ff9f43';lf='#ff9f43';}
        if(st.cur===i){f='rgba(241,196,15,.22)';sr='#f1c40f';lf='#f1c40f';}
        var d=st.indeg?st.indeg[i]:undefined;
        if(d!==undefined)bad.push({pos:'bottom',text:'indeg '+d,color:d===0?'#48d0b0':'#ff9f43'});
        var pos=st.order.indexOf(i);if(pos>=0)bad.push({pos:'top',text:'#'+(pos+1),color:'#48d0b0'});
        return {fill:f,stroke:sr,lf:lf,glow:st.cur===i,badges:bad};
      },
      edge:function(a,b){
        if(st.relaxed[edgeKey(a,b)])return {color:'#48d0b0',w:3};
        if(st.cur===a)return {color:'#f1c40f',w:2.5,dash:'5 4'};
        return {color:'#2c3e50',w:1.5,op:.75};
      }
    });
    drawBoxes('q5',st.q.map(function(id){return {t:id,c:'q'+(st.cur===id?' cur':'')};}));
    drawBoxes('o5',st.order.map(function(id){return {t:id,c:'vis'};}));
    if(s){logAdd('log5',s.msg,s.done?'ok':s.fail?'bad':s.kind==='skip'?'':'hl');if(s.done)showRes('res5',s.msg);else if(s.fail)showRes('res5',s.msg,true);el.textContent=s.msg;el.className='status'+(s.done?' ok':s.fail?' err':' hl');}
  }
  makeCtrl(5,build,render);
})();}catch(e){var el=$('s5');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 6: BIPARTITE TESTING
// ============================================================
try{(function(){
  function build(){
    var steps=[],col=[],q=[],order=[],conflict=false;
    for(var i=0;i<UND.n;i++)col[i]=-1;
    function snap(cur,msg,kind){steps.push({col:col.slice(),q:q.slice(),cur:cur,conflict:null,msg:msg,kind:kind||''});}
    function snapC(cur,a,b,msg,kind){steps.push({col:col.slice(),q:q.slice(),cur:cur,conflict:[a,b],msg:msg,kind:kind||''});}
    col[0]=0;q.push(0);
    snap(0,'Color node 0 → Set A (red), enqueue','enq');
    outer:
    while(q.length){
      var u=q.shift();
      snap(u,'Dequeue '+u+' (Set '+(col[u]===0?'A':'B')+') — check its neighbors','deq');
      for(var k=0;k<UND.adj[u].length;k++){
        var v=UND.adj[u][k];
        if(col[v]===-1){
          col[v]=1-col[u];q.push(v);
          snap(v,'Neighbor '+v+' uncolored → opposite set '+(col[v]===0?'A (red)':'B (blue)')+', enqueue','color');
        }else if(col[v]===col[u]){
          conflict=true;
          snapC(v,u,v,'CONFLICT! Edge '+u+'–'+v+' joins two '+('Set '+(col[u]===0?'A':'B'))+' nodes → odd cycle → NOT bipartite','fail');
          break outer;
        }else{
          snap(u,'Edge '+u+'–'+v+': '+v+' already opposite set ✓ bipartite check passes','ok');
        }
      }
    }
    if(conflict){
      steps.push({col:col.slice(),q:[],cur:-1,conflict:steps[steps.length-1].conflict,fail:true,msg:'NOT bipartite — an odd cycle makes two independent sets impossible'});
      return steps;
    }
    var A=[],B=[];for(var i=0;i<UND.n;i++)(col[i]===0?A:B).push(i);
    steps.push({col:col.slice(),q:[],cur:-1,conflict:null,done:true,msg:'BIPARTITE! Set A = {'+A.join(', ')+'}  |  Set B = {'+B.join(', ')+'} — no edge inside either set'});
    return steps;
  }
  function render(s,el){
    if(!s)panelReset('log6','res6');
    var st=s||{col:[-1,-1,-1,-1,-1,-1,-1],q:[],cur:-1,conflict:null};
    drawGraph('svg6',UND.nodes,UND.edges,false,{
      node:function(i){
        var c=st.col[i]===undefined?-1:st.col[i];
        var f='#1a1d3e',sr='#34495e',lf='#667080';
        if(c===0){f='rgba(255,107,107,.18)';sr='#ff6b6b';lf='#ff6b6b';}
        if(c===1){f='rgba(0,212,255,.16)';sr='#00d4ff';lf='#00d4ff';}
        if(st.conflict&&(st.conflict[0]===i||st.conflict[1]===i)){f='rgba(255,107,107,.3)';sr='#ff6b6b';lf='#ff6b6b';}
        if(st.cur===i){f='rgba(241,196,15,.25)';sr='#f1c40f';lf='#f1c40f';}
        var bad=[];
        if(c>=0)bad.push({pos:'bottom',text:'Set '+(c===0?'A':'B'),color:c===0?'#ff6b6b':'#00d4ff'});
        return {fill:f,stroke:sr,lf:lf,glow:st.cur===i||(st.conflict&&st.conflict.indexOf(i)>=0),badges:bad};
      },
      edge:function(a,b){
        if(st.conflict&&((st.conflict[0]===a&&st.conflict[1]===b)||(st.conflict[0]===b&&st.conflict[1]===a)))return {color:'#ff6b6b',w:3.5};
        if(st.col[a]>=0&&st.col[b]>=0&&st.col[a]===st.col[b])return {color:'#ff6b6b',w:3};
        if(st.col[a]>=0&&st.col[b]>=0)return {color:'#48d0b0',w:2.5,op:.9};
        return {color:'#2c3e50',w:1.5,op:.75};
      }
    });
    drawBoxes('q6',st.q.map(function(id){return {t:id,c:'q'+(st.cur===id?' cur':'')};}));
    var A=[],B=[];for(var i=0;i<UND.n;i++){if(st.col[i]===0)A.push(i);else if(st.col[i]===1)B.push(i);}
    var sa=$('setA'),sb=$('setB');
    if(sa)sa.innerHTML=A.map(function(id){return '<div class="chip a">'+id+'</div>';}).join('');
    if(sb)sb.innerHTML=B.map(function(id){return '<div class="chip b">'+id+'</div>';}).join('');
    if(s){logAdd('log6',s.msg,s.done?'ok':s.fail?'bad':s.kind==='ok'?'ok':'hl');if(s.done)showRes('res6',s.msg);else if(s.fail)showRes('res6',s.msg,true);el.textContent=s.msg;el.className='status'+(s.done?' ok':s.fail?' err':' hl');}
  }
  makeCtrl(6,build,render);
})();}catch(e){var el=$('s6');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}
