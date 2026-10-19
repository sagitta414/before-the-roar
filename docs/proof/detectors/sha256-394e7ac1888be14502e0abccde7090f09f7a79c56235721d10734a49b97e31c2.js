// Pixel-only detection and temporal event inference. No scenario/action/ground-truth import.
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function worldToPixel(p,cal){const c=cal.camera;return c?{x:c.center+(p.x/105-.5)*(c.farWidth+(c.nearWidth-c.farWidth)*p.y/68),y:c.top+c.height*p.y/68}:{x:cal.pitch.x+p.x*cal.pitch.scaleX,y:cal.pitch.y+p.y*cal.pitch.scaleY};}
export function pixelToWorld(p,cal){const c=cal.camera;if(!c)return {x:(p.x-cal.pitch.x)/cal.pitch.scaleX,y:(p.y-cal.pitch.y)/cal.pitch.scaleY};const y=(p.y-c.top)/c.height*68;return {x:((p.x-c.center)/(c.farWidth+(c.nearWidth-c.farWidth)*y/68)+.5)*105,y};}
export function laneDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,q=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-q*dx,p.y-a.y-q*dy);}
export function passFeatures(a,b,defenders){return {distance:distance(a,b),pressure:defenders.length?Math.min(...defenders.map(p=>distance(p,b))):null,clearance:defenders.length?Math.min(...defenders.map(p=>laneDistance(p,a,b))):null};}
export function passEstimate(features,model){if(features.pressure===null||features.clearance===null)return null;const x=[1,features.distance/40,Math.min(10,features.pressure)/10,Math.min(8,features.clearance)/8],z=x.reduce((n,v,i)=>n+v*model.weights[i],0),completion=1/(1+Math.exp(-z));return {...features,completion,difficulty:Math.round(100*(1-completion)),label:completion>.8?'Routine':completion>.6?'Demanding':'High difficulty'};}
const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
function chroma(rgb){const low=Math.min(...rgb),high=Math.max(...rgb),range=high-low;return range<10?null:rgb.map(v=>(v-low)/range);}
export function createPixelDetector(cal){
 const colors=[...cal.roster.map(p=>p.color),cal.ballColor],references=colors.map(chroma),exactLookup=new Int8Array(32768).fill(-1),adaptiveLookup=new Int8Array(32768).fill(-1),exactCertainty=new Uint8Array(32768),adaptiveCertainty=new Uint8Array(32768);
 // Match either the enrolled RGB value or its chromatic signature. The latter
 // survives exposure/compression changes while still rejecting nearly-grey turf.
 for(let key=0;key<32768;key++){const rgb=[((key>>10)&31)*8+4,((key>>5)&31)*8+4,(key&31)*8+4],signature=chroma(rgb);let absBest=Infinity,absWhich=-1,adaptiveBest=Infinity,adaptiveWhich=-1;colors.forEach((c,i)=>{const absolute=c.reduce((n,v,k)=>n+(v-rgb[k])**2,0)/(38*38),relative=signature?references[i].reduce((n,v,k)=>n+(v-signature[k])**2,0)/.1:Infinity;if(absolute<absBest){absBest=absolute;absWhich=i;}const score=Math.min(absolute/3,relative);if(score<adaptiveBest){adaptiveBest=score;adaptiveWhich=i;}});if(absBest<=1){exactLookup[key]=absWhich;exactCertainty[key]=Math.round(255*clamp(1-absBest));}if(adaptiveBest<=1&&Math.max(...rgb)>34){adaptiveLookup[key]=adaptiveWhich;adaptiveCertainty[key]=Math.round(255*clamp(1-adaptiveBest));}}
 return function detect(data,width,height,{hideTracking=false,occludeBall=false}={}){
  const sums=colors.map(()=>({x:0,y:0,n:0,quality:0})),labels=new Int8Array(width*height).fill(-1),scores=new Uint8Array(width*height);let luminance=0,sampled=0;
  for(let p=0;p<labels.length;p+=64){const y=Math.floor(p/width);if(cal.camera&&y*cal.height/height<cal.camera.top-30)continue;const q=p*4;luminance+=(data[q]+data[q+1]+data[q+2])/3;sampled++;}const light=Math.round(luminance/(sampled||1)),adaptive=light<60,lookup=adaptive?adaptiveLookup:exactLookup,certainty=adaptive?adaptiveCertainty:exactCertainty;
  for(let p=0;p<labels.length;p++){const y=Math.floor(p/width);if(cal.camera&&y*cal.height/height<cal.camera.top-30)continue;const q=p*4,key=((data[q]>>3)<<10)|((data[q+1]>>3)<<5)|(data[q+2]>>3);labels[p]=lookup[key];scores[p]=certainty[key];}
  const stack=new Int32Array(width*height);
  for(let p=0;p<labels.length;p++){const cls=labels[p];if(cls<0)continue;let count=1,n=0,sx=0,sy=0,quality=0;stack[0]=p;labels[p]=-2;while(count){const q=stack[--count],x=q%width,y=Math.floor(q/width);n++;sx+=x;sy+=y;quality+=scores[q];for(const next of [x?q-1:-1,x<width-1?q+1:-1,y?q-width:-1,y<height-1?q+width:-1])if(next>=0&&labels[next]===cls){labels[next]=-2;stack[count++]=next;}}const average=quality/(n*255),world=pixelToWorld({x:(sx/n+.5)*cal.width/width,y:(sy/n+.5)*cal.height/height+(cls<cal.roster.length?cal.markerFootOffset:0)},cal),onPitch=world.x>=-2&&world.x<=107&&world.y>=-2&&world.y<=70,rank=n*(.2+.8*average)**3*(onPitch?1:.02),better=adaptive?n<=220&&rank>(sums[cls].rank||0):n>sums[cls].n;if(better)sums[cls]={x:sx,y:sy,n,quality:average,rank};}
  const point=(s,foot=0)=>pixelToWorld({x:(s.x/s.n+.5)*cal.width/width,y:(s.y/s.n+.5)*cal.height/height+foot},cal);
  const players=hideTracking?[]:cal.roster.flatMap((p,i)=>{const s=sums[i];return s.n>=4&&s.n<=220?[{...p,...point(s,cal.markerFootOffset),pixels:s.n,confidence:clamp(.5+s.quality*.45),identity:'enrolled colour marker'}]:[];});
  const s=sums.at(-1),ball=!occludeBall&&s.n>=3&&s.n<190?{...point(s),confidence:clamp(.45+s.quality*.5)}:null;
  const detectedRatio=players.length/cal.roster.length,frameConfidence=clamp((detectedRatio*.7)+(ball?.confidence||0)*.3);
  return {players,ball,diagnostics:{light,adaptive,detectedRatio,frameConfidence,lighting:light<48?'low':light<76?'dim':'normal',status:frameConfidence>=.8?'good':frameConfidence>=.5?'degraded':'insufficient'}};
 };
}
function velocity(points){if(points.length<3)return null;const t=points.reduce((n,p)=>n+p.t,0)/points.length,mx=points.reduce((n,p)=>n+p.x,0)/points.length,my=points.reduce((n,p)=>n+p.y,0)/points.length,den=points.reduce((n,p)=>n+(p.t-t)**2,0);if(den<.005)return null;return Math.hypot(points.reduce((n,p)=>n+(p.t-t)*(p.x-mx),0)/den,points.reduce((n,p)=>n+(p.t-t)*(p.y-my),0)/den)*3.6;}
export class VideoTracker{
 constructor(cal,model){this.cal=cal;this.model=model;this.reset();}
 reset(){this.last=null;this.lastBall=null;this.lastBallAt=null;this.owner=null;this.flight=null;this.events=[];this.tracks=new Map();this.candidate=null;this.candidateSince=0;this.status='Waiting for pixels';this.ballHistory=[];}
 update(frame,t){
  if(this.last&&(t<=this.last.t||t-this.last.t>.4)){this.reset();this.status='Tracking reset after seek or frame gap';}
  const previous=this.last;
  for(const p of frame.players){let track=this.tracks.get(p.id);if(!track){track={history:[],distance:0,speed:null};this.tracks.set(p.id,track);}const tail=track.history.at(-1);if(tail&&t-tail.t<.4){const d=distance(p,tail);if(d<3)track.distance+=d;}
   track.history.push({x:p.x,y:p.y,t});track.history=track.history.filter(q=>t-q.t<=1);track.speed=velocity(track.history);p.speed=track.speed;p.distance=track.distance;}
  if(!frame.ball){const brief=this.lastBallAt!==null&&t-this.lastBallAt<=.3;this.candidate=null;this.status=brief?'Ball briefly occluded · inference paused':'Ball lost · event inference withheld';if(!brief){this.owner=null;this.flight=null;this.ballHistory=[];}this.last={...frame,t};return this.snapshot(frame,t);}
  if(!frame.players.length){this.candidate=null;this.status='Player identities unavailable · pass attribution withheld';this.lastBall={...frame.ball};this.lastBallAt=t;this.last={...frame,t};return this.snapshot(frame,t);}
  if(this.lastBall&&t>this.lastBallAt&&distance(this.lastBall,frame.ball)/(t-this.lastBallAt)>45){this.owner=null;this.flight=null;this.ballHistory=[];this.candidate=null;this.status='Discontinuous ball position · no event inferred';this.lastBall={...frame.ball};this.lastBallAt=t;this.last={...frame,t};return this.snapshot(frame,t);}
  this.lastBall={...frame.ball};this.lastBallAt=t;
  this.ballHistory.push({...frame.ball,t});this.ballHistory=this.ballHistory.filter(q=>t-q.t<.5);
  const near=frame.players.map(p=>({p,d:distance(p,frame.ball)})).sort((a,b)=>a.d-b.d)[0],possession=near?.d<1.5?near.p:null;
  if(this.owner&&!this.flight&&distance(this.owner,frame.ball)>2){this.flight={from:this.owner,start:this.owner.t,origin:{x:this.owner.x,y:this.owner.y},defenders:this.owner.defenders,points:[{...frame.ball,t}],releaseRoster:this.owner.roster};}
  if(this.flight){this.flight.points.push({...frame.ball,t});if(t-this.flight.start>4)this.flight=null;}
  if(possession){
   if(this.candidate!==possession.id){this.candidate=possession.id;this.candidateSince=t;}
   if(t-this.candidateSince>=.15){
    if(this.flight&&this.flight.from.id!==possession.id){const f=this.flight,features=passFeatures(f.origin,possession,f.defenders),releaseTarget=f.releaseRoster.find(p=>p.id===possession.id),qualityFeatures=releaseTarget?passFeatures(f.origin,releaseTarget,f.defenders):null,confidence=clamp(.42+Math.min(.25,f.points.length*.025)+Math.min(.18,(t-this.candidateSince)*.6)+Math.min(.15,((f.from.confidence??.85)+(possession.confidence??.85))*.075)),confidenceLabel=confidence>=.84?'HIGH':confidence>=.68?'REVIEW':'LOW',event={id:'video-'+(this.events.length+1),type:f.from.team===possession.team?'pass':'interception',from:f.from.id,to:possession.id,start:f.start,end:t,distance:features.distance,speed:velocity(f.points),quality:qualityFeatures?passEstimate(qualityFeatures,this.model):null,confidence,confidenceLabel,evidence:{firstFrame:Math.round(f.start*this.cal.fps),lastFrame:Math.round(t*this.cal.fps)},status:'pixel-derived candidate'};this.events.push(event);this.flight=null;}
    this.owner={...possession,t,defenders:frame.players.filter(p=>p.team!==possession.team),roster:frame.players};this.status='Tracking from video pixels';
   }
  }else{this.candidate=null;if(this.flight&&frame.ball.x>103&&Math.abs(frame.ball.y-34)<4){const f=this.flight,speed=velocity(f.points);if(speed>35){const confidence=clamp(.5+Math.min(.3,f.points.length*.03)+(frame.ball.confidence??.8)*.15);this.events.push({id:'video-'+(this.events.length+1),type:'shot',from:f.from.id,to:null,start:f.start,end:t,distance:distance(f.origin,frame.ball),speed,quality:null,confidence,confidenceLabel:confidence>=.84?'HIGH':confidence>=.68?'REVIEW':'LOW',evidence:{firstFrame:Math.round(f.start*this.cal.fps),lastFrame:Math.round(t*this.cal.fps)},status:'shot candidate · ground-plane model; outcome not certified'});}this.flight=null;this.owner=null;}}
  this.last={...frame,t};return this.snapshot(frame,t);
 }
 snapshot(frame,t){return {...frame,t,events:this.events,ballSpeed:velocity(this.ballHistory),status:this.status,detectorHealth:frame.diagnostics||{frameConfidence:frame.players.length&&frame.ball?1:0,status:frame.players.length&&frame.ball?'good':'insufficient'}};}
}
