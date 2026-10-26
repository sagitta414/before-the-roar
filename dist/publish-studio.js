import {matchSession} from './match-session.js';
import {publishPacket} from './publish-state.js';

const root=document.getElementById('inside');
const $=(selector,scope=document)=>scope.querySelector(selector);
if(root){
 const heading=$(':scope > .extension-heading',root);
 heading.querySelector('.eyebrow').textContent='BTR / PUBLISH STUDIO';
 heading.querySelector('h1').innerHTML='PUBLISH <em>WITH PROOF.</em>';
 heading.querySelector('p').innerHTML='Turn one reviewed moment into output previews for different viewers.<br><strong>Review it. Shape it. Check each delivery.</strong>';
 const studio=document.createElement('section');studio.className='publish-studio';studio.setAttribute('aria-label','Prepare a reviewed match story');
 studio.innerHTML=`
  <header class="publish-head">
   <div class="publish-head-copy"><span>THE TRANSMISSION SUITE / FINAL STAGE</span><h2>One story. <em>Three previews.</em></h2><p>Review the observation and its limits, choose an audience, then prepare the same source revision for each output. Delivery status is shown separately.</p></div>
   <output class="publish-state" data-publish-state><i></i><b>READY FOR REVIEW</b><small>Nothing is sent outside this BTR demonstration.</small></output>
  </header>
  <div class="publish-layout">
   <article class="publish-preview publish-transmission">
    <div class="publish-preview-top"><span>PROGRAM / HARBOR v NORTHBRIDGE</span><div><span class="publish-on-air">PREVIEW</span><b>HARBOR</b><strong>0–0</strong><b>NORTHBRIDGE</b><time data-publish-clock></time></div></div>
    <div class="publish-frame">
     <img class="publish-film-image" src="assets/pitchside-minute-clean-poster.jpg" alt="Frame from the separately edited fictional cinematic film">
     <div class="publish-match-image" hidden role="img" aria-label="Illustrative pitch for the synthetic Harbor and Northbridge story; player dots are schematic, not measured positions or video footage"><div class="publish-match-pitch"><i class="publish-midline"></i><i class="publish-circle"></i><i class="publish-box publish-box-left"></i><i class="publish-box publish-box-right"></i><i class="publish-player harbor p1"></i><i class="publish-player harbor p2"></i><i class="publish-player harbor p3"></i><i class="publish-player north p4"></i><i class="publish-player north p5"></i><i class="publish-player north p6"></i><i class="publish-ball"></i><i class="publish-pass"></i></div><span>SYNTHETIC MATCH · ILLUSTRATIVE POSITIONS</span></div>
     <div class="publish-source-badge" data-publish-source></div>
     <div class="publish-scorebug"><b>BTR</b><span>HBR</span><strong>0–0</strong><span>NBR</span><time data-publish-clock></time></div>
     <div class="publish-live-rail"><span>THE MOMENT</span><b>REVIEWED STORY PREVIEW</b></div>
     <div class="publish-caption"><small data-publish-mode></small><h3 data-publish-title></h3><p data-publish-copy></p></div>
     <div class="publish-proof-seal"><span>✓</span><b>PROOF<br>LOCKED</b><small data-publish-count></small></div>
     <div class="publish-proofline"><span>✓ EVIDENCE CHECKED</span><span data-publish-revision></span><span>CLAIM GATE PASSED</span></div>
    </div>
    <div class="publish-signal"><span>REVIEWED MOMENT</span><i></i><b>ONE SOURCE REVISION</b><i></i><span>3 LIVE OUTPUTS</span></div>
   </article>
   <aside class="publish-control">
    <div class="publish-control-head"><span class="publish-kicker">OUTPUT DIRECTOR</span><strong>01 / 03</strong></div><h3>Three decisions. One source.</h3>
    <ol class="publish-flightplan"><li class="is-complete"><i>✓</i><div><b>VERIFY THE CLAIM</b><span data-publish-verify></span></div></li><li class="is-active"><i>2</i><div><b>TAILOR THE VOICE</b><span>Change the explanation for the viewer while the evidence stays fixed.</span></div></li><li><i>3</i><div><b>PREPARE OUTPUTS</b><span>Preview the revision for Watch, phone and a timed overlay. Confirm delivery separately.</span></div></li></ol>
    <div class="publish-selects"><label>AUDIENCE<select data-publish-mode-select><option value="beginner">New to football</option><option value="math">Show the math</option><option value="analyst">Tactical view</option></select></label><label>LANGUAGE<select data-publish-language><option value="en">English</option><option value="es">Español</option><option value="pt">Português</option></select></label></div>
    <div class="publish-lock"><span>FACT LOCK</span><b data-publish-revision></b><small>Numbers, sources and limitations travel with the story.</small></div>
    <button type="button" class="red-button publish-release"><span>PREPARE THIS REVIEWED STORY</span><b>→</b></button><button type="button" class="outline-button publish-truth">Inspect evidence before release</button>
   </aside>
  </div>
  <section class="publish-output-stage" aria-label="Audience output previews"><header><div><span>ONE SOURCE / THREE EXPERIENCES</span><h3>See what is prepared for each screen.</h3></div><p>Facts stay fixed. A prepared preview is not proof of delivery.</p></header><div class="publish-destinations">
   <article class="publish-output-card publish-output-watch" data-channel="watch"><div class="publish-device"><span class="publish-mini-live">BTR LIVE</span><div><b data-publish-title></b><small data-publish-copy></small></div></div><footer><span>01 / WATCH PARTY</span><strong>Primary audience story</strong><small data-channel-state>READY</small></footer></article>
   <article class="publish-output-card publish-output-pocket" data-channel="pocket"><div class="publish-phone"><i></i><span>POCKET DIRECTOR</span><b data-publish-title></b><small data-publish-mode></small><button type="button" tabindex="-1">WHY IT MATTERS ›</button></div><footer><span>02 / POCKET DIRECTOR</span><strong>Personal companion view</strong><small data-channel-state>READY TO SYNC</small></footer></article>
   <article class="publish-output-card publish-output-overlay" data-channel="overlay"><div class="publish-overlay-demo"><span>ON-AIR CUE / <time data-publish-clock></time></span><div><i>BTR</i><b data-publish-title></b></div><small>6 SEC · AUTO EXPIRE</small></div><footer><span>03 / BROADCAST OVERLAY</span><strong>Timed renderer cue</strong><small data-channel-state>CUE ARMED</small></footer></article>
  </div></section>
  <footer class="publish-actions"><div><span>AFTER PREPARATION</span><strong>Inspect each audience preview and its production receipt.</strong></div><button type="button" data-publish-watch>Open Watch preview →</button><button type="button" data-publish-overlay>Open overlay preview →</button><button type="button" data-publish-proof>Inspect production proof ↓</button></footer>`;
 heading.after(studio);
 const mode=$('[data-publish-mode-select]',studio),language=$('[data-publish-language]',studio),release=$('.publish-release',studio),stateOut=$('[data-publish-state]',studio);
 let published=false,lastKey='',relayAt=0;
 document.addEventListener('btr-pocket-status',event=>{relayAt=event.detail.connected?Date.now():0;if(published)render(matchSession.get());});
 function publishState(text,detail){stateOut.querySelector('b').textContent=text;stateOut.querySelector('small').textContent=detail;stateOut.dataset.released=String(published);studio.dataset.released=String(published);for(const [index,label] of ['WATCH PREVIEW READY',Date.now()-relayAt<6000?'RELAY ACCEPTED · RECEIPT UNCONFIRMED':'PHONE NOT CONNECTED','OVERLAY READY TO EXPORT'].entries()){const target=studio.querySelectorAll('[data-channel-state]')[index];if(target)target.textContent=published?label:['REVIEW REQUIRED','NOT SENT','NOT EXPORTED'][index];}}
 function render(state){
  const {input,story,evidence,ready,key}=publishPacket(state);
  const film=input.source==='pitchside';
  studio.querySelector('.publish-film-image').hidden=!film;
  studio.querySelector('.publish-match-image').hidden=film;
  studio.querySelector('[data-publish-source]').textContent=film?'FICTIONAL CINEMATIC FILM · REVIEWED CUES':'SYNTHETIC EVENT RECORD · SCHEMATIC, NOT VIDEO';
  studio.querySelector('.publish-frame').dataset.source=film?'film':'match';
  studio.dataset.source=film?'film':'match';
  if(lastKey!==key){published=false;lastKey=key;}
  release.disabled=!ready;
  publishState(published?'STORY PREPARED':'READY FOR REVIEW',ready?'Review the current source and audience.':'Advance the film to a reviewed observation before release.');
  studio.querySelector('.publish-proof-seal b').textContent=ready?'SOURCE REVIEW':'AWAITING EVIDENCE';
  studio.querySelector('.publish-scorebug strong').textContent=input.source==='pitchside'?'—':'0–0';
  studio.querySelectorAll('.publish-scorebug > span').forEach((node,index)=>node.textContent=input.source==='pitchside'?['FILM','REVIEWED'][index]:['HBR','NBR'][index]);
  studio.querySelector('.publish-preview-top strong').textContent=input.source==='pitchside'?'—':'0–0';
  studio.querySelectorAll('.publish-preview-top div > b').forEach((node,index)=>node.textContent=input.source==='pitchside'?['REVIEWED','FILM'][index]:['HARBOR','NORTHBRIDGE'][index]);
  studio.querySelector('.publish-preview-top > span').textContent=input.source==='pitchside'?'PROGRAM / REVIEWED FICTIONAL FILM':'PROGRAM / HARBOR v NORTHBRIDGE';
  studio.querySelector('.publish-live-rail b').textContent='CURRENT SOURCE PREVIEW';
  studio.querySelector('.publish-proofline span:first-child').textContent=ready?'SOURCE AVAILABLE':'AWAITING SOURCE';
  studio.querySelector('.publish-proofline span:last-child').textContent=story.review.decision==='accept'?'CLAIM GATE PASSED':'QUALIFIED OBSERVATION';
  studio.querySelector('.publish-signal span:first-child').textContent=ready?'REVIEWED MOMENT':'AWAITING OBSERVATION';
  studio.querySelector('.publish-signal span:last-child').textContent='3 OUTPUT PREVIEWS';
  mode.value=input.mode;language.value=['en','es','pt'].includes(state.language)?state.language:'en';
  $('[data-publish-clock]',studio).textContent=story.clock;
  $('[data-publish-mode]',studio).textContent=`${story.words[input.mode]} · ${language.options[language.selectedIndex].text.toUpperCase()}`;
  $('[data-publish-title]',studio).textContent=story.title;
  $('[data-publish-copy]',studio).textContent=story.body;
  studio.querySelectorAll('[data-publish-revision]').forEach(node=>node.textContent=`SOURCE ${story.revision}`);
  studio.querySelectorAll('[data-publish-count]').forEach(node=>node.textContent=ready?'EVIDENCE LINKED':'AWAITING SOURCE');
  studio.querySelectorAll('[data-publish-clock]').forEach(node=>node.textContent=story.clock);
  studio.querySelectorAll('[data-publish-mode]').forEach(node=>node.textContent=`${story.words[input.mode]} · ${language.options[language.selectedIndex].text.toUpperCase()}`);
  studio.querySelectorAll('[data-publish-title]').forEach(node=>node.textContent=story.title);
  studio.querySelectorAll('[data-publish-copy]').forEach(node=>node.textContent=story.body);
  $('[data-publish-verify]',studio).textContent=story.review.decision==='accept'?'Claim gate passed. Sources and numbers resolve.':story.review.reason||story.review.limit;
  if(published)publishState('OUTPUTS PREPARED',`${story.revision} · ${story.clock} · Watch preview ready. Phone receipt is unconfirmed; the overlay still requires export.`);
 }
 mode.onchange=()=>{published=false;matchSession.set({mode:mode.value},'publish-audience');publishState('READY FOR REVIEW','Audience changed. Review the updated line before release.');};
 language.onchange=()=>{published=false;matchSession.set({language:language.value},'publish-language');publishState('READY FOR REVIEW','Language changed. The source revision remains the same.');};
 release.onclick=()=>{const current=matchSession.get();if(!publishPacket(current).ready)return;published=true;document.dispatchEvent(new CustomEvent('btr-judge-publish',{detail:{stage:'publish',revision:current.corrected?2:1}}));publishState('OUTPUTS PREPARED','The reviewed story is ready for preview. Verify phone receipt and export the overlay separately.');render(current);};
 $('.publish-truth',studio).onclick=()=>document.getElementById('truth-nav').click();
 $('[data-publish-watch]',studio).onclick=()=>document.getElementById('watch-nav').click();
 $('[data-publish-overlay]',studio).onclick=()=>{document.getElementById('watch-nav').click();setTimeout(()=>document.getElementById('overlay-export')?.click(),0);};
 $('[data-publish-proof]',studio).onclick=()=>root.querySelector('.cohesion-proof,.proof-console')?.scrollIntoView({behavior:'smooth',block:'start'});
 const place=()=>{const proof=$(':scope > .cohesion-proof',root);if(studio.previousElementSibling!==heading)heading.after(studio);if(proof&&proof.previousElementSibling!==studio)studio.after(proof);};
 setTimeout(place,0);document.addEventListener('btr-section',event=>{if(event.detail==='inside')place();});
 matchSession.subscribe(render);render(matchSession.get());
}
