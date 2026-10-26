import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

test('public judge cut keeps voice, captions, and the cleaned fictional film aligned', async () => {
  const record = JSON.parse(await readFile('demo/showcase-v201/judge-provenance.json', 'utf8'));
  const script = JSON.parse(await readFile('scripts/demo-v199-voice.json', 'utf8'));
  const video = await readFile(record.file);
  const html = await readFile('dist/index.html', 'utf8');
  const player = await readFile('dist/demo-premiere.js', 'utf8');
  const renderer = await readFile('scripts/render-demo-v201.mjs', 'utf8');
  const srt = await readFile('demo/showcase-v201/judge.srt', 'utf8');
  assert.equal(record.version, 201);
  assert.equal(record.narration_tempo, .82);
  assert.equal(record.scene_stretch, 1.21);
  assert.ok(record.duration_seconds > 110 && record.duration_seconds < 120);
  assert.equal(video.length, record.bytes);
  assert.equal(sha256(video), record.sha256);
  assert.equal(record.scenes.length, script.length);
  assert.deepEqual(record.scenes.map(scene => scene.voice_text), script.map(scene => scene.text));
  assert.deepEqual(record.caption_alignment.map(caption => caption.text),
    script.flatMap(scene => scene.text.match(/[^.!?]+[.!?]+/g).map(sentence => sentence.trim())));
  assert.ok(record.caption_alignment.every(caption => caption.start >= 0 && caption.end <= record.duration_seconds && caption.end > caption.start));
  assert.equal((srt.match(/ --> /g) ?? []).length, record.caption_alignment.length);
  let offset = 0;
  for (const scene of record.scenes) {
    assert.equal(sha256(await readFile(scene.source)), scene.source_sha256);
    assert.equal(sha256(await readFile(scene.voice)), scene.voice_sha256);
    assert.ok(record.caption_alignment.filter(caption => caption.scene === scene.id)
      .every(caption => caption.start >= offset && caption.end < offset + scene.seconds));
    offset += scene.seconds;
  }
  assert.match(renderer, /force_original_aspect_ratio=decrease,pad=1600:900/);
  assert.doesNotMatch(renderer, /\bcrop=/);
  assert.match(renderer, /id:'publish', seconds:7, file:understand, from:10, span:4/);
  assert.equal(record.scenes[0].overlays[0].track.length, 5);
  assert.equal(record.scenes[2].source, 'demo/showcase-v199/understand-clean.mp4');
  assert.equal(record.scenes[0].source, 'dist/assets/pitchside-minute-clean.mp4');
  assert.doesNotMatch(renderer, /alimiter=/);
  assert.equal(sha256(await readFile(record.voice_master)), record.voice_master_sha256);
  const voiceLength = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', record.voice_master], { encoding: 'utf8' });
  assert.equal(voiceLength.status, 0);
  assert.ok(Math.abs(Number(voiceLength.stdout) - record.scenes.reduce((sum, scene) => sum + scene.seconds, 0)) < 0.005);
  assert.match(html, /before-the-roar-judge-v205\.mp4/);
  assert.match(player, /before-the-roar-judge-v205\.mp4/);
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,start_time', '-of', 'json', record.file], { encoding: 'utf8' });
  assert.equal(probe.status, 0, probe.stderr);
  const streams = JSON.parse(probe.stdout).streams;
  const audio = streams.find(stream => stream.codec_type === 'audio');
  const picture = streams.find(stream => stream.codec_type === 'video');
  assert.ok(audio && picture);
  assert.ok(Math.abs(Number(audio.start_time) - Number(picture.start_time)) < 0.1);
  const tail = spawnSync('ffmpeg', ['-hide_banner', '-ss', '109', '-i', record.file, '-t', '5.5', '-vn', '-af', 'volumedetect', '-f', 'null', '-'], {encoding:'utf8'});
  assert.equal(tail.status, 0, tail.stderr);
  const peak = Number(tail.stderr.match(/max_volume: ([-\d.]+) dB/)?.[1]);
  const average = Number(tail.stderr.match(/mean_volume: ([-\d.]+) dB/)?.[1]);
  assert.ok(peak < -0.3, `Closing narration clips at ${peak} dB`);
  assert.ok(average < -10 && average > -45, `Closing narration level is wrong: ${average} dB`);
});
