import {matchSession} from './match-session.js';
import {EVIDENCE_CASES,eventComparison} from './evidence-cases.js';

const copy={
 en:{cards:['01 / ORIGINAL OBSERVATION','02 / CHANGED EVIDENCE','03 / CLAIM CHECK','04 / BROADCAST LINE'],title:'Change one record. See what changes.',scope:'Controlled synthetic demonstration · no AI request. This tests dependence on an authored record. It does not establish why a defender moved.',changed:'Laurent is held at his starting position. Moreau’s run and every recorded pass stay in the dataset.',proposed:'Test an alternate record in which Laurent stays at his starting position.',withdrawn:'Withdraw the defender-movement claim. The alternate record shows no lateral movement.',supported:'Movement agrees with the original record; cause remains unproven.',pending:'Movement claim pending until the evidence moment.',change:'Change the defender’s tracking →',restore:'Restore original evidence ↺',advance:'Go to the evidence moment →',changeStatus:'1 movement claim withdrawn. The other checks remain intact.',originalStatus:'Original record active. Apply the change to compare the statements.',pendingStatus:'Advance the replay before judging the movement claim.',preserved:'Still supported: ',metric:'Lateral displacement · original → ',original:'Replay original',current:'Replay current',corrected:'Replay corrected'},
 es:{cards:['01 / OBSERVACIÓN ORIGINAL','02 / EVIDENCIA CAMBIADA','03 / REVISIÓN DE LA AFIRMACIÓN','04 / LÍNEA PARA EMISIÓN'],title:'Cambia un registro. Mira qué cambia.',scope:'Demostración sintética controlada · sin petición a la IA. Comprueba la dependencia del registro; no demuestra por qué se movió el defensor.',changed:'Laurent permanece en su posición inicial. La carrera de Moreau y todos los pases registrados siguen intactos.',proposed:'Prueba un registro alternativo en el que Laurent permanece en su posición inicial.',withdrawn:'Se retira la afirmación sobre el movimiento del defensor. El registro alternativo no muestra desplazamiento lateral.',supported:'El movimiento coincide con el registro original; la causa no está demostrada.',pending:'La afirmación sobre el movimiento espera el momento de evidencia.',change:'Cambiar el seguimiento del defensor →',restore:'Restaurar evidencia original ↺',advance:'Ir al momento de evidencia →',changeStatus:'Se retiró una afirmación sobre movimiento. Las demás comprobaciones siguen intactas.',originalStatus:'Registro original activo. Aplica el cambio para comparar.',pendingStatus:'Avanza la repetición antes de juzgar la afirmación.',preserved:'Sigue respaldado: ',metric:'Desplazamiento lateral · original → ',original:'Repetir original',current:'Repetir actual',corrected:'Repetir corregido'},
 pt:{cards:['01 / OBSERVAÇÃO ORIGINAL','02 / EVIDÊNCIA ALTERADA','03 / REVISÃO DA AFIRMAÇÃO','04 / LINHA PARA TRANSMISSÃO'],title:'Mude um registro. Veja o que muda.',scope:'Demonstração sintética controlada · sem pedido à IA. Testa a dependência do registro; não prova por que o defensor se moveu.',changed:'Laurent permanece na posição inicial. A corrida de Moreau e todos os passes registrados continuam intactos.',proposed:'Teste um registro alternativo em que Laurent permanece na posição inicial.',withdrawn:'A afirmação sobre o movimento do defensor é retirada. O registro alternativo não mostra deslocamento lateral.',supported:'O movimento corresponde ao registro original; a causa não está provada.',pending:'A afirmação sobre o movimento aguarda o momento da evidência.',change:'Alterar o rastreamento do defensor →',restore:'Restaurar evidência original ↺',advance:'Ir ao momento da evidência →',changeStatus:'Uma afirmação sobre movimento foi retirada. As outras verificações permanecem intactas.',originalStatus:'Registro original ativo. Aplique a mudança para comparar.',pendingStatus:'Avance o replay antes de julgar a afirmação.',preserved:'Ainda sustentado: ',metric:'Deslocamento lateral · original → ',original:'Rever original',current:'Rever atual',corrected:'Rever corrigido'}
};

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
 const scope=make('p','truth-demo-scope','Controlled synthetic demonstration · no AI request. This tests dependence on an authored record. It does not establish why a defender moved.');
 const grid=make('div','truth-change-grid');
 const cards=['01 / ORIGINAL OBSERVATION','02 / CHANGED EVIDENCE','03 / CLAIM CHECK','04 / BROADCAST LINE'].map(label=>{
  const card=make('article','truth-change-card'),heading=make('h3','',label),body=make('p','truth-change-copy');card.append(heading,body);grid.append(card);return {card,heading,body};
 });
 const metric=make('strong','truth-change-metric'),evidence=make('p','truth-change-detail');cards[1].card.append(metric,evidence);
 const originalReplay=make('button','outline-button','Replay original record ↗'),currentReplay=make('button','outline-button','Replay current record ↗');
 cards[0].card.append(originalReplay);cards[3].card.append(currentReplay);
 const actions=make('div','truth-change-actions'),change=make('button','red-button'),status=make('p','truth-change-status');status.setAttribute('role','status');
 const survives=make('p','truth-change-survives');actions.append(change,status);
 const proof=make('a','truth-proof-link','See the live AI evidence checks ↗');proof.href='evidence-proof.html';
 const otherCases=make('details','truth-other-cases'),caseSummary=make('summary','','Explore another evidence test');otherCases.append(caseSummary,cases);
 root.append(eyebrow,title,scope,actions,grid,survives,otherCases,proof);
 document.querySelector('#truth .truth-story-grid').before(root);
 let current,eventCase;
 change.onclick=()=>{pause();if(eventCase)seek(eventCase.arrived?eventCase.config.before:eventCase.config.after,false);else if(!current.ready)seek(current.context.ready,false);else toggleCorrection();};
 function replay(corrected){pause();seek(current.time,corrected);document.getElementById('watch-nav').click();}
 originalReplay.onclick=()=>{if(eventCase){pause();seek(eventCase.config.before,false);document.getElementById('watch-nav').click();}else replay(false);};currentReplay.onclick=()=>replay(current.changed);
 return {render(n,packet){
  const c=copy[matchSession.get().language]||copy.en;
  eyebrow.textContent=matchSession.get().language==='es'?'LA AFIRMACIÓN. EL CAMBIO. LA CORRECCIÓN.':matchSession.get().language==='pt'?'A AFIRMAÇÃO. A MUDANÇA. A CORREÇÃO.':'THE CLAIM. THE CHANGE. THE CORRECTION.';
  caseSummary.textContent=matchSession.get().language==='es'?'Explorar otra prueba':matchSession.get().language==='pt'?'Explorar outro teste':'Explore another evidence test';
  cards.forEach((card,index)=>card.heading.textContent=c.cards[index]);
  current=n;root.hidden=false;eventCase=eventComparison(packet.scenario,n.time);root.dataset.kind=eventCase?"arrival":"correction";
  for(const b of cases.children)b.setAttribute('aria-pressed',String(b.dataset.case===packet.scenario));
  if(eventCase){
   const e=eventCase;root.dataset.changed=String(e.arrived);title.textContent='New evidence. A more precise story.';
   scope.textContent='Controlled synthetic demonstration · no AI request. Advance the evidence cutoff; no event is rewritten.';
   cards[0].body.textContent=e.original;cards[1].body.textContent=e.change;cards[2].body.textContent=e.arrived?'The earlier outcome is revised because a later completed event has arrived.':'The later outcome is not yet supported at this cutoff.';cards[3].body.textContent=e.current;
   metric.textContent=e.metric;evidence.textContent=e.source?e.source.id+' · completed at '+e.source.end+'s':'Only completed events can support an outcome.';
   change.textContent=e.arrived?'Restore the earlier cutoff ↺':'Release the next evidence →';status.textContent=e.arrived?'New outcome supported. Earlier records preserved.':'The outcome is pending. No prediction is presented as fact.';
   survives.textContent=e.preserved;originalReplay.textContent='Replay before · '+e.beforeClock+' ↗';currentReplay.textContent='Replay current · '+e.clock+' ↗';return;
  }
  title.textContent=c.title;scope.textContent=c.scope;
  root.dataset.changed=String(n.changed);
  cards[0].body.textContent=n.originalLine;
  cards[2].body.textContent=n.changed?c.withdrawn:n.ready?c.supported:c.pending;
  cards[3].body.textContent=n.currentLine;
  cards[1].body.textContent=n.changed?c.changed:c.proposed;
  metric.textContent=n.ready?`${n.audit.reading.metrics.lateral.toFixed(1)} m → ${n.audit.reference.metrics.lateral.toFixed(1)} m`:'Movement claim not yet reached';
  evidence.textContent=c.metric+(matchSession.get().language==='es'?(n.changed?'corregido':'actual'):matchSession.get().language==='pt'?(n.changed?'corrigido':'atual'):n.changed?'corrected':'current');
  change.textContent=!n.ready?c.advance:n.changed?c.restore:c.change;
  status.textContent=!n.ready?c.pendingStatus:n.changed?c.changeStatus:c.originalStatus;
  survives.textContent=c.preserved+n.factLine;
  originalReplay.textContent=`${c.original} · ${n.clock} ↗`;
  currentReplay.textContent=`${n.changed?c.corrected:c.current} · ${n.clock} ↗`;
 }};
}
