import test from 'node:test';import assert from 'node:assert/strict';
import {sourceCatalog,selectSourcePosts} from '../api/grounded-desk.mjs';
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
test('one request composes a round, caches it, and fails closed on hostile model output',async()=>{
 const saved=Object.fromEntries(['BTR_GROUNDED_DESK','AZURE_OPENAI_ENDPOINT','AZURE_ACCESS_TOKEN'].map(k=>[k,process.env[k]])),original=global.fetch;
 Object.assign(process.env,{BTR_GROUNDED_DESK:'1',AZURE_OPENAI_ENDPOINT:'https://example.test',AZURE_ACCESS_TOKEN:'test'});
 let count=0,reserved=0;const state=testState({}),desk=new MatchDesk({busy:0,store:{reserve:async()=>{reserved++;return true;}}},{state});
 global.fetch=async()=>{count++;return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(count===1?{angle:'movement'}:{angle:'limits',prose:'Invented goal'})}}]}));};
 try{const events=[],posts=await desk.discuss(input,(t,d)=>events.push({t,d}));assert.equal(count,1);assert.equal(reserved,1);assert.equal(posts.filter(p=>p.engine==='azure_selection').length,3);assert.ok(!events.some(e=>e.t==='draft'));await desk.discuss(input,()=>{});assert.equal(count,1);
 const parentKey=events.find(e=>e.t==='conversation').d.id,next=await desk.discuss({...input,parentKey,question:'Did it cause the move?'},()=>{});assert.equal(count,2);assert.equal(next.filter(p=>p.engine==='reviewed_fallback').length,3);assert.ok(next.every(p=>!p.summary.includes('Invented goal')));
 }finally{global.fetch=original;for(const[k,v]of Object.entries(saved))if(v===undefined)delete process.env[k];else process.env[k]=v;}
});
test('interrupted source composition resumes the saved selection without a second paid request',async()=>{
 const saved=Object.fromEntries(['BTR_GROUNDED_DESK','AZURE_OPENAI_ENDPOINT','AZURE_ACCESS_TOKEN'].map(k=>[k,process.env[k]])),original=global.fetch;
 Object.assign(process.env,{BTR_GROUNDED_DESK:'1',AZURE_OPENAI_ENDPOINT:'https://example.test',AZURE_ACCESS_TOKEN:'test'});
 let calls=0,reservations=0;global.fetch=async()=>{calls++;return new Response(JSON.stringify({choices:[{message:{content:'{"angle":"movement"}'}}]}));};
 const state=testState({}),narrator={busy:0,store:{reserve:async()=>{reservations++;return true;}}},key='c'.repeat(64);
 try{await assert.rejects(()=>new MatchDesk(narrator,{state}).discuss(input,()=>{},{key,interruptAfterSpecialists:true}),/checkpoint/i);const posts=await new MatchDesk(narrator,{state}).discuss(input,()=>{},{key,interruptAfterSpecialists:true});assert.equal(calls,1);assert.equal(reservations,1);assert.equal(posts.length,5);assert.equal((await state.read(key)).value.status,'complete');}finally{global.fetch=original;for(const[k,v]of Object.entries(saved))if(v===undefined)delete process.env[k];else process.env[k]=v;}
});

