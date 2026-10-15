// Entirely generated football. Seeded, reproducible, and independent of the featured film.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const round=n=>Math.round(n*10)/10;
export const CLUBS={home:'Harbor FC',away:'Northbridge'};
export const NAMES={home:['Eli Ward','Noah Ellis','Leo Martin','Oscar Reed','Finn Clarke','Amir Cole','Luca Moreau','Mateo Silva','Theo Brooks','Rafael Costa','Isaac Hart'],away:['Max Berg','Jules Laurent','Ben Shaw','Alex Ross','Milan Voss','Samir Ali','Hugo Bell','Arlo King','Adam Price','Nico Stone','Tom Avery']};
export function generateMatch(seed=7){
 if(!Number.isInteger(seed)||seed<1||seed>1000000)throw Error('Seed must be 1–1000000');
 let x=seed>>>0;const rand=()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
 const list=[];let time=0,team='home',ball=[52.5,34],holder=6,half=1,pressureUntil=-1;
 const opponent=t=>t==='home'?'away':'home';
 const emit=(type,extra={},dt=0)=>{time+=dt;list.push({id:`s${seed}-${String(list.length+1).padStart(4,'0')}`,seq:list.length+1,second:round(time),period:half,type,team,player:holder,synthetic:true,...extra});};
 const direction=()=> (team==='home'?1:-1)*(half===1?1:-1);
 emit('kickoff',{to:ball});
 for(half=1;half<=2;half++){
 const end=half*2700;
 if(half===2){time=2700;emit('halftime');time=2701;team='away';holder=6;ball=[52.5,34];emit('kickoff',{to:ball});}
 while(time<end-100){
  const attack=direction(),build=3+Math.floor(rand()*7);
  for(let p=0;p<build&&time<end-100;p++){
   if(rand()<.13){emit('pressure',{against:team,team:opponent(team),player:6+Math.floor(rand()*5),zone:ball[0]>70?'right third':ball[0]<35?'left third':'midfield'},1+rand()*2);pressureUntil=time+10;}
   const target=[round(clamp(ball[0]+attack*(rand()*22-5),4,101)),round(clamp(ball[1]+rand()*30-15,3,65))];
   const distance=round(Math.hypot(target[0]-ball[0],target[1]-ball[1])),duration=Math.round(Math.max(.1,distance/((30+rand()*45)/3.6))*1000)/1000,speed=round(distance/duration*3.6),underPressure=time<=pressureUntil;
   let recipient=2+Math.floor(rand()*10);if(recipient===holder)recipient=recipient===11?2:recipient+1;const complete=rand()<(distance>28?.72:.9)-(underPressure?.06:0);
   emit('pass',{from:ball,to:target,recipient,complete,distance_m:distance,ball_speed_kmh:speed,travel_seconds:duration,under_pressure:underPressure,difficulty_index:round(clamp(distance/40+(underPressure?.2:0),0,1)),difficulty_method:'Illustrative index: min(1, distance_m / 40 + 0.2 if under pressure). Not a calibrated probability.'},duration+4+rand()*6);
   ball=target;if(complete)holder=recipient;else {team=opponent(team);holder=2+Math.floor(rand()*10);emit('recovery',{from:ball,to:ball,reason:'interception'},.5);break;}
  }
  const attacking=direction()===1?ball[0]>65:ball[0]<40;
  if(attacking&&rand()<.3){
   const toward=direction(),shotFrom=[round(toward===1?82+rand()*16:7+rand()*16),round(20+rand()*28)],carrySeconds=Math.round((Math.hypot(shotFrom[0]-ball[0],shotFrom[1]-ball[1])/(3+rand()*3)+.1)*1000)/1000;
   emit('carry',{from:ball,to:shotFrom,travel_seconds:carrySeconds},carrySeconds);ball=shotFrom;
   const chance=rand(),outcome=chance<.14?'goal':chance<.58?'saved':'off_target';
   emit('shot',{from:shotFrom,to:[toward===1?105:0,outcome==='off_target'?round(rand()<.5?26:42):34],outcome,ball_speed_kmh:round(65+rand()*45)},2+rand()*3);
   team=opponent(team);holder=outcome==='goal'?6:1;ball=outcome==='goal'?[52.5,34]:[direction()===1?9:96,34];emit('restart',{reason:outcome,from:ball,to:ball},20+rand()*20);
  }else{
   const old=team;team=opponent(team);holder=6;emit('recovery',{from:ball,to:ball,reason:rand()<.5?'tackle':'loose_ball',previous_team:old},5+rand()*7);
  }
 }}
 list.push({id:`s${seed}-fulltime`,seq:list.length+1,second:5400,type:'fulltime',team,player:holder,synthetic:true});
 return {id:`btr-synthetic-v2-${seed}`,seed,duration:5400,clubs:CLUBS,players:NAMES,events:list,provenance:'Seeded football simulation v2. Continuous ball origins between restarts, two periods and declared physical constraints. No real Premier League data or video-derived tracking. Design targets are illustrative, not league-calibrated.'};
}
export function initialState(){return {second:0,count:0,lastSeq:0,ids:new Set(),events:[],score:{home:0,away:0},passes:{home:0,away:0},completed:{home:0,away:0},shots:{home:0,away:0},pressures:{home:0,away:0},regains:{home:0,away:0},possessionSeconds:{home:0,away:0},possessionTeam:'home',focus:{passes:0,completed:0,shots:0,pressures:0},lastBall:[52.5,34]};}
export function ingest(state,event){
 if(!event.synthetic||!['home','away'].includes(event.team)||!Number.isFinite(event.second)||event.second<0||event.second>5400)throw Error('Invalid synthetic event');
 if(state.ids.has(event.id))return false;
 if(event.seq<=state.lastSeq||event.second<state.second)throw Error('Out-of-order event');
 state.possessionSeconds[state.possessionTeam]+=event.second-state.second;
 state.second=event.second;state.ids.add(event.id);state.lastSeq=event.seq;state.count++;state.events.push(event);
 const t=event.team;if(event.type!=='pressure')state.possessionTeam=t;
 if(event.to)state.lastBall=event.to;
 if(event.type==='pass'){state.passes[t]++;if(event.complete)state.completed[t]++;}
 if(event.type==='shot'){state.shots[t]++;if(event.outcome==='goal')state.score[t]++;}
 if(event.type==='pressure')state.pressures[t]++;
 if(event.type==='recovery')state.regains[t]++;
 if(t==='home'&&event.player===8){if(event.type==='pass'){state.focus.passes++;if(event.complete)state.focus.completed++;}if(event.type==='shot')state.focus.shots++;if(event.type==='pressure')state.focus.pressures++;}
 return true;
}
export function snapshot(state,second=state.second){
 const elapsed=clamp(second,state.second,5400),pos={...state.possessionSeconds};pos[state.possessionTeam]+=elapsed-state.second;
 const recent=state.events.filter(e=>e.second>elapsed-300),recoveries=recent.filter(e=>e.type==='recovery').length;
 return {second:elapsed,events:state.count,score:{...state.score},passes:{...state.passes},completed:{...state.completed},shots:{...state.shots},pressures:{...state.pressures},regains:{...state.regains},possession:{home:elapsed?Math.round(pos.home/elapsed*100):50,away:elapsed?100-Math.round(pos.home/elapsed*100):50},completion:{home:state.passes.home?Math.round(state.completed.home/state.passes.home*100):0,away:state.passes.away?Math.round(state.completed.away/state.passes.away*100):0},rhythm:recoveries>=6?'transition-heavy':recoveries>=3?'contested':'controlled',recentRecoveries:recoveries,ball:state.lastBall,focus:{...state.focus}};
}
export function evidencePacket(match,state,second,language='en'){
 if(second<state.second)throw Error('Evidence cannot include future events');
 const stats=snapshot(state,second),names={home:CLUBS.home,away:CLUBS.away};
 const recent=state.events.filter(e=>e.type==='shot'||e.type==='recovery'||e.type==='pressure').slice(-10);
 const key=[...new Map([...state.events.filter(e=>e.outcome==='goal'),...recent].map(e=>[e.id,e])).values()];
 const facts=key.map(e=>({id:e.id,second:e.second,type:e.type,team:names[e.team],player:NAMES[e.team][e.player-1],outcome:e.outcome??e.reason??null}));
 const add=(id,value,description)=>facts.push({id,value,description});
 add('score',stats.score,'Confirmed synthetic score at this cutoff.');add('passes',stats.passes,'Attempted passes.');add('completion',stats.completion,'Completed pass percentage; zero attempts means no percentage evidence.');add('shots',stats.shots,'Shots attempted.');add('possession',stats.possession,'Share of elapsed event-possession time, not tracking possession.');add('pressure',stats.pressures,'Generated pressure events.');add('rhythm',stats.rhythm,`Heuristic: ${stats.recentRecoveries} recoveries during the last five minutes. Not a calibrated model.`);add('focus',stats.focus,'Mateo Silva: recorded on-ball contributions; cannot infer off-ball performance.');
 return {schema:'btr.evidence.v1',match_id:match.id,synthetic:true,cutoff:second,phase:second===5400?'fulltime':'in_play',language,clubs:CLUBS,focus_player:'Mateo Silva',facts,limits:['Only supplied evidence is known.','Synthetic event simulation, not video analysis.','Pressure before recovery does not prove causation.','No xG, biometric, off-ball tracking or pass-difficulty measurements.'],stats};
}
