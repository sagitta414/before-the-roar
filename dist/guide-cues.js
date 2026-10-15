// The teaching role gives a definition and a viewing question, never a second play-by-play.
export function guideCue(packet){
 const l=['en','es','pt'].indexOf(packet.language),last=packet.evidence.filter(e=>e.record_type==='event'||e.record_type==='reviewed_frame').at(-1),kind=last?.type||last?.shot_id||'';
 const questions=/shot|keeper/.test(kind)?['Can you follow the ball all the way to the goalkeeper?','¿Puedes seguir el balón hasta el portero?','Você consegue acompanhar a bola até o goleiro?']:/pass|blue/.test(kind)?['Which foot does the receiver use to control the ball?','¿Con qué pie controla el balón quien recibe?','Com qual pé o jogador que recebe controla a bola?']:['Where is the defender looking as the ball moves?','¿Adónde mira el defensor cuando se mueve el balón?','Para onde o defensor olha quando a bola se move?'];
 return packet.guideDefinition+' '+questions[l];
}
