import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {receiptReplay} from '../dist/receipt-replay.js';
test('replay preserves actual recorded contributions across the specialist handoff and labels its limits',async()=>{
 const archive=JSON.parse(await readFile(new URL('../dist/assets/btr-agent-evaluation-v40.json',import.meta.url),'utf8'));
 const paused=receiptReplay(archive),resumed=receiptReplay(archive,true);
 assert.equal(paused.phase,'paused_at_handoff');assert.equal(paused.posts.length,3);assert.equal(resumed.posts.length,5);assert.equal(resumed.fresh_model_requests,0);
 assert.deepEqual(resumed.posts.filter(p=>paused.posts.some(x=>x.role===p.role)),paused.posts);
 assert.deepEqual(resumed.trace.slice(0,paused.trace.length),paused.trace);assert.ok(resumed.trace.every(t=>t.replayed));assert.match(resumed.limitation,/No new worker interruption/);
 assert.throws(()=>receiptReplay({cases:[]}),/unavailable/);
});
