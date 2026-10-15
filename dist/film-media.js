import {FILM_SCENES} from './film-math.js';

// Small static files keep scene playback independent of Azure cold starts.
// Evidence and UI always use the global film clock, never the file-local clock.
export function mediaPlan({source='pitchside',scenario='wide',clipTime=0,time=0,studyScene=true}={}){
 if(source==='match')return {src:`assets/${scenario}-film.mp4`,poster:`assets/${scenario}-poster.jpg`,offset:0,duration:36,time};
 const i=Math.max(0,FILM_SCENES.findLastIndex(s=>s.start<=Math.max(0,Math.min(60,clipTime)))),scene=FILM_SCENES[i];
 return {src:studyScene?`assets/pitchside-scene-${i}.mp4`:'assets/pitchside-stream.mp4',poster:`assets/vision/frame-${String(Math.floor(scene.start)).padStart(2,'0')}.jpg`,offset:studyScene?scene.start:0,duration:studyScene?scene.end-scene.start:60,time:clipTime};
}
export const localMediaTime=(plan,time)=>Math.max(0,Math.min(plan.duration,time-plan.offset));
export const globalMediaTime=(plan,time)=>plan.offset+Math.max(0,Math.min(plan.duration,time));

export function bindMedia(video,onStatus=()=>{}){
 let plan=null,pending=0,generation=0,cancelWait=null;
 const status=(value)=>onStatus(value);
 const cancel=()=>{generation++;cancelWait?.();cancelWait=null;};
 const ready=()=>{if(plan&&video.readyState>=2&&!video.seeking)status('ready');};
 video.addEventListener('loadedmetadata',()=>{if(plan)video.currentTime=localMediaTime(plan,pending);});
 for(const event of ['loadeddata','canplay','seeked','playing'])video.addEventListener(event,ready);
 video.addEventListener('waiting',()=>{if(plan)status('buffering');});
 video.addEventListener('error',()=>{if(plan)status('error');});
 function sync(next,time=next.time){
  const moved=Math.abs(pending-time)>.15;pending=time;
  if(plan?.src!==next.src){cancel();video.pause();plan=next;video.preload='auto';video.poster=next.poster;status('loading');video.src=next.src;video.load();return;}
  if(moved){cancel();video.pause();}
  plan=next;const local=localMediaTime(plan,time);
  if(video.readyState>=1&&Math.abs(video.currentTime-local)>.15){cancel();video.pause();video.currentTime=local;}
 }
 async function play(){
  if(!plan)return false;
  const request=++generation;
  cancelWait?.();cancelWait=null;
  if(video.readyState<2){
   status('loading');
   const ok=await new Promise(resolve=>{
    let timer;const readyEvents=['loadeddata','canplay','seeked'];const finish=value=>{clearTimeout(timer);for(const event of readyEvents)video.removeEventListener(event,loaded);video.removeEventListener('error',failed);cancelWait=null;resolve(value);};
    const loaded=()=>{if(video.readyState>=2&&!video.seeking)finish(true);},failed=()=>finish(false);
    for(const event of readyEvents)video.addEventListener(event,loaded);video.addEventListener('error',failed,{once:true});
    timer=setTimeout(()=>{status('slow');finish(false);},12000);cancelWait=()=>finish(false);
   });
   if(!ok||request!==generation)return false;
  }
  if(request!==generation)return false;
  try{await video.play();return true;}catch{if(request===generation)status('error');return false;}
 }
 function pause(){cancel();video.pause();}
 function unload(){if(!plan)return;pause();plan=null;video.removeAttribute('src');video.load();status('idle');}
 return {sync,play,pause,unload,globalTime:()=>plan?globalMediaTime(plan,video.currentTime):pending,retry(){if(!plan)return;const current=plan;plan=null;sync(current,pending);return play();}};
}
