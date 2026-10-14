/* Shared theme behavior for every non-Sorting page. Sorting uses src/app.js. */
(function(){
  'use strict';
  var KEY='algolab-theme';
  function readTheme(){try{return localStorage.getItem(KEY)==='light'?'light':'dark';}catch(e){return 'dark';}}
  function saveTheme(value){try{localStorage.setItem(KEY,value);}catch(e){}}
  function getButton(){return document.getElementById('themeToggle')||document.getElementById('themeBtn')||document.querySelector('.global-theme-toggle');}
  function updateButton(btn,theme){if(!btn)return;var light=theme==='light';btn.textContent=btn.id==='themeToggle'?(light?'☾ Dark theme':'☼ Light theme'):(light?'☀ Light':'☾ Dark');btn.title='Theme: '+(light?'Light':'Dark')+' · click to switch';btn.setAttribute('aria-label','Switch to '+(light?'dark':'light')+' theme');btn.setAttribute('aria-pressed',String(light));}
  function apply(theme){document.body.setAttribute('data-theme',theme);saveTheme(theme);updateButton(getButton(),theme);}
  function ensureButton(){
    var existing=getButton();
    if(existing){existing.classList.add('theme-toggle');return existing;}
    var btn=document.createElement('button');btn.type='button';btn.className='global-theme-toggle';btn.id='globalThemeToggle';btn.textContent='☾ Dark';btn.setAttribute('aria-label','Switch to light theme');
    var nav=document.querySelector('.landing-nav');
    var header=document.querySelector('.header');
    if(nav){nav.appendChild(btn);}else if(header){header.appendChild(btn);}else{document.body.insertBefore(btn,document.body.firstChild);}
    return btn;
  }
  function init(){var btn=ensureButton();apply(readTheme());if(btn){btn.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();apply(document.body.getAttribute('data-theme')==='light'?'dark':'light');},true);}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
