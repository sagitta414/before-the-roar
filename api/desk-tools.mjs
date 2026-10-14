import {CLIP_BEATS} from '../dist/featured-clip.js';
export function specialistTools(role,language='en'){
 const l=['en','es','pt'].includes(language)?language:'en';
 if(role==='guide'){
  const copy={en:[['Carry','Moving with the ball under control.'],['Shot','An attempt to send the ball into the goal.'],['Goalkeeper','The player defending the goal.']],es:[['Conducción','Avanzar con el balón controlado.'],['Disparo','Un intento de enviar el balón a la portería.'],['Portero','El jugador que defiende la portería.']],pt:[['Condução','Avançar com a bola sob controle.'],['Chute','Uma tentativa de mandar a bola para o gol.'],['Goleiro','O jogador que defende o gol.']]};
  return {kind:'glossary',source:'curated-localized-football-glossary',items:copy[l].map(([label,text],i)=>({label,text,evidence_ids:[['featured-carry','featured-shot','featured-keeper'][i]]}))};
 }
 if(role==='math'){
  const ids=['featured-carry','featured-shot','featured-keeper'],times=ids.map(id=>CLIP_BEATS.find(b=>b.id===id).at),labels={en:['Carry → shot annotations','Shot → goalkeeper annotations'],es:['Anotaciones: conducción → disparo','Anotaciones: disparo → portero'],pt:['Anotações: condução → chute','Anotações: chute → goleiro']};
  const note={en:'Approximate annotation interval. Not ball travel time or goalkeeper reaction time.',es:'Intervalo aproximado entre anotaciones. No mide el vuelo del balón ni la reacción del portero.',pt:'Intervalo aproximado entre anotações. Não mede o voo da bola nem a reação do goleiro.'}[l];
  const num=v=>new Intl.NumberFormat(l,{maximumFractionDigits:2,minimumFractionDigits:2}).format(v);
  return {kind:'calculations',source:'deterministic-timestamp-subtraction',items:[0,1].map(i=>{const result=Math.round((times[i+1]-times[i])*100)/100;return {label:labels[l][i],expression:`${num(times[i+1])} s − ${num(times[i])} s = ${num(result)} s`,value:result,unit:'seconds',note,evidence_ids:[ids[i],ids[i+1]]};}),unavailable:['calibrated_distance','shot_speed','xG','pass_accuracy','goalkeeper_reaction_time']};
 }
 return null;
}
