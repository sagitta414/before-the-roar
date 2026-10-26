import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENARIOS} from '../dist/engine.js';
import {truthStoryPacket} from '../dist/truth-story-model.js';
import {nextAngleModel} from '../dist/next-angle-core.js';

const wide=SCENARIOS.find(s=>s.id==='wide');

test('Next Angle changes exactly the evidence-dependent movement claim',()=>{
 const before=truthStoryPacket(wide,16,false);
 const after=truthStoryPacket(wide,16,true);
 const cue=nextAngleModel(before,after);
 assert.equal(cue.measured.original_movement_m,13);
 assert.equal(cue.measured.alternate_movement_m,0);
 assert.equal(cue.measured.claims_changed,1);
 assert.equal(cue.measured.claims_checked,4);
 assert.deepEqual(cue.source.pass_ids,['wide-evt-001','wide-evt-002']);
 assert.equal(cue.measured.pass_completion_percent,100);
 assert.equal(cue.forecast.if_stationary.movement_claim,'withdrawn');
 assert.match(cue.limits.join(' '),/not a future prediction/);
});

test('Next Angle refuses premature or mismatched evidence',()=>{
 const before=truthStoryPacket(wide,16,false);
 const after=truthStoryPacket(wide,16,true);
 assert.throws(()=>nextAngleModel(truthStoryPacket(wide,8,false),after),/matching, reached/);
 assert.throws(()=>nextAngleModel(after,before),/original and corrected/);
 const altered={...after,evidence:after.evidence.filter(row=>row.id!=='wide-evt-002')};
 assert.throws(()=>nextAngleModel(before,altered),/preserve completed events/);
});
