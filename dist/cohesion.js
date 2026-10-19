import {matchSession} from './match-session.js';
import {judgeProof} from './judge-mode-model.js';

const $=id=>document.getElementById(id);
const stages=[
  {section:'watch',number:'01',verb:'WATCH',detail:'See the moment'},
  {section:'centre',number:'02',verb:'UNDERSTAND',detail:'Read the play'},
  {section:'lab',number:'03',verb:'MEASURE',detail:'Test the pattern'},
  {section:'truth',number:'04',verb:'CHALLENGE',detail:'Change the evidence'},
  {section:'inside',number:'05',verb:'PUBLISH',detail:'Inspect the proof'},
  {section:'presenters',number:'06',verb:'ENGINEERS',detail:'Meet the team'},
  {section:'security',number:'07',verb:'SECURE',detail:'Inspect protection'},
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
  const mapped=stages.some(s=>s.section===section)?section:'watch';
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
  truth.querySelector('.truth-intro')?.after(path);
  const impact=el('section','truth-verdict-impact');
  impact.setAttribute('aria-live','polite');
  const proofValues=judgeProof();
  impact.innerHTML=`<header><span>THE CLAIM UNDER PRESSURE</span><strong data-impact-heading>Change the evidence to reveal what the system must revise.</strong></header><div class="truth-verdict-impact__compare"><article><small>ORIGINAL EVIDENCE · R1</small><b>${proofValues.original.measurement}</b><span>DEFENDER SHIFT</span><p>Movement claim is qualified.</p></article><i>→</i><article data-corrected><small>CORRECTED EVIDENCE · R2</small><b data-corrected-measurement>?</b><span>DEFENDER SHIFT</span><p data-corrected-copy>Withheld until the tracking change is applied.</p></article></div><div class="truth-verdict-impact__outcomes"><span>CALCULATION <b data-impact-calculation>${proofValues.original.measurement} → ?</b></span><span>CLAIM <b data-impact-claim>PENDING</b></span><span>ON-SCREEN STORY <b data-impact-story>WAITING</b></span></div>`;
  path.after(impact);
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
  const syncImpact=state=>{const corrected=state.source==='match'&&state.scenario==='wide'&&state.corrected;impact.classList.toggle('is-corrected',corrected);impact.querySelector('[data-corrected]').setAttribute('aria-current',corrected?'true':'false');impact.querySelector('[data-impact-heading]').textContent=corrected?'One changed observation. Three required consequences.':'Change the evidence to reveal what the system must revise.';impact.querySelector('[data-corrected-measurement]').textContent=corrected?proofValues.corrected.measurement:'?';impact.querySelector('[data-corrected-copy]').textContent=corrected?'Movement claim is withdrawn.':'Withheld until the tracking change is applied.';impact.querySelector('[data-impact-calculation]').textContent=corrected?`${proofValues.original.measurement} → ${proofValues.corrected.measurement}`:`${proofValues.original.measurement} → ?`;impact.querySelector('[data-impact-claim]').textContent=corrected?'QUALIFIED → WITHDRAWN':'PENDING';impact.querySelector('[data-impact-story]').textContent=corrected?'REVISED':'WAITING';};
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
    <div class="judge-snapshot" aria-label="Judge snapshot"><div><span>JUDGE SNAPSHOT</span><strong>ONE CORRECTABLE STORY</strong></div><div><b>269 TESTS</b><small>Passing automated checks</small></div><div><b>39 / 40</b><small>Fixed-camera synthetic holdout</small></div><div><b>4 + 1</b><small>Azure specialists + code calculation</small></div><div><b>1 FOUNDRY</b><small>Separate evidence referee</small></div><div><b>3 × 5</b><small>Languages × audience views</small></div><div><b>2 SCREENS</b><small>Watch + Pocket Director</small></div><div><b>R1 → R2</b><small>Visible evidence correction</small></div></div>
    <div class="cohesion-proof__grid">
      <article data-tone="live"><small>01 / AGENT EXECUTION</small><h3>Specialists really hand off.</h3><strong>4 AZURE REQUESTS + 1 CALCULATION</strong><p>Scout, Guide, Check and Host execute sequentially. Vector calculates in code. Execution IDs, latency, evidence and delivery state remain inspectable.</p><button type="button" data-jump-watch>Open the AI desk ↗</button></article>
      <article data-tone="truth"><small>02 / CORRECTION</small><h3>The story must survive the evidence.</h3><strong>CLAIM WITHDRAWN · OUTPUT REVISED</strong><p>Truth Lab changes one synthetic observation, recalculates the affected metric and publishes a narrower broadcast explanation while preserving unaffected facts.</p><button type="button" data-jump-truth>Run the evidence test ↗</button></article>
      <article data-tone="guard"><small>03 / VISION SAFETY GATE</small><h3>Unknown footage fails closed.</h3><strong>IDENTITY + SPEED WITHHELD</strong><p>An unfamiliar real training clip produced no enrolled marker matches. BTR published no player identity or physical speed. This validates withholding behavior, not broadcast detection accuracy.</p><a href="assets/external-video-results.json" download>Download the domain test ↓</a></article>
      <article data-tone="vision"><small>04 / AUTO-EVENT READINESS</small><h3>The current detector is frozen, hashed and tested on new cases.</h3><strong>39/40 MATCHED · 100% CONTROLLED PRECISION</strong><p>Five new procedural cases were generated after the detector source was archived. One low-light event miss is retained. The study covers fixed-camera synthetic marker footage and does not claim broadcast accuracy.</p><a href="assets/tracking/holdout-current.json" download>Inspect the current holdout ↓</a></article>
      <article data-tone="value"><small>05 / COMMENTARY VALUE</small><h3>The crew now earns a measured edge.</h3><strong>46–45 OVERALL · 45–43 GROUNDING · 47–45 DECISION</strong><p>Across six preregistered cases scored twice with A/B order reversed, the current crew edged the frozen one-model baseline on overall quality, grounding and decision usefulness. Correction sensitivity tied 48–48 and role distinction tied 60–60. This is a scoped Azure model-score, not a human preference study.</p><a href="assets/commentary-quality-court.json" download>Inspect cases, scores + model receipts ↓</a></article>
      <article data-tone="live"><small>06 / MICROSOFT FOUNDRY</small><h3>An evidence court cross-examines the crew.</h3><strong>5 SCORES · CLAIM AUDIT · RELEASE CONDITION</strong><p>After the crew finishes, a Foundry Responses evaluator audits each claim, tests whether every role adds value, identifies the strongest contribution and states the condition for release. Its verdict is advisory; the deterministic evidence gate keeps final authority.</p><a href="assets/live-production-proof.json" download>Download the live Foundry receipt ↓</a></article>
    </div>
    <div class="source-contract">
      <div><span>CORE EVIDENCE LAYER</span><b>Measured replay</b><p>The default source across Watch, Match Centre and Truth Lab: coordinate-backed events, movement, pass quality and claim boundaries.</p></div><i aria-hidden="true">+</i>
      <div><span>OPTIONAL BROADCAST LAYER</span><b>Cinematic minute</b><p>Audience-ready companion film with manually reviewed, time-linked observations and no transferred measurements.</p></div><i aria-hidden="true">→</i>
      <div><span>PUBLIC LAYER</span><b>One match dossier</b><p>Personalized narrative with source labels, receipts and revision history.</p></div>
    </div>
    <div class="quality-boundary"><div><span>WHY MULTI-AGENT?</span><strong>A small quality edge, plus control under change and failure.</strong><p>The current crew scored 46–45 over the frozen one-model baseline across twelve blinded case-pass ratings, with its clearest gains in grounding and useful next decisions. It also adds persisted handoffs, deterministic calculation, claim-level correction, partial recovery and a Foundry second-line review. The measured sample is narrow; human preference remains open.</p></div><a href="independent-review.html">Run an independent human review ↗</a></div>`;
  inside.querySelector('.extension-heading')?.after(proof);
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
