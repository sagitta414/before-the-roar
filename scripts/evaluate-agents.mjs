import { mkdir, writeFile } from 'node:fs/promises';
import { randomBytes, createHash } from 'node:crypto';
import { ResultStore, accessToken } from '../api/azure.mjs';
import { MatchDesk } from '../api/match-desk.mjs';
import { AgentState } from '../api/agent-state.mjs';
import { matchStory, localPanel } from '../dist/match-story.js';
import { editorialPolicy } from '../api/editorial-policy.mjs';
import {followUpMetric} from '../api/conversation.mjs';
import { EVALUATION_CASES, EXTENDED_CASES, FOLLOW_UP_QUESTION, blindReviewPack, MODEL_ROLES, comparisonSchema, evaluateBaseline, evaluationSummary } from '../api/agent-evaluation.mjs';

const flags = new Set(process.argv.slice(2));
const study = flags.has('--conversation-study');
const qualitySmoke=flags.has('--quality-smoke');
const compactIds = ['wide-original','pressure-to-chance','wide-corrected-es-beginner','counter-pt-saved'];
const cases = qualitySmoke ? EVALUATION_CASES.filter(c=>c.id==='wide-original') : study ? EXTENDED_CASES.slice(0,11) : flags.has('--extended') ? EXTENDED_CASES : flags.has('--balanced') ? EXTENDED_CASES.slice(0,12) : flags.has('--compact') ? EVALUATION_CASES.filter(c=>compactIds.includes(c.id)) : EVALUATION_CASES;
const follow = qualitySmoke || study || flags.has('--follow-up');
const cap = cases.length*5 + (follow ? 5 : 0);
const plan = {schema:'btr.evaluation-plan.v2',policy:'v51-grounded',cases,follow_up:follow?{parent:cases[0].id,question:FOLLOW_UP_QUESTION,paired:true}:null,maximum_requests:cap,method:'One trial per case and arm, fixed before generation. Both arms use the same evidence and editorial guards. Follow-up uses each arm’s own previous public contributions. No quality or audience benefit is inferred from guard acceptance.'};
if(!flags.has('--live')){console.log(JSON.stringify(plan,null,2));process.exit(0);}
for(const name of ['AZURE_OPENAI_ENDPOINT','AZURE_STORAGE_URL'])if(!process.env[name])throw Error(name+' required');
class EvaluationStore extends ResultStore {
 async blob(path,options={}){if(!process.env.BTR_EVAL_STORAGE_TOKEN)return super.blob(path,options);return fetch(this.base+path,{...options,headers:{Authorization:'Bearer '+process.env.BTR_EVAL_STORAGE_TOKEN,'x-ms-version':'2023-11-03',...options.headers},signal:AbortSignal.timeout(12000)});}
}
const store = new EvaluationStore(), before=await store.allowance();let resumed=null;
if(process.env.BTR_EVAL_RESUME){
 if(!/^evaluation-[a-f0-9]{20}$/.test(process.env.BTR_EVAL_RESUME))throw Error('Invalid saved evaluation identifier');
 const saved=await store.blob(`evaluations/${process.env.BTR_EVAL_RESUME}.json`);if(!saved.ok)throw Error('Saved evaluation unavailable');resumed=await saved.json();
 if(resumed.complete||JSON.stringify(resumed.plan)!==JSON.stringify(plan)||resumed.cases.some(c=>!c.team||!c.baseline))throw Error('Resume requires an unfinished identical plan at a completed paired-case boundary');
}
let reservations=resumed?.requests_reserved||0;
if(before.limit-before.used<cap-reservations)throw Error(`The evaluation needs ${cap-reservations} available requests. The ceiling will not be changed.`);
const reserve=store.reserve.bind(store);store.reserve=async()=>{if(reservations>=cap)return false;const ok=await reserve();if(ok)reservations++;return ok;};
const runId=resumed?.run_id||'evaluation-'+randomBytes(10).toString('hex'),state=new AgentState(store),narrator={store,busy:0},model=process.env.AZURE_OPENAI_DEPLOYMENT||'gpt-4o-mini';
const report=resumed||{schema:'btr.agent-evaluation.v1',policy:plan.policy,run_id:runId,recorded_at:new Date().toISOString(),model,plan,allowance_before:before,method:{cases:`${cases.length} fixed opening cases${follow?' and one paired follow-up':''}; one trial per arm; all failures retained.`,team:'Scout selects an evidence tool then writes; Guide reads Scout; Host receives all contributions. Deterministic calculations and checks are separate. Four model calls per round.',baseline:'One model call writes the same three editorial roles using the same source packet, calculated facts, glossary, source verdict and role contracts. Follow-ups receive its own earlier outputs.',scoring:'Identical editorial and citation guards. Acceptance is not semantic accuracy. No model judge or audience results.',pacing:'At least 75 seconds between paired cases; no model retries.',max_requests:cap},cases:[],complete:false,conclusion:'This comparison measures editorial guard acceptance, request count and latency. It does not by itself establish better football analysis, causal accuracy or viewer benefit. Blind human ratings remain unfilled.'};
if(resumed){report.resumptions??=[];report.resumptions.push({at:new Date().toISOString(),completed_pairs:report.cases.length,requests_reserved:reservations,reason:'Worker connection ended at a paired-case boundary. Persisted results retained; completed pairs are not repeated.',allowance:before});}
const stdout=flags.has('--stdout');
if(!stdout)await mkdir('docs/proof',{recursive:true});
async function persist(){
 report.summary=evaluationSummary(report.cases);report.requests_reserved=reservations;
 const json=JSON.stringify(report,null,2)+'\n';
 // Store the report alongside the durable run, before printing it. A lost CLI connection must not lose the baseline arm.
 const response=await store.blob(`evaluations/${runId}.json`,{method:'PUT',headers:{'x-ms-blob-type':'BlockBlob','Content-Type':'application/json'},body:json});
 if(!response.ok)throw Error('Evaluation persistence failed: '+response.status);
 if(stdout){await writeFile('/tmp/'+runId+'.json',json);return;}
 await writeFile('docs/proof/agent-evaluation.json',json);await writeFile('dist/assets/btr-agent-evaluation.json',json);
 await writeFile('docs/proof/blind-review-v44.json',JSON.stringify(blindReviewPack(report),null,2)+'\n');
}
async function baseline(input,previous=[]){
 const packet=matchStory(input),notes=localPanel(packet),support=notes.filter(p=>['math','reviewer'].includes(p.role));
 if(previous.length){const metric=followUpMetric(packet);if(metric)Object.assign(support.find(p=>p.role==='math'),{summary:metric.text,working:metric.equation,evidence_ids:metric.evidence_ids,metric_value:metric.value,metric_title:metric.label});}
 const evidence=packet.evidence.filter(e=>e.record_type!=='tracking'||packet.brief.evidenceIds.includes(e.id)),began=performance.now();
 const result={posts:[],accepted:0,rejected:3,requests:0,elapsed_ms:0};
 try{
  if(!await store.reserve())throw Error('Allowance reached');result.requests=1;
  const response=await fetch(new URL(`openai/deployments/${encodeURIComponent(model)}/chat/completions?api-version=2024-10-21`,process.env.AZURE_OPENAI_ENDPOINT),{method:'POST',headers:{Authorization:'Bearer '+await accessToken('https://cognitiveservices.azure.com/'),'Content-Type':'application/json'},signal:AbortSignal.timeout(60000),body:JSON.stringify({messages:[{role:'system',content:'Write three distinct public contributions in one response. Return keys analyst, guide, presenter. Each follows its contract below. Within this response, Guide builds on Scout and Host synthesizes the other contributions. Use only the supplied facts.\n'+MODEL_ROLES.map(role=>editorialPolicy(packet,role,{round:previous.length?2:1})).join('\n\n')},{role:'user',content:JSON.stringify({question:input.question||null,clock:packet.clock,revision:packet.revision,calculated:packet.stats,role_briefs:notes,evidence,review:packet.review,guide_definition:packet.guideDefinition,football_context:packet.football,editorial_closing_reference:notes.find(p=>p.role==='presenter').summary,local_calculation:support.find(p=>p.role==='math'),conversation:{round:previous.length?2:1,max_rounds:3},prior_round:previous})}],temperature:.45,max_tokens:1400,response_format:{type:'json_schema',json_schema:{name:'single_editor_baseline',strict:true,schema:comparisonSchema(evidence.map(e=>e.id),packet.football?.observation?packet.football.record.id:undefined)}}})});
  if(!response.ok)throw Error('Baseline model HTTP '+response.status);
  const data=await response.json(),raw=JSON.parse(data.choices[0].message.content);Object.assign(result,evaluateBaseline(raw,packet,{previous,support}),{raw,usage:data.usage||null});
 }catch(error){result.error=error.message;}
 result.elapsed_ms=Math.round(performance.now()-began);result.support=support;return result;
}
let caseStarted=-Infinity;
async function pair(c,parent){
 const wait=Math.max(0,75000-(performance.now()-caseStarted));if(wait)await new Promise(r=>setTimeout(r,wait));caseStarted=performance.now();
 const packet=matchStory(c.input),key=createHash('sha256').update(runId+'-'+c.id).digest('hex'),row={...c,evidence:packet.evidence,review:packet.review,discussion_id:key,...(parent?{parent_case:parent.id}:{} )};report.cases.push(row);
 const input={...c.input,...(parent?{parentKey:parent.discussion_id}:{} )};const began=performance.now(),events=[];
 const posts=await new MatchDesk(narrator,{state}).discuss(input,(type,data)=>events.push({at_ms:Math.round(performance.now()-began),type,data}),{key});
 const journal=(await state.read(key)).value;
 row.team={posts,requests:journal.metrics.model_calls,elapsed_ms:Math.round(performance.now()-began),usage:journal.metrics,trace:journal.trace,raw:journal.raw_outputs||{},events,status:journal.status};await persist();
 row.baseline=await baseline(c.input,parent?[...parent.baseline.posts,...parent.baseline.support]:[]);
 await persist();console.log(JSON.stringify({case:c.id,team:posts.filter(p=>p.engine==='azure_openai').length,baseline:row.baseline.accepted,requests_reserved:reservations}));
 return row;
}
await persist();console.log('BTR_EVAL_RUN='+runId);
try{
 for(const c of cases)if(!report.cases.some(done=>done.id===c.id))await pair(c);
 if(follow){const parent=report.cases[0];const row=await pair({id:'wide-follow-up-challenge',input:{...parent.input,question:FOLLOW_UP_QUESTION}},parent);report.follow_up={input:row.input,posts:row.team.posts,events:row.team.events,paired_case_id:row.id};}
 report.complete=report.cases.length===cases.length+(follow?1:0)&&report.cases.every(c=>c.team&&Object.keys(c.team.raw||{}).length===3&&c.baseline&&!c.baseline.error);
 report.allowance_after=await store.allowance();
}finally{await persist();if(stdout)console.log('BTR_EVAL_REPORT64='+Buffer.from(JSON.stringify(report)).toString('base64'));}
console.log(JSON.stringify({complete:report.complete,summary:report.summary,requests_reserved:reservations}));



