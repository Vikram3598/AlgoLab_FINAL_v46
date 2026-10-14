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
function stopAll(){for(var i=0;i<5;i++){if(ctrls[i]&&ctrls[i].stop)ctrls[i].stop();}}

// CONTROLLER
function makeCtrl(n,buildSteps,render){
  var steps=[],idx=0,playing=false,timer=null,speed=550;
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
    if(s.fail||s.kind==='spur')sfxBad();
    else if(s.kind==='match'||s.kind==='out')sfxGood();
    else sfxStep();
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

// ===== HELPERS =====
var TEXT='AABAACAADAABAABA',PAT='AABA',CHW=33;
function panelReset(logId,resId){var l=$(logId);if(l)l.innerHTML='';var r=$(resId);if(r){r.textContent='';r.className='result';}}
function showRes(id,msg,bad){var el=$(id);if(!el)return;if(msg){el.textContent=msg;el.className='result show'+(bad?' bad':'');}}
function logAdd(id,msg,cls){var el=$(id);if(!el)return;el.innerHTML+='<div class="log-line '+(cls||'')+'">'+msg+'</div>';el.scrollTop=el.scrollHeight;}
function stats(items){return items.map(function(it){return '<span class="stat">'+it[0]+' <b>'+it[1]+'</b></span>';}).join('');}
function renderRows(elId,text,pat,st){
  var el=$(elId);if(!el)return;
  st=st||{};
  var m=pat.length,n=text.length,start=st.start||0;
  var h='';
  if(!st.hideText){
    h+='<div class="row">';
    for(var i=0;i<n;i++){
      var cls='ch';
      var inWin=i>=start&&i<start+m;
      var isCmp=st.j>=0&&i===start+st.j;
      var hit=false;
      (st.matched||[]).forEach(function(ms){if(i>=ms&&i<ms+m)hit=true;});
      if(inWin)cls+=' win';
      if(hit)cls+=' hit';
      if(isCmp)cls+=st.cmp==='ok'?' ok':st.cmp==='bad'?' bad':'';
      if(st.tcur===i)cls+=' tcur';
      if(st.past!==undefined&&i<st.past)cls+=' past';
      h+='<div class="'+cls+'">'+text[i]+'<span class="ix">'+i+'</span></div>';
    }
    h+='</div>';
  }
  h+='<div class="row prow" style="margin-left:'+(start*CHW)+'px">';
  for(var j=0;j<m;j++){
    var cls='ch';
    if(st.allHit)cls+=' hit';
    if(st.j===j&&!st.allHit)cls+=st.cmp==='ok'?' ok':st.cmp==='bad'?' bad':' win';
    if(st.pA===j)cls+=st.pCmp==='ok'?' ok':st.pCmp==='bad'?' bad':' win';
    if(st.pB===j)cls+=' tcur';
    h+='<div class="'+cls+'">'+pat[j]+'<span class="ix">'+j+'</span></div>';
  }
  el.innerHTML=h+'</div>';
}

// ============================================================
// 0: NAIVE
// ============================================================
try{(function(){
  function build(){
    var steps=[],comps=0,shifts=0,matched=[],n=TEXT.length,m=PAT.length;
    function snap(start,j,cmp,kind,msg){steps.push({start:start,j:j,cmp:cmp,matched:matched.slice(),comps:comps,shifts:shifts,kind:kind,msg:msg});}
    snap(0,-1,null,'init','Align pattern at text[0] — compare left to right, one character at a time');
    for(var s=0;s<=n-m;s++){
      var ok=true;
      for(var j=0;j<m;j++){
        comps++;
        var eq=TEXT[s+j]===PAT[j];
        snap(s,j,eq?'ok':'bad','cmp','text['+(s+j)+']="'+TEXT[s+j]+'" vs pattern['+j+']="'+PAT[j]+'" '+(eq?'✓ match':'✗ MISMATCH'));
        if(!eq){ok=false;break;}
      }
      if(ok){matched.push(s);snap(s,-1,null,'match','✓✓ MATCH at position '+s+'! ('+matched.length+' found so far)');}
      if(s<n-m){shifts++;snap(s,-1,null,'shift','shift window right by 1 → compare from scratch at text['+(s+1)+']');}
    }
    steps.push({start:n-m,j:-1,cmp:null,matched:matched.slice(),comps:comps,shifts:shifts,done:true,kind:'done',
      msg:'Naive done — '+matched.length+' match(es) at ['+matched.join(', ')+'] using '+comps+' comparisons + '+shifts+' shifts'});
    return steps;
  }
  function render(s,el){
    panelReset('log0','res0');
    var st=s||{start:0,j:-1,cmp:null,matched:[],comps:0,shifts:0};
    renderRows('rows0',TEXT,PAT,st);
    var ro=$('ro0');
    if(s&&s.kind==='cmp')ro.innerHTML='text['+(st.start+st.j)+'] = "<span class="'+(st.cmp==='ok'?'ok':'bad')+'">'+TEXT[st.start+st.j]+'</span>"  ↔  pattern['+st.j+'] = "<span class="'+(st.cmp==='ok'?'ok':'bad')+'">'+PAT[st.j]+'</span>"  '+(st.cmp==='ok'?'✓':'✗ MISMATCH');
    else if(s)ro.textContent='window @ '+st.start+'  —  pattern vs text['+st.start+'..'+(st.start+3)+']';
    else ro.textContent='text = "'+TEXT+'"   pattern = "'+PAT+'"';
    $('stats0').innerHTML=stats([['Comparisons',st.comps],['Shifts',st.shifts],['Matches',(st.matched||[]).length]]);
    if(s){logAdd('log0',s.msg,s.done?'ok':s.kind==='match'?'ok':s.cmp==='bad'?'bad':'hl');if(s.done)showRes('res0',s.msg);el.textContent=s.msg;el.className='status'+(s.done?' ok':' hl');}
  }
  makeCtrl(0,build,render);
})();}catch(e){var el=$('s0');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 1: KMP
// ============================================================
try{(function(){
  var m=PAT.length;
  function build(){
    var steps=[];
    var lp=[0,-1,-1,-1],length=0,i=1;
    function snapL(i,len,kind,msg,pA,pB,pCmp){steps.push({phase:'lps',i:i,len:len,lp:lp.slice(),pA:pA===undefined?-1:pA,pB:pB===undefined?-1:pB,pCmp:pCmp||null,kind:kind,msg:msg});}
    snapL(1,0,'init','Phase 1 — build LPS (Longest Prefix Suffix) table. LPS[0]=0 by definition. Start: i=1, len=0');
    while(i<m){
      if(PAT[i]===PAT[length]){
        var lb=length;length++;lp[i]=length;
        snapL(i,lb,'eq','P['+i+']="'+PAT[i]+'" == P['+lb+']="'+PAT[lb]+'" → LPS['+i+']='+length+', i++',i,lb,'ok');
        i++;
      }else if(length!==0){
        var old=length;length=lp[length-1];
        snapL(i,old,'fall','P['+i+']="'+PAT[i]+'" ≠ P['+old+']="'+PAT[old]+'" → fall back: len = LPS['+(old-1)+'] = '+length,i,old,'bad');
      }else{
        lp[i]=0;
        snapL(i,0,'zero','P['+i+']="'+PAT[i]+'" ≠ P[0]="'+PAT[0]+'" and len=0 → LPS['+i+']=0',i,0,'bad');
        i++;
      }
    }
    snapL(-1,-1,'lpsdone','LPS COMPLETE = ['+lp.join(', ')+'] — Phase 2: search! Text pointer will only move FORWARD');
    // ---- Phase 2: search ----
    var ti=0,pj=0,matched=[],comps=0,jumps=0,shifts=0;
    function snapS(start,j,cmp,kind,msg,extra){
      var o={phase:'search',start:start,j:j,cmp:cmp,matched:matched.slice(),lp:lp.slice(),comps:comps,jumps:jumps,shifts:shifts,kind:kind,msg:msg};
      if(extra)for(var k in extra)o[k]=extra[k];
      steps.push(o);
    }
    while(ti<TEXT.length){
      if(TEXT[ti]===PAT[pj]){
        comps++;
        snapS(ti-pj,pj,'ok','cmp','text['+ti+']="'+TEXT[ti]+'" == pattern['+pj+']="'+PAT[pj]+'" ✓ '+(pj+1)+'/'+m+' matched');
        ti++;pj++;
        if(pj===m){
          var pos=ti-pj;matched.push(pos);
          snapS(pos,-1,null,'match','✓✓ MATCH at position '+pos+'! ('+matched.length+' found) — '+(matched.length===1?'overlapping allowed:':'')+' j = LPS['+(m-1)+'] = '+lp[m-1]+' next',{allHit:true});
          pj=lp[m-1];
        }
      }else if(pj!==0){
        jumps++;
        var nj=lp[pj-1];
        snapS(ti-pj,pj,'bad','jump','MISMATCH at text['+ti+'] — text pointer STAYS. Jump: j = LPS['+(pj-1)+'] = '+nj+' → pattern slides right by '+(pj-nj));
        pj=nj;
      }else{
        shifts++;
        snapS(ti,0,'bad','shift','Mismatch at window start → slide window right by 1');
        ti++;
      }
    }
    steps.push({phase:'search',start:TEXT.length-m,j:-1,cmp:null,matched:matched.slice(),lp:lp.slice(),comps:comps,jumps:jumps,shifts:shifts,done:true,kind:'done',
      msg:'KMP done — '+matched.length+' match(es) at ['+matched.join(', ')+']: '+comps+' comparisons, '+jumps+' LPS jumps, '+shifts+' shifts'});
    return steps;
  }
  function renderLPS(s){
    var lp=s?s.lp:[0,-1,-1,-1];
    var i=s?s.i:-1,len=s?s.len:-1;
    var h='';
    function row(label,cells){return '<div class="lprow"><span class="lphead">'+label+'</span>'+cells.join('')+'</div>';}
    var ri=[],rp=[],rl=[];
    for(var k=0;k<m;k++){
      ri.push('<div class="lcell'+(k===i?' gold':'')+'">'+k+'</div>');
      var pc='';
      if(s&&s.pB===k)pc=' gold';
      else if(s&&s.pA===k)pc=s.pCmp==='ok'?' ok':s.pCmp==='bad'?' bad':' acc';
      rp.push('<div class="lcell'+pc+'">'+PAT[k]+'</div>');
      rl.push('<div class="lcell'+(lp[k]===-1?'':(k===i?' gold':' ok'))+'">'+(lp[k]===-1?'?':lp[k])+'</div>');
    }
    h+=row('i',ri);h+=row('P',rp);h+=row('LPS',rl);
    var ptr='<div class="lpptr">';
    if(s&&s.phase==='lps'){
      if(s.i>=0)ptr+='<span class="pt gold">i = '+s.i+'</span>';
      if(s.len>=0&&s.kind!=='lpsdone')ptr+='<span class="pt acc">len = '+s.len+'</span>';
      if(s.kind==='eq')ptr+='<span class="pt ok">✓ equal → LPS['+s.i+'] = '+(s.len+1)+'</span>';
      if(s.kind==='fall')ptr+='<span class="pt bad">✗ → len = LPS['+(s.len-1)+'] = '+lp[s.len-1]+'</span>';
      if(s.kind==='zero')ptr+='<span class="pt bad">✗ and len=0 → LPS['+s.i+'] = 0</span>';
      if(s.kind==='lpsdone')ptr+='<span class="pt ok">table ready — switching to search phase</span>';
    }else if(s&&s.phase==='search'){
      ptr+='<span class="pt ok">search: on mismatch at j → j = LPS[j-1] (no text backtracking)</span>';
      if(s.kind==='jump')ptr+='<span class="pt bad">j: '+(s.j)+' → '+lp[s.j-1]+' — slide right</span>';
      if(s.kind==='match')ptr+='<span class="pt ok">match! j resets to LPS['+(m-1)+'] = '+lp[m-1]+'</span>';
    }else{
      ptr+='<span class="pt">phase 1: build the LPS table →</span>';
    }
    $('lps1').innerHTML=h+ptr+'</div>';
  }
  function render(s,el){
    panelReset('log1','res1');
    renderLPS(s);
    var isSearch=s&&s.phase==='search';
    var st=(isSearch||!s)?{start:s?s.start:0,j:s?(s.j===undefined?-1:s.j):-1,cmp:s?s.cmp:null,matched:s?s.matched||[]:[],hideText:!isSearch,allHit:s&&s.allHit}:{hideText:true,start:0,j:-1,cmp:null,matched:[]};
    renderRows('rows1',TEXT,PAT,st);
    if(s&&isSearch&&s.j>=0&&s.cmp)$('ro1').innerHTML='text['+(st.start+s.j)+'] = "<span class="'+(s.cmp==='ok'?'ok':'bad')+'">'+TEXT[st.start+s.j]+'</span>"  ↔  pattern['+s.j+'] = "<span class="'+(s.cmp==='ok'?'ok':'bad')+'">'+PAT[s.j]+'</span>"';
    else if(s&&s.phase==='lps')$('ro1').textContent='Phase 1 — LPS table construction (text hidden)';
    else if(isSearch)$('ro1').textContent='Phase 2 — searching text with LPS jumps';
    else $('ro1').textContent='KMP ready — press Step to build LPS';
    $('stats1').innerHTML=isSearch||!s?stats([['Comparisons',s?s.comps:0],['LPS jumps',s?s.jumps:0],['Window shifts',s?s.shifts:0],['Matches',s?(s.matched||[]).length:0]]):'';
    if(s){logAdd('log1',s.msg,s.done?'ok':s.kind==='match'?'ok':s.kind==='jump'||s.kind==='fall'?'bad':'hl');if(s.done)showRes('res1',s.msg);el.textContent=s.msg;el.className='status'+(s.done?' ok':' hl');}
  }
  makeCtrl(1,build,render);
})();}catch(e){var el=$('s1');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 2: RABIN-KARP (d=10, M=90 — small so collisions are VISIBLE)
// ============================================================
try{(function(){
  var D=10,M=90,m=PAT.length,n=TEXT.length;
  function val(c){return c.charCodeAt(0)-64;}
  function mod(x){return ((x%M)+M)%M;}
  function rawHash(str){var h=0;for(var i=0;i<str.length;i++)h=h*10+val(str[i]);return h;}
  function build(){
    var steps=[];
    var pw=[1000,100,10,1];
    var pRaw=rawHash(PAT),pH=mod(pRaw);
    var winRaw=[],winH=[];
    for(var s=0;s<=n-m;s++){winRaw[s]=rawHash(TEXT.substr(s,m));winH[s]=mod(winRaw[s]);}
    var rail=[];for(var s=0;s<=n-m;s++)rail.push('todo');
    var matched=[],comps=0,rolls=0,spurs=0,verifs=0;
    function snap(s,j,cmp,kind,msg){
      steps.push({start:s,j:j===undefined?-1:j,cmp:cmp||null,matched:matched.slice(),rail:rail.slice(),pH:pH,winH:winH[s],winRaw:winRaw[s],
        comps:comps,rolls:rolls,spurs:spurs,verifs:verifs,kind:kind,msg:msg});
    }
    // pattern hash
    var terms=PAT.split('').map(function(c,i){return val(c)+'·'+pw[i];}).join(' + ');
    snap(0,-1,null,'inithash','Pattern hash: '+terms+' = '+pRaw+' → '+pRaw+' mod 90 = '+pH+' (target fingerprint)');
    // first window
    var t0=TEXT.substr(0,m).split('').map(function(c,i){return val(c)+'·'+pw[i];}).join(' + ');
    rail[0]='cur';
    snap(0,-1,null,'firsthash','Window @0: '+t0+' = '+winRaw[0]+' → mod 90 = '+winH[0]+(winH[0]===pH?' = TARGET → verify characters!':' ≠ '+pH+' → shift'));
    function verify(s){
      var ok=true;
      rail[s]='eq';
      for(var j=0;j<m;j++){
        verifs++;comps++;
        var eq=TEXT[s+j]===PAT[j];
        snap(s,j,eq?'ok':'bad','cmp','verify '+s+'+'+j+': text['+(s+j)+']="'+TEXT[s+j]+'" vs pattern['+j+']="'+PAT[j]+'" '+(eq?'✓':'✗'));
        if(!eq){ok=false;break;}
      }
      if(ok){matched.push(s);rail[s]='hit';snap(s,-1,null,'match','✓✓ REAL match at '+s+' — fingerprint confirmed! ('+matched.length+' found)');}
      else{spurs++;rail[s]='spur';snap(s,-1,null,'spur','✗✗ SPURIOUS HIT at '+s+' — hash collided ('+winH[s]+') but characters differ! Continue rolling...');}
      return ok;
    }
    if(winH[0]===pH)verify(0);else{rail[0]='skip';snap(0,-1,null,'skip','hash '+winH[0]+' ≠ '+pH+' → shift (0 character comparisons!)');}
    for(var s=1;s<=n-m;s++){
      rolls++;
      if(rail[s-1]==='cur')rail[s-1]='skip';
      rail[s]='cur';
      var rem=winH[s-1]-val(TEXT[s-1])*1000;
      var formula='h\' = (('+winH[s-1]+' − '+val(TEXT[s-1])+'·1000)·10 + '+val(TEXT[s+m-1])+') mod 90 = '+winH[s];
      if(winH[s]===pH){
        snap(s,-1,null,'roll',formula+' = TARGET '+pH+' → hash match! verify characters...');
        verify(s);
      }else{
        snap(s,-1,null,'roll',formula+' = '+winH[s]+' ≠ '+pH+' → shift (no char comparisons!)');
        rail[s]='skip';
      }
    }
    rail[n-m]=rail[n-m]==='cur'?'skip':rail[n-m];
    steps.push({start:n-m,j:-1,cmp:null,matched:matched.slice(),rail:rail.slice(),pH:pH,winH:winH[n-m],winRaw:winRaw[n-m],
      comps:comps,rolls:rolls,spurs:spurs,verifs:verifs,done:true,kind:'done',
      msg:'Rabin-Karp done — '+matched.length+' match(es) at ['+matched.join(', ')+'], '+spurs+' spurious hit(s) caught by verification: '+rolls+' rolls, '+verifs+' char checks'});
    return steps;
  }
  function render(s,el){
    panelReset('log2','res2');
    var st=s||{start:0,j:-1,cmp:null,matched:[],rail:[],pH:41,winH:1121,winRaw:1121,comps:0,rolls:0,spurs:0,verifs:0};
    renderRows('rows2',TEXT,PAT,st);
    var rkCmp=st.j>=0&&st.cmp;
    $('hash2').innerHTML=
      '<div class="hb"><span class="hbl">Pattern hash (mod 90)</span><span class="hbv green">'+st.pH+'</span></div>'+
      '<div class="hb"><span class="hbl">Window @ '+st.start+'</span><span class="hbv'+(st.winH===st.pH?'':'')+'">'+st.winH+'</span></div>'+
      '<div class="hb"><span class="hbl">Verdict</span><span class="hbv '+(rkCmp?(st.cmp==='ok'?'green':'red'):(st.winH===st.pH&&s?'acc':''))+'">'+(rkCmp?(st.cmp==='ok'?'✓':'✗'):(st.winH===st.pH?'= target':'≠ target'))+'</span></div>';
    if(s&&s.kind==='cmp')$('ro2').innerHTML='verify: text['+(st.start+st.j)+']="<span class="'+(st.cmp==='ok'?'ok':'bad')+'">'+TEXT[st.start+st.j]+'</span>" ↔ pattern['+st.j+']="<span class="'+(st.cmp==='ok'?'ok':'bad')+'">'+PAT[st.j]+'</span>"';
    else if(s&&(s.kind==='roll'||s.kind==='firsthash'||s.kind==='inithash'))$('ro2').textContent=s.msg;
    else if(s&&s.kind==='spur')$('ro2').innerHTML='<span style="color:var(--red)">'+s.msg+'</span>';
    else $('ro2').textContent='d = 10, M = 90 (toy modulus so collisions are visible!)';
    // rail
    var h='';
    for(var i=0;i<=n-m;i++){
      var cls='hbx';
      var stt=st.rail?st.rail[i]:'todo';
      if(stt==='cur')cls+=' cur';else if(stt==='hit')cls+=' hit';else if(stt==='spur')cls+=' spur';else if(stt==='skip')cls+=' skip';else if(stt==='cand')cls+=' eq';
      h+='<div class="'+cls+'"><span class="hv">'+winHAll[i]+'</span><span class="hi">@'+i+'</span></div>';
    }
    $('rail2').innerHTML=h;
    $('stats2').innerHTML=stats([['Rolls',st.rolls],['Char checks',st.verifs],['Spurious',st.spurs],['Matches',(st.matched||[]).length]]);
    if(s){logAdd('log2',s.msg,s.done?'ok':s.kind==='match'?'ok':s.kind==='spur'?'bad':'hl');if(s.done)showRes('res2',s.msg);el.textContent=s.msg;el.className='status'+(s.done?' ok':' hl');}
  }
  // precompute rail hashes for display
  var winHAll=[];
  for(var i=0;i<=n-m;i++)winHAll[i]=mod(rawHash(TEXT.substr(i,m)));
  makeCtrl(2,build,render);
})();}catch(e){var el=$('s2');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 3: BOYER-MOORE
// ============================================================
try{(function(){
  var m=PAT.length,n=TEXT.length;
  var bc={};for(var i=0;i<m;i++)bc[PAT[i]]=i;
  function gsShift(k){
    for(var s=1;s<=m;s++){
      var ok=true;
      for(var u=m-k;u<m;u++){if(u-s<0)continue;if(PAT[u-s]!==PAT[u]){ok=false;break;}}
      if(ok)return s;
    }
    return m;
  }
  var gs=[];for(var k=0;k<=m;k++)gs[k]=gsShift(k);
  var bcChars=['A','B','C','D'];
  function build(){
    var steps=[],matched=[],comps=0,skips=0;
    // naive comparison count for the fun stat
    var naive=0;
    for(var s=0;s<=n-m;s++)for(var j=0;j<m;j++){naive++;if(TEXT[s+j]!==PAT[j])break;}
    function snap(start,j,cmp,kind,msg,extra){
      var o={start:start,j:j,cmp:cmp,matched:matched.slice(),comps:comps,skips:skips,kind:kind,msg:msg,bcChar:null,gsk:null};
      if(extra)for(var k2 in extra)o[k2]=extra[k2];
      steps.push(o);
    }
    snap(0,m-1,null,'init','Start at window 0 — compare RIGHT-TO-LEFT (rightmost pattern char first)');
    var i=0;
    while(i<=n-m){
      var j=m-1,full=true;
      while(j>=0){
        comps++;
        var eq=TEXT[i+j]===PAT[j];
        snap(i,j,eq?'ok':'bad','cmp','text['+(i+j)+']="'+TEXT[i+j]+'" vs pattern['+j+']="'+PAT[j]+'" '+(eq?'✓ (next: move LEFT)':'✗ MISMATCH'));
        if(!eq){full=false;break;}
        j--;
      }
      if(full){
        matched.push(i);
        snap(i,-1,null,'match','✓✓ MATCH at position '+i+'! ('+matched.length+' found) — good-suffix says shift by gs['+m+'] = '+gs[m]);
        skips++;
        snap(i,-1,null,'shift','good-suffix jump: window '+i+' → '+(i+gs[m]));
        i+=gs[m];
        continue;
      }
      var c=TEXT[i+j];
      var last=bc[c]!==undefined?bc[c]:-1;
      var bsh=Math.max(1,j-last);
      var k=m-1-j;
      var gsh=gs[k];
      var sh=Math.max(bsh,gsh,1);
      var rule=bsh>gsh?'bad-character wins':bsh<gsh?'good-suffix wins':'both rules agree';
      skips++;
      snap(i,j,'bad','rule','MISMATCH at text['+(i+j)+']="'+c+'": bad-char shift = '+j+'−('+last+') = '+bsh+' | good-suffix(k='+k+') = '+gsh+' → '+rule+', take '+sh+'',{bcChar:c,gsk:k,shift:sh});
      snap(i,-1,null,'shift','JUMP! window '+i+' → '+(i+sh)+' (naive would only advance by 1)');
      i+=sh;
    }
    steps.push({start:n-m,j:-1,cmp:null,matched:matched.slice(),comps:comps,skips:skips,done:true,kind:'done',bcChar:null,gsk:null,
      msg:'Boyer-Moore done — '+matched.length+' match(es) at ['+matched.join(', ')+']: '+comps+' comparisons vs naive '+naive+' ('+(naive/Math.max(1,comps)).toFixed(1)+'× fewer!), '+skips+' jumps'});
    return steps;
  }
  function render(s,el){
    panelReset('log3','res3');
    var st=s||{start:0,j:-1,cmp:null,matched:[],comps:0,skips:0,bcChar:null,gsk:null};
    renderRows('rows3',TEXT,PAT,st);
    // bad char table
    var bh='';
    bcChars.forEach(function(c){
      var hl=st.bcChar===c?' hl':'';
      bh+='<div class="trow"><span class="tcell key">'+c+'</span><span class="tcell'+hl+'">'+(bc[c]!==undefined?bc[c]:-1)+'</span></div>';
    });
    $('bcT').innerHTML=bh;
    // good suffix table
    var gh='';
    for(var k=0;k<=m;k++){
      var hl=st.gsk===k?' hl2':'';
      gh+='<div class="trow"><span class="tcell key">k='+k+'</span><span class="tcell'+hl+'">'+gs[k]+'</span></div>';
    }
    $('gsT').innerHTML=gh;
    if(s&&s.kind==='cmp')$('ro3').innerHTML='right-to-left: text['+(st.start+st.j)+']="<span class="'+(st.cmp==='ok'?'ok':'bad')+'">'+TEXT[st.start+st.j]+'</span>" ↔ pattern['+st.j+']="<span class="'+(st.cmp==='ok'?'ok':'bad')+'">'+PAT[st.j]+'</span>"';
    else if(s&&s.kind==='rule')$('ro3').textContent='✗ mismatch → '+s.msg;
    else if(s&&s.kind==='shift')$('ro3').textContent='➜ '+s.msg;
    else if(s&&s.kind==='match')$('ro3').innerHTML='<span class="ok">'+s.msg+'</span>';
    else $('ro3').textContent='compare right→left; skip with max(bad-char, good-suffix)';
    $('stats3').innerHTML=stats([['Comparisons',st.comps],['Window jumps',st.skips],['Matches',(st.matched||[]).length]]);
    if(s){logAdd('log3',s.msg,s.done?'ok':s.kind==='match'?'ok':s.kind==='rule'||s.kind==='shift'?'bad':'hl');if(s.done)showRes('res3',s.msg);el.textContent=s.msg;el.className='status'+(s.done?' ok':' hl');}
  }
  makeCtrl(3,build,render);
})();}catch(e){var el=$('s3');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}

// ============================================================
// 4: AHO-CORASICK
// ============================================================
try{(function(){
  var T2='ahishers';
  var PCOL={he:'#ff6b6b',she:'#00d4ff',his:'#48d0b0',hers:'#f1c40f'};
  var TRIE={
    nodes:{
      root:{ch:'\u03bb',name:'\u2205',x:340,y:45,out:null,fail:null},
      h:{ch:'h',name:'h',x:235,y:140,out:null,fail:'root'},
      s0:{ch:'s',name:'s',x:445,y:140,out:null,fail:'root'},
      e1:{ch:'e',name:'he',x:175,y:235,out:'he',fail:'root'},
      i1:{ch:'i',name:'hi',x:305,y:235,out:null,fail:'root'},
      h1:{ch:'h',name:'sh',x:445,y:235,out:null,fail:'h'},
      r1:{ch:'r',name:'her',x:175,y:330,out:null,fail:'root'},
      s1:{ch:'s',name:'his',x:305,y:330,out:'his',fail:'s0'},
      e2:{ch:'e',name:'she',x:445,y:330,out:'she',fail:'e1'},
      s2:{ch:'s',name:'hers',x:175,y:420,out:'hers',fail:'s0'}
    },
    kids:{root:{h:'h',s:'s0'},h:{e:'e1',i:'i1'},s0:{h:'h1'},e1:{r:'r1'},i1:{s:'s1'},h1:{e:'e2'},r1:{s:'s2'}},
    parent:{h:'root',s0:'root',e1:'h',i1:'h',h1:'s0',r1:'e1',s1:'i1',e2:'h1',s2:'r1'}
  };
  function kid(id,c){var k=TRIE.kids[id];return k&&k[c]?k[c]:null;}
  function build(){
    var steps=[],emitted=[],cur='root',pos=-1;
    function snap(kind,msg,extra){
      var o={cur:cur,emitted:emitted.map(function(e){return {pat:e.pat,pos:e.pos};}),kind:kind,msg:msg,p:pos,onEdge:null,onFail:null,outNode:null};
      if(extra)for(var k in extra)o[k]=extra[k];
      steps.push(o);
    }
    snap('init','Trie built for dictionary {he, she, his, hers} with failure links — scanning text "'+T2+'" one character at a time',{p:-1});
    for(pos=0;pos<T2.length;pos++){
      var c=T2[pos];
      while(cur!=='root'&&!kid(cur,c)){
        var from=cur;cur=TRIE.nodes[cur].fail;
        snap('fail','read "'+c+'" @'+pos+': no "'+c+'" edge from state "'+TRIE.nodes[from].name+'" → follow FAILURE link → "'+TRIE.nodes[cur].name+'"',{onFail:[from,cur]});
      }
      var to=kid(cur,c);
      if(to){
        var from2=cur;cur=to;
        snap('move','read "'+c+'" @'+pos+': take trie edge → state "'+TRIE.nodes[cur].name+'"',{onEdge:[from2,cur]});
        var t=cur;
        while(t&&t!=='root'&&TRIE.nodes[t]){
          var outP=TRIE.nodes[t].out;
          if(outP){
            emitted.push({pat:outP,pos:pos});
            snap('out','★ OUTPUT "'+outP+'" ending at position '+pos+'! ('+emitted.length+' total)',{outNode:t});
          }
          t=TRIE.nodes[t].fail;
        }
      }else{
        snap('stay','read "'+c+'" @'+pos+': no matching edge at root → stay at root',{});
      }
    }
    snap('done','Scan complete — '+emitted.length+' dictionary matches: '+emitted.map(function(e){return '"'+e.pat+'"@'+e.pos;}).join(', '),{p:T2.length});
    return steps;
  }
  function drawTrie(s){
    var svg=$('acSvg');if(!svg)return;
    var cur=s?s.cur:'root';
    var h='<defs>';
    h+='<marker id="ac_mg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0L10,5L0,10z" fill="#34495e"/></marker>';
    h+='<marker id="ac_mc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#00d4ff"/></marker>';
    h+='<marker id="ac_mp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#e84393"/></marker>';
    h+='<filter id="ac_g"><feGaussianBlur stdDeviation="4.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    // fail links
    Object.keys(TRIE.nodes).forEach(function(id){
      var nd=TRIE.nodes[id];
      if(!nd.fail)return;
      var t=TRIE.nodes[nd.fail];
      var mx=(nd.x+t.x)/2,my=(nd.y+t.y)/2-34;
      var active=s&&s.onFail&&((s.onFail[0]===id&&s.onFail[1]===nd.fail)||(s.onFail[1]===id&&s.onFail[0]===nd.fail));
      h+='<path d="M'+nd.x+' '+nd.y+' Q'+mx+' '+my+' '+t.x+' '+t.y+'" fill="none" stroke="#e84393" stroke-width="'+(active?3:1.6)+'" stroke-dasharray="6 5" opacity="'+(active?1:.4)+'"'+(active?' marker-end="url(#ac_mp)"':'')+'/>';
    });
    // tree edges
    Object.keys(TRIE.kids).forEach(function(pid){
      Object.keys(TRIE.kids[pid]).forEach(function(ch){
        var cid=TRIE.kids[pid][ch];
        var a=TRIE.nodes[pid],b=TRIE.nodes[cid];
        var dx=b.x-a.x,dy=b.y-a.y,L=Math.sqrt(dx*dx+dy*dy)||1;
        var x1=a.x+dx/L*21,y1=a.y+dy/L*21,x2=b.x-dx/L*24,y2=b.y-dy/L*24;
        var active=s&&s.onEdge&&s.onEdge[0]===pid&&s.onEdge[1]===cid;
        var col=active?'#00d4ff':'#34495e';
        h+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+col+'" stroke-width="'+(active?3:1.8)+'" marker-end="url(#'+(active?'ac_mc':'ac_mg')+')"'+(active?' filter="url(#ac_g)"':'')+'/>';
        h+='<rect x="'+((a.x+b.x)/2-8)+'" y="'+((a.y+b.y)/2-7)+'" width="16" height="14" rx="7" fill="#060912" stroke="'+(active?'#00d4ff':'#1f2833')+'"/>';
        h+='<text x="'+((a.x+b.x)/2)+'" y="'+((a.y+b.y)/2+4)+'" fill="'+(active?'#00d4ff':'#8892b0')+'" font-size="9.5" text-anchor="middle" font-weight="700">'+ch+'</text>';
      });
    });
    // nodes
    Object.keys(TRIE.nodes).forEach(function(id){
      var nd=TRIE.nodes[id];
      var isCur=id===cur;
      var isOut=s&&s.outNode===id;
      var fill=isCur?'rgba(241,196,15,.2)':isOut?'rgba(72,208,168,.2)':'#1a1d3e';
      var stroke=isCur?'#f1c40f':isOut?'#48d0b0':'#34495e';
      h+='<circle cx="'+nd.x+'" cy="'+nd.y+'" r="20" fill="'+fill+'" stroke="'+stroke+'" stroke-width="3"'+(isCur?' filter="url(#ac_g)"':'')+'/>';
      h+='<text x="'+nd.x+'" y="'+(nd.y+5)+'" fill="'+(isCur?'#f1c40f':isOut?'#48d0b0':'#8892b0')+'" font-size="13" text-anchor="middle" font-weight="700">'+nd.name+'</text>';
      if(nd.out)h+='<text x="'+nd.x+'" y="'+(nd.y+35)+'" fill="'+PCOL[nd.out]+'" font-size="11" text-anchor="middle" font-weight="700">\u2191 '+nd.out+'</text>';
    });
    svg.innerHTML=h;
  }
  function render(s,el){
    panelReset('log4','res4');
    var st=s||{cur:'root',emitted:[],p:-1,kind:null};
    // text strip
    var h='<div class="row">';
    for(var i=0;i<T2.length;i++){
      var cls='ch';
      if(st.p===i)cls+=' tcur';
      else if(i<st.p)cls+=' past';
      var bars='';
      var ms=(st.emitted||[]).filter(function(e){return e.pos===i;});
      ms.forEach(function(e,b){bars+='<span class="mk" style="bottom:'+(3+b*5)+'px;background:'+PCOL[e.pat]+'"></span>';});
      if(ms.length)cls+=' mkwrap';
      h+='<div class="'+cls+'">'+T2[i]+'<span class="ix">'+i+'</span>'+bars+'</div>';
    }
    $('acText').innerHTML=h+'</div>';
    drawTrie(st);
    var oh='';
    (st.emitted||[]).forEach(function(e){
      oh+='<div class="oc" style="border-color:'+PCOL[e.pat]+';color:'+PCOL[e.pat]+'">'+e.pat+' @ '+e.pos+'</div>';
    });
    $('outs4').innerHTML=oh||'<span style="color:var(--dim);font-size:.75rem">— no matches yet —</span>';
    if(s){logAdd('log4',s.msg,s.done?'ok':s.kind==='out'?'ok':s.kind==='fail'?'bad':'hl');if(s.done)showRes('res4',s.msg);el.textContent=s.msg;el.className='status'+(s.done?' ok':' hl');}
  }
  makeCtrl(4,build,render);
})();}catch(e){var el=$('s4');if(el)el.innerHTML='<span class="err-msg">Error: '+e.message+'</span>';}
