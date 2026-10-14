'use strict';

function $(id) { return document.getElementById(id); }
var COLORS = ['#ff6b6b','#ff9f43','#f1c40f','#48d0b0','#00d4ff','#9b59b6','#e84393','#fd79a8'];

// ===== SOUND (Web Audio API, no files) =====
var audioCtx = null;
function beep(freq, dur, type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var o = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.value = freq || 440;
    o.type = type || 'sine';
    g.gain.setValueAtTime(0.08, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (dur || 0.15));
    o.start(); o.stop(audioCtx.currentTime + (dur || 0.15));
  } catch(e) {}
}
function sfxStep() { beep(600, 0.1, 'sine'); }
function sfxGood() { beep(880, 0.15, 'sine'); setTimeout(function(){beep(1100,0.12,'sine');},80); }
function sfxDone() { [523,659,784,1047].forEach(function(f,i){setTimeout(function(){beep(f,0.2,'triangle');},i*120);}); }
function sfxBad() { beep(200, 0.2, 'sawtooth'); }

// ===== CONFETTI =====
function confetti() {
  var c = $('confetti');
  if (!c) return;
  for (var i = 0; i < 60; i++) {
    var p = document.createElement('div');
    p.className = 'piece';
    p.style.left = Math.random() * 100 + '%';
    p.style.background = COLORS[i % 8];
    p.style.width = (5 + Math.random() * 8) + 'px';
    p.style.height = (5 + Math.random() * 8) + 'px';
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    p.style.animationDuration = (1.5 + Math.random() * 2) + 's';
    p.style.animationDelay = (Math.random() * 0.5) + 's';
    c.appendChild(p);
    (function(el){ setTimeout(function(){ el.remove(); }, 4000); })(p);
  }
}

// ===== NAVIGATION =====
var currentAlgo = -1;
var homeScreen = $('homeScreen');
var algoScreen = $('algoScreen');
var backBtn = $('backBtn');
var panels = document.querySelectorAll('.panel');
var navButtons = document.querySelectorAll('.greedy-nav-btn');

function openAlgorithm(index) {
  currentAlgo = index;
  homeScreen.style.display = 'none';
  algoScreen.style.display = 'block';
  backBtn.classList.add('show');
  for (var i = 0; i < panels.length; i++) panels[i].classList.remove('on');
  var p = $('p' + currentAlgo);
  if (p) p.classList.add('on');
  navButtons.forEach(function(btn) {
    var active = parseInt(btn.getAttribute('data-a'), 10) === currentAlgo;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-current', active ? 'page' : 'false');
  });
  beep(500, 0.1, 'sine');
}

document.querySelectorAll('.card, .greedy-nav-btn').forEach(function(item) {
  item.addEventListener('click', function() {
    openAlgorithm(parseInt(item.getAttribute('data-a'), 10));
  });
});

backBtn.addEventListener('click', function() {
  stopAll();
  currentAlgo = -1;
  homeScreen.style.display = 'block';
  algoScreen.style.display = 'none';
  backBtn.classList.remove('show');
  navButtons.forEach(function(btn) {
    btn.classList.remove('active');
    btn.setAttribute('aria-current', 'false');
  });
});

function stopAll() {
  for (var i = 0; i < 7; i++) {
    if (ctrls[i] && ctrls[i].stop) ctrls[i].stop();
  }
}

// ===== CONTROLLER FACTORY =====
var ctrls = [];

function makeCtrl(n, buildSteps, render) {
  var steps = [], idx = 0, playing = false, timer = null;
  var speed = 800;
  var btnPlay = $('play' + n);
  var btnStep = $('step' + n);
  var btnReset = $('reset' + n);
  var statusEl = $('s' + n);
  var progEl = $('prog' + n);
  var spdEl = $('spd' + n);
  var spdvEl = $('spdv' + n);

  function updateProg() {
    if (progEl) progEl.style.width = (steps.length ? (idx / steps.length * 100) : 0) + '%';
  }

  function rebuild() {
    steps = buildSteps();
    idx = 0;
    render(null, statusEl);
    statusEl.textContent = 'Press Play or Step to begin';
    statusEl.className = 'status';
    updateProg();
  }

  function doStep() {
    if (idx >= steps.length) return false;
    var s = steps[idx];
    render(s, statusEl);
    statusEl.textContent = s.msg;
    statusEl.className = 'status' + (s.t === 'done' ? ' ok' : ' hl');
    idx++;
    updateProg();
    if (idx >= steps.length) {
      sfxDone();
      if (s.t === 'done') confetti();
      return false;
    }
    sfxStep();
    return true;
  }

  function startPlay() {
    if (playing) return;
    playing = true;
    btnPlay.innerHTML = '⏸ Pause';
    timer = setInterval(function() {
      if (!doStep()) stopPlay();
    }, speed);
  }

  function stopPlay() {
    playing = false;
    clearInterval(timer);
    timer = null;
    btnPlay.innerHTML = '▶ Play';
  }

  function togglePlay() {
    if (playing) stopPlay();
    else startPlay();
  }

  btnPlay.addEventListener('click', togglePlay);
  btnStep.addEventListener('click', function() { if (!playing) doStep(); });
  btnReset.addEventListener('click', function() { stopPlay(); rebuild(); });

  if (spdEl) {
    spdEl.addEventListener('input', function() {
      speed = parseInt(spdEl.value);
      if (spdvEl) spdvEl.textContent = (speed / 1000).toFixed(1) + 's';
      if (playing) { stopPlay(); startPlay(); }
    });
  }

  rebuild();
  var ctrl = { stop: stopPlay };
  ctrls[n] = ctrl;
  return ctrl;
}

// ============================================================
// 0: DIJKSTRA
// ============================================================
try {
  (function() {
    var nodes = [{x:80,y:160},{x:220,y:70},{x:220,y:250},{x:380,y:160},{x:540,y:70},{x:540,y:250}];
    var edges = [
      {u:0,v:1,w:7},{u:0,v:2,w:9},{u:0,v:5,w:14},
      {u:1,v:2,w:10},{u:1,v:3,w:15},{u:2,v:3,w:11},
      {u:2,v:5,w:2},{u:3,v:4,w:6},{u:4,v:5,w:9},{u:3,v:5,w:9}
    ];
    function buildSteps() {
      var dist=[0,Infinity,Infinity,Infinity,Infinity,Infinity],vis=[false,false,false,false,false,false],prev=[-1,-1,-1,-1,-1,-1],steps=[];
      for(var it=0;it<6;it++){var u=-1,best=Infinity;
        for(var i=0;i<6;i++)if(!vis[i]&&dist[i]<best){best=dist[i];u=i;}
        if(u===-1)break;vis[u]=true;
        steps.push({t:'visit',u:u,d:dist.slice(),v:vis.slice(),p:prev.slice(),msg:'Visiting node '+u+' — distance: '+(dist[u]===Infinity?'∞':dist[u])});
        for(var e=0;e<edges.length;e++){var ed=edges[e],n=-1;
          if(ed.u===u&&!vis[ed.v])n=ed.v;else if(ed.v===u&&!vis[ed.u])n=ed.u;
          if(n>=0&&dist[u]+ed.w<dist[n]){dist[n]=dist[u]+ed.w;prev[n]=u;
            steps.push({t:'relax',u:u,v:n,d:dist.slice(),v:vis.slice(),p:prev.slice(),msg:'Relaxing edge '+u+'→'+n+' — node '+n+' dist: '+dist[n]});
          }
        }
      }
      steps.push({t:'done',d:dist,v:vis,p:prev,msg:'Shortest paths from node 0 computed!'});
      return steps;
    }
    function render(s,el){
      var svg=$('svg0');if(!svg)return;
      var d=s?s.d:[0,Infinity,Infinity,Infinity,Infinity,Infinity],vis=s?s.v:[false,false,false,false,false,false],prev=s?s.p:[-1,-1,-1,-1,-1,-1],h='';
      for(var e=0;e<edges.length;e++){var ed=edges[e],a=nodes[ed.u],b=nodes[ed.v];
        var hot=s&&s.t==='relax'&&((s.u===ed.u&&s.v===ed.v)||(s.u===ed.v&&s.v===ed.u));
        var path=prev[ed.v]===ed.u||prev[ed.u]===ed.v;
        var col=hot?'#ff6b6b':path?'#48d0b0':'#2c3e50',sw=hot||path?3.5:1.5;
        var glow=hot?' filter="url(#glowR)"':'';
        h+='<line class="edge-l" x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="'+col+'" stroke-width="'+sw+'"'+glow+'/>';
        h+='<text class="edge-w" x="'+((a.x+b.x)/2)+'" y="'+((a.y+b.y)/2-5)+'" fill="'+(hot?'#ff6b6b':path?'#48d0b0':'#667080')+'" text-anchor="middle">'+ed.w+'</text>';
      }
      for(var i=0;i<6;i++){var n=nodes[i],cur=s&&s.t==='visit'&&s.u===i;
        var fill=cur?'#f1c40f':vis[i]?'#48d0b0':d[i]===Infinity?'#1a1d3e':'#00d4ff';
        var stroke=cur?'#f1c40f':vis[i]?'#48d0b0':'#00d4ff';
        h+='<g class="node-g"><circle cx="'+n.x+'" cy="'+n.y+'" r="26" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2.5"'+(cur?' filter="url(#glowY)"':'')+'/>';
        h+='<text class="node-label" x="'+n.x+'" y="'+(n.y+5)+'" fill="'+(vis[i]||cur?'#060912':'#fff')+'" font-size="14" text-anchor="middle">'+i+'</text>';
        h+='<text class="dist-label" x="'+n.x+'" y="'+(n.y+44)+'" text-anchor="middle" fill="'+(cur?'#f1c40f':'#667080')+'" font-weight="700">'+(d[i]===Infinity?'∞':d[i])+'</text></g>';
      }
      h='<defs><filter id="glowR"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="glowY"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'+h;
      svg.innerHTML=h;
    }
    makeCtrl(0,buildSteps,render);
  })();
} catch(e) { var el=$('s0');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>'; }

// ============================================================
// 1: PRIM
// ============================================================
try {
  (function() {
    var nodes = [{x:80,y:160},{x:220,y:70},{x:220,y:250},{x:380,y:160},{x:540,y:70},{x:540,y:250}];
    var edges = [
      {u:0,v:1,w:7},{u:0,v:2,w:9},{u:0,v:5,w:14},
      {u:1,v:2,w:10},{u:1,v:3,w:15},{u:2,v:3,w:11},
      {u:2,v:5,w:2},{u:3,v:4,w:6},{u:4,v:5,w:9},{u:3,v:5,w:9}
    ];
    function buildSteps(){
      var inT=[true,false,false,false,false,false],mst=[],steps=[];
      for(var i=0;i<5;i++){var best=-1,bw=Infinity;
        for(var e=0;e<edges.length;e++){var ed=edges[e];if(inT[ed.u]!==inT[ed.v]&&ed.w<bw){bw=ed.w;best=e;}}
        if(best===-1)break;var ed=edges[best],to=inT[ed.u]?ed.v:ed.u;
        inT[to]=true;mst.push(best);
        steps.push({t:'add',m:mst.slice(),in:inT.slice(),msg:'Adding edge '+ed.u+'-'+ed.v+' (weight '+ed.w+')'});
      }
      var tw=0;for(var j=0;j<mst.length;j++)tw+=edges[mst[j]].w;
      steps.push({t:'done',m:mst.slice(),in:inT.slice(),msg:'MST complete! Total weight = '+tw});
      return steps;
    }
    function render(s,el){
      var svg=$('svg1');if(!svg)return;
      var mst=s?s.m:[],inT=s?s.in:[true,false,false,false,false,false],last=mst.length>0?mst[mst.length-1]:-1,h='';
      h+='<defs><filter id="glowG"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="glowR2"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
      for(var e=0;e<edges.length;e++){var ed=edges[e],a=nodes[ed.u],b=nodes[ed.v];
        var inM=mst.indexOf(e)>=0,isNew=e===last&&s&&s.t==='add';
        var col=isNew?'#ff6b6b':inM?'#48d0b0':'#2c3e50',sw=isNew?4:inM?2.5:1.5;
        h+='<line class="edge-l" x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="'+col+'" stroke-width="'+sw+'"'+(isNew?' filter="url(#glowR2)"':inM?' filter="url(#glowG)"':'')+'/>';
        h+='<text class="edge-w" x="'+((a.x+b.x)/2)+'" y="'+((a.y+b.y)/2-5)+'" fill="'+col+'" text-anchor="middle">'+ed.w+'</text>';
      }
      for(var i=0;i<6;i++){var n=nodes[i];
        h+='<g class="node-g"><circle cx="'+n.x+'" cy="'+n.y+'" r="26" fill="'+(inT[i]?'#48d0b0':'#1a1d3e')+'" stroke="'+(inT[i]?'#48d0b0':'#34495e')+'" stroke-width="2.5"'+(inT[i]?' filter="url(#glowG)"':'')+'/>';
        h+='<text class="node-label" x="'+n.x+'" y="'+(n.y+5)+'" fill="'+(inT[i]?'#060912':'#667080')+'" font-size="14" text-anchor="middle">'+i+'</text></g>';
      }
      svg.innerHTML=h;
    }
    makeCtrl(1,buildSteps,render);
  })();
} catch(e) { var el=$('s1');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>'; }

// ============================================================
// 2: KRUSKAL
// ============================================================
try {
  (function() {
    var nodes=[{x:80,y:110},{x:220,y:45},{x:220,y:175},{x:380,y:110},{x:540,y:45},{x:540,y:175}];
    var allEdges=[{u:0,v:1,w:7},{u:0,v:2,w:9},{u:0,v:5,w:14},{u:1,v:2,w:10},{u:1,v:3,w:15},{u:2,v:3,w:11},{u:2,v:5,w:2},{u:3,v:4,w:6},{u:4,v:5,w:9},{u:3,v:5,w:9}];
    var sortedCache=[];
    function buildSteps(){
      var sorted=allEdges.slice().sort(function(a,b){return a.w-b.w;});
      sortedCache=sorted;
      var parent=[0,1,2,3,4,5];
      function find(x){while(parent[x]!==x)x=parent[x];return x;}
      var steps=[{t:'sort',shown:0,add:[],rej:[],par:parent.slice(),msg:'Edges sorted by weight: '+sorted.map(function(e){return e.u+'-'+e.v+'('+e.w+')';}).join(', ')}];
      var add=[],rej=[],cnt=0;
      for(var i=0;i<sorted.length&&cnt<5;i++){var ed=sorted[i],ra=find(ed.u),rb=find(ed.v);
        if(ra!==rb){parent[rb]=ra;add.push(i);cnt++;
          steps.push({t:'add',shown:i+1,add:add.slice(),rej:rej.slice(),par:parent.slice(),msg:'✓ Adding edge '+ed.u+'-'+ed.v+' (w='+ed.w+')'});
        }else{rej.push(i);
          steps.push({t:'rej',shown:i+1,add:add.slice(),rej:rej.slice(),par:parent.slice(),msg:'✗ Skipping '+ed.u+'-'+ed.v+' (cycle detected!)'});
        }
      }
      var tw=0;for(var j=0;j<add.length;j++)tw+=sorted[add[j]].w;
      steps.push({t:'done',shown:sorted.length,add:add,rej:rej,par:parent.slice(),msg:'MST complete! Total weight = '+tw});
      return steps;
    }
    function render(s,el){
      var svg=$('svg2');if(!svg)return;
      var shown=s?s.shown:0,add=s?s.add:[],rej=s?s.rej:[],par=s?s.par:[0,1,2,3,4,5];
      var chips='';
      for(var i=0;i<sortedCache.length;i++){var cls='chip ';
        if(add.indexOf(i)>=0)cls+='added';else if(rej.indexOf(i)>=0)cls+='rejected';
        else if(i<shown)cls+='sorted';else cls+='normal';
        chips+='<span class="'+cls+'">'+sortedCache[i].u+'-'+sortedCache[i].v+' (w='+sortedCache[i].w+')</span>';
      }
      $('kEdges').innerHTML=chips;
      var dsu='';
      for(var v=0;v<6;v++){var r=v;while(par[r]!==r)r=par[r];
        dsu+='<div class="ds'+(par[v]===v?' root':'')+'">'+v+'</div>';}
      $('kDSU').innerHTML=dsu;
      var h='<defs><filter id="glowG2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
      for(var e=0;e<sortedCache.length&&e<shown;e++){var ed=sortedCache[e],a=nodes[ed.u],b=nodes[ed.v];
        var isA=add.indexOf(e)>=0,isR=rej.indexOf(e)>=0;
        var col=isA?'#48d0b0':isR?'#ff6b6b':'#2c3e50',sw=isA?3.5:isR?1:2;
        var dash=isR?' stroke-dasharray="4,3"':'';
        h+='<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="'+col+'" stroke-width="'+sw+'"'+dash+(isA?' filter="url(#glowG2)"':'')+'/>';
        h+='<text class="edge-w" x="'+((a.x+b.x)/2)+'" y="'+((a.y+b.y)/2-5)+'" fill="'+col+'" text-anchor="middle">'+ed.w+'</text>';
      }
      for(var i2=0;i2<6;i2++){var n=nodes[i2],inM=false;
        for(var a2=0;a2<add.length;a2++){var ed2=sortedCache[add[a2]];if(ed2.u===i2||ed2.v===i2)inM=true;}
        h+='<g class="node-g"><circle cx="'+n.x+'" cy="'+n.y+'" r="23" fill="'+(inM?'#48d0b0':'#1a1d3e')+'" stroke="'+(inM?'#48d0b0':'#34495e')+'" stroke-width="2.5"'+(inM?' filter="url(#glowG2)"':'')+'/>';
        h+='<text class="node-label" x="'+n.x+'" y="'+(n.y+5)+'" fill="'+(inM?'#060912':'#667080')+'" font-size="13" text-anchor="middle">'+i2+'</text></g>';
      }
      svg.innerHTML=h;
    }
    makeCtrl(2,buildSteps,render);
  })();
} catch(e) { var el=$('s2');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>'; }

// ============================================================
// 3: HUFFMAN
// ============================================================
try {
  (function() {
    var text='greedy algorithm';
    function buildSteps(){
      var freq={};
      for(var i=0;i<text.length;i++){var c=text[i];if(c===' ')c='␣';freq[c]=(freq[c]||0)+1;}
      var keys=Object.keys(freq),pool=[];
      for(var i=0;i<keys.length;i++)pool.push({ch:keys[i],f:freq[keys[i]],left:null,right:null});
      var steps=[{t:'freq',freq:freq,tree:null,msg:'Character frequencies: '+keys.map(function(k){return k+':'+freq[k];}).join('  ')}];
      while(pool.length>1){
        pool.sort(function(a,b){return a.f-b.f;});
        var l=pool.shift(),r=pool.shift(),p={ch:'·',f:l.f+r.f,left:l,right:null};
        p.right=r;pool.push(p);
        steps.push({t:'merge',freq:freq,tree:pool.length===1?p:null,l:l.ch,r:r.ch,f:p.f,msg:'Merging "'+l.ch+'"('+l.f+') + "'+r.ch+'"('+r.f+') → '+p.f});
      }
      var codes={};
      (function assign(node,code){if(!node)return;if(!node.left&&!node.right){codes[node.ch]=code||'0';return;}assign(node.left,code+'0');assign(node.right,code+'1');})(pool[0],'');
      steps.push({t:'done',freq:freq,tree:pool[0],codes:codes,msg:'Huffman tree complete!'});
      return steps;
    }
    function drawTree(tree){
      var svg=$('svg3');if(!svg)return;
      if(!tree){svg.innerHTML='';return;}
      var pos=0,h='';
      function layout(node,depth){
        if(!node)return null;
        if(!node.left&&!node.right){var x=40+pos*42;pos++;return{x:x,y:25+depth*50,node:node};}
        var lp=layout(node.left,depth+1),rp=layout(node.right,depth+1);
        return{x:(lp.x+rp.x)/2,y:25+depth*50,node:node,lp:lp,rp:rp};
      }
      function draw(p){
        if(!p)return;
        if(p.lp){h+='<line x1="'+p.x+'" y1="'+p.y+'" x2="'+p.lp.x+'" y2="'+p.lp.y+'" stroke="#00d4ff" stroke-width="2"/>';
          h+='<text x="'+((p.x+p.lp.x)/2-6)+'" y="'+((p.y+p.lp.y)/2)+'" fill="#00d4ff" font-size="10" font-weight="700">0</text>';draw(p.lp);}
        if(p.rp){h+='<line x1="'+p.x+'" y1="'+p.y+'" x2="'+p.rp.x+'" y2="'+p.rp.y+'" stroke="#ff6b6b" stroke-width="2"/>';
          h+='<text x="'+((p.x+p.rp.x)/2+6)+'" y="'+((p.y+p.rp.y)/2)+'" fill="#ff6b6b" font-size="10" font-weight="700">1</text>';draw(p.rp);}
        var leaf=!p.node.left&&!p.node.right;
        h+='<circle cx="'+p.x+'" cy="'+p.y+'" r="16" fill="'+(leaf?'#f1c40f':'#1a1d3e')+'" stroke="'+(leaf?'#f1c40f':'#00d4ff')+'" stroke-width="2.5"'+(leaf?' filter="url(#glowY2)"':'')+'/>';
        h+='<text x="'+p.x+'" y="'+(p.y+4)+'" fill="'+(leaf?'#060912':'#fff')+'" font-size="10" text-anchor="middle" font-weight="700">'+p.node.ch+'</text>';
        if(!leaf)h+='<text x="'+p.x+'" y="'+(p.y-21)+'" fill="#667080" font-size="9" text-anchor="middle">'+p.node.f+'</text>';
      }
      h='<defs><filter id="glowY2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'+h;
      draw(layout(tree,0));svg.innerHTML=h;
    }
    function render(s,el){
      if(!s){$('hFreq').innerHTML='';drawTree(null);$('hResult').classList.remove('show');return;}
      var chips='',keys=Object.keys(s.freq);
      for(var i=0;i<keys.length;i++){var c=keys[i],hl=(s.t==='merge'&&(s.l===c||s.r===c));
        chips+='<span class="chip'+(hl?' active':'')+'" style="background:'+COLORS[i%8]+';color:#060912">'+c+' : '+s.freq[c]+'</span>';}
      $('hFreq').innerHTML=chips;
      if(s.tree)drawTree(s.tree);
      if(s.t==='done'&&s.codes){var html='<b>Codes:</b> ',ck=Object.keys(s.codes);
        for(var j=0;j<ck.length;j++)html+='<span style="margin:0 6px">"'+ck[j]+'"→<span style="color:#f1c40f;font-family:monospace;font-weight:700">'+s.codes[ck[j]]+'</span></span>';
        $('hResult').innerHTML=html;$('hResult').classList.add('show');}
    }
    makeCtrl(3,buildSteps,render);
  })();
} catch(e) { var el=$('s3');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>'; }

// ============================================================
// 4: FRACTIONAL KNAPSACK
// ============================================================
try {
  (function() {
    var CAP=50,items=[{n:'A',w:10,v:60},{n:'B',w:20,v:100},{n:'C',w:30,v:120}];
    function buildSteps(){
      var sorted=items.map(function(it){return{n:it.n,w:it.w,v:it.v,ratio:it.v/it.w,taken:0};});
      sorted.sort(function(a,b){return b.ratio-a.ratio;});
      var steps=[{t:'sort',items:sorted,cap:0,val:0,msg:'Sorted by ratio — A:'+(60/10).toFixed(1)+', B:'+(100/20).toFixed(1)+', C:'+(120/30).toFixed(1)}];
      var cap=0,val=0;
      for(var i=0;i<sorted.length;i++){var it=sorted[i];
        if(cap>=CAP){steps.push({t:'skip',items:sorted,cap:cap,val:val,msg:'Capacity full — skipping "'+it.n+'"'});continue;}
        var rem=CAP-cap;
        if(it.w<=rem){cap+=it.w;val+=it.v;it.taken=1;
          steps.push({t:'take',items:sorted,cap:cap,val:val,msg:'Taking ALL of "'+it.n+'" (w='+it.w+', v='+it.v+')'});}
        else{var frac=rem/it.w,addV=Math.round(it.v*frac);cap+=rem;val+=addV;it.taken=frac;
          steps.push({t:'frac',items:sorted,cap:cap,val:val,msg:'Taking '+Math.round(frac*100)+'% of "'+it.n+'" (v=+'+addV+')'});}
      }
      steps.push({t:'done',items:sorted,cap:cap,val:val,msg:'Maximum value = '+val});
      return steps;
    }
    function render(s,el){
      if(!s){$('kItems').innerHTML='';$('knapContent').innerHTML='';$('kCap').textContent='0 / '+CAP;$('kVal').textContent='0';$('kResult').classList.remove('show');$('knapBox').className='box';return;}
      var html='';
      for(var i=0;i<s.items.length;i++){var it=s.items[i];
        var cls='row'+(it.taken===1?' ok':it.taken>0?' hl':'');
        html+='<div class="'+cls+'"><span style="width:90px;font-weight:700">'+it.n+': w='+it.w+', v='+it.v+'</span><span style="color:var(--gold)">ratio='+it.ratio.toFixed(1)+'</span>';
        if(it.taken>0)html+='<span style="color:var(--green);font-weight:700;margin-left:auto">'+Math.round(it.taken*100)+'%</span>';
        html+='</div>';}
      $('kItems').innerHTML=html;
      $('kCap').textContent=s.cap+' / '+CAP;
      $('kVal').textContent=s.val;
      $('knapBox').className='box'+(s.cap>0?' full':'');
      var inner='';
      for(var j=0;j<s.items.length;j++){var it2=s.items[j];
        if(it2.taken>0){inner+='<div class="row ok" style="margin-bottom:4px"><span>'+it2.n+(it2.taken<1?' ('+Math.round(it2.taken*100)+'%)':'')+'</span><span style="margin-left:auto">w='+Math.round(it2.w*it2.taken)+', v='+Math.round(it2.v*it2.taken)+'</span></div>';}}
      $('knapContent').innerHTML=inner||'<div style="color:var(--dim);font-size:.8rem;text-align:center;padding-top:30px">Empty</div>';
      if(s.t==='done'){$('kResult').textContent='Maximum value: '+s.val;$('kResult').classList.add('show');}
    }
    makeCtrl(4,buildSteps,render);
  })();
} catch(e) { var el=$('s4');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>'; }

// ============================================================
// 5: JOB SEQUENCING
// ============================================================
try {
  (function() {
    var jobs=[{n:'J1',d:4,p:20},{n:'J2',d:1,p:10},{n:'J3',d:1,p:40},{n:'J4',d:1,p:35},{n:'J5',d:2,p:25}],maxD=4;
    function buildSteps(){
      var sorted=jobs.slice().sort(function(a,b){return b.p-a.p;});
      var steps=[{t:'sort',sorted:sorted,slots:[null,null,null,null,null],placed:[],rej:[],msg:'Sorted by profit: '+sorted.map(function(j){return j.n+'('+j.p+')';}).join(', ')}];
      var slots=[null,null,null,null,null],placed=[],rej=[];
      for(var i=0;i<sorted.length;i++){var job=sorted[i],slot=-1;
        for(var t=Math.min(job.d,maxD);t>=1;t--){if(!slots[t]){slot=t;break;}}
        if(slot>0){slots[slot]=job;placed.push(i);
          steps.push({t:'place',sorted:sorted,slots:slots.slice(),placed:placed.slice(),rej:rej.slice(),msg:'Placing '+job.n+' in slot '+slot+' (profit='+job.p+')'});}
        else{rej.push(i);
          steps.push({t:'rej',sorted:sorted,slots:slots.slice(),placed:placed.slice(),rej:rej.slice(),msg:'Skipping '+job.n+' — no slot before deadline '+job.d});}
      }
      var tp=0;for(var s=1;s<=maxD;s++)if(slots[s])tp+=slots[s].p;
      steps.push({t:'done',sorted:sorted,slots:slots,placed:placed,rej:rej,msg:'Maximum profit = '+tp});
      return steps;
    }
    function render(s,el){
      if(!s){$('jJobs').innerHTML='';$('jSlots').innerHTML='';$('jResult').classList.remove('show');return;}
      var html='';
      for(var i=0;i<s.sorted.length;i++){var job=s.sorted[i];
        var cls='row'+(s.placed.indexOf(i)>=0?' ok':s.rej.indexOf(i)>=0?' bad':'');
        html+='<div class="'+cls+'"><span style="width:36px;font-weight:700">'+job.n+'</span><span style="color:var(--dim)">deadline='+job.d+'</span><span style="color:var(--gold);margin-left:auto">profit='+job.p+'</span></div>';}
      $('jJobs').innerHTML=html;
      var sg='';
      for(var t=1;t<=maxD;t++){var f=s.slots[t];
        sg+='<div class="slot'+(f?' fill':'')+'">'+(f?f.n:'slot '+t)+'</div>';}
      $('jSlots').innerHTML=sg;
      if(s.t==='done'){var tp=0;for(var q=1;q<=maxD;q++)if(s.slots[q])tp+=s.slots[q].p;
        $('jResult').textContent='Maximum profit: '+tp;$('jResult').classList.add('show');}
    }
    makeCtrl(5,buildSteps,render);
  })();
} catch(e) { var el=$('s5');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>'; }

// ============================================================
// 6: ACTIVITY SELECTION
// ============================================================
try {
  (function() {
    var acts=[{n:'A1',s:1,e:3},{n:'A2',s:2,e:5},{n:'A3',s:4,e:7},{n:'A4',s:1,e:8},{n:'A5',s:5,e:9},{n:'A6',s:8,e:11},{n:'A7',s:9,e:12},{n:'A8',s:11,e:14}],MAX_T=15;
    function buildSteps(){
      var sorted=acts.slice().sort(function(a,b){return a.e-b.e;});
      var steps=[{t:'sort',sorted:sorted,sel:[],rej:[],lastE:0,msg:'Sorted by finish time: '+sorted.map(function(a){return a.n+'('+a.e+')';}).join(', ')}];
      var sel=[],rej=[],lastE=0;
      for(var i=0;i<sorted.length;i++){var a=sorted[i];
        if(a.s>=lastE){sel.push(i);lastE=a.e;
          steps.push({t:'sel',sorted:sorted,sel:sel.slice(),rej:rej.slice(),lastE:lastE,msg:'Selecting '+a.n+' ['+a.s+','+a.e+') — starts after '+lastE});}
        else{rej.push(i);
          steps.push({t:'rej',sorted:sorted,sel:sel.slice(),rej:rej.slice(),lastE:lastE,msg:'Skipping '+a.n+' — starts at '+a.s+' < last end '+lastE});}
      }
      steps.push({t:'done',sorted:sorted,sel:sel,rej:rej,msg:'Selected '+sel.length+' activities (maximum)'});
      return steps;
    }
    function render(s,el){
      if(!s){$('aActs').innerHTML='';$('aTimeline').innerHTML='';$('aResult').classList.remove('show');return;}
      var html='';
      for(var i=0;i<s.sorted.length;i++){var a=s.sorted[i];
        var cls='row'+(s.sel.indexOf(i)>=0?' ok':s.rej.indexOf(i)>=0?' bad':'');
        html+='<div class="'+cls+'"><span style="width:36px;font-weight:700">'+a.n+'</span><span style="color:var(--dim)">['+a.s+', '+a.e+')</span>'+(s.sel.indexOf(i)>=0?'<span style="color:var(--green);margin-left:auto;font-weight:700">SELECTED</span>':'')+'</div>';}
      $('aActs').innerHTML=html;
      var tl='';
      for(var t=0;t<MAX_T;t++){var color='rgba(15,15,39,.8)',lbl='';
        for(var j=0;j<s.sorted.length;j++){if(s.sorted[j].s<=t&&t<s.sorted[j].e){if(s.sel.indexOf(j)>=0){color=COLORS[j%8];lbl=s.sorted[j].n;}}}
        tl+='<div class="tl-bar'+(lbl?' on':'')+'" style="left:'+(t/MAX_T*100)+'%;width:'+(100/MAX_T)+'%;background:'+color+'">'+(t%5===0?t:'')+'</div>';}
      $('aTimeline').innerHTML=tl;
      if(s.t==='done'){var names=s.sel.map(function(x){return s.sorted[x].n;}).join(', ');
        $('aResult').textContent='Selected '+s.sel.length+': '+names;$('aResult').classList.add('show');}
    }
    makeCtrl(6,buildSteps,render);
  })();
} catch(e) { var el=$('s6');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>'; }
