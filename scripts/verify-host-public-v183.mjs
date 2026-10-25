// Public-path development check; preserves exact SSE posts and failures.
import {writeFile,mkdir} from 'node:fs/promises';
import {PITCHSIDE} from '../dist/pitchside-story.js';

const origin=process.argv[2];
if(!origin?.startsWith('https://'))throw Error('Pass the public HTTPS origin');
const all=[
 {id:'duel',time:2,opening:'What should a viewer take from the opening duel?',followup:'Is marking the same as winning a tackle here?'},
 {id:'outlet',time:12,opening:'What can the viewer actually conclude from this reception?',followup:'Would a wider unbroken angle change the line-break verdict?'},
 {id:'control',time:22,opening:'How should a viewer interpret this controlled touch?',followup:'Does close control establish that the defender was beaten?'},
 {id:'marking',time:25,opening:'What is visible in the defender’s stance?',followup:'Does that stance establish a plan to tackle?'},
 {id:'mirror',time:30,opening:'What does the defender’s lateral movement show?',followup:'Can a viewer label that movement a completed tackle?'},
 {id:'boundary',time:36,opening:'What can this sideline view support?',followup:'Can the fall be reported as a foul?'},
 {id:'keeper',time:46,opening:'What is the keeper doing in this scene?',followup:'Can we call this a save without seeing the incoming ball?'},
 {id:'gesture',time:50,opening:'How should the pointing gesture be described?',followup:'Can we infer a tactical instruction from that gesture?'},
 {id:'blue',time:58,opening:'What is the useful reading of the final pass?',followup:'What remains unknown about the defensive line after the reception?'},
 {id:'outlet-again',time:12,opening:'Explain the reception to a new viewer in football terms.',followup:'Did the evidence change, or only our question about the pass?'}
];
const count=Math.min(10,Math.max(1,Number(process.argv[3]||10)));
const cases=all.slice(0,count),path='docs/proof/v183-public-'+count+'-case.json';
const health=async()=>fetch(origin+'/api/health?probe='+crypto.randomUUID(),{signal:AbortSignal.timeout(30000)}).then(r=>r.json());
const before=await health();if(before.version!=='3.29.0')throw Error('Unexpected release '+before.version);
if(before.usage.limit-before.usage.used<count*9)throw Error('Insufficient existing allowance');
const report={schema:'btr.host-public-reliability.v1',recorded_at:new Date().toISOString(),origin,release:{version:before.version,git_revision:before.git_revision,image_tag:before.image_tag},allowance_before:before.usage,cases,results:[],complete:false,passing:false,limitations:'Development reliability check on reviewed film. No human preference score.'};
await mkdir('docs/proof',{recursive:true});const save=()=>writeFile(path,JSON.stringify(report,null,2)+'\n');await save();
for(const item of cases){
 if(report.results.length)await new Promise(resolve=>setTimeout(resolve,75000));
 const row={id:item.id,rounds:[]};report.results.push(row);
 for(const question of [item.opening,item.followup]){
  const parentKey=row.rounds.at(-1)?.events.find(event=>event.type==='conversation')?.data.id;
  const input={clip_id:PITCHSIDE.id,time:item.time,language:'en',mode:'fan',question,...(parentKey?{parentKey}:{})};
  const round={input,events:[],started_at:new Date().toISOString()};row.rounds.push(round);await save();
  try{
   const res=await fetch(origin+'/api/clip-desk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(120000)});
   if(!res.ok)throw Error('HTTP '+res.status+' '+(await res.text()).slice(0,250));
   let buffer='';const decoder=new TextDecoder();
   for await(const chunk of res.body){buffer+=decoder.decode(chunk,{stream:true});let end;while((end=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);const type=frame.match(/^event: (.+)$/m)?.[1],data=frame.match(/^data: (.+)$/m)?.[1];if(type&&data){round.events.push({type,data:JSON.parse(data),at:new Date().toISOString()});if(type!=='draft')await save();}}}
   round.complete=round.events.some(event=>event.type==='complete')&&!round.events.some(event=>event.type==='error');
  }catch(error){round.error=error.message;}
  round.finished_at=new Date().toISOString();await save();
  if(!round.complete)break;
 }
 const posts=row.rounds.map(round=>round.events.filter(event=>event.type==='post').map(event=>event.data));
 row.fallbacks=posts.flat().filter(post=>post.engine==='reviewed_fallback').map(post=>post.role);
 row.followup_changed=!!(posts[0]&&posts[1]&&posts[0].find(post=>post.role==='presenter')?.summary!==posts[1].find(post=>post.role==='presenter')?.summary);
 row.passing=row.rounds.length===2&&row.rounds.every(round=>round.complete&&!round.error&&round.events.every(event=>event.type!=='draft'))&&posts.every(round=>['analyst','guide','presenter'].every(role=>round.find(post=>post.role===role)?.engine==='azure_openai'))&&row.followup_changed;
 await save();console.log(JSON.stringify({id:row.id,passing:row.passing,fallbacks:row.fallbacks}));
}
const after=await health();report.allowance_after=after.usage;report.complete=report.results.length===count&&report.results.every(row=>row.rounds.length===2&&row.rounds.every(round=>round.complete));report.passing=report.complete&&report.results.every(row=>row.passing);await save();
console.log(JSON.stringify({path,complete:report.complete,passing:report.passing,requests_used:after.usage.used-before.usage.used}));
if(!report.passing)process.exitCode=1;
