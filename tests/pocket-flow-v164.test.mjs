import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('Pocket Director reveals one primary task at each step',async()=>{
 const html=await readFile(new URL('../dist/pocket-director.html',import.meta.url),'utf8'),dom=new JSDOM(html),doc=dom.window.document;
 const screens=[...doc.querySelectorAll('.app-screen')];
 assert.deepEqual(screens.map(screen=>screen.dataset.screen),['live','perspectives','players','more']);
 assert.deepEqual([...doc.querySelectorAll('.dock button')].map(button=>button.textContent.trim()),['LIVE','VIEWS','PLAYER','LAB']);
 assert.ok(doc.querySelector('[data-screen="live"] .hero'));
 assert.ok(doc.querySelector('[data-screen="live"] .director-console'));
 assert.equal(doc.getElementById('feel-details').hidden,true,'cue training stays out of the live path until requested');
 assert.equal(doc.getElementById('feel-details-toggle').getAttribute('aria-expanded'),'false');
 assert.ok(doc.querySelector('[data-screen="perspectives"] .perspective-director'));
 assert.equal(doc.querySelectorAll('[data-screen="perspectives"] [data-recap-preset]').length,5);
 assert.equal(doc.querySelectorAll('[data-screen="perspectives"] [data-mode]').length,5);
 assert.ok(doc.querySelector('[data-screen="players"] #player-options'));
 assert.ok(doc.querySelector('[data-screen="more"] #challenge'));
 assert.ok(doc.querySelector('[data-screen="more"] #ask-form'));
 dom.window.close();
});

test('v164 flow CSS makes recaps primary and turns secondary choices into compact rails',async()=>{
 const css=await readFile(new URL('../dist/pocket-flow.css',import.meta.url),'utf8');
 assert.match(css,/\.perspective-director\{order:2/);
 assert.match(css,/\.mode-rack\{order:3;display:flex;overflow-x:auto/);
 assert.match(css,/\.feel-details-toggle/);
 assert.match(css,/\.player-hero\{height:360px/);
 const worker=await readFile(new URL('../dist/pocket-sw.js',import.meta.url),'utf8');
 assert.match(worker,/btr-pocket-v176/);
 assert.match(worker,/pocket-flow\.css/);
 assert.match(worker,/accessibility-core\.js/);
});
