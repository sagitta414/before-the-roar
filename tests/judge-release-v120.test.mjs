import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');

test('one play-to-proof navigation exposes every destination without a competing menu',async()=>{
  const source=await read('navigation.js');
  assert.match(source,/journey-navigation-only/);
  assert.match(source,/nav\.hidden=true/);
  assert.doesNotMatch(source,/nav-more-toggle/);
  const cohesion=await read('cohesion.js');
  assert.match(cohesion,/verb:'ENGINEERS',detail:'Meet the team'/);
  assert.match(cohesion,/verb:'SECURE',detail:'Inspect protection'/);
  assert.match(cohesion,/is-complete/);
  assert.match(cohesion,/is-next/);
  assert.match(cohesion,/ArrowLeft/);
  assert.match(cohesion,/MEET YOUR <em>AI ENGINEERS/);
  const mobile=await read('mobile-studio.css');
  assert.match(mobile,/\.masthead nav,.masthead\.navigation-open nav\{display:none!important\}/);
});

test('the desktop journey uses the same language at the route and destination',async()=>{
  const index=await read('index.html');
  assert.match(index,/03 \/ MEASURE · LIVE ANALYTICS/);
  assert.match(index,/MEASURE <em>THE MATCH\.<\/em>/);
  assert.match(index,/cohesion\.css\?v=165/);
  assert.match(index,/cohesion\.js\?v=166/);
  assert.match(index,/universal-shell\.css\?v=166/);
});

test('the evidence chain is a route-independent application shell',async()=>{
  const shell=await read('universal-shell.css');
  const cohesion=await read('cohesion.js');
  assert.match(shell,/height: 52px !important/);
  assert.match(shell,/grid-template-columns: minmax\(165px/);
  assert.doesNotMatch(shell,/data-section/);
  assert.match(cohesion,/querySelector\('\.masthead'\)\?\.after\(rail\)/);
  assert.doesNotMatch(cohesion,/match-session-bar'\)\?\.after\(rail\)/);
});

test('judge finale exposes real specialist and Foundry receipts with their limits',async()=>{
  const tour=await read('guided-tour.js');
  assert.match(tour,/assets\/live-production-proof\.json/);
  assert.match(tour,/model_handoff_completed/);
  assert.match(tour,/independent_referee_completed/);
  assert.match(tour,/This receipt proves execution, handoff and recovery/);
  assert.match(tour,/PRELOADED STORY · READY TO PLAY/);
  assert.match(tour,/Run fresh Azure interruption \+ recovery/);
  assert.match(tour,/state\.workflow\?\.trace/);
  assert.doesNotMatch(tour,/liveReceipt\.isConnected/);
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
