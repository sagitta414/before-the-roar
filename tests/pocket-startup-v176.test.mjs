import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {JSDOM} from 'jsdom';
test('Pocket initializes accessibility before receiving a cue and recovers to explicit demo mode',async()=>{
 const dom=new JSDOM(await readFile(new URL('../dist/pocket-director.html',import.meta.url),'utf8'),{url:'https://example.test/pocket-director.html',pretendToBeVisual:true}),w=dom.window,saved=new Map();
 const set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:v});};
 w.HTMLMediaElement.prototype.pause=()=>{};w.HTMLMediaElement.prototype.play=async()=>{};w.scrollTo=()=>{};
 try{for(const k of ['window','document','navigator','location','localStorage','CustomEvent'])set(k,k==='window'?w:w[k]);set('addEventListener',w.addEventListener.bind(w));set('fetch',async()=>{throw Error('offline test');});
  await import('../dist/pocket-director.js');await new Promise(r=>setTimeout(r,30));
  assert.match(document.getElementById('connection-pill').textContent,/DEMO MODE/);assert.match(document.getElementById('moment-title').textContent,/unseen run/i);assert.match(document.querySelector('.hero-tag').textContent,/NOT MEASURED FOOTAGE/);
  document.getElementById('data-expand').click();assert.equal(document.getElementById('data-expand').getAttribute('aria-expanded'),'true');
 }finally{for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}w.close();}
});
