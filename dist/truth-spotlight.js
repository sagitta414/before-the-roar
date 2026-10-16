import {matchSession} from './match-session.js';

export function openTruthDemo(){
 matchSession.set({source:'match',scenario:'wide',corrected:false,section:'truth'},'truth-demo');
 matchSession.set({time:16},'truth-demo');
 document.getElementById('truth-nav').click();
}

export function createTruthSpotlight({seek,toggleCorrection,pause}){
 const make=(tag,cls,text)=>{const node=document.createElement(tag);node.className=cls;if(text)node.textContent=text;return node;};
 const root=make('section','truth-spotlight');root.setAttribute('aria-label','Evidence changes the story');
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
 root.append(eyebrow,title,scope,actions,grid,survives);
 document.querySelector('#truth .truth-story-grid').before(root);
 let current;
 change.onclick=()=>{pause();if(!current.ready)seek(current.context.ready,false);else toggleCorrection();};
 function replay(corrected){pause();seek(current.time,corrected);document.getElementById('watch-nav').click();}
 originalReplay.onclick=()=>replay(false);currentReplay.onclick=()=>replay(current.changed);
 return {render(n,packet){
  current=n;root.hidden=packet.scenario!=='wide';if(root.hidden)return;
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
