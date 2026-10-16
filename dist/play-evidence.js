import {SCENARIOS,PLAYERS,events,position,distance} from './engine.js';
export function playEvidence(input={}){
 const s=SCENARIOS.find(s=>s.id===input.scenario)||SCENARIOS[0],time=Math.max(0,Math.min(s.duration,Number(input.time)||0));
 const corrected=!!input.corrected&&s.id==='wide',tracking=input.tracking!==false;
 const seen=events(s).filter(e=>e.end<=time),passes=seen.filter(e=>e.type==='pass'),last=passes.find(e=>e.id===input.eventId)||passes.at(-1);
 const off=PLAYERS.filter(p=>s.tracks[p.id]&&!seen.some(e=>[e.from,e.to,e.interceptor].includes(p.id))).map(p=>({...p,metres:distance(position(s,p.id,0,corrected),position(s,p.id,time,corrected))})).sort((a,b)=>b.metres-a.metres)[0];
 const shifted=Math.abs(position(s,102,time,corrected)[1]-position(s,102,0,corrected)[1]);
 const movement=!tracking?'Tracking unavailable: no movement claim can be supported.':s.id==='wide'?corrected&&time>0?'Laurent stays at his starting position. The earlier movement claim is withdrawn.':`Laurent shifts ${shifted.toFixed(1)} m laterally from his starting position.`:off?`${off.name} is ${off.metres.toFixed(1)} m from their starting position.`:'No off-ball movement identified yet.';
 const facts={passes:passes.length,complete:passes.filter(e=>e.outcome==='complete').length,goals:seen.filter(e=>e.outcome==='goal').length,ids:seen.map(e=>e.id)};
 const names=id=>PLAYERS.find(p=>p.id===id)?.name||'Unknown player';
 return {s,time,corrected,tracking,seen,last,off:tracking?off:null,facts,movement,
 pass:last?`${names(last.from)} → ${names(last.interceptor||last.to)}: ${last.distance.toFixed(1)} m in ${(last.end-last.t).toFixed(1)} s (${last.speed.toFixed(1)} km/h). ${last.outcome}.`:'No completed pass is available at this point.',
 source:`${s.id} · ${time.toFixed(1)} s · ${corrected?'corrected':'original'} tracking`,
 trail:id=>tracking?Array.from({length:Math.floor(time)+1},(_,t)=>position(s,id,t,corrected)).concat([position(s,id,time,corrected)]):[],
 perspectives:[{club:'Harbor FC',angle:`Our route forward: Harbor have completed ${passes.filter(e=>e.team==='harbor'&&e.outcome==='complete').length} of ${passes.filter(e=>e.team==='harbor').length} recorded passes. ${tracking&&off&&off.team==='harbor'?`${off.name} also moves ${off.metres.toFixed(1)} m from their start without a recorded ball involvement.`:'We need tracking to assess movement beyond those passes.'}`,facts},{club:'Northbridge',angle:`Our defensive view: Harbor have completed ${passes.filter(e=>e.team==='harbor'&&e.outcome==='complete').length} passes against us in this window. ${s.id==='wide'?movement:'Pass outcomes alone do not establish that our pressure caused a mistake.'} That is the evidence to review before assigning blame.`,facts}]};
}
