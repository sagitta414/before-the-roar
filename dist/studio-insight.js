import {playEvidence} from './play-evidence.js';
import {SCENARIOS,events,position} from './engine.js';
export const choose=(language,en,es,pt)=>({en,es,pt}[language]||en);
export const changeTimes={wide:[16,16],press:[9,10],counter:[27,28]};
export function normalizeStudio(input={}){
 if(!['wide','press','counter'].includes(input.scenario)||!Number.isFinite(input.time)||input.time<0||input.time>36||!['en','es','pt'].includes(input.language)||typeof input.corrected!=='boolean'||typeof input.tracking!=='boolean')throw Error('Invalid evidence snapshot');
 return {scenario:input.scenario,time:Math.round(input.time*10)/10,language:input.language,corrected:input.corrected&&input.scenario==='wide',tracking:input.tracking};
}
export function studioKey(input){const p=normalizeStudio(input);return JSON.stringify(p);}
export function studioInsight(input){
 const m=playEvidence(input),l=input.language||'en',t=(en,es,pt)=>choose(l,en,es,pt),p=m.last;
 const moveId=m.s.id==='wide'?102:m.off?.id||m.s.focus;
 const ids=m.seen.map(e=>e.id),scope=`${m.s.id}-scope-${m.time.toFixed(1)}-${m.corrected?'r2':'r1'}-${m.tracking?'tracking':'no-tracking'}`;
 const track=`${m.s.id}-track-${moveId}-${m.time.toFixed(1)}-${m.corrected?'r2':'r1'}`;
 const cut=m.s.id==='press'?10:28,reached=m.time>=cut;
 const change=m.s.id==='wide'?m.movement:m.s.id==='press'?(reached?t('Cole intercepted the pass. Pressure preceded the recovery; the record does not establish that it caused the error.','Cole interceptó el pase. La presión precedió a la recuperación; el registro no demuestra que causara el error.','Cole interceptou o passe. A pressão precedeu a recuperação; o registro não prova que causou o erro.'):t('The pass has not completed. Possession change is not established at this cutoff.','El pase no ha terminado. El cambio de posesión no está confirmado en este instante.','O passe ainda não terminou. A mudança de posse não está confirmada neste instante.')):(reached?t('Berg saved Brooks’ shot. The build-up remains recorded; this shot produced no goal.','Berg detuvo el disparo de Brooks. La construcción sigue registrada; este tiro no produjo gol.','Berg defendeu o chute de Brooks. A construção permanece registrada; este chute não produziu gol.'):t('The shot result is not available at this cutoff. Do not call a goal or a save yet.','El resultado del tiro no está disponible en este instante. Todavía no se puede afirmar gol ni parada.','O resultado do chute não está disponível neste instante. Ainda não se pode afirmar gol nem defesa.'));
 const outcome=m.s.id==='wide'?null:m.seen.find(e=>m.s.id==='press'?e.outcome==='intercepted':e.type==='shot');
 const supportedIds=m.s.id==='wide'&&m.tracking?[track]:outcome?[outcome.id]:[scope];
 const limit=t('Sequence and proximity do not prove causation.','La secuencia y la proximidad no prueban causalidad.','Sequência e proximidade não provam causalidade.');
 const observation=m.tracking?change:t('Player tracking is withheld. Movement and off-ball claims must be withdrawn; completed event records remain available.','Se han retirado los datos de seguimiento. Deben retirarse las afirmaciones de movimiento y sin balón; los eventos completados siguen disponibles.','Os dados de rastreamento foram retirados. Afirmações de movimento e sem bola devem ser retiradas; os eventos completos continuam disponíveis.');
 const roles=[
  {role:'analyst',name:'Scout',summary:observation,evidence_ids:m.tracking?supportedIds:[scope]},
  {role:'guide',name:'Guide',summary:t('A pass is an attempt to move the ball to a teammate. Tracking describes where players move. Removing one source does not erase the other.','Un pase intenta llevar el balón a un compañero. El seguimiento describe el movimiento de los jugadores. Retirar una fuente no borra la otra.','Um passe tenta levar a bola a um companheiro. O rastreamento descreve o movimento dos jogadores. Retirar uma fonte não apaga a outra.'),evidence_ids:[scope]},
  {role:'math',name:'Vector',summary:p?m.pass:t('No completed pass is available for a speed calculation.','No hay un pase completado para calcular su velocidad.','Não há passe completo para calcular a velocidade.'),evidence_ids:p?[p.id]:[scope]},
  {role:'reviewer',name:'Check',summary:(m.corrected?t('Withdraw the original defender-movement claim. ','Retira la afirmación original del movimiento defensivo. ','Retire a afirmação original do movimento defensivo. '):!m.tracking?t('Do not infer positions from missing tracking. ','No infieras posiciones sin seguimiento. ','Não infira posições sem rastreamento. '):'')+limit,evidence_ids:[scope]},
  {role:'presenter',name:'Host',summary:observation+' '+t('Keep the completed passes; revise only what the changed evidence supports.','Conserva los pases completados; revisa solo lo que permite la evidencia modificada.','Mantenha os passes completos; revise apenas o que a evidência alterada permite.'),evidence_ids:[...supportedIds.filter(id=>m.tracking||id!==track),scope]}
 ];
 const receipt={snapshot:{scenario:m.s.id,time:m.time,language:l,corrected:m.corrected,tracking:m.tracking},records:[...m.seen,{id:scope,type:'coverage',second:m.time,tracking:m.tracking,revision:m.corrected?2:1},...(m.tracking?[{id:track,type:'tracking',player:moveId,second:m.time,start:position(m.s,moveId,0,m.corrected),position:position(m.s,moveId,m.time,m.corrected)}]:[])]};
 return {m,moveId,change,roles,receipt,scope,limit};
}
