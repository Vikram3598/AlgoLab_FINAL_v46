(function(){
'use strict';
var D=document,W=window,DE=D.documentElement;
var LP='algolab-progress',LL='algolab-last',LZ='algolab-sound',LH='algolab-kb-hint',LN='algolab-nav-collapsed';
var TOTALS={'sorting.html':9,'searching.html':12,'greedy.html':7,'dp.html':9,'graph.html':7,'data-structures.html':27,'hanoi.html':1,'string-matching.html':5,'backtracking.html':6,'branch-bound.html':2,'advanced-data-structures.html':5,'cryptography-math.html':6,'advanced-network-flows.html':4};
var LABS=[
{h:'sorting.html',n:'Sorting Algorithms',k:'sort bubble merge quick heap radix counting insertion selection comparison'},
{h:'searching.html',n:'Searching Algorithms',k:'search binary linear bfs dfs traversal jump interpolation exponential ternary'},
{h:'greedy.html',n:'Greedy Algorithms',k:'greedy dijkstra prim kruskal huffman scheduling activity fractional coin'},
{h:'dp.html',n:'Dynamic Programming',k:'dynamic programming knapsack lcs lis matrix bellman floyd edit distance kadane egg'},
{h:'graph.html',n:'Graph Algorithms',k:'graph topological scc kosaraju tarjan bipartite traversal'},
{h:'data-structures.html',n:'Data Structures',k:'data structure array linked list stack queue tree heap trie hash union find avl'},
{h:'hanoi.html',n:'Tower of Hanoi',k:'hanoi tower recursion puzzle disks pegs'},
{h:'string-matching.html',n:'String Matching',k:'string matching kmp rabin kar boyer moore aho corasick naive pattern'},
{h:'backtracking.html',n:'Backtracking Algorithms',k:'backtracking n queens sudoku rat maze coloring hamiltonian subset'},
{h:'branch-bound.html',n:'Branch and Bound',k:'branch bound tsp travel salesperson knapsack pruning bounds'},
{h:'advanced-data-structures.html',n:'Advanced Data Structures',k:'advanced segment fenwick bit red black avl dsu disjoint set trie'},
{h:'cryptography-math.html',n:'Cryptography and Math',k:'crypto rsa aes sha md5 gcd sieve modular exponentiation euclidean'},
{h:'advanced-network-flows.html',n:'Network Flows and Approximation',k:'network flow ford fulkerson edmonds karp vertex cover set cover max flow'}
];
function $(s,r){return (r||D).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
function P(){var p=location.pathname.split('/').pop();return p||'index.html';}
function jget(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function sget(k,d){try{var v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}}
function sset(k,v){try{localStorage.setItem(k,v);}catch(e){}}
var PG=P();
var isLanding=PG==='index.html';
var isSortLab=PG==='sorting.html';
var isHanoi=!!$('#solveBtn');
var isVis=!isLanding&&!!$('.shared-shell');
function hasAudio(){return typeof W.beep==='function'||typeof W.sfxStep==='function'||typeof W.sfxGood==='function';}
function activeIdx(){var p=$('.panel.on');if(p&&/^p\d+$/.test(p.id))return parseInt(p.id.slice(1),10);return -1;}
function algoCount(){var max=-1;$$('[data-a]').forEach(function(el){var i=parseInt(el.getAttribute('data-a'),10);if(!isNaN(i)&&i>max)max=i;});if(max<0)max=(TOTALS[PG]||1)-1;return max+1;}
function openAlgo(i){
  var nav=$('.shared-sidebar [data-a="'+i+'"]')||$('.sidebar [data-a="'+i+'"]');
  var card=$('.card[data-a="'+i+'"]');
  var el=nav||card;
  if(el){el.click();return true;}
  return false;
}
function press(id){var b=D.getElementById(id);if(b){b.click();return true;}return false;}
function algoTitle(el){
  if(!el)return '';
  var h=el.querySelector('h3');
  if(h)return h.textContent.trim();
  var spans=el.querySelectorAll('span');
  for(var i=0;i<spans.length;i++){
    var s=spans[i];
    if(s.classList.contains('nav-icon')||s.classList.contains('ico'))continue;
    var t=s.textContent.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D]+/gu,'').trim();
    if(t)return t;
  }
  return (el.textContent||'').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D]+/gu,'').trim();
}
function toast(msg,ms){
  var host=$('#al-toasts');
  if(!host){host=D.createElement('div');host.id='al-toasts';host.className='al-toasts';D.body.appendChild(host);}
  var t=D.createElement('div');t.className='al-toast';t.textContent=msg;host.appendChild(t);
  requestAnimationFrame(function(){t.classList.add('in');});
  setTimeout(function(){t.classList.remove('in');setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},300);},ms||2200);
}
function copyText(txt,cb){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(function(){cb(true);},function(){cb(fallbackCopy(txt));});
  }else cb(fallbackCopy(txt));
}
function fallbackCopy(txt){
  try{
    var ta=D.createElement('textarea');ta.value=txt;ta.setAttribute('readonly','');
    ta.style.position='fixed';ta.style.left='-9999px';D.body.appendChild(ta);
    ta.select();var ok=D.execCommand('copy');D.body.removeChild(ta);return ok;
  }catch(e){return false;}
}
function wrapSound(){
  ['beep','sfxStep','sfxGood','sfxDone','sfxBad'].forEach(function(n){
    var f=W[n];
    if(typeof f==='function'&&!f.__alW){
      var w=function(){if(sget(LZ,'on')==='off')return;return f.apply(this,arguments);};
      w.__alW=true;W[n]=w;
    }
  });
}
var muted=sget(LZ,'on')==='off';
function setMuted(m){
  muted=m;sset(LZ,m?'off':'on');
  var b=$('#al-sound');
  if(b){b.textContent=m?'Sound off':'Sound on';b.setAttribute('aria-pressed',m?'true':'false');b.classList.toggle('off',m);}
  toast(m?'Sound muted':'Sound enabled');
}
function buildFabs(){
  if(isLanding&&!$('#al-search')){}
  var fabs=$('#al-fabs');
  if(!fabs){fabs=D.createElement('div');fabs.id='al-fabs';fabs.className='al-fabs';D.body.appendChild(fabs);}
  function fab(id,label,fn,cls){
    if(D.getElementById(id))return;
    var b=D.createElement('button');b.type='button';b.id=id;b.className='al-fab '+(cls||'');b.textContent=label;
    b.setAttribute('aria-label',label);b.addEventListener('click',fn);fabs.appendChild(b);return b;
  }
  fab('al-search','Search',function(){openPalette();},'al-fab-key');
  fab('al-keys','Keys',function(){openHelp();});
  if(!isLanding&&hasAudio()){
    var sb=fab('al-sound',muted?'Sound off':'Sound on',function(){setMuted(!muted);});
    if(muted)sb.classList.add('off');
  }
  fab('al-top','Top',function(){W.scrollTo({top:0,behavior:'smooth'});},'al-fab-top');
  var top=D.getElementById('al-top');
  if(top){
    var sync=function(){top.classList.toggle('show',W.pageYOffset>420);};
    W.addEventListener('scroll',sync,{passive:true});sync();
  }
}
function mark(idx){
  if(idx<0)return;
  var all=jget(LP,{});
  var arr=all[PG]||[];
  if(arr.indexOf(idx)<0){arr.push(idx);all[PG]=arr;jset(LP,all);}
  remember(PG,idx);
  decorate();
}
function remember(pg,idx){
  var title='';
  if(pg===PG){
    var el=$('[data-a="'+idx+'"]')||$('.card[data-a="'+idx+'"]');
    title=algoTitle(el);
  }
  jset(LL,{p:pg,i:idx,t:title,ts:Date.now()});
}
function exploredCount(pg){
  var all=jget(LP,{});
  return (all[pg]||[]).length;
}
function exploredSet(pg){
  var all=jget(LP,{});
  return all[pg]||[];
}
function decorate(){
  if(isLanding){decorateLanding();return;}
  if(isVis||isHanoi){
    var set=exploredSet(PG);
    $$('[data-a]').forEach(function(el){
      var i=parseInt(el.getAttribute('data-a'),10);
      if(isNaN(i))return;
      el.classList.toggle('al-explored',set.indexOf(i)>=0);
    });
    var note=$('.shared-note')||$('.side-note');
    if(note)renderLabProg(note);
  }
}
function renderLabProg(note){
  var n=algoCount(),c=exploredCount(PG);
  var box=$('#al-labprog');
  if(!box){box=D.createElement('div');box.id='al-labprog';box.className='al-labprog';note.appendChild(box);}
  box.innerHTML='<span class="al-labprog-bar"><i style="width:'+Math.round((c/n)*100)+'%"></i></span><span>Explored '+c+' / '+n+'</span>';
}
function decorateLanding(){
  var cards=$$('.category-card');
  cards.forEach(function(card){
    var href=card.getAttribute('href');
    if(!href)return;
    var c=exploredCount(href),n=TOTALS[href]||0;
    var old=card.querySelector('.al-cardprog');
    if(old)old.parentNode.removeChild(old);
    if(n>0){
      var pill=D.createElement('span');pill.className='al-cardprog';
      pill.innerHTML='<i style="width:'+Math.round((c/n)*100)+'%"></i><em>'+c+' / '+n+'</em>';
      var meta=card.querySelector('.category-meta')||card;
      meta.appendChild(pill);
    }
  });
  var hero=$('.hero-actions');
  if(hero&&!$('#al-resume')){
    var last=jget(LL,null);
    if(last&&last.p&&TOTALS[last.p]){
      var a=D.createElement('a');a.id='al-resume';a.className='primary-cta al-resume';a.href=last.p+(last.i>=0?'?algo='+last.i:'');
      a.innerHTML='Resume: '+(last.t||last.p.replace('.html',''))+' <span>&#8599;</span>';
      hero.appendChild(a);
    }
  }
}
function ensureCopy(pre){
  if(pre.querySelector('.al-copy'))return;
  var btn=D.createElement('button');btn.type='button';btn.className='al-copy';btn.textContent='Copy';
  btn.setAttribute('aria-label','Copy code to clipboard');
  btn.addEventListener('click',function(e){
    e.stopPropagation();
    var code=pre.querySelector('code');
    var txt;
    if(code){txt=code.innerText;}
    else{
      var clone=pre.cloneNode(true);
      var b=clone.querySelector('.al-copy');
      if(b&&b.parentNode)b.parentNode.removeChild(b);
      txt=clone.innerText;
    }
    copyText(txt,function(ok){toast(ok?'Code copied':'Copy failed');});
  });
  pre.appendChild(btn);
}
function scanCopies(root){
  $$('pre',root||D).forEach(function(pre){
    if(pre.closest('.al-toasts')||pre.closest('.al-palette'))return;
    ensureCopy(pre);
  });
}
var copyObs=null;
function watchCopies(){
  scanCopies();
  if(!W.MutationObserver)return;
  var tid=null;
  copyObs=new MutationObserver(function(){
    if(tid)return;
    tid=setTimeout(function(){tid=null;scanCopies();},180);
  });
  copyObs.observe(D.body,{childList:true,subtree:true});
}
function paletteItems(){
  var items=[];
  LABS.forEach(function(l){items.push({t:'Lab: '+n0(l.n),s:l.k+' '+l.h,run:function(){location.href=l.h;},grp:'Labs'});});
  if(!isLanding){
    var seen={};
    $$('[data-a]').forEach(function(el){
      var i=parseInt(el.getAttribute('data-a'),10);
      if(isNaN(i)||seen[i])return;seen[i]=1;
      var nm=algoTitle(el)||('Algorithm '+(i+1));
      items.push({t:nm,s:'open algorithm '+(i+1),run:function(){openAlgo(i);},grp:'This page'});
    });
  }
  items.push({t:'Toggle theme',s:'light dark',run:function(){var b=$('#themeToggle')||$('#themeBtn')||$('#globalThemeToggle');if(b)b.click();else D.body.setAttribute('data-theme',D.body.getAttribute('data-theme')==='light'?'dark':'light');},grp:'Actions'});
  if(hasAudio()&&!isLanding)items.push({t:muted?'Enable sound':'Mute sound',s:'audio volume',run:function(){setMuted(!muted);},grp:'Actions'});
  items.push({t:'Keyboard shortcuts',s:'help keys',run:function(){openHelp();},grp:'Actions'});
  if(isVis){
    items.push({t:'Play or pause',s:'space run',run:function(){var n=activeIdx();if(n>=0)press('play'+n);},grp:'Actions'});
    items.push({t:'Next step',s:'arrow step',run:function(){var n=activeIdx();if(n>=0)press('step'+n);},grp:'Actions'});
    items.push({t:'Reset algorithm',s:'reset restart',run:function(){var n=activeIdx();if(n>=0)press('reset'+n);},grp:'Actions'});
    items.push({t:'Back to overview',s:'escape home',run:function(){var b=$('#backBtn');if(b)b.click();},grp:'Actions'});
  }
  if(isHanoi){
    items.push({t:'Solve puzzle',s:'auto recursive',run:function(){press('solveBtn');},grp:'Actions'});
    items.push({t:'Reset disks',s:'restart',run:function(){press('resetBtn');},grp:'Actions'});
    items.push({t:'Undo move',s:'back',run:function(){press('undoBtn');},grp:'Actions'});
  }
  items.push({t:'All learning labs',s:'catalog home',run:function(){location.href='index.html';},grp:'Actions'});
  return items;
}
function n0(s){return s;}
var pal=null;
function openPalette(){
  if(!pal)buildPalette();
  pal.classList.add('open');
  var inp=$('#al-pal-input',pal);inp.value='';renderPal('');
  setTimeout(function(){inp.focus();},10);
}
function closePalette(){if(pal)pal.classList.remove('open');}
function buildPalette(){
  pal=D.createElement('div');pal.id='al-palette';pal.className='al-palette';
  pal.innerHTML='<div class="al-pal-card" role="dialog" aria-label="Quick search"><div class="al-pal-head"><input id="al-pal-input" type="text" placeholder="Search labs, algorithms and actions..." autocomplete="off" spellcheck="false"><span class="al-pal-esc">Esc</span></div><div class="al-pal-list" id="al-pal-list"></div><div class="al-pal-foot">Up/Down to move &middot; Enter to open &middot; Esc to close</div></div>';
  D.body.appendChild(pal);
  pal.addEventListener('click',function(e){if(e.target===pal)closePalette();});
  var inp=$('#al-pal-input',pal);
  var tid=null,idx=0,cur=[];
  function render(q){
    var list=$('#al-pal-list',pal);
    q=(q||'').trim().toLowerCase();
    var all=paletteItems();
    cur=q?all.filter(function(it){return (it.t+' '+it.s).toLowerCase().indexOf(q)>=0;}):all;
    idx=0;
    if(!cur.length){list.innerHTML='<div class="al-pal-empty">No matches</div>';return;}
    var html='',lastG='';
    cur.forEach(function(it,i){
      if(it.grp!==lastG){html+='<div class="al-pal-grp">'+it.grp+'</div>';lastG=it.grp;}
      html+='<button type="button" class="al-pal-item'+(i===0?' sel':'')+'" data-i="'+i+'">'+esc(it.t)+'</button>';
    });
    list.innerHTML=html;
    $$('.al-pal-item',list).forEach(function(b){
      b.addEventListener('click',function(){pick(parseInt(b.getAttribute('data-i'),10));});
    });
  }
  function pick(i){
    var it=cur[i];
    if(!it)return;
    closePalette();
    setTimeout(function(){try{it.run();}catch(e){}},10);
  }
  function move(d){
    var btns=$$('.al-pal-item',pal);
    if(!btns.length)return;
    idx=(idx+d+btns.length)%btns.length;
    btns.forEach(function(b,i){b.classList.toggle('sel',i===idx);});
    btns[idx].scrollIntoView({block:'nearest'});
  }
  inp.addEventListener('input',function(){
    if(tid)clearTimeout(tid);
    tid=setTimeout(function(){render(inp.value);},90);
  });
  inp.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){e.preventDefault();move(1);}
    else if(e.key==='ArrowUp'){e.preventDefault();move(-1);}
    else if(e.key==='Enter'){e.preventDefault();pick(idx);}
    else if(e.key==='Escape'){e.preventDefault();closePalette();}
    e.stopPropagation();
  });
  W.__alRenderPal=render;
}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
function renderPal(q){if(W.__alRenderPal)W.__alRenderPal(q);}
var help=null;
function openHelp(){
  if(!help)buildHelp();
  help.classList.add('open');
}
function closeHelp(){if(help)help.classList.remove('open');}
function buildHelp(){
  var rows=[];
  function r(k,d){rows.push('<div class="al-help-row"><kbd>'+k+'</kbd><span>'+d+'</span></div>');}
  if(isHanoi){
    r('S','Auto solve');r('U','Undo move');r('R','Reset disks');r('H','Hint');r('3 - 8','Choose disk count');
  }else   if(isVis){
    r('Space','Play / pause the active algorithm');r('Right arrow, N, or S','Next step');r('R','Reset');r('Esc','Back to overview');
    r('1 - 9','Open algorithm by number');r('[ and ]','Previous / next algorithm');
    if(hasAudio())r('M','Mute or unmute sound');
    r('T','Toggle light and dark theme');
    if(isSortLab){
      r('A','Reveal the current answer');r('K','Toggle think mode');r('X','New random array');
      r('Enter','Apply a custom array from the input');
    }
  }else{
    r('1 - 9','Open a lab from the catalog');
  }
  r('/ or Ctrl+K','Quick search palette');r('?','This shortcut help');
  help=D.createElement('div');help.id='al-help';help.className='al-help';
  help.innerHTML='<div class="al-help-card" role="dialog" aria-label="Keyboard shortcuts"><div class="al-help-head"><b>Keyboard shortcuts</b><button type="button" class="al-help-x" aria-label="Close">Close</button></div><div class="al-help-body">'+rows.join('')+'</div><div class="al-help-foot">Shortcuts ignore typing in text fields.</div></div>';
  D.body.appendChild(help);
  help.addEventListener('click',function(e){if(e.target===help||e.target.classList.contains('al-help-x'))closeHelp();});
}
function watchPanels(){
  if(!W.MutationObserver)return;
  var mo=new MutationObserver(function(muts){
    for(var i=0;i<muts.length;i++){
      var t=muts[i].target;
      if(t&&t.classList&&t.classList.contains('on')&&t.id&&/^p\d+$/.test(t.id)){
        mark(parseInt(t.id.slice(1),10));
        break;
      }
    }
  });
  mo.observe(D.body,{attributes:true,attributeFilter:['class'],subtree:true});
}
function hookClicks(){
  D.addEventListener('click',function(e){
    var t=e.target;
    if(!t||!t.closest)return;
    var da=t.closest('[data-a]');
    if(da){
      var i=parseInt(da.getAttribute('data-a'),10);
      if(!isNaN(i))mark(i);
      return;
    }
    if(isHanoi&&t.closest('#solveBtn,#undoBtn,#resetBtn,#hintBtn,#againBtn'))mark(0);
  },true);
}
function bindKeys(){
  D.addEventListener('keydown',function(e){
    var tag=(e.target&&e.target.tagName)||'';
    var typing=tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(e.target&&e.target.isContentEditable);
    if((e.ctrlKey||e.metaKey)&&(e.key==='k'||e.key==='K')){
      e.preventDefault();
      if(pal&&pal.classList.contains('open'))closePalette();else openPalette();
      return;
    }
    if(e.key==='Escape'){
      if(pal&&pal.classList.contains('open')){closePalette();return;}
      if(help&&help.classList.contains('open')){closeHelp();return;}
      if(isVis){var b=$('#backBtn');if(b&&b.classList.contains('show')){e.preventDefault();b.click();}}
      return;
    }
    if(typing||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key==='?'){e.preventDefault();if(help&&help.classList.contains('open'))closeHelp();else openHelp();return;}
    if(e.key==='/'){e.preventDefault();openPalette();return;}
    if(isLanding){
      if(/^[1-9]$/.test(e.key)){
        var n=parseInt(e.key,10)-1;
        if(LABS[n]){e.preventDefault();location.href=LABS[n].h;}
      }
      return;
    }
    if(isHanoi){
      var k=e.key.toLowerCase();
      if(k==='s'){e.preventDefault();press('solveBtn');}
      else if(k==='u'){e.preventDefault();press('undoBtn');}
      else if(k==='r'){e.preventDefault();press('resetBtn');}
      else if(k==='h'){e.preventDefault();press('hintBtn');}
      else if(/^[3-8]$/.test(e.key)){
        e.preventDefault();
        var db=$('.dbtn[data-n="'+e.key+'"]');
        if(db)db.click();
      }
      return;
    }
    if(isVis){
      var n=activeIdx();
      if(e.key===' '){
        e.preventDefault();
        if(n>=0)press('play'+n);
        return;
      }
      if(e.key==='ArrowRight'||e.key==='n'||e.key==='N'||e.key==='.'){
        e.preventDefault();
        if(n>=0)press('step'+n);
        return;
      }
      if(e.key==='r'||e.key==='R'){
        e.preventDefault();
        if(n>=0)press('reset'+n);
        return;
      }
      if(e.key==='m'||e.key==='M'){
        if(hasAudio()){e.preventDefault();setMuted(!muted);}
        return;
      }
      if(e.key==='t'||e.key==='T'){
        e.preventDefault();
        var tb=$('#themeToggle')||$('#themeBtn');
        if(tb)tb.click();
        return;
      }
      if(isSortLab){
        if(e.key==='a'||e.key==='A'){e.preventDefault();if(n>=0)press('reveal'+n);return;}
        if(e.key==='k'||e.key==='K'){e.preventDefault();if(n>=0)press('think'+n);return;}
        if(e.key==='x'||e.key==='X'){e.preventDefault();if(n>=0)press('newarray'+n);return;}
      }
      if(/^[1-9]$/.test(e.key)){e.preventDefault();openAlgo(parseInt(e.key,10)-1);return;}
      if(e.key===']'||e.key==='['){
        e.preventDefault();
        var cnt=algoCount();
        var cur2=activeIdx();if(cur2<0)cur2=0;
        var nx=(cur2+(e.key===']'?1:-1)+cnt)%cnt;
        openAlgo(nx);
        return;
      }
    }
  },{passive:false});
}
function bindNavToggle(){
  var side=$('.shared-sidebar');
  if(!side)return;
  var nav=$('.shared-nav',side);
  if(!nav)return;
  var btn=D.createElement('button');
  btn.type='button';btn.className='al-navtoggle';btn.id='al-navtoggle';
  btn.innerHTML='<span>Learning labs (13)</span><i class="al-chev"></i>';
  btn.setAttribute('aria-expanded','false');
  side.insertBefore(btn,nav);
  function apply(c){
    side.classList.toggle('al-nav-collapsed',c);
    btn.setAttribute('aria-expanded',c?'false':'true');
  }
  var collapsed=sget(LN,'')===''?(W.innerWidth<=900?'1':'0'):sget(LN,'0');
  apply(collapsed==='1');
  btn.addEventListener('click',function(){
    var c=!side.classList.contains('al-nav-collapsed');
    apply(c);sset(LN,c?'1':'0');
  });
  W.addEventListener('resize',function(){
    if(sget(LN,'')===''){apply(W.innerWidth<=900);}
  });
}
function ariaControls(){
  if(isHanoi){
    var s=D.getElementById('solveBtn');if(s)s.setAttribute('aria-keyshortcuts','KeyS');
    var r2=D.getElementById('resetBtn');if(r2)r2.setAttribute('aria-keyshortcuts','KeyR');
    var u=D.getElementById('undoBtn');if(u)u.setAttribute('aria-keyshortcuts','KeyU');
    return;
  }
  $$('.controls').forEach(function(){
  });
  $$('[id^=play]').forEach(function(b){if(/^play\d+$/.test(b.id))b.setAttribute('aria-keyshortcuts','Space');});
  $$('[id^=step]').forEach(function(b){if(/^step\d+$/.test(b.id))b.setAttribute('aria-keyshortcuts','ArrowRight');});
  $$('[id^=reset]').forEach(function(b){if(/^reset\d+$/.test(b.id))b.setAttribute('aria-keyshortcuts','KeyR');});
}
function hintChip(){
  if(!isVis)return;
  if(sget(LH,'')==='1')return;
  if(!W.requestAnimationFrame)return;
  setTimeout(function(){
    var chip=D.createElement('div');chip.className='al-hintchip';
    chip.innerHTML='<b>Tip</b> Space play &middot; &rarr; step &middot; R reset &middot; 1-9 jump &middot; <kbd>/</kbd> search <button type="button" aria-label="Dismiss tip">&times;</button>';
    chip.querySelector('button').addEventListener('click',function(){sset(LH,'1');if(chip.parentNode)chip.parentNode.removeChild(chip);});
    D.body.appendChild(chip);
    setTimeout(function(){if(chip.parentNode)chip.parentNode.removeChild(chip);},14000);
  },1400);
}
function deepLink(){
  var m=/[?&]algo=(\d+)/.exec(location.search);
  if(!m)return;
  var i=parseInt(m[1],10);
  setTimeout(function(){
    if(openAlgo(i))toast('Opened algorithm '+(i+1));
  },120);
}
function heroBars(){
  var host=$('.visual-bars');
  if(!host)return;
  var spans=$$('span',host);
  if(spans.length<2)return;
  var vals=spans.map(function(s){
    var m=/--h:\s*([\d.]+)%/.exec(s.getAttribute('style')||'');
    return m?parseFloat(m[1]):50;
  });
  function paint(){spans.forEach(function(s,i){s.style.setProperty('--h',vals[i].toFixed(1)+'%');});}
  var reduce=W.matchMedia&&W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce)return;
  var pass=0,i=0;
  var timer=setInterval(function(){
    if(i>=vals.length-1){i=0;pass++;if(pass>=vals.length){vals.sort(function(a,b){return a-b;});paint();pass=0;}}
    if(vals[i]>vals[i+1]){
      var t=vals[i];vals[i]=vals[i+1];vals[i+1]=t;paint();
    }
    i++;
  },900);
  host.addEventListener('click',function(){
    for(var j=vals.length-1;j>0;j--){
      var k=Math.floor(Math.random()*(j+1));
      var t=vals[j];vals[j]=vals[k];vals[k]=t;
    }
    paint();toast('Shuffled the preview');
  });
  host.style.cursor='pointer';
  host.setAttribute('title','Click to shuffle the preview');
}
function init(){
  try{DE.setAttribute('data-al-ready','1');DE.setAttribute('data-al-page',isLanding?'landing':isSortLab?'sorting':isHanoi?'hanoi':'visual');}catch(e){}
  try{wrapSound();}catch(e){}
  try{buildFabs();}catch(e){}
  try{hookClicks();}catch(e){}
  try{watchPanels();}catch(e){}
  try{bindKeys();}catch(e){}
  try{decorate();}catch(e){}
  try{scanCopies();watchCopies();}catch(e){}
  try{bindNavToggle();}catch(e){}
  try{ariaControls();}catch(e){}
  try{hintChip();}catch(e){}
  try{deepLink();}catch(e){}
  try{heroBars();}catch(e){}
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
