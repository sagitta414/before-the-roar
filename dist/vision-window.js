import {PITCHSIDE} from './pitchside-story.js';
export const FILM_CUTS=[0,8,16,24,32,40,48,52];
export function visionWindow(time){
 if(!Number.isFinite(time)||time<0||time>PITCHSIDE.duration)throw Error('Invalid film cutoff');
 const last=Math.min(59,Math.floor(time)),start=FILM_CUTS.findLast(t=>t<=last),seconds=Array.from({length:Math.min(4,last-start+1)},(_,i)=>last-Math.min(3,last-start)+i);
 return {clip_id:PITCHSIDE.id,cutoff:time,shot_start:start,frames:seconds.map(second=>({id:`frame-${second}`,second,path:`assets/vision/frame-${String(second).padStart(2,'0')}.jpg`}))};
}
