import test from 'node:test';
import assert from 'node:assert/strict';
import {DiscussionDesk,DESK_ROLES,VIDEO_EVIDENCE,validatePost} from '../api/desk.mjs';
import {videoLesson,canRevealDiscussion,discussionKey} from '../dist/studio-model.js';
import {createApp} from '../api/server.mjs';

test('video lessons respect the playback cursor and never invent physical measurements',()=>{
 for(const language of ['en','es','pt'])for(const mode of ['fan','beginner','math','analyst','player'])for(const t of [0,.3,2,3.3,4.5,8]){
  const lesson=videoLesson(t,mode,language);assert.ok(lesson.title&&lesson.body);assert.ok(lesson.evidence.every(e=>e.at<=t));
  if(mode==='math'&&t>=.25){assert.ok(lesson.math.includes('÷ 8'));assert.equal(lesson.math.includes('1.20'),t>=4.5);assert.ok(!/\d+\s*km\/h/.test(lesson.math));}
 }
 assert.equal(canRevealDiscussion(3),false);assert.equal(canRevealDiscussion(8),true);assert.equal(canRevealDiscussion(2,true),true);assert.notEqual(discussionKey('en','fan'),discussionKey('en','beginner'));
});
test('public contributions require bounded citations and reject malformed or numeric claims',()=>{
 const good={post:{interpretation:'The visible strike may end the attack.',headline:'Watch the strike',caution:'The result is unclear.',evidence_ids:{primary:'featured-shot',secondary:null}}};assert.equal(validatePost(good).evidence_ids.length,1);assert.throws(()=>validatePost({post:{...good.post,evidence_ids:{primary:'invented'}}}));assert.throws(()=>validatePost({post:{...good.post,interpretation:'Speed is 100 km/h'}}));assert.throws(()=>validatePost({post:{...good.post,interpretation:'The attacker demonstrates tactical intent.'}}));
});
test('three real model calls pass public contributions forward, stream, share concurrent work and cache',async()=>{
 const savedFetch=global.fetch,env={endpoint:process.env.AZURE_OPENAI_ENDPOINT,token:process.env.AZURE_ACCESS_TOKEN};process.env.AZURE_OPENAI_ENDPOINT='https://example.test/';process.env.AZURE_ACCESS_TOKEN='test';
 let calls=0,reservations=0;const cache=new Map(),store={read:async k=>cache.get(k),reserve:async()=>{reservations++;return true;},write:async(k,v)=>cache.set(k,v)},narrator={store,busy:0},desk=new DiscussionDesk(narrator),framesA=[],framesB=[];
 try{global.fetch=async(url,options)=>{const body=JSON.parse(options.body),input=JSON.parse(body.messages[1].content),index=calls++;assert.equal(input.previous_public_contributions.length,index);assert.deepEqual(input.evidence,VIDEO_EVIDENCE);if(index)assert.equal(input.previous_public_contributions.at(-1).role,DESK_ROLES[index-1].id);const content=JSON.stringify({post:{interpretation:['The carry may prepare the strike.','The analyst identifies the carry, but the outcome remains unclear.','Watch the carry and strike; keep the result open.'][index],headline:'Watch the evidence',caution:'No confirmed outcome.',evidence_ids:{primary:'featured-shot',secondary:'featured-keeper'}}});const frames=[];for(let i=0;i<content.length;i+=11)frames.push('data: '+JSON.stringify({choices:[{delta:{content:content.slice(i,i+11)}}]})+'\n\n');frames.push('data: '+JSON.stringify({choices:[{finish_reason:'stop',delta:{}}]})+'\n\ndata: [DONE]\n\n');return new Response(new ReadableStream({async start(controller){for(const frame of frames){controller.enqueue(new TextEncoder().encode(frame));await new Promise(r=>setImmediate(r));}controller.close();}}));};
 const a=desk.discuss({language:'en',mode:'fan'},(type,data)=>framesA.push({type,data}));const b=desk.discuss({language:'en',mode:'fan'},(type,data)=>framesB.push({type,data}));const [pa,pb]=await Promise.all([a,b]);assert.equal(calls,3);assert.equal(reservations,3);assert.equal(narrator.busy,0);assert.deepEqual(pa,pb);assert.ok(pa.every(p=>p.engine==='azure_openai'));for(const frames of [framesA,framesB]){assert.equal(frames.filter(f=>f.type==='post').length,3);assert.ok(frames.findIndex(f=>f.type==='draft')<frames.findIndex(f=>f.type==='post'));assert.equal(frames.at(-1).type,'complete');}
 const cached=[];await desk.discuss({language:'en',mode:'fan'},(type,data)=>cached.push({type,data}));assert.equal(calls,3);assert.equal(cached.filter(f=>f.type==='draft').length,0);assert.ok(cached.filter(f=>f.type==='post').every(f=>f.data.cached));
 }finally{global.fetch=savedFetch;for(const [key,value]of [['AZURE_OPENAI_ENDPOINT',env.endpoint],['AZURE_ACCESS_TOKEN',env.token]])if(value===undefined)delete process.env[key];else process.env[key]=value;}
});
test('model failures withdraw drafts, emit labeled reviewed notes and release shared capacity',async()=>{
 const endpoint=process.env.AZURE_OPENAI_ENDPOINT;process.env.AZURE_OPENAI_ENDPOINT='https://example.test/';let writes=0;const narrator={busy:0,store:{read:async()=>null,reserve:async()=>{throw Error('Budget offline');},write:async()=>writes++}},desk=new DiscussionDesk(narrator),frames=[];
 try{const posts=await desk.discuss({language:'es',mode:'math'},(type,data)=>frames.push({type,data}));assert.equal(posts.length,3);assert.ok(posts.every(p=>p.engine==='reviewed_fallback'));assert.equal(writes,0);assert.equal(narrator.busy,0);assert.equal(frames.at(-1).type,'complete');}finally{if(endpoint===undefined)delete process.env.AZURE_OPENAI_ENDPOINT;else process.env.AZURE_OPENAI_ENDPOINT=endpoint;}
});
test('discussion endpoint validates input and streams public posts with no storage secrets',async()=>{
 const app=createApp({desk:{discuss:async(input,emit)=>{assert.equal(input.mode,'beginner');emit('post',{role:'analyst',summary:'The visible carry.',evidence_ids:['featured-carry']});emit('complete',{posts:1});}}});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${app.server.address().port}/api/desk`;
 try{assert.equal((await fetch(url,{method:'POST',body:JSON.stringify({mode:'invented'})})).status,400);assert.equal((await fetch(url,{method:'POST',headers:{Origin:'https://unrelated.test'},body:'{}'})).status,403);const response=await fetch(url,{method:'POST',body:JSON.stringify({mode:'beginner'})});assert.equal(response.status,200);assert.ok(response.headers.get('content-type').includes('text/event-stream'));const text=await response.text();assert.match(text,/event: post/);assert.match(text,/event: complete/);assert.ok(!text.includes('Bearer'));}finally{app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}
});
