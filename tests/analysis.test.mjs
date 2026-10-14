import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENARIOS} from '../dist/engine.js';
import {matchCenterSnapshot,truthReport} from '../dist/analysis-model.js';
test('match centre includes all players and only completed events at its own playhead',()=>{
 for(const s of SCENARIOS)for(const time of [0,3,18,29,36]){const state=matchCenterSnapshot(s,time);assert.equal(state.players.length,22);assert.ok(state.seen.every(e=>e.end<=time));for(const p of state.players){assert.ok(p.completed<=p.passes);assert.ok(p.displacement>=0);assert.ok(p.position[0]>=0&&p.position[0]<=105);}}
 assert.equal(matchCenterSnapshot(SCENARIOS[0],-1).time,0);assert.equal(matchCenterSnapshot(SCENARIOS[0],999).time,36);
});
test('truth correction withdraws the movement claim without changing pass or goal records',()=>{
 const original=truthReport(SCENARIOS[0],26,false),revised=truthReport(SCENARIOS[0],26,true);assert.equal(original.withdrawn,0);assert.equal(revised.withdrawn,1);assert.equal(revised.reference.metrics.lateral,0);assert.ok(original.reading.metrics.lateral>0);assert.equal(revised.rows.find(r=>r.id==='movement').status,'withdrawn');for(const id of ['passes','speed','goals'])assert.deepEqual(original.rows.find(r=>r.id===id),revised.rows.find(r=>r.id===id));assert.equal(revised.supported,revised.checked-1);
});
test('truth checks do not assert an unseen movement or shot and preserve saved outcomes',()=>{
 const early=truthReport(SCENARIOS[0],0,true);assert.equal(early.rows.find(r=>r.id==='movement').status,'pending');assert.equal(early.rows.find(r=>r.id==='speed').status,'pending');assert.equal(early.withdrawn,0);const counter=truthReport(SCENARIOS[2],36,false);assert.equal(counter.reading.metrics.goals,0);assert.equal(counter.reading.seen.find(e=>e.type==='shot').outcome,'saved');assert.equal(counter.correctionAvailable,false);
});
