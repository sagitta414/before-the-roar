import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');

test('primary navigation keeps four core destinations and groups supporting pages',async()=>{
  const source=await read('navigation.js');
  assert.match(source,/\['watch','centre','lab','truth'\]/);
  assert.match(source,/\['presenters','security','inside'\]/);
  assert.match(source,/nav-more-toggle/);
  const mobile=await read('mobile-studio.css');
  assert.match(mobile,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
});

test('judge finale exposes real specialist and Foundry receipts with their limits',async()=>{
  const tour=await read('guided-tour.js');
  assert.match(tour,/assets\/live-production-proof\.json/);
  assert.match(tour,/model_handoff_completed/);
  assert.match(tour,/independent_referee_completed/);
  assert.match(tour,/This receipt proves execution, handoff and recovery/);
});
