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
 assert.equal(doc.querySelector('#hero-film source')?.getAttribute('src'),'assets/pitchside-minute.mp4');
 assert.equal(doc.querySelectorAll('.club-crest').length,3);
 assert.ok(doc.querySelector('[data-screen="live"] .match-dashboard'));
 assert.equal(doc.querySelectorAll('.metric-grid article').length,4);
 assert.ok(doc.getElementById('momentum-chart'));
 assert.equal(doc.querySelectorAll('#flow-axis span').length,4);
 assert.ok(doc.getElementById('event-timeline'));
 assert.ok(doc.querySelector('[data-screen="live"] #pitch'));
 assert.ok(doc.querySelector('[data-screen="more"] #challenge'));
 assert.ok(doc.querySelector('[data-screen="more"] #crew-stream'));
 assert.doesNotMatch(doc.body.textContent,/App Store|Google Play/);
 assert.doesNotMatch(doc.body.textContent,/67:19|PASS RECEIVED/,'the player screen must not contain a future hard-coded event');
 assert.match(await readFile(new URL('../dist/pocket-polish.css',import.meta.url),'utf8'),/luca-moreau-portrait-v144\.webp/);
 dom.window.close();
});
