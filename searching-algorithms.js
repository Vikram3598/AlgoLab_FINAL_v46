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

/* ===================== shared: array search ===================== */
const ARR=[3,7,11,15,18,22,26,30,34,40];
function mkSnap(steps,chips){
  return function(msg,o){
    o=o||{};
    o.msg=msg;
    o.chips=chips.slice();
    o.chipI=chips.length-1;
    steps.push(o);
  };
}
function winS(w){return w?('['+w[0]+', '+w[1]+']'):'—';}
function renderArr(st,n){
  chipsUI('ops',n,st.chips||[],st.chipI||0,true);
  statsUI(n,st);
  const a=E('arr'+n);
  if(a){
    let h='';
    for(let i=0;i<ARR.length;i++){
      let cls='acell';
      if(st.win&&(i<st.win[0]||i>st.win[1]))cls+=' out';
      if(st.probes&&st.probes.indexOf(i)>=0)cls+=' probe';
      if(st.found===i)cls+=' found';
      if(st.sentinel===i)cls+=' sent';
      const v=(st.vals&&st.vals[i]!==undefined)?st.vals[i]:ARR[i];
      h+='<div class="'+cls+'"><div class="av">'+v+'</div><div class="ai">idx '+i+'</div></div>';
    }
    a.innerHTML=h;
  }
  const f=E('aptr'+n);
  if(f)f.textContent=st.formula||'';
}

/* ===================== 0: LINEAR SEARCH ===================== */
function linearBuild(){
  const steps=[],chips=['init'],snap=mkSnap(steps,chips);
  const key=26;
  let probes=[];
  snap('linear search: scan arr left → right looking for key = 26 — no sorting required',
    {win:[0,9],probes:[],formula:'arr = [3, 7, 11, 15, 18, 22, 26, 30, 34, 40]     key = 26',
     stats:[['Probes',0],['Window',winS([0,9])],['Key',key]]});
  for(let i=0;i<ARR.length;i++){
    probes=probes.concat([i]);
    chips.push('i='+i);
    const eq=ARR[i]===key;
    snap('i='+i+': arr['+i+'] = '+ARR[i]+(eq?' = key → MATCH':' ≠ 26 → continue'),
      {probes:probes.slice(),win:[i,9],
       formula:'i = '+i+'   arr['+i+'] = '+ARR[i]+'   vs 26   →   '+(eq?'EQUAL':'not equal, i++'),
       stats:[['Probes',probes.length],['Window',winS([i,9])],['Key',key]],
       cls:eq?'ok':'hl',log:'i='+i+'  a='+ARR[i]+(eq?' == key':''),lcls:eq?'ok':''});
    if(eq)break;
  }
  chips.push('found');
  snap('✓ scan complete — found 26 at index 6 after '+probes.length+' probes',
    {probes:probes.slice(),win:[6,6],found:6,formula:'first match at index 6 → stop',
     stats:[['Probes',probes.length],['Index',6],['Key',key]],
     done:true,cls:'ok',log:'found @ 6',lcls:'ok',
     res:'✓ Found 26 at index 6 — linear search · 7 probes · O(n) time, O(1) space',sfx:'done'});
  return steps;
}

/* ===================== 1: SENTINEL LINEAR SEARCH ===================== */
function sentinelBuild(){
  const steps=[],chips=['sentinel'],snap=mkSnap(steps,chips);
  const key=18,sent=[3,7,11,15,18,22,26,30,34,18];
  let probes=[];
  snap('sentinel method: save a[9] = 40, overwrite a[9] ← 18 — the loop needs no bounds check',
    {win:[0,9],sentinel:9,vals:sent,probes:[],
     formula:'saved a[9]=40 → a[9] ← key(18) →  i=0;  while a[i] ≠ 18: i++',
     stats:[['Comparisons',0],['Window',winS([0,9])],['Key',key]]});
  for(let i=0;i<ARR.length;i++){
    probes=probes.concat([i]);
    chips.push('i='+i);
    const eq=ARR[i]===key;
    snap('i='+i+': a['+i+'] = '+ARR[i]+(eq?' = 18 → loop exits at i=4':' ≠ 18 → i++ (one comparison, no bound test)'),
      {win:[i,9],sentinel:9,vals:sent,probes:probes.slice(),
       formula:'i = '+i+'   a['+i+'] = '+ARR[i]+'   vs 18   →   '+(eq?'MATCH — stop':'i++'),
       stats:[['Comparisons',probes.length],['Window',winS([i,9])],['Key',key]],
       cls:eq?'ok':'hl',log:'i='+i+'  a='+ARR[i]+(eq?' == key':''),lcls:eq?'ok':''});
    if(eq)break;
  }
  chips.push('restore');
  snap('restore a[9] = 40; i = 4 < 9 → the match at index 4 is a real element, not the sentinel slot',
    {win:[4,4],probes:probes.slice(),
     formula:'a[9] restored to 40    i = 4  →  genuine match (i is not the sentinel index)',
     stats:[['Comparisons',probes.length],['Index',4],['Key',key]],cls:'hl'});
  chips.push('found');
  snap('✓ sentinel search complete — found 18 at index 4',
    {win:[4,4],probes:probes.slice(),found:4,formula:'match at index 4 → array restored',
     stats:[['Comparisons',probes.length],['Index',4],['Key',key]],
     done:true,cls:'ok',log:'found @ 4',lcls:'ok',
     res:'✓ Found 18 at index 4 — sentinel linear search · 5 comparisons · avoids the per-step bounds test (n+1 worst case)',sfx:'done'});
  return steps;
}

/* ===================== 2: BINARY SEARCH ===================== */
function binaryBuild(){
  const steps=[],chips=['init'],snap=mkSnap(steps,chips);
  const key=26;
  let low=0,high=9;
  const probes=[];
  snap('binary search: sorted array, low = 0, high = 9 — probe the midpoint, discard half each time',
    {win:[0,9],probes:[],formula:'low = 0    high = 9    mid = ⌊(low+high)/2⌋',
     stats:[['Probes',0],['Window',winS([0,9])],['Key',key]]});
  while(low<=high){
    const mid=Math.floor((low+high)/2);
    probes.push(mid);
    chips.push('m='+mid);
    const v=ARR[mid];
    if(v===key){
      snap('mid = ⌊('+low+'+'+high+')/2⌋ = '+mid+' → arr['+mid+'] = '+v+' = key → MATCH',
        {win:[low,high],probes:probes.slice(),
         formula:'mid = '+mid+'   arr['+mid+'] = '+v+'   EQUAL → found',
         stats:[['Probes',probes.length],['Window',winS([low,high])],['Key',key]],
         cls:'ok',log:'mid='+mid+'  a='+v+' == key',lcls:'ok'});
      break;
    }
    if(v<key){
      snap('mid = ⌊('+low+'+'+high+')/2⌋ = '+mid+' → arr['+mid+'] = '+v+' < 26 → low = '+(mid+1),
        {win:[mid+1,high],probes:probes.slice(),
         formula:'mid = '+mid+'   arr['+mid+'] = '+v+'  <  26   →   low = '+(mid+1),
         stats:[['Probes',probes.length],['Window',winS([mid+1,high])],['Key',key]],
         log:'mid '+mid+' a='+v+' < key → low '+(mid+1),lcls:'hl'});
      low=mid+1;
    }else{
      snap('mid = ⌊('+low+'+'+high+')/2⌋ = '+mid+' → arr['+mid+'] = '+v+' > 26 → high = '+(mid-1),
        {win:[low,mid-1],probes:probes.slice(),
         formula:'mid = '+mid+'   arr['+mid+'] = '+v+'  >  26   →   high = '+(mid-1),
         stats:[['Probes',probes.length],['Window',winS([low,mid-1])],['Key',key]],
         log:'mid '+mid+' a='+v+' > key → high '+(mid-1),lcls:'hl'});
      high=mid-1;
    }
  }
  chips.push('found');
  snap('✓ binary search complete — found 26 at index 6 after '+probes.length+' probes',
    {probes:probes.slice(),win:[6,6],found:6,formula:'range collapsed to [6, 6] → arr[6] = 26',
     stats:[['Probes',probes.length],['Mids',probes.join(', ')],['Key',key]],
     done:true,cls:'ok',log:'found @ 6',lcls:'ok',
     res:'✓ Found 26 at index 6 — binary search · 4 probes (mids 4, 7, 5, 6) · O(log n), ⌈log₂10⌉ = 4 worst case',sfx:'done'});
  return steps;
}

/* ===================== 3: TERNARY SEARCH ===================== */
function ternaryBuild(){
  const steps=[],chips=['init'],snap=mkSnap(steps,chips);
  const key=22;
  let low=0,high=9,rounds=0;
  let probes=[];
  snap('ternary search: two pivots split [low, high] into thirds — 2 probes per round',
    {win:[0,9],probes:[],formula:'m1 = low + ⌊(high−low)/3⌋    m2 = high − ⌊(high−low)/3⌋',
     stats:[['Rounds',0],['Probes',0],['Key',key]]});
  while(low<=high&&rounds<12){
    const third=Math.floor((high-low)/3);
    const m1=low+third,m2=high-third;
    rounds++;
    chips.push('round '+rounds);
    if(ARR[m1]===key){
      probes=probes.concat([m1,m2]);
      snap('round '+rounds+': m1 = '+m1+' → arr['+m1+'] = '+key+' = key → MATCH',
        {win:[low,high],probes:probes.slice(),
         formula:'arr['+m1+'] = '+ARR[m1]+'   EQUAL → found at '+m1,
         stats:[['Rounds',rounds],['Probes',probes.length],['Key',key]],
         cls:'ok',log:'round '+rounds+'  found @ '+m1,lcls:'ok'});
      break;
    }
    if(ARR[m2]===key){
      probes=probes.concat([m1,m2]);
      snap('round '+rounds+': m1 = '+m1+' ('+ARR[m1]+'), m2 = '+m2+' → arr['+m2+'] = '+ARR[m2]+' = key → MATCH',
        {win:[low,high],probes:probes.slice(),
         formula:'m1 = '+m1+' → '+ARR[m1]+'    m2 = '+m2+' → '+ARR[m2]+'   EQUAL → found at '+m2,
         stats:[['Rounds',rounds],['Probes',probes.length],['Key',key]],
         cls:'ok',log:'round '+rounds+'  found @ '+m2,lcls:'ok'});
      break;
    }
    probes=probes.concat([m1,m2]);
    if(key<ARR[m1]){
      const nh=m1-1;
      snap('round '+rounds+': m1 = '+m1+' ('+ARR[m1]+'), m2 = '+m2+' ('+ARR[m2]+') → key < arr[m1] → keep ['+low+', '+nh+']',
        {win:[low,nh],probes:probes.slice(),
         formula:'22 < arr['+m1+'] = '+ARR[m1]+'   →   discard top two thirds → high = '+nh,
         stats:[['Rounds',rounds],['Probes',probes.length],['Key',key]],
         log:'round '+rounds+'  keep ['+low+', '+nh+']',lcls:'hl'});
      high=nh;
    }else if(key>ARR[m2]){
      const nl=m2+1;
      snap('round '+rounds+': m1 = '+m1+' ('+ARR[m1]+'), m2 = '+m2+' ('+ARR[m2]+') → key > arr[m2] → keep ['+nl+', '+high+']',
        {win:[nl,high],probes:probes.slice(),
         formula:'22 > arr['+m2+'] = '+ARR[m2]+'   →   discard bottom two thirds → low = '+nl,
         stats:[['Rounds',rounds],['Probes',probes.length],['Key',key]],
         log:'round '+rounds+'  keep ['+nl+', '+high+']',lcls:'hl'});
      low=nl;
    }else{
      const nl=m1+1,nh=m2-1;
      snap('round '+rounds+': arr['+m1+'] = '+ARR[m1]+' < 22 < arr['+m2+'] = '+ARR[m2]+' → keep middle third ['+nl+', '+nh+']',
        {win:[nl,nh],probes:probes.slice(),
         formula:'arr['+m1+'] = '+ARR[m1]+'  <  22  <  arr['+m2+'] = '+ARR[m2]+'   →   middle third ['+nl+', '+nh+']',
         stats:[['Rounds',rounds],['Probes',probes.length],['Key',key]],
         log:'round '+rounds+'  keep ['+nl+', '+nh+']',lcls:'hl'});
      low=nl;high=nh;
    }
  }
  chips.push('found');
  snap('✓ ternary search complete — found 22 at index 5 after '+rounds+' rounds',
    {probes:probes.slice(),win:[5,5],found:5,formula:'arr[5] = 22 → found',
     stats:[['Rounds',rounds],['Probes',probes.length],['Key',key]],
     done:true,cls:'ok',log:'found @ 5',lcls:'ok',
     res:'✓ Found 22 at index 5 — ternary search · 2 rounds, 4 probes (3, 6, 4, 5) · O(log₃ n), 2 probes per round',sfx:'done'});
  return steps;
}

/* ===================== 4: META BINARY SEARCH ===================== */
function metabinaryBuild(){
  const steps=[],chips=['init'],snap=mkSnap(steps,chips);
  const key=26;
  let i=0;
  const probes=[];
  snap('meta-binary (one-sided): i = 0, stride l = 8 — probe only at i + l, the cursor never moves back',
    {win:[0,9],probes:[],formula:'i = 0    l = 8 (largest power of 2 < 10)    probe at i + l',
     stats:[['Probes',0],['i',0],['Key',key]]});
  const strides=[8,4,2,1];
  for(let s=0;s<strides.length;s++){
    const l=strides[s];
    chips.push('l='+l);
    const j=i+l;
    if(j>=ARR.length){
      snap('l = '+l+': i + l = '+j+' ≥ 10 → out of bounds, halve l',
        {win:[i,9],probes:probes.slice(),
         formula:'i + l = '+j+'  ≥  n = 10   →   skip probe, l = '+(l/2),
         stats:[['Probes',probes.length],['i',i],['Key',key]],
         log:'l='+l+'  out of bounds',lcls:'hl'});
      continue;
    }
    probes.push(j);
    const v=ARR[j];
    if(v<=key){
      i=j;
      snap('l = '+l+': arr['+j+'] = '+v+' ≤ 26 → advance i = '+j+', halve l → '+(l/2),
        {win:[i,9],probes:probes.slice(),
         formula:'arr['+j+'] = '+v+'  ≤  26   →   i = '+j+'    l = '+(l/2),
         stats:[['Probes',probes.length],['i',i],['Key',key]],
         log:'l='+l+'  a['+j+']='+v+' ≤ key → i='+j,lcls:'hl'});
    }else{
      snap('l = '+l+': arr['+j+'] = '+v+' > 26 → i stays '+i+', halve l → '+(l/2),
        {win:[i,9],probes:probes.slice(),
         formula:'arr['+j+'] = '+v+'  >  26   →   i = '+i+'    l = '+(l/2),
         stats:[['Probes',probes.length],['i',i],['Key',key]],
         log:'l='+l+'  a['+j+']='+v+' > key → i unchanged',lcls:'hl'});
    }
  }
  chips.push('found');
  const hit=(ARR[i]===key);
  if(hit){
    snap('verify cursor: arr['+i+'] = '+ARR[i]+' = 26 → MATCH at index '+i,
      {probes:probes.slice(),win:[i,9],found:i,
       formula:'i = '+i+'   arr['+i+'] = '+ARR[i]+'   EQUAL → found',
       stats:[['Probes',probes.length],['i',i],['Key',key]],
       cls:'ok',log:'found @ '+i,lcls:'ok',
       done:true,res:'✓ Found 26 at index 6 — meta-binary search · 4 probes (strides 8 → 4 → 2 → 1) · O(log i) probes to position i',sfx:'done'});
  }else{
    snap('verify cursor: arr['+i+'] = '+ARR[i]+' ≠ 26 → key not present',
      {probes:probes.slice(),win:[i,9],
       formula:'i = '+i+'   arr['+i+'] = '+ARR[i]+'   NOT equal',
       stats:[['Probes',probes.length],['i',i],['Key',key]],
       cls:'err',log:'not found',lcls:'bad',
       done:true,bad:true,res:'✗ key not found after '+probes.length+' probes',sfx:'bad'});
  }
  return steps;
}

/* ===================== 5: INTERPOLATION SEARCH ===================== */
function interpolationBuild(){
  const steps=[],chips=['init'],snap=mkSnap(steps,chips);
  const key=34;
  let low=0,high=9;
  const probes=[];
  snap('interpolation search: probe where the key would sit if values were uniformly spread',
    {win:[0,9],probes:[],
     formula:'pos = low + ⌊(key − a[low])·(high − low) / (a[high] − a[low])⌋',
     stats:[['Probes',0],['Window',winS([0,9])],['Key',key]]});
  let done=false;
  while(low<=high&&!done){
    const denom=ARR[high]-ARR[low];
    const pos=(denom===0)?low:low+Math.floor((key-ARR[low])*(high-low)/denom);
    const posr=(denom===0)?low:low+((key-ARR[low])*(high-low)/denom);
    probes.push(pos);
    chips.push('p='+pos);
    const v=ARR[pos];
    if(v===key){
      snap('pos = '+low+' + ⌊('+key+'−'+ARR[low]+')·('+high+'−'+low+') / ('+ARR[high]+'−'+ARR[low]+')⌋ = '+pos+' → arr['+pos+'] = '+v+' = key → MATCH',
        {win:[low,high],probes:probes.slice(),
         formula:'pos = '+pos+' (≈ '+posr.toFixed(2)+')   arr['+pos+'] = '+v+'   EQUAL → found',
         stats:[['Probes',probes.length],['Window',winS([low,high])],['Key',key]],
         cls:'ok',log:'pos='+pos+'  a='+v+' == key',lcls:'ok'});
      done=true;
      break;
    }
    if(v<key){
      const nl=pos+1;
      snap('pos = '+pos+' → arr['+pos+'] = '+v+' < 34 → low = '+nl,
        {win:[nl,high],probes:probes.slice(),
         formula:'pos = '+pos+' (≈ '+posr.toFixed(2)+')   arr['+pos+'] = '+v+'  <  34   →   low = '+nl,
         stats:[['Probes',probes.length],['Window',winS([nl,high])],['Key',key]],
         log:'pos '+pos+' a='+v+' < key → low '+nl,lcls:'hl'});
      low=nl;
    }else{
      const nh=pos-1;
      snap('pos = '+pos+' → arr['+pos+'] = '+v+' > 34 → high = '+nh,
        {win:[low,nh],probes:probes.slice(),
         formula:'pos = '+pos+' (≈ '+posr.toFixed(2)+')   arr['+pos+'] = '+v+'  >  34   →   high = '+nh,
         stats:[['Probes',probes.length],['Window',winS([low,nh])],['Key',key]],
         log:'pos '+pos+' a='+v+' > key → high '+nh,lcls:'hl'});
      high=nh;
    }
  }
  chips.push('found');
  snap('✓ interpolation search complete — found 34 at index 8 after '+probes.length+' probes',
    {probes:probes.slice(),win:[8,8],found:8,formula:'arr[8] = 34 → found',
     stats:[['Probes',probes.length],['Index',8],['Key',key]],
     done:true,cls:'ok',log:'found @ 8',lcls:'ok',
     res:'✓ Found 34 at index 8 — interpolation search · 2 probes (pos 7, then 8) · O(log log n) on uniform data',sfx:'done'});
  return steps;
}

/* ===================== 6: EXPONENTIAL SEARCH ===================== */
function exponentialBuild(){
  const steps=[],chips=['init'],snap=mkSnap(steps,chips);
  const key=30;
  const probes=[];
  snap('exponential search: double bound = 1, 2, 4, 8 … until arr[bound] > key, then binary search the window',
    {win:[0,1],probes:[],formula:'bound = 1;  while arr[bound] ≤ 30: bound ×= 2',
     stats:[['Probes',0],['Bound',1],['Key',key]]});
  let bound=1;
  while(bound<ARR.length&&ARR[bound]<=key){
    probes.push(bound);
    chips.push('b='+bound);
    const nb=bound*2;
    snap('bound = '+bound+': arr['+bound+'] = '+ARR[bound]+' ≤ 30 → double bound to '+nb,
      {win:[0,bound],probes:probes.slice(),
       formula:'arr['+bound+'] = '+ARR[bound]+'  ≤  30   →   bound = '+bound+' × 2 = '+nb,
       stats:[['Probes',probes.length],['Bound',nb],['Key',key]],
       log:'bound '+bound+' a='+ARR[bound]+' ≤ key → '+nb,lcls:'hl'});
    bound=nb;
  }
  probes.push(bound);
  chips.push('b='+bound);
  const lo=Math.floor(bound/2),hi=Math.min(bound,ARR.length-1);
  snap('bound = '+bound+': arr['+bound+'] = '+ARR[bound]+' > 30 → stop; binary search window = ['+lo+', '+hi+']',
    {win:[lo,hi],probes:probes.slice(),
     formula:'arr['+bound+'] = '+ARR[bound]+'  >  30   →   window ['+lo+', '+hi+']',
     stats:[['Probes',probes.length],['Window',winS([lo,hi])],['Key',key]],
     log:'window ['+lo+', '+hi+']',lcls:'hl'});
  let low=lo,high=hi;
  while(low<=high){
    const mid=Math.floor((low+high)/2);
    probes.push(mid);
    chips.push('m='+mid);
    const v=ARR[mid];
    if(v===key){
      snap('binary pass: mid = '+mid+' → arr['+mid+'] = '+v+' = key → MATCH',
        {win:[low,high],probes:probes.slice(),
         formula:'mid = '+mid+'   arr['+mid+'] = '+v+'   EQUAL → found',
         stats:[['Probes',probes.length],['Window',winS([low,high])],['Key',key]],
         cls:'ok',log:'mid '+mid+' == key',lcls:'ok'});
      break;
    }
    if(v<key){
      snap('binary pass: mid = '+mid+' → arr['+mid+'] = '+v+' < 30 → low = '+(mid+1),
        {win:[mid+1,high],probes:probes.slice(),
         formula:'mid = '+mid+'   arr['+mid+'] = '+v+'  <  30   →   low = '+(mid+1),
         stats:[['Probes',probes.length],['Window',winS([mid+1,high])],['Key',key]],
         log:'mid '+mid+' a='+v+' < key → low '+(mid+1),lcls:'hl'});
      low=mid+1;
    }else{
      snap('binary pass: mid = '+mid+' → arr['+mid+'] = '+v+' > 30 → high = '+(mid-1),
        {win:[low,mid-1],probes:probes.slice(),
         formula:'mid = '+mid+'   arr['+mid+'] = '+v+'  >  30   →   high = '+(mid-1),
         stats:[['Probes',probes.length],['Window',winS([low,mid-1])],['Key',key]],
         log:'mid '+mid+' a='+v+' > key → high '+(mid-1),lcls:'hl'});
      high=mid-1;
    }
  }
  chips.push('found');
  snap('✓ exponential search complete — found 30 at index 7 after '+probes.length+' probes',
    {probes:probes.slice(),win:[7,7],found:7,formula:'arr[7] = 30 → found',
     stats:[['Probes',probes.length],['Index',7],['Key',key]],
     done:true,cls:'ok',log:'found @ 7',lcls:'ok',
     res:'✓ Found 30 at index 7 — exponential search · 6 probes (4 doubling: 1, 2, 4, 8 + 2 binary: 6, 7) · O(log i)',sfx:'done'});
  return steps;
}

/* ===================== 7: JUMP SEARCH ===================== */
function jumpBuild(){
  const steps=[],chips=['init'],snap=mkSnap(steps,chips);
  const key=26,step=3;
  const probes=[];
  snap('jump search: step = ⌊√10⌋ = 3 — probe arr[0], arr[3], arr[6], arr[9] … until arr[i] > 26',
    {win:[0,2],probes:[],formula:'step = ⌊√n⌋ = 3    probe indices 0, 3, 6, 9, …',
     stats:[['Probes',0],['Step',step],['Key',key]]});
  let prev=0,i=0;
  while(i<ARR.length&&ARR[i]<=key){
    probes.push(i);
    chips.push('i='+i);
    const nb=i+step;
    snap('arr['+i+'] = '+ARR[i]+' ≤ 26 → jump +'+step+' to index '+(nb<ARR.length?nb:'(past end)'),
      {win:[i,Math.min(i+step,ARR.length)-1],probes:probes.slice(),
       formula:'arr['+i+'] = '+ARR[i]+'  ≤  26   →   i = '+i+' + '+step+' = '+nb,
       stats:[['Probes',probes.length],['Prev',prev],['Key',key]],
       log:'jump → '+nb,lcls:'hl'});
    prev=i;
    i+=step;
  }
  probes.push(i);
  chips.push('i='+i);
  const bend=Math.min(prev+step,ARR.length)-1;
  snap('arr['+i+'] = '+ARR[i]+' > 26 → stop; block = [prev = '+prev+', '+bend+'] — scan that block backward',
    {win:[prev,bend],probes:probes.slice(),
     formula:'arr['+i+'] = '+ARR[i]+'  >  26   →   block ['+prev+', '+bend+']   scan ← from '+bend,
     stats:[['Probes',probes.length],['Block',winS([prev,bend])],['Key',key]],
     log:'block ['+prev+', '+bend+']',lcls:'hl'});
  let found=-1;
  for(let j=bend;j>=prev;j--){
    probes.push(j);
    chips.push('scan '+j);
    const v=ARR[j];
    if(v===key){
      found=j;
      snap('arr['+j+'] = '+v+' = 26 → MATCH at index '+j,
        {win:[prev,bend],probes:probes.slice(),
         formula:'arr['+j+'] = '+v+'   EQUAL → found',
         stats:[['Probes',probes.length],['Index',j],['Key',key]],
         cls:'ok',log:'scan '+j+' == key',lcls:'ok'});
      break;
    }
    snap('arr['+j+'] = '+v+' > 26 → move left',
      {win:[prev,bend],probes:probes.slice(),
       formula:'arr['+j+'] = '+v+'  >  26   →   j = '+(j-1),
       stats:[['Probes',probes.length],['Block',winS([prev,bend])],['Key',key]],
       log:'scan '+j+' a='+v+' > key',lcls:'hl'});
  }
  chips.push('found');
  snap('✓ jump search complete — found 26 at index '+found+' after '+probes.length+' probes',
    {probes:probes.slice(),win:[found,found],found:found,formula:'block scan ends at index '+found,
     stats:[['Probes',probes.length],['Index',found],['Key',key]],
     done:true,cls:'ok',log:'found @ '+found,lcls:'ok',
     res:'✓ Found 26 at index 6 — jump search · 7 probes (4 jumps: 0, 3, 6, 9 + 3 backward: 8, 7, 6) · O(√n)',sfx:'done'});
  return steps;
}

/* ===================== 8: FIBONACCI SEARCH ===================== */
function fibonacciBuild(){
  const steps=[],chips=['init'],snap=mkSnap(steps,chips);
  const key=22;
  const probes=[];
  const fib=[0,1];
  while(fib[fib.length-1]<ARR.length)fib.push(fib[fib.length-1]+fib[fib.length-2]);
  let fm=fib[fib.length-1],fm1=fib[fib.length-2],fm2=fib[fib.length-3];
  let offset=-1;
  snap('Fibonacci search: Fibs '+fib.join(', ')+' — smallest Fib ≥ 10 is '+fm+'; offset = −1',
    {win:[0,9],probes:[],
     formula:'F = ['+fib.join(', ')+']    offset = −1    i = min(offset + F(k−2), n−1)',
     stats:[['Probes',0],['Fib',fm],['Key',key]]});
  let hit=-1;
  while(fm>1&&hit<0){
    const oldOff=offset,oldFm2=fm2,oldFm=fm,oldFm1=fm1;
    const i=Math.min(offset+fm2,ARR.length-1);
    probes.push(i);
    chips.push('i='+i);
    const v=ARR[i];
    if(v<key){
      offset=i;
      fm=fm1;fm1=fm2;fm2=fm-fm1;
      snap('i = min('+oldOff+' + '+oldFm2+', 9) = '+i+' → arr['+i+'] = '+v+' < 22 → offset = '+i+', Fib window slides right ('+oldFm+' → '+fm+')',
        {win:[i+1,9],probes:probes.slice(),
         formula:'i = min('+oldOff+' + '+oldFm2+', 9) = '+i+'   arr['+i+'] = '+v+'  <  22   →   offset = '+i,
         stats:[['Probes',probes.length],['Fib',fm],['Key',key]],
         log:'i='+i+' a='+v+' < key → offset '+i,lcls:'hl'});
    }else if(v>key){
      fm=fm2;fm1=oldFm1-fm2;fm2=fm-fm1;
      snap('i = min('+oldOff+' + '+oldFm2+', 9) = '+i+' → arr['+i+'] = '+v+' > 22 → window shrinks ('+oldFm+' → '+fm+')',
        {win:[oldOff+1,i-1],probes:probes.slice(),
         formula:'i = min('+oldOff+' + '+oldFm2+', 9) = '+i+'   arr['+i+'] = '+v+'  >  22   →   high = '+(i-1),
         stats:[['Probes',probes.length],['Fib',fm],['Key',key]],
         log:'i='+i+' a='+v+' > key → shrink',lcls:'hl'});
    }else{
      hit=i;
      snap('i = min('+oldOff+' + '+oldFm2+', 9) = '+i+' → arr['+i+'] = '+v+' = 22 → MATCH',
        {win:[i,i],probes:probes.slice(),
         formula:'i = '+i+'   arr['+i+'] = '+v+'   EQUAL → found',
         stats:[['Probes',probes.length],['Fib',oldFm],['Key',key]],
         cls:'ok',log:'i='+i+' == key',lcls:'ok'});
    }
  }
  chips.push('found');
  snap('✓ Fibonacci search complete — found 22 at index '+hit+' after '+probes.length+' probes',
    {probes:probes.slice(),win:[hit,hit],found:hit,formula:'Fib-window search lands on index '+hit,
     stats:[['Probes',probes.length],['Index',hit],['Key',key]],
     done:true,cls:'ok',log:'found @ '+hit,lcls:'ok',
     res:'✓ Found 22 at index 5 — Fibonacci search · 3 probes (4, 7, 5) · windows shifted with only + and −, no division',sfx:'done'});
  return steps;
}

/* ===================== 9/10: GRAPH BFS / DFS ===================== */
const GLAB=['A','B','C','D','E','F','G','H'];
const GEDG=[[0,1],[0,2],[1,3],[2,3],[2,4],[3,5],[4,5],[5,6],[6,7]];
const GADJ=[[1,2],[0,3],[0,3,4],[1,2,5],[2,5],[3,4,6],[5,7],[6]];
const GPOS=[[2,1],[1,2],[3,2],[1,3],[3,3],[2,4],[2,5],[3,5]];
function edgeIdx(u,v){
  for(let i=0;i<GEDG.length;i++){
    const e=GEDG[i];
    if((e[0]===u&&e[1]===v)||(e[0]===v&&e[1]===u))return i;
  }
  return -1;
}
function bfsBuild(){
  const steps=[],chips=['bfs'],snap=mkSnap(steps,chips);
  const disc=new Array(8).fill(false);
  disc[0]=true;
  let cur=null,queue=[0],visited=[],order=[],tree=[],exp=[],maxQ=1;
  function S(msg,o){
    o=o||{};
    o.msg=msg;
    o.mode='bfs';
    o.cur=cur;
    o.queue=queue.slice();
    o.visited=visited.slice();
    o.order=order.slice();
    o.tree=tree.slice();
    o.exp=exp.slice();
    o.stats=[['Visited',visited.length],['In queue',queue.length],['Tree edges',tree.length],['Max queue',maxQ]];
    snap(msg,o);
  }
  S('BFS from A: enqueue A, then dequeue the front and enqueue its undiscovered neighbors (FIFO)',{});
  while(queue.length){
    cur=queue.shift();
    visited.push(cur);
    order.push(cur);
    chips.push(GLAB[cur]);
    const added=[],newExp=[];
    for(let k=0;k<GADJ[cur].length;k++){
      const nb=GADJ[cur][k],ei=edgeIdx(cur,nb);
      if(!disc[nb]){
        disc[nb]=true;
        queue.push(nb);
        added.push(nb);
        if(tree.indexOf(ei)<0)tree.push(ei);
      }else if(tree.indexOf(ei)<0&&exp.indexOf(ei)<0){
        exp.push(ei);
        newExp.push(ei);
      }
    }
    if(queue.length>maxQ)maxQ=queue.length;
    let msg='dequeue '+GLAB[cur]+' → visit '+GLAB[cur];
    if(added.length){
      msg+='; enqueue '+added.map(function(v){return GLAB[v];}).join(', ');
    }else{
      msg+='; no undiscovered neighbors';
    }
    if(newExp.length){
      msg+=' — '+newExp.map(function(ei){return GLAB[GEDG[ei][0]]+'–'+GLAB[GEDG[ei][1]];}).join(', ')+' is a non-tree edge';
    }
    S(msg,{cls:added.length?'hl':undefined,log:'visit '+GLAB[cur],lcls:'hl'});
  }
  cur=null;
  S('✓ BFS complete — queue empty, all 8 nodes visited in level order',
    {done:true,cls:'ok',log:'BFS done',lcls:'ok',
     res:'✓ BFS from A: A → B → C → D → E → F → G → H · level order (L0 A | L1 B, C | L2 D, E | L3 F | L4 G | L5 H) · 7 tree edges · O(V+E)',
     sfx:'done'});
  return steps;
}
function dfsBuild(){
  const steps=[],chips=['dfs'],snap=mkSnap(steps,chips);
  const disc=new Array(8).fill(false);
  disc[0]=true;
  let cur=null,stack=[0],visited=[],order=[],tree=[],exp=[],maxS=1;
  function S(msg,o){
    o=o||{};
    o.msg=msg;
    o.mode='dfs';
    o.cur=cur;
    o.queue=stack.slice();
    o.visited=visited.slice();
    o.order=order.slice();
    o.tree=tree.slice();
    o.exp=exp.slice();
    o.stats=[['Visited',visited.length],['In stack',stack.length],['Tree edges',tree.length],['Max stack',maxS]];
    snap(msg,o);
  }
  S('DFS from A: push A — nodes are visited when popped, discovered when pushed (LIFO)',{});
  while(stack.length){
    cur=stack.pop();
    visited.push(cur);
    order.push(cur);
    chips.push(GLAB[cur]);
    const added=[],newExp=[];
    for(let k=0;k<GADJ[cur].length;k++){
      const nb=GADJ[cur][k],ei=edgeIdx(cur,nb);
      if(!disc[nb]){
        disc[nb]=true;
        added.push(nb);
        if(tree.indexOf(ei)<0)tree.push(ei);
      }else if(tree.indexOf(ei)<0&&exp.indexOf(ei)<0){
        exp.push(ei);
        newExp.push(ei);
      }
    }
    for(let j=added.length-1;j>=0;j--)stack.push(added[j]);
    if(stack.length>maxS)maxS=stack.length;
    let msg='pop '+GLAB[cur]+' → visit '+GLAB[cur];
    if(added.length){
      const rev=added.slice().reverse().map(function(v){return GLAB[v];});
      msg+='; push '+rev.join(', ')+' (so '+GLAB[added[0]]+' pops next)';
    }else{
      msg+='; no undiscovered neighbors';
    }
    if(newExp.length){
      msg+=' — '+newExp.map(function(ei){return GLAB[GEDG[ei][0]]+'–'+GLAB[GEDG[ei][1]];}).join(', ')+' reaches an already-discovered node';
    }
    S(msg,{cls:added.length?'hl':undefined,log:'visit '+GLAB[cur],lcls:'hl'});
  }
  cur=null;
  S('✓ DFS complete — stack empty, all 8 nodes visited',
    {done:true,cls:'ok',log:'DFS done',lcls:'ok',
     res:'✓ DFS from A: A → B → D → F → E → G → H → C · 7 tree edges (C–D, C–E are non-tree) · O(V+E), stack depth ≤ 3',
     sfx:'done'});
  return steps;
}
function renderGraph(st,n){
  chipsUI('ops',n,st.chips||[],st.chipI||0,true);
  statsUI(n,st);
  const g=E('gnodes'+n);
  if(g){
    let h='';
    for(let i=0;i<8;i++){
      let cls='gnode';
      if(st.cur===i)cls+=' cur';
      else if(st.queue&&st.queue.indexOf(i)>=0)cls+=' qd';
      else if(st.visited&&st.visited.indexOf(i)>=0)cls+=' vst';
      h+='<div class="'+cls+'" style="grid-column:'+GPOS[i][0]+';grid-row:'+GPOS[i][1]+'">'+GLAB[i]+'</div>';
    }
    g.innerHTML=h;
  }
  const q=E('gq'+n);
  if(q){
    const isBfs=st.mode==='bfs';
    let h='<span class="qlab">'+(isBfs?'Queue (front first)':'Stack (top last)')+'</span>';
    const arr2=st.queue||[];
    if(!arr2.length)h+='<span class="sq">empty</span>';
    for(let i=0;i<arr2.length;i++){
      let cls='sq op';
      const edge=isBfs?(i===0):(i===arr2.length-1);
      if(edge)cls+=' cur';
      h+='<span class="'+cls+'">'+GLAB[arr2[i]]+'</span>';
    }
    q.innerHTML=h;
  }
  const o=E('gord'+n);
  if(o){
    const ord=st.order||[];
    o.innerHTML=ord.map(function(v,i){
      return '<span class="sq op'+(i===ord.length-1?' cur':' done')+'">'+GLAB[v]+'</span>';
    }).join('');
  }
  const el=E('gedges'+n);
  if(el){
    let h='';
    for(let i=0;i<GEDG.length;i++){
      let cls='ge';
      if(st.tree&&st.tree.indexOf(i)>=0)cls+=' tree';
      else if(st.exp&&st.exp.indexOf(i)>=0)cls+=' exp';
      h+='<div class="'+cls+'">'+GLAB[GEDG[i][0]]+' – '+GLAB[GEDG[i][1]]+'</div>';
    }
    el.innerHTML=h;
  }
}

/* ===================== 11: BST SEARCH ===================== */
const BST={v:20,l:{v:12,l:{v:8,l:{v:6}},r:{v:15}},r:{v:30,l:{v:25,l:{v:22},r:{v:28}},r:{v:40}}};
function bstLayout(){
  const cx={},depth={};
  let slot=0;
  function place(n,d){
    if(!n)return null;
    depth[n.v]=d;
    if(!n.l&&!n.r){
      const c=30+slot*56+23;
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
  place(BST,0);
  const nodes=[],edges=[];
  function emit(n,px,py,pv){
    const y=8+depth[n.v]*72;
    nodes.push({v:n.v,cx:cx[n.v],y:y});
    if(px!==null){
      edges.push({x:px,y:py+40,dx:cx[n.v]-px,dy:y-(py+40),from:pv,to:n.v});
    }
    if(n.l)emit(n.l,cx[n.v],y,n.v);
    if(n.r)emit(n.r,cx[n.v],y,n.v);
  }
  emit(BST,null,null,null);
  return {nodes:nodes,edges:edges};
}
const BSTLAY=bstLayout();
function bstBuild(){
  const steps=[],chips=['root'],snap=mkSnap(steps,chips);
  let cur=20,path=[],hit=false;
  function S(msg,o){
    o=o||{};
    o.msg=msg;
    o.cur=cur;
    o.path=path.slice();
    o.hit=hit;
    o.pathTxt=path.concat([cur]).join(' → ')+(hit?'  ✓':'');
    snap(msg,o);
  }
  S('BST search for key = 22: compare at each node — smaller goes left, larger goes right',
    {stats:[['Comparisons',0],['Node',cur],['Key',22]]});
  chips.push('> 20');
  path=[20];cur=30;
  S('22 > 20 → go right → arrive at 30',
    {stats:[['Comparisons',1],['Node',cur],['Key',22]],cls:'hl',log:'20 → right → 30',lcls:'hl'});
  chips.push('< 30');
  path=[20,30];cur=25;
  S('22 < 30 → go left → arrive at 25',
    {stats:[['Comparisons',2],['Node',cur],['Key',22]],cls:'hl',log:'30 → left → 25',lcls:'hl'});
  chips.push('< 25');
  path=[20,30,25];cur=22;
  S('22 < 25 → go left → arrive at 22',
    {stats:[['Comparisons',3],['Node',cur],['Key',22]],cls:'hl',log:'25 → left → 22',lcls:'hl'});
  chips.push('found');
  hit=true;
  S('✓ node 22 equals the key — found at depth 3',
    {done:true,cls:'ok',log:'found 22 @ depth 3',lcls:'ok',
     res:'✓ Found 22 at depth 3 — 3 comparisons · path 20 → 30 → 25 → 22 · BST search O(h) time, O(1) space',
     stats:[['Comparisons',3],['Depth',3],['Height',4]],sfx:'done'});
  return steps;
}
function renderBST(st,n){
  chipsUI('ops',n,st.chips||[],st.chipI||0,true);
  statsUI(n,st);
  const t=E('tree'+n);
  if(t){
    let h='';
    const inPath=function(v){return st.path.indexOf(v)>=0;};
    for(let i=0;i<BSTLAY.edges.length;i++){
      const e=BSTLAY.edges[i];
      const len=Math.sqrt(e.dx*e.dx+e.dy*e.dy);
      const th=Math.atan2(e.dx,e.dy);
      const on=inPath(e.from)&&(inPath(e.to)||st.cur===e.to)&&st.path.length>0;
      h+='<div class="tedge'+(on?' on':'')+'" style="left:'+(e.x-0.75)+'px;top:'+e.y+'px;height:'+len+'px;transform:rotate('+th+'rad)"></div>';
    }
    for(let i=0;i<BSTLAY.nodes.length;i++){
      const nd=BSTLAY.nodes[i];
      let cls='tlabel';
      if(inPath(nd.v))cls+=' onpath';
      if(nd.v===st.cur)cls+=st.hit?' hit':' cur';
      h+='<div class="'+cls+'" style="left:'+(nd.cx-23)+'px;top:'+nd.y+'px">'+nd.v+'</div>';
    }
    t.innerHTML=h;
  }
  const tp=E('tpath'+n);
  if(tp)tp.textContent=st.pathTxt||'';
}

/* ===================== wiring ===================== */
makeCtrl(0,linearBuild,renderArr);
makeCtrl(1,sentinelBuild,renderArr);
makeCtrl(2,binaryBuild,renderArr);
makeCtrl(3,ternaryBuild,renderArr);
makeCtrl(4,metabinaryBuild,renderArr);
makeCtrl(5,interpolationBuild,renderArr);
makeCtrl(6,exponentialBuild,renderArr);
makeCtrl(7,jumpBuild,renderArr);
makeCtrl(8,fibonacciBuild,renderArr);
makeCtrl(9,bfsBuild,renderGraph);
makeCtrl(10,dfsBuild,renderGraph);
makeCtrl(11,bstBuild,renderBST);

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
