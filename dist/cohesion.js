import {matchSession} from './match-session.js';
import {executionProfile} from './execution-profile.js';
import {workspace,subscribeWorkspace} from './source-workspace.js';
import {judgeProof} from './judge-mode-model.js';

const $=id=>document.getElementById(id);
const stages=[
  {section:'watch',number:'01',verb:'WATCH',detail:'See the moment'},
  {section:'centre',number:'02',verb:'UNDERSTAND',detail:'Read the play'},
  {section:'lab',number:'03',verb:'MEASURE',detail:'Test the pattern'},
  {section:'truth',number:'04',verb:'CHALLENGE',detail:'Change the evidence'},
  {section:'inside',number:'05',verb:'PUBLISH',detail:'Release the story'},
];
const proofDestinations=[
  {section:'presenters',verb:'ENGINEERS',detail:'Meet the team'},
  {section:'security',verb:'SECURE',detail:'Inspect protection'},
];
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}

const rail=el('nav','story-spine');
rail.setAttribute('aria-label','Follow the BTR investigation');
rail.setAttribute('aria-roledescription','five-stage play-to-proof journey with supporting proof destinations');
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
const proofNav=el('div','story-spine__proof');
proofNav.append(el('small','','SUPPORTING PROOF'));
for(const destination of proofDestinations){
  const button=el('button','story-spine__support');
  button.type='button';button.dataset.section=destination.section;
  button.setAttribute('aria-label',`${destination.verb}: ${destination.detail}`);
  button.append(el('span','',destination.verb),el('small','',destination.detail));
  button.onclick=()=>$(destination.section+'-nav')?.click();
  proofNav.append(button);
}
rail.append(proofNav);
rail.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  const buttons=[...rail.querySelectorAll('.story-spine__step,.story-spine__support')],current=Math.max(0,buttons.indexOf(document.activeElement));
  const target=event.key==='Home'?0:event.key==='End'?buttons.length-1:event.key==='ArrowLeft'?Math.max(0,current-1):Math.min(buttons.length-1,current+1);
  event.preventDefault();buttons[target].focus();
});
const demo=el('button','story-spine__demo','▶ 60s defining moment');
demo.type='button';demo.onclick=()=>document.dispatchEvent(new Event('btr-open-guided'));
rail.append(demo);
document.querySelector('.masthead')?.after(rail);
function update(section=matchSession.get().section){
  const route=(document.body.dataset.section||location.hash.replace(/^#/,'' )||section);
  const journeyIndex=stages.findIndex(stage=>stage.section===route);
  const proofIndex=proofDestinations.findIndex(stage=>stage.section===route);
  const activeIndex=journeyIndex>=0?journeyIndex:proofIndex>=0?stages.length-1:0;
  rail.dataset.activeStage=String(activeIndex+1);
  rail.querySelectorAll('.story-spine__step').forEach((button,index)=>{
    const active=button.dataset.section===route;
    button.classList.toggle('is-active',active);
    button.classList.toggle('is-complete',index<activeIndex||(proofIndex>=0&&index<=activeIndex));
    button.classList.toggle('is-next',journeyIndex>=0&&index===activeIndex+1);
    if(active)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
    button.setAttribute('aria-label',`${index+1} of ${stages.length}: ${stages[index].verb}. ${stages[index].detail}.${index===activeIndex+1?' Next step.':''}`);
  });
  rail.querySelectorAll('.story-spine__support').forEach((button,index)=>{
    const active=button.dataset.section===route;
    button.classList.toggle('is-active',active);
    if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    button.setAttribute('aria-label',`${proofDestinations[index].verb}: ${proofDestinations[index].detail}. Supporting proof destination.`);
  });
}
document.addEventListener('btr-section',event=>update(event.detail));
matchSession.subscribe(state=>update(state.section));
new MutationObserver(()=>update(document.body.dataset.section)).observe(document.body,{attributes:true,attributeFilter:['data-section']});
addEventListener('hashchange',()=>update(location.hash.replace(/^#/,'')));
update();

const presentersHeading=$('presenters')?.querySelector('.extension-heading');
if(presentersHeading){
  presentersHeading.querySelector('.eyebrow').textContent='SUPPORTING PROOF / ENGINEERS · THE EDITORIAL DESK';
  presentersHeading.querySelector('h1').innerHTML='MEET YOUR <em>AI ENGINEERS.</em>';
  presentersHeading.querySelector('p').innerHTML="Inspect each specialist's expertise and instructions.<br><strong>Five accountable roles. One evidence chain.</strong>";
  $('presenters').setAttribute('aria-label','The AI engineers');
}

const sourceBar=document.querySelector('.watch-source-bar');
if(sourceBar){
  const dossier=el('div','match-dossier');
  dossier.innerHTML=`<span>MATCH DOSSIER</span><strong>BTR-WIDE-67</strong><i></i><p><b>Broadcast view leads the experience.</b> Open Evidence view, Match Centre or Truth Lab whenever you want to inspect the measured synthetic replay behind the story.</p><button type="button" class="evidence-bridge-open">Film + proof ↗</button>`;
  sourceBar.after(dossier);
  const executionKey=el('details','execution-key');
  executionKey.innerHTML=`<summary>How to read execution state <span>+</span></summary><div><b data-state="live">LIVE</b><p>A fresh Azure model request completed. Receipt includes execution ID and latency.</p><b data-state="replay">REPLAY</b><p>A previously saved result was restored. No new model request.</p><b data-state="deterministic">DETERMINISTIC</b><p>Code calculated or validated the result. No model request.</p><b data-state="recovered">RECOVERED</b><p>An interruption is recorded; completed checkpoints were reused and remaining work resumed.</p></div>`;
  dossier.after(executionKey);
  const liveStage=$('broadcast-room');
  if(liveStage)liveStage.after(dossier,executionKey);
  const bridge=el('dialog','evidence-bridge');
  bridge.innerHTML=`<button type="button" class="evidence-bridge__close" aria-label="Close broadcast and proof comparison">×</button><span class="evidence-bridge__eyebrow">ONE EDITORIAL QUESTION / TWO DECLARED SOURCES</span><h2>Broadcast feeling. Measured proof.</h2><p class="evidence-bridge__intro">BTR connects the audience experience to the verification workflow without transferring measurements between unrelated footage.</p><div class="evidence-bridge__grid"><article data-layer="broadcast"><small>01 / CINEMATIC COMPANION</small><strong>What does the story feel like?</strong><p>A sixty-second, AI-generated broadcast edit with manually reviewed observations. It demonstrates timing, presentation and audience-ready narration.</p><b>OBSERVATIONS ONLY · NO TRANSFERRED METRICS</b><button type="button" data-bridge-film>Open cinematic coverage →</button></article><i>→</i><article data-layer="proof"><small>02 / MEASURED REPLAY</small><strong>Which claims survive the evidence?</strong><p>The controlled synthetic replay supplies coordinates, events, calculations, revisions and the causal boundary used by Truth Lab.</p><b>13.0 m → 0.0 m · R1 → R2</b><button type="button" data-bridge-proof>Open measured proof →</button></article></div><footer><span>SHARED EDITORIAL STANDARD</span><p>Both sources must cite what they observed, state what remains unknown and withdraw claims when their own evidence changes.</p><button type="button" data-bridge-truth>Run the correction in Truth Lab →</button></footer>`;
  document.body.append(bridge);
  dossier.querySelector('.evidence-bridge-open').onclick=()=>bridge.showModal();
  bridge.querySelector('.evidence-bridge__close').onclick=()=>bridge.close();
  bridge.addEventListener('click',event=>{if(event.target===bridge)bridge.close();});
  bridge.querySelector('[data-bridge-film]').onclick=()=>{bridge.close();matchSession.set({source:'pitchside',clipTime:16,section:'watch'},'evidence-bridge');$('watch-nav')?.click();};
  bridge.querySelector('[data-bridge-proof]').onclick=()=>{bridge.close();matchSession.set({source:'match',scenario:'wide',time:16,corrected:false,section:'watch'},'evidence-bridge');$('watch-nav')?.click();};
  bridge.querySelector('[data-bridge-truth]').onclick=()=>{bridge.close();matchSession.set({source:'match',scenario:'wide',time:16,corrected:false,section:'truth'},'evidence-bridge');$('truth-nav')?.click();};
}

const truth=$('truth');
if(truth){
  const path=el('section','truth-primary-path');
  path.setAttribute('aria-label','Three-step evidence correction');
  path.innerHTML=`<header><span>THE DEFINING TEST / THREE STEPS</span><strong>One claim. One changed record. One corrected story.</strong></header><div><button type="button" data-truth-step="original"><b>01</b><span>ORIGINAL CLAIM<small>Inspect the claim at 67:16</small></span></button><i>→</i><button type="button" data-truth-step="change"><b>02</b><span>CHANGE EVIDENCE<small>Hold one defender in place</small></span></button><i>→</i><button type="button" data-truth-step="corrected"><b>03</b><span>CORRECTED OUTPUT<small>See what the audience receives</small></span></button></div><button type="button" class="truth-more-toggle" aria-expanded="false">More evidence tools +</button>`;
  truth.querySelector('.extension-heading')?.after(path);
  const impact=el('section','truth-verdict-impact');
  impact.setAttribute('aria-live','polite');
  const proofValues=judgeProof();
  impact.innerHTML=`<header><span>THE COMPLETE CORRECTION / ONE VIEW</span><strong data-impact-heading>See the consequence before you run the test.</strong></header><div class="truth-verdict-impact__compare"><article><small>01 / ORIGINAL CLAIM · R1</small><b>${proofValues.original.measurement}</b><span>DEFENDER SHIFT</span><p>The defender was pulled wide by the run.</p></article><i>→</i><article data-corrected><small>02 / CHANGED OBSERVATION · R2</small><b data-corrected-measurement>${proofValues.corrected.measurement}</b><span>DEFENDER HELD IN PLACE</span><p data-corrected-copy>The same tracking record is changed at one observation.</p></article></div><div class="truth-verdict-impact__outcomes"><span>03 / CALCULATION <b data-impact-calculation>${proofValues.original.measurement} → ${proofValues.corrected.measurement}</b></span><span>04 / CLAIM STATUS <b data-impact-claim>WITHDRAWN IF APPLIED</b></span><span>05 / REVISED BROADCAST <b data-impact-story>The attack progresses, but this evidence no longer supports the defender being drawn away.</b></span></div>`;
  path.after(impact);
  const placeTruthProof=()=>{
    const heading=truth.querySelector(':scope > .extension-heading');
    if(heading&&heading.nextElementSibling!==path)heading.after(path,impact);
  };
  setTimeout(placeTruthProof,0);
  window.addEventListener('load',placeTruthProof,{once:true});
  document.addEventListener('btr-section',event=>{if(event.detail==='truth')setTimeout(placeTruthProof,0);});
  const truthPlacementObserver=new MutationObserver(()=>placeTruthProof());
  truthPlacementObserver.observe(truth,{childList:true});
  setTimeout(()=>truthPlacementObserver.disconnect(),5000);
  let selectedTruthStep=matchSession.get().corrected?'change':'original';
  const setTruth=(corrected,focus=false)=>{
    selectedTruthStep=focus?'corrected':corrected?'change':'original';
    matchSession.set({source:'match',scenario:'wide',time:16,corrected,section:'truth'},'truth-primary-path');
    $('truth-nav')?.click();
    if(focus)setTimeout(()=>truth.querySelector('.truth-story-grid, .truth-context-details')?.scrollIntoView({behavior:'smooth',block:'center'}),40);
  };
  path.querySelector('[data-truth-step="original"]').onclick=()=>setTruth(false);
  path.querySelector('[data-truth-step="change"]').onclick=()=>setTruth(true);
  path.querySelector('[data-truth-step="corrected"]').onclick=()=>setTruth(true,true);
  const more=path.querySelector('.truth-more-toggle');
  more.onclick=()=>{const shown=truth.classList.toggle('show-all-tools');more.setAttribute('aria-expanded',String(shown));more.textContent=shown?'Fewer controls −':'More evidence tools +';};
  const syncTruthPath=state=>path.querySelectorAll('[data-truth-step]').forEach(button=>{
    if(!state.corrected)selectedTruthStep='original';
    const step=button.dataset.truthStep,active=state.source==='match'&&state.time>=15.9&&state.time<=16.1&&step===selectedTruthStep;
    button.classList.toggle('is-active',active);
  });
  const syncImpact=state=>{const corrected=state.source==='match'&&state.scenario==='wide'&&state.corrected;impact.classList.toggle('is-corrected',corrected);impact.querySelector('[data-corrected]').setAttribute('aria-current',corrected?'true':'false');impact.querySelector('[data-impact-heading]').textContent=corrected?'Correction applied. The calculation, claim and broadcast line changed together.':'Preview the complete consequence, then apply the evidence change.';impact.querySelector('[data-corrected-measurement]').textContent=proofValues.corrected.measurement;impact.querySelector('[data-corrected-copy]').textContent=corrected?'Applied: the defender remains at the starting position.':'Preview: hold the defender at the starting position.';impact.querySelector('[data-impact-calculation]').textContent=`${proofValues.original.measurement} → ${proofValues.corrected.measurement}`;impact.querySelector('[data-impact-claim]').textContent=corrected?'QUALIFIED → WITHDRAWN':'WITHDRAWN IF APPLIED';impact.querySelector('[data-impact-story]').textContent=corrected?'REVISED · ATTACK PROGRESSES; CAUSAL DEFENDER CLAIM REMOVED':'PREVIEW · ATTACK PROGRESSES; CAUSAL DEFENDER CLAIM REMOVED';};
  matchSession.subscribe(state=>{syncTruthPath(state);syncImpact(state);});syncTruthPath(matchSession.get());syncImpact(matchSession.get());
}

const centre=$('centre');
if(centre){
  const formation=centre.querySelector('.formation-layout'),lineupToggle=el('button','centre-lineup-toggle','Lineups +');
  lineupToggle.type='button';lineupToggle.setAttribute('aria-expanded','false');lineupToggle.onclick=()=>{const shown=centre.classList.toggle('show-lineups');lineupToggle.setAttribute('aria-expanded',String(shown));lineupToggle.textContent=shown?'Hide lineups −':'Lineups +';};
  formation?.before(lineupToggle);
  const deep=el('details','centre-deep-dive'),summary=el('summary','','Open event wire, pass network, shot map and evidence detail +');deep.append(summary);
  const first=centre.querySelector('.briefing');
  if(first){let node=first;while(node){const next=node.nextSibling;deep.append(node);node=next;}centre.append(deep);}
}

const inside=$('inside');
if(inside){
  const proof=el('section','cohesion-proof');
  proof.setAttribute('aria-label','What the current prototype proves');
  proof.innerHTML=`
    <header><div><span>THE BTR DIFFERENCE / VERIFIED</span><h2>One story. Six kinds of proof.</h2></div><button type="button" data-open-demo>Run the defining moment →</button></header>
    <div class="judge-snapshot" aria-label="Judge snapshot"><div><span>JUDGE SNAPSHOT</span><strong>ONE CORRECTABLE STORY</strong></div><div><b>REGRESSION SUITE</b><small>Automated checks · see release evidence</small></div><div><b>39 / 40</b><small>Fixed-camera synthetic holdout</small></div><div><b>SOURCE-AWARE</b><small>Film: 3 model roles · match: 4</small></div><div><b>1 FOUNDRY</b><small>Separate evidence referee</small></div><div><b>3 × 5</b><small>Languages × audience views</small></div><div><b>2 SCREENS</b><small>Watch + Pocket Director</small></div><div><b>R1 → R2</b><small>Visible evidence correction</small></div></div>
    <div class="cohesion-proof__grid">
      <article data-tone="live" data-execution-proof><small>01 / AGENT EXECUTION</small><h3>Specialists really hand off.</h3><strong>SOURCE-SPECIFIC EXECUTION</strong><p>Scout, Guide, Check and Host execute sequentially. Vector calculates in code. Execution IDs, latency, evidence and delivery state remain inspectable.</p><button type="button" data-jump-watch>Open the AI desk ↗</button></article>
      <article data-tone="truth"><small>02 / CORRECTION</small><h3>The story must survive the evidence.</h3><strong>CLAIM WITHDRAWN · OUTPUT REVISED</strong><p>Truth Lab changes one synthetic observation, recalculates the affected metric and publishes a narrower broadcast explanation while preserving unaffected facts.</p><button type="button" data-jump-truth>Run the evidence test ↗</button></article>
      <article data-tone="guard"><small>03 / VISION SAFETY GATE</small><h3>Unknown footage fails closed.</h3><strong>IDENTITY + SPEED WITHHELD</strong><p>An unfamiliar real training clip produced misleading colour-marker hits, but ball continuity failed the compatibility gate. BTR routed it to reviewed cues and published no identity, speed or automatic events. This validates withholding behavior, not broadcast detection accuracy.</p><a href="assets/external-video-results.json" download>Download the domain test ↓</a></article>
      <article data-tone="vision"><small>04 / AUTO-EVENT BOUNDARY</small><h3>Detect where calibrated. Withhold where unknown.</h3><strong>SUPPORTED: FIXED CAMERA · UNKNOWN: BROADCAST</strong><p>The frozen detector matched 39 of 40 events across five unseen procedural cases using enrolled fictional markers. A separate unfamiliar-video gate publishes no identity or speed when calibration is absent. This proves controlled detection and safe withholding—not general broadcast accuracy.</p><a href="assets/tracking/holdout-current.json" download>Inspect the frozen study + limits ↓</a></article>
      <article data-tone="value"><small>05 / EARLY COMMENTARY EVALUATION</small><h3>A promising result. Not a superiority claim.</h3><strong>6 CASES · 24 ORDER-REVERSED PAIRS · MODEL-SCORED</strong><p>The current crew narrowly outscored a frozen one-call baseline in an early controlled evaluation. Human preference has not been measured, so BTR does not claim better writing. The proven advantage is operational: inspectable handoffs, deterministic calculation, correction and recovery.</p><a href="assets/commentary-quality-court.json" download>Inspect cases, scores + limitations ↓</a></article>
      <article data-tone="live"><small>06 / MICROSOFT FOUNDRY</small><h3>An evidence court cross-examines the crew.</h3><strong>5 SCORES · CLAIM AUDIT · RELEASE CONDITION</strong><p>After the crew finishes, a Foundry Responses evaluator audits each claim, tests whether every role adds value, identifies the strongest contribution and states the condition for release. Its verdict is advisory; the deterministic evidence gate keeps final authority.</p><a href="assets/live-production-proof.json" download>Download the live Foundry receipt ↓</a></article>
    </div>
    <div class="source-contract">
      <div><span>CORE EVIDENCE LAYER</span><b>Measured replay</b><p>The default source across Watch, Match Centre and Truth Lab: coordinate-backed events, movement, pass quality and claim boundaries.</p></div><i aria-hidden="true">+</i>
      <div><span>OPTIONAL BROADCAST LAYER</span><b>Cinematic minute</b><p>Audience-ready companion film with manually reviewed, time-linked observations and no transferred measurements.</p></div><i aria-hidden="true">→</i>
      <div><span>PUBLIC LAYER</span><b>One match dossier</b><p>Personalized narrative with source labels, receipts and revision history.</p></div>
    </div>
    <div class="quality-boundary"><div><span>WHY MULTI-AGENT?</span><strong>Because the work can be challenged, corrected and recovered.</strong><p>A narrow model-scored evaluation is encouraging, but does not establish superior prose. BTR's demonstrated advantage is structural: persisted specialist handoffs, deterministic calculation, claim-level correction, partial recovery and a Foundry second-line review. Independent human preference remains open.</p></div><a href="independent-review.html">Run an independent human review ↗</a></div>`;
  inside.querySelector('.extension-heading')?.after(proof);
  const syncExecution=()=>{const profile=executionProfile(workspace.source?'upload':matchSession.get().source),card=proof.querySelector('[data-execution-proof]');card.querySelector('strong').textContent=profile.heading;card.querySelector('p').textContent=profile.detail;const legend=document.querySelector('.execution-legend [data-execution="model"]');if(legend){legend.querySelector('strong').textContent=profile.roles;legend.querySelector('small').textContent=profile.heading;}const flow=document.querySelector('.editorial-flow p');if(flow)flow.textContent=profile.detail+(workspace.source?' Uploaded clips retain their own compatibility and evidence receipts; this does not imply a five-specialist model round.':' Guide reads Scout; Host receives the preceding public contributions. Receipts distinguish model output, calculation, rules and fallback. Stored checkpoints support recovery.');};
  matchSession.subscribe(syncExecution);subscribeWorkspace(syncExecution);syncExecution();
  const placeProof=()=>{
    const anchor=inside.querySelector(':scope > #judge-evidence')||inside.querySelector(':scope > .extension-heading');
    if(anchor&&proof.previousElementSibling!==anchor)anchor.after(proof);
  };
  setTimeout(placeProof,0);
  document.addEventListener('btr-section',event=>{if(event.detail==='inside')placeProof();});
  const compactOperations=()=>{
    if(inside.querySelector(':scope > .inside-operations'))return;
    const nodes=[inside.querySelector(':scope > .proof-console'),inside.querySelector(':scope > .proof-dataset')].filter(Boolean);
    if(!nodes.length)return;
    const operations=el('details','inside-operations'),operationsSummary=el('summary');
    operationsSummary.innerHTML='<span>LIVE OPERATIONS + BENCHMARKS</span><strong>Open execution controls, recovery proof and datasets +</strong>';
    nodes[0].before(operations);operations.append(operationsSummary,...nodes);
  };
  setTimeout(compactOperations,500);
  window.addEventListener('load',compactOperations,{once:true});
  const operationObserver=new MutationObserver(()=>compactOperations());
  operationObserver.observe(inside,{childList:true});
  setTimeout(()=>operationObserver.disconnect(),5000);
  document.addEventListener('btr-section',event=>{if(event.detail==='inside')setTimeout(compactOperations,0);});
  proof.querySelector('[data-open-demo]').onclick=()=>document.dispatchEvent(new Event('btr-open-guided'));
  proof.querySelector('[data-jump-watch]').onclick=()=>{$('watch-nav')?.click();setTimeout(()=>$('desk-tab')?.click(),0);};
  proof.querySelector('[data-jump-truth]').onclick=()=>$('truth-nav')?.click();
  const proofGrid=proof.querySelector('.cohesion-proof__grid'),proofCards=[...proofGrid.children],proofTabs=el('nav','proof-focus-tabs');
  proofTabs.setAttribute('aria-label','Choose proof to inspect');
  proofCards.forEach((card,index)=>{card.dataset.proofIndex=String(index);const label=card.querySelector('small')?.textContent?.replace(/^\d+\s*\/\s*/,'')||`Proof ${index+1}`,tab=el('button','',`${String(index+1).padStart(2,'0')} ${label}`);tab.type='button';tab.setAttribute('aria-pressed',String(index===0));tab.onclick=()=>{proofCards.forEach((item,i)=>item.classList.toggle('is-proof-active',i===index));[...proofTabs.children].forEach((item,i)=>item.setAttribute('aria-pressed',String(i===index)));};proofTabs.append(tab);card.classList.toggle('is-proof-active',index===0);});
  proofGrid.before(proofTabs);
  const method=el('details','proof-method'),methodSummary=el('summary','','Sources, model tradeoff and validation limits +');
  method.append(methodSummary,proof.querySelector('.source-contract'),proof.querySelector('.quality-boundary'));
  proof.append(method);
  const deep=el('details','inside-deep-dive'),summary=el('summary');
  summary.innerHTML='<span>PRODUCTION LAB + EVIDENCE ARCHIVE</span><strong>Open the full production lab, exports and technical proof +</strong>';
  deep.append(summary);
  const first=inside.querySelector('.extra-studies');
  if(first){let node=first;while(node){const next=node.nextSibling;if(node!==proof)deep.append(node);node=next;}inside.append(deep);}
}

