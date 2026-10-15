import {mkdir,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {ResultStore,accessToken} from '../api/azure.mjs';
import {MatchDesk} from '../api/match-desk.mjs';
import {AgentState} from '../api/agent-state.mjs';
import {matchStory,localPanel} from '../dist/match-story.js';
import {editorialPolicy} from '../api/editorial-policy.mjs';
import {EVALUATION_CASES,MODEL_ROLES,comparisonSchema,evaluateBaseline,evaluationSummary} from '../api/agent-evaluation.mjs';
if(!process.argv.includes('--live')){console.log(JSON.stringify({cases:EVALUATION_CASES,max_requests:21,instructions:'Use --live with model and storage tokens in the environment. The existing shared daily allowance is enforced. No limit changes.'},null,2));process.exit(0);}
for(const name of ['AZURE_OPENAI_ENDPOINT','AZURE_STORAGE_URL'])if(!process.env[name])throw Error(name+' required');
class EvaluationStore extends ResultStore{
 async blob(path,options={}){if(!process.env.BTR_EVAL_STORAGE_TOKEN)return super.blob(path,options);return fetch(this.base+path,{...options,headers:{Authorization:'Bearer '+process.env.BTR_EVAL_STORAGE_TOKEN,'x-ms-version':'2023-11-03',...options.headers},signal:AbortSignal.timeout(12000)});}
}
const store=new EvaluationStore(),before=await store.allowance(),cap=21;let reservations=0;
if(before.limit-before.used<cap)throw Error('The evaluation needs 21 available requests. The ceiling will not be changed.');
const reserve=store.reserve.bind(store);store.reserve=async()=>{if(reservations>=cap)return false;const ok=await reserve();if(ok)reservations++;return ok;};
const runId='evaluation-'+randomBytes(10).toString('hex'),state=new AgentState(store),narrator={store,busy:0},model=process.env.AZURE_OPENAI_DEPLOYMENT||'gpt-4o-mini';
const report={schema:'btr.agent-evaluation.v1',recorded_at:new Date().toISOString(),model,method:{cases:'Three fixed cases declared before this run; one trial per case; no cherry-picked retries.',team:'Scout and Guide each select a tool and write; Host reads their actual outputs plus deterministic calculation and check.',baseline:'One model call writes the same three editorial roles using the same evidence, role briefs, calculations and source verdict. No tool-selection round trips.',scoring:'Identical editorial guards and citation checks. Guard acceptance is not semantic truth. No model judge. No audience study.',cost:'Requests and reported tokens; no inferred dollar cost.',max_requests:cap},cases:[],conclusion:'This small comparison measures editorial guard acceptance and execution cost. It does not establish that multiple agents produce better football analysis. The separate recovery demonstration establishes reuse of completed work.'};
const stdout=process.argv.includes('--stdout');if(!stdout)await mkdir('docs/proof',{recursive:true});
async function persist(){report.summary=evaluationSummary(report.cases);report.requests_reserved=reservations;if(stdout){await writeFile('/tmp/'+runId+'.json',JSON.stringify(report));return;}await writeFile('docs/proof/agent-evaluation.json',JSON.stringify(report,null,2)+'\n');await writeFile('dist/assets/btr-agent-evaluation.json',JSON.stringify(report,null,2)+'\n');}
try{
 for(const [index,c]of EVALUATION_CASES.entries()){
  const row={id:c.id,input:c.input};report.cases.push(row);const packet=matchStory(c.input),notes=localPanel(packet),key=runId+'-'+index;
  let started=performance.now();const posts=await new MatchDesk(narrator,{state}).discuss(c.input,()=>{},{key}),journal=await state.read(key);row.team={posts,requests:journal.value.metrics.model_calls,elapsed_ms:Math.round(performance.now()-started),usage:journal.value.metrics,trace:journal.value.trace};await persist();
  const evidence=packet.evidence.filter(e=>e.record_type!=='tracking'||packet.brief.evidenceIds.includes(e.id));started=performance.now();row.baseline={posts:[],accepted:0,rejected:3,requests:0,elapsed_ms:0};
  try{if(!await store.reserve())throw Error('Allowance reached');row.baseline.requests=1;const url=new URL(`openai/deployments/${encodeURIComponent(model)}/chat/completions?api-version=2024-10-21`,process.env.AZURE_OPENAI_ENDPOINT),response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+await accessToken('https://cognitiveservices.azure.com/'),'Content-Type':'application/json'},signal:AbortSignal.timeout(60000),body:JSON.stringify({messages:[{role:'system',content:'Write three distinct public contributions in one response. Return keys analyst, guide, presenter. Each follows its contract below. Use the same supplied facts; do not invent evidence.\n'+MODEL_ROLES.map(role=>editorialPolicy(packet,role)).join('\n\n')},{role:'user',content:JSON.stringify({clock:packet.clock,revision:packet.revision,calculated:packet.stats,role_briefs:notes,evidence,review:packet.review,guide_definition:packet.guideDefinition,editorial_closing_reference:notes.find(p=>p.role==='presenter').summary})}],temperature:.2,max_tokens:1400,response_format:{type:'json_schema',json_schema:{name:'single_editor_baseline',strict:true,schema:comparisonSchema(evidence.map(e=>e.id))}}})});if(!response.ok)throw Error('Baseline model HTTP '+response.status);const data=await response.json();row.baseline={...row.baseline,...evaluateBaseline(JSON.parse(data.choices[0].message.content),packet),raw:JSON.parse(data.choices[0].message.content),usage:data.usage||null};}catch(e){row.baseline.error=e.message;}
  row.baseline.elapsed_ms=Math.round(performance.now()-started);await persist();console.log(JSON.stringify({case:c.id,team:row.team.posts.filter(p=>p.engine==='azure_openai').length,baseline:row.baseline.accepted,requests_reserved:reservations}));
 }
 report.complete=report.cases.length===3&&report.cases.every(c=>c.team&&c.baseline);report.allowance_after=await store.allowance();
}finally{await persist();if(stdout)console.log('BTR_EVAL_REPORT64='+Buffer.from(JSON.stringify(report)).toString('base64'));}
console.log(JSON.stringify({complete:report.complete,summary:report.summary,requests_reserved:reservations}));
