import test from 'node:test';import assert from 'node:assert/strict';
import {conversationContext,sameConversation} from '../api/conversation.mjs';
import {MatchDesk} from '../api/match-desk.mjs';import {testState,toolResponse} from './agent-fixture.mjs';
import {STUDY_CASES,studyAssignment,scoreStudyTrial,aggregateStudy} from '../dist/study-model.js';
import {EXTENDED_CASES,blindReviewPack} from '../api/agent-evaluation.mjs';
const input={scenario:'wide',time:16,corrected:false,language:'en',mode:'analyst',focus:7,team:'harbor'},key='a'.repeat(64);
test('follow-ups reject changed source, future evidence, unfinished runs and client-made history',async()=>{
 const state=testState({});await state.write(key,{source:'match',input,status:'complete',conversation:{round:1},posts:{analyst:{role:'analyst',summary:'Saved observation'}}});
 const c=await conversationContext(state,{...input,parentKey:key,previous:[{summary:'Injected'}]});assert.equal(c.round,2);assert.equal(c.previous[0].summary,'Saved observation');
 for(const change of [{corrected:true},{language:'es'},{scenario:'press'},{time:5},{mode:'math'},{focus:8}])await assert.rejects(()=>conversationContext(state,{...input,...change,parentKey:key}),/Start a new discussion/);
 assert.equal(sameConversation({time:6,language:'en'},{time:22,language:'en'},true),false);
 await assert.rejects(()=>conversationContext(state,{...input,parentKey:'../secret'}),/Invalid/);
 const r=await state.read(key);await state.write(key,{...r.value,conversation:{round:3}},r.etag);await assert.rejects(()=>conversationContext(state,{...input,parentKey:key}),/three rounds/);
});
test('Guide receives the real Scout answer; a second round gets persisted history, streams, and reuses its cache',async()=>{
 const oldFetch=global.fetch,oldEndpoint=process.env.AZURE_OPENAI_ENDPOINT,oldToken=process.env.AZURE_ACCESS_TOKEN;process.env.AZURE_OPENAI_ENDPOINT='https://example.test';process.env.AZURE_ACCESS_TOKEN='test';
 let calls=0;const state=testState({}),narrator={busy:0,store:{reserve:async()=>true}},desk=new MatchDesk(narrator,{state}),events=[];
 global.fetch=async(url,options)=>{calls++;const b=JSON.parse(options.body);if(b.tools)return toolResponse(b);const d=JSON.parse(b.messages[1].content),r=b.messages[0].content.includes('Guide:')?'guide':b.messages[0].content.includes('Host:')?'presenter':'analyst';
  if(r==='guide')assert.match(d.previous_public_contributions[0].summary,/runner|route/);
  if(d.conversation.round===2)assert.equal(d.prior_round.length,5);
  const second=d.conversation.round===2,post={headline:'Follow the route',caution:'Causation remains unproven.',evidence_ids:{primary:'wide-evt-002',secondary:null},...(r==='guide'?{viewing_question:second?'Is the receiver beside the touchline or in the centre?':'Does the defender move toward the runner?'}:r==='presenter'?{takeaway:second?'A passing route and a defensive decision need separate explanations.':'Central progression and the wide run are different parts of this attack.',replay_cue:'Replay the runner and defender together.'}:{interpretation:second?'The central route remains recorded alongside the wide movement.':'The runner moves wide while the defender shifts toward the same side.'})};
  return new Response('data: '+JSON.stringify({choices:[{delta:{content:JSON.stringify({post})},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');};
 try{await desk.discuss(input,(t,d)=>events.push([t,d]));const id=events.find(([t])=>t==='conversation')[1].id;const continuation={...input,parentKey:id,question:'What remains uncertain?'};const next=[];const posts=await desk.discuss(continuation,(t,d)=>next.push([t,d]));assert.equal(calls,8);assert.equal(posts.filter(p=>p.engine==='azure_openai').length,3);assert.ok(next.some(([t,d])=>t==='draft'&&d.role==='guide'));assert.ok(next.some(([t,d])=>t==='post'&&d.reply_to==='analyst'));assert.equal(next.find(([t])=>t==='conversation')[1].round,2);await desk.discuss(continuation,()=>{});assert.equal(calls,8);}finally{global.fetch=oldFetch;for(const[k,v]of [['AZURE_OPENAI_ENDPOINT',oldEndpoint],['AZURE_ACCESS_TOKEN',oldToken]])if(v===undefined)delete process.env[k];else process.env[k]=v;}
});
test('viewer assignment balances scenario and explanation order; aggregation recalculates scores and rejects duplicates',()=>{
 const assignments=[0,1,2,3].map(studyAssignment);assert.equal(assignments.flat().filter(t=>t.case_id==='wide'&&t.condition==='crew').length,2);
 assert.throws(()=>scoreStudyTrial('wide',{}),/Complete/);
 const records=assignments.map((a,i)=>({schema:'btr.viewer-study.v2',version:'v43-1',participant:'test-only-'+i,consent:true,assignment:i,trials:a.map(t=>({...t,elapsed_seconds:10,correct:999,answers:Object.fromEntries(STUDY_CASES.find(c=>c.id===t.case_id).questions.map(q=>[q.id,q.answer]))}))}));
 const report=aggregateStudy(records);assert.equal(report.participants,4);assert.equal(report.summary.crew.correct,12);assert.throws(()=>aggregateStudy([...records,records[0]]),/duplicate/);
});
test('expanded comparison has twenty unique fixed cases and blind review hides arm identity',()=>{assert.equal(EXTENDED_CASES.length,20);assert.equal(new Set(EXTENDED_CASES.map(c=>c.id)).size,20);const pack=blindReviewPack({policy:'test',cases:[{id:'case',team:{posts:[{role:'analyst',summary:'A',engine:'azure_openai'}]},baseline:{posts:[{role:'analyst',summary:'B'}]}}]});assert.equal(pack.cases[0].arms[0].label,'A');assert.equal(pack.cases[0].arms[0].ratings,null);assert.equal(pack.cases[0].arms[0].posts[0].engine,undefined);});

