import {matchSession} from './match-session.js';
import {matchStory} from './match-story.js';

const root=document.getElementById('inside');
const $=(selector,scope=document)=>scope.querySelector(selector);
if(root){
 const heading=$(':scope > .extension-heading',root);
 heading.querySelector('.eyebrow').textContent='BTR / PUBLISH STUDIO';
 heading.querySelector('h1').innerHTML='PUBLISH <em>WITH PROOF.</em>';
 heading.querySelector('p').innerHTML='Turn one verified moment into a story for every screen.<br><strong>Review it. Shape it. Release it.</strong>';
 const studio=document.createElement('section');studio.className='publish-studio';studio.setAttribute('aria-label','Publish a verified match story');
 studio.innerHTML=`
  <header class="publish-head"><div><span>THE RELEASE DESK / ONE CLEAR JOB</span><h2>Make the verified story audience-ready.</h2><p>The evidence stays fixed. You choose how the explanation sounds and where it appears.</p></div><output class="publish-state" data-publish-state><i></i><b>READY FOR REVIEW</b><small>Nothing is sent outside this BTR demonstration.</small></output></header>
  <div class="publish-layout">
   <article class="publish-preview"><div class="publish-preview-top"><span>BTR / ON-SCREEN PREVIEW</span><div><b>HARBOR</b><strong>0–0</strong><b>NORTHBRIDGE</b><time data-publish-clock></time></div></div><div class="publish-frame"><div class="publish-field" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><div class="publish-caption"><small data-publish-mode></small><h3 data-publish-title></h3><p data-publish-copy></p></div><div class="publish-proofline"><span>✓ EVIDENCE CHECKED</span><span data-publish-revision></span><span data-publish-count></span></div></div></article>
   <aside class="publish-control"><span class="publish-kicker">FROM PROOF TO SCREEN</span><h3>Three decisions. One release.</h3><ol><li><b>VERIFY</b><span data-publish-verify></span></li><li><b>SHAPE</b><span>Choose the audience and language without changing the facts.</span></li><li><b>DELIVER</b><span>Release the same revision to Watch, Pocket Director and an overlay cue.</span></li></ol><div class="publish-selects"><label>AUDIENCE<select data-publish-mode-select><option value="beginner">New to football</option><option value="math">Show the math</option><option value="analyst">Tactical view</option></select></label><label>LANGUAGE<select data-publish-language><option value="en">English</option><option value="es">Español</option><option value="pt">Português</option></select></label></div><button type="button" class="red-button publish-release">Release to BTR screens →</button><button type="button" class="outline-button publish-truth">Inspect evidence before release</button></aside>
  </div>
  <div class="publish-destinations"><article data-channel="watch"><span>01 / WATCH PARTY</span><strong>Primary audience story</strong><small>READY</small></article><article data-channel="pocket"><span>02 / POCKET DIRECTOR</span><strong>Personal companion view</strong><small>PAIR WHEN NEEDED</small></article><article data-channel="overlay"><span>03 / BROADCAST OVERLAY</span><strong>Timed machine-readable cue</strong><small>6-SECOND EXPIRY</small></article><div><span>ONE REVISION</span><strong>Facts do not change between screens.</strong></div></div>
  <footer class="publish-actions"><div><span>AFTER RELEASE</span><strong>See exactly what the audience receives.</strong></div><button type="button" data-publish-watch>Open Watch output →</button><button type="button" data-publish-overlay>Open overlay output →</button><button type="button" data-publish-proof>Inspect production proof ↓</button></footer>`;
 heading.after(studio);
 const mode=$('[data-publish-mode-select]',studio),language=$('[data-publish-language]',studio),release=$('.publish-release',studio),stateOut=$('[data-publish-state]',studio);
 let published=false;
 function publishState(text,detail){stateOut.querySelector('b').textContent=text;stateOut.querySelector('small').textContent=detail;stateOut.dataset.released=String(published);}
 function render(state){
  const input={...state,source:'match',time:Math.max(16,Number(state.time)||0),mode:['beginner','math','analyst'].includes(state.mode)?state.mode:'beginner'},story=matchStory(input);
  mode.value=input.mode;language.value=['en','es','pt'].includes(state.language)?state.language:'en';
  $('[data-publish-clock]',studio).textContent=story.clock;
  $('[data-publish-mode]',studio).textContent=`${story.words[input.mode]} · ${language.options[language.selectedIndex].text.toUpperCase()}`;
  $('[data-publish-title]',studio).textContent=story.title;
  $('[data-publish-copy]',studio).textContent=story.body;
  $('[data-publish-revision]',studio).textContent=`SOURCE ${story.revision}`;
  $('[data-publish-count]',studio).textContent=`${story.evidence.length} SOURCE RECORDS`;
  $('[data-publish-verify]',studio).textContent=story.review.decision==='accept'?'Claim gate passed. Sources and numbers resolve.':story.review.reason;
  if(published)publishState('RELEASED TO BTR SCREENS',`${story.revision} · ${story.clock} · Watch and companion outputs now share this story.`);
 }
 mode.onchange=()=>{published=false;matchSession.set({mode:mode.value},'publish-audience');publishState('READY FOR REVIEW','Audience changed. Review the updated line before release.');};
 language.onchange=()=>{published=false;matchSession.set({language:language.value},'publish-language');publishState('READY FOR REVIEW','Language changed. The source revision remains the same.');};
 release.onclick=()=>{published=true;const current=matchSession.get();document.dispatchEvent(new CustomEvent('btr-judge-publish',{detail:{stage:'publish',revision:current.corrected?2:1}}));publishState('RELEASED TO BTR SCREENS','The verified story is ready in Watch and the companion delivery views.');render(current);};
 $('.publish-truth',studio).onclick=()=>document.getElementById('truth-nav').click();
 $('[data-publish-watch]',studio).onclick=()=>document.getElementById('watch-nav').click();
 $('[data-publish-overlay]',studio).onclick=()=>{document.getElementById('watch-nav').click();setTimeout(()=>document.getElementById('overlay-export')?.click(),0);};
 $('[data-publish-proof]',studio).onclick=()=>root.querySelector('.cohesion-proof,.proof-console')?.scrollIntoView({behavior:'smooth',block:'start'});
 const place=()=>{const proof=$(':scope > .cohesion-proof',root);if(studio.previousElementSibling!==heading)heading.after(studio);if(proof&&proof.previousElementSibling!==studio)studio.after(proof);};
 setTimeout(place,0);document.addEventListener('btr-section',event=>{if(event.detail==='inside')place();});
 matchSession.subscribe(render);render(matchSession.get());
}
