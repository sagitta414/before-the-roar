import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
test('the historical v188 judge cut retains its source boundaries',async()=>{
 const proof=JSON.parse(await readFile('demo/showcase-v188/judge-provenance.json','utf8'));
 const video=await readFile(proof.file);
 const html=await readFile('dist/index.html','utf8');
 const player=await readFile('dist/demo-premiere.js','utf8');
 assert.equal(proof.moving_footage_only,true);
 assert.equal(proof.scenes.length,11);
 assert.equal(proof.model_requests_in_capture,8);
 assert.ok(proof.duration_seconds<120);
 assert.equal(sha(video),proof.sha256);
 assert.equal(video.length,proof.bytes);
 for(const [index,scene] of proof.scenes.entries()){
  assert.equal(sha(await readFile(scene.file)),scene.source_sha256);
  assert.equal(sha(await readFile(`demo/showcase-v188/sources/voice-${index}.wav`)),scene.voice_sha256);
 }
 assert.equal(sha(await readFile(proof.measured_replay)),proof.measured_replay_sha256);
 assert.match(proof.boundaries,/separate sources/);
 assert.match(proof.boundaries,/zero new requests/);
 assert.match(html,/before-the-roar-judge-v205\.mp4/);
 assert.match(player,/before-the-roar-judge-v205\.mp4/);
});
