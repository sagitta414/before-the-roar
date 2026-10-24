import test from 'node:test';
import assert from 'node:assert/strict';
import {filmEvidence,followupBrief,filmFollowupPolicy} from '../api/film-followup.mjs';
import {pitchsideStory} from '../dist/pitchside-story.js';
import {executionProfile} from '../dist/execution-profile.js';

test('a question about the current film shot cannot import earlier action',()=>{
 const packet=pitchsideStory({time:25,language:'en'});
 const records=filmEvidence(packet,'Did the defender intend to win the ball?');
 assert.ok(records.length);assert.ok(records.every(e=>e.second>=24&&e.second<=25));
 assert.ok(filmEvidence(packet,'Compare earlier shots across the whole film').length>records.length);
});
test('unchanged evidence creates three distinct follow-up jobs without invented events',()=>{
 const packet=pitchsideStory({time:25,language:'en'}),conversation={previous:[{cutoff:25,role:'analyst',summary:'An earlier interpretation.'}]};
 const briefs=['analyst','guide','presenter'].map(role=>followupBrief(packet,conversation,'Can the evidence establish intent?',role));
 assert.equal(new Set(briefs.map(b=>b.task)).size,3);
 for(const b of briefs){assert.deepEqual(b.new_evidence_ids,[]);assert.match(b.evidence_change,/unchanged/);}
 assert.match(briefs[0].task,/Retract/);assert.match(briefs[1].task,/comparison/);assert.match(briefs[2].task,/corrected audience line/);
});
test('new evidence is bounded by the earlier and current cutoff',()=>{
 const packet=pitchsideStory({time:26,language:'en'}),b=followupBrief(packet,{previous:[{cutoff:24} ]},'What changed?','analyst');
 assert.ok(b.new_evidence_ids.length);assert.ok(b.current_observations.every(e=>e.second>=24&&e.second<=26));
});
test('follow-up policy does not force an invented football consequence',()=>{
 const p=filmFollowupPolicy({language:'en',mode:'analyst'},'presenter','Conversational');
 assert.match(p,/Do not force a new football consequence/);assert.match(p,/prior_round/);assert.match(p,/takeaway/);
});
test('execution profiles distinguish film, synthetic match and local uploads',()=>{
 assert.match(executionProfile('pitchside').heading,/3 MODEL/);assert.match(executionProfile('pitchside').detail,/Check applies evidence rules/);assert.match(executionProfile('pitchside').detail,/up to 3 editorial retries/);
 assert.match(executionProfile('match').heading,/4 MODEL/);assert.match(executionProfile('upload').heading,/LOCAL/);
 for(const source of ['match','pitchside'])assert.match(executionProfile(source).detail,/0 new calls/);
});
import {validateMatchPost} from '../api/match-desk.mjs';

test('persisted round cutoff prevents old observations being presented as new',()=>{
 const packet=pitchsideStory({time:25,language:'en'}),brief=followupBrief(packet,{previousCutoff:25,previous:[{role:'analyst',summary:'Saved without a per-post cutoff.'}]},'What changed?','analyst');
 assert.deepEqual(brief.new_evidence_ids,[]);assert.equal(brief.previous_cutoff,25);
});

test('follow-up validation rejects earlier-shot citations and does not prepend the opening lesson',()=>{
 const original=pitchsideStory({time:25,language:'en'}),packet={...original,evidence:filmEvidence(original,'What should I compare?')};
 const raw={post:{viewing_question:'Where is the ball relative to the defender before and after the next touch?',headline:'Compare the next touch',caution:'The outcome is not established.',evidence_ids:{primary:packet.evidence[0].id,secondary:null}}};
 const answer=validateMatchPost(raw,packet,'guide',{round:2});assert.equal(answer.summary,raw.post.viewing_question);
 raw.post.evidence_ids.primary=original.evidence.find(e=>e.second<24).id;
 assert.throws(()=>validateMatchPost(raw,packet,'guide',{round:2}),/Citation outside/);
});
import {MatchDesk} from '../api/match-desk.mjs';
import {testState} from './agent-fixture.mjs';

test('film editorial repair retains the saved round, distinct task and current-shot evidence',async()=>{
 const oldFetch=global.fetch,oldEndpoint=process.env.AZURE_OPENAI_ENDPOINT,oldToken=process.env.AZURE_ACCESS_TOKEN;
 process.env.AZURE_OPENAI_ENDPOINT='https://example.test';process.env.AZURE_ACCESS_TOKEN='test';
 const state=testState({}),parent='b'.repeat(64),input={time:25,language:'en',mode:'analyst',clip_id:'pitchside-minute-veo-quality-v1'};
 await state.write(parent,{source:'pitchside',input,status:'complete',conversation:{round:1},posts:{analyst:{role:'analyst',summary:'The defender bends low and adjusts sideways.'},guide:{role:'guide',summary:'What happens next?'},presenter:{role:'presenter',summary:'Follow the next touch.'}}});
 const captured=[];global.fetch=async(url,options)=>{const body=JSON.parse(options.body),data=JSON.parse(body.messages[1].content);captured.push(data);
  const role=body.messages[0].content.includes('Guide:')?'guide':body.messages[0].content.includes('Host:')?'presenter':'analyst';
  const post={headline:'Read the duel',caution:'The purpose is not established.',evidence_ids:{primary:data.evidence[0].id,secondary:null},...(role==='guide'?{viewing_question:'Where is the ball relative to the defender before and after the next touch?'}:role==='presenter'?{takeaway:'Describe the duel without assigning a purpose: intent is not established by the visible stance.',replay_cue:'Replay the ball position before and after the next touch.'}:{interpretation:'Intent is not established by the visible posture; an action and its purpose are different claims.'})};
  if(captured.length===1)post.evidence_ids.primary='not-in-this-shot';
  const result={choices:[{finish_reason:"stop",message:{content:JSON.stringify({post})},delta:{content:JSON.stringify({post})}}],usage:{prompt_tokens:10,completion_tokens:10}};
  return body.stream?new Response('data: '+JSON.stringify(result)+'\n\ndata: [DONE]\n\n'):Response.json(result);
 };
 try{
  const desk=new MatchDesk({busy:0,store:{reserve:async()=>true}},{clip:true,state});await desk.discuss({...input,parentKey:parent,question:'Can the evidence establish intent?'},()=>{});
  assert.ok(captured.length>=4,'a rejected citation must trigger a repair');
  for(const data of captured){assert.equal(data.conversation.round,2);assert.equal(data.prior_round.length,3);assert.ok(data.followup_brief.task);assert.equal(data.guide_definition,undefined);assert.ok(data.evidence.every(e=>e.second>=24&&e.second<=25));assert.deepEqual(data.followup_brief.new_evidence_ids,[]);}
 }finally{global.fetch=oldFetch;for(const[k,v]of [['AZURE_OPENAI_ENDPOINT',oldEndpoint],['AZURE_ACCESS_TOKEN',oldToken]])if(v===undefined)delete process.env[k];else process.env[k]=v;}
});
