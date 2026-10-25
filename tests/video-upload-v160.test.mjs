import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('video ingest is discoverable from Watch and loaded by Match Lab',async()=>{
  const [html,tracking]=await Promise.all([read('dist/index.html'),read('dist/video-tracking.js')]);
  assert.match(html,/id="open-video-upload"[^>]*>Upload video \+/);
  assert.match(html,/video-upload\.css\?v=162/);
  assert.match(html,/video-tracking\.js\?v=194/);
  assert.match(tracking,/createVideoUpload/);
  assert.match(await read('dist/video-upload.js'),/Try fictional sample/);
  assert.match(await read('dist/video-upload.js'),/id = "try-video-sample"/);
});

test('upload preflight preserves the capability boundary',async()=>{
  const source=await read('dist/video-upload.js');
  assert.match(source,/PRIVATE BY DEFAULT/);
  assert.match(source,/source receipt/i);
  assert.match(source,/permission to analyze/i);
  assert.match(source,/BTR-compatible synthetic training film/);
  assert.match(source,/Identity, distance and speed stay withheld/);
  assert.match(source,/crypto\.subtle\.digest\("SHA-256"/);
  assert.match(source,/150 \* 1024 \* 1024/);
  assert.match(source,/btr\.local-video-source\.v1/);
  assert.match(source,/none-browser-local/);
  assert.match(source,/bundled-fictional-evaluation/);
  assert.match(source,/BTR-generated fictional evaluation media/);
});

test('non-compatible clips cannot enter automatic tracking',async()=>{
  const [upload,tracking]=await Promise.all([read('dist/video-upload.js'),read('dist/video-tracking.js')]);
  assert.match(upload,/kind === "marked"/);
  assert.match(upload,/checkCompatibility/);
  assert.match(upload,/COMPATIBILITY FAILED · REVIEWED CUES ONLY/);
  assert.match(tracking,/uploadReviewOnly\|\|!tracker/);
  assert.match(tracking,/REVIEWED CUES ONLY/);
  assert.match(tracking,/result\.diagnostics\?\.frameConfidence/);
  assert.match(tracking,/automatic identity, distance, speed and event claims are withheld/);
});
