import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';

test('published v174 films match their manifests and the judge cut stays below two minutes',async()=>{
  for(const cut of ['judge','showcase']){
    const metadata=JSON.parse(await readFile(`demo/showcase-v174/${cut}-provenance.json`,'utf8'));
    const bytes=await readFile(`dist/assets/before-the-roar-${cut}-v174.mp4`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),metadata.sha256);
    assert.equal(bytes.length,metadata.bytes);
    if(cut==='judge') assert.ok(metadata.duration_seconds>=110&&metadata.duration_seconds<120);
    assert.match(metadata.voices,/scripted/);
    assert.match(metadata.correction,/no internal edits or acceleration/);
    let end=0;
    for(const stage of metadata.timings){assert.ok(Math.abs(stage.start-end)<.01);assert.ok(stage.duration>0);end+=stage.duration;}
    assert.ok(Math.abs(end-metadata.duration_seconds)<.2);
  }
});

test('chapter navigation seeks within the selected cut without forcing autoplay',async()=>{
 const dom=new JSDOM(await readFile('dist/index.html','utf8'),{url:'https://example.com/?cut=short',runScripts:'outside-only'});
 const w=dom.window;let plays=0;
 w.HTMLMediaElement.prototype.pause=function(){};
 w.HTMLMediaElement.prototype.load=function(){};
 w.HTMLMediaElement.prototype.play=function(){plays++;return Promise.resolve();};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 w.eval((await readFile('dist/demo-premiere.js','utf8')).replaceAll('export function','function'));
 w.document.getElementById('open-final-demo').click();
 w.document.querySelector('[aria-label="Jump to Truth Lab correction"]').click();
 assert.equal(w.document.getElementById('final-demo-video').currentTime,43.25);
 assert.equal(plays,0);
 w.document.querySelector('[data-demo-cut="showcase"]').click();
 assert.ok(w.document.querySelectorAll('.demo-chapters button').length>=4);
 dom.window.close();
});
