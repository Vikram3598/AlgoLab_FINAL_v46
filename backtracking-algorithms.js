'use strict';
function $(id){return document.getElementById(id);}
var COLORS=['#ff6b6b','#ff9f43','#f1c40f','#48d0b0','#00d4ff','#9b59b6','#e84393','#fd79a8'];

// SOUND
var actx=null;
function beep(f,d,t){try{if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();var o=actx.createOscillator(),g=actx.createGain();o.connect(g);g.connect(actx.destination);o.frequency.value=f||440;o.type=t||'sine';g.gain.setValueAtTime(.07,actx.currentTime);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+(d||.12));o.start();o.stop(actx.currentTime+(d||.12));}catch(e){}}
function sfxStep(){beep(550,.08,'sine');}
function sfxGood(){beep(880,.12,'sine');setTimeout(function(){beep(1100,.1,'sine');},70);}
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
function stopAll(){for(var i=0;i<6;i++){if(ctrls[i]&&ctrls[i].stop)ctrls[i].stop();}}

// CONTROLLER
function makeCtrl(n,buildSteps,render){
  var steps=[],idx=0,playing=false,timer=null,speed=500;
  var btnPlay=$('play'+n),btnStep=$('step'+n),btnReset=$('reset'+n);
  var statusEl=$('s'+n),progEl=$('prog'+n),spdEl=$('spd'+n),spdvEl=$('spdv'+n);
  function upProg(){if(progEl)progEl.style.width=(steps.length?idx/steps.length*100:0)+'%';}
  function rebuild(){steps=buildSteps();idx=0;document.querySelectorAll('.log').forEach(function(el){el.innerHTML='';});document.querySelectorAll('.result').forEach(function(el){el.classList.remove('show');el.textContent='';});document.querySelectorAll('.subsets').forEach(function(el){el.innerHTML='';});render(null,statusEl);statusEl.textContent='Press Play or Step to begin';statusEl.className='status';upProg();}
  function doStep(){
    if(idx>=steps.length)return false;
    var s=steps[idx];render(s,statusEl);
    statusEl.textContent=s.msg;statusEl.className='status'+(s.done?' ok':s.fail?' err':' hl');
    idx++;upProg();
    if(idx>=steps.length){sfxDone();if(s.done)confetti();return false;}
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

// ============================================================
// 0: N-QUEENS
// ============================================================
try{(function(){
  var N=4;
  function solve(){
    var board=[];for(var i=0;i<N;i++){board[i]=[];for(var j=0;j<N;j++)board[i][j]=0;}
    var steps=[];
    function isSafe(r,c){
      for(var i=0;i<c;i++)if(board[r][i])return false;
      for(var i=r-1,j=c-1;i>=0&&j>=0;i--,j--)if(board[i][j])return false;
      for(var i=r+1,j=c-1;i<N&&j>=0;i++,j--)if(board[i][j])return false;
      return true;
    }
    function bt(col){
      if(col>=N){
        var b=board.map(function(r){return r.slice();});
        steps.push({board:b,queen:-1,done:true,msg:'Solution found!'});
        return true;
      }
      for(var row=0;row<N;row++){
        var safe=isSafe(row,col);
        var b=board.map(function(r){return r.slice();});
        if(safe){
          board[row][col]=1;
          steps.push({board:board.map(function(r){return r.slice();}),queen:[row,col],ok:true,msg:'Place queen at ('+row+','+col+') — safe!'});
          if(bt(col+1))return true;
          board[row][col]=0;
          steps.push({board:board.map(function(r){return r.slice();}),queen:[row,col],fail:true,msg:'Backtrack! Queen at ('+row+','+col+') conflicts — remove it'});
        }else{
          steps.push({board:board.map(function(r){return r.slice();}),queen:[row,col],fail:true,skip:true,msg:'Cannot place queen at ('+row+','+col+') — attack detected!'});
        }
      }
      return false;
    }
    bt(0);
    return steps;
  }
  function buildSteps(){return solve();}
  function render(s,el){
    var b=s?s.board:(function(){var br=[];for(var i=0;i<N;i++){br[i]=[];for(var j=0;j<N;j++)br[i][j]=0;}return br;})();
    var cur=s?s.queen:null;
    var h='<div class="board" style="grid-template-columns:repeat('+N+',44px)">';
    for(var r=0;r<N;r++)for(var c=0;c<N;c++){
      var cls='cell'+((r+c)%2?' dark':'');
      if(b[r][c])cls+=' placed';
      if(cur&&cur[0]===r&&cur[1]===c)cls=s.fail?' conflict':' cur';
      var ch=b[r][c]?'♛':'';
      if(cur&&cur[0]===r&&cur[1]===c&&!b[r][c])ch='♛';
      h+='<div class="'+cls+'">'+ch+'</div>';
    }
    $('nqBoard').innerHTML=h+'</div>';
    if(s){
      var log=$('nqLog');
      log.innerHTML+='<div class="log-line '+(s.done?'ok':s.fail?'bad':'hl')+'">'+s.msg+'</div>';
      log.scrollTop=log.scrollHeight;
      if(s.done){$('nqResult').textContent=s.msg;$('nqResult').classList.add('show');}
      el.textContent=s.msg;el.className='status'+(s.done?' ok':s.fail?' err':' hl');
    }
  }
  makeCtrl(0,buildSteps,render);
})();}catch(e){var el=$('s0');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 1: RAT IN MAZE
// ============================================================
try{(function(){
  var N=4;
  var maze=[[1,0,0,0],[1,1,0,1],[0,1,0,0],[1,1,1,1]];
  function solve(){
    var sol=[];for(var i=0;i<N;i++){sol[i]=[];for(var j=0;j<N;j++)sol[i][j]=0;}
    sol[0][0]=1;
    var steps=[],vis=[];
    for(var i=0;i<N;i++){vis[i]=[];for(var j=0;j<N;j++)vis[i][j]=0;}
    vis[0][0]=1;
    function bt(r,c){
      if(r===N-1&&c===N-1){
        steps.push({sol:sol.map(function(x){return x.slice();}),vis:vis.map(function(x){return x.slice();}),cur:[r,c],done:true,msg:'Path found! Reached ('+r+','+c+')'});
        return true;
      }
      var dirs=[[0,1,'right'],[1,0,'down'],[0,-1,'left'],[-1,0,'up']];
      for(var d=0;d<4;d++){
        var nr=r+dirs[d][0],nc=c+dirs[d][1];
        if(nr>=0&&nr<N&&nc>=0&&nc<N&&maze[nr][nc]===1&&!vis[nr][nc]){
          vis[nr][nc]=1;sol[nr][nc]=1;
          steps.push({sol:sol.map(function(x){return x.slice();}),vis:vis.map(function(x){return x.slice();}),cur:[nr,nc],ok:true,msg:'Move '+dirs[d][2]+' to ('+nr+','+nc+')'});
          if(bt(nr,nc))return true;
          vis[nr][nc]=0;sol[nr][nc]=0;
          steps.push({sol:sol.map(function(x){return x.slice();}),vis:vis.map(function(x){return x.slice();}),cur:[r,c],fail:true,msg:'Backtrack from ('+nr+','+nc+') — no path ahead'});
        }
      }
      return false;
    }
    bt(0,0);
    return steps;
  }
  function buildSteps(){return solve();}
  function render(s,el){
    var sol=s?s.sol:null,vis=s?s.vis:null,cur=s?s.cur:null;
    var h='<div class="maze" style="grid-template-columns:repeat('+N+',44px)">';
    for(var r=0;r<N;r++)for(var c=0;c<N;c++){
      var cls='m-cell';
      if(maze[r][c]===0)cls+=' wall';
      else if(vis&&vis[r][c])cls+=' visited';
      if(s&&s.done&&sol&&sol[r][c])cls+=' sol';
      if(cur&&cur[0]===r&&cur[1]===c)cls=' m-cell '+(maze[r][c]===0?'wall':'cur');
      if(r===0&&c===0)cls+=' start';
      if(r===N-1&&c===N-1)cls+=' end';
      var ch='';
      if(r===0&&c===0)ch='S';
      if(r===N-1&&c===N-1)ch='E';
      if(cur&&cur[0]===r&&cur[1]===c)ch='🐀';
      h+='<div class="'+cls+'">'+ch+'</div>';
    }
    $('mazeBoard').innerHTML=h+'</div>';
    if(s){
      var log=$('mazeLog');
      log.innerHTML+='<div class="log-line '+(s.done?'ok':s.fail?'bad':'hl')+'">'+s.msg+'</div>';
      log.scrollTop=log.scrollHeight;
      if(s.done){$('mazeResult').textContent=s.msg;$('mazeResult').classList.add('show');}
      el.textContent=s.msg;el.className='status'+(s.done?' ok':s.fail?' err':' hl');
    }
  }
  makeCtrl(1,buildSteps,render);
})();}catch(e){var el=$('s1');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 2: SUDOKU
// ============================================================
try{(function(){
  var puzzle=[
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9]
  ];
  var given=puzzle.map(function(r){return r.map(function(v){return v!==0;});});
  function solve(){
    var board=puzzle.map(function(r){return r.slice();});
    var steps=[];
    function valid(b,r,c,v){
      for(var i=0;i<9;i++)if(b[r][i]===v)return false;
      for(var i=0;i<9;i++)if(b[i][c]===v)return false;
      var br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;
      for(var i=br;i<br+3;i++)for(var j=bc;j<bc+3;j++)if(b[i][j]===v)return false;
      return true;
    }
    function bt(){
      for(var r=0;r<9;r++)for(var c=0;c<9;c++){
        if(board[r][c]===0){
          for(var v=1;v<=9;v++){
            if(valid(board,r,c,v)){
              board[r][c]=v;
              steps.push({board:board.map(function(x){return x.slice();}),cur:[r,c],val:v,ok:true,msg:'Place '+v+' at ('+r+','+c+')'});
              if(bt())return true;
              board[r][c]=0;
              steps.push({board:board.map(function(x){return x.slice();}),cur:[r,c],val:0,fail:true,msg:'Backtrack ('+r+','+c+') — '+v+' doesn\'t work'});
            }else{
              steps.push({board:board.map(function(x){return x.slice();}),cur:[r,c],val:v,fail:true,skip:true,msg:'Cannot place '+v+' at ('+r+','+c+') — conflict'});
            }
          }
          return false;
        }
      }
      steps.push({board:board.map(function(x){return x.slice();}),done:true,msg:'Sudoku solved!'});
      return true;
    }
    bt();
    return steps;
  }
  function buildSteps(){return solve();}
  function render(s,el){
    var b=s?s.board:puzzle;
    var cur=s?s.cur:null;
    var h='<div class="sudoku">';
    for(var r=0;r<9;r++)for(var c=0;c<9;c++){
      var cls='s-cell';
      if(given[r][c])cls+=' given';
      else if(b[r][c])cls+=' filled';
      if(cur&&cur[0]===r&&cur[1]===c)cls=s.fail&&!s.skip?' fail':' cur';
      if(r%3===0&&r>0)cls+=' h3';
      if(c%3===0&&c>0)cls+=' h3';
      h+='<div class="'+cls+'">'+(b[r][c]||'')+'</div>';
    }
    $('sudokuBoard').innerHTML=h+'</div>';
    if(s){
      var log=$('sudokuLog');
      log.innerHTML+='<div class="log-line '+(s.done?'ok':s.fail?'bad':'hl')+'">'+s.msg+'</div>';
      log.scrollTop=log.scrollHeight;
      if(s.done){$('sudokuResult').textContent=s.msg;$('sudokuResult').classList.add('show');}
      el.textContent=s.msg;el.className='status'+(s.done?' ok':s.fail?' err':' hl');
    }
  }
  makeCtrl(2,buildSteps,render);
})();}catch(e){var el=$('s2');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 3: GRAPH COLORING
// ============================================================
try{(function(){
  var V=4,M=3;
  var adj=[[1,2,3],[0,2],[0,3],[0,2]]; // edges
  var nodes=[{x:150,y:80},{x:500,y:80},{x:150,y:230},{x:500,y:230}];
  var edges=[[0,1],[0,2],[0,3],[1,2],[2,3]];
  function solve(){
    var color=[];for(var i=0;i<V;i++)color[i]=-1;
    var colorNames=['Red','Blue','Green','Purple'];
    var steps=[];
    function safe(v,c){
      for(var i=0;i<V;i++)if(adj[v].indexOf(i)>=0&&color[i]===c)return false;
      return true;
    }
    function bt(v){
      if(v>=V){
        steps.push({color:color.slice(),done:true,msg:'Coloring found with '+M+' colors!'});
        return true;
      }
      for(var c=0;c<M;c++){
        if(safe(v,c)){
          color[v]=c;
          steps.push({color:color.slice(),cur:v,ok:true,msg:'Color vertex '+v+' with color '+c+' ('+colorNames[c]+')'});
          if(bt(v+1))return true;
          color[v]=-1;
          steps.push({color:color.slice(),cur:v,fail:true,msg:'Backtrack vertex '+v+' — color '+c+' fails later'});
        }else{
          steps.push({color:color.slice(),cur:v,fail:true,skip:true,msg:'Vertex '+v+' cannot use color '+c+' (conflict)'});
        }
      }
      return false;
    }
    bt(0);
    return steps;
  }
  function buildSteps(){return solve();}
  function render(s,el){
    var svg=$('svg3');if(!svg)return;
    var col=s?s.color:[-1,-1,-1,-1];
    var cur=s?s.cur:-1;
    var colorNames=['Red','Blue','Green','Purple'];
    var colorHex=['#ff6b6b','#00d4ff','#48d0b0','#9b59b6'];
    var h='<defs><filter id="gcg"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    for(var e=0;e<edges.length;e++){
      var a=nodes[edges[e][0]],b=nodes[edges[e][1]];
      h+='<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="#2c3e50" stroke-width="2"/>';
    }
    for(var i=0;i<V;i++){
      var n=nodes[i];
      var c=col[i];
      var fill=c>=0?colorHex[c]:'#1a1d3e';
      var stroke=c>=0?colorHex[c]:'#34495e';
      var isCur=i===cur;
      h+='<g class="node-g"><circle cx="'+n.x+'" cy="'+n.y+'" r="30" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3"'+(isCur?' filter="url(#gcg)"':'')+'/>';
      h+='<text x="'+n.x+'" y="'+(n.y+6)+'" fill="'+(c>=0?'#060912':'#667080')+'" font-size="16" text-anchor="middle" font-weight="700">'+i+'</text>';
      if(c>=0)h+='<text x="'+n.x+'" y="'+(n.y+50)+'" fill="'+colorHex[c]+'" font-size="12" text-anchor="middle" font-weight="600">'+colorNames[c]+'</text>';
      h+='</g>';
    }
    // legend
    for(var i=0;i<M;i++){
      h+='<circle cx="'+(40+i*100)+'" cy="290" r="8" fill="'+colorHex[i]+'"/>';
      h+='<text x="'+(55+i*100)+'" y="295" fill="#667080" font-size="11">'+colorNames[i]+'</text>';
    }
    svg.innerHTML=h;
    if(s){
      var log=$('gcLog');
      log.innerHTML+='<div class="log-line '+(s.done?'ok':s.fail?'bad':'hl')+'">'+s.msg+'</div>';
      log.scrollTop=log.scrollHeight;
      if(s.done){$('gcResult').textContent=s.msg;$('gcResult').classList.add('show');}
      el.textContent=s.msg;el.className='status'+(s.done?' ok':s.fail?' err':' hl');
    }
  }
  makeCtrl(3,buildSteps,render);
})();}catch(e){var el=$('s3');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 4: HAMILTONIAN CYCLE
// ============================================================
try{(function(){
  var V=5;
  var adj=[[1,3,4],[0,2,4],[1,3],[0,2,4],[0,1,3]];
  var edges=[[0,1],[1,2],[2,3],[0,3],[0,4],[1,4],[3,4]];
  var nodes=[{x:325,y:50},{x:520,y:170},{x:420,y:280},{x:180,y:280},{x:100,y:140}];
  function solve(){
    var path=[0],inPath=[];for(var i=0;i<V;i++)inPath[i]=false;
    inPath[0]=true;
    var steps=[];
    function bt(v){
      if(path.length===V){
        if(adj[v].indexOf(0)>=0){
          steps.push({path:path.slice(),done:true,msg:'Hamiltonian cycle found: '+path.concat([0]).join(' → ')});
          return true;
        }
        steps.push({path:path.slice(),fail:true,msg:'All vertices visited but can\'t return to start from '+v});
        return false;
      }
      for(var i=0;i<V;i++){
        if(adj[v].indexOf(i)>=0&&!inPath[i]){
          path.push(i);inPath[i]=true;
          steps.push({path:path.slice(),cur:i,ok:true,msg:'Add vertex '+i+' to path ('+path.join('→')+')'});
          if(bt(i))return true;
          path.pop();inPath[i]=false;
          steps.push({path:path.slice(),cur:v,fail:true,msg:'Backtrack from '+i+' — dead end, path: '+path.join('→')});
        }
      }
      steps.push({path:path.slice(),cur:v,fail:true,msg:'No unvisited neighbor from '+v+' — backtrack'});
      return false;
    }
    bt(0);
    return steps;
  }
  function buildSteps(){return solve();}
  function render(s,el){
    var svg=$('svg4');if(!svg)return;
    var path=s?s.path:[0];
    var cur=s?s.cur:-1;
    var h='<defs><filter id="hg"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    // edges
    for(var e=0;e<edges.length;e++){
      var a=nodes[edges[e][0]],b=nodes[edges[e][1]];
      var onPath=false;
      for(var i=0;i<path.length-1;i++)if((path[i]===edges[e][0]&&path[i+1]===edges[e][1])||(path[i]===edges[e][1]&&path[i+1]===edges[e][0]))onPath=true;
      if(path.length>1&&((path[0]===edges[e][0]&&path[path.length-1]===edges[e][1])||(path[0]===edges[e][1]&&path[path.length-1]===edges[e][0])))onPath=s&&s.done;
      var col=onPath?'#48d0b0':'#2c3e50',sw=onPath?3:1.5;
      h+='<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="'+col+'" stroke-width="'+sw+'"/>';
    }
    // nodes
    for(var i=0;i<V;i++){
      var n=nodes[i],idx=path.indexOf(i);
      var inP=idx>=0,isCur=i===cur;
      var fill=inP?(s&&s.done?'#48d0b0':'#00d4ff'):'#1a1d3e';
      var stroke=inP?(s&&s.done?'#48d0b0':'#00d4ff'):'#34495e';
      h+='<g class="node-g"><circle cx="'+n.x+'" cy="'+n.y+'" r="28" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3"'+(isCur?' filter="url(#hg)"':'')+'/>';
      h+='<text x="'+n.x+'" y="'+(n.y+6)+'" fill="'+(inP?'#060912':'#667080')+'" font-size="15" text-anchor="middle" font-weight="700">'+i+'</text>';
      if(inP)h+='<text x="'+n.x+'" y="'+(n.y+46)+'" fill="#8892b0" font-size="11" text-anchor="middle">#'+(idx+1)+'</text>';
      h+='</g>';
    }
    svg.innerHTML=h;
    if(s){
      var log=$('hamLog');
      log.innerHTML+='<div class="log-line '+(s.done?'ok':s.fail?'bad':'hl')+'">'+s.msg+'</div>';
      log.scrollTop=log.scrollHeight;
      if(s.done){$('hamResult').textContent=s.msg;$('hamResult').classList.add('show');}
      el.textContent=s.msg;el.className='status'+(s.done?' ok':s.fail?' err':' hl');
    }
  }
  makeCtrl(4,buildSteps,render);
})();}catch(e){var el=$('s4');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 5: SUBSET SUM
// ============================================================
try{(function(){
  var nums=[3,34,4,12,5,2],TARGET=9;
  function solve(){
    var steps=[],found=[];
    function bt(idx,curr,subset){
      if(curr===TARGET){
        var sub=subset.slice();
        found.push(sub);
        steps.push({idx:idx,curr:curr,subset:sub.slice(),hit:true,found:found.map(function(x){return x.slice();}),msg:'✓ Found subset: ['+sub.join(', ')+'] = '+TARGET});
        return;
      }
      if(curr>TARGET){
        steps.push({idx:idx,curr:curr,subset:subset.slice(),prune:true,found:found.map(function(x){return x.slice();}),msg:'✗ Prune! Sum '+curr+' > '+TARGET});
        return;
      }
      if(idx>=nums.length){
        steps.push({idx:idx,curr:curr,subset:subset.slice(),found:found.map(function(x){return x.slice();}),msg:'End of branch — sum '+curr+' ≠ '+TARGET});
        return;
      }
      // include nums[idx]
      subset.push(nums[idx]);
      steps.push({idx:idx,curr:curr+nums[idx],subset:subset.slice(),include:true,found:found.map(function(x){return x.slice();}),msg:'Include '+nums[idx]+' → sum = '+(curr+nums[idx])});
      bt(idx+1,curr+nums[idx],subset);
      subset.pop();
      // exclude nums[idx]
      steps.push({idx:idx,curr:curr,subset:subset.slice(),exclude:true,found:found.map(function(x){return x.slice();}),msg:'Exclude '+nums[idx]+' → sum = '+curr});
      bt(idx+1,curr,subset);
    }
    bt(0,0,[]);
    steps.push({done:true,found:found,msg:'Found '+found.length+' subset(s) summing to '+TARGET});
    return steps;
  }
  function buildSteps(){return solve();}
  function render(s,el){
    // info
    $('ssInfo').innerHTML='<span style="color:var(--dim)">Set: ['+nums.join(', ')+']</span> <span style="color:var(--gold);margin-left:15px">Target: '+TARGET+'</span>';
    // tree SVG
    var svg=$('svg5');if(!svg)return;
    var h='';
    var depth=s?Math.min(s.idx,nums.length):0;
    // simple binary tree visualization
    var layers=nums.length+1;
    for(var d=0;d<=Math.min(depth,nums.length);d++){
      var count=Math.pow(2,d);
      for(var n=0;n<count;n++){
        var x=350+(n-(count-1)/2)*(500/Math.pow(1.6,d));
        var y=25+d*48;
        var isIncluded=d>0&&(n%2===1);
        var fill='rgba(15,15,39,.8)';
        if(d<=depth){fill=isIncluded?'rgba(72,208,176,.15)':'rgba(0,212,255,.1)';}
        if(s&&d===depth&&n===Math.pow(2,d)-1){fill='rgba(241,196,15,.2)';}
        h+='<rect x="'+(x-28)+'" y="'+y+'" width="56" height="30" rx="5" fill="'+fill+'" stroke="'+(d<=depth?(isIncluded?'#48d0b0':'#00d4ff'):'#1f2833')+'" stroke-width="1.5"/>';
        var label=d===0?'[]':(isIncluded?'+'+nums[d-1]:'skip');
        h+='<text x="'+x+'" y="'+(y+19)+'" fill="'+(d<=depth?(isIncluded?'#48d0b0':'#00d4ff'):'#667080')+'" font-size="10" text-anchor="middle" font-weight="600">'+label+'</text>';
        // lines to children
        if(d<depth&&d<nums.length){
          var cx1=x-250/Math.pow(1.6,d+1),cx2=x+250/Math.pow(1.6,d+1);
          h+='<line x1="'+x+'" y1="'+(y+30)+'" x2="'+cx1+'" y2="'+(y+48)+'" stroke="#00d4ff" stroke-width="1" opacity=".4"/>';
          h+='<line x1="'+x+'" y1="'+(y+30)+'" x2="'+cx2+'" y2="'+(y+48)+'" stroke="#48d0b0" stroke-width="1" opacity=".4"/>';
        }
      }
    }
    svg.innerHTML=h;
    // subsets
    if(s&&s.found){
      var sh='';
      for(var i=0;i<s.found.length;i++){
        var sub=s.found[i];
        var cls='subset'+(s.hit&&i===s.found.length-1?' hit cur':' hit');
        sh+='<div class="'+cls+'">['+sub.join(', ')+'] = '+TARGET+'</div>';
      }
      $('ssSubsets').innerHTML=sh;
    }
    if(s){
      if(s.done){$('ssResult').textContent=s.msg;$('ssResult').classList.add('show');}
      el.textContent=s.msg;el.className='status'+(s.done?' ok':s.prune?' err':' hl');
    }
  }
  makeCtrl(5,buildSteps,render);
})();}catch(e){var el=$('s5');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}
