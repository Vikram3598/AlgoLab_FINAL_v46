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
function stopAll(){for(var i=0;i<2;i++){if(ctrls[i]&&ctrls[i].stop)ctrls[i].stop();}}

// CONTROLLER
function makeCtrl(n,buildSteps,render){
  var steps=[],idx=0,playing=false,timer=null,speed=700;
  var btnPlay=$('play'+n),btnStep=$('step'+n),btnReset=$('reset'+n);
  var statusEl=$('s'+n),progEl=$('prog'+n),spdEl=$('spd'+n),spdvEl=$('spdv'+n);
  function upProg(){if(progEl)progEl.style.width=(steps.length?idx/steps.length*100:0)+'%';}
  function rebuild(){steps=buildSteps();idx=0;render(null,statusEl);statusEl.textContent='Press Play or Step to begin';statusEl.className='status';upProg();}
  function doStep(){
    if(idx>=steps.length)return false;
    var s=steps[idx];render(s,statusEl);
    statusEl.textContent=s.msg;statusEl.className='status'+(s.done?' ok':s.fail?' err':' hl');
    idx++;upProg();
    if(idx>=steps.length){sfxDone();if(s.done)confetti();return false;}
    if(s.fail||s.prune)sfxBad();else sfxStep();
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
// 0: TSP (Branch and Bound)
// ============================================================
try{(function(){
  var N=4;
  var names=['A','B','C','D'];
  var nodes=[{x:160,y:60},{x:260,y:170},{x:160,y:240},{x:60,y:170}];
  var W=[
    [0,10,15,20],
    [10,0,35,25],
    [15,35,0,30],
    [20,25,30,0]
  ];
  function solve(){
    var steps=[];
    var bestCost=Infinity,bestPath=null;
    var minEdge=[];// min edge from each city
    for(var i=0;i<N;i++){var m=Infinity;for(var j=0;j<N;j++)if(i!==j&&W[i][j]<m)m=W[i][j];minEdge[i]=m;}
    // lower bound at root: sum of two smallest edges per city / 2
    function rootBound(){
      var s=0;
      for(var i=0;i<N;i++){
        var a=Infinity,b=Infinity;
        for(var j=0;j<N;j++){if(i===j)continue;var e=W[i][j];if(e<a){b=a;a=e;}else if(e<b)b=e;}
        s+=a+b;
      }
      return Math.ceil(s/2);
    }
    var LB0=rootBound();
    steps.push({path:[0],cost:0,bound:LB0,best:bestCost,bestPath:null,msg:'Start at A. Root lower bound = '+LB0+'. Best = ∞'});
    // DFS branch and bound
    function bt(city,visited,cost,path){
      if(visited.length===N){
        var total=cost+W[city][0];
        if(total<bestCost){
          bestCost=total;bestPath=path.slice().concat([0]);
          steps.push({path:path.slice().concat([0]),cost:total,bound:total,best:bestCost,bestPath:bestPath.slice(),done:true,msg:'Complete tour '+path.concat([0]).map(function(i){return names[i];}).join('→')+' cost = '+total+' — NEW BEST!'});
          return;
        }else{
          steps.push({path:path.slice().concat([0]),cost:total,bound:total,best:bestCost,bestPath:bestPath?bestPath.slice():null,msg:'Tour '+path.concat([0]).map(function(i){return names[i];}).join('→')+' cost = '+total+' ≥ best '+bestCost+' — no improvement'});
          return;
        }
      }
      // try each unvisited city, sorted by W[city][next] ascending (better first)
      var cands=[];
      for(var i=0;i<N;i++)if(visited.indexOf(i)<0)cands.push(i);
      cands.sort(function(a,b){return W[city][a]-W[city][b];});
      for(var k=0;k<cands.length;k++){
        var c=cands[k];
        var newCost=cost+W[city][c];
        var unvisited=[];
        for(var i=0;i<N;i++)if(visited.indexOf(i)<0&&i!==c)unvisited.push(i);
        // bound: newCost + min edges from c and each unvisited + min edge back to 0
        var b=newCost;
        // min from c to any unvisited
        var mc=Infinity;
        for(var j=0;j<unvisited.length;j++){var e=W[c][unvisited[j]];if(e<mc)mc=e;}
        if(unvisited.length>0)b+=mc;
        // min from each unvisited to any other unvisited or back to 0
        for(var i=0;i<unvisited.length;i++){
          var m=Infinity;
          for(var j=0;j<unvisited.length;j++)if(i!==j){var e=W[unvisited[i]][unvisited[j]];if(e<m)m=e;}
          var e0=W[unvisited[i]][0];if(e0<m)m=e0;
          b+=m;
        }
        if(unvisited.length===0)b+=W[c][0];
        var path2=path.concat([c]);
        var vis2=visited.concat([c]);
        if(b>=bestCost){
          steps.push({path:path2,cost:newCost,bound:b,best:bestCost,bestPath:bestPath?bestPath.slice():null,prune:true,msg:'PRUNE! '+names[city]+'→'+names[c]+' bound '+b+' ≥ best '+(bestCost===Infinity?'∞':bestCost)+' — skip branch'});
          continue;
        }
        steps.push({path:path2,cost:newCost,bound:b,best:bestCost,bestPath:bestPath?bestPath.slice():null,msg:'Expand '+names[city]+'→'+names[c]+': cost='+newCost+', bound='+b+' < best '+(bestCost===Infinity?'∞':bestCost)});
        bt(c,vis2,newCost,path2);
      }
    }
    bt(0,[0],0,[0]);
    if(bestPath){
      steps.push({path:bestPath,cost:bestCost,bound:bestCost,best:bestCost,bestPath:bestPath.slice(),done:true,msg:'Optimal tour found: '+bestPath.map(function(i){return names[i];}).join('→')+' = '+bestCost+' (optimal)'});
    }else{
      steps.push({done:true,msg:'No tour found'});
    }
    return steps;
  }
  function buildSteps(){return solve();}
  function render(s,el){
    var svg=$('svgTsp');if(!svg)return;
    var path=s?s.path:[0];
    var bestPath=s&&s.bestPath?s.bestPath:null;
    var h='<defs><filter id="tg"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    // edges
    for(var i=0;i<N;i++)for(var j=i+1;j<N;j++){
      var a=nodes[i],b=nodes[j];
      var onPath=false,onBest=false;
      for(var p=0;p<path.length-1;p++)if((path[p]===i&&path[p+1]===j)||(path[p]===j&&path[p+1]===i))onPath=true;
      if(bestPath)for(var p=0;p<bestPath.length-1;p++)if((bestPath[p]===i&&bestPath[p+1]===j)||(bestPath[p]===j&&bestPath[p+1]===i))onBest=true;
      var col='#2c3e50',sw=1.5,op='.6';
      if(onBest){col='#48d0b0';sw=2.5;op='1';}
      if(onPath){col='#f1c40f';sw=3;op='1';}
      h+='<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="'+col+'" stroke-width="'+sw+'" opacity="'+op+'"/>';
      // weight label
      var mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      h+='<rect x="'+(mx-10)+'" y="'+(my-8)+'" width="20" height="14" rx="3" fill="#060912" stroke="#1f2833"/>';
      h+='<text x="'+mx+'" y="'+(my+3)+'" fill="#667080" font-size="9" text-anchor="middle" font-weight="600">'+W[i][j]+'</text>';
    }
    // nodes
    for(var i=0;i<N;i++){
      var n=nodes[i];
      var idx=path.indexOf(i);
      var isCur=idx===path.length-1&&idx>=0;
      var inPath=idx>=0;
      var fill=inPath?(isCur?'#f1c40f':'#48d0b0'):'#1a1d3e';
      var stroke=inPath?(isCur?'#f1c40f':'#48d0b0'):'#34495e';
      h+='<g class="tree-node"><circle cx="'+n.x+'" cy="'+n.y+'" r="24" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3"'+(isCur?' filter="url(#tg)"':'')+'/>';
      h+='<text x="'+n.x+'" y="'+(n.y+6)+'" fill="'+(inPath?'#060912':'#667080')+'" font-size="15" text-anchor="middle" font-weight="700">'+names[i]+'</text>';
      h+='</g>';
    }
    svg.innerHTML=h;
    if(s){
      // path display
      var pd=$('tspPathDisplay');
      if(pd){
        var ph='';
        for(var p=0;p<s.path.length;p++){
          ph+='<div class="path-node'+(p===s.path.length-1?' active':' visited')+'">'+names[s.path[p]]+'</div>';
          if(p<s.path.length-1)ph+='<div class="path-arrow">→</div>';
        }
        pd.innerHTML=ph;
      }
      $('tspPathCost').textContent=s.cost!==undefined?s.cost:'0';
      $('tspBestCost').textContent=bestPath?s.best:'∞';
      $('tspBound').textContent=s.bound!==undefined?s.bound:'∞';
      var log=$('tspLog');
      log.innerHTML+='<div class="log-line '+(s.done?'ok':(s.prune?'bad':'hl'))+'">'+s.msg+'</div>';
      log.scrollTop=log.scrollHeight;
      if(s.done){$('tspResult').textContent=s.msg;$('tspResult').classList.add('show');}
      el.textContent=s.msg;el.className='status'+(s.done?' ok':(s.prune?' err':' hl'));
    }
  }
  makeCtrl(0,buildSteps,render);
})();}catch(e){var el=$('s0');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 1: 0/1 KNAPSACK (B&B with fractional bound)
// ============================================================
try{(function(){
  var W=50;
  var items=[{name:'Item 1',w:20,v:60},{name:'Item 2',w:30,v:50},{name:'Item 3',w:10,v:120},{name:'Item 4',w:25,v:30}];
  // compute profit/weight ratio, sort desc
  var sorted=items.map(function(it,i){return {name:it.name,w:it.w,v:it.v,r:it.v/it.w,idx:i};});
  sorted.sort(function(a,b){return b.r-a.r;});
  // prefix arrays for bound
  var n=sorted.length;
  // upper bound function: fractional knapsack from depth d with remaining weight rem
  function ub(d,rem){
    var val=0;
    for(var i=d;i<n;i++){
      if(sorted[i].w<=rem){val+=sorted[i].v;rem-=sorted[i].w;}
      else{val+=sorted[i].r*rem;break;}
    }
    return val;
  }
  function solve(){
    var steps=[];
    var best=0,bestTaken=null;
    steps.push({taken:[],cur:0,ub:ub(0,W),best:0,depth:0,msg:'Root: capacity='+W+', upper bound = '+Math.floor(ub(0,W))+' (fractional relaxation), best = 0'});
    function bt(d,rem,val,taken){
      if(d>=n){
        if(val>best){best=val;bestTaken=taken.slice();
          steps.push({taken:taken.slice(),cur:val,ub:val,best:best,depth:d,done:true,msg:'Leaf! Feasible value = '+val+' — NEW BEST!'});
        }else{
          steps.push({taken:taken.slice(),cur:val,ub:val,best:best,depth:d,msg:'Leaf! value = '+val+' ≤ best '+best+' — no improvement'});
        }
        return;
      }
      // OPTION: take item d
      var takeOk=sorted[d].w<=rem;
      if(takeOk){
        var nval=val+sorted[d].v;
        var nrem=rem-sorted[d].w;
        var ntaken=taken.concat([d]);
        // bound for this subtree: current val + fractional of rest
        var b=nval+ub(d+1,nrem);
        if(b>best){
          steps.push({taken:ntaken,cur:nval,ub:Math.floor(b),best:best,depth:d+1,take:true,msg:'TAKE '+sorted[d].name+' (w='+sorted[d].w+', v='+sorted[d].v+'): val='+nval+', bound='+Math.floor(b)+' > best '+best+' — explore'});
          bt(d+1,nrem,nval,ntaken);
        }else{
          steps.push({taken:ntaken,cur:nval,ub:Math.floor(b),best:best,depth:d+1,take:true,prune:true,msg:'PRUNE take-'+sorted[d].name+': bound '+Math.floor(b)+' ≤ best '+best+' — skip branch'});
        }
      }
      // OPTION: skip item d
      var b2=val+ub(d+1,rem);
      if(b2>best){
        steps.push({taken:taken.slice(),cur:val,ub:Math.floor(b2),best:best,depth:d+1,skip:true,msg:'SKIP '+sorted[d].name+': val='+val+', bound='+Math.floor(b2)+' > best '+best+' — explore'});
        bt(d+1,rem,val,taken);
      }else{
        steps.push({taken:taken.slice(),cur:val,ub:Math.floor(b2),best:best,depth:d+1,skip:true,prune:true,msg:'PRUNE skip-'+sorted[d].name+': bound '+Math.floor(b2)+' ≤ best '+best+' — skip'});
      }
    }
    bt(0,W,0,[]);
    steps.push({taken:bestTaken||[],cur:best,ub:best,best:best,done:true,msg:'Optimal value = '+best+' using ['+(bestTaken||[]).map(function(i){return sorted[i].name;}).join(', ')+']'});
    return steps;
  }
  function buildSteps(){return solve();}
  function render(s,el){
    // items list
    var itHtml='';
    var taken=s&&s.taken?s.taken:[];
    for(var i=0;i<n;i++){
      var cls='item';
      var isTaken=taken.indexOf(i)>=0;
      if(s&&s.take&&isTaken&&i===taken[taken.length-1])cls+=' hl';
      else if(isTaken)cls+=' taken';
      if(s&&s.prune&&(s.skip&&i===s.depth))cls+=' skip';
      itHtml+='<div class="'+cls+'"><span>'+sorted[i].name+'</span><span>weight: '+sorted[i].w+'</span><span>value: '+sorted[i].v+'</span><span style="color:var(--accent)">ratio: '+sorted[i].r.toFixed(1)+'</span></div>';
    }
    $('kbItems').innerHTML=itHtml;
    if(s){
      $('kbCur').textContent=s.cur!==undefined?s.cur:'0';
      $('kbUb').textContent=s.ub!==undefined?s.ub:'0';
      $('kbBest').textContent=s.best!==undefined?s.best:'0';
      var log=$('kbLog');
      log.innerHTML+='<div class="log-line '+(s.done?'ok':(s.prune?'bad':'hl'))+'">'+s.msg+'</div>';
      log.scrollTop=log.scrollHeight;
      if(s.done){$('kbResult').textContent=s.msg;$('kbResult').classList.add('show');}
      el.textContent=s.msg;el.className='status'+(s.done?' ok':(s.prune?' err':' hl'));
    }
  }
  makeCtrl(1,buildSteps,render);
})();}catch(e){var el=$('s1');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}
