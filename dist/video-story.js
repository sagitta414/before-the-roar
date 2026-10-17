// Public explanations derived only from observed video events. No model or hidden timetable.
export function videoStory(snapshot,roster,{challenge=false}={}){
 const e=snapshot?.events?.at(-1);if(!e)return [];
 const name=id=>roster.find(p=>p.id===id)?.name||'Unidentified player',n=x=>Number.isFinite(x)?x.toFixed(1):'unavailable';
 const lost=!snapshot.ball||!snapshot.players?.length,shot=e.type==='shot';
 const source=`${e.id} · frames ${e.evidence.firstFrame}–${e.evidence.lastFrame} · observed by ${e.end.toFixed(1)} s`;
 return [
 {role:'Scout',job:'Observation',text:lost?'Current tracking is unavailable. The earlier event remains recorded; I cannot extend it into a new claim.':shot?`${name(e.from)} sent the ball toward the goal mouth. The detector marks a shot candidate, not a confirmed goal.`:`${name(e.from)} transferred the ball to ${name(e.to)}. The completion is supported by the receiving player’s sustained proximity to the ball.`},
 {role:'Guide',job:'New to football',text:shot?'A shot is an attempt toward goal. Its speed does not tell us whether it beat the goalkeeper.':challenge?'A completed pass tells you who received the ball. It does not prove the defenders were fooled or that the next attack will succeed.':'A passing lane is the route between teammates. A defender near that route may make the pass harder; watch the space between passer and receiver.'},
 {role:'Vector',job:'Calculation',text:shot?`The fitted ground-plane speed is ${n(e.speed)} km/h over an observed ${n(e.distance)} m. Height is not measured.`:e.quality?`At release: ${n(e.quality.distance)} m to the receiver; ${n(e.quality.clearance)} m nearest lane clearance. Synthetic-model difficulty: ${e.quality.difficulty}/100. This is a model estimate, not observed success probability.`:'Defender evidence is insufficient for a difficulty estimate.'},
 {role:'Check',job:'Challenge',text:challenge?'We can retain the recorded event and its frame references. We must withhold intention, tactical causation and any result beyond the observed frames.':`This uses enrolled kit markers and a fixed camera. ${lost?'Live evidence has been lost.':'Occlusion or changed lighting can break detection.'} A plausible narrative is not additional evidence.`},
 {role:'Host',job:'Synthesis',text:shot?'The moment creates a question: what happened at the goal line? That requires further evidence.':challenge?'The useful conclusion is narrower: the ball reached a teammate. Evaluate the next action before calling this an advantage.':`The ball reached ${name(e.to)}. The next useful question is whether that player can progress play; this transfer alone does not answer it.`}
 ].map(p=>({...p,source,engine:'source-rendered explanation'}));
}
