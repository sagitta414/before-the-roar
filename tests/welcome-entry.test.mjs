import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('welcome waits for an entry choice, routes correctly, and releases its video',async()=>{
 const dom=new JSDOM('<body></body>',{url:'https://example.test/#watch',runScripts:'outside-only'}),w=dom.window;
 const pending=[];w.setTimeout=fn=>{pending.push(fn);return pending.length;};w.matchMedia=()=>({matches:false});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 let pauses=0;w.HTMLMediaElement.prototype.play=()=>Promise.resolve();w.HTMLMediaElement.prototype.pause=()=>{pauses++;};w.HTMLMediaElement.prototype.load=()=>{};
 try{
  w.eval(await readFile(new URL('../dist/splash.js',import.meta.url),'utf8'));
  const dialog=w.document.querySelector('dialog'),video=dialog.querySelector('video');
  assert.equal(dialog.open,true);assert.equal(pending.length,0,'There must be no automatic dismissal timer');
  dialog.querySelector('.btr-motion').click();assert.equal(dialog.querySelector('.btr-motion').getAttribute('aria-pressed'),'true');assert.ok(pauses>0);
  const cancel=new w.Event('cancel',{cancelable:true});dialog.dispatchEvent(cancel);assert.equal(cancel.defaultPrevented,true);assert.equal(pending.length,0);
  dialog.querySelector('[aria-label="Enter Truth Lab"]').click();assert.equal(w.location.hash,'#truth');assert.equal(pending.length,1);
  pending.shift()();assert.equal(w.document.querySelector('dialog'),null);assert.equal(video.hasAttribute('src'),false);
 }finally{w.close();}
});
