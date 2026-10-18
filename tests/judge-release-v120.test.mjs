import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');

test('primary navigation keeps four core destinations and groups supporting pages',async()=>{
  const source=await read('navigation.js');
  assert.match(source,/\['watch','centre','lab','truth'\]/);
  assert.match(source,/\['presenters','security','inside'\]/);
  assert.match(source,/nav-more-toggle/);
  const mobile=await read('mobile-studio.css');
  assert.match(mobile,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
});

test('judge finale exposes real specialist and Foundry receipts with their limits',async()=>{
  const tour=await read('guided-tour.js');
  assert.match(tour,/assets\/live-production-proof\.json/);
  assert.match(tour,/model_handoff_completed/);
  assert.match(tour,/independent_referee_completed/);
  assert.match(tour,/This receipt proves execution, handoff and recovery/);
  assert.match(tour,/GUIDED REHEARSAL · 0 MODEL REQUESTS/);
  assert.match(tour,/Run fresh Azure interruption \+ recovery/);
});

test('video readiness publishes frozen holdout success and the low-light failure',async()=>{
  const readiness=JSON.parse(await read('assets/video-readiness.json'));
  const holdout=readiness.evaluations.find(row=>row.domain==='frozen-detector synthetic holdout variations');
  assert.equal(holdout.detector_frozen_before_generation,true);
  assert.equal(holdout.normal_condition_matched_events,16);
  assert.equal(holdout.normal_condition_event_precision,1);
  assert.equal(holdout.low_light_matched_events,0);
  assert.equal(holdout.low_light_release_decision,'withhold');
});
