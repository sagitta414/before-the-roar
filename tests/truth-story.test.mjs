import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENARIOS} from '../dist/engine.js';
import {truthStory,truthStoryPacket} from '../dist/truth-story-model.js';

test('the correction changes one movement claim and preserves recorded event facts',()=>{
 const s=SCENARIOS[0],before=truthStory(s,18),after=truthStory(s,18,true);
 assert.equal(before.changed,false);assert.equal(after.changed,true);
 assert.equal(after.audit.withdrawn,1);assert.equal(after.audit.supported,before.audit.supported-1);
 assert.match(after.originalLine,/13\.2 m/);assert.match(after.currentLine,/no lateral movement/);
 assert.equal(before.factLine,after.factLine);assert.equal(before.outcome,after.outcome);
 for(const id of ['passes','speed','goals'])assert.deepEqual(before.audit.rows.find(r=>r.id===id),after.audit.rows.find(r=>r.id===id));
 const outcome=truthStory(s,31,true);assert.equal(outcome.resolved,true);assert.equal(outcome.audit.reference.metrics.goals,1);assert.match(outcome.outcome,/goal event remains valid/);
});
test('early narratives do not announce a future shot or withdraw an unasserted movement',()=>{
 for(const s of SCENARIOS){const end=s.actions.find(e=>e.type==='shot').end;for(const t of [0,4,8,end-.1]){
  const n=truthStory(s,t,true);assert.equal(n.resolved,false);assert.match(n.outcome,/beyond this evidence cutoff/);
 }}
 const early=truthStory(SCENARIOS[0],8,true);assert.equal(early.changed,false);assert.equal(early.audit.withdrawn,0);assert.equal(early.audit.rows.find(r=>r.id==='movement').status,'pending');
 const between=truthStory(SCENARIOS[2],8);assert.match(between.observation,/recovery is recorded/);assert.match(between.observation,/first forward pass has not yet completed/);
});
test('every exported claim source resolves to records at or before the cutoff',()=>{
 for(const s of SCENARIOS)for(const t of [0,3.2,8,10,15.9,18.4,28,31,36])for(const corrected of [false,true]){
  const packet=truthStoryPacket(s,t,corrected),ids=new Set(packet.evidence.map(e=>e.id));
  for(const row of packet.checks)for(const id of [...row.source,...row.current_source])assert.ok(ids.has(id),`${s.id} ${t}: missing ${id}`);
  for(const e of packet.evidence){if(e.record_type==='event')assert.ok(e.end<=t);if(e.record_type==='tracking')assert.ok(e.second<=t);if(e.record_type==='coverage'){assert.equal(e.through_second,t);assert.ok(e.event_ids.every(id=>ids.has(id)));}}
 }
 const revised=truthStoryPacket(SCENARIOS[0],18,true),row=revised.checks.find(r=>r.id==='movement');
 assert.notDeepEqual(row.source,row.current_source);assert.equal(revised.evidence.find(e=>e.id===row.current_source[0]).revision,2);
});
test('alternative viewpoints personalize the prose without changing evidence or outcomes',()=>{
 const s=SCENARIOS[0],fan=truthStoryPacket(s,18,true,'fan'),analyst=truthStoryPacket(s,18,true,'analyst');
 assert.notEqual(fan.narrative.observation,analyst.narrative.observation);assert.deepEqual(fan.checks,analyst.checks);assert.deepEqual(fan.evidence,analyst.evidence);assert.equal(fan.narrative.outcome,analyst.narrative.outcome);
});
test('cases with no alternative record never pretend to apply a correction',()=>{
 for(const s of SCENARIOS.slice(1)){const packet=truthStoryPacket(s,36,true);assert.equal(packet.revision,1);assert.equal(packet.correction,null);assert.equal(packet.checks.filter(r=>r.status==='withdrawn').length,0);assert.equal(packet.narrative.originalLine,packet.narrative.currentLine);}
 const saved=truthStoryPacket(SCENARIOS[2],36);assert.match(saved.narrative.outcome,/score remains 0–0/);assert.equal(saved.checks.find(r=>r.id==='goals').reference,'0');
});
test('guided chapters stay within their own case and declare deliberate revisions',()=>{
 for(const s of SCENARIOS){const n=truthStory(s,0);assert.ok(n.chapters.every(c=>c.second>=0&&c.second<=s.duration));assert.ok(n.chapters.filter(c=>c.corrected).every(()=>s.id==='wide'));}
 assert.equal(truthStory(SCENARIOS[0],18,true).chapterIndex,2);assert.equal(truthStory(SCENARIOS[0],31,true).chapterIndex,3);
});
