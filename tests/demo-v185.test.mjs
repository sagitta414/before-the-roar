import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('the refreshed demo is versioned, captioned, and its media matches the published receipts', async () => {
  for (const cut of ['judge', 'showcase']) {
    const receipt = JSON.parse(await readFile(`demo/showcase-v185/${cut}-provenance.json`, 'utf8'));
    const bytes = await readFile(receipt.file);
    const captions = await readFile(`demo/showcase-v185/${cut}.srt`, 'utf8');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), receipt.sha256);
    assert.equal(bytes.length, receipt.bytes);
    assert.match(captions, /Pocket Director now opens with a beginner explanation/);
    assert.match(receipt.previous_recordings, /not a fresh live run/);
    if (cut === 'judge') assert.ok(receipt.duration_seconds > 110 && receipt.duration_seconds < 120);
    let end = 0;
    for (const stage of receipt.timings) {
      assert.ok(Math.abs(stage.start - end) < .01);
      end += stage.duration;
    }
    assert.ok(Math.abs(end - receipt.duration_seconds) < .2);
  }
  const html = await readFile('dist/index.html', 'utf8');
  assert.match(html, /before-the-roar-showcase-v185\.mp4/);
  assert.match(html, /Moving Watch, correction, and architecture scenes are retained recordings/);
});
