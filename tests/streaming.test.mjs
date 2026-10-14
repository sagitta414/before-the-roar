import test from 'node:test';
import assert from 'node:assert/strict';
import {readCompletion,draftInterpretations} from '../api/streaming.mjs';
import {Narrator,narrativeSchema} from '../api/azure.mjs';
import {generateMatch,initialState,evidencePacket} from '../api/match.mjs';
import {MODES,lesson} from '../dist/learning.js';
import {DialogueState} from '../dist/dialogue.js';
const encoder=new TextEncoder();
const sse=data=>`data: ${JSON.stringify(data)}\r\n\r\n`;
test('draft parser only extracts interpretation paths, including split escapes',()=>{
 const value={beginner:{interpretation:'A pass is like saying "your turn". Olá \n A café.',headline:'Not commentary',evidence_ids:['focus']},math:{interpretation:'Divide successes by attempts.'}};
 const source=JSON.stringify(value);for(let i=1;i<=source.length;i++){const result=draftInterpretations(source.slice(0,i),MODES);for(const[mode,text]of Object.entries(result))assert.ok(value[mode].interpretation.startsWith(text));}
 assert.deepEqual(draftInterpretations(source,MODES),{beginner:value.beginner.interpretation,math:value.math.interpretation});
 assert.deepEqual(draftInterpretations('{"other":{"interpretation":"bad"}}',MODES),{});
});
test('Azure SSE decoding handles byte-split Unicode and delivers content before completion',async()=>{
 const frames=sse({choices:[{delta:{content:'Olá '}}]})+sse({choices:[{delta:{content:'⚽'},finish_reason:'stop'}],usage:{total_tokens:8}})+'data: [DONE]\r\n\r\n';
 const bytes=encoder.encode(frames),updates=[];const body=new ReadableStream({start(c){for(const b of bytes)c.enqueue(Uint8Array.of(b));c.close();}});
 const result=await readCompletion(body,t=>updates.push(t));assert.deepEqual(updates,['Olá ','Olá ⚽']);assert.equal(result.content,'Olá ⚽');assert.equal(result.usage.total_tokens,8);
});
test('truncated and filtered model streams cannot become final narratives',async()=>{
 for(const ending of ['',sse({choices:[{delta:{},finish_reason:'content_filter'}]})+'data: [DONE]\n\n']){const body=new Response(sse({choices:[{delta:{content:'unfinished'}}]})+ending).body;await assert.rejects(()=>readCompletion(body));}
});
test('switching audiences or receiving old chunks never mixes commentary',()=>{const d=new DialogueState();d.begin(900);d.update({cutoff:900,mode:'beginner',text:'A pass…'});assert.equal(d.get('math'),undefined);d.begin(1800);assert.equal(d.update({cutoff:900,mode:'math',text:'old'}),false);assert.equal(d.get('beginner'),undefined);d.update({cutoff:1800,mode:'math',text:'Divide…'});d.finish(1800);assert.equal(d.get('math'),null);assert.equal(d.update({cutoff:1800,mode:'math',text:'late'}),false);d.reset();assert.equal(d.pending,false);});
test('learning math shows real denominators, units and no division by zero in all languages',()=>{const s={passes:{home:8},completed:{home:6},score:{home:1,away:0}},pass={from:[0,0],to:[3,4],travel_seconds:1};for(const language of ['en','es','pt']){const math=lesson('math',s,null,pass,language);assert.match(math.equation,/6 ÷ 8 × 100 ≈ 75%/);assert.match(math.examples[0].equation,/5.0 m/);assert.match(math.examples[1].equation,/18.0 km\/h/);assert.ok(!lesson('math',null,null,null,language).equation.includes('NaN'));const beginner=lesson('beginner',s,{type:'pressure',team:'home'},null,language);assert.ok(beginner.body.length>30);assert.notEqual(beginner.body,math.body);}});
test('selected perspective is generated first and every mode has bounded evidence',()=>{const p={...evidencePacket(generateMatch(1),initialState(),0),priority:'math'},schema=narrativeSchema(p);assert.equal(Object.keys(schema.properties)[0],'math');for(const mode of MODES)assert.deepEqual(schema.properties[mode].properties.evidence_ids.properties.primary.enum,p.facts.map(f=>f.id));});
test('Narrator streams real fragments to concurrent subscribers before validated final output',async()=>{
 const previousFetch=globalThis.fetch,previousEnv={...process.env};process.env.AZURE_OPENAI_ENDPOINT='https://unit.invalid/';process.env.AZURE_ACCESS_TOKEN='unit-token';let finish,entered;const gate=new Promise(r=>finish=r),ready=new Promise(r=>entered=r);let calls=0,reservations=0;
 const values=Object.fromEntries(MODES.map(mode=>[mode,{interpretation:'May help retain the ball.',headline:'A new angle',caution:'Limited synthetic evidence.',evidence_ids:{primary:'score',secondary:null}}]));
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(JSON.parse(options.body).stream,true);return new Response(new ReadableStream({async start(c){c.enqueue(encoder.encode(sse({choices:[{delta:{content:'{"fan":{"interpretation":"May help'}}]})));entered();await gate;const rest=JSON.stringify(values).slice('{"fan":{"interpretation":"May help'.length);c.enqueue(encoder.encode(sse({choices:[{delta:{content:rest},finish_reason:'stop'}]})));c.enqueue(encoder.encode('data: [DONE]\n\n'));c.close();}}));};
 try{const p=evidencePacket(generateMatch(1),initialState(),0),cache=new Map(),store={read:async k=>cache.get(k),reserve:async()=>{reservations++;return true;},write:async(k,v)=>cache.set(k,v)},n=new Narrator(store),a=[],b=[];const first=n.explain(p,d=>a.push(d));await ready;await new Promise(r=>setImmediate(r));assert.ok(a.length);const second=n.explain(p,d=>b.push(d));assert.ok(b.length);finish();const [x,y]=await Promise.all([first,second]);assert.equal(x.engine,'azure_openai');assert.equal(y.audiences.math.observation_source,'calculated');assert.equal(calls,1);assert.equal(reservations,1);assert.ok(x.first_text_ms<=x.latency_ms);const cached=await n.explain(p);assert.equal(cached.cached,true);assert.equal(calls,1);}finally{finish();globalThis.fetch=previousFetch;for(const k of ['AZURE_OPENAI_ENDPOINT','AZURE_ACCESS_TOKEN']){if(previousEnv[k]===undefined)delete process.env[k];else process.env[k]=previousEnv[k];}}
});
