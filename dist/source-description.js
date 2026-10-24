import {pitchsideStory,PITCHSIDE_BEATS,clipClock} from './pitchside-story.js';
import {matchStory} from './match-story.js';
export function sourceDescription(input){
 const film=input.source==='pitchside',story=film?pitchsideStory({...input,time:input.clipTime??input.time}):matchStory(input);
 const title=story.title,detail=film?(story.analysis?.summary||story.body):`${story.body} ${story.review?.reason||''}`;
 return {at:story.cutoff,clock:story.clock,title,plain:story.body,detail,source:input.source};
}
export function sourceTranscript(input){
 if(input.source!=='pitchside')return [sourceDescription(input)];
 const t=input.clipTime??input.time??0,l=Math.max(0,['en','es','pt'].indexOf(input.language));
 const reached=PITCHSIDE_BEATS.filter(b=>b.second<=t).map(b=>({at:b.second,clock:clipClock(b.second),title:b.titles[l],plain:b.observations[l],detail:b.observations[l]}));
 return reached.length?reached:[sourceDescription(input)];
}
