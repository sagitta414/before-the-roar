import {matchSession} from './match-session.js';
export const SECTIONS=['watch','centre','lab','truth','presenters','security','inside'];
export const sectionFromHash=hash=>SECTIONS.includes(hash.replace(/^#/,''))?hash.replace(/^#/,''):'watch';
export function installNavigation(){
 const header=document.querySelector('.masthead'),nav=header.querySelector('nav');nav.id='main-navigation';
 header.classList.add('journey-navigation-only');
 nav.hidden=true;nav.setAttribute('aria-hidden','true');
 const frame=document.getElementById('simulation'),frameStatus=document.getElementById('lab-frame-status');
 addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(event.data?.type==='btr-lab-size'&&Number.isFinite(event.data.height)){
   frame.style.height=Math.max(600,Math.min(12000,event.data.height))+'px';
   if(frameStatus)frameStatus.hidden=true;
  }
  if(event.data?.type==='btr-lab-usage')document.dispatchEvent(new Event('btr-ai-finished'));
 });
 const close=()=>{};
 let routing=false;
 function apply(name,{notify=true,historyMode='push'}={}){
  if(!SECTIONS.includes(name))name='watch';
  const changed=matchSession.get().section!==name;
  matchSession.set({section:name});document.body.dataset.section=name;
  if(notify){routing=true;document.dispatchEvent(new CustomEvent('btr-section',{detail:name}));routing=false;}
  for(const section of SECTIONS)document.getElementById(section).hidden=section!==name;
  for(const button of nav.querySelectorAll('.nav')){const active=button.id===name+'-nav';button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}
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

