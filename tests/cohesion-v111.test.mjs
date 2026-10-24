import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_SESSION} from '../dist/match-session.js';

test('the default journey opens the cinematic minute while preserving the measured moment',()=>{
  assert.equal(DEFAULT_SESSION.source,'pitchside');
  assert.equal(DEFAULT_SESSION.scenario,'wide');
  assert.equal(DEFAULT_SESSION.time,16);
  assert.equal(DEFAULT_SESSION.corrected,false);
});

test('Truth Lab presents one primary three-step correction path',async()=>{
  const source=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
  for(const label of ['ORIGINAL CLAIM','CHANGE EVIDENCE','CORRECTED OUTPUT'])assert.match(source,new RegExp(label));
  assert.match(source,/time:16,corrected/);
  assert.match(source,/More evidence tools/);
  assert.match(source,/WITHDRAWN IF APPLIED/);
  assert.match(source,/Preview the complete consequence/);
  assert.match(source,/data-impact-calculation/);
});

test('public proof distinguishes development validation, safety and independent preference',async()=>{
  const video=JSON.parse(await readFile(new URL('../dist/assets/video-readiness.json',import.meta.url),'utf8'));
  assert.equal(video.evaluations[0].matched_expected_events,8);
  assert.equal(video.evaluations[0].held_out,false);
  assert.equal(video.release_gate.general_broadcast_detection,'not_validated');
  const value=JSON.parse(await readFile(new URL('../dist/assets/commentary-value-benchmark.json',import.meta.url),'utf8'));
  assert.equal(value.checks.filter(check=>check.result==='pass').length,5);
  assert.equal(value.independent_human_preference.status,'pending');
  assert.equal(value.foundry_blind_evaluation.grounding.tie,8);
  assert.equal(value.operational_capability_comparison.crew.resume_without_repeating_completed_calls,true);
  assert.equal(value.operational_capability_comparison.single_call_baseline.resume_without_repeating_completed_calls,false);
});

test('v111 assets are cache-busted and the cinematic minute leads the source selector',async()=>{
  const index=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  assert.match(index,/cohesion\.css\?v=169/);
  assert.match(index,/cohesion\.js\?v=179/);
  assert.ok(index.indexOf('value="pitchside"')<index.indexOf('value="match"'));
});

test('judge-facing proof reports evaluation and video boundaries without superiority claims',async()=>{
  const source=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
  assert.match(source,/EARLY COMMENTARY EVALUATION/);
  assert.match(source,/does not claim better writing/);
  assert.match(source,/UNKNOWN: BROADCAST/);
  assert.match(source,/not general broadcast accuracy/);
  assert.match(source,/MutationObserver/);
});

