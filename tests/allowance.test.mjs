import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyRequestLimit,ResultStore} from '../api/azure.mjs';

test('a one-day top-up expires at midnight UTC and rejects invalid overrides',()=>{
 const env={AI_DAILY_LIMIT:'120',AI_DAILY_LIMIT_OVERRIDE_DATE:'2026-10-15',AI_DAILY_LIMIT_OVERRIDE:'192'};
 assert.equal(dailyRequestLimit('2026-10-15',env),192);
 assert.equal(dailyRequestLimit('2026-10-16',env),120);
 assert.equal(dailyRequestLimit('2026-10-14',env),120);
 for(const value of ['','119','-1','192.5','Infinity','invalid'])assert.equal(dailyRequestLimit('2026-10-15',{...env,AI_DAILY_LIMIT_OVERRIDE:value}),120);
});

test('the persisted counter allows exactly sixty more reservations and returns to the normal limit next day',async()=>{
 const settings={AI_DAILY_LIMIT:'120',AI_DAILY_LIMIT_OVERRIDE_DATE:'2026-10-15',AI_DAILY_LIMIT_OVERRIDE:'192'};
 const previous=Object.fromEntries(Object.keys(settings).map(key=>[key,process.env[key]]));
 Object.assign(process.env,settings);
 try{
  let now=Date.parse('2026-10-15T23:59:00Z');
  const store=new ResultStore({clock:()=>now});store.base='mock';
  const counters=new Map([['budget/2026-10-15.json',132]]);
  store.blob=async(path,options={})=>{
   if(options.method==='PUT'){
    const body=JSON.parse(options.body);counters.set(path,body.calls);
    assert.equal(body.limit,path.includes('2026-10-15')?192:120);
    return new Response('',{status:201});
   }
   return counters.has(path)?new Response(JSON.stringify({calls:counters.get(path)}),{headers:{etag:'test'}}):new Response('',{status:404});
  };
  assert.deepEqual(await store.allowance(),{day:'2026-10-15',limit:192,used:132});
  for(let i=0;i<60;i++)assert.equal(await store.reserve(),true);
  assert.equal(await store.reserve(),false);
  assert.deepEqual(await store.allowance(),{day:'2026-10-15',limit:192,used:192});
  now=Date.parse('2026-10-16T00:00:00Z');
  assert.deepEqual(await store.allowance(),{day:'2026-10-16',limit:120,used:0});
  assert.equal(await store.reserve(),true);
  assert.equal(counters.get('budget/2026-10-15.json'),192);
  counters.set('budget/2026-10-16.json',120);
  assert.equal(await store.reserve(),false);
 }finally{for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
