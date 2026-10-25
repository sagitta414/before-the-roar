// Development reliability run, not an independent commentary preference study.
// In the configured Azure runtime: node scripts/verify-host-v183.mjs --live
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {collectSourceGraph} from './source-manifest.mjs';
import {MatchDesk} from '../api/match-desk.mjs';
import {AgentState} from '../api/agent-state.mjs';
import {ResultStore} from '../api/azure.mjs';

const cases=[
 {id:'duel',time:2,opening:'What does this face-to-face duel show?',followup:'Does standing close prove the defender won a tackle?'},
 {id:'outlet',time:12,opening:'What does the received pass establish?',followup:'What continuous view would establish whether the pass broke the line?'},
 {id:'control',time:22,opening:'What does this close-control moment mean?',followup:'Does the attacker controlling the ball prove he escaped?'},
 {id:'marking',time:25,opening:'How should I read the defender’s stance?',followup:'Can we infer the defender intended a tackle?'},
 {id:'mirror',time:30,opening:'What changed in the defender’s position?',followup:'Does moving alongside the attacker prove a tackle?'},
 {id:'boundary',time:36,opening:'What does the touchline shot tell us?',followup:'Does the fall establish a foul decision?'},
 {id:'keeper',time:46,opening:'What can we conclude about the goalkeeper?',followup:'Does holding the ball prove it was a save from a shot?'},
 {id:'gesture',time:50,opening:'What can we say about the gesture?',followup:'Can we quote an instruction from that gesture?'},
 {id:'blue',time:58,opening:'What does this late pass establish?',followup:'What does the pass leave unresolved about the defence?'},
 {id:'outlet-second',time:12,opening:'What is the useful football distinction in this reception?',followup:'Has any new evidence arrived, or is the line-break claim still unsupported?'}
];
const files=await collectSourceGraph(['api/match-desk.mjs','scripts/verify-host-v183.mjs']);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sources=Object.fromEntries(await Promise.all(files.map(async file=>[file,hash(await readFile(file))])));
const plan={schema:'btr.host-reliability.v1',purpose:'Ten consecutive two-round film sessions on the same immutable code and reached evidence; no simulated responses',created_at:new Date().toISOString(),cases,sources,max_requests:90,pass_rule:'All 20 rounds complete; each has Azure Scout, Guide and Host, no reviewed fallback; follow-up Host changes its text while preserving citation and evidence boundary.',limitations:'Development reliability and editorial inspection only; no independent human preference or commentary accuracy score.'};
if(!process.argv.includes('--live'))console.log(JSON.stringify(plan,null,2));
else{
 if(!process.env.AZURE_OPENAI_ENDPOINT||!process.env.AZURE_STORAGE_URL)throw Error('Configured Azure runtime required');
 const directory=join(tmpdir(),'host-v183-'+randomUUID());await mkdir(directory,{recursive:true});
 for(const file of files){const dest=join(directory,'source',file);await mkdir(join(dest,'..'),{recursive:true});await writeFile(dest,await readFile(file));}
 await writeFile(join(directory,'plan.json'),JSON.stringify(plan,null,2));
 const store=new ResultStore(),realReserve=store.reserve.bind(store);let requests=0;
 store.reserve=async()=>{if(requests>=plan.max_requests)return false;const allowed=await realReserve();if(allowed)requests++;return allowed;};
 const state=new AgentState({},{directory:join(directory,'state')});
 const desk=new MatchDesk({store,busy:0},{clip:true,state});
 const report={plan,complete:false,passing:false,requests:0,cases:[],source_unchanged:false};
 const persist=()=>writeFile(join(directory,'results.json'),JSON.stringify(report,null,2));
 for(const item of cases){
  if(report.cases.length)await new Promise(resolve=>setTimeout(resolve,75000));
  const row={id:item.id,rounds:[]};report.cases.push(row);let parentKey;
  for(const question of [item.opening,item.followup]){
   const events=[],started=Date.now(),round={question};row.rounds.push(round);
   try{
    const posts=await desk.discuss({clip_id:'pitchside-minute-veo-quality-v1',time:item.time,mode:'analyst',language:'en',question,parentKey},(type,data)=>events.push({type,data}));
    parentKey=events.find(event=>event.type==='conversation')?.data.id;
    if(!parentKey)throw Error('No conversation receipt');
    round.posts=posts.map(post=>({role:post.role,engine:post.engine,summary:post.summary,evidence_ids:post.evidence_ids,editorial_envelope:post.editorial_envelope||null}));
    round.complete=events.some(event=>event.type==='complete');
    round.revisions=events.filter(event=>event.type==='receipt'&&event.data?.stage==='editorial_revision_requested').length;
    round.raw_drafts=events.filter(event=>event.type==='draft').length;
   }catch(error){round.error=error.message;}
   round.elapsed_ms=Date.now()-started;report.requests=requests;await persist();
   if(round.error)break;
  }
  const [first,second]=row.rounds;
  row.fallbacks=row.rounds.flatMap(round=>(round.posts||[]).filter(post=>post.engine==='reviewed_fallback').map(post=>post.role));
  row.followup_changed=!!(first?.posts&&second?.posts&&first.posts.find(post=>post.role==='presenter')?.summary!==second.posts.find(post=>post.role==='presenter')?.summary);
  row.passing=row.rounds.length===2&&row.rounds.every(round=>round.complete&&!round.error&&round.raw_drafts===0&&['analyst','guide','presenter'].every(role=>round.posts?.find(post=>post.role===role)?.engine==='azure_openai'))&&row.followup_changed;
  report.requests=requests;await persist();
  console.log('BTR_CASE:'+JSON.stringify({id:row.id,passing:row.passing,fallbacks:row.fallbacks,requests}));
 }
 report.source_unchanged=(await Promise.all(files.map(async file=>hash(await readFile(file))===sources[file]))).every(Boolean);
 report.complete=report.cases.length===10&&report.cases.every(row=>row.rounds.length===2&&row.rounds.every(round=>round.complete&&!round.error));
 report.passing=report.complete&&report.source_unchanged&&report.cases.every(row=>row.passing);
 await persist();
 const key='evaluations/'+directory.split(/[\\/]/).at(-1)+'.json';
 const response=await store.blob(key,{method:'PUT',headers:{'x-ms-blob-type':'BlockBlob','Content-Type':'application/json'},body:JSON.stringify(report)});
 console.log('BTR_REPORT_BASE64:'+Buffer.from(JSON.stringify(report)).toString('base64'));
 console.log('BTR_RESULT:'+JSON.stringify({directory,blob:key,durable_record:response.ok,complete:report.complete,passing:report.passing,requests}));
 if(!report.passing)process.exitCode=1;
}
