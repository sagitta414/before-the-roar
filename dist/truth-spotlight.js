import {matchSession} from './match-session.js';
import {EVIDENCE_CASES,eventComparison} from './evidence-cases.js';

export function openTruthDemo(){
 matchSession.set({source:'match',scenario:'wide',corrected:false,section:'truth'},'truth-demo');
 matchSession.set({time:16},'truth-demo');
 document.getElementById('truth-nav').click();
}

export function createTruthSpotlight({seek,toggleCorrection,pause}){
 const make=(tag,cls,text)=>{const node=document.createElement(tag);node.className=cls;if(text)node.textContent=text;return node;};
 const root=make('section','truth-spotlight');root.setAttribute('aria-label','Evidence changes the story');
 const cases=make('div','truth-case-picker');cases.setAttribute('role','group');cases.setAttribute('aria-label','Evidence tests');
 for(const c of EVIDENCE_CASES){const b=make('button','outline-button',c.name);b.dataset.case=c.id;b.onclick=()=>{pause();matchSession.set({source:'match',scenario:c.id,corrected:false,section:'truth'},'evidence-case');matchSession.set({time:c.before},'evidence-case');};cases.append(b);}
 const eyebrow=make('p','eyebrow','THE CLAIM. THE CHANGE. THE CORRECTION.');
 const title=make('h2','','Change one record. See what changes.');
 const scope=make('p','truth-demo-scope','Controlled synthetic demonstration · no AI request. This changes an authored tracking record, not the real world.');
 const grid=make('div','truth-change-grid');
 const cards=['01 / ORIGINAL STATEMENT','02 / CHANGED EVIDENCE','03 / CURRENT EXPLANATION'].map(label=>{
  const card=make('article','truth-change-card'),heading=make('h3','',label),body=make('p','truth-change-copy');card.append(heading,body);grid.append(card);return {card,body};
 });
 const metric=make('strong','truth-change-metric'),evidence=make('p','truth-change-detail');cards[1].card.append(metric,evidence);
 const originalReplay=make('button','outline-button','Replay original record ↗'),currentReplay=make('button','outline-button','Replay current record ↗');
 cards[0].card.append(originalReplay);cards[2].card.append(currentReplay);
 const actions=make('div','truth-change-actions'),change=make('button','red-button'),status=make('p','truth-change-status');status.setAttribute('role','status');
 const survives=make('p','truth-change-survives');actions.append(change,status);
 const proof=make('a','truth-proof-link','See the live AI evidence checks ↗');proof.href='evidence-proof.html';
 root.append(cases,eyebrow,title,scope,actions,grid,survives,proof);
 document.querySelector('#truth .truth-story-grid').before(root);
 let current,eventCase;
 change.onclick=()=>{pause();if(eventCase)seek(eventCase.arrived?eventCase.config.before:eventCase.config.after,false);else if(!current.ready)seek(current.context.ready,false);else toggleCorrection();};
 function replay(corrected){pause();seek(current.time,corrected);document.getElementById('watch-nav').click();}
 originalReplay.onclick=()=>{if(eventCase){pause();seek(eventCase.config.before,false);document.getElementById('watch-nav').click();}else replay(false);};currentReplay.onclick=()=>replay(current.changed);
 return {render(n,packet){
  current=n;root.hidden=false;eventCase=eventComparison(packet.scenario,n.time);root.dataset.kind=eventCase?"arrival":"correction";
  for(const b of cases.children)b.setAttribute('aria-pressed',String(b.dataset.case===packet.scenario));
  if(eventCase){
   const e=eventCase;root.dataset.changed=String(e.arrived);title.textContent='New evidence. A more precise story.';
   scope.textContent='Controlled synthetic demonstration · no AI request. Advance the evidence cutoff; no event is rewritten.';
   cards[0].body.textContent=e.original;cards[1].body.textContent=e.change;cards[2].body.textContent=e.current;
   metric.textContent=e.metric;evidence.textContent=e.source?e.source.id+' · completed at '+e.source.end+'s':'Only completed events can support an outcome.';
   change.textContent=e.arrived?'Restore the earlier cutoff ↺':'Release the next evidence →';status.textContent=e.arrived?'New outcome supported. Earlier records preserved.':'The outcome is pending. No prediction is presented as fact.';
   survives.textContent=e.preserved;originalReplay.textContent='Replay before · '+e.beforeClock+' ↗';currentReplay.textContent='Replay current · '+e.clock+' ↗';return;
  }
  title.textContent='Change one record. See what changes.';scope.textContent='Controlled synthetic demonstration · no AI request. This changes an authored tracking record, not the real world.';
  root.dataset.changed=String(n.changed);
  cards[0].body.textContent=n.originalLine;
  cards[2].body.textContent=n.currentLine;
  cards[1].body.textContent=n.changed?'Laurent is held at his starting position. Moreau’s run and every recorded pass stay in the dataset.':'Test an alternate record in which Laurent stays at his starting position.';
  metric.textContent=n.ready?`${n.audit.reading.metrics.lateral.toFixed(1)} m → ${n.audit.reference.metrics.lateral.toFixed(1)} m`:'Movement claim not yet reached';
  evidence.textContent=n.changed?'Lateral displacement · original → corrected':'Lateral displacement · original → current';
  change.textContent=!n.ready?'Go to the evidence moment →':n.changed?'Restore original evidence ↺':'Change the defender’s tracking →';
  status.textContent=!n.ready?'Advance the replay before judging the movement claim.':n.changed?'1 movement claim withdrawn. The other checks remain intact.':'Original record active. Apply the change to compare the statements.';
  survives.textContent='Still supported: '+n.factLine;
  originalReplay.textContent=`Replay original · ${n.clock} ↗`;
  currentReplay.textContent=`Replay ${n.changed?'corrected':'current'} · ${n.clock} ↗`;
 }};
}
