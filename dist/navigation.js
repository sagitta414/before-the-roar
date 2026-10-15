import {matchSession} from './match-session.js';
export const SECTIONS=['watch','centre','presenters','truth','inside','lab'];
export const sectionFromHash=hash=>SECTIONS.includes(hash.replace(/^#/,''))?hash.replace(/^#/,''):'watch';
export function installNavigation(){
 const header=document.querySelector('.masthead'),nav=header.querySelector('nav');nav.id='main-navigation';
 const toggle=document.createElement('button');toggle.className='navigation-toggle';toggle.type='button';toggle.textContent='Menu';toggle.setAttribute('aria-label','Open navigation');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',nav.id);header.insertBefore(toggle,nav);
 const close=()=>{header.classList.remove('navigation-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');};
 toggle.onclick=()=>{const open=header.classList.toggle('navigation-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');};
 header.addEventListener('keydown',e=>{if(e.key==='Escape'){close();toggle.focus();}});
 let routing=false;
 function apply(name,{notify=true,historyMode='push'}={}){
  if(!SECTIONS.includes(name))name='watch';
  const changed=matchSession.get().section!==name;
  matchSession.set({section:name});
  if(notify){routing=true;document.dispatchEvent(new CustomEvent('btr-section',{detail:name}));routing=false;}
  for(const section of SECTIONS)document.getElementById(section).hidden=section!==name;
  for(const button of nav.querySelectorAll('.nav')){const active=button.id===name+'-nav';button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}
  const frame=document.getElementById('simulation');if(name==='lab'&&!frame.getAttribute('src'))frame.src='simulation.html?embedded=1';if(name!=='lab')frame.contentWindow?.postMessage({type:'btr-pause-lab'},location.origin);
  if(location.hash!=='#'+name&&historyMode!=='none')history[historyMode==='replace'?'replaceState':'pushState'](null,'','#'+name);
  close();if(changed)window.scrollTo({top:0,behavior:'instant'});
 }
 nav.addEventListener('click',e=>{const button=e.target.closest('.nav');if(!button)return;e.preventDefault();e.stopImmediatePropagation();apply(button.id.replace(/-nav$/,''));if(matchMedia('(max-width:760px)').matches)toggle.focus();},true);
 document.addEventListener('btr-section',e=>{if(!routing)apply(e.detail,{notify:false});});
 const restore=()=>apply(sectionFromHash(location.hash),{historyMode:'none'});addEventListener('popstate',restore);addEventListener('hashchange',restore);
 document.getElementById('lab-nav').hidden=false;apply(sectionFromHash(location.hash),{historyMode:'replace'});
}
