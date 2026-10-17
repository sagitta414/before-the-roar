import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
test('tour controls advance all stages without RAF and resume after a hidden-tab pause',async()=>{
 const dom=new JSDOM(await readFile(new URL('../dist/index.html',import.meta.url),'utf8'),{url:'https://example.test/?tour=1#watch',pretendToBeVisual:true}),w=dom.window;
 const saved=new Map(),set=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});};
 let now=0,tick,hidden=false;w.setInterval=fn=>{tick=fn;return 1;};w.clearInterval=()=>{};w.HTMLMediaElement.prototype.pause=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 Object.defineProperty(w.document,'hidden',{get:()=>hidden});
 try{
  set('window',w);for(const k of ['document','location','sessionStorage','CustomEvent','Event'])set(k,w[k]);set('performance',{now:()=>now});set('requestAnimationFrame',()=>0);set('fetch',async()=>new Response('{}',{status:404}));
  await import('../dist/guided-tour.js');
  const auto=[...document.querySelectorAll('button')].find(b=>b.textContent==='Play the 60-second judge cut');auto.click();
  now=12000;tick();assert.equal(document.querySelector('.guided-steps [aria-current]').textContent,'2 · Investigate');assert.equal(document.querySelectorAll('.guided-role').length,5);
  hidden=true;document.dispatchEvent(new Event('visibilitychange'));assert.equal(auto.textContent,'Resume tour');now=120000;tick();assert.match(document.querySelector('.tour-progress').textContent,/12 \/ 60/);
  hidden=false;document.dispatchEvent(new Event('visibilitychange'));auto.click();now=128000;tick();assert.match(document.querySelector('.guided-steps [aria-current]').textContent,/Calculate/);
  now=148000;tick();assert.match(document.querySelector('.guided-verdict').textContent,/WITHDRAWN/);
  now=157000;tick();assert.match(document.querySelector('.guided-steps [aria-current]').textContent,/Publish/);assert.match(document.querySelector('.guided-caption').textContent,/ES/);
  now=168000;tick();assert.equal(auto.textContent,'Replay the 60-second judge cut');assert.match(document.querySelector('.tour-progress').textContent,/Tour complete · 60/);
 }finally{for(const [k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}w.close();}
});
