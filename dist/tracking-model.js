// Pixel-only detection and temporal event inference. No scenario/action/ground-truth import.
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function laneDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,q=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-q*dx,p.y-a.y-q*dy);}
export function passFeatures(a,b,defenders){return {distance:distance(a,b),pressure:defenders.length?Math.min(...defenders.map(p=>distance(p,b))):null,clearance:defenders.length?Math.min(...defenders.map(p=>laneDistance(p,a,b))):null};}
export function passEstimate(features,model){if(features.pressure===null||features.clearance===null)return null;const x=[1,features.distance/40,Math.min(10,features.pressure)/10,Math.min(8,features.clearance)/8],z=x.reduce((n,v,i)=>n+v*model.weights[i],0),completion=1/(1+Math.exp(-z));return {...features,completion,difficulty:Math.round(100*(1-completion)),label:completion>.8?'Routine':completion>.6?'Demanding':'High difficulty'};}
export function createPixelDetector(cal){
 const colors=[...cal.roster.map(p=>p.color),cal.ballColor],lookup=new Int8Array(32768).fill(-1);
 for(let key=0;key<32768;key++){const rgb=[((key>>10)&31)*8+4,((key>>5)&31)*8+4,(key&31)*8+4];let best=38*38,which=-1;colors.forEach((c,i)=>{const d=c.reduce((n,v,k)=>n+(v-rgb[k])**2,0);if(d<best){best=d;which=i;}});lookup[key]=which;}
 return function detect(data,width,height,{hideTracking=false,occludeBall=false}={}){
  const sums=colors.map(()=>({x:0,y:0,n:0})),labels=new Int8Array(width*height).fill(-1);
  for(let p=0;p<labels.length;p++){const q=p*4;labels[p]=lookup[((data[q]>>3)<<10)|((data[q+1]>>3)<<5)|(data[q+2]>>3)];}
  const stack=new Int32Array(width*height);
  for(let p=0;p<labels.length;p++){const cls=labels[p];if(cls<0)continue;let count=1,n=0,sx=0,sy=0;stack[0]=p;labels[p]=-2;while(count){const q=stack[--count],x=q%width,y=Math.floor(q/width);n++;sx+=x;sy+=y;for(const next of [x? q-1:-1,x<width-1?q+1:-1,y?q-width:-1,y<height-1?q+width:-1])if(next>=0&&labels[next]===cls){labels[next]=-2;stack[count++]=next;}}if(n>sums[cls].n)sums[cls]={x:sx,y:sy,n};}
  const point=(s,foot=0)=>({x:((s.x/s.n+.5)*cal.width/width-cal.pitch.x)/cal.pitch.scaleX,y:((s.y/s.n+.5)*cal.height/height+foot-cal.pitch.y)/cal.pitch.scaleY});
  const players=hideTracking?[]:cal.roster.flatMap((p,i)=>{const s=sums[i];return s.n>=4&&s.n<=180?[{...p,...point(s,cal.markerFootOffset),pixels:s.n,identity:'enrolled colour marker'}]:[];});
  const s=sums.at(-1),ball=!occludeBall&&s.n>=3&&s.n<160?point(s):null;return {players,ball};
 };
}
function velocity(points){if(points.length<3)return null;const t=points.reduce((n,p)=>n+p.t,0)/points.length,mx=points.reduce((n,p)=>n+p.x,0)/points.length,my=points.reduce((n,p)=>n+p.y,0)/points.length,den=points.reduce((n,p)=>n+(p.t-t)**2,0);if(den<.005)return null;return Math.hypot(points.reduce((n,p)=>n+(p.t-t)*(p.x-mx),0)/den,points.reduce((n,p)=>n+(p.t-t)*(p.y-my),0)/den)*3.6;}
export class VideoTracker{
 constructor(cal,model){this.cal=cal;this.model=model;this.reset();}
 reset(){this.last=null;this.owner=null;this.flight=null;this.events=[];this.tracks=new Map();this.candidate=null;this.candidateSince=0;this.status='Waiting for pixels';this.ballHistory=[];}
 update(frame,t){
  if(this.last&&(t<=this.last.t||t-this.last.t>.4)){this.reset();this.status='Tracking reset after seek or frame gap';}
  const previous=this.last;
  for(const p of frame.players){let track=this.tracks.get(p.id);if(!track){track={history:[],distance:0,speed:null};this.tracks.set(p.id,track);}const tail=track.history.at(-1);if(tail&&t-tail.t<.4){const d=distance(p,tail);if(d<3)track.distance+=d;}
   track.history.push({x:p.x,y:p.y,t});track.history=track.history.filter(q=>t-q.t<=1);track.speed=velocity(track.history);p.speed=track.speed;p.distance=track.distance;}
  if(!frame.ball||!frame.players.length){this.owner=null;this.flight=null;this.ballHistory=[];this.candidate=null;this.status=!frame.ball?'Ball lost · event inference withheld':'Player identities unavailable · pass attribution withheld';this.last={...frame,t};return this.snapshot(frame,t);}
  if(previous?.ball&&distance(previous.ball,frame.ball)/(t-previous.t)>45){this.owner=null;this.flight=null;this.ballHistory=[];this.candidate=null;this.status='Discontinuous ball position · no event inferred';this.last={...frame,t};return this.snapshot(frame,t);}
  this.ballHistory.push({...frame.ball,t});this.ballHistory=this.ballHistory.filter(q=>t-q.t<.5);
  const near=frame.players.map(p=>({p,d:distance(p,frame.ball)})).sort((a,b)=>a.d-b.d)[0],possession=near?.d<1.5?near.p:null;
  if(this.owner&&!this.flight&&distance(this.owner,frame.ball)>2){this.flight={from:this.owner,start:this.owner.t,origin:{x:this.owner.x,y:this.owner.y},defenders:this.owner.defenders,points:[{...frame.ball,t}],releaseRoster:this.owner.roster};}
  if(this.flight){this.flight.points.push({...frame.ball,t});if(t-this.flight.start>4)this.flight=null;}
  if(possession){
   if(this.candidate!==possession.id){this.candidate=possession.id;this.candidateSince=t;}
   if(t-this.candidateSince>=.15){
    if(this.flight&&this.flight.from.id!==possession.id){const f=this.flight,features=passFeatures(f.origin,possession,f.defenders),releaseTarget=f.releaseRoster.find(p=>p.id===possession.id),qualityFeatures=releaseTarget?passFeatures(f.origin,releaseTarget,f.defenders):null,event={id:'video-'+(this.events.length+1),type:f.from.team===possession.team?'pass':'interception',from:f.from.id,to:possession.id,start:f.start,end:t,distance:features.distance,speed:velocity(f.points),quality:qualityFeatures?passEstimate(qualityFeatures,this.model):null,evidence:{firstFrame:Math.round(f.start*this.cal.fps),lastFrame:Math.round(t*this.cal.fps)},status:'pixel-derived candidate'};this.events.push(event);this.flight=null;}
    this.owner={...possession,t,defenders:frame.players.filter(p=>p.team!==possession.team),roster:frame.players};this.status='Tracking from video pixels';
   }
  }else{this.candidate=null;if(this.flight&&frame.ball.x>103&&Math.abs(frame.ball.y-34)<4){const f=this.flight,speed=velocity(f.points);if(speed>35){this.events.push({id:'video-'+(this.events.length+1),type:'shot',from:f.from.id,to:null,start:f.start,end:t,distance:distance(f.origin,frame.ball),speed,quality:null,evidence:{firstFrame:Math.round(f.start*this.cal.fps),lastFrame:Math.round(t*this.cal.fps)},status:'shot candidate · ground-plane model; outcome not certified'});}this.flight=null;this.owner=null;}}
  this.last={...frame,t};return this.snapshot(frame,t);
 }
 snapshot(frame,t){return {...frame,t,events:this.events,ballSpeed:velocity(this.ballHistory),status:this.status};}
}
