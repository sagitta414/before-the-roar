import {matchSession} from './match-session.js';
import {SCENARIOS,clock} from './engine.js';
import {analyzePlay} from './play-analysis.js';
import {FILM_SCENES} from './film-math.js';
const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
const copy={en:{title:'Follow one complete play',sub:'Pressure. Regain. Chance. A continuous synthetic replay, with the data behind every step.',open:'Follow the play ↗',back:'Back to the film ↗',replay:'Replay this stage',proof:'Show the calculation',source:'SYNTHETIC MATCH / ONE CONNECTED SEQUENCE',scene:'One uncut scene at a time',sceneNote:'The same players and action until the cut. Choose the next study when you are ready.',next:'Next scene →',again:'Replay scene ↺',recap:'THE ATTACK, EXPLAINED',map:'Replay map · choose a stage',download:'Save recap + evidence ↓'},es:{title:'Sigue una jugada completa',sub:'Presión. Recuperación. Ocasión. Una secuencia sintética continua con datos para cada paso.',open:'Seguir la jugada ↗',back:'Volver al vídeo ↗',replay:'Repetir esta etapa',proof:'Ver el cálculo',source:'PARTIDO SINTÉTICO / UNA SECUENCIA CONECTADA',scene:'Una escena sin cortes cada vez',sceneNote:'Los mismos jugadores y la misma acción hasta el corte. Elige el siguiente estudio cuando quieras.',next:'Siguiente escena →',again:'Repetir escena ↺',recap:'EL ATAQUE EXPLICADO',map:'Mapa de repetición · elige una etapa',download:'Guardar resumen y evidencia ↓'},pt:{title:'Siga uma jogada completa',sub:'Pressão. Recuperação. Chance. Uma sequência sintética contínua com dados em cada etapa.',open:'Seguir a jogada ↗',back:'Voltar ao vídeo ↗',replay:'Rever esta etapa',proof:'Ver o cálculo',source:'PARTIDA SINTÉTICA / UMA SEQUÊNCIA CONECTADA',scene:'Uma cena sem cortes por vez',sceneNote:'Os mesmos jogadores e a mesma ação até o corte. Escolha o próximo estudo quando quiser.',next:'Próxima cena →',again:'Rever cena ↺',recap:'O ATAQUE EXPLICADO',map:'Mapa da jogada · escolha uma etapa',download:'Salvar resumo e evidência ↓'}};
function startStory(){document.getElementById('film').pause();matchSession.set({source:'match',scenario:'press',corrected:false,focus:8,team:'harbor'});matchSession.set({time:6});document.getElementById('watch-nav').click();}
function seek(at){document.getElementById('film').pause();matchSession.set({time:at},'journey');}
const watch=el('section','play-journey watch-journey');watch.setAttribute('aria-label','The play and its evidence');document.querySelector('.film-chapters').after(watch);
const centre=el('section','play-journey centre-journey');centre.setAttribute('aria-label','Attack analysis');document.querySelector('#centre .synthetic-workspace .formation-layout').before(centre);
const launchers=[];for(const selector of ['.centre-workspace','.truth-workspace']){const banner=el('aside','connected-play');document.querySelector(selector).append(banner);launchers.push(banner);}
function launch(node,c){node.replaceChildren();const text=el('div');text.append(el('strong','',c.title),el('p','',c.sub));const button=el('button','red-button',c.open);button.onclick=startStory;node.append(text,button);}
function board(node,a,s,compact){
 const c=copy[s.language],open=node.querySelector('details')?.open;node.replaceChildren();
 const header=el('div','journey-heading');header.append(el('span','eyebrow',c.source),el('strong','',a.words.title));node.append(header);
 const rail=el('nav','journey-rail');rail.setAttribute('aria-label',c.map);
 for(const chapter of a.chapters){const b=el('button',chapter.reached?'reached':'upcoming');b.append(el('small','',chapter.clock),el('b','',chapter.label),el('span','',chapter.reached?'✓':a.words.pending));b.setAttribute('aria-label',c.replay+' · '+chapter.label+' · '+chapter.clock);b.onclick=()=>seek(chapter.at);rail.append(b);}node.append(rail);
 const metrics=el('div','journey-metrics');const selected=a.shot?[a.calculations[1],a.calculations[0]]:a.pressure?[a.calculations[2],a.calculations[0]]:[a.calculations[0]];
 for(const m of selected){const block=el('div');block.append(el('strong','',m.value),el('span','',m.label));metrics.append(block);}node.append(metrics);
 const evidence=el('details','journey-proof');evidence.open=!!open;evidence.append(el('summary','',c.proof));
 for(const m of a.calculations.filter(m=>m.value!=='—')){const row=el('article');row.append(el('b','',m.label),el('p','',m.text),el('code','',m.equation));for(const id of m.evidence_ids){const e=a.seen.find(e=>e.id===id);const b=el('button','evidence-link',id+' ↗');b.onclick=()=>seek(e?.end??a.pressure?.end??a.cutoff);row.append(b);}evidence.append(row);}evidence.append(el('p','scope-note',a.words.scope));node.append(evidence);
 if(!compact){const takeaway=el('p','journey-takeaway',a.summary);node.append(takeaway);}
 const back=el('button','journey-back',c.back);back.onclick=()=>matchSession.set({source:'pitchside'});if(compact)node.append(back);
}
let last='';function render(s){
 const key=[s.source,s.scenario,Math.floor(s.time*2),Math.floor(s.clipTime*2),s.studyScene,s.language,s.section].join(':');if(key===last)return;last=key;const c=copy[s.language];
 for(const node of launchers)launch(node,c);
 if(s.source==='pitchside'){
  watch.replaceChildren();const scene=FILM_SCENES.findLast(x=>x.start<=s.clipTime),done=s.studyScene&&s.clipTime>=scene.end-.05;
  if(done){const doneBox=el('div','scene-finished');doneBox.append(el('strong','',c.scene),el('p','',c.sceneNote));for(const [label,time]of [[c.again,scene.start],[c.next,scene.end>=60?0:scene.end]]){const button=el('button','outline-button',label);button.onclick=()=>{matchSession.set({clipTime:time});document.getElementById('play').click();};doneBox.append(button);}watch.append(doneBox);}
  const banner=el('div','connected-play');launch(banner,c);watch.append(banner);return;
 }
 const scenario=SCENARIOS.find(x=>x.id===s.scenario),analysis=analyzePlay(scenario,s.time,s.language);board(watch,analysis,s,true);board(centre,analysis,s,false);
}
matchSession.subscribe(render);render(matchSession.get());
