import {matchStory} from './match-story.js';
import {pitchsideStory} from './pitchside-story.js';

export function publishPacket(state){
 const input={...state,mode:['beginner','math','analyst'].includes(state.mode)?state.mode:'beginner'};
 const film=input.source==='pitchside';
 const story=film?pitchsideStory({...input,time:input.clipTime}):matchStory(input);
 const evidence=film?story.brief.state.seen:story.evidence;
 return {input,story,evidence,ready:evidence.length>0,key:JSON.stringify([input.source,story.cutoff,story.revision,input.mode,input.language])};
}
