import {matchStory,localPanel,matchExport} from './match-story.js';
import {editorialIssues} from './editorial-quality.js';
export const GUIDE_STEPS=[
 {id:'watch',label:'Watch',title:'The defender moved. Or did he?',copy:'Watch the football first. A synthetic tracking observation appears to support the obvious story, but BTR will not publish that conclusion until the evidence survives a challenge.'},
 {id:'discuss',label:'Investigate',title:'The crew disagrees with a purpose.',copy:'Scout observes. Vector measures. Check challenges the inference. Host can publish only what survives the evidence gate.'},
 {id:'evidence',label:'Calculate',title:'Numbers with football meaning.',copy:'Vector calculates from the reached event records and exposes every input. The result advances the story without pretending to prove intent.'},
 {id:'correct',label:'Correct',title:'Change one record. Force three corrections.',copy:'Original and corrected tracking appear side by side. The affected calculation updates, the unsupported claim is withdrawn and the public line changes while valid pass evidence remains.'},
 {id:'audience',label:'Publish',title:'One trusted story. Every screen.',copy:'Publish the corrected state to Watch and a paired Pocket Director, then personalize its language and level without changing the evidence.'}
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
