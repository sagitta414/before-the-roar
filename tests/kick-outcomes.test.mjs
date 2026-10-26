import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENARIOS,events} from '../dist/engine.js';
import {kickOutcomes} from '../dist/kick-outcomes.js';

test('kick rates count only completed events through the selected playhead',()=>{
 const wide=SCENARIOS.find(row=>row.id==='wide');
 const at16=kickOutcomes(events(wide).filter(row=>row.end<=16));
 assert.deepEqual([at16.passes.made,at16.passes.attempted,at16.passes.percent],[2,2,100]);
 assert.equal(at16.onTarget.percent,null);
 assert.equal(at16.goals.percent,null);
 const atEnd=kickOutcomes(events(wide));
 assert.deepEqual([atEnd.onTarget.percent,atEnd.goals.percent],[100,100]);
 assert.equal(atEnd.goals.source_ids.length,1);
});

test('saved shot is on target, but not a goal',()=>{
 const counter=SCENARIOS.find(row=>row.id==='counter');
 const r=kickOutcomes(events(counter));
 assert.equal(r.onTarget.percent,100);
 assert.equal(r.goals.percent,0);
 assert.equal(r.goals.attempted,1);
});

test('team filter excludes the opposing pass and no attempts stay undefined',()=>{
 const press=SCENARIOS.find(row=>row.id==='press');
 const seen=events(press).filter(row=>row.end<=10);
 const harbor=kickOutcomes(seen,'harbor');
 const north=kickOutcomes(seen,'north');
 assert.equal(harbor.passes.percent,null);
 assert.equal(north.passes.percent,50);
 assert.equal(north.passes.attempted,2);
});
