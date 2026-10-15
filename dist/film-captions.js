import {PITCHSIDE_BEATS} from './pitchside-story.js';
import {FILM_SCENES} from './film-math.js';
export function descriptionCues(plan,language='en'){
 const l=Math.max(0,['en','es','pt'].indexOf(language));if(!plan.src.includes('pitchside'))return [];
 return PITCHSIDE_BEATS.flatMap((beat,i)=>{const scene=FILM_SCENES.find(s=>s.start<=beat.second&&beat.second<s.end),end=Math.min(scene.end,PITCHSIDE_BEATS[i+1]?.second??60,plan.offset+plan.duration),start=Math.max(beat.second,plan.offset);return end>start?[{id:beat.id,start:start-plan.offset,end:end-plan.offset,text:beat.observations[l]}]:[];});
}
export function bindDescriptions(video,button){
 let signature='',track=null,enabled=false;
 const tracks=new Map();
 button.onclick=()=>{enabled=!enabled;if(track)track.mode=enabled?'showing':'disabled';button.setAttribute('aria-pressed',String(enabled));button.textContent=enabled?'Descriptions on':'Descriptions off';};
 return {sync(plan,language){const next=[plan.src,plan.offset,language].join(':');if(signature===next)return;signature=next;for(const t of tracks.values())t.mode='disabled';const cues=descriptionCues(plan,language);button.hidden=!cues.length;if(!cues.length)return;
  if(!tracks.has(language))tracks.set(language,video.addTextTrack('captions','Reviewed visual descriptions',language));track=tracks.get(language);for(const cue of [...(track.cues||[])])track.removeCue(cue);for(const cue of cues){const item=new VTTCue(cue.start,cue.end,cue.text);item.id=cue.id;item.snapToLines=false;item.line=15;item.position=50;item.size=86;item.align='center';track.addCue(item);}track.mode=enabled?'showing':'disabled';
 }};
}
