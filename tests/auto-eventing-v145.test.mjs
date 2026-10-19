import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const read = relative => readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const validation = JSON.parse(read('dist/assets/tracking/validation.json'));
const holdout = JSON.parse(read('dist/assets/tracking/holdout.json'));
const currentHoldout = JSON.parse(read('dist/assets/tracking/holdout-current.json'));

test('automatic event studio ships detector health UI and cache-busted assets', () => {
  const html = read('dist/index.html');
  const ui = read('dist/video-tracking.js');
  assert.match(html, /auto-eventing\.css\?v=145/);
  assert.match(html, /video-tracking\.js\?v=145/);
  assert.match(ui, /LIVE DETECTOR HEALTH/);
  assert.match(ui, /PIXELS<\/span><i><\/i><span>TRACKS/);
  assert.match(ui, /EVIDENCE SUPPORT/);
  assert.match(ui, /Support is not a calibrated probability/);
});

test('development fixture publishes complete measured results with candid limits', () => {
  assert.equal(validation.version, 'adaptive-pixel-tracking-v2');
  assert.equal(validation.frames, 600);
  assert.equal(validation.expectedEvents, 8);
  assert.equal(validation.detectedEvents, 8);
  assert.equal(validation.matchedEvents, 8);
  assert.equal(validation.eventPrecision, 1);
  assert.equal(validation.eventRecall, 1);
  assert.ok(validation.averageFrameConfidence > 0.9);
  assert.ok(validation.limits.some(limit => /not independent evidence/i.test(limit)));
});

test('historical unfamiliar-condition result retains its immutable detector and miss', () => {
  assert.equal(holdout.version, 'v145-final-frozen-detector');
  assert.equal(holdout.cases.length, 5);
  assert.match(holdout.method, /No tuning or reruns/);
  assert.match(holdout.method, /not independent real-world validation/);
  const totals = holdout.cases.reduce((sum, item) => ({
    expected: sum.expected + item.expectedEvents,
    detected: sum.detected + item.detectedEvents,
    matched: sum.matched + item.matchedEvents
  }), {expected: 0, detected: 0, matched: 0});
  assert.deepEqual(totals, {expected: 40, detected: 40, matched: 39});
  assert.equal(holdout.cases.filter(item => item.matchedEvents < item.expectedEvents).length, 1);
  assert.equal(
    holdout.detector_source,
    `docs/proof/detectors/sha256-${holdout.detector_sha256}.js`
  );
  const hash = createHash('sha256').update(read(holdout.detector_source)).digest('hex');
  assert.equal(holdout.detector_sha256, hash);
});

test('current detector has a separate reproducible holdout on new cases', () => {
  assert.equal(currentHoldout.version, 'v146-current-detector-holdout');
  assert.equal(currentHoldout.cases.length, 5);
  assert.deepEqual(currentHoldout.cases.map(item => item.seed), [10401, 10402, 10403, 10404, 10405]);
  assert.match(currentHoldout.method, /without tuning or rerunning/i);
  assert.match(currentHoldout.method, /not independent real-world or broadcast validation/i);
  const archived = read(currentHoldout.detector_source);
  const archivedHash = createHash('sha256').update(archived).digest('hex');
  const currentHash = createHash('sha256')
    .update(read('dist/tracking-model.js').replace(/\r\n/g, '\n'))
    .digest('hex');
  assert.equal(currentHoldout.detector_sha256, archivedHash);
  assert.equal(currentHoldout.detector_sha256, currentHash);
  const totals = currentHoldout.cases.reduce(
    (sum, item) => ({
      expected: sum.expected + item.expectedEvents,
      detected: sum.detected + item.detectedEvents,
      matched: sum.matched + item.matchedEvents
    }),
    {expected: 0, detected: 0, matched: 0}
  );
  assert.ok(totals.expected > 0);
  assert.ok(totals.detected >= totals.matched);
  assert.ok(totals.expected >= totals.matched);
});

test('public proof distinguishes deterministic detection from optional AI editing', () => {
  const proof = read('docs/proof/v145-auto-eventing.md');
  assert.match(proof, /run deterministically in the browser and use no model request/i);
  assert.match(proof, /39\/40/);
  assert.match(proof, /low-light miss is retained/i);
  assert.match(proof, /does not establish accuracy on independent real-world/i);
});
