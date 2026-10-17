import {matchSession} from './match-session.js';

const $=id=>document.getElementById(id);
const stages=[
  {section:'watch',number:'01',verb:'WATCH',detail:'See the moment'},
  {section:'centre',number:'02',verb:'UNDERSTAND',detail:'Read the play'},
  {section:'lab',number:'03',verb:'MEASURE',detail:'Test the pattern'},
  {section:'truth',number:'04',verb:'CHALLENGE',detail:'Change the evidence'},
  {section:'inside',number:'05',verb:'PUBLISH',detail:'Inspect the proof'},
];
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}

const rail=el('nav','story-spine');
rail.setAttribute('aria-label','Follow the BTR investigation');
const identity=el('div','story-spine__identity');
identity.append(el('span','','ONE MOMENT · ONE EVIDENCE CHAIN'),el('strong','','From play to proof.'));
rail.append(identity);
for(const stage of stages){
  const button=el('button','story-spine__step');
  button.type='button';button.dataset.section=stage.section;
  button.setAttribute('aria-label',`${stage.verb}: ${stage.detail}`);
  button.append(el('b','',stage.number),el('span','',stage.verb),el('small','',stage.detail));
  button.onclick=()=>$(stage.section+'-nav')?.click();
  rail.append(button);
}
const demo=el('button','story-spine__demo','▶ 60s defining moment');
demo.type='button';demo.onclick=()=>document.dispatchEvent(new Event('btr-open-guided'));
rail.append(demo);
document.querySelector('.match-session-bar')?.after(rail);
function update(section=matchSession.get().section){
  const mapped=stages.some(s=>s.section===section)?section:(section==='presenters'?'watch':'inside');
  rail.querySelectorAll('[data-section]').forEach(button=>{
    const active=button.dataset.section===mapped;
    button.classList.toggle('is-active',active);
    if(active)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
  });
}
document.addEventListener('btr-section',event=>update(event.detail));
matchSession.subscribe(state=>update(state.section));
update();

const sourceBar=document.querySelector('.watch-source-bar');
if(sourceBar){
  const dossier=el('div','match-dossier');
  dossier.innerHTML=`<span>MATCH DOSSIER</span><strong>BTR-WIDE-67</strong><i></i><p><b>Broadcast view</b> shows the atmosphere. <b>Evidence view</b> carries the measurements. Both follow the same fictional teams and editorial question; they are companion representations, not the same pixel source.</p>`;
  sourceBar.after(dossier);
}

const inside=$('inside');
if(inside){
  const proof=el('section','cohesion-proof');
  proof.setAttribute('aria-label','What the current prototype proves');
  proof.innerHTML=`
    <header><div><span>THE BTR DIFFERENCE / VERIFIED</span><h2>One story. Three kinds of proof.</h2></div><button type="button" data-open-demo>Run the defining moment →</button></header>
    <div class="cohesion-proof__grid">
      <article data-tone="live"><small>01 / AGENT EXECUTION</small><h3>Specialists really hand off.</h3><strong>4 AZURE REQUESTS + 1 CALCULATION</strong><p>Scout, Guide, Check and Host execute sequentially. Vector calculates in code. Execution IDs, latency, evidence and delivery state remain inspectable.</p><button type="button" data-jump-watch>Open the AI desk ↗</button></article>
      <article data-tone="truth"><small>02 / CORRECTION</small><h3>The story must survive the evidence.</h3><strong>CLAIM WITHDRAWN · OUTPUT REVISED</strong><p>Truth Lab changes one synthetic observation, recalculates the affected metric and publishes a narrower broadcast explanation while preserving unaffected facts.</p><button type="button" data-jump-truth>Run the evidence test ↗</button></article>
      <article data-tone="guard"><small>03 / VISION SAFETY GATE</small><h3>Unknown footage fails closed.</h3><strong>IDENTITY + SPEED WITHHELD</strong><p>An unfamiliar real training clip produced no enrolled marker matches. BTR published no player identity or physical speed. This validates withholding behavior, not broadcast detection accuracy.</p><a href="assets/external-video-results.json" download>Download the domain test ↓</a></article>
    </div>
    <div class="source-contract">
      <div><span>BROADCAST LAYER</span><b>Cinematic minute</b><p>Audience-ready film with manually reviewed, time-linked observations.</p></div><i aria-hidden="true">+</i>
      <div><span>EVIDENCE LAYER</span><b>Measured replay</b><p>Coordinate-backed events, movement, pass quality and claim boundaries.</p></div><i aria-hidden="true">→</i>
      <div><span>PUBLIC LAYER</span><b>One match dossier</b><p>Personalized narrative with source labels, receipts and revision history.</p></div>
    </div>
    <div class="quality-boundary"><div><span>WHY MULTI-AGENT?</span><strong>Not because more calls automatically mean better prose.</strong><p>The demonstrated advantage is role separation, inspectable disagreement, checkpoint recovery and a deterministic evidence gate. The bounded model comparison does not establish general superiority.</p></div><a href="assets/commentary-comparison.json" download>Inspect the comparison ↓</a></div>`;
  inside.querySelector('.extension-heading')?.after(proof);
  const placeProof=()=>{
    const anchor=inside.querySelector(':scope > #judge-evidence')||inside.querySelector(':scope > .extension-heading');
    if(anchor&&proof.previousElementSibling!==anchor)anchor.after(proof);
  };
  setTimeout(placeProof,0);
  document.addEventListener('btr-section',event=>{if(event.detail==='inside')placeProof();});
  proof.querySelector('[data-open-demo]').onclick=()=>document.dispatchEvent(new Event('btr-open-guided'));
  proof.querySelector('[data-jump-watch]').onclick=()=>{$('watch-nav')?.click();setTimeout(()=>$('desk-tab')?.click(),0);};
  proof.querySelector('[data-jump-truth]').onclick=()=>$('truth-nav')?.click();
}
