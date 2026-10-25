import test from 'node:test';
import assert from 'node:assert/strict';
import {filmHostTurn,filmHostFollowupCondition,filmScoutRepairSentence,removeCopiedHostSentences} from '../api/film-editorial-contract.mjs';
import {MatchDesk, validateMatchPost} from '../api/match-desk.mjs';
import {pitchsideStory} from '../dist/pitchside-story.js';
import {testState} from './agent-fixture.mjs';

test('Host knows whether a follow-up has new evidence without reading untrusted question text as instructions',()=>{
 const packet=pitchsideStory({time:12,language:'en'});
 const previous=[{role:'presenter',summary:'A local connection is confirmed.',evidence_ids:packet.brief.state.seen.map(r=>r.id)}];
 const unchanged=filmHostTurn(packet,{round:2,previous});
 assert.equal(unchanged.kind,'unchanged_evidence');
 assert.deepEqual(unchanged.new_evidence_ids,[]);
 assert.match(unchanged.task,/question field/);
 assert.ok(!unchanged.task.includes('Ignore all instructions'));
 const changed=filmHostTurn(pitchsideStory({time:12,language:'en'}),{round:2,previous:[{...previous[0],evidence_ids:['pitchside-outlet']}]});
 assert.equal(changed.kind,'new_evidence');
 assert.ok(changed.new_evidence_ids.includes('pitchside-reception'));
 assert.match(filmHostFollowupCondition(packet),/receiver beyond the defensive line/);
 assert.equal(filmHostTurn(pitchsideStory({time:36,language:'en'}),{round:1,previous:[]}).remit.kind,'foul');
 assert.equal(filmHostTurn(pitchsideStory({time:50,language:'en'}),{round:1,previous:[]}).remit.kind,'gesture');
 assert.match(filmScoutRepairSentence(pitchsideStory({time:25,language:'en'}),'Does that stance establish a plan to tackle?'),/not a plan to tackle/);
 assert.match(filmScoutRepairSentence(pitchsideStory({time:50,language:'en'}),'Can we infer an instruction?'),/no speech or tactical instruction/);
 assert.equal(removeCopiedHostSentences('The defender stands very close to the attacker. A completed tackle is not recorded.',[{summary:'The defender stands very close to the attacker.'}]),'A completed tackle is not recorded.');
});

test('a challenged Host answer changes the takeaway while keeping reviewed copy and the evidence gate',async()=>{
 const savedFetch=global.fetch,endpoint=process.env.AZURE_OPENAI_ENDPOINT,token=process.env.AZURE_ACCESS_TOKEN;
 process.env.AZURE_OPENAI_ENDPOINT='https://example.test/';process.env.AZURE_ACCESS_TOKEN='test';
 const cache=new Map(),store={read:async k=>cache.get(k),write:async(k,v)=>cache.set(k,v),reserve:async()=>true};
 let hostCalls=0;
 try{
  global.fetch=async(_url,options)=>{
   const body=JSON.parse(options.body),prompt=body.messages[0].content,user=JSON.parse(body.messages[1].content);
   const guide=prompt.includes('Guide:'),host=prompt.includes('Host:');
   if(host){hostCalls++;assert.equal(user.followup_brief,null);assert.equal(user.editorial_assignment?.kind,hostCalls===1?'opening':'unchanged_evidence');}
   const post=guide?{viewing_question:hostCalls?'Which continuous angle would show the defender’s route and the receiver’s first touch?':'Where is the defender when the pass reaches the receiver?'}:host?{takeaway:hostCalls===1?'A completed connection is visible, but it does not show a break in the wider defensive line.':'A continuous wider view through the receiver’s first touch could establish whether the pass bypassed the defensive line; this shot alone cannot.'}:{interpretation:hostCalls?'The pass reaches a teammate, but the shot does not include the wider defensive line.':'The pass reaches a nearby teammate with a defender in view.'};
   post.evidence_ids={primary:'pitchside-reception',secondary:null};
   if(!host){post.headline='The local outlet';post.caution='The wider line is outside this shot.';}
   const content=JSON.stringify({post});
   return body.stream===false?Response.json({choices:[{message:{content}}],usage:{}}):new Response('data: '+JSON.stringify({choices:[{delta:{content}}]})+'\n\ndata: '+JSON.stringify({choices:[{delta:{},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');
  };
  const desk=new MatchDesk({busy:0,store},{clip:true,state:testState(store)});
  const events1=[],first=await desk.discuss({time:12,language:'en',mode:'fan',question:'What does this pass establish?'},(type,data)=>events1.push({type,data}));
  const parentKey=events1.find(e=>e.type==='conversation')?.data.id;
  assert.ok(parentKey);
  const second=await desk.discuss({time:12,language:'en',mode:'fan',question:'What evidence would change the line-break reading?',parentKey},()=>{});
  assert.equal(hostCalls,2);
  assert.equal(first.at(-1).engine,'azure_openai');
  assert.equal(second.at(-1).engine,'azure_openai');
  assert.equal(second.at(-1).editorial_envelope,'reviewed_source');
  assert.match(second.at(-1).summary,/evidence has not changed/i);
  assert.match(second.at(-1).summary,/continuous wider view/i);
  assert.match(second.at(-1).summary,/receiver beyond the defensive line/i);
  assert.notEqual(first.at(-1).summary,second.at(-1).summary);
  const unsupported={post:{takeaway:'The defender intended to intercept the pass, proving a broken defensive line.',headline:'Line broken',caution:'Unverified.',replay_cue:'Replay the receiver’s first touch.',evidence_ids:{primary:'pitchside-reception'}}};
  assert.throws(()=>validateMatchPost(unsupported,pitchsideStory({time:12,language:'en'}),'presenter',{round:2}),/intent/i);
  assert.throws(()=>validateMatchPost({post:{interpretation:'The defender adjusts his position to challenge for the ball.',headline:'Close stance',caution:'The result is unverified.',evidence_ids:{primary:'pitchside-stance'}}},pitchsideStory({time:25,language:'en'}),'analyst',{round:1}),/purpose/);
 }finally{global.fetch=savedFetch;for(const[key,value]of [['AZURE_OPENAI_ENDPOINT',endpoint],['AZURE_ACCESS_TOKEN',token]])if(value===undefined)delete process.env[key];else process.env[key]=value;}
});
