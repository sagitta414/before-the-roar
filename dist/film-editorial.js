// Scene-specific public editorial briefs. These teach a concept without inventing pixel measurements.
const scenes={
 '00-duel':[
  ['Can you keep the ball in view while following the attacker?','¿Puedes seguir al atacante sin perder de vista el balón?','Você consegue seguir o atacante sem perder a bola de vista?'],
  ['Running ahead proves the duel was won.','Correr por delante demuestra que ganó el duelo.','Correr à frente prova que venceu o duelo.'],
  ['Position alone does not settle possession. Check the next visible touch before awarding a won duel.','La posición no determina la posesión. Revisa el siguiente toque visible antes de declarar ganado el duelo.','A posição não determina a posse. Confira o próximo toque visível antes de declarar o duelo vencido.'],
  ['Access to the next touch is the useful sign of control. A lead in the camera frame alone does not settle the duel.','El acceso al siguiente toque indica control. Ir delante en el encuadre no resuelve el duelo.','O acesso ao próximo toque indica controle. Estar à frente no quadro não resolve o duelo.'],
  ['Replay the ball beside the attacker’s feet.','Repite el balón junto a los pies del atacante.','Reveja a bola junto aos pés do atacante.']
 ],
 '01-pass':[
  ['Where could the receiver play next if the defender closes in?','¿Dónde podría jugar el receptor si se acerca el defensor?','Para onde o receptor poderia jogar se o defensor se aproximar?'],
  ['A completed pass proves the defence was broken.','Un pase completo demuestra que se rompió la defensa.','Um passe completo prova que a defesa foi superada.'],
  ['A reception verifies this connection. The wider defensive line is outside the shot, so a line break remains unverified.','La recepción verifica esta conexión. La línea defensiva queda fuera de cuadro; no se verifica una ruptura.','A recepção verifica esta conexão. A linha defensiva está fora do quadro; uma ruptura não está verificada.'],
  ['A short outlet is useful only if the receiver can use the next touch. Look for the exit, not just the completed pass.','Una salida corta sirve si el receptor puede usar el siguiente toque. Busca la salida además del pase completo.','Uma saída curta ajuda se o receptor puder usar o próximo toque. Procure a saída além do passe completo.'],
  ['Replay the receiver’s first touch.','Repite el primer toque del receptor.','Reveja o primeiro toque do receptor.']
 ],
 '02-turn':[
  ['Is the next touch within the attacker’s reach or the defender’s?','¿El siguiente toque queda al alcance del atacante o del defensor?','O próximo toque fica ao alcance do atacante ou do defensor?'],
  ['The attacker has escaped the defender.','El atacante ya escapó del defensor.','O atacante já escapou do defensor.'],
  ['The defender is still following. This shot does not establish a completed escape or the next possession.','El defensor sigue acompañando. La toma no confirma una escapada completa ni la siguiente posesión.','O defensor continua acompanhando. A tomada não confirma uma fuga completa nem a próxima posse.'],
  ['Close control can keep a challenge alive without creating an escape. Judge the room for the next action.','El control cercano puede mantener el duelo sin conseguir una escapada. Evalúa el espacio para la siguiente acción.','O controle próximo pode manter o duelo sem conseguir uma fuga. Avalie o espaço para a próxima ação.'],
  ['Replay the space between the touch and the defender.','Repite el espacio entre el toque y el defensor.','Reveja o espaço entre o toque e o defensor.']
 ],
 '03-defend':[
  ['Could staying alongside slow the attacker without a tackle?','¿Acompañar al atacante podría frenarlo sin una entrada?','Acompanhar o atacante poderia atrasá-lo sem um desarme?'],
  ['The defender won a tackle.','El defensor ganó una entrada.','O defensor venceu um desarme.'],
  ['The lateral adjustment is recorded; a tackle and a change of possession are not.','Se registra el ajuste lateral; no una entrada ni un cambio de posesión.','O ajuste lateral está registrado; um desarme e uma troca de posse não estão.'],
  ['Delaying an attacker is a different defensive job from winning the ball. This is a study of the former.','Retrasar al atacante es una tarea distinta de ganar el balón. Aquí estudiamos la primera.','Atrasar o atacante é diferente de ganhar a bola. Aqui estudamos a primeira tarefa.'],
  ['Replay the defender’s sideways steps.','Repite los pasos laterales del defensor.','Reveja os passos laterais do defensor.']
 ],
 '04-line':[
  ['Can you see the whole ball relative to the white boundary?','¿Ves el balón completo respecto a la línea blanca?','Você vê a bola inteira em relação à linha branca?'],
  ['The fall proves a foul.','La caída demuestra una falta.','A queda prova uma falta.'],
  ['A fall is visible, but the record contains no referee decision. Do not add a foul to the event log.','Vemos una caída, pero no hay decisión arbitral registrada. No añadas una falta al registro.','Vemos uma queda, mas não há decisão do árbitro registrada. Não acrescente uma falta aos eventos.'],
  ['Separate what the body does from what the referee decides. The replay can support the first without settling the second.','Separa el movimiento corporal de la decisión arbitral. El vídeo puede mostrar el primero sin resolver la segunda.','Separe o movimento do corpo da decisão do árbitro. O vídeo pode mostrar o primeiro sem resolver a segunda.'],
  ['Replay the ball and the white line together.','Repite el balón y la línea blanca juntos.','Reveja a bola e a linha branca juntas.']
 ],
 '05-keeper':[
  ['What changes when the goalkeeper has the ball in both hands?','¿Qué cambia cuando el portero tiene el balón entre las manos?','O que muda quando o goleiro segura a bola com as mãos?'],
  ['This catch is a save from the previous attack.','Esta recepción es una parada del ataque anterior.','Esta recepção é uma defesa do ataque anterior.'],
  ['The catch belongs to this scene. The incoming ball’s origin is not recorded; do not attach an earlier shot or a save statistic.','La recepción pertenece a esta escena. El origen del balón no está registrado; no vincules un tiro anterior ni una estadística de paradas.','A recepção pertence a esta cena. A origem da bola não está registrada; não vincule um chute anterior nem uma estatística de defesas.'],
  ['Secure possession is the useful ending here. A highlight does not need an invented shot to explain the goalkeeper’s action.','La posesión asegurada es el cierre útil. No hace falta inventar un disparo para explicar la acción del portero.','A posse assegurada é o desfecho útil. Não é preciso inventar um chute para explicar a ação do goleiro.'],
  ['Replay the gloves closing around the ball.','Repite los guantes cerrándose sobre el balón.','Reveja as luvas se fechando ao redor da bola.']
 ],
 '06-talk':[
  ['Which direction is the pointing hand indicating?','¿Qué dirección señala la mano?','Que direção a mão indica?'],
  ['The gesture confirms a tactical instruction.','El gesto confirma una instrucción táctica.','O gesto confirma uma instrução tática.'],
  ['The gesture is visible; its intended instruction is not recorded. The scene provides no verified speech.','El gesto es visible; su instrucción no está registrada. La escena no aporta palabras verificadas.','O gesto é visível; a instrução não está registrada. A cena não fornece fala verificada.'],
  ['Use the gesture as a question for the next camera angle, not as a quote from the player.','Usa el gesto para plantear una pregunta al siguiente ángulo, no como una cita del jugador.','Use o gesto como pergunta para o próximo ângulo, não como uma fala do jogador.'],
  ['Replay the pointing hand beside the teammate.','Repite la mano señalando junto al compañero.','Reveja a mão apontando ao lado do companheiro.']
 ]
};
scenes['07-blue']=scenes['01-pass'];
export function filmEditorial(packet,math){
 const l=Math.max(0,['en','es','pt'].indexOf(packet.language)),brief=scenes[math.scene.id];
 if(!math.records.length)return null;
 const required={'02-turn':'pitchside-carry','03-defend':'pitchside-mirror','04-line':'pitchside-balance','06-talk':'pitchside-gesture'}[math.scene.id];
 if(required&&!math.records.some(e=>e.id===required))return {guide:{summary:packet.guideDefinition+' '+['What would you need to see before judging the next action?','¿Qué necesitarías ver antes de juzgar la siguiente acción?','O que você precisaria ver antes de julgar a próxima ação?'][l]},reviewer:{summary:['The opening position is recorded. Wait for the next action before claiming a tackle, a foul or a tactical instruction.','La posición inicial está registrada. Espera la siguiente acción antes de afirmar una entrada, falta o instrucción táctica.','A posição inicial está registrada. Espere a próxima ação antes de afirmar um desarme, falta ou instrução tática.'][l],target_claim:brief[1][l]},presenter:{summary:['Treat the opening frame as a question, not a result. The next touch supplies the useful comparison.','Trata el encuadre inicial como pregunta, no como resultado. El siguiente toque permitirá comparar.','Trate o quadro inicial como pergunta, não como resultado. O próximo toque permitirá comparar.'][l],replay_cue:['Replay the opening positions in this scene.','Repite las posiciones iniciales de esta escena.','Reveja as posições iniciais desta cena.'][l]}};
 const atReception=math.receptions!==null,passScene=['01-pass','07-blue'].includes(math.scene.id);
 // Before a receiving marker, do not claim the pass has reached its target.
 const check=passScene&&!atReception?['A nearby receiver is an option, not a completed connection. Wait for the receiving touch.','Un receptor cercano es una opción, no una conexión completada. Espera el toque al recibir.','Um receptor próximo é uma opção, não uma conexão completa. Espere o toque ao receber.'][l]:brief[2][l];
 return {guide:{summary:packet.guideDefinition+' '+brief[0][l]},reviewer:{summary:check,target_claim:brief[1][l]},presenter:{summary:brief[3][l],replay_cue:brief[4][l]}};
}
