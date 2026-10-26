import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

test('current full-frame judge cut matches its source record and app player', async () => {
  const record = JSON.parse(await readFile('demo/showcase-v197/judge-provenance.json', 'utf8'));
  const video = await readFile(record.file);
  const html = await readFile('dist/index.html', 'utf8');
  const player = await readFile('dist/demo-premiere.js', 'utf8');
  const renderer = await readFile('scripts/render-demo-v197.mjs', 'utf8');
  assert.equal(record.version, 197);
  assert.ok(record.duration_seconds > 90 && record.duration_seconds < 120);
  assert.equal(video.length, record.bytes);
  assert.equal(sha256(video), record.sha256);
  assert.equal(record.live_model_requests_in_v187_capture, 8);
  assert.equal(record.model_requests_in_current_screen_capture, 0);
  assert.equal(record.scenes.length, 14);
  assert.ok(record.scenes.every(scene => scene.overlays && scene.source_sha256));
  for (const scene of record.scenes) {
    assert.equal(sha256(await readFile(scene.source)), scene.source_sha256);
    if (scene.voice_sha256) assert.equal(sha256(await readFile(scene.voice)), scene.voice_sha256);
    for (const overlay of scene.overlays) assert.match(overlay.sha256, /^[a-f0-9]{64}$/);
  }
  assert.match(record.boundaries, /Full-frame moving source recordings/);
  assert.match(record.boundaries, /distinct sources/);
  assert.match(renderer, /force_original_aspect_ratio=decrease,pad=1600:900/);
  assert.doesNotMatch(renderer, /\bcrop=/);
  assert.match(html, /before-the-roar-judge-v198\.mp4/);
  assert.match(player, /before-the-roar-judge-v198\.mp4/);
});
