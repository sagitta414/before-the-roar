import {passEstimate,passFeatures} from './tracking-model.js';

const finitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const round=n=>Math.round(n*10)/10;

// This compares enrolled positions in the last observed possession frame before
// release. It does not predict the outcome of a pass that was never played.
export function comparePassOptions(event,flight,model,{limit=2}={}){
 if(event?.type!=='pass'||!flight||event.from!==flight.from?.id||Math.abs(event.start-flight.start)>.25||!finitePoint(flight.origin))return null;
 const roster=Array.isArray(flight.releaseRoster)?flight.releaseRoster:[];
 const defenders=(Array.isArray(flight.defenders)?flight.defenders:[]).filter(p=>finitePoint(p)&&p.confidence!==0);
 const receiver=roster.find(p=>p.id===event.to&&p.team===flight.from.team&&finitePoint(p));
 if(!receiver||!defenders.length||!model?.weights)return null;
 const direction=flight.from.team==='north'?-1:1;
 const make=(p,observed)=>{
  const features=passFeatures(flight.origin,p,defenders),estimate=passEstimate(features,model);
  if(!estimate)return null;
  return {id:p.id,name:p.name||`Player ${p.id}`,observed,point:{x:p.x,y:p.y},distance:round(features.distance),clearance:round(features.clearance),pressure:round(features.pressure),progress:round(direction*(p.x-flight.origin.x)),difficulty:estimate.difficulty};
 };
 const actual=make(receiver,true);
 if(!actual)return null;
 const alternatives=roster.filter(p=>p.id!==event.from&&p.id!==event.to&&p.team===flight.from.team&&finitePoint(p)&&(p.confidence??1)>=.5)
  .map(p=>make(p,false)).filter(Boolean).filter(p=>p.distance>=3)
  .sort((a,b)=>b.progress-a.progress||b.clearance-a.clearance||a.id-b.id).slice(0,limit);
 if(!alternatives.length)return null;
 return {eventId:event.id,sourceFrames:event.evidence,sourceTime:event.start,origin:{x:flight.origin.x,y:flight.origin.y},actual,alternatives,
  limitation:'Alternatives are unplayed routes from enrolled synthetic positions at release. Difficulty is a synthetic model estimate; neither completion nor player intent is known.'};
}
