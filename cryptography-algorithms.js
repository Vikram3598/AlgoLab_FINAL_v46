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

/* ===================== shared math ===================== */
function modexpDirect(a,b,m){
  let r=1;
  for(let i=0;i<b;i++)r=(r*a)%m;
  return r;
}
function modexpSteps(a,b,m,opts,steps){
  const bits=b.toString(2);
  const ctx=opts.context||'';
  steps.push(Object.assign({},opts,{
    msg:ctx+' — exponent '+b+' = '+bits+'₂, scan MSB → LSB',
    bitI:-1,R:1,
    formula:ctx+' : '+bits+'₂ ('+bits.length+' bits)'
  }));
  let R=1;
  for(let i=0;i<bits.length;i++){
    const prev=R;
    const raw=prev*prev;
    R=((raw%m)+m)%m;
    steps.push(Object.assign({},opts,{
      msg:'square: '+prev+'² mod '+m+' = '+raw+' mod '+m+' = '+R,
      bitI:i,R:R,sub:'sq',
      formula:prev+'² = '+raw+'   mod '+m+'  →  '+R
    }));
    if(bits[i]==='1'){
      const p2=R*a,prev2=R;
      R=((p2%m)+m)%m;
      steps.push(Object.assign({},opts,{
        msg:'bit 1 → multiply: '+prev2+'×'+a+' = '+p2+' mod '+m+' = '+R,
        bitI:i,R:R,sub:'mul',
        formula:prev2+' × '+a+' = '+p2+'   mod '+m+'  →  '+R
      }));
    }else{
      steps.push(Object.assign({},opts,{
        msg:'bit 0 → square only, no multiply',
        bitI:i,R:R,sub:'skip',
        formula:'bit = 0 → R unchanged = '+R
      }));
    }
  }
  return R;
}
function egcd(a,b){
  if(b===0)return{g:a,x:1,y:0};
  const r=egcd(b,a%b);
  return{g:r.g,x:r.y,y:r.x-Math.floor(a/b)*r.y};
}
function modinv(e,m){
  const r=egcd(e,m);
  return((r.x%m)+m)%m;
}
function euclidTrace(a,b){
  const lines=[];
  let x=a,y=b;
  while(y!==0){
    const q=Math.floor(x/y),r=x%y;
    lines.push(x+' = '+q+' × '+y+' + '+r);
    x=y;y=r;
  }
  lines.push('gcd = '+x);
  return lines;
}

/* ===================== 0: EUCLIDEAN GCD ===================== */
function gcdBuild(){
  const steps=[];
  const chips=[];
  let a=462,b=108,divs=0,chipI=0;
  function snap(msg,o){
    o=o||{};o.msg=msg;o.a=a;o.b=b;o.chips=chips;o.chipI=chipI;
    o.stats=[['Pair',a+', '+b],['Divisions',divs]];
    steps.push(o);
  }
  snap('GCD(462, 108) — Euclidean algorithm: divide, keep remainder',{a:462,b:108,eq:'(462, 108)'});
  while(b!==0){
    chips.push(a+','+b);
    const q=Math.floor(a/b),r=a%b;
    chipI=chips.length-1;
    divs++;
    snap(a+' = '+q+' × '+b+' + '+r,{eq:a+' = '+q+' × '+b+' + '+r,cls:'hl',log:a+' = '+q+'×'+b+' + '+r,lcls:'hl'});
    a=b;b=r;
    if(b===0){
      snap('remainder 0 — stop: GCD = '+a,{eq:'remainder 0  →  GCD = '+a,cls:'ok'});
      break;
    }
    snap('→ next pair ('+a+', '+b+')',{eq:'('+a+', '+b+') — repeat'});
  }
  const g=(function gc(x,y){return y===0?x:gc(y,x%y);})(462,108);
  const ok=g===6&&462%6===0&&108%6===0;
  snap(ok?'GCD = 6 — verified':'GCD wrong',
    {done:true,bad:!ok,cls:ok?'ok':'err',eq:'GCD(462, 108) = '+g,
     res:ok?('✓ GCD(462, 108) = '+g+' — 462 = 6×77, 108 = 6×18, gcd(77, 18) = 1 ('+divs+' divisions)'):'✗ got '+g,
     sfx:ok?'done':'bad'});
  return steps;
}
function renderGCD(st,n){
  chipsUI('seq',n,st.chips||[],st.chipI||0,false);
  statsUI(n,st);
  const ba=E('barA'),bb=E('barB');
  if(ba){
    const w=(st.a/462)*100;
    ba.style.width=Math.max(w,0.6)+'%';
    const lab=ba.parentNode.parentNode.querySelector('.glab');
    if(lab)lab.textContent='a = '+st.a;
  }
  if(bb){
    const w=(st.b/462)*100;
    bb.style.width=Math.max(w,0.6)+'%';
    const lab=bb.parentNode.parentNode.querySelector('.glab');
    if(lab)lab.textContent='b = '+st.b;
  }
  const eq=E('eq0');
  if(eq)eq.textContent=st.eq||'…';
}

/* ===================== 1: SIEVE ===================== */
const SIEVE_N=100;
const SIEVE_OPS=['p=2','p=3','p=5','p=7','primes'];
function sieveBuild(){
  const steps=[];
  const crossed=new Array(SIEVE_N+1).fill(0);
  let curP=0,hitM=0,chipI=0,final=false;
  function snap(msg,o){
    o=o||{};o.msg=msg;o.crossed=crossed.slice();o.curP=curP;o.hitM=hitM;o.final=final;o.chipI=chipI;
    let cx=0;for(let i=2;i<=SIEVE_N;i++)if(crossed[i])cx++;
    o.stats=[['Marked',cx],['Current p',curP||'—']];
    steps.push(o);
  }
  snap('Sieve of Eratosthenes — every prime ≤ 100',{});
  crossed[1]=1;
  snap('1 is neither prime nor composite — exclude it',{log:'1 excluded',lcls:'bad'});
  for(let p=2;p*p<=SIEVE_N;p++){
    if(crossed[p])continue;
    curP=p;
    chipI=p===2?0:p===3?1:p===5?2:3;
    snap('p = '+p+' is prime — cross out from p² = '+(p*p)+' upward',{log:'prime '+p,lcls:'hl'});
    for(let m=p*p;m<=SIEVE_N;m+=p){
      hitM=m;
      if(crossed[m]){
        snap(m+' = '+p+'×'+(m/p)+' already crossed — skip',{});
      }else{
        crossed[m]=p;
        snap('cross '+m+' = '+p+'×'+(m/p),{log:'× '+m,lcls:'bad'});
      }
    }
  }
  curP=0;hitM=0;
  const primes=[];
  for(let i=2;i<=SIEVE_N;i++)if(!crossed[i])primes.push(i);
  final=true;chipI=4;
  snap('scan survivors — every uncrossed number is prime',{log:primes.length+' primes found',lcls:'ok'});
  const ok=primes.length===25;
  snap(ok?'25 primes ≤ 100':'prime count wrong: '+primes.length,
    {done:true,bad:!ok,cls:ok?'ok':'err',
     res:ok?('✓ '+primes.length+' primes ≤ 100: '+primes.join(' ')):'✗ found '+primes.length,
     sfx:ok?'done':'bad'});
  return steps;
}
function renderSieve(st,n){
  chipsUI('ops',n,SIEVE_OPS,st.chipI||0,true);
  statsUI(n,st);
  const g=E('grid1');if(!g)return;
  let h='';
  for(let i=1;i<=SIEVE_N;i++){
    let cls='cel';
    const cx=st.crossed?st.crossed[i]:0;
    if(i===1&&cx===1)cls+=' one';
    else if(finalClass(st,i,cx))cls+=' prime';
    else if(st.hitM===i&&cx)cls+=' hit';
    else if(st.curP===i)cls+=' curp';
    else if(cx)cls+=' cx';
    h+='<div class="'+cls+'">'+i+'</div>';
  }
  g.innerHTML=h;
}
function finalClass(st,i,cx){
  if(!st.final)return false;
  return i>=2&&!cx;
}

/* ===================== 2: MODULAR EXPONENTIATION ===================== */
const ME_A=7,ME_B=220,ME_M=323;
function modexpBuild(){
  const steps=[];
  const R=modexpSteps(ME_A,ME_B,ME_M,{context:'7²²⁰ mod 323'},steps);
  const direct=modexpDirect(ME_A,ME_B,ME_M);
  const ok=R===direct;
  steps.push({
    msg:ok?('7²²⁰ mod 323 = '+R+' — direct multiplication agrees'):'MISMATCH',
    done:true,bad:!ok,cls:ok?'ok':'err',
    res:ok?('✓ 7²²⁰ mod 323 = '+R+' — square-and-multiply = direct power ('+ME_B+' multiplies)'):'✗ '+R+' vs '+direct,
    sfx:ok?'done':'bad',
    stats:[['exponent','220 = 11011100₂'],['result',R]]
  });
  return steps;
}
function renderModexp(st,n){
  statsUI(n,st);
  const bits='11011100';
  const w=E('bits2');
  if(w){
    let h='';
    for(let i=0;i<bits.length;i++){
      let cls='bit';
      if(st.bitI>=bits.length||(st.bitI>=0&&i<st.bitI))cls+=' done';
      if(i===st.bitI)cls+=' cur';
      h+='<div class="'+cls+'"><div class="bv">'+bits[i]+'</div><div class="bi">2^'+(7-i)+'</div></div>';
    }
    w.innerHTML=h;
  }
  const vr=E('valR');
  if(vr)vr.textContent=st.R!==undefined?st.R:'1';
  const eq=E('eq2');
  if(eq)eq.textContent=st.formula||'…';
  const br=E('boxR');
  if(br){br.classList.toggle('acc',st.sub==='mul');br.classList.toggle('mid',st.sub==='sq');}
}

/* ===================== 3: RSA ===================== */
const RSA_P=61,RSA_Q=53,RSA_N=3233,RSA_PHI=3120,RSA_E=17,RSA_D=2753,RSA_M=65;
const RSA_OPS=['p, q','n','φ(n)','gcd(e,φ)','d','keys','encrypt','decrypt','sign','verify'];
function rsaBuild(){
  const steps=[];
  const kl=[];
  let chipI=0;
  const fl={m:RSA_M,c:null,mp:null,s:null,v:null,phase:'gen'};
  let kb=false;
  function rsaOpts(ci,context){
    return{chipI:ci,context:context,
      kl:kl.map(function(x){return{x:x.x,v:x.v,cy:x.cy};}),kb:kb,
      fl:{m:fl.m,c:fl.c,mp:fl.mp,s:fl.s,v:fl.v,phase:fl.phase},
      stats:[['n',RSA_N],['φ(n)',RSA_PHI],['e',RSA_E],['d',RSA_D]]};
  }
  function snap(msg,o){
    o=o||{};o.msg=msg;o.chipI=chipI;o.kl=kl.map(function(x){return{x:x.x,v:x.v,cy:x.cy};});
    o.kb=kb;o.fl={m:fl.m,c:fl.c,mp:fl.mp,s:fl.s,v:fl.v,phase:fl.phase};
    o.stats=[['n',RSA_N],['φ(n)',RSA_PHI],['e',RSA_E],['d',RSA_D]];
    steps.push(o);
  }
  snap('RSA key generation — start from two secret primes',{});
  kl.push({x:'p, q (secret primes)',v:'61, 53'});
  snap('choose secret primes p = 61, q = 53',{log:'p=61 q=53',lcls:'hl'});
  chipI=1;
  kl.push({x:'n = p × q',v:String(RSA_N)});
  snap('n = 61 × 53 = '+RSA_N+' — public modulus',{log:'n='+RSA_N,lcls:'hl'});
  chipI=2;
  kl.push({x:'φ(n) = (p−1)(q−1)',v:String(RSA_PHI)});
  snap('φ(n) = 60 × 52 = '+RSA_PHI+' — Euler totient',{log:'phi='+RSA_PHI,lcls:'hl'});
  chipI=3;
  const tr=euclidTrace(RSA_PHI,RSA_E);
  for(let i=0;i<tr.length-1;i++)snap('gcd('+RSA_E+', '+RSA_PHI+'): '+tr[i],{log:tr[i]});
  kl.push({x:'gcd(e, φ) = '+tr[tr.length-1].split('= ')[1]+' — e is coprime',v:'e = 17',cy:true});
  snap('e = 17 is coprime to φ — safe public exponent',{log:'gcd=1',lcls:'ok'});
  chipI=4;
  const d=modinv(RSA_E,RSA_PHI);
  kl.push({x:'d = e⁻¹ mod φ',v:String(d),cy:true});
  snap('d = 17⁻¹ mod 3120 = '+d+' — private exponent',{log:'d='+d,lcls:'hl'});
  snap('check: (17 × '+d+') mod 3120 = '+((RSA_E*d)%RSA_PHI)+' ✓',{cls:'ok',log:'e·d ≡ 1 (mod φ)',lcls:'ok'});
  chipI=5;
  kb=true;
  snap('keys ready — publish (n, e); keep d secret',{log:'keygen done',lcls:'ok'});
  chipI=6;
  fl.phase='enc';
  snap('encrypt M = 65 ("A"): C = M^e mod n = 65¹⁷ mod 3233',{});
  const C=modexpSteps(RSA_M,RSA_E,RSA_N,rsaOpts(6,'encrypt'),steps);
  fl.c=C;
  snap('ciphertext C = '+C,{cls:'ok',log:'C='+C,lcls:'ok'});
  chipI=7;
  fl.phase='dec';
  snap('decrypt: M′ = C^d mod n = '+C+'²⁷⁵³ mod 3233',{});
  const Mp=modexpSteps(C,RSA_D,RSA_N,rsaOpts(7,'decrypt'),steps);
  fl.mp=Mp;
  snap('M′ = '+Mp+(Mp===RSA_M?' — round-trip ✓':' — FAIL'),{cls:Mp===RSA_M?'ok':'err',log:'M′='+Mp,lcls:Mp===RSA_M?'ok':'bad'});
  chipI=8;
  fl.phase='sign';
  snap('sign with PRIVATE key: S = M^d mod n',{});
  const S=modexpSteps(RSA_M,RSA_D,RSA_N,rsaOpts(8,'sign'),steps);
  fl.s=S;
  snap('signature S = '+S,{cls:'ok',log:'S='+S,lcls:'ok'});
  chipI=9;
  fl.phase='ver';
  snap('verify with PUBLIC key: S^e mod n',{});
  const V=modexpSteps(S,RSA_E,RSA_N,rsaOpts(9,'verify'),steps);
  fl.v=V;
  const inv=((RSA_E*RSA_D)%RSA_PHI)===1;
  const rt=(Mp===RSA_M);
  const sg=(V===RSA_M);
  const ok=inv&&rt&&sg;
  snap(ok?'all checks pass — RSA math verified':'verification FAILED',
    {done:true,bad:!ok,cls:ok?'ok':'err',
     res:ok?('✓ RSA verified: C = '+C+' → M = '+Mp+', signature S = '+S+' verifies back to '+V+' (n=3233, e=17, d='+RSA_D+')'):'✗ rt='+rt+' sig='+sg,
     sfx:ok?'done':'bad'});
  return steps;
}
function renderRSA(st,n){
  chipsUI('ops',n,RSA_OPS,st.chipI||0,true);
  statsUI(n,st);
  const k=E('keys3');
  if(k)k.innerHTML=(st.kl||[]).map(function(l){
    return '<div class="kline'+(l.cy?' cy':'')+'"><span>'+l.x+'</span><span class="kv">'+l.v+'</span></div>';
  }).join('');
  const kb=E('keys3b');
  if(kb){
    kb.innerHTML=st.kb?
      '<div class="kbox pub"><div class="kt">public key (n, e)</div><div class="kv">('+RSA_N+', '+RSA_E+')</div></div>'+
      '<div class="kbox prv"><div class="kt">private key (n, d)</div><div class="kv">('+RSA_N+', '+RSA_D+')</div></div>':'';
  }
  const f=E('flow3');
  if(f){
    const fl=st.fl||{};
    if(fl.phase==='gen'){f.innerHTML='<div style="color:var(--dim);font-size:.78rem">key derivation above…</div>';}
    else{
      const map={
        enc:[['M',fl.m,'hl'],['encrypt (e, n)','17 · 3233',''],['C',fl.c,'']],
        dec:[['C',fl.c,'hl'],['decrypt (d, n)','2753 · 3233',''],['M′',fl.mp,'']],
        sign:[['M',fl.m,'hl'],['sign (d, n)','2753 · 3233',''],['S',fl.s,'']],
        ver:[['S',fl.s,'hl'],['verify (e, n)','17 · 3233',''],['M″',fl.v,'']]
      };
      const bx=map[fl.phase]||map.enc;
      f.innerHTML=bx.map(function(b,i){
        const box='<div class="fbox '+b[2]+'"><div class="fl">'+b[0]+'</div><div class="fv">'+(b[1]===null||b[1]===undefined?'…':b[1])+'</div></div>';
        return (i? '<span class="far">→</span>':'')+box;
      }).join('');
    }
  }
}

/* ===================== 4: AES ===================== */
function xtime(a){return((a<<1)^((a&0x80)?0x1b:0))&0xff;}
function gmul(a,b){
  let r=0;
  while(b){
    if(b&1)r^=a;
    b>>=1;
    a=xtime(a);
  }
  return r&0xff;
}
const SBOX=(function(){
  const exp=new Array(512),log=new Array(256);
  let x=1;
  for(let i=0;i<255;i++){exp[i]=x;log[x]=i;x=gmul(x,3);}
  for(let i=255;i<512;i++)exp[i]=exp[i-255];
  const s=new Array(256);
  s[0]=0x63;
  for(let i=1;i<256;i++){
    const inv=exp[255-log[i]];
    s[i]=inv^(((inv<<1)|(inv>>7))&0xff)^(((inv<<2)|(inv>>6))&0xff)^(((inv<<3)|(inv>>5))&0xff)^(((inv<<4)|(inv>>4))&0xff)^0x63;
  }
  return s;
})();
function aesKeyExpand(key){
  const w=[];
  for(let i=0;i<4;i++)w.push(key.slice(i*4,i*4+4));
  let rcon=1;
  for(let i=4;i<44;i++){
    let t=w[i-1].slice();
    if(i%4===0){
      t=[t[1],t[2],t[3],t[0]];
      t=[SBOX[t[0]],SBOX[t[1]],SBOX[t[2]],SBOX[t[3]]];
      t[0]^=rcon;
      rcon=xtime(rcon);
    }
    const nw=[];
    for(let j=0;j<4;j++)nw.push(w[i-4][j]^t[j]);
    w.push(nw);
  }
  const rk=[];
  for(let r=0;r<11;r++)rk.push([].concat(w[4*r],w[4*r+1],w[4*r+2],w[4*r+3]));
  return rk;
}
function aesShiftRows(st){
  const o=new Array(16);
  for(let r=0;r<4;r++)for(let c=0;c<4;c++)o[r+4*c]=st[r+4*((c+r)%4)];
  return o;
}
function aesMixColumns(st){
  const o=st.slice();
  for(let c=0;c<4;c++){
    const i=4*c;
    const a0=st[i],a1=st[i+1],a2=st[i+2],a3=st[i+3];
    o[i]=gmul(a0,2)^gmul(a1,3)^a2^a3;
    o[i+1]=a0^gmul(a1,2)^gmul(a2,3)^a3;
    o[i+2]=a0^a1^gmul(a2,2)^gmul(a3,3);
    o[i+3]=gmul(a0,3)^a1^a2^gmul(a3,2);
  }
  return o;
}
const AES_KEY=[0x2b,0x7e,0x15,0x16,0x28,0xae,0xd2,0xa6,0xab,0xf7,0x15,0x88,0x09,0xcf,0x4f,0x3c];
const AES_PT=[0x6b,0xc1,0xbe,0xe2,0x2e,0x40,0x9f,0x96,0xe9,0x3d,0x7e,0x11,0x73,0x93,0x17,0x2a];
const AES_CT='3ad77bb40d7a3660a89ecaf32466ef97';
const AES_OPS=['r0','r1','r2','r3','r4','r5','r6','r7','r8','r9','r10'];
function aesBuild(){
  const steps=[];
  const rk=aesKeyExpand(AES_KEY);
  let state=AES_PT.slice();
  function push(phase,round,extra){
    const prev=steps.length?steps[steps.length-1].state:null;
    const chg=[];
    if(prev)for(let i=0;i<16;i++)if(prev[i]!==state[i])chg.push(i);
    steps.push(Object.assign({
      state:state.slice(),rk:rk[round].slice(),round:round,phase:phase,changed:chg,chipI:round
    },extra||{}));
  }
  push('AES-128 — plaintext block',0,{msg:'NIST vector: plaintext 6bc1…172a → 4×4 state'});
  state=state.map(function(v,i){return v^rk[0][i];});
  push('AddRoundKey — round 0',0,{msg:'AddRoundKey: state ^= round key 0',cls:'hl'});
  for(let r=1;r<=10;r++){
    state=state.map(function(v){return SBOX[v];});
    push('Round '+r+' · SubBytes',r,{msg:'Round '+r+' — SubBytes: each byte through AES S-box (GF(2⁸) inverse + affine)'});
    state=aesShiftRows(state);
    push('Round '+r+' · ShiftRows',r,{msg:'Round '+r+' — ShiftRows: row r rotated left by '+r});
    if(r<10){
      state=aesMixColumns(state);
      push('Round '+r+' · MixColumns',r,{msg:'Round '+r+' — MixColumns: Galois-field matrix mix of each column'});
    }
    state=state.map(function(v,i){return v^rk[r][i];});
    push('Round '+r+' · AddRoundKey',r,{msg:'Round '+r+' — AddRoundKey: XOR round key '+r});
  }
  const ct=state.map(function(v){return v.toString(16).padStart(2,'0');}).join('');
  const ok=ct===AES_CT;
  steps.push({
    state:state.slice(),rk:rk[10].slice(),round:10,chipI:10,changed:[],
    phase:'ciphertext',ct:ct,
    msg:ok?'ciphertext matches NIST SP 800-38A vector':'ciphertext MISMATCH',
    done:true,bad:!ok,cls:ok?'ok':'err',
    res:ok?('✓ AES-128 ciphertext = '+ct+' — matches NIST SP 800-38A test vector'):'✗ got '+ct,
    sfx:ok?'done':'bad',
    stats:[['Rounds','10'],['Block','128-bit'],['S-box[0x00]',SBOX[0].toString(16)]]
  });
  return steps;
}
function renderAES(st,n){
  chipsUI('ops',n,AES_OPS,st.chipI||0,true);
  statsUI(n,st);
  const g=E('aesState');
  if(g&&st.state){
    let h='';
    for(let i=0;i<16;i++){
      const v=st.state[i];
      const hue=Math.round(v*1.4);
      const chg=(st.changed||[]).indexOf(i)>=0;
      h+='<div class="acell'+(chg?' chg':'')+'" style="background:hsl('+hue+',55%,26%);border-color:hsl('+hue+',65%,'+(chg?'70%':'44%')+')">'+
         '<span class="bv">'+v.toString(16).padStart(2,'0').toUpperCase()+'</span>'+
         '<span class="bi">b'+i+'</span></div>';
    }
    g.innerHTML=h;
  }
  const ph=E('aesPhase');
  if(ph)ph.textContent=st.phase||'';
  const k=E('aesKey');
  if(k&&st.rk){
    k.innerHTML=st.rk.map(function(v){
      return '<div class="rkc">'+v.toString(16).padStart(2,'0')+'</div>';
    }).join('');
  }
  const cv=E('aesCtV'),cw=E('aesCt');
  if(cv){
    if(st.ct){cv.textContent=st.ct;cw.classList.toggle('good',!st.bad);}
    else if(st.state&&st.phase&&st.phase.indexOf('plaintext')>=0)cv.textContent=st.state.map(function(v){return v.toString(16).padStart(2,'0');}).join('');
    else cv.textContent='—';
  }
}

/* ===================== 5: SHA-256 / MD5 ===================== */
function hex8(v){return(v>>>0).toString(16).padStart(8,'0');}
function rotl32(x,n){return((x<<n)|(x>>>(32-n)))>>>0;}
function rotr32(x,n){return((x>>>n)|(x<<(32-n)))>>>0;}
const SHA_K=('428a2f9871374491b5c0fbcfe9b5dba53956c25b59f111f1923f82a4ab1c5ed5'+
'd807aa9812835b01243185be550c7dc372be5d7480deb1fe9bdc06a7c19bf174e49b69c1'+
'efbe47860fc19dc6240ca1cc2de92c6f4a7484aa5cb0a9dc76f988da983e5152a831c66d'+
'b00327c8bf597fc7c6e00bf3d5a7914706ca63511429296727b70a852e1b21384d2c6dfc'+
'53380d13650a7354766a0abb81c2c92e92722c85a2bfe8a1a81a664bc24b8b70c76c51a3'+
'd192e819d6990624f40e3585106aa07019a4c1161e376c082748774c34b0bcb5391c0cb3'+
'4ed8aa4a5b9cca4f682e6ff3748f82ee78a5636f84c878148cc7020890befffaa4506ceb'+
'bef9a3f7c67178f2').match(/.{8}/g).map(function(h){return parseInt(h,16)>>>0;});
const SHA_H0=['6a09e667','bb67ae85','3c6ef372','a54ff53a','510e527f','9b05688c','1f83d9ab','5be0cd19']
  .map(function(h){return parseInt(h,16)>>>0;});
const MD5_ABC='900150983cd24fb0d6963f7d28e17f72';
const SHA_ABC='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
function padBlocks(bytes,leLen){
  const bl=bytes.slice();
  bl.push(0x80);
  while(bl.length%64!==56)bl.push(0);
  const bitLen=bytes.length*8;
  for(let i=0;i<8;i++)bl.push(leLen?Math.floor(bitLen/Math.pow(2,8*i))&0xff:Math.floor(bitLen/Math.pow(2,8*(7-i)))&0xff);
  return bl;
}
function md5Run(str,push){
  const bytes=[];
  for(let i=0;i<str.length;i++)bytes.push(str.charCodeAt(i)&0xff);
  const block=padBlocks(bytes,true);
  if(push)push({phase:'md5pad',msg:'MD5 padding → '+block.length/64+' block(s): '+bytes.map(function(v){return v.toString(16).padStart(2,'0');}).join(' ')+' 80 · zeros · bitlen '+bytes.length*8+' (LE)',inp:inpText(bytes)});
  const IV=[0x67452301,0xefcdab89,0x98badcfe,0x10325476];
  let A=IV[0],B=IV[1],C=IV[2],D=IV[3];
  if(push)push({phase:'md5init',md5:[A,B,C,D],msg:'MD5 init: A=67452301 B=efcdab89 C=98badcfe D=10325476',inp:inpText(bytes)});
  const S=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21];
  const K=new Array(64);
  for(let i=0;i<64;i++)K[i]=Math.floor(Math.abs(Math.sin(i+1))*4294967296)>>>0;
  for(let b=0;b<block.length;b+=64){
    const W=new Array(16);
    for(let i=0;i<16;i++){
      const j=b+i*4;
      W[i]=(block[j]|(block[j+1]<<8)|(block[j+2]<<16)|(block[j+3]<<24))>>>0;
    }
    for(let t=0;t<64;t++){
      let f,kk;
      if(t<16){f=(B&C)|((~B)&D);kk=t;}
      else if(t<32){f=(D&B)|((~D)&C);kk=(5*t+1)%16;}
      else if(t<48){f=B^C^D;kk=(3*t+5)%16;}
      else{f=C^(B|(~D));kk=(7*t)%16;}
      f=f>>>0;
      const sh=S[4*Math.floor(t/16)+(t%4)];
      const tmp=D;
      D=C;C=B;
      const sum=(A+f+K[t]+W[kk])>>>0;
      B=(B+rotl32(sum,sh))>>>0;
      A=tmp;
      if(push)push({
        phase:'md5',md5:[A,B,C,D],md5t:t,
        cur:'MD5 t='+t+' · '+['F','G','H','I'][Math.floor(t/16)]+' · K=0x'+hex8(K[t])+' · W['+kk+']=0x'+hex8(W[kk])+' · <<< '+sh,
        inp:inpText(bytes),
        msg:'MD5 round '+t+'/63 — registers updated'
      });
    }
    A=(A+IV[0])>>>0;B=(B+IV[1])>>>0;C=(C+IV[2])>>>0;D=(D+IV[3])>>>0;
  }
  function le(v){return[0,1,2,3].map(function(i){return((v>>>(8*i))&0xff).toString(16).padStart(2,'0');}).join('');}
  const hex=le(A)+le(B)+le(C)+le(D);
  if(push)push({phase:'md5out',md5:[A,B,C,D],msg:'MD5("'+str+'") = '+hex,inp:inpText(bytes),md5hex:hex});
  return {hex:hex,regs:[A,B,C,D]};
}
function shaRun(str,push){
  const bytes=[];
  for(let i=0;i<str.length;i++)bytes.push(str.charCodeAt(i)&0xff);
  const block=padBlocks(bytes,false);
  if(push)push({phase:'shapad',msg:'SHA-256 padding → '+block.length/64+' block(s): 61 62 63 80 · zeros · bitlen '+bytes.length*8+' (BE)',inp:inpText(bytes)});
  const H=SHA_H0.slice();
  if(push)push({phase:'shainit',sha:H.slice(),msg:'SHA-256 init: H0..H7 = frac(√primes)·2³²',inp:inpText(bytes)});
  function S0(x){return(rotr32(x,2)^rotr32(x,13)^rotr32(x,22))>>>0;}
  function S1(x){return(rotr32(x,6)^rotr32(x,11)^rotr32(x,25))>>>0;}
  function s0(x){return(rotr32(x,7)^rotr32(x,18)^(x>>>3))>>>0;}
  function s1(x){return(rotr32(x,17)^rotr32(x,19)^(x>>>10))>>>0;}
  for(let b=0;b<block.length;b+=64){
    const W=new Array(64);
    for(let i=0;i<16;i++){
      const j=b+i*4;
      W[i]=((block[j]<<24)|(block[j+1]<<16)|(block[j+2]<<8)|block[j+3])>>>0;
    }
    for(let i=16;i<64;i++)W[i]=(s1(W[i-2])+W[i-7]+s0(W[i-15])+W[i-16])>>>0;
    let a=H[0],bb=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(let t=0;t<64;t++){
      const T1=(h+S1(e)+((e&f)^((~e)&g))+SHA_K[t]+W[t])>>>0;
      const T2=(S0(a)+((a&bb)^(a&c)^(bb&c)))>>>0;
      h=g;g=f;f=e;e=(d+T1)>>>0;d=c;c=bb;bb=a;a=(T1+T2)>>>0;
      if(push)push({
        phase:'sha',sha:[a,bb,c,d,e,f,g,h],shat:t,
        cur:'SHA t='+t+' · W=0x'+hex8(W[t])+' · K=0x'+hex8(SHA_K[t])+' · T1=0x'+hex8(T1)+' · T2=0x'+hex8(T2),
        inp:inpText(bytes),
        msg:'SHA-256 round '+t+'/63 — registers updated'
      });
    }
    H[0]=(H[0]+a)>>>0;H[1]=(H[1]+bb)>>>0;H[2]=(H[2]+c)>>>0;H[3]=(H[3]+d)>>>0;
    H[4]=(H[4]+e)>>>0;H[5]=(H[5]+f)>>>0;H[6]=(H[6]+g)>>>0;H[7]=(H[7]+h)>>>0;
  }
  const hex=H.map(hex8).join('');
  if(push)push({phase:'shaout',sha:H.slice(),msg:'SHA-256("'+str+'") = '+hex,inp:inpText(bytes),shahex:hex});
  return {hex:hex,regs:H.slice()};
}
function inpText(bytes){
  return '"abc"-bytes"'.replace('"abc"',JSON.stringify(bytes.map(function(v){return v.toString(16).padStart(2,'0');}).join(' ')));
}
function hammingHex(x,y){
  let d=0;
  for(let i=0;i<x.length;i++){
    let n=parseInt(x[i],16)^parseInt(y[i],16);
    while(n){d+=n&1;n>>=1;}
  }
  return d;
}
const HASH_OPS=['input','MD5 pad','MD5 init','MD5 ×64','MD5 out','RFC ✓','SHA pad','SHA init','SHA ×64','SHA out','FIPS ✓','avalanche'];
function hashBuild(){
  const steps=[];
  const rows=[];
  let md5ok=false,shaok=false;
  const chipFor={in:0,md5pad:1,md5init:2,md5:3,md5out:4,md5vec:5,shapad:6,shainit:7,sha:8,shaout:9,shavec:10,ava:11,done:11};
  function push(o){
    o.chipI=chipFor[o.phase]!==undefined?chipFor[o.phase]:(o.phase==='done'?11:0);
    o.rows=rows.map(function(r){return{n:r.n,v:r.v,cls:r.cls};});
    steps.push(o);
  }
  push({phase:'in',msg:'Input "abc" = bytes 61 62 63 = 24 bits',inp:'"abc" · 61 62 63 · 24 bits'});
  const m1=md5Run('abc',push);
  md5ok=(m1.hex===MD5_ABC);
  rows.push({n:'MD5',v:m1.hex,cls:md5ok?'good':'badv'});
  push({phase:'md5vec',md5:m1.regs,
    msg:md5ok?'MD5 matches RFC 1321 test vector':'MD5 vector MISMATCH',
    cls:md5ok?'ok':'err',sfx:md5ok?'good':'bad',
    inp:'"abc" · 61 62 63 · 24 bits'});
  const s1=shaRun('abc',push);
  shaok=(s1.hex===SHA_ABC);
  rows.push({n:'SHA-256',v:s1.hex,cls:shaok?'good':'badv'});
  push({phase:'shavec',sha:s1.regs,
    msg:shaok?'SHA-256 matches FIPS 180 test vector':'SHA-256 vector MISMATCH',
    cls:shaok?'ok':'err',sfx:shaok?'good':'bad',
    inp:'"abc" · 61 62 63 · 24 bits'});
  const m2=md5Run('abd',null);
  const s2=shaRun('abd',null);
  const dm=hammingHex(m1.hex,m2.hex),ds=hammingHex(s1.hex,s2.hex);
  rows.push({n:'MD5 abd',v:m2.hex,cls:''});
  rows.push({n:'SHA abd',v:s2.hex,cls:''});
  rows.push({n:'Δ bits',v:dm+'/128 and '+ds+'/256 flipped',cls:'good'});
  push({phase:'ava',msg:'1-bit input change ("abc"→"abd") flips ~half of every digest bit',
    inp:'"abc" → "abd" (1 bit)'});
  const ok=md5ok&&shaok;
  push({phase:'done',
    msg:ok?'both digests verified':'digest verification failed',
    done:true,bad:!ok,cls:ok?'ok':'err',
    res:ok?('✓ MD5 = '+m1.hex.slice(0,12)+'… & SHA-256 = '+s1.hex.slice(0,12)+'… match official vectors — 1-bit change flipped '+dm+'/128 & '+ds+'/256 bits'):'✗ md5='+md5ok+' sha='+shaok,
    sfx:ok?'done':'bad',
    inp:'"abc" · 61 62 63 · 24 bits'});
  return steps;
}
function renderHash(st,n){
  chipsUI('ops',n,HASH_OPS,st.chipI||0,true);
  statsUI(n,st);
  const ip=E('inp5');
  if(ip)ip.textContent=st.inp||'"abc" · 61 62 63 · 24 bits';
  const ph=st.phase||'';
  const md5Active=ph.indexOf('md5')===0;
  const shaActive=ph.indexOf('sha')===0;
  const cm=E('colMd5'),cs=E('colSha');
  if(cm)cm.classList.toggle('act',md5Active||ph==='done');
  if(cs)cs.classList.toggle('act',shaActive||ph==='done');
  const mr=E('md5regs');
  if(mr){
    const names=['A','B','C','D'];
    mr.innerHTML=names.map(function(nm,i){
      let cls='reg';
      if(!md5Active&&ph!=='done')cls+=' idle';
      else cls+=' upd';
      const v=st.md5?hex8(st.md5[i]):'—';
      return '<div class="'+cls+'"><div class="rl">'+nm+'</div><div class="rv">'+v+'</div></div>';
    }).join('');
  }
  const sr=E('shaRegs');
  if(sr){
    const names=['H0','H1','H2','H3','H4','H5','H6','H7'];
    sr.innerHTML=names.map(function(nm,i){
      let cls='reg';
      if(!shaActive&&ph!=='done')cls+=' idle';
      else cls+=' upd';
      const v=st.sha?hex8(st.sha[i]):'—';
      return '<div class="'+cls+'"><div class="rl">'+nm+'</div><div class="rv">'+v+'</div></div>';
    }).join('');
  }
  const cur=E('cur5');
  if(cur)cur.textContent=st.cur||st.msg||'—';
  const out=E('out5');
  if(out){
    out.innerHTML=(st.rows||[]).map(function(r){
      return '<div class="hrow'+(r.cls?' '+r.cls:'')+'"><span class="hn">'+r.n+'</span><span class="hv">'+r.v+'</span></div>';
    }).join('');
  }
}

/* ===================== wiring ===================== */
makeCtrl(0,gcdBuild,renderGCD);
makeCtrl(1,sieveBuild,renderSieve);
makeCtrl(2,modexpBuild,renderModexp);
makeCtrl(3,rsaBuild,renderRSA);
makeCtrl(4,aesBuild,renderAES);
makeCtrl(5,hashBuild,renderHash);

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
