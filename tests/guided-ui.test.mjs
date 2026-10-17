import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
test('guided UI opens without a model, navigates every stage, corrects the visible caption and retains source on exit',async()=>{
 const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://example.test/?tour=1#watch',pretendToBeVisual:true});
 const {window}=dom,saved={};for(const key of ['window','document','location','sessionStorage','CustomEvent','Event','requestAnimationFrame','fetch'])saved[key]=globalThis[key];
 const errors=[];window.addEventListener('error',e=>errors.push(e.error));window.HTMLMediaElement.prototype.pause=()=>{};window.HTMLElement.prototype.scrollIntoView=()=>{};
 try{
  for(const key of ['window','document','location','sessionStorage','CustomEvent','Event'])globalThis[key]=key==='window'?window:window[key];
  globalThis.requestAnimationFrame=()=>0;const requested=[];globalThis.fetch=async url=>{requested.push(String(url));return new Response('{}',{status:404});};
  document.getElementById('watch-nav').onclick=()=>document.dispatchEvent(new CustomEvent('btr-section',{detail:'watch'}));
  await import('../dist/guided-tour.js');await new Promise(r=>setTimeout(r,10));
  assert.ok(document.body.classList.contains('guided-active'));
  assert.equal(document.getElementById('guided-match').hidden,false);
  const stages=[...document.querySelectorAll('.guided-steps button')];assert.equal(stages.length,5);
  stages[1].click();assert.equal(document.querySelectorAll('.guided-role').length,5);
  stages[2].click();assert.match(document.querySelector('.guided-content').textContent,/23.7/);
  stages[3].click();const correct=[...document.querySelectorAll('.guided-content button')].find(b=>b.textContent==='Apply corrected tracking');assert.ok(correct);correct.click();
  assert.match(document.querySelector('.guided-verdict').textContent,/WITHDRAWN/);assert.match(document.querySelector('.guided-caption').textContent,/R2/);assert.match(document.querySelector('.guided-caption').textContent,/corrected/i);
  stages[4].click();const language=document.querySelector('select[aria-label="Guided your language"]');language.value='es';language.dispatchEvent(new Event('change'));assert.match(document.querySelector('.guided-caption').textContent,/ES/);
  assert.ok(requested.every(url=>!url.includes('/api/')||url.includes('/api/judge-event')),'The guided demonstration may create a free event envelope but must never generate AI');
  document.dispatchEvent(new CustomEvent('btr-section',{detail:'truth'}));assert.equal(document.getElementById('guided-match').hidden,true);assert.equal(document.body.classList.contains('guided-active'),false);
  document.dispatchEvent(new Event('btr-open-guided'));assert.equal(document.getElementById('guided-match').hidden,false);
  let liveOpened=0;document.addEventListener('btr-open-live-discussion',()=>liveOpened++);
  [...document.querySelectorAll('.guided-downloads button')].find(b=>b.textContent==='Try the live two-round discussion →').click();
  assert.equal(liveOpened,1);assert.equal(document.getElementById('guided-match').hidden,true);
  const {matchSession}=await import('../dist/match-session.js');assert.equal(matchSession.get().time,16);assert.equal(matchSession.get().corrected,false);
  assert.ok(requested.every(url=>!url.includes('/api/')||url.includes('/api/judge-event')),'Opening live discussion still requires a separate explicit request');
  assert.deepEqual(errors,[]);
 }finally{for(const [key,value]of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}dom.window.close();}
});
