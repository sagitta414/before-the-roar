import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {clientIdentity,RateTable} from '../api/request-guard.mjs';
import {createApp} from '../api/server.mjs';
import {Narrator} from '../api/azure.mjs';
import {DiscussionDesk} from '../api/desk.mjs';
import {VisionDesk} from '../api/vision.mjs';
import {AgentState} from '../api/agent-state.mjs';
import {PITCHSIDE} from '../dist/pitchside-story.js';
import {collectSourceGraph} from '../scripts/source-manifest.mjs';
import {generateMatch,initialState,evidencePacket} from '../api/match.mjs';

const waitFor=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(r=>setTimeout(r,5));}throw Error('condition not reached');};
const listen=async app=>{await new Promise(r=>app.server.listen(0,'127.0.0.1',r));return `http://127.0.0.1:${app.server.address().port}`;};
const close=async app=>{app.server.closeAllConnections();await new Promise(r=>app.server.close(r));};

test('rate identity ignores spoofed leading forwarding values and public peers cannot assert a chain',()=>{
 const base={socket:{remoteAddress:'10.0.0.8'},headers:{'x-forwarded-for':'198.51.100.1, 203.0.113.44'}};
 assert.equal(clientIdentity(base),'203.0.113.44');
 assert.equal(clientIdentity({...base,headers:{'x-forwarded-for':'192.0.2.200, 203.0.113.44'}}),'203.0.113.44');
 assert.equal(clientIdentity({socket:{remoteAddress:'203.0.113.90'},headers:{'x-forwarded-for':'198.51.100.8'}}),'203.0.113.90');
});

test('rate table is bounded, reserves atomically and prunes without route-specific traffic',()=>{
 let now=0;const table=new RateTable({clock:()=>now,windowMs:100,maxKeys:2});
 const a=table.reserve('a',1),b=table.reserve('b',1);assert.ok(a&&b);a.commit();b.commit();
 assert.equal(table.reserve('c',1),null);assert.equal(table.size,2);
 now=101;table.prune();assert.equal(table.size,0);assert.ok(table.reserve('c',1));
});

test('six held request bodies reserve match capacity before body parsing',async()=>{
 const app=createApp(),base=await listen(app),url=new URL('/api/runs',base),held=[];
 try{
  for(let i=0;i<6;i++){const req=http.request(url,{method:'POST',headers:{'Content-Length':'100'}});req.on('error',()=>{});req.write('{');held.push(req);}
  await waitFor(()=>app.limits.pendingRuns===6);
  const rejected=await fetch(base+'/api/runs',{method:'POST',body:'{}'});assert.equal(rejected.status,429);
 }finally{for(const req of held)req.destroy();await waitFor(()=>app.limits.pendingRuns===0);await close(app);}
});

test('six held request bodies reserve desk capacity before body parsing',async()=>{
 const app=createApp(),base=await listen(app),url=new URL('/api/desk',base),held=[];
 try{
  for(let i=0;i<6;i++){const req=http.request(url,{method:'POST',headers:{'Content-Length':'100'}});req.on('error',()=>{});req.write('{');held.push(req);}
  await waitFor(()=>app.limits.deskStreams===6);
  const rejected=await fetch(base+'/api/desk',{method:'POST',body:'{}'});assert.equal(rejected.status,429);
 }finally{for(const req of held)req.destroy();await waitFor(()=>app.limits.deskStreams===0);await close(app);}
});

test('match streams enforce per-run and global subscriber slots before SSE headers',async()=>{
 const app=createApp(),base=await listen(app),streams=[];
 try{
  const created=await fetch(base+'/api/runs',{method:'POST',body:JSON.stringify({seed:9,language:'en',speed:30,audience:'fan'})});
  const run=await created.json(),headers={Authorization:'Bearer '+run.token};
  for(let i=0;i<3;i++)streams.push(await fetch(`${base}/api/runs/${run.id}/stream`,{headers}));
  assert.equal(app.limits.runSubscribers,3);
  const fourth=await fetch(`${base}/api/runs/${run.id}/stream`,{headers});assert.equal(fourth.status,429);
 }finally{for(const response of streams)await response.body.cancel();await waitFor(()=>app.limits.runSubscribers===0);await close(app);}
});

test('full-time waits for every earlier checkpoint and publishes insights in order',async()=>{
 let now=1000;const started=[];const narrator={store:{allowance:async()=>null},explain:async packet=>{started.push(packet.cutoff);await new Promise(r=>setTimeout(r,packet.cutoff===5400?1:5));return{engine:'test',audiences:{fan:{headline:'x'}},usage:null};}};
 const app=createApp({narrator,clock:()=>now,desk:{discuss:async()=>[]}}),base=await listen(app);
 try{
  const response=await fetch(base+'/api/runs',{method:'POST',body:JSON.stringify({seed:10,language:'en',speed:90,audience:'fan'})}),created=await response.json(),run=app.runs.get(created.id);
  run.clients.add({writableLength:0,write(){},end(){}});app.tick();now+=60000;app.tick();await run.explanationQueue;
  assert.deepEqual(started,[900,1800,2700,3600,4500,5400]);
  assert.deepEqual(run.insights.map(x=>x.cutoff),started);assert.equal(run.completed,true);
 }finally{await close(app);}
});

test('disconnect aborts ordinary desk work and releases its global stream slot',async()=>{
 let aborted=0;const narrator={store:{allowance:async()=>null},busy:0};
 const desk={discuss:async(_input,_emit,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{aborted++;reject(new DOMException('cancelled','AbortError'));},{once:true}))};
 const app=createApp({narrator,desk}),base=await listen(app),controller=new AbortController();
 try{
  const response=await fetch(base+'/api/desk',{method:'POST',body:JSON.stringify({language:'en',mode:'fan'}),signal:controller.signal});
  assert.equal(response.status,200);assert.equal(app.limits.deskStreams,1);controller.abort();
  await waitFor(()=>aborted===1&&app.limits.deskStreams===0);
 }finally{await close(app);}
});

test('identity failure does not consume narrative, desk or vision allowance',async()=>{
 const prior=process.env.AZURE_OPENAI_ENDPOINT;process.env.AZURE_OPENAI_ENDPOINT='https://example.test/';let reservations=0;
 const store={read:async()=>null,reserve:async()=>{reservations++;return true;},write:async()=>{}};
 const fail=async()=>{throw Error('managed identity unavailable');};
 try{
  const narrator=new Narrator(store,{token:fail});await narrator.explain(evidencePacket(generateMatch(2),initialState(),0,'en'));
  const shell={store,busy:0};await new DiscussionDesk(shell,{token:fail}).discuss({language:'en',mode:'fan'},()=>{});
  await assert.rejects(()=>new VisionDesk(shell,{token:fail}).inspect({clip_id:PITCHSIDE.id,time:12,language:'en'}),/identity/);
  assert.equal(reservations,0);
 }finally{if(prior===undefined)delete process.env.AZURE_OPENAI_ENDPOINT;else process.env.AZURE_OPENAI_ENDPOINT=prior;}
});

test('agent checkpoints expire in the application and infrastructure declares blob lifecycle cleanup',async()=>{
 let now=1000;const directory=await mkdtemp(join(tmpdir(),'btr-retention-')),state=new AgentState({},{directory,clock:()=>now});
 await state.write('retention-test',{status:'complete'});assert.ok(await state.read('retention-test'));now+=25*60*60*1000;assert.equal(await state.read('retention-test'),null);
 await assert.rejects(()=>stat(join(directory,'retention-test.json')));
 const policy=await import('node:fs/promises').then(fs=>fs.readFile(new URL('../infra/storage-retention.bicep',import.meta.url),'utf8'));
 assert.match(policy,/agents\//);assert.match(policy,/daysAfterModificationGreaterThan/);
});

test('evaluation manifest includes transitive model, storage and checkpoint dependencies',async()=>{
 const files=await collectSourceGraph(['scripts/evaluate-agents.mjs']);
 for(const file of ['api/azure.mjs','api/agent-state.mjs','api/match-desk.mjs','api/grounded-desk.mjs','api/streaming.mjs'])assert.ok(files.includes(file),file);
 assert.ok(files.length>20);
});
