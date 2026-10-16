import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createTruthSpotlight} from '../dist/truth-spotlight.js';
import {truthStory,truthStoryPacket} from '../dist/truth-story-model.js';
import {SCENARIOS} from '../dist/engine.js';

test('comparison shows the withdrawn statement, unchanged passes, and replay for the selected revision',()=>{
 const dom=new JSDOM('<button id="watch-nav"></button><section id="truth"><div class="truth-story-grid"></div></section>');
 const previous=global.document;global.document=dom.window.document;
 try {
  const calls=[];let opened=false;document.getElementById('watch-nav').onclick=()=>{opened=true;};
  const view=createTruthSpotlight({seek:(t,r)=>calls.push([t,r]),toggleCorrection:()=>calls.push('toggle'),pause:()=>{}});
  const render=(time,revised)=>view.render(truthStory(SCENARIOS[0],time,revised),truthStoryPacket(SCENARIOS[0],time,revised));
  render(16,false);const root=document.querySelector('.truth-spotlight');
  assert.match(root.textContent,/13.0 m → 13.0 m/);
  const preserved=root.querySelector('.truth-change-survives').textContent;
  root.querySelector('.red-button').click();assert.equal(calls.at(-1),'toggle');
  render(16,true);assert.match(root.textContent,/13.0 m → 0.0 m/);assert.match(root.textContent,/no lateral movement/);
  assert.equal(root.querySelector('.truth-change-survives').textContent,preserved);
  root.querySelectorAll('.outline-button')[1].click();assert.deepEqual(calls.at(-1),[16,true]);assert.equal(opened,true);
  root.querySelectorAll('.outline-button')[0].click();assert.deepEqual(calls.at(-1),[16,false]);
  render(8,false);assert.match(root.textContent,/not yet reached/);root.querySelector('.red-button').click();assert.deepEqual(calls.at(-1),[16,false]);
  view.render(truthStory(SCENARIOS[1],16),truthStoryPacket(SCENARIOS[1],16));assert.equal(root.hidden,true);
 } finally {global.document=previous;dom.window.close();}
});
