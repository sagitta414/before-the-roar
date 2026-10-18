import {matchSession} from './match-session.js';
export const SECTIONS=['watch','centre','lab','truth','presenters','security','inside'];
export const sectionFromHash=hash=>SECTIONS.includes(hash.replace(/^#/,''))?hash.replace(/^#/,''):'watch';
export function installNavigation(){
 const header=document.querySelector('.masthead'),nav=header.querySelector('nav');nav.id='main-navigation';
 for(const section of ['watch','centre','lab','truth'])nav.append(document.getElementById(section+'-nav'));
 const more=document.createElement('div');more.className='nav-more';
 const moreToggle=document.createElement('button');moreToggle.type='button';moreToggle.className='nav-more-toggle';moreToggle.textContent='More';moreToggle.setAttribute('aria-expanded','false');moreToggle.setAttribute('aria-controls','more-navigation');
 const morePanel=document.createElement('div');morePanel.id='more-navigation';morePanel.className='nav-more-panel';morePanel.setAttribute('aria-label','More destinations');
 for(const section of ['presenters','security','inside'])morePanel.append(document.getElementById(section+'-nav'));
 more.append(moreToggle,morePanel);nav.append(more);
 const frame=document.getElementById('simulation'),frameStatus=document.getElementById('lab-frame-status');
 addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(event.data?.type==='btr-lab-size'&&Number.isFinite(event.data.height)){
   frame.style.height=Math.max(600,Math.min(12000,event.data.height))+'px';
   if(frameStatus)frameStatus.hidden=true;
  }
  if(event.data?.type==='btr-lab-usage')document.dispatchEvent(new Event('btr-ai-finished'));
 });
 const toggle=document.createElement('button');toggle.className='navigation-toggle';toggle.type='button';toggle.textContent='Menu';toggle.setAttribute('aria-label','Open navigation');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',nav.id);header.insertBefore(toggle,nav);
 const closeMore=()=>{more.classList.remove('is-open');moreToggle.setAttribute('aria-expanded','false');};
 const close=()=>{header.classList.remove('navigation-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');closeMore();};
 toggle.onclick=()=>{const open=header.classList.toggle('navigation-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');};
 moreToggle.onclick=e=>{e.preventDefault();e.stopPropagation();const open=more.classList.toggle('is-open');moreToggle.setAttribute('aria-expanded',String(open));};
 document.addEventListener('click',e=>{if(!more.contains(e.target))closeMore();});
 header.addEventListener('keydown',e=>{if(e.key==='Escape'){close();toggle.focus();}});
 let routing=false;
 function apply(name,{notify=true,historyMode='push'}={}){
  if(!SECTIONS.includes(name))name='watch';
  const changed=matchSession.get().section!==name;
  matchSession.set({section:name});document.body.dataset.section=name;
  if(notify){routing=true;document.dispatchEvent(new CustomEvent('btr-section',{detail:name}));routing=false;}
  for(const section of SECTIONS)document.getElementById(section).hidden=section!==name;
  for(const button of nav.querySelectorAll('.nav')){const active=button.id===name+'-nav';button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}
  const secondary=['presenters','security','inside'].includes(name);more.classList.toggle('has-active',secondary);moreToggle.setAttribute('aria-current',secondary?'page':'false');
  if(name==='lab'){
   if(!frame.getAttribute('src'))frame.src='simulation.html?embedded=1&v=39';
   else frame.contentWindow?.postMessage({type:'btr-lab-resize'},location.origin);
  }else frame.contentWindow?.postMessage({type:'btr-pause-lab'},location.origin);
  if(location.hash!=='#'+name&&historyMode!=='none')history[historyMode==='replace'?'replaceState':'pushState'](null,'','#'+name);
  close();if(changed)window.scrollTo({top:0,behavior:'instant'});
 }
 nav.addEventListener('click',e=>{const button=e.target.closest('.nav');if(!button)return;e.preventDefault();e.stopImmediatePropagation();apply(button.id.replace(/-nav$/,''));if(matchMedia('(max-width:760px)').matches)button.focus({preventScroll:true});},true);
 document.addEventListener('btr-section',e=>{if(!routing)apply(e.detail,{notify:false});});
 const restore=()=>apply(sectionFromHash(location.hash),{historyMode:'none'});addEventListener('popstate',restore);addEventListener('hashchange',restore);
 history.scrollRestoration='manual';
 addEventListener('load',()=>window.scrollTo({top:0,behavior:'instant'}),{once:true});
 document.getElementById('lab-nav').hidden=false;apply(sectionFromHash(location.hash),{historyMode:'replace'});
}

