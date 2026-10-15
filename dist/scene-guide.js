import {FILM_SCENES} from './film-math.js';
import {PITCHSIDE_BEATS} from './pitchside-story.js';

// Preview questions are teaching prompts, never observations of a future action.
const subjects=[
 ['Who gets the next touch?','¿Quién llega al siguiente toque?','Quem chega ao próximo toque?'],
 ['What makes a passing option useful?','¿Qué hace útil una opción de pase?','O que torna útil uma opção de passe?'],
 ['Control or an escape?','¿Control o escapada?','Controle ou fuga?'],
 ['Delay or win the ball?','¿Frenar o ganar el balón?','Atrasar ou ganhar a bola?'],
 ['What does the touchline change?','¿Qué cambia la línea de banda?','O que muda com a linha lateral?'],
 ['When does a keeper have control?','¿Cuándo tiene el portero el control?','Quando o goleiro tem o controle?'],
 ['What can a gesture tell us?','¿Qué puede decirnos un gesto?','O que um gesto pode nos dizer?'],
 ['What happens after a reception?','¿Qué ocurre después de recibir?','O que acontece depois de receber?']
];
const lenses=[
 ['Follow the ball and the nearest feet. Being ahead of an opponent does not, by itself, establish possession.','Sigue el balón y los pies más cercanos. Estar delante del rival no establece por sí solo la posesión.','Siga a bola e os pés mais próximos. Estar à frente do adversário não estabelece a posse.'],
 ['Find the passer, a possible receiver and the defender between them. A passing option is different from a completed pass.','Localiza al pasador, un posible receptor y al defensor. Una opción de pase no es un pase completado.','Localize quem passa, um possível receptor e o defensor. Uma opção não é um passe completo.'],
 ['Compare the space after each touch. Keeping the ball close and getting beyond a defender are different outcomes.','Compara el espacio tras cada toque. Controlar de cerca y superar a un defensor son resultados distintos.','Compare o espaço após cada toque. Controle próximo e superar um defensor são resultados diferentes.'],
 ['A defender can slow an attack without making a tackle. Look for how the available space changes.','Un defensor puede frenar un ataque sin una entrada. Observa cómo cambia el espacio disponible.','Um defensor pode atrasar um ataque sem desarmar. Observe como muda o espaço disponível.'],
 ['The whole ball must cross the line to be out. A fall alone does not establish a foul.','El balón debe cruzar completamente la línea para salir. Una caída sola no demuestra una falta.','A bola precisa cruzar toda a linha para sair. Uma queda sozinha não comprova uma falta.'],
 ['Look for secure handling. A catch alone cannot identify the origin of the incoming ball.','Busca una sujeción segura. Una recepción sola no identifica el origen del balón.','Procure a posse segura com as mãos. Uma recepção sozinha não identifica a origem da bola.'],
 ['Distinguish a visible signal from a spoken instruction. A picture cannot supply words that were not recorded.','Distingue una señal visible de una instrucción hablada. Una imagen no aporta palabras no registradas.','Diferencie um sinal visível de uma instrução falada. Uma imagem não fornece palavras não registradas.'],
 ['The first touch can prepare the next action. A reception count is not a team pass-accuracy percentage.','El primer toque puede preparar la siguiente acción. Un recuento de recepciones no es la precisión del equipo.','O primeiro toque pode preparar a próxima ação. Contar recepções não mede a precisão da equipe.']
];
export function sceneGuide(time=0,language='en'){
 const i=Math.max(0,FILM_SCENES.findLastIndex(s=>s.start<=Math.max(0,Math.min(60,time)))),l=Math.max(0,['en','es','pt'].indexOf(language)),scene=FILM_SCENES[i],markers=PITCHSIDE_BEATS.filter(b=>b.shot===scene.id);
 return {scene,index:i,title:subjects[i][l],lesson:lenses[i][l],firstAt:markers[0]?.second??scene.start,markers:markers.map(b=>({id:b.id,at:b.second,reached:b.second<=time,title:b.second<=time?b.titles[l]:null})),empty:!markers.some(b=>b.second<=time)};
}
