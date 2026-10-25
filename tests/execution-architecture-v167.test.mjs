import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../dist/'+name,import.meta.url),'utf8');

test('crew profiles disclose model, deterministic and independent execution',async()=>{
  const [html,script,css]=await Promise.all([read('index.html'),read('analysis-sections.js'),read('execution-architecture.css')]);
  for(const label of ['AZURE MODEL','DETERMINISTIC CALCULATION','INDEPENDENT REFEREE'])assert.match(html,new RegExp(label));
  assert.match(html,/Microsoft Foundry/);
  assert.match(script,/agent-execution-badge/);
  assert.match(script,/Verified code · no model request/);
  assert.match(css,/#presenters \.execution-legend/);
  assert.match(css,/agent-execution-badge\[data-execution=calculation\]/);
});

test('security hero exposes a compact status-labelled event-to-output path',async()=>{
  const [html,css]=await Promise.all([read('index.html'),read('execution-architecture.css')]);
  for(const node of ['Synthetic event','Container Apps','Azure OpenAI specialists','Evidence ledger','Verified outputs'])assert.match(html,new RegExp(node));
  assert.equal((html.match(/<li data-status="(?:running|implemented|roadmap)">/g)||[]).length,5);
  assert.match(html,/security-compact-architecture/);
  assert.match(css,/grid-template-columns:repeat\(5/);
  assert.match(css,/data-status=roadmap/);
  assert.match(html,/execution-architecture\.css\?v=167/);
  assert.match(html,/analysis-sections\.js\?v=194/);
});
