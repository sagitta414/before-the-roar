import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('one investigation spine connects the primary product journey',async()=>{
  const source=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
  const sections=[...source.matchAll(/section:'([^']+)'/g)].map(match=>match[1]);
  assert.deepEqual(sections,['watch','centre','lab','truth','inside']);
  for(const verb of ['WATCH','UNDERSTAND','MEASURE','CHALLENGE','PUBLISH'])assert.match(source,new RegExp(`verb:'${verb}'`));
  assert.match(source,/btr-open-guided/);
});

test('source dossier joins the views without falsely joining their pixels',async()=>{
  const source=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
  assert.match(source,/BTR-WIDE-67/);
  assert.match(source,/companion representations, not the same pixel source/);
  assert.match(source,/Broadcast view/);
  assert.match(source,/Evidence view/);
});

test('proof layer states the vision and model-comparison limits',async()=>{
  const source=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
  assert.match(source,/validates withholding behavior, not broadcast detection accuracy/);
  assert.match(source,/does not establish general superiority/);
  assert.match(source,/4 AZURE REQUESTS \+ 1 CALCULATION/);
  const index=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  assert.match(index,/cohesion\.css\?v=110/);
  assert.match(index,/cohesion\.js\?v=110/);
  assert.match(index,/Broadcast view · cinematic minute/);
  assert.match(index,/Evidence view · measured replay/);
});
