import test from 'node:test';
import assert from 'node:assert/strict';
import {eventComparison} from '../dist/evidence-cases.js';
import {PLAYERS,SCENARIOS} from '../dist/engine.js';
import {analyzePlay} from '../dist/play-analysis.js';
test('interception stays pending until completion and retains earlier evidence',()=>{
 const a=eventComparison('press',9),b=eventComparison('press',10);
 assert.equal(a.arrived,false);assert.equal(b.arrived,true);
 assert.equal(b.source.id,'press-evt-002');assert.equal(b.evidence.new_records.length,1);
 assert.deepEqual(b.evidence.before_event_ids,['press-evt-001']);
 assert.match(b.current,/does not prove/);
});
test('shot release cannot leak its outcome; completion records a save, never a goal',()=>{
 for(const t of [0,12,27,27.99])assert.equal(eventComparison('counter',t).arrived,false);
 const r=eventComparison('counter',28);assert.equal(r.source.outcome,'saved');assert.match(r.current,/no goal/);
 assert.equal(r.evidence.new_records.length,1);assert.equal(r.evidence.before_event_ids.length,4);
});
test('both fictional lineups have specific positions and replay chapter labels are distinct',()=>{
 assert.ok(PLAYERS.every(p=>p.role&&p.role!=='Outfield'));
 for(const s of SCENARIOS)for(const lang of ['en','es','pt']){
  const labels=analyzePlay(s,36,lang).chapters.map(c=>c.label);
  assert.equal(new Set(labels).size,labels.length);
 }
});

