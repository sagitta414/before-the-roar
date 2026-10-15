import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {PITCHSIDE,pitchsideStory} from '../dist/pitchside-story.js';
import {validateMatchPost} from '../api/match-desk.mjs';
const base=process.argv[2]||'http://127.0.0.1:4397';
const health=await (await fetch(base+'/api/health')).json();assert.equal(health.pitchside_video,true);
const input={clip_id:PITCHSIDE.id,time:PITCHSIDE.duration,language:'en',mode:'fan',question:''},packet=pitchsideStory(input),start=performance.now();
const res=await fetch(base+'/api/clip-desk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(90000)});assert.equal(res.status,200);
const reader=res.body.getReader(),decoder=new TextDecoder(),posts=[];let buffer='',drafts=0,complete;
while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let i;while((i=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,i);buffer=buffer.slice(i+2);const type=block.split('\n').find(l=>l.startsWith('event:'))?.slice(6).trim(),line=block.split('\n').find(l=>l.startsWith('data:'));if(!line)continue;const data=JSON.parse(line.slice(5));if(type==='draft')drafts++;if(type==='post')posts.push(data);if(type==='complete')complete=data;if(type==='error')throw Error(data.message);}}
await mkdir('tmp',{recursive:true});await writeFile('tmp/pitchside-smoke.json',JSON.stringify({input,posts,complete},null,2));
assert.ok(complete);assert.equal(posts.length,5);assert.equal(posts.filter(p=>p.engine==='azure_openai').length,3);
assert.equal(posts.find(p=>p.role==='math').engine,'calculated');assert.equal(posts.find(p=>p.role==='reviewer').engine,'evidence_rules');
assert.ok(posts.every(p=>p.cutoff===PITCHSIDE.duration&&p.evidence_ids.every(id=>id.startsWith('pitchside-'))));
for(const p of posts.filter(p=>p.engine==='azure_openai'))validateMatchPost({post:{interpretation:p.summary,headline:p.title,caution:p.caution,evidence_ids:{primary:p.evidence_ids[0],secondary:p.evidence_ids[1]||null}}},packet,p.role);
if(!complete.cached)assert.ok(drafts>0);
console.log(JSON.stringify({passed:true,version:health.version,cached:complete.cached,drafts,elapsed_ms:Math.round(performance.now()-start),roles:posts.map(p=>({role:p.role,engine:p.engine,summary:p.summary}))}));
