import {testState,toolResponse} from './agent-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {PITCHSIDE,PITCHSIDE_BEATS,clipClock,pitchsideStory,pitchsidePanel,pitchsideKey,pitchsideExport,clipDiscussionMatches,clipEditorialCutoff} from '../dist/pitchside-story.js';
import {MatchDesk,validateMatchPost,repeatsInsight,repeatsFilmUncertainty,filmHostSkipsCheck} from '../api/match-desk.mjs';
import {createApp} from '../api/server.mjs';

test('crossing a film cut cannot retain an earlier discussion or future reply',()=>{
 assert.equal(clipDiscussionMatches(21,8),false);assert.equal(clipDiscussionMatches(23,22),true);assert.equal(clipDiscussionMatches(24,22),false);assert.equal(clipDiscussionMatches(21,22),false);assert.equal(clipDiscussionMatches(59,60),false);assert.equal(clipDiscussionMatches(60,60),true);
});
test('automatic commentary checkpoints stay inside the visible scene without increasing calls',()=>{
 assert.equal(PITCHSIDE.editorialCheckpoints.length,4);assert.equal(clipEditorialCutoff(7),6);assert.equal(clipEditorialCutoff(21),undefined);assert.equal(clipEditorialCutoff(23),22);assert.equal(clipEditorialCutoff(24),undefined);assert.equal(clipEditorialCutoff(60),60);
});

test('pitchside annotations, explanations and exports respect each clip cutoff',()=>{
 const cutoffs=[0,...PITCHSIDE_BEATS.flatMap(b=>[Math.max(0,b.second-.01),b.second]),PITCHSIDE.duration];
 for(const language of ['en','es','pt'])for(const mode of ['fan','beginner','math','analyst','player'])for(const time of cutoffs){
  const p=pitchsideStory({time,language,mode}),out=pitchsideExport({time,language,mode});
  assert.equal(p.time,time);assert.ok(p.body&&p.title);assert.ok(p.evidence.every(e=>e.second<=time));assert.equal(out.clip.id,PITCHSIDE.id);assert.deepEqual(out.evidence,p.evidence);
  assert.ok(pitchsidePanel(p).every(post=>post.evidence_ids.every(id=>p.evidence.some(e=>e.id===id))));
  assert.deepEqual(p.evidence.map(e=>e.id),PITCHSIDE_BEATS.filter(b=>b.second<=time).map(b=>b.id));assert.equal(p.complete,time>=PITCHSIDE.duration-.05);
  assert.ok(!/km\/h/.test(p.equation));assert.ok(out.overlay.end_seconds<=PITCHSIDE.duration);
 }
 const p=pitchsideStory({time:2});assert.ok(!p.recap.includes('frame'));assert.ok(!p.recap.includes('goalkeeper'));
 const raw={post:{interpretation:'The attacker touches the ball.',headline:'Watch the touch',caution:'Distance is unknown.',evidence_ids:{primary:'pitchside-touch',secondary:null}}};
 assert.ok(validateMatchPost(raw,p,'analyst'));
 for(const id of ['featured-shot','wide-evt-002','pitchside-frame'])assert.throws(()=>validateMatchPost({post:{...raw.post,evidence_ids:{primary:id}}},p,'analyst'),/cutoff/);
});
test('film follow-up rejects stationary-defender claims absent from reviewed frames and repeated host synthesis',()=>{
 const packet=pitchsideStory({time:12,language:'en'}),post={interpretation:'The nearby defender does not change position significantly as the pass reaches a teammate.',headline:'A steady defence',caution:'The wider defensive line is outside this shot.',evidence_ids:{primary:'pitchside-reception',secondary:null}};
 assert.throws(()=>validateMatchPost({post},packet,'analyst',{round:2,question:'What evidence would change this explanation?'}),/unchanged defender movement/);
 assert.throws(()=>validateMatchPost({post:{...post,interpretation:'The defender may not be fully prepared to contest, giving the receiver a potential advantage.'}},packet,'analyst',{round:1}),/player readiness or advantage/);
 assert.throws(()=>validateMatchPost({post:{...post,interpretation:'The receiver’s touch indicates control and readiness to progress play.'}},packet,'analyst',{round:1}),/player readiness or advantage/);
 assert.throws(()=>validateMatchPost({post:{...post,interpretation:'What options does the receiver have after making the pass?',viewing_question:'What options does the receiver have after making the pass?'}},packet,'guide',{round:1}),/receiver is not the recorded passer/);
 assert.throws(()=>validateMatchPost({post:{...post,interpretation:'What positioning options does the receiver have after this pass?',viewing_question:'What positioning options does the receiver have after this pass?'}},packet,'guide',{round:2,question:'What evidence would change this explanation?'}),/concrete evidence comparison/);
 assert.throws(()=>validateMatchPost({post:{...post,interpretation:'How does the defender’s position compare to the receiver’s as the ball arrives?',viewing_question:'How does the defender’s position compare to the receiver’s as the ball arrives?'}},packet,'guide',{round:2,question:'What evidence would change this explanation?'}),/concrete evidence comparison/);
 assert.equal(repeatsInsight('The pass indicates a defensive presence, yet the overall defensive shape and effectiveness cannot be determined from this moment.',[{summary:'The attacker passes to a nearby teammate while a defender is positioned close, indicating a defensive presence. The defensive shape and overall effectiveness cannot be assessed from this moment.'}]),true);
 assert.equal(repeatsFilmUncertainty('The completed pass indicates a connection, but the defender’s control over space remains unverified.',[{role:'analyst',summary:'The attacker passes to a teammate with a nearby defender present. The defender’s control is unknown.'}]),true);
 assert.equal(repeatsFilmUncertainty('The next touch will test whether the receiver can turn away from the defender.',[{role:'analyst',summary:'The attacker passes to a teammate with a nearby defender present.'}]),false);
 assert.equal(filmHostSkipsCheck('The outlet offers a passing option; the receiver can advance, pass again or hold.',packet),true);
 assert.equal(filmHostSkipsCheck('The local outlet is confirmed, but the wider defensive line is outside this shot; the next touch can test the exit.',packet),false);
});

test('clip cache keys vary with cutoff, language, mode and question',()=>{
 const input={time:8,language:'en',mode:'fan',question:''};const variants=[input,...Object.entries({time:4,language:'es',mode:'math',question:'What happened?'}).map(([k,v])=>({...input,[k]:v}))];assert.equal(new Set(variants.map(pitchsideKey)).size,variants.length);
});

test('clip desk uses only this film, streams tool-backed model calls and reuses cached contributions',async()=>{
 const savedFetch=global.fetch,endpoint=process.env.AZURE_OPENAI_ENDPOINT,token=process.env.AZURE_ACCESS_TOKEN;process.env.AZURE_OPENAI_ENDPOINT='https://example.test/';process.env.AZURE_ACCESS_TOKEN='test';
 const cache=new Map();let calls=0,reserved=0;const narrator={busy:0,store:{read:async k=>cache.get(k),write:async(k,v)=>cache.set(k,v),reserve:async()=>{reserved++;return true;}}},desk=new MatchDesk(narrator,{clip:true,state:testState(narrator.store)}),frames=[];
 try{
  global.fetch=async(url,options)=>{calls++;const body=JSON.parse(options.body);if(body.tools)return toolResponse(body);const prompt=body.messages[0].content,data=JSON.parse(body.messages[1].content);assert.ok(prompt.includes('manually reviewed annotations'));assert.ok(prompt.includes('NOT continuous match play'));assert.ok(data.evidence.every(e=>e.id.startsWith('pitchside-')&&e.second<=2));
   if(prompt.includes('Host:'))assert.equal(data.previous_public_contributions.length,4);
   const post={interpretation:prompt.includes('Guide:')?pitchsideStory().guideDefinition+' Where is the defender looking?':prompt.includes('Host:')?'Access to the next touch matters more than who appears ahead of the duel.':'Watch the defender adjust beside the touch.',replay_cue:'Replay the attacker touching the ball beside the defender.',headline:'A close duel',caution:'Speed cannot be measured.',evidence_ids:{primary:'pitchside-touch',secondary:null}};
   const dataText=JSON.stringify({post}),chunks=[];for(let i=0;i<dataText.length;i+=16)chunks.push('data: '+JSON.stringify({choices:[{delta:{content:dataText.slice(i,i+16)}}]})+'\n\n');chunks.push('data: '+JSON.stringify({choices:[{delta:{},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');return new Response(chunks.join(''));
  };
  const input={time:2,language:'en',mode:'fan'},a=await desk.discuss(input,(type,data)=>frames.push({type,data}));assert.equal(calls,3);assert.equal(reserved,3);assert.equal(a.length,5);assert.equal(a.filter(p=>p.engine==='azure_openai').length,3);assert.ok(frames.some(f=>f.type==='draft'));assert.equal(narrator.busy,0);
  await desk.discuss(input,()=>{});assert.equal(calls,3);
  await desk.discuss({...input,time:0},()=>{});assert.equal(calls,3);
 }finally{global.fetch=savedFetch;for(const [key,value]of [['AZURE_OPENAI_ENDPOINT',endpoint],['AZURE_ACCESS_TOKEN',token]])if(value===undefined)delete process.env[key];else process.env[key]=value;}
});
test('a rejected film Host draft gets one bounded editorial revision',async()=>{
 const savedFetch=global.fetch,endpoint=process.env.AZURE_OPENAI_ENDPOINT,token=process.env.AZURE_ACCESS_TOKEN;
 process.env.AZURE_OPENAI_ENDPOINT='https://example.test/';process.env.AZURE_ACCESS_TOKEN='test';
 const cache=new Map();let calls=0,reserved=0,repairSeen=false;
 const store={read:async k=>cache.get(k),write:async(k,v)=>cache.set(k,v),reserve:async()=>{reserved++;return true;}},narrator={busy:0,store};
 try{
  global.fetch=async(_url,options)=>{
   calls++;const body=JSON.parse(options.body),isHost=body.messages[0].content.includes('Host:'),repair=body.stream===false;
   if(repair){repairSeen=true;assert.match(body.messages[1].content,/Host must state the football implication/);}
   const post={interpretation:isHost?(repair?'The next touch tests whether the attacker can keep the ball away from the nearby defender.':'The importance of the attacker touching the ball is clear.'):body.messages[0].content.includes('Guide:')?'A duel is a contest between an attacker and a defender. Where is the ball after the touch?':'The attacker touches the ball beside a defender.',viewing_question:'Where is the ball after the touch?',takeaway:repair?'The next touch tests whether the attacker can keep the ball away from the nearby defender.':'The importance of the attacker touching the ball is clear.',replay_cue:'Replay the attacker touching the ball beside the defender.',headline:'The close duel',caution:'The wider action is outside this shot.',evidence_ids:{primary:'pitchside-touch',secondary:null}};
   const content=JSON.stringify({post});
   return repair?new Response(JSON.stringify({choices:[{message:{content}}],usage:{}}),{headers:{'Content-Type':'application/json'}}):new Response('data: '+JSON.stringify({choices:[{delta:{content}}]})+'\n\ndata: '+JSON.stringify({choices:[{delta:{},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');
  };
  const desk=new MatchDesk(narrator,{clip:true,state:testState(store)}),posts=await desk.discuss({time:2,language:'en',mode:'fan'},()=>{});
  assert.equal(posts.at(-1).engine,'azure_openai');assert.equal(calls,4);assert.equal(reserved,4);assert.equal(repairSeen,true);
 }finally{global.fetch=savedFetch;for(const [key,value]of [['AZURE_OPENAI_ENDPOINT',endpoint],['AZURE_ACCESS_TOKEN',token]])if(value===undefined)delete process.env[key];else process.env[key]=value;}
});

test('clip API rejects wrong assets and cutoffs before spending, accepts an empty evidence window',async()=>{
 const app=createApp({narrator:{busy:0,store:{read:async()=>null,reserve:async()=>assert.fail('No model call before evidence')}}});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${app.server.address().port}/api/clip-desk`;
 try{for(const input of [{clip_id:'featured',time:8},{clip_id:PITCHSIDE.id,time:PITCHSIDE.duration+1},{clip_id:PITCHSIDE.id,time:-1}])assert.equal((await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})).status,400);
 const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clip_id:PITCHSIDE.id,time:0})});assert.equal(res.status,200);const stream=await res.text();assert.ok(stream.includes('evidence-cutoff'));assert.ok(stream.includes('"model_calls":0'));assert.ok(!stream.includes('featured-shot'));
 }finally{await new Promise(r=>app.server.close(r));}
});

test('film clocks roll over and replaying never carries future evidence backwards',()=>{
 assert.equal(clipClock(59.9),'00:59');assert.equal(clipClock(60),'01:00');assert.equal(clipClock(61),'01:01');
 const end=pitchsideStory({time:PITCHSIDE.duration+10});assert.equal(end.time,PITCHSIDE.duration);assert.equal(end.evidence.length,PITCHSIDE_BEATS.length);assert.ok(end.equation.includes('Completed receptions in this scene = 1'));assert.ok(!end.equation.includes('100%'));
 const replay=pitchsideStory({time:2});assert.ok(replay.evidence.every(e=>e.second<=2));assert.equal(replay.complete,false);assert.ok(end.evidence.length>replay.evidence.length);
 for(const beat of PITCHSIDE_BEATS){assert.equal(beat.titles.length,3);assert.equal(beat.observations.length,3);assert.ok(beat.second<PITCHSIDE.duration);}
});
