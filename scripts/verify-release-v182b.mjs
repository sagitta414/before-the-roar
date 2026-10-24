// Development regression, never an independent commentary-quality benchmark.
// Run in the configured runtime: node scripts/verify-release-v182b.mjs --live
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {collectSourceGraph} from './source-manifest.mjs';
import {MatchDesk} from '../api/match-desk.mjs';
import {AgentState} from '../api/agent-state.mjs';
import {ResultStore} from '../api/azure.mjs';

const cases = [{id:'escape-contract',time:22,opening:'Explain this close-control moment using only this shot.',followup:'Does the defender following prove the attacker beat him? What conclusion survives?'}];
const files=await collectSourceGraph(['api/match-desk.mjs','scripts/verify-release-v182b.mjs']);
const digest=b=>createHash('sha256').update(b).digest('hex');
const sources=Object.fromEntries(await Promise.all(files.map(async f=>[f,digest(await readFile(f))])));
const plan={schema:'btr.frozen-film-regression.v1',kind:'targeted replay-contract regression after v182; not a full-grid rerun or independent quality evaluation',created_at:new Date().toISOString(),sources,cases,max_requests:7,quality_verdict:null};
if(!process.argv.includes('--live')) { console.log(JSON.stringify(plan,null,2)); }
else {
 if(!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_STORAGE_URL) throw Error('Configured Azure runtime required; no substitute or simulated results.');
 const directory=join(tmpdir(),'film-regression-'+randomUUID()); await mkdir(directory,{recursive:true});
 for(const file of files){const target=join(directory,'source',file);await mkdir(join(target,'..'),{recursive:true});await writeFile(target,await readFile(file));}
 await writeFile(join(directory,'plan.json'),JSON.stringify(plan,null,2));
 const store=new ResultStore(), reserve=store.reserve.bind(store);let requests=0;
 store.reserve=async()=>{if(requests>=plan.max_requests)return false;const ok=await reserve();if(ok)requests++;return ok;};
 const report={plan,complete:false,requests:0,cases:[],human_ratings:null};
 // Isolated checkpoints prevent a previously generated round counting as fresh.
 const state=new AgentState({},{directory:join(directory,'state')});
 const desk=new MatchDesk({store,busy:0},{clip:true,state});
 const persist=()=>writeFile(join(directory,'results.json'),JSON.stringify(report,null,2));
 for(const c of cases){
  // Pace known deployment throughput; never reinterpret a 429 as quality failure.
  if(report.cases.length)await new Promise(resolve=>setTimeout(resolve,75000));
  const result={id:c.id,rounds:[]};report.cases.push(result);
  let parentKey;
  for(const question of [c.opening,c.followup]){
   const events=[],started=Date.now();const round={events};result.rounds.push(round);
   try{await desk.discuss({clip_id:'pitchside-minute-veo-quality-v1',time:c.time,mode:'analyst',language:'en',question,parentKey},(type,data)=>events.push({type,data}));parentKey=events.find(e=>e.type==='conversation')?.data.id;if(!parentKey)throw Error('No conversation receipt');}
   catch(e){round.error=e.message;}
   round.elapsed_ms=Date.now()-started;report.requests=requests;await persist();
   if(round.error)break;
  }
 }
 report.source_unchanged=(await Promise.all(files.map(async f=>digest(await readFile(f))===sources[f]))).every(Boolean);
 report.complete=report.source_unchanged&&report.cases.length===cases.length&&report.cases.every(c=>c.rounds.length===2&&c.rounds.every(r=>!r.error&&r.events.some(e=>e.type==='complete')));
 await persist();
 const saved=await store.blob('evaluations/'+directory.split(/[\\/]/).at(-1)+'.json',{method:'PUT',headers:{'x-ms-blob-type':'BlockBlob','Content-Type':'application/json'},body:JSON.stringify(report)});
 console.log(JSON.stringify({directory,complete:report.complete,requests,durable_record:saved.ok}));
 console.log('BTR_REPORT_BASE64:'+Buffer.from(JSON.stringify(report)).toString('base64'));
 if(!report.complete)process.exitCode=1;
}
