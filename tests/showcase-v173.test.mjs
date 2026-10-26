import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('the demo preserves the chosen cut in its player, download and share URL', async () => {
  const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  const script=await readFile(new URL('../dist/demo-premiere.js',import.meta.url),'utf8');
  const dom=new JSDOM(html,{url:'https://example.com/?cut=short',runScripts:'outside-only'});
  const w=dom.window;
  w.HTMLMediaElement.prototype.pause=function(){};
  w.HTMLMediaElement.prototype.load=function(){};
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.eval(script.replaceAll('export function','function')+'\nwindow.demoUrl=finalDemoShareUrl;');
  w.document.getElementById('open-final-demo').click();
  assert.match(w.document.getElementById('final-demo-video').src,/judge-v199/);
  assert.equal(new URL(w.demoUrl()).searchParams.get('cut'),'short');
  w.document.querySelector('[data-demo-cut="showcase"]').click();
  assert.match(w.document.getElementById('final-demo-video').src,/showcase-v185/);
  assert.match(w.document.querySelector('.final-demo-actions a').href,/showcase-v185/);
  assert.equal(new URL(w.demoUrl()).searchParams.get('cut'),'showcase');
  assert.equal(w.document.querySelector('[data-demo-cut="showcase"]').getAttribute('aria-pressed'),'true');
  dom.window.close();
});
