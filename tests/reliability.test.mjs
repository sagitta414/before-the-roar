import test from 'node:test';
import assert from 'node:assert/strict';
import {availabilitySummary,createAvailability} from '../dist/ai-availability.js';
import {sectionFromHash,SECTIONS} from '../dist/navigation.js';
import {descriptionCues} from '../dist/film-captions.js';
import {mediaPlan} from '../dist/film-media.js';
import {PITCHSIDE_BEATS} from '../dist/pitchside-story.js';
const now=Date.parse('2026-10-15T15:00:00Z');
test('restored quota reports no negative balance and a UTC reset, not an available model',()=>{
 const s=availabilitySummary({ai_configured:true,usage:{day:'2026-10-15',used:132,limit:120}},now);
 assert.equal(s.state,'exhausted');assert.equal(s.remaining,0);assert.equal(s.resetAt,Date.parse('2026-10-16T00:00:00Z'));
 assert.equal(availabilitySummary({ai_configured:true},now).state,'unknown');
 assert.equal(availabilitySummary({ai_configured:true,usage:{day:'2026-10-14',used:120,limit:120}},now).state,'unknown');
 assert.equal(availabilitySummary({ai_configured:false},now).state,'offline');
});
test('concurrent availability readers share read-only calls and failures discard stale ready state',async()=>{
 let fail=false,calls=[];const client=createAvailability({now:()=>now,retryDelayMs:1,fetcher:async path=>{calls.push(path);if(fail)throw Error('offline');return {ok:true,json:async()=>path.endsWith('api-config.json')?{baseUrl:'https://test.invalid'}:{ai_configured:true,usage:{day:'2026-10-15',used:10,limit:120}}};}});
 const [a,b]=await Promise.all([client.check(),client.check()]);assert.equal(a.remaining,110);assert.deepEqual(a,b);assert.equal(calls.length,2);await client.check();assert.equal(calls.length,2);
 fail=true;assert.equal((await client.check(true)).state,'unreachable');assert.equal(client.get().remaining,null);assert.ok(calls.every(p=>p.endsWith('api-config.json')||p.endsWith('/api/health')));
});

test('a hung configuration request reaches a retryable terminal state and a fresh check can recover',async()=>{
 let hung=true,phases=[];const client=createAvailability({now:()=>now,timeoutMs:10,retryDelayMs:1,fetcher:async path=>hung?new Promise(()=>{}):{ok:true,json:async()=>path.endsWith('api-config.json')?{baseUrl:'https://test.invalid'}:{ai_configured:true,usage:{day:'2026-10-15',used:10,limit:120}}}});
 client.subscribe(s=>phases.push(s.state));await client.check();assert.equal(client.get().state,'unreachable');assert.ok(phases.includes('retrying'));assert.ok(!client.get().title.includes('Checking'));
 hung=false;assert.equal((await client.check(true)).remaining,110);
});
test('every section is a valid direct route and unknown anchors cannot select arbitrary elements',()=>{
 for(const section of SECTIONS)assert.equal(sectionFromHash('#'+section),section);
 assert.equal(sectionFromHash('#lab'),'lab');assert.equal(sectionFromHash('#film'),'watch');assert.equal(sectionFromHash('#<script>'),'watch');
});
test('descriptions remain in their own shot and retain exact source language and scene offsets',()=>{
 for(const language of ['en','es','pt']){const cues=descriptionCues(mediaPlan({}),language);assert.equal(cues.length,18);
  for(const cue of cues){const source=PITCHSIDE_BEATS.find(b=>b.id===cue.id);assert.equal(cue.start,source.second);assert.equal(cue.text,source.observations[['en','es','pt'].indexOf(language)]);assert.ok(cue.end>cue.start);}
  for(const time of [0,8,16,24,32,40,48,52]){const plan=mediaPlan({clipTime:time,studyScene:true}),local=descriptionCues(plan,language);assert.ok(local.length);assert.ok(local.every(c=>c.start>=0&&c.end<=plan.duration));}
 }
 assert.deepEqual(descriptionCues(mediaPlan({source:'match'})),[]);
});
