import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('the judge cut uses the retained three-round public trace and stays below two minutes', async () => {
  const receipt = JSON.parse(await readFile('demo/showcase-v186/judge-provenance.json', 'utf8'));
  const traceBytes = await readFile(receipt.live_receipts);
  const trace = JSON.parse(traceBytes);
  const video = await readFile(receipt.file);
  const captions = await readFile('demo/showcase-v186/judge.srt', 'utf8');
  assert.equal(createHash('sha256').update(video).digest('hex'), receipt.sha256);
  assert.equal(video.length, receipt.bytes);
  assert.equal(createHash('sha256').update(traceBytes).digest('hex'), receipt.live_receipts_sha256);
  assert.ok(receipt.duration_seconds > 105 && receipt.duration_seconds < 120);
  assert.equal(trace.complete, true);
  assert.equal(trace.rounds.length, 3);
  assert.deepEqual(trace.rounds.map(round => round.name), ['opening', 'viewer_challenge', 'corrected_evidence']);
  assert.deepEqual(trace.rounds.map(round => round.input.corrected), [false, false, true]);
  assert.equal(trace.rounds[1].input.parentKey, trace.rounds[0].events.find(e => e.type === 'conversation').data.id);
  assert.equal(trace.rounds[2].input.parentKey, undefined);
  assert.equal(trace.requests_used, 12);
  for (const round of trace.rounds) {
    assert.equal(round.complete, true);
    const posts = round.events.filter(e => e.type === 'post').map(e => e.data);
    assert.equal(posts.length, 5);
    assert.equal(posts.filter(post => post.engine === 'azure_openai').length, 4);
    assert.equal(posts.filter(post => post.engine === 'calculated').length, 1);
    assert.ok(posts.every(post => post.engine !== 'reviewed_fallback'));
  }
  assert.match(trace.rounds[1].events.find(e => e.type === 'post' && e.data.role === 'presenter').data.summary, /does not prove.*caused/i);
  assert.match(trace.rounds[2].events.find(e => e.type === 'post' && e.data.role === 'presenter').data.summary, /withdraw the movement claim/i);
  assert.match(captions, /separate synthetic replay/i);
  assert.match(captions, /not football causality/i);
  assert.match(receipt.visual_sources, /visualize exact public SSE posts/);
  const html = await readFile('dist/index.html', 'utf8');
  const player = await readFile('dist/demo-premiere.js', 'utf8');
  assert.match(html, /three fresh public Azure rounds/i);
  assert.match(player, /before-the-roar-judge-v186\.mp4/);
});
