import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

test('product-first demo assets match their published timeline and provenance',async()=>{
 for(const cut of ['judge','showcase']){
  const m=JSON.parse(await readFile(`demo/showcase-v175/${cut}-provenance.json`,'utf8'));
  const bytes=await readFile(`dist/assets/before-the-roar-${cut}-v175.mp4`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256);
  assert.equal(bytes.length,m.bytes);
  assert.equal(m.portrait_card_seconds,0);
  assert.ok(m.product_seconds/m.duration_seconds>.9);
  if(cut==='judge')assert.ok(m.duration_seconds<120);
  assert.match(m.watch,/reviewed notes/);
  assert.match(m.correction,/deterministic/);
  let end=0;
  for(const stage of m.timings){assert.ok(Math.abs(stage.start-end)<.01);assert.ok(stage.duration>0);end+=stage.duration;}
  assert.ok(Math.abs(end-m.duration_seconds)<.2);
  for(const id of ['watch','understand','measure','correction','phone','publish','architecture'])assert.ok(m.timings.some(t=>t.id===id));
 }
});
