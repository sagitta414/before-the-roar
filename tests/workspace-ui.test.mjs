import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {JSDOM} from 'jsdom';
test('all six application routes and the guided story initialize together without paid requests',async()=>{
 const dom=new JSDOM(await readFile(new URL('../dist/index.html',import.meta.url),'utf8'),{url:'https://example.test/?tour=1#watch',pretendToBeVisual:true}),w=dom.window;
 const saved=new Map(),set=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});};
 const requests=[],errors=[],intervals=[];w.addEventListener('error',e=>errors.push(e.error));w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLMediaElement.prototype.load=()=>{};w.HTMLMediaElement.prototype.pause=()=>{};w.HTMLMediaElement.prototype.play=async()=>{};
 w.HTMLMediaElement.prototype.addTextTrack=()=>({cues:[],mode:'disabled',addCue(cue){this.cues.push(cue);},removeCue(cue){this.cues=this.cues.filter(c=>c!==cue);}});
 try{
  set('window',w);set('VTTCue',class{constructor(startTime,endTime,text){Object.assign(this,{startTime,endTime,text});}});for(const key of ['document','location','history','navigator','localStorage','sessionStorage','CustomEvent','Event','HTMLElement','HTMLMediaElement','MutationObserver','DOMParser'])set(key,w[key]);
  for(const key of ['addEventListener','removeEventListener','getComputedStyle','matchMedia'])set(key,w[key].bind(w));
  set('requestAnimationFrame',()=>0);set('cancelAnimationFrame',()=>{});set('ResizeObserver',class{observe(){}disconnect(){}});set('BroadcastChannel',class{postMessage(){}close(){}addEventListener(){}});set('setInterval',(fn,ms)=>{const id=setTimeout(()=>{},ms);id.unref();intervals.push(id);return id;});
  set('fetch',async url=>{requests.push(String(url));if(String(url).includes('/api/health'))return Response.json({ai_configured:false,usage:{day:new Date().toISOString().slice(0,10),used:120,limit:120}});if(String(url)==='api-config.json')return Response.json({baseUrl:''});try{return new Response(await readFile(new URL('../dist/'+url,import.meta.url)));}catch{return new Response('{}',{status:404});}});
  for(const file of ['match-watch.js','analysis-sections.js','studio-lab.js','film-workspace.js','play-journey.js','production-desk.js','reliability.js','guided-tour.js'])await import('../dist/'+file);
  await new Promise(r=>setTimeout(r,50));
  assert.ok(document.body.classList.contains('guided-active'));assert.match(document.querySelector('.guided-copy').textContent,/run you didn’t see/);
  for(const id of ['centre','lab','truth','presenters','inside','watch']){document.getElementById(id+'-nav').click();assert.equal(document.getElementById(id).hidden,false,id);assert.equal(document.body.dataset.section,id);}
  document.dispatchEvent(new Event('btr-open-guided'));assert.equal(document.getElementById('guided-match').hidden,false);
  const menu=document.querySelector('.navigation-toggle');menu.click();assert.equal(menu.getAttribute('aria-expanded'),'true');menu.click();assert.equal(menu.getAttribute('aria-expanded'),'false');
  document.getElementById('inside-nav').click();
  const findButton=text=>[...document.querySelectorAll('.proof-actions button')].find(b=>b.textContent===text);
  findButton('Test recovery').click();await new Promise(r=>setTimeout(r,50));
  assert.match(document.querySelector('.proof-status').textContent,/REPLAYING SAVED RECEIPTS/);
  assert.equal(document.querySelectorAll('.proof-contributions article').length,3);
  findButton('Resume saved replay').click();await new Promise(r=>setTimeout(r,50));
  assert.equal(document.querySelectorAll('.proof-contributions article').length,5);
  assert.match(document.querySelector('.proof-caption').textContent,/Saved handoff complete/);
  assert.ok(findButton('Correct the tracking').disabled);
  assert.deepEqual(errors,[]);assert.ok(requests.every(x=>!x.includes('/api/')||x.includes('/api/health')),'Initial route and guided actions must not spend model requests');
 }finally{for(const id of intervals)clearTimeout(id);for(const [key,d]of saved){if(d)Object.defineProperty(globalThis,key,d);else delete globalThis[key];}w.close();}
});
