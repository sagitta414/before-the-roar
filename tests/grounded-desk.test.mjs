import test from 'node:test';import assert from 'node:assert/strict';
import {sourceCatalog,selectSourcePosts,reconcileCachedNextEventMath} from '../api/grounded-desk.mjs';
import {matchStory,localPanel} from '../dist/match-story.js';
import {MatchDesk} from '../api/match-desk.mjs';import {testState} from './agent-fixture.mjs';
import {followUpMetric,conversationContext} from '../api/conversation.mjs';
const input={scenario:'wide',time:16,language:'en',mode:'analyst',focus:7,team:'harbor',corrected:false};

test('outcome response waits for completed shots and distinguishes saved shots from goals',()=>{
 for(const language of ['en','es','pt'])for(const [scenario,time,expected]of [['counter',27,null],['counter',28,'saved'],['wide',31,'goal']]){
  const p=matchStory({...input,scenario,time,language}),c=sourceCatalog(p,localPanel(p));
  const posts=selectSourcePosts({angle:'outcome'},c,p);assert.equal(p.analysis.shot?.outcome||null,expected);
  assert.notEqual(posts.find(x=>x.role==='analyst').summary,posts.find(x=>x.role==='presenter').summary);
  if(language==='en')assert.match(posts.find(x=>x.role==='presenter').summary,expected==='saved'?/was saved/:expected==='goal'?/recorded as a goal/:/cannot yet be reported/);
 }
});

test('simplification teaches a concept instead of turning a beginner request into a causal challenge',()=>{
 for(const language of ['en','es','pt'])for(const corrected of [false,true]) {
  const p=matchStory({...input,language,corrected}),notes=localPanel(p),first=sourceCatalog(p,notes).movement.posts;
  const c=sourceCatalog(p,notes,{round:2,previous:first});
  assert.notEqual(c.beginner.posts.find(x=>x.role==='guide').summary,c.limits.posts.find(x=>x.role==='guide').summary);
  assert.notEqual(c.beginner.posts.at(-1).summary,c.limits.posts.at(-1).summary);
  assert.ok(c.beginner.posts.find(x=>x.role==='analyst').unchanged);
  for(const angle of ['beginner','calculation','next_check'])assert.doesNotThrow(()=>selectSourcePosts({angle},c,p));
 }
});

test('third-round measurements do not recycle either earlier calculation and stored history survives',async()=>{
 const p=matchStory(input),notes=localPanel(p),first=sourceCatalog(p,notes).movement.posts;
 const second=sourceCatalog(p,notes,{round:2,previous:first}).limits.posts;
 const next=followUpMetric(p,[...first,...second]);
 assert.ok(!next || ![...first,...second].some(x=>x.role==='math'&&x.summary===next.text));
 const state=testState({}),key='d'.repeat(64);
 await state.write(key,{source:'match',input,status:'complete',conversation:{round:2,previous:first},posts:Object.fromEntries(second.map(p=>[p.role,p]))});
 const ctx=await conversationContext(state,{...input,parentKey:key});
 assert.equal(ctx.round,3);assert.equal(ctx.previous.length,10);
 assert.ok(ctx.previous.some(x=>x.summary===first.find(x=>x.role==='math').summary));
});
test('source composition rejects model prose, unknown angles and unresolved citations across scenarios and languages',()=>{
 for(const scenario of ['wide','press','counter'])for(const language of ['en','es','pt'])for(const time of [6,16,29])for(const corrected of [false,true]){
  const p=matchStory({...input,scenario,language,time,corrected}),c=sourceCatalog(p,localPanel(p));
  for(const angle of Object.keys(c)){const posts=selectSourcePosts({angle},c,p);assert.equal(posts.length,5);assert.ok(posts.every(x=>x.cutoff<=time));}
  assert.throws(()=>selectSourcePosts({angle:'movement',claim:'The run caused a goal'},c,p),/outside/);
  assert.throws(()=>selectSourcePosts({angle:'invented'},c,p),/outside/);
 }
 const p=matchStory(input),c=sourceCatalog(p,localPanel(p));c.progression.posts[0].evidence_ids=['future-event'];assert.throws(()=>selectSourcePosts({angle:'progression'},c,p),/source boundary/);
});
test('follow-up adds a different sourced calculation and correction preserves completed passes',()=>{
 const p=matchStory(input),n=localPanel(p),a=sourceCatalog(p,n),b=sourceCatalog(p,n,{round:2,previous:n});
 assert.notEqual(a.movement.posts.find(x=>x.role==='math').summary,b.limits.posts.find(x=>x.role==='math').summary);
 assert.match(b.limits.posts.find(x=>x.role==='math').summary,/13.0 m/);
 const corrected=matchStory({...input,corrected:true}),c=sourceCatalog(corrected,localPanel(corrected));assert.match(c.movement.posts[0].summary,/corrected/);assert.match(c.movement.posts.at(-1).summary,/does not erase/);
});
test('advancing the playhead changes the answer only after a new event is reached',()=>{
 for(const language of ['en','es','pt']){
  const earlier=matchStory({...input,time:22,language}),previous=sourceCatalog(earlier,localPanel(earlier)).movement.posts;
  const waiting=matchStory({...input,time:25,language}),before=sourceCatalog(waiting,localPanel(waiting),{round:2,previous});
  assert.equal(before.next_event,undefined,'unfinished pass must not be reported');
  const later=matchStory({...input,time:26,language}),catalog=sourceCatalog(later,localPanel(later),{round:2,previous});
  const posts=selectSourcePosts({angle:'next_event'},catalog,later);
  assert.equal(posts.length,5);
  assert.ok(posts.every(p=>p.evidence_ids.includes(later.brief.state.seen.at(-1).id)));
  assert.notEqual(posts.find(p=>p.role==='analyst').summary,posts.find(p=>p.role==='guide').summary);
  assert.notEqual(posts.find(p=>p.role==='guide').summary,posts.find(p=>p.role==='presenter').summary);
  if(language==='en')assert.match(posts.find(p=>p.role==='presenter').summary,/3 completed passes, up from 2/);
  const math=posts.find(p=>p.role==='math');
  assert.match(math.summary,/km\/h/);
  assert.match(math.metric_value,/km\/h/);
  assert.match(math.working,/km\/h/);
  assert.ok(!/Defender lateral movement/.test(math.metric_title));
  const stale={...math,working:'|12.0 − 26.0| = 14.0 m',metric_title:'Defender lateral movement',metric_value:'14.0 m'};
  const repaired=reconcileCachedNextEventMath(later,localPanel(later),{round:2,previous},stale);
  assert.equal(repaired.summary,stale.summary);
  assert.deepEqual([repaired.working,repaired.metric_title,repaired.metric_value],[math.working,math.metric_title,math.metric_value]);
  assert.ok(posts.every(p=>p.cutoff===26));
 }
});
test('newcomer teaching follows the reached play and next-event roles add different value',()=>{
 const wide=matchStory({...input,time:16}),press=matchStory({...input,scenario:'press',time:23}),finish=matchStory({...input,time:31});
 const guide=p=>sourceCatalog(p,localPanel(p)).beginner.posts.find(n=>n.role==='guide').summary;
 assert.match(guide(wide),/off-ball run/);
 assert.match(guide(press),/recovery means winning possession back/);
 assert.doesNotMatch(guide(press),/off-ball run/);
 assert.match(guide(finish),/shot is an attempt/);
 for(const language of ['en','es','pt']){
  const earlier=matchStory({...input,time:26,language}),previous=sourceCatalog(earlier,localPanel(earlier)).movement.posts;
  const later=matchStory({...input,time:31,language}),posts=sourceCatalog(later,localPanel(later),{round:2,previous}).next_event.posts;
  const byRole=Object.fromEntries(posts.map(n=>[n.role,n]));
  assert.match(byRole.math.metric_value,/km\/h/);
  assert.notEqual(byRole.math.summary,byRole.analyst.summary);
  assert.notEqual(byRole.guide.summary,byRole.analyst.summary);
  assert.notEqual(byRole.reviewer.summary,byRole.presenter.summary);
  if(language==='en'){
   assert.match(byRole.math.metric_title,/shot-path speed/);
   assert.match(byRole.guide.summary,/shot is the attempt/);
   assert.match(byRole.presenter.summary,/recorded goal/);
  }
 }
});
test('four specialist requests hand off in order, cache the round, and fail closed on an unbounded selection',async()=>{
 const saved=Object.fromEntries(['BTR_GROUNDED_DESK','AZURE_OPENAI_ENDPOINT','AZURE_ACCESS_TOKEN'].map(k=>[k,process.env[k]])),original=global.fetch;
 Object.assign(process.env,{BTR_GROUNDED_DESK:'1',AZURE_OPENAI_ENDPOINT:'https://example.test',AZURE_ACCESS_TOKEN:'test'});
 let count=0,reserved=0;const state=testState({}),desk=new MatchDesk({busy:0,store:{reserve:async()=>{reserved++;return true;}}},{state});
 global.fetch=async()=>{count++;const decision=count<=4?{angle:count===1?'movement':'limits'}:{angle:'invented'};return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(decision)}}]}));};
 try{const events=[],posts=await desk.discuss(input,(t,d)=>events.push({t,d}));assert.equal(count,4);assert.equal(reserved,4);assert.equal(posts.filter(p=>p.engine==='azure_openai').length,4);assert.equal(posts.find(p=>p.role==='math').engine,'calculated');assert.deepEqual(events.filter(e=>e.t==='post').map(e=>e.d.role),['analyst','guide','math','reviewer','presenter']);assert.ok(!events.some(e=>e.t==='draft'));const traces=events.filter(e=>e.t==='trace'&&e.d.action==='model_handoff_completed');assert.deepEqual(traces.map(e=>e.d.role),['analyst','guide','reviewer','presenter']);assert.ok(traces.every(e=>e.d.execution_id&&Number.isFinite(e.d.latency_ms)&&e.d.execution_state==='live'));await desk.discuss(input,()=>{});assert.equal(count,4);
 const parentKey=events.find(e=>e.t==='conversation').d.id,next=await desk.discuss({...input,parentKey,question:'Did it cause the move?'},()=>{});assert.equal(count,5);assert.equal(next.filter(p=>p.engine==='reviewed_fallback').length,4);assert.ok(next.every(p=>!p.summary.includes('Invented goal')));
 }finally{global.fetch=original;for(const[k,v]of Object.entries(saved))if(v===undefined)delete process.env[k];else process.env[k]=v;}
});
test('a saved next-event round repairs stale Vector metadata without another AI request',async()=>{
 const earlierInput={...input,time:22},laterInput={...input,time:26,parentKey:'a'.repeat(64),question:'What changed?'};
 const state=testState({}),earlier=matchStory(earlierInput),previous=sourceCatalog(earlier,localPanel(earlier)).movement.posts;
 await state.write(laterInput.parentKey,{source:'match',input:earlierInput,status:'complete',conversation:{round:1,previous:[]},posts:Object.fromEntries(previous.map(p=>[p.role,p]))});
 const packet=matchStory(laterInput),notes=localPanel(packet),conversation=await conversationContext(state,laterInput),math=sourceCatalog(packet,notes,conversation).next_event.posts.find(p=>p.role==='math');
 const key='b'.repeat(64),stale={...math,metric_title:'Defender lateral movement',metric_value:'14.0 m',working:'|12.0 − 26.0| = 14.0 m'};
 await state.write(key,{source:'match',input:laterInput,status:'complete',conversation,posts:{math:stale},trace:[],metrics:{model_calls:1},claim:{}});
 const prior=process.env.BTR_GROUNDED_DESK;process.env.BTR_GROUNDED_DESK='1';
 try{const desk=new MatchDesk({busy:0,store:{reserve:async()=>{throw Error('Must reuse saved round');}}},{state});const emitted=[];await desk.discuss(laterInput,(type,data)=>emitted.push({type,data}),{key});const saved=(await state.read(key)).value.posts.math;assert.equal(saved.metric_title,math.metric_title);assert.equal(saved.metric_value,math.metric_value);assert.equal(saved.working,math.working);assert.ok(emitted.some(x=>x.type==='post'&&x.data.metric_title===math.metric_title));}finally{if(prior===undefined)delete process.env.BTR_GROUNDED_DESK;else process.env.BTR_GROUNDED_DESK=prior;}
});
test('a new event streams its own calculation first, without flashing the previous metric',async()=>{
 const earlierInput={...input,time:22},laterInput={...input,time:26,parentKey:'e'.repeat(64),question:'What happened next?'};
 const earlier=matchStory(earlierInput),previous=sourceCatalog(earlier,localPanel(earlier)).movement.posts,state=testState({});
 await state.write(laterInput.parentKey,{source:'match',input:earlierInput,status:'complete',conversation:{round:1,previous:[]},posts:Object.fromEntries(previous.map(p=>[p.role,p]))});
 const prior=Object.fromEntries(['BTR_GROUNDED_DESK','AZURE_OPENAI_ENDPOINT','AZURE_ACCESS_TOKEN'].map(k=>[k,process.env[k]])),original=global.fetch;
 Object.assign(process.env,{BTR_GROUNDED_DESK:'1',AZURE_OPENAI_ENDPOINT:'https://example.test',AZURE_ACCESS_TOKEN:'test'});
 global.fetch=async()=>new Response(JSON.stringify({choices:[{message:{content:'{"angle":"next_event"}'}}]}));
 try{
  const emitted=[],desk=new MatchDesk({busy:0,store:{reserve:async()=>true}},{state});
  await desk.discuss(laterInput,(type,data)=>emitted.push({type,data}));
  const math=emitted.filter(x=>x.type==='post'&&x.data.role==='math');
  assert.ok(math.length>=1);
  assert.match(math[0].data.metric_title,/Average ball speed/);
  assert.ok(math.every(x=>x.data.metric_title===math[0].data.metric_title));
 }finally{global.fetch=original;for(const[k,v]of Object.entries(prior))if(v===undefined)delete process.env[k];else process.env[k]=v;}
});
test('interrupted handoff resumes saved specialists and spends only the two unfinished model requests',async()=>{
 const saved=Object.fromEntries(['BTR_GROUNDED_DESK','AZURE_OPENAI_ENDPOINT','AZURE_ACCESS_TOKEN'].map(k=>[k,process.env[k]])),original=global.fetch;
 Object.assign(process.env,{BTR_GROUNDED_DESK:'1',AZURE_OPENAI_ENDPOINT:'https://example.test',AZURE_ACCESS_TOKEN:'test'});
 let calls=0,reservations=0;global.fetch=async()=>{calls++;return new Response(JSON.stringify({choices:[{message:{content:'{"angle":"movement"}'}}]}));};
 const state=testState({}),narrator={busy:0,store:{reserve:async()=>{reservations++;return true;}}},key='c'.repeat(64);
 try{await assert.rejects(()=>new MatchDesk(narrator,{state}).discuss(input,()=>{},{key,interruptAfterSpecialists:true}),/checkpoint/i);assert.equal(calls,2);assert.equal(reservations,2);const emitted=[];const posts=await new MatchDesk(narrator,{state}).discuss(input,(type,data)=>emitted.push({type,data}),{key,interruptAfterSpecialists:true});assert.equal(calls,4);assert.equal(reservations,4);assert.equal(posts.length,5);assert.equal((await state.read(key)).value.status,'complete');assert.deepEqual(emitted.filter(e=>e.type==='trace'&&e.data.action==='saved_model_handoff_reused').map(e=>e.data.role),['analyst','guide']);}finally{global.fetch=original;for(const[k,v]of Object.entries(saved))if(v===undefined)delete process.env[k];else process.env[k]=v;}
});

