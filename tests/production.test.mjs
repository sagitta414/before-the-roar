import test from 'node:test';
import assert from 'node:assert/strict';
import {testState,toolResponse} from './agent-fixture.mjs';
import {AgentState} from '../api/agent-state.mjs';
import {MatchDesk} from '../api/match-desk.mjs';
import {ProductionDesk} from '../api/production.mjs';
import {executeAgentTool} from '../api/agent-tools.mjs';
import {generateMatch} from '../api/match.mjs';
import {validateSyntheticMatch} from '../api/synthetic-validation.mjs';
const input={source:'match',scenario:'wide',time:16,corrected:false,focus:7,team:'harbor',language:'en',mode:'fan'};

test('a fresh worker resumes persisted contributions after a real exception without re-spending completed calls',async()=>{
 const originalFetch=global.fetch,endpoint=process.env.AZURE_OPENAI_ENDPOINT,token=process.env.AZURE_ACCESS_TOKEN;
 process.env.AZURE_OPENAI_ENDPOINT='https://example.test/';process.env.AZURE_ACCESS_TOKEN='test';
 let calls=0;const narrator={busy:0,store:{reserve:async()=>true}},state=testState(narrator.store),events=[];
 global.fetch=async(url,options)=>{calls++;const b=JSON.parse(options.body);if(b.tools)return toolResponse(b);assert.equal(b.messages.at(-1).role,b.messages[0].content.includes('Scout:')?'tool':'user');const role=b.messages[0].content.includes('Guide:')?'guide':b.messages[0].content.includes('Host:')?'host':'scout';const post={headline:'The route outside',caution:'Coincidence does not prove cause.',evidence_ids:{primary:'wide-evt-002',secondary:null},...(role==='guide'?{viewing_question:'Which side does the defender move toward?'}:role==='host'?{takeaway:'Width offers a route around the defensive line.',replay_cue:'Replay the runner beside the defender.'}:{interpretation:'The runner moves wide while the defender shifts to that side.'})};return new Response('data: '+JSON.stringify({choices:[{delta:{content:JSON.stringify({post})},finish_reason:'stop'}],usage:{prompt_tokens:120,completion_tokens:60}})+'\n\ndata: [DONE]\n\n');};
 try{
  await assert.rejects(()=>new MatchDesk(narrator,{state}).discuss(input,(t,d)=>events.push([t,d]),{key:'recovery-test-001',interruptAfterSpecialists:true}),e=>e.code==='CHECKPOINT_INTERRUPTED');
  assert.equal(calls,3);const before=await state.read('recovery-test-001');assert.equal(before.value.status,'interrupted');assert.equal(Object.keys(before.value.posts).length,3);
  const replacement=new AgentState(narrator.store,{directory:state.directory});const posts=await new MatchDesk(narrator,{state:replacement}).discuss(input,(t,d)=>events.push([t,d]),{key:'recovery-test-001',interruptAfterSpecialists:true});
  assert.equal(calls,4);assert.equal(posts.filter(p=>p.engine==='azure_openai').length,3);assert.equal(narrator.busy,0);
  const after=await replacement.read('recovery-test-001');assert.equal(after.value.status,'complete');assert.equal(after.value.metrics.prompt_tokens,400);assert.equal(after.value.metrics.completion_tokens,188);assert.ok(events.some(([t,d])=>t==='trace'&&d.action==='saved_contribution_reused'));
  await new MatchDesk(narrator,{state:replacement}).discuss(input,()=>{},{key:'recovery-test-001'});assert.equal(calls,4);
 }finally{global.fetch=originalFetch;for(const[k,v]of [['AZURE_OPENAI_ENDPOINT',endpoint],['AZURE_ACCESS_TOKEN',token]])if(v===undefined)delete process.env[k];else process.env[k]=v;}
});
test('stale checkpoint writers cannot overwrite a more recent decision',async()=>{const state=testState({}),first=await state.write('conflict-test',{decision:'original'}),saved=await state.write('conflict-test',{...first.value,decision:'corrected'},first.etag);await assert.rejects(()=>state.write('conflict-test',{...first.value,decision:'stale'},first.etag),/conflict/);assert.equal((await state.read('conflict-test')).value.decision,saved.value.decision);});
test('tool calls cannot supply arbitrary source selectors, URLs or unknown operations',()=>{assert.throws(()=>executeAgentTool('read_evidence',{url:'https://example.test/private'},{}),/no untrusted/);assert.throws(()=>executeAgentTool('delete_records',{}, {packet:{}}),/Unknown/);});
test('an Azure capacity cooldown serves reviewed notes without reserving another request',async()=>{
 const endpoint=process.env.AZURE_OPENAI_ENDPOINT,token=process.env.AZURE_ACCESS_TOKEN;
 process.env.AZURE_OPENAI_ENDPOINT='https://example.test/';process.env.AZURE_ACCESS_TOKEN='test';
 const narrator={busy:0,retryAt:Date.now()+60000,store:{reserve:async()=>assert.fail('Do not spend during cooldown')}};
 try{const posts=await new MatchDesk(narrator,{state:testState(narrator.store)}).discuss(input,()=>{});assert.equal(posts.filter(p=>p.engine==='reviewed_fallback').length,3);assert.equal(narrator.busy,0);}
 finally{for(const [k,v]of [['AZURE_OPENAI_ENDPOINT',endpoint],['AZURE_ACCESS_TOKEN',token]])if(v===undefined)delete process.env[k];else process.env[k]=v;}
});
test('correction persists across service replacement and reaches the reader without granting write authority',async()=>{
 let now=1000;const narrator={store:{}},state=testState({}),desk=new ProductionDesk(narrator,{state,clock:()=>now}),run=await desk.create(input);const original=await desk.authorized(run.id,run.token);
 await assert.rejects(()=>desk.authorized(run.id,run.readKey),/authorization/);await assert.rejects(()=>desk.authorized(run.id,run.token,true),/authorization/);
 const revised=await desk.revise(original,{action:'correct'});assert.equal(revised.value.ledger.at(-1).status,'withdrawn');await assert.rejects(()=>desk.revise(original,{action:'correct'}),/conflict/);
 const replacement=new ProductionDesk(narrator,{state:new AgentState({}, {directory:state.directory}),clock:()=>now});const reader=await replacement.authorized(run.id,run.readKey,true),cue=replacement.cue(reader);assert.equal(cue.revision,2);assert.equal(cue.claim_status,'withdrawn');assert.match(cue.body,/keeps Laurent in place/);
 const exported=await replacement.export(reader);assert.equal(exported.ledger.length,2);assert.ok(!JSON.stringify(exported).includes(run.token));assert.ok(!JSON.stringify(exported).includes('token_hash'));
 now=run.expires_at+1;await assert.rejects(()=>replacement.authorized(run.id,run.readKey,true),/expired/);
});
test('100 held-out seeds satisfy geometry, continuity, units and restart rules; corrupt events fail validation',()=>{
 for(let seed=1001;seed<=1100;seed++){const match=generateMatch(seed),report=validateSyntheticMatch(match);assert.equal(report.valid,true,JSON.stringify(report.failures));assert.deepEqual(match,generateMatch(seed));}
 const broken=structuredClone(generateMatch(107)),pass=broken.events.find(e=>e.type==='pass');pass.ball_speed_kmh+=20;pass.from=[-1,4];assert.equal(validateSyntheticMatch(broken).valid,false);
});
