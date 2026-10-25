import {SCENARIOS,PLAYERS,events} from './engine.js';
import {matchStory} from './match-story.js';
import {PITCHSIDE_BEATS,pitchsideStory} from './pitchside-story.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
const languages=['en','es','pt'];
const phrase={
 en:{observed:'REVIEWED FRAME',calculated:'SYNTHETIC EVENT',correction:'EVIDENCE CORRECTION',opening:'Watch the play, then listen for the evidence.',withdrawn:'The earlier defender-movement claim is withdrawn. The recorded passes remain.',filmLimit:'AI-generated, edited film. Captions follow reviewed frames; player identity and physical speed are not measured.',matchLimit:'Coordinate-rendered synthetic match. Event outcomes come from the fixture; tactical cause is not proven.'},
 es:{observed:'FOTOGRAMA REVISADO',calculated:'EVENTO SINTÉTICO',correction:'CORRECCIÓN DE EVIDENCIA',opening:'Mira la jugada y escucha la evidencia.',withdrawn:'Se retira la afirmación sobre el movimiento del defensor. Los pases registrados siguen vigentes.',filmLimit:'Vídeo generado y editado. Los subtítulos siguen fotogramas revisados; identidad y velocidad física no medidas.',matchLimit:'Partido sintético basado en coordenadas. Los resultados vienen del registro; la causa táctica no está probada.'},
 pt:{observed:'QUADRO REVISADO',calculated:'EVENTO SINTÉTICO',correction:'CORREÇÃO DA EVIDÊNCIA',opening:'Veja a jogada e ouça a evidência.',withdrawn:'A afirmação anterior sobre o movimento do defensor foi retirada. Os passes registrados permanecem.',filmLimit:'Vídeo gerado e editado. As legendas seguem quadros revisados; identidade e velocidade física não medidas.',matchLimit:'Partida sintética baseada em coordenadas. Os resultados vêm do registro; a causa tática não foi provada.'}
};

function filmCues(session,start,end,language){
 const index=languages.indexOf(language),at=(time,mode='beginner')=>pitchsideStory({time,language,mode,clipChallenge:session.clipChallenge});
 const first=at(start),cues=[{at:start,title:first.title,text:first.body,detail:at(start,'analyst').body,kind:'observed',evidenceIds:first.evidence.map(e=>e.id)}];
 for(const beat of PITCHSIDE_BEATS.filter(beat=>beat.second>start+.05&&beat.second<=end)){
  const story=at(beat.second);
  cues.push({at:beat.second,title:beat.titles[index],text:session.clipChallenge?story.body:beat.observations[index],detail:at(beat.second,'analyst').body,kind:'observed',evidenceIds:[beat.id]});
 }
 return cues;
}

function matchCues(session,start,end,language){
 const scenario=SCENARIOS.find(item=>item.id===session.scenario)||SCENARIOS[0];
 const story=(time,mode='beginner')=>matchStory({...session,time,mode}),first=story(start);
 const cues=[{at:start,title:first.title,text:first.body,detail:story(start,'analyst').body,kind:'calculated',evidenceIds:first.brief.evidenceIds}];
 const player=id=>PLAYERS.find(p=>p.id===id)?.name||'a player';
 for(const event of events(scenario).filter(e=>e.end>start+.05&&e.end<=end)){
  const labels={en:{pass:'Pass completed',shot:'Shot',tackle:'Recovery',intercepted:'Pass intercepted'},es:{pass:'Pase completo',shot:'Disparo',tackle:'Recuperación',intercepted:'Pase interceptado'},pt:{pass:'Passe completo',shot:'Chute',tackle:'Recuperação',intercepted:'Passe interceptado'}}[language];
  const title=event.outcome==='intercepted'?labels.intercepted:labels[event.type];
  const action=language==='es'?(event.type==='shot'?`${player(event.from)} dispara. ${event.outcome==='saved'?'El guardameta detiene el balón.':event.outcome==='goal'?'El registro confirma un gol.':'El resultado no está confirmado.'}`:event.type==='tackle'?`${player(event.from)} recupera el balón.`:event.outcome==='intercepted'?`${player(event.from)} intenta un pase. ${player(event.interceptor)} lo intercepta.`:`${player(event.from)} completa un pase a ${player(event.to)}.`):language==='pt'?(event.type==='shot'?`${player(event.from)} chuta. ${event.outcome==='saved'?'O goleiro defende.':event.outcome==='goal'?'O registro confirma o gol.':'O resultado não foi confirmado.'}`:event.type==='tackle'?`${player(event.from)} recupera a bola.`:event.outcome==='intercepted'?`${player(event.from)} tenta um passe. ${player(event.interceptor)} intercepta.`:`${player(event.from)} completa um passe para ${player(event.to)}.`):(event.type==='shot'?`${player(event.from)} takes a shot. ${event.outcome==='saved'?'The goalkeeper saves it.':event.outcome==='goal'?'The event record confirms a goal.':'The outcome is not confirmed.'}`:event.type==='tackle'?`${player(event.from)} wins the ball back.`:event.outcome==='intercepted'?`${player(event.from)} attempts a pass. ${player(event.interceptor)} intercepts it.`:`${player(event.from)} completes a pass to ${player(event.to)}.`);
  cues.push({at:event.end,title,text:action,detail:story(event.end,'analyst').body,kind:'calculated',evidenceIds:[event.id],pan:Math.max(-1,Math.min(1,(event.endPosition?.[0]??52.5)/52.5-1)),possessionChange:event.type==='tackle'||event.outcome==='intercepted'});
 }
 if(session.corrected&&scenario.id==='wide'&&end>=16){
  const at=Math.max(start,16);
  cues.push({at,title:story(at).title,text:phrase[language].withdrawn,detail:story(at,'analyst').body,kind:'correction',evidenceIds:story(at).review.evidence_ids});
 }
 return cues.sort((a,b)=>a.at-b.at||((a.kind==='correction')?1:-1));
}

export function buildAccessibleReplay(session){
 const source=session.source==='match'?'match':'pitchside',language=languages.includes(session.language)?session.language:'en';
 const duration=source==='match'?36:60,end=clamp(source==='match'?session.time:session.clipTime,0,duration),start=Math.max(0,end-18);
 const scenario=SCENARIOS.find(item=>item.id===session.scenario)||SCENARIOS[0];
 const cues=source==='match'?matchCues(session,start,end,language):filmCues(session,start,end,language);
 const final=source==='match'?matchStory({...session,time:end,mode:'beginner'}):pitchsideStory({time:end,language,mode:'beginner',clipChallenge:session.clipChallenge});
 return {source,scenario:scenario.id,language,start,end,duration,revision:final.revision,video:source==='match'?`assets/${scenario.id}-film.mp4`:'assets/pitchside-minute.mp4',poster:source==='match'?`assets/${scenario.id}-poster.jpg`:'assets/pitchside-minute-poster.jpg',cues,summary:final.body,limit:source==='match'?phrase[language].matchLimit:phrase[language].filmLimit,labels:phrase[language],evidenceIds:[...new Set(cues.flatMap(cue=>cue.evidenceIds||[]))]};
}

export function replayCueAt(plan,time){return [...plan.cues].reverse().find(cue=>cue.at<=time+.05)||plan.cues[0];}
