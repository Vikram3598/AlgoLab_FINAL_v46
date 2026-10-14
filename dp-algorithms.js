'use strict';
function $(id){return document.getElementById(id);}
var COLORS=['#ff6b6b','#ff9f43','#f1c40f','#48d0b0','#00d4ff','#9b59b6','#e84393','#fd79a8'];

// SOUND
var actx=null;
function beep(f,d,t){try{if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();var o=actx.createOscillator(),g=actx.createGain();o.connect(g);g.connect(actx.destination);o.frequency.value=f||440;o.type=t||'sine';g.gain.setValueAtTime(.07,actx.currentTime);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+(d||.12));o.start();o.stop(actx.currentTime+(d||.12));}catch(e){}}
function sfxStep(){beep(550,.08,'sine');}
function sfxDone(){[523,659,784,1047].forEach(function(f,i){setTimeout(function(){beep(f,.18,'triangle');},i*110);});}
function sfxBad(){beep(180,.18,'sawtooth');}

// CONFETTI
function confetti(){var c=$('confetti');if(!c)return;for(var i=0;i<55;i++){var p=document.createElement('div');p.className='pc';p.style.left=Math.random()*100+'%';p.style.background=COLORS[i%8];p.style.width=(4+Math.random()*7)+'px';p.style.height=(4+Math.random()*7)+'px';p.style.borderRadius=Math.random()>.5?'50%':'2px';p.style.animationDuration=(1.5+Math.random()*2)+'s';p.style.animationDelay=(Math.random()*.4)+'s';c.appendChild(p);(function(el){setTimeout(function(){el.remove();},4000);})(p);}}

// NAV
var currentAlgo=-1;
var ctrls=[];
var homeScreen=$('homeScreen'),algoScreen=$('algoScreen'),backBtn=$('backBtn');
var panels=document.querySelectorAll('.panel');
var cellScope=null;

function openAlgo(index){
  currentAlgo=parseInt(index,10); if(Number.isNaN(currentAlgo)||currentAlgo<0||currentAlgo>8)return;
  homeScreen.style.display='none';algoScreen.style.display='block';backBtn.classList.add('show');
  for(var i=0;i<panels.length;i++)panels[i].classList.remove('on');
  var p=$('p'+currentAlgo);if(p)p.classList.add('on');
  document.querySelectorAll('.dp-nav-btn').forEach(function(btn){btn.classList.toggle('active',parseInt(btn.getAttribute('data-a'),10)===currentAlgo);});
  beep(500,.1,'sine');
}
document.querySelectorAll('.card').forEach(function(card){card.addEventListener('click',function(){openAlgo(card.getAttribute('data-a'));});});
document.querySelectorAll('.dp-nav-btn').forEach(function(btn){btn.addEventListener('click',function(){openAlgo(btn.getAttribute('data-a'));});});
backBtn.addEventListener('click',function(){stopAll();currentAlgo=-1;homeScreen.style.display='block';algoScreen.style.display='none';backBtn.classList.remove('show');document.querySelectorAll('.dp-nav-btn').forEach(function(btn){btn.classList.remove('active');});});
function stopAll(){for(var i=0;i<9;i++){if(ctrls[i]&&ctrls[i].stop)ctrls[i].stop();}}

// CONTROLLER
function makeCtrl(n,buildSteps,render){
  var steps=[],idx=0,playing=false,timer=null,speed=600;
  var btnPlay=$('play'+n),btnStep=$('step'+n),btnReset=$('reset'+n);
  var statusEl=$('s'+n),progEl=$('prog'+n),spdEl=$('spd'+n),spdvEl=$('spdv'+n);
  function upProg(){if(progEl)progEl.style.width=(steps.length?idx/steps.length*100:0)+'%';}
  function rebuild(){steps=buildSteps();idx=0;cellScope=statusEl&&statusEl.closest('.panel');render(null,statusEl);cellScope=null;statusEl.textContent='Press Play or Step to begin';statusEl.className='status';upProg();}
  function doStep(){
    if(idx>=steps.length)return false;
    var s=steps[idx];cellScope=statusEl&&statusEl.closest('.panel');render(s,statusEl);cellScope=null;
    statusEl.textContent=s.msg;statusEl.className='status'+(s.done?' ok':' hl');
    idx++;upProg();
    if(idx>=steps.length){sfxDone();if(s.done)confetti();return false;}
    sfxStep();return true;
  }
  function startPlay(){if(playing)return;playing=true;btnPlay.innerHTML='⏸ Pause';timer=setInterval(function(){if(!doStep())stopPlay();},speed);}
  function stopPlay(){playing=false;clearInterval(timer);timer=null;btnPlay.innerHTML='▶ Play';}
  btnPlay.addEventListener('click',function(){if(playing)stopPlay();else startPlay();});
  btnStep.addEventListener('click',function(){if(!playing)doStep();});
  btnReset.addEventListener('click',function(){stopPlay();rebuild();});
  if(spdEl)spdEl.addEventListener('input',function(){speed=parseInt(spdEl.value);if(spdvEl)spdvEl.textContent=(speed/1000).toFixed(1)+'s';if(playing){stopPlay();startPlay();}});
  rebuild();ctrls[n]={stop:stopPlay};return ctrls[n];
}

// Helper: build HTML DP table
function buildTable(rows,cols,headerRow,headerCol){
  var h='<table class="dp-table"><tr><td class="hdr"></td>';
  for(var j=0;j<cols;j++)h+='<td class="hdr">'+(headerCol?headerCol[j]:j)+'</td>';
  h+='</tr>';
  for(var i=0;i<rows;i++){
    h+='<tr><td class="hdr">'+(headerRow?headerRow[i]:i)+'</td>';
    for(var j=0;j<cols;j++)h+='<td data-cell="c'+i+'_'+j+'"></td>';
    h+='</tr>';
  }
  return h+'</table>';
}
function setCell(id,val,cls){var e=cellScope?cellScope.querySelector('[data-cell="'+id+'"]'):document.querySelector('[data-cell="'+id+'"]');if(!e)return;e.textContent=val;if(cls!==undefined)e.className=cls;}
function clearTable(rows,cols){for(var i=0;i<rows;i++)for(var j=0;j<cols;j++)setCell('c'+i+'_'+j,'','');}

// ============================================================
// 0: 0/1 KNAPSACK
// ============================================================
try{(function(){
  var items=[{n:'A',w:2,v:3},{n:'B',w:3,v:4},{n:'C',w:4,v:5},{n:'D',w:5,v:8}];
  var W=8,N=items.length;
  function buildSteps(){
    var dp=[];for(var i=0;i<=N;i++){dp[i]=[];for(var w=0;w<=W;w++)dp[i][w]=0;}
    var steps=[];
    for(var i=1;i<=N;i++){
      for(var w=0;w<=W;w++){
        dp[i][w]=dp[i-1][w];
        var msg='dp['+i+']['+w+'] = '+dp[i][w]+' (skip '+items[i-1].n+')';
        if(items[i-1].w<=w){
          var take=dp[i-1][w-items[i-1].w]+items[i-1].v;
          if(take>dp[i][w]){dp[i][w]=take;msg='dp['+i+']['+w+'] = '+take+' (take '+items[i-1].n+')';}
        }
        steps.push({i:i,w:w,val:dp[i][w],msg:msg,done:false});
      }
    }
    // backtrack
    var w=W,taken=[];
    for(var i=N;i>0;i--){if(dp[i][w]!==dp[i-1][w]){taken.push(items[i-1].n);w-=items[i-1].w;}}
    var total=dp[N][W];
    steps.push({i:-1,w:-1,val:total,taken:taken,done:true,msg:'Optimal value = '+total+' — items: '+taken.reverse().join(', ')});
    return steps;
  }
  function render(s,el){
    var html='';
    for(var i=0;i<items.length;i++){var it=items[i];
      var cls='item'+(s&&s.taken&&s.taken.indexOf(it.n)>=0?' taken':s&&s.i===i+1?' hl':'');
      html+='<div class="'+cls+'"><span style="font-weight:700">'+it.n+'</span><span>w='+it.w+'</span><span style="color:var(--gold)">v='+it.v+'</span></div>';}
    $('kItems').innerHTML=html;
    // table
    $('kTable').innerHTML=buildTable(N+1,W+1,null,Array.from({length:W+1},function(_,i){return i;}));
    var dp=[];for(var i=0;i<=N;i++){dp[i]=[];for(var w=0;w<=W;w++)dp[i][w]=0;}
    // fill up to current step
    var maxI=s?s.i:N,maxW=s?s.w:W;
    if(s&&s.i===-1){maxI=N;maxW=W;}
    for(var i=1;i<=N;i++)for(var w=0;w<=W;w++){
      dp[i][w]=dp[i-1][w];
      if(items[i-1].w<=w){var t=dp[i-1][w-items[i-1].w]+items[i-1].v;if(t>dp[i][w])dp[i][w]=t;}
      if(i<=maxI&&(i<maxI||w<=maxW))setCell('c'+i+'_'+w,dp[i][w],'done');
    }
    if(s&&s.i>0)setCell('c'+s.i+'_'+s.w,s.val,'cur');
    if(s&&s.done){
      for(var w=0;w<=W;w++)setCell('c'+N+'_'+w,dp[N][w],'path');
      $('kResult').textContent=s.msg;$('kResult').classList.add('show');
    }
    if(s){el.textContent=s.msg;el.className='status'+(s.done?' ok':' hl');}
  }
  makeCtrl(0,buildSteps,render);
})();}catch(e){var el=$('s0');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 1: LCS
// ============================================================
try{(function(){
  var A='ABCBDAB',B='BDCABA';
  function buildSteps(){
    var n=A.length,m=B.length;
    var dp=[];for(var i=0;i<=n;i++){dp[i]=[];for(var j=0;j<=m;j++)dp[i][j]=0;}
    var steps=[];
    for(var i=1;i<=n;i++)for(var j=1;j<=m;j++){
      if(A[i-1]===B[j-1]){dp[i][j]=dp[i-1][j-1]+1;
        steps.push({i:i,j:j,val:dp[i][j],match:true,msg:'Match "'+A[i-1]+'" — dp['+i+']['+j+'] = '+dp[i][j]});}
      else{dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]);
        steps.push({i:i,j:j,val:dp[i][j],match:false,msg:'No match — dp['+i+']['+j+'] = '+dp[i][j]});}
    }
    // backtrack
    var lcs='',i=n,j=m;
    while(i>0&&j>0){
      if(A[i-1]===B[j-1]){lcs=A[i-1]+lcs;i--;j--;}
      else if(dp[i-1][j]>=dp[i][j-1])i--;
      else j--;
    }
    steps.push({done:true,val:dp[n][m],lcs:lcs,msg:'LCS = "'+lcs+'" (length '+dp[n][m]+')'});
    return steps;
  }
  function render(s,el){
    var n=A.length,m=B.length;
    // strings
    var sh='<div class="str-box"><div class="str-label">String A</div><div class="str-chars">';
    for(var i=0;i<n;i++){var cls='ch'+(s&&s.i===i+1&&s.match?' match':s&&s.done?' match':'');sh+='<div class="'+cls+'">'+A[i]+'</div>';}
    sh+='</div></div><div class="str-box"><div class="str-label">String B</div><div class="str-chars">';
    for(var j=0;j<m;j++){var cls='ch'+(s&&s.j===j+1&&s.match?' match':s&&s.done?' match':'');sh+='<div class="'+cls+'">'+B[j]+'</div>';}
    sh+='</div></div>';
    $('lcsStrs').innerHTML=sh;
    // table
    $('lcsTable').innerHTML=buildTable(n+1,m+1,null,B.split(''));
    var dp=[];for(var i=0;i<=n;i++){dp[i]=[];for(var j=0;j<=m;j++)dp[i][j]=0;}
    var mi=s?s.i:n,mj=s?s.j:m;
    if(s&&s.done){mi=n;mj=m;}
    for(var i=1;i<=n;i++)for(var j=1;j<=m;j++){
      if(A[i-1]===B[j-1])dp[i][j]=dp[i-1][j-1]+1;
      else dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]);
      if(i<mi||(i===mi&&j<=mj))setCell('c'+i+'_'+j,dp[i][j],'done');
    }
    if(s&&s.i>0&&!s.done)setCell('c'+s.i+'_'+s.j,s.val,'cur');
    if(s&&s.done){
      // highlight LCS path
      var i=n,j=m;
      while(i>0&&j>0){
        if(A[i-1]===B[j-1]){setCell('c'+i+'_'+j,dp[i][j],'path');i--;j--;}
        else if(dp[i-1][j]>=dp[i][j-1])i--;
        else j--;
      }
      $('lcsResult').textContent=s.msg;$('lcsResult').classList.add('show');
    }
    if(s){el.textContent=s.msg;el.className='status'+(s.done?' ok':' hl');}
  }
  makeCtrl(1,buildSteps,render);
})();}catch(e){var el=$('s1');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 2: LIS
// ============================================================
try{(function(){
  var arr=[10,9,2,5,3,7,101,18];
  function buildSteps(){
    var n=arr.length,dp=new Array(n).fill(1),steps=[];
    for(var i=0;i<n;i++){
      for(var j=0;j<i;j++){
        if(arr[j]<arr[i]&&dp[j]+1>dp[i]){
          dp[i]=dp[j]+1;
          steps.push({i:i,j:j,dp:dp.slice(),msg:'arr['+j+']='+arr[j]+' < arr['+i+']='+arr[i]+' → dp['+i+'] = '+dp[i]});
        }
      }
      steps.push({i:i,j:-1,dp:dp.slice(),msg:'After checking index '+i+': dp = ['+dp.join(', ')+']'});
    }
    var maxL=0;for(var i=0;i<n;i++)maxL=Math.max(maxL,dp[i]);
    steps.push({done:true,dp:dp,max:maxL,msg:'LIS length = '+maxL+' — dp: ['+dp.join(', ')+']'});
    return steps;
  }
  function render(s,el){
    var n=arr.length,maxVal=Math.max.apply(null,arr);
    var bars='';
    for(var i=0;i<n;i++){
      var h=Math.max(30,arr[i]/maxVal*150);
      var cls='bar pos'+(s&&s.i===i?' cur':'')+(s&&s.done?' max':'');
      bars+='<div class="'+cls+'" style="height:'+h+'px"><span class="lbl">'+arr[i]+'</span>'+((s?s.dp[i]:1))+'</div>';
    }
    $('lisBars').innerHTML='<div class="bars">'+bars+'</div>';
    // table
    $('lisTable').innerHTML=buildTable(1,n,null,arr);
    for(var i=0;i<n;i++)setCell('c0_'+i,s?s.dp[i]:1,s&&s.i===i?'cur':'done');
    if(s&&s.done){$('lisResult').textContent=s.msg;$('lisResult').classList.add('show');}
    if(s){el.textContent=s.msg;el.className='status'+(s.done?' ok':' hl');}
  }
  makeCtrl(2,buildSteps,render);
})();}catch(e){var el=$('s2');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 3: MATRIX CHAIN MULTIPLICATION
// ============================================================
try{(function(){
  var dims=[10,30,5,60,20]; // 4 matrices
  var names=['M1','M2','M3','M4'];
  function buildSteps(){
    var n=dims.length-1;
    var dp=[],split=[];
    for(var i=0;i<n;i++){dp[i]=[];split[i]=[];for(var j=0;j<n;j++){dp[i][j]=i===j?0:Infinity;split[i][j]=-1;}}
    var steps=[];
    for(var len=2;len<=n;len++){
      for(var i=0;i<=n-len;i++){
        var j=i+len-1;
        for(var k=i;k<j;k++){
          var cost=dp[i][k]+dp[k+1][j]+dims[i]*dims[k+1]*dims[j+1];
          if(cost<dp[i][j]){dp[i][j]=cost;split[i][j]=k;}
        }
        steps.push({i:i,j:j,val:dp[i][j],msg:'Chain ['+i+'..'+j+'] min cost = '+dp[i][j]});
      }
    }
    steps.push({done:true,val:dp[0][n-1],msg:'Minimum multiplications = '+dp[0][n-1]});
    return steps;
  }
  function render(s,el){
    var n=dims.length-1;
    $('mcmDims').innerHTML='<span style="color:var(--accent);font-weight:700">Dimensions:</span> <span style="color:var(--gold)">'+dims.join(' × ')+'</span>';
    var h='<table class="dp-table"><tr><td class="hdr"></td>';
    for(var j=0;j<n;j++)h+='<td class="hdr">'+names[j]+'</td>';
    h+='</tr>';
    for(var i=0;i<n;i++){
      h+='<tr><td class="hdr">'+names[i]+'</td>';
      for(var j=0;j<n;j++){
        var val=i===j?0:'';
        if(s){
          if(i<=s.i&&j>=s.j&&i<=s.j){ // approximate fill
            var dpVal=i===j?0:'';
            // recompute for display
          }
        }
        h+='<td data-cell="mc'+i+'_'+j+'">'+val+'</td>';
      }
      h+='</tr>';
    }
    $('mcmTable').innerHTML=h+'</table>';
    // fill based on step
    var dp=[],n2=dims.length-1;
    for(var i=0;i<n2;i++){dp[i]=[];for(var j=0;j<n2;j++)dp[i][j]=i===j?0:Infinity;}
    if(s){
      for(var len=2;len<=n2;len++)for(var i=0;i<=n2-len;i++){var j=i+len-1;
        for(var k=i;k<j;k++){var cost=dp[i][k]+dp[k+1][j]+dims[i]*dims[k+1]*dims[j+1];if(cost<dp[i][j])dp[i][j]=cost;}
        if(!s.done&&(s.i===i&&s.j===j))setCell('mc'+i+'_'+j,dp[i][j],'cur');
        else setCell('mc'+i+'_'+j,dp[i][j],'done');
      }
      if(s.done){for(var i=0;i<n2;i++)for(var j=i;j<n2;j++)setCell('mc'+i+'_'+j,dp[i][j],'path');
        $('mcmResult').textContent=s.msg;$('mcmResult').classList.add('show');}
    }
    if(s){el.textContent=s.msg;el.className='status'+(s.done?' ok':' hl');}
  }
  // patch setCell to work with mc prefix
  var origSet=setCell;
  setCell=function(id,val,cls){var e=cellScope?cellScope.querySelector('[data-cell="'+id+'"]'):document.querySelector('[data-cell="'+id+'"]');if(!e)return;e.textContent=val;if(cls!==undefined)e.className=cls;};
  makeCtrl(3,buildSteps,render);
  setCell=origSet;
})();}catch(e){var el=$('s3');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 4: BELLMAN-FORD
// ============================================================
try{(function(){
  var V=5;
  var nodes=[{x:80,y:140},{x:230,y:60},{x:230,y:220},{x:420,y:140},{x:580,y:140}];
  var edges=[{u:0,v:1,w:6},{u:0,v:2,w:7},{u:1,v:2,w:8},{u:1,v:3,w:5},{u:1,v:4,w:-4},{u:2,v:1,w:-3},{u:2,v:3,w:-2},{u:3,v:4,w:9},{u:4,v:3,w:7},{u:4,v:0,w:2}];
  function buildSteps(){
    var dist=[0,Infinity,Infinity,Infinity,Infinity],steps=[];
    for(var r=0;r<V;r++){
      var changed=false;
      for(var e=0;e<edges.length;e++){
        var ed=edges[e];
        if(dist[ed.u]!==Infinity&&dist[ed.u]+ed.w<dist[ed.v]){
          var old=dist[ed.v];dist[ed.v]=dist[ed.u]+ed.w;changed=true;
          steps.push({round:r+1,e:e,dist:dist.slice(),updated:true,msg:'Round '+(r+1)+': Edge '+ed.u+'→'+ed.v+' ('+ed.w+') — dist['+ed.v+']: '+(old===Infinity?'∞':old)+' → '+dist[ed.v]});
        }
      }
      steps.push({round:r+1,dist:dist.slice(),changed:changed,msg:'End of round '+(r+1)+': dist = ['+dist.map(function(d){return d===Infinity?'∞':d;}).join(', ')+']'+(r===V-1&&!changed?' — No more updates!':'')});
      if(r===V-1&&changed){steps.push({negCycle:true,dist:dist.slice(),msg:'⚠ Negative cycle detected!'});break;}
    }
    steps.push({done:true,dist:dist.slice(),msg:'Shortest paths from node 0: ['+dist.map(function(d){return d===Infinity?'∞':d;}).join(', ')+']'});
    return steps;
  }
  function render(s,el){
    var svg=$('svg4');if(!svg)return;
    var dist=s?s.dist:[0,Infinity,Infinity,Infinity,Infinity];
    var hotE=s&&s.e!==undefined?s.e:-1;
    var h='<defs><filter id="gR"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    for(var e=0;e<edges.length;e++){var ed=edges[e],a=nodes[ed.u],b=nodes[ed.v];
      var hot=e===hotE;
      var col=hot?'#ff6b6b':ed.w<0?'#9b59b6':'#2c3e50',sw=hot?3.5:ed.w<0?2:1.5;
      h+='<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="'+col+'" stroke-width="'+sw+'"'+(hot?' filter="url(#gR)"':'')+(ed.w<0?' stroke-dasharray="6,3"':'')+'/>';
      var mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      h+='<rect x="'+(mx-12)+'" y="'+(my-10)+'" width="24" height="16" rx="3" fill="#0a0a2e" stroke="'+col+'" stroke-width="1"/>';
      h+='<text x="'+mx+'" y="'+(my+3)+'" fill="'+col+'" font-size="10" text-anchor="middle" font-weight="700">'+ed.w+'</text>';
    }
    for(var i=0;i<V;i++){var n=nodes[i];
      var d=dist[i];var fill=i===0?'#00d4ff':d===Infinity?'#1a1d3e':'#48d0b0';
      h+='<circle cx="'+n.x+'" cy="'+n.y+'" r="24" fill="'+fill+'" stroke="'+fill+'" stroke-width="2.5"/>';
      h+='<text x="'+n.x+'" y="'+(n.y+4)+'" fill="'+(d===Infinity?'#667080':'#060912')+'" font-size="13" text-anchor="middle" font-weight="700">'+i+'</text>';
      h+='<text x="'+n.x+'" y="'+(n.y+42)+'" fill="'+(d===Infinity?'#667080':d<0?'#ff6b6b':'#48d0b0')+'" font-size="12" text-anchor="middle" font-weight="700">'+(d===Infinity?'∞':d)+'</text>';
    }
    svg.innerHTML=h;
    // dist display
    var dd='';for(var i=0;i<V;i++)dd+='<span style="display:inline-block;margin:0 6px;padding:3px 8px;background:rgba(15,15,39,.8);border:1px solid var(--border);border-radius:5px;font-size:.78rem">'+i+': <b style="color:'+(dist[i]===Infinity?'var(--dim)':dist[i]<0?'var(--red)':'var(--green)')+'">'+(dist[i]===Infinity?'∞':dist[i])+'</b></span>';
    $('bfDist').innerHTML=dd;
    if(s){el.textContent=s.msg;el.className='status'+(s.done?' ok':s.negCycle?' err':' hl');}
  }
  makeCtrl(4,buildSteps,render);
})();}catch(e){var el=$('s4');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 5: FLOYD-WARSHALL
// ============================================================
try{(function(){
  var V=4;
  var INF=Infinity;
  var init=[[0,5,INF,INF],[INF,0,3,INF],[INF,INF,0,2],[1,INF,INF,0]];
  function buildSteps(){
    var d=[];for(var i=0;i<V;i++){d[i]=[];for(var j=0;j<V;j++)d[i][j]=init[i][j];}
    var steps=[];
    steps.push({k:-1,d:d.map(function(r){return r.slice();}),msg:'Initial distance matrix'});
    for(var k=0;k<V;k++){
      for(var i=0;i<V;i++)for(var j=0;j<V;j++){
        if(d[i][k]+d[k][j]<d[i][j]){
          var old=d[i][j];d[i][j]=d[i][k]+d[k][j];
          steps.push({k:k,i:i,j:j,d:d.map(function(r){return r.slice();}),updated:true,msg:'k='+k+': via vertex '+k+' — dist['+i+']['+j+']: '+(old===INF?'∞':old)+' → '+d[i][j]});
        }
      }
      steps.push({k:k,d:d.map(function(r){return r.slice();}),msg:'After k='+k+' complete'});
    }
    steps.push({done:true,d:d.map(function(r){return r.slice();}),msg:'All-pairs shortest paths computed!'});
    return steps;
  }
  function render(s,el){
    var d=s?s.d:init;
    var curK=s?s.k:-1;
    $('fwLabel').innerHTML=curK>=0?'Using intermediate vertex <b style="color:var(--gold)">'+curK+'</b>':'Initial matrix';
    var h='<div class="mx" style="grid-template-columns:repeat('+(V+1)+',auto)">';
    h+='<div class="mx-cell hdr"></div>';
    for(var j=0;j<V;j++)h+='<div class="mx-cell hdr">'+j+'</div>';
    for(var i=0;i<V;i++){
      h+='<div class="mx-cell hdr">'+i+'</div>';
      for(var j=0;j<V;j++){
        var cls='mx-cell';
        if(d[i][j]===INF){h+='<div class="'+cls+'" style="color:var(--dim)">∞</div>';continue;}
        if(s&&s.updated&&s.i===i&&s.j===j)cls+=' upd';
        else if(s&&s.done)cls+=' done';
        else if(s&&s.i===i&&s.j===j)cls+=' cur';
        else if(i===j)cls+=' done';
        h+='<div class="'+cls+'">'+d[i][j]+'</div>';
      }
    }
    $('fwMatrix').innerHTML=h+'</div>';
    if(s&&s.done){$('fwResult').textContent='All pairs computed!';$('fwResult').classList.add('show');}
    if(s){el.textContent=s.msg;el.className='status'+(s.done?' ok':' hl');}
  }
  makeCtrl(5,buildSteps,render);
})();}catch(e){var el=$('s5');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 6: EDIT DISTANCE
// ============================================================
try{(function(){
  var A='kitten',B='sitting';
  function buildSteps(){
    var n=A.length,m=B.length;
    var dp=[];for(var i=0;i<=n;i++){dp[i]=[];for(var j=0;j<=m;j++)dp[i][j]=0;}
    for(var i=0;i<=n;i++)dp[i][0]=i;
    for(var j=0;j<=m;j++)dp[0][j]=j;
    var steps=[{i:0,j:0,val:0,msg:'Initialize: dp[i][0]=i, dp[0][j]=j'}];
    for(var i=1;i<=n;i++)for(var j=1;j<=m;j++){
      if(A[i-1]===B[j-1]){dp[i][j]=dp[i-1][j-1];
        steps.push({i:i,j:j,val:dp[i][j],match:true,msg:'Match "'+A[i-1]+'" — dp['+i+']['+j+'] = '+dp[i][j]});}
      else{dp[i][j]=1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
        steps.push({i:i,j:j,val:dp[i][j],match:false,msg:'Replace/Insert/Delete — dp['+i+']['+j+'] = '+dp[i][j]});}
    }
    steps.push({done:true,val:dp[n][m],msg:'Edit distance = '+dp[n][m]});
    return steps;
  }
  function render(s,el){
    var n=A.length,m=B.length;
    var sh='<div class="str-box"><div class="str-label">Source</div><div class="str-chars">';
    for(var i=0;i<n;i++)sh+='<div class="ch'+(s&&s.i===i+1?' hl':'')+'">'+A[i]+'</div>';
    sh+='</div></div><div class="str-box"><div class="str-label">Target</div><div class="str-chars">';
    for(var j=0;j<m;j++)sh+='<div class="ch'+(s&&s.j===j+1?' hl':'')+'">'+B[j]+'</div>';
    sh+='</div></div>';
    $('edStrs').innerHTML=sh;
    $('edTable').innerHTML=buildTable(n+1,m+1,null,B.split(''));
    var dp=[];for(var i=0;i<=n;i++){dp[i]=[];for(var j=0;j<=m;j++)dp[i][j]=0;}
    for(var i=0;i<=n;i++)dp[i][0]=i;
    for(var j=0;j<=m;j++)dp[0][j]=j;
    var mi=s?s.i:n,mj=s?s.j:m;
    if(s&&s.done){mi=n;mj=m;}
    for(var i=0;i<=n;i++)for(var j=0;j<=m;j++){
      if(i>0&&j>0){if(A[i-1]===B[j-1])dp[i][j]=dp[i-1][j-1];else dp[i][j]=1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);}
      if(i<mi||(i===mi&&j<=mj))setCell('c'+i+'_'+j,dp[i][j],(i===0||j===0)?'hdr':'done');
    }
    if(s&&s.i>0&&!s.done)setCell('c'+s.i+'_'+s.j,s.val,'cur');
    if(s&&s.done){
      setCell('c'+n+'_'+m,dp[n][m],'path');
      $('edResult').textContent=s.msg;$('edResult').classList.add('show');
    }
    if(s){el.textContent=s.msg;el.className='status'+(s.done?' ok':' hl');}
  }
  makeCtrl(6,buildSteps,render);
})();}catch(e){var el=$('s6');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 7: KADANE'S
// ============================================================
try{(function(){
  var arr=[-2,1,-3,4,-1,2,1,-5,4];
  function buildSteps(){
    var maxSum=arr[0],curSum=arr[0],start=0,end=0,cs=0,steps=[];
    steps.push({i:0,cur:arr[0],max:arr[0],msg:'Start: current='+arr[0]+', max='+arr[0]});
    for(var i=1;i<arr.length;i++){
      if(curSum+arr[i]<arr[i]){curSum=arr[i];cs=i;}
      else curSum=curSum+arr[i];
      if(curSum>maxSum){maxSum=curSum;start=cs;end=i;}
      steps.push({i:i,cur:curSum,max:maxSum,curStart:cs,subStart:start,subEnd:end,msg:'i='+i+' (val='+arr[i]+'): current='+curSum+', max='+maxSum});
    }
    steps.push({done:true,max:maxSum,subStart:start,subEnd:end,msg:'Maximum subarray sum = '+maxSum+' (indices '+start+'..'+end+')'});
    return steps;
  }
  function render(s,el){
    var maxVal=Math.max.apply(null,arr.map(Math.abs));
    var bars='';
    for(var i=0;i<arr.length;i++){
      var h=Math.max(25,Math.abs(arr[i])/maxVal*130);
      var cls='bar '+(arr[i]>=0?'pos':'neg');
      if(s&&!s.done&&s.i===i)cls+=' cur';
      if(s&&s.done&&i>=s.subStart&&i<=s.subEnd)cls='bar max';
      bars+='<div class="'+cls+'" style="height:'+h+'px"><span class="lbl">'+arr[i]+'</span></div>';
    }
    $('kadBars').innerHTML='<div class="bars">'+bars+'</div>';
    if(s){
      var log=$('kadLog');
      var line='<div class="step-line'+(s.done?' ok':' hl')+'">'+s.msg+'</div>';
      log.innerHTML+=line;
      log.scrollTop=log.scrollHeight;
      if(s.done){$('kadResult').textContent=s.msg;$('kadResult').classList.add('show');}
      el.textContent=s.msg;el.className='status'+(s.done?' ok':' hl');
    }
  }
  makeCtrl(7,buildSteps,render);
})();}catch(e){var el=$('s7');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 8: EGG DROPPING
// ============================================================
try{(function(){
  var E=2,F=10;
  function buildSteps(){
    var dp=[];for(var e=0;e<=E;e++){dp[e]=[];for(var f=0;f<=F;f++)dp[e][f]=0;}
    for(var f=1;f<=F;f++)dp[0][f]=f;
    for(var e=1;e<=E;e++)dp[e][0]=0;
    var steps=[{e:0,f:0,msg:'Base: 0 eggs → f trials, 0 floors → 0 trials'}];
    for(var e=1;e<=E;e++)for(var f=1;f<=F;f++){
      dp[e][f]=Infinity;
      for(var x=1;x<=f;x++){
        var res=1+Math.max(dp[e-1][x-1],dp[e][f-x]);
        if(res<dp[e][f])dp[e][f]=res;
      }
      steps.push({e:e,f:f,val:dp[e][f],msg:dp[e][f]+' trials for '+e+' egg(s), '+f+' floor(s)'});
    }
    steps.push({done:true,val:dp[E][F],msg:'Minimum trials = '+dp[E][F]+' for '+E+' eggs and '+F+' floors'});
    return steps;
  }
  function render(s,el){
    $('eggInfo').innerHTML='<span style="color:var(--dim)">'+E+' eggs, '+F+' floors</span>';
    $('eggTable').innerHTML=buildTable(E+1,F+1,null,Array.from({length:F+1},function(_,i){return i;}));
    var dp=[];for(var e=0;e<=E;e++){dp[e]=[];for(var f=0;f<=F;f++)dp[e][f]=0;}
    for(var f=1;f<=F;f++)dp[0][f]=f;
    for(var e=1;e<=E;e++)for(var f=1;f<=F;f++){dp[e][f]=Infinity;for(var x=1;x<=f;x++){var r=1+Math.max(dp[e-1][x-1],dp[e][f-x]);if(r<dp[e][f])dp[e][f]=r;}}
    var me=s?s.e:E,mf=s?s.f:F;
    if(s&&s.done){me=E;mf=F;}
    for(var e=0;e<=E;e++)for(var f=0;f<=F;f++){
      if(e<me||(e===me&&f<=mf))setCell('c'+e+'_'+f,dp[e][f],(e===0||f===0)?'hdr':'done');
    }
    if(s&&s.e>0&&!s.done)setCell('c'+s.e+'_'+s.f,s.val,'cur');
    if(s&&s.done){for(var f=0;f<=F;f++)setCell('c'+E+'_'+f,dp[E][f],'path');
      $('eggResult').textContent=s.msg;$('eggResult').classList.add('show');}
    if(s){el.textContent=s.msg;el.className='status'+(s.done?' ok':' hl');}
  }
  makeCtrl(8,buildSteps,render);
})();}catch(e){var el=$('s8');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}
