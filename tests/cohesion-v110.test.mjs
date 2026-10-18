import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('one investigation spine connects the primary product journey',async()=>{
  const source=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
  const sections=[...source.matchAll(/section:'([^']+)'/g)].map(match=>match[1]);
  assert.deepEqual(sections.slice(0,5),['watch','centre','lab','truth','inside']);
  for(const verb of ['WATCH','UNDERSTAND','MEASURE','CHALLENGE','PUBLISH'])assert.match(source,new RegExp(`verb:'${verb}'`));
  assert.match(source,/btr-open-guided/);
});

test('source dossier makes measured replay the core and cinematic film optional',async()=>{
  const source=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
  assert.match(source,/BTR-WIDE-67/);
  assert.match(source,/Evidence view is the core journey/);
  assert.match(source,/optional cinematic companion coverage/);
});

test('proof layer states the vision and model-comparison limits',async()=>{
  const source=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
  assert.match(source,/validates withholding behavior, not broadcast detection accuracy/);
  assert.match(source,/not general prose superiority/);
  assert.match(source,/8\/8 GROUNDING TIES · VALUE EVEN/);
  assert.match(source,/4 AZURE REQUESTS \+ 1 CALCULATION/);
  assert.match(source,/MICROSOFT FOUNDRY/);
  const index=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  assert.match(index,/cohesion\.css\?v=121/);
  assert.match(index,/cohesion\.js\?v=121/);
  assert.match(index,/Broadcast view · cinematic minute/);
  assert.match(index,/Evidence view · measured replay/);
});

