import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('one investigation spine connects the primary product journey',async()=>{
  const source=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
  const sections=[...source.matchAll(/section:'([^']+)'/g)].map(match=>match[1]);
  assert.deepEqual(sections.slice(0,7),['watch','centre','lab','truth','inside','presenters','security']);
  for(const verb of ['WATCH','UNDERSTAND','MEASURE','CHALLENGE','PUBLISH','ENGINEERS','SECURE'])assert.match(source,new RegExp(`verb:'${verb}'`));
  assert.match(source,/btr-open-guided/);
});

test('source dossier leads with the cinematic film and keeps measured proof explicit',async()=>{
  const source=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
  assert.match(source,/BTR-WIDE-67/);
  assert.match(source,/Broadcast view leads the experience/);
  assert.match(source,/inspect the measured synthetic replay behind the story/);
});

test('proof layer states the vision and model-comparison limits',async()=>{
  const source=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
  assert.match(source,/validates withholding behavior, not broadcast detection accuracy/);
  assert.match(source,/human preference remains open/i);
  assert.match(source,/6 CASES · 24 ORDER-REVERSED PAIRS · MODEL-SCORED/);
  assert.match(source,/does not claim better writing/);
  assert.match(source,/4 AZURE REQUESTS \+ 1 CALCULATION/);
  assert.match(source,/MICROSOFT FOUNDRY/);
  const index=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  assert.match(index,/cohesion\.css\?v=165/);
  assert.match(index,/cohesion\.js\?v=165/);
  assert.match(index,/Broadcast view · cinematic minute/);
  assert.match(index,/Evidence view · measured replay/);
});

