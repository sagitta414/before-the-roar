import {PLAYERS,events,metrics,position,distance} from './engine.js';
export function matchCenterSnapshot(s,time,corrected=false){
 const t=Math.max(0,Math.min(s.duration,Number(time)||0)),seen=events(s).filter(e=>e.end<=t);
 return {time:t,seen,metrics:metrics(s,t,corrected),players:PLAYERS.map(p=>({...p,number:p.number||p.id,position:position(s,p.id,t,corrected),displacement:distance(position(s,p.id,0,corrected),position(s,p.id,t,corrected)),passes:seen.filter(e=>e.type==='pass'&&e.from===p.id).length,completed:seen.filter(e=>e.type==='pass'&&e.from===p.id&&e.outcome==='complete').length,involvements:seen.filter(e=>e.from===p.id||e.to===p.id||e.interceptor===p.id).length}))};
}
export function truthReport(s,time,reveal=false){
 const reading=matchCenterSnapshot(s,time),reference=matchCenterSnapshot(s,time,reveal),last=reading.seen.filter(e=>e.type==='pass').at(-1);
 const movement=s.id==='wide'&&reading.time>=16;
 const rows=[
 {id:'passes',claim:'Completed Harbor passes',reading:String(reading.metrics.completed),reference:String(reference.metrics.completed),status:'supported',source:reading.seen.filter(e=>e.type==='pass'&&e.team==='harbor').map(e=>e.id)},
 {id:'speed',claim:'Latest pass speed',reading:last?.speed!=null?last.speed.toFixed(1)+' km/h':'Awaiting pass',reference:last?.speed!=null?(last.distance/(last.end-last.t)*3.6).toFixed(1)+' km/h':'Awaiting pass',status:last?.speed!=null?'supported':'pending',source:last?[last.id]:[]},
 {id:'goals',claim:'Goals in this sequence',reading:String(reading.metrics.goals),reference:String(reference.metrics.goals),status:'supported',source:reading.seen.filter(e=>e.type==='shot').map(e=>e.id)},
 {id:'movement',claim:'Defender shifted laterally',reading:movement?reading.metrics.lateral.toFixed(1)+' m':'Not asserted',reference:movement?reference.metrics.lateral.toFixed(1)+' m':'Not assessed',status:!movement?'pending':reveal?'withdrawn':'supported',source:movement?[`wide-track-102-${Math.floor(reading.time*25)}`]:[]}
 ];
 return {reading,reference,rows,checked:rows.filter(r=>r.status!=='pending').length,supported:rows.filter(r=>r.status==='supported').length,withdrawn:rows.filter(r=>r.status==='withdrawn').length,correctionAvailable:s.id==='wide',revealed:reveal&&s.id==='wide'};
}
