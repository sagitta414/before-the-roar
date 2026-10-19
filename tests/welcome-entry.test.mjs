import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('welcome waits for the cinematic minute and launches the premiere from its primary action',async()=>{
 const dom=new JSDOM('<body></body>',{url:'https://example.test/#watch',runScripts:'outside-only'}),w=dom.window;
 const pending=[];w.setTimeout=fn=>{pending.push(fn);return pending.length;};w.matchMedia=()=>({matches:false});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 try{
  let premieres=0;w.document.addEventListener('btr-premiere-play',()=>premieres++);
  w.eval(await readFile(new URL('../dist/splash.js',import.meta.url),'utf8'));
  const dialog=w.document.querySelector('dialog'),enter=dialog.querySelector('.btr-enter');
  assert.equal(dialog.open,true);assert.equal(pending.length,0,'There must be no automatic dismissal timer');
  assert.equal(enter.disabled,true);assert.match(enter.textContent,/Preparing the cinematic minute/);
  w.document.dispatchEvent(new w.CustomEvent('btr-premiere-ready'));
  assert.equal(enter.disabled,false);assert.match(enter.textContent,/Watch the cinematic minute/);assert.ok(dialog.classList.contains('premiere-ready'));
  dialog.querySelector('.btr-motion').click();assert.equal(dialog.querySelector('.btr-motion').getAttribute('aria-pressed'),'true');
  const cancel=new w.Event('cancel',{cancelable:true});dialog.dispatchEvent(cancel);assert.equal(cancel.defaultPrevented,true);assert.equal(pending.length,0);
  enter.click();assert.equal(w.location.hash,'#watch');assert.equal(premieres,1);assert.equal(w.sessionStorage.getItem('btr-premiere-play'),'1');assert.equal(pending.length,1);
  pending.shift()();assert.equal(w.document.querySelector('dialog'),null);
 }finally{w.close();}
});

test('welcome can still route directly to an evidence workspace without starting the film',async()=>{
 const dom=new JSDOM('<body></body>',{url:'https://example.test/#watch',runScripts:'outside-only'}),w=dom.window;
 const pending=[];w.setTimeout=fn=>{pending.push(fn);return pending.length;};w.matchMedia=()=>({matches:false});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 try{
  let premieres=0;w.document.addEventListener('btr-premiere-play',()=>premieres++);
  w.eval(await readFile(new URL('../dist/splash.js',import.meta.url),'utf8'));
  w.document.querySelector('[aria-label="Enter Truth Lab"]').click();
  assert.equal(w.location.hash,'#truth');assert.equal(premieres,0);assert.equal(pending.length,1);
  pending.shift()();assert.equal(w.document.querySelector('dialog'),null);
 }finally{w.close();}
});
