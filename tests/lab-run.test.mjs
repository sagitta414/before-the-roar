import test from 'node:test';
import assert from 'node:assert/strict';
import {createLabRun} from '../dist/lab-run.js';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
test('leaving Match Lab during connection stops the late session instead of starting its stream',async()=>{
 const pending=deferred(),stopped=[];
 const run=createLabRun({create:()=>pending.promise,stop:async s=>stopped.push(s.id)});
 const started=run.start({seed:7});await run.stop();pending.resolve({id:'old'});
 assert.equal(await started,null);assert.equal(run.get(),null);assert.deepEqual(stopped,['old']);
});
test('an old connection cannot replace a newer fixture',async()=>{
 const pending=deferred(),stopped=[];
 const run=createLabRun({create:({seed})=>seed===7?pending.promise:Promise.resolve({id:'new'}),stop:async s=>stopped.push(s.id)});
 const old=run.start({seed:7});assert.deepEqual(await run.start({seed:8}),{id:'new'});
 pending.resolve({id:'old'});assert.equal(await old,null);assert.deepEqual(run.get(),{id:'new'});
 await run.stop();assert.equal(run.get(),null);assert.deepEqual(stopped,['old','new']);
});
test('a failed connection can be retried',async()=>{
 let fail=true;const run=createLabRun({create:async()=>{if(fail)throw Error('offline');return {id:'retry'};},stop:async()=>{}});
 await assert.rejects(run.start({}),/offline/);assert.equal(run.get(),null);
 fail=false;assert.deepEqual(await run.start({}),{id:'retry'});
});
