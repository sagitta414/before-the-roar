import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('Pocket Director presents one mobile task per tab and preserves the evidence tools',async()=>{
 const html=await readFile(new URL('../dist/pocket-director.html',import.meta.url),'utf8');
 const dom=new JSDOM(html),doc=dom.window.document;
 assert.deepEqual([...doc.querySelectorAll('.dock [data-screen-target]')].map(n=>n.dataset.screenTarget),['live','perspectives','players','more']);
 assert.equal(doc.querySelectorAll('.app-screen').length,4);
 assert.equal(doc.querySelectorAll('.mode-rack [data-mode]').length,5);
 assert.ok(doc.querySelector('[data-screen="live"] .hero-image'));
 assert.ok(doc.querySelector('[data-screen="live"] #pitch'));
 assert.ok(doc.querySelector('[data-screen="more"] #challenge'));
 assert.ok(doc.querySelector('[data-screen="more"] #crew-stream'));
 assert.doesNotMatch(doc.body.textContent,/App Store|Google Play/);
 dom.window.close();
});
