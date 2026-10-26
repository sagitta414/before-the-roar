import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

test('published v196 judge cut matches its source record and app links', async () => {
  const record = JSON.parse(await readFile('demo/showcase-v196/judge-provenance.json', 'utf8'));
  const video = await readFile(record.file);
  const html = await readFile('dist/index.html', 'utf8');
  const player = await readFile('dist/demo-premiere.js', 'utf8');
  assert.ok(record.duration_seconds < 120);
  assert.equal(video.length, record.bytes);
  assert.equal(sha256(video), record.sha256);
  assert.equal(record.live_model_requests_in_v187_capture, 8);
  assert.equal(record.model_requests_in_current_screen_capture, 0);
  for (const scene of record.scenes) {
    assert.equal(sha256(await readFile(scene.source)), scene.source_sha256);
    if (scene.voice_sha256) assert.equal(sha256(await readFile(scene.voice)), scene.voice_sha256);
  }
  assert.match(html, /youtu\.be\/FdRgFbkYKDs/);
  assert.match(html, /before-the-roar-judge-v196\.mp4/);
  assert.match(player, /before-the-roar-judge-v196\.mp4/);
});
