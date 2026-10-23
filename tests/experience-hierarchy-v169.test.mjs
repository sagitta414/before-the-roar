import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');

test('the main audience journey ends at Publish and proof destinations are separate',async()=>{
  const source=await read('cohesion.js');
  assert.match(source,/five-stage play-to-proof journey with supporting proof destinations/);
  assert.match(source,/const proofDestinations=/);
  assert.match(source,/story-spine__proof/);
  assert.match(source,/SUPPORTING PROOF/);
});

test('Measure has one primary sample action and a secondary tool disclosure',async()=>{
  const source=await read('video-tracking.js');
  assert.match(source,/Analyze the included fictional sample/);
  assert.match(source,/START HERE · NO UPLOAD NEEDED/);
  assert.match(source,/vt-secondary-tools/);
  assert.match(source,/Other ways to measure \+/);
});

test('Truth Lab previews the complete correction in its first content position',async()=>{
  const source=await read('cohesion.js');
  assert.match(source,/querySelector\('\.extension-heading'\)\?\.after\(path\)/);
  assert.match(source,/ORIGINAL CLAIM · R1/);
  assert.match(source,/CHANGED OBSERVATION · R2/);
  assert.match(source,/WITHDRAWN IF APPLIED/);
  assert.match(source,/REVISED BROADCAST/);
});

test('Watch provenance starts collapsed and the hierarchy stylesheet is last',async()=>{
  const [tour,html]=await Promise.all([read('guided-tour.js'),read('index.html')]);
  assert.match(tour,/el\('details','judge-ingest'\)/);
  assert.match(tour,/Inspect event evidence \+/);
  assert.match(html,/experience-hierarchy\.css\?v=169/);
  assert.match(html,/experience-hierarchy\.js\?v=169/);
  assert.match(html,/guided-tour\.js\?video=65&v=169/);
});
