import {matchSession} from './match-session.js';
import {matchStory} from './match-story.js';
import {pitchsideStory} from './pitchside-story.js';
import {filmMath,FILM_SCENES} from './film-math.js';
import {sceneGuide} from './scene-guide.js';

const root=document.getElementById('centre');
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
const copy={
 en:{eyebrow:'BTR / UNDERSTAND THE PLAY',title:'One play. Three questions.',intro:'Follow the story in order, then choose what you want to see next.',story:'THE STORY SO FAR',level:'CHOOSE YOUR LEVEL',action:'YOUR NEXT MOVE',what:'WHAT HAPPENED',why:'WHY IT MATTERS',next:'WATCH NEXT',beginner:'New to football',analyst:'Tactical view',math:'Show the math',evidence:'EVIDENCE AVAILABLE',replay:'Show this on the replay',truth:'Test this explanation',waiting:'The play has not established an event yet.',waitingWhy:'That is still useful: a trustworthy explanation waits for the action instead of filling the silence with a guess.',waitingNext:'Start with the ball, then notice who moves without it and which defender has to choose.',observed:'OBSERVED',interpretation:'INTERPRETATION',unproven:'NOT PROVEN',sourceFilm:'REVIEWED FILM',sourceMatch:'MEASURED REPLAY',concept:'FOOTBALL KEY',limit:'EVIDENCE LIMIT'},
 es:{eyebrow:'DECODIFICADOR EN VIVO',title:'Mira la pista. Entiende la consecuencia.',intro:'Una respuesta útil en cada momento, incluso mientras llega la evidencia.',what:'QUÉ OCURRIÓ',why:'POR QUÉ IMPORTA',next:'QUÉ MIRAR AHORA',beginner:'Nuevo en el fútbol',analyst:'Visión táctica',math:'Ver las matemáticas',evidence:'EVIDENCIA DISPONIBLE',replay:'Muéstramelo en la repetición',truth:'Cuestionar esta explicación',waiting:'La jugada todavía no ha establecido un evento.',waitingWhy:'Eso también es útil: una explicación fiable espera la acción en lugar de inventar una respuesta.',waitingNext:'Empieza por el balón; después mira quién se mueve sin él y qué defensor debe elegir.',observed:'OBSERVADO',interpretation:'INTERPRETACIÓN',unproven:'NO DEMOSTRADO',sourceFilm:'VÍDEO REVISADO',sourceMatch:'REPETICIÓN MEDIDA',concept:'CLAVE DE FÚTBOL',limit:'LÍMITE DE EVIDENCIA'},
 pt:{eyebrow:'DECODIFICADOR AO VIVO',title:'Veja a pista. Entenda a consequência.',intro:'Uma resposta útil em cada ponto da jogada, mesmo enquanto a evidência ainda chega.',what:'O QUE ACONTECEU',why:'POR QUE IMPORTA',next:'O QUE VER AGORA',beginner:'Novo no futebol',analyst:'Visão tática',math:'Ver a matemática',evidence:'EVIDÊNCIA DISPONÍVEL',replay:'Mostre no replay',truth:'Questionar esta explicação',waiting:'A jogada ainda não estabeleceu um evento.',waitingWhy:'Isso ainda é útil: uma explicação confiável espera a ação em vez de preencher o silêncio com um palpite.',waitingNext:'Comece pela bola; depois veja quem se move sem ela e qual defensor precisa escolher.',observed:'OBSERVADO',interpretation:'INTERPRETAÇÃO',unproven:'NÃO COMPROVADO',sourceFilm:'VÍDEO REVISADO',sourceMatch:'REPLAY MEDIDO',concept:'CHAVE DO FUTEBOL',limit:'LIMITE DA EVIDÊNCIA'}
};
const sceneKeys=[
 ['1 v 1','One attacker faces one defender. The next touch can change who controls the space.','Watch the attacker’s hips and the defender’s feet at the same time.'],
 ['Passing option','A nearby teammate can give the player on the ball a safer route out.','Watch whether the defender protects the ball or the possible receiver.'],
 ['Close control','Repeated touches let a player carry the ball while reacting to pressure.','Watch whether the next touch moves toward space or toward the defender.'],
 ['Defending distance','A defender can delay an attack without immediately trying to win the ball.','Watch the gap: too close invites a dribble; too far gives the attacker time.'],
 ['Width','Moving toward the touchline can stretch the area a defender must protect.','Watch whether another player can use the space nearer the centre.'],
 ['Goalkeeper action','A catch ends the immediate danger and can begin the next attack.','Watch the goalkeeper’s first look after securing the ball.'],
 ['Communication','A gesture can organize teammates, but it does not prove what they decided.','Watch the next movement for evidence that the message changed the shape.'],
 ['Receiving shape','A player’s first touch and body angle affect which direction can come next.','Watch whether the receiver can see both the ball and the next passing option.']
];
const modeTitles={en:{math:'What the record can calculate',analyst:'The positional consequence',beginner:'The football meaning',test:'Use the next action as the test',habit:'Build a viewing habit'},es:{math:'Lo que puede calcular el registro',analyst:'La consecuencia posicional',beginner:'El significado futbolístico',test:'Usa la siguiente acción como prueba',habit:'Crea un hábito de observación'},pt:{math:'O que o registro pode calcular',analyst:'A consequência posicional',beginner:'O significado no futebol',test:'Use a próxima ação como teste',habit:'Crie um hábito de observação'}};
const concepts={en:{shot:'Shot',recovery:'Recovery',pass:'Pass'},es:{shot:'Disparo',recovery:'Recuperación',pass:'Pase'},pt:{shot:'Chute',recovery:'Recuperação',pass:'Passe'}};

if(root){
 const heading=root.querySelector('.extension-heading');
 heading.querySelector('.eyebrow').textContent='BTR / MATCH CENTRE';
 heading.querySelector('h1').innerHTML='UNDERSTAND <em>THE PLAY.</em>';
 heading.querySelector('p').innerHTML='What happened. Why it matters.<br><strong>What to watch next.</strong>';
 document.getElementById('centre-nav').textContent='Understand';
 const panel=el('section','understand-now');panel.setAttribute('aria-label','Current play explanation');panel.innerHTML=`
  <header class="understand-head"><div><span class="eyebrow" data-u="eyebrow"></span><h2 data-u="title"></h2><p data-u="intro"></p></div><div class="understand-live"><i></i><span data-u="source"></span><time data-u="clock"></time></div></header>
  <div class="understand-level"><span data-u="level-label"></span><nav class="understand-modes" aria-label="Choose how to understand this play"></nav></div>
  <section class="understand-story" aria-live="polite"><small data-u="story-label"></small><strong data-u="storyline"></strong><span data-u="status"></span></section>
  <div class="understand-grid">
   <div class="understand-narrative">
    <article class="understand-answer" data-step="what"><span>01</span><div><small data-u="what-label"></small><h3 data-u="what"></h3><p data-u="what-detail"></p></div></article>
    <article class="understand-answer" data-step="why"><span>02</span><div><small data-u="why-label"></small><h3 data-u="why-title"></h3><p data-u="why"></p></div></article>
    <article class="understand-answer" data-step="next"><span>03</span><div><small data-u="next-label"></small><h3 data-u="next-title"></h3><p data-u="next"></p></div></article>
   </div>
   <aside class="understand-proof"><div class="understand-proof-top"><span data-u="evidence-label"></span><strong data-u="count"></strong></div><div class="understand-gauge" aria-label="Evidence boundary"><span data-state="observed"></span><span data-state="interpretation"></span><span data-state="unproven"></span></div><div class="understand-concept"><small data-u="concept-label"></small><strong data-u="concept"></strong><p data-u="definition"></p></div><div class="understand-limit"><small data-u="limit-label"></small><p data-u="limit"></p></div></aside>
  </div>
  <footer class="understand-actions"><div><small data-u="action-label"></small><strong>See the clue in motion, or challenge the evidence behind it.</strong></div><button class="red-button" data-action="replay"></button><button class="outline-button" data-action="truth"></button></footer>`;
 heading.after(panel);
 const modes=panel.querySelector('.understand-modes');
 for(const mode of ['beginner','analyst','math']){const button=el('button');button.type='button';button.dataset.mode=mode;button.onclick=()=>matchSession.set({mode},'understand-mode');modes.append(button);}
 panel.querySelector('[data-action="truth"]').onclick=()=>document.getElementById('truth-nav').click();
 panel.querySelector('[data-action="replay"]').onclick=()=>{
  const state=matchSession.get();
  if(state.source==='pitchside'){
   const guide=sceneGuide(state.clipTime,state.language),target=guide.empty?guide.firstAt+.15:Math.max(guide.scene.start,Math.min(state.clipTime,guide.scene.end-.1));
   matchSession.set({clipTime:target},'understand-replay');
   document.querySelector('#centre .film-study-screen')?.scrollIntoView({behavior:'smooth',block:'center'});
  }else{
   const target=Math.max(state.time,{wide:16,press:10,counter:12}[state.scenario]||10);
   matchSession.set({time:target},'understand-replay');
   document.querySelector('#centre .formation-panel')?.scrollIntoView({behavior:'smooth',block:'center'});
  }
 };
 const set=(name,value)=>{const node=panel.querySelector(`[data-u="${name}"]`);if(node)node.textContent=value;};
 function render(state){
  const language=copy[state.language]?state.language:'en',c=copy[language],mode=['beginner','analyst','math'].includes(state.mode)?state.mode:'beginner';
  set('eyebrow',c.eyebrow);set('title',c.title);set('intro',c.intro);set('story-label',c.story||'THE STORY SO FAR');set('level-label',c.level||'CHOOSE YOUR LEVEL');set('action-label',c.action||'YOUR NEXT MOVE');set('what-label',c.what);set('why-label',c.why);set('next-label',c.next);set('evidence-label',c.evidence);set('concept-label',c.concept);set('limit-label',c.limit);panel.querySelector('[data-action="replay"]').textContent=c.replay+' →';panel.querySelector('[data-action="truth"]').textContent=c.truth+' →';
  for(const button of modes.children){button.textContent=c[button.dataset.mode];button.setAttribute('aria-pressed',String(button.dataset.mode===mode));}
  for(const node of panel.querySelectorAll('.understand-gauge span'))node.textContent=c[node.dataset.state];
  const value=state.source==='pitchside'?filmValue(state,mode,c,language):matchValue(state,mode,c,language);
  set('source',value.source);set('clock',value.clock);set('count',value.count);set('what',value.what);set('what-detail',value.whatDetail);set('why-title',value.whyTitle);set('why',value.why);set('next-title',value.nextTitle);set('next',value.next);set('concept',value.concept);set('definition',value.definition);set('limit',value.limit);set('status',value.status);set('storyline',value.ready?value.why:c.waitingWhy);
  panel.dataset.ready=String(value.ready);panel.dataset.mode=mode;
 }
 function filmValue(state,mode,c,language){
  const input={time:state.clipTime,language,mode,clipChallenge:state.clipChallenge},story=pitchsideStory(input),math=filmMath({time:state.clipTime,language,evidence:story.evidence}),guide=sceneGuide(state.clipTime,language),index=Math.max(0,FILM_SCENES.indexOf(math.scene)),englishKey=sceneKeys[index],key=language==='en'?englishKey:[guide.title,guide.lesson,guide.lesson],record=math.records.at(-1),ready=!!record,title=modeTitles[language][mode];
  const modeStory=mode==='math'?`${math.summary}${math.equation&&math.equation!==math.summary?' '+math.equation:''}`:pitchsideStory({...input,mode}).body;
  return {ready,source:c.sourceFilm,clock:story.clock,count:`${math.records.length} ${math.records.length===1?'SOURCE':'SOURCES'}`,what:ready?(record.title||story.title):c.waiting,whatDetail:ready?record.observation:guide.lesson,whyTitle:title,why:ready?modeStory:c.waitingWhy,nextTitle:key[0],next:guide.empty?c.waitingNext:key[2],concept:key[0],definition:key[1],limit:ready?math.scope:'No result is inferred before its reviewed timestamp.',status:ready?`Evidence through ${story.clock} · observations stay separate from interpretation.`:'Pre-play briefing · useful guidance without inventing an event.'};
 }
 function matchValue(state,mode,c,language){
  const base={...state,language,mode},story=matchStory(base),beginner=matchStory({...base,mode:'beginner'}),analyst=matchStory({...base,mode:'analyst'}),last=story.brief.state.seen.at(-1),ready=story.brief.state.seen.length>0,modeText=mode==='math'?`${story.body} ${story.equation}`:mode==='analyst'?analyst.body:beginner.body,concept=last?.type==='shot'?concepts[language].shot:last?.outcome==='intercepted'?concepts[language].recovery:concepts[language].pass,title=modeTitles[language][mode];
  const next=story.football?.question||story.brief.story?.short||c.waitingNext;
  return {ready,source:c.sourceMatch,clock:story.clock,count:`${story.evidence.length} RECORDS`,what:ready?story.title:c.waiting,whatDetail:ready?(story.analysis?.observation||story.stats):story.brief.story?.body||c.waitingNext,whyTitle:title,why:ready?modeText:c.waitingWhy,nextTitle:ready?modeTitles[language].test:modeTitles[language].habit,next,concept,definition:story.guideDefinition,limit:story.review.reason,status:`${story.clock} · ${story.revision} · synthetic evidence · ${story.review.decision.toUpperCase()}`};
 }
 matchSession.subscribe(render);render(matchSession.get());
}
