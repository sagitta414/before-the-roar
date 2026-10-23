import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('one investigation spine connects the primary product journey',async()=>{
  const source=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
  const journey=source.slice(source.indexOf('const stages=['),source.indexOf('const proofDestinations=['));
  const support=source.slice(source.indexOf('const proofDestinations=['),source.indexOf('function el('));
  assert.deepEqual([...journey.matchAll(/section:'([^']+)'/g)].map(match=>match[1]),['watch','centre','lab','truth','inside']);
  assert.deepEqual([...support.matchAll(/section:'([^']+)'/g)].map(match=>match[1]),['presenters','security']);
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
  assert.match(index,/cohesion\.css\?v=169/);
  assert.match(index,/cohesion\.js\?v=169/);
  assert.match(index,/Broadcast view · cinematic minute/);
  assert.match(index,/Evidence view · measured replay/);
});

