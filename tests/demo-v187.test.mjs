import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('the current judge cut shows the captured two-round correction and stays under two minutes', async () => {
  const provenance = JSON.parse(await readFile('demo/showcase-v187/judge-provenance.json', 'utf8'));
  const captureBytes = await readFile(provenance.fresh_browser_capture);
  const metadataBytes = await readFile('demo/showcase-v187/capture.json');
  const capture = JSON.parse(metadataBytes);
  const video = await readFile(provenance.file);
  const captions = await readFile('demo/showcase-v187/judge.srt', 'utf8');
  const html = await readFile('dist/index.html', 'utf8');
  const player = await readFile('dist/demo-premiere.js', 'utf8');

  assert.equal(sha(video), provenance.sha256);
  assert.equal(video.length, provenance.bytes);
  assert.equal(sha(captureBytes), provenance.fresh_browser_capture_sha256);
  assert.equal(sha(metadataBytes), provenance.capture_metadata_sha256);
  assert.ok(provenance.duration_seconds > 95 && provenance.duration_seconds < 120);
  assert.equal(capture.model_requests_used, 8);
  assert.equal(capture.requests.length, 2);
  assert.deepEqual(capture.requests.map(request => request.corrected), [false, true]);
  assert.equal(capture.allowance_after.used - capture.allowance_before.used, 8);
  assert.ok(capture.marks.find(mark => mark.step === 'correction-applied').at > capture.marks.find(mark => mark.step === 'challenge-complete').at);
  assert.ok(capture.marks.find(mark => mark.step === 'r2-complete').at > capture.marks.find(mark => mark.step === 'correction-applied').at);
  assert.match(captions, /movement claim loses support/i);
  assert.match(provenance.visual_sources, /continuous public browser screen recording/i);
  assert.match(provenance.evidence_scope, /separate sources/i);
  assert.match(html, /1:39 judge cut/);
  assert.match(html, /data-demo-cut="short" aria-pressed="true"/);
  assert.match(html, /<source src="assets\/before-the-roar-judge-v187\.mp4"/);
  assert.match(player, /before-the-roar-judge-v187\.mp4/);
});
