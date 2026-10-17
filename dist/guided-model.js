import {matchStory,localPanel,matchExport} from './match-story.js';
import {editorialIssues} from './editorial-quality.js';
export const GUIDE_STEPS=[
 {id:'watch',label:'Watch',title:'The run you didn’t see.',copy:'Follow the winger and the defender. Two completed passes move the ball forward while the players move toward the same side.'},
 {id:'discuss',label:'Discuss',title:'Five jobs. One football story.',copy:'Observation, explanation, calculation, challenge, then a takeaway. Each contribution has a different job and shares the same evidence cutoff.'},
 {id:'evidence',label:'Measure',title:'Measure the route toward goal.',copy:'Completed passes gain ground toward goal. Open the calculation to see exactly which events contribute; carries and off-ball runs are excluded.'},
 {id:'correct',label:'Challenge',title:'Change the record. Change the story.',copy:'Apply an alternate defender-tracking record. The movement claim is withdrawn immediately. The completed passes stay intact.'},
 {id:'audience',label:'Personalize',title:'Same facts. Your way into the game.',copy:'Switch the language and perspective. The on-screen caption changes while the source revision and event evidence stay attached.'}
];
export const SOURCE_LABELS={
 match:{title:'Measured match story',scope:'One authored 36-second sequence. Replay, statistics and corrections use the same synthetic coordinates.'},
 pitchside:{title:'Pitchside film',scope:'A 60-second edit of eight generated shots. Reviewed observations describe the film; synthetic match statistics do not describe these pixels.'},
 video:{title:'Measured stadium minute',scope:'One continuous controlled synthetic video. Pixel-derived event candidates, calibrated ground-plane measurements and the video AI crew share its frame evidence. The cinematic film is a separate source.'},
 lab:{title:'Full-match generator',scope:'A separate seeded 90-minute fixture. Event coordinates and statistics; no continuous player tracking.'}
};
export function guidedInput({time=16,corrected=false,language='en',mode='analyst'}={}){return {source:'match',scenario:'wide',time:Math.max(0,Math.min(16,Number(time)||0)),corrected:!!corrected,language:['en','es','pt'].includes(language)?language:'en',mode:['fan','beginner','math','analyst','player'].includes(mode)?mode:'analyst',focus:7,team:'harbor'};}
export function savedGuidePosts(pack,input){
 const run=pack?.cases?.find(c=>c.input?.scenario===input.scenario&&c.input.time===input.time&&c.input.corrected===input.corrected&&c.input.language===input.language&&c.input.mode===input.mode);
 if(!run?.team?.posts?.length)return null;
 const story=matchStory(input),ids=new Set(story.evidence.map(e=>e.id));
 if(run.team.posts.length!==5||run.team.posts.some(p=>p.cutoff!==story.cutoff||p.revision!==story.revision||!p.evidence_ids?.every(id=>ids.has(id))))return null;
 return run.team.posts;
}
export function guidedSnapshot(options={},saved){
 const input=guidedInput(options),story=matchStory(input),savedPosts=savedGuidePosts(saved,input),notes=localPanel(story);
 const posts=notes.map(note=>{const savedPost=savedPosts?.find(p=>p.role===note.role);if(!savedPost)return note;const issues=savedPost.engine==='azure_openai'?editorialIssues(note.role,savedPost.summary,savedPosts):[];return issues.length?{...note,engine:'reviewed_fallback',caution:'Archived AI text did not meet the current editorial checks. Reviewed explanation shown.'}:savedPost;});
 return {input,story,posts,saved:!!savedPosts,recordedAt:savedPosts?saved.recorded_at:null,export:{...matchExport(input,posts),demonstration:{kind:savedPosts?'saved-live-run':'reviewed-notes',recorded_at:savedPosts?saved.recorded_at:null,fresh_model_calls:0}}};
}
