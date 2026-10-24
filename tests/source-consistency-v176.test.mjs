import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {workspace,setWorkspaceSource,updateWorkspace,withdrawWorkspaceEvent} from '../dist/source-workspace.js';
import {sourceDescription,sourceTranscript} from '../dist/source-description.js';
import {repeatsInsight} from '../api/match-desk.mjs';

test('withdrawals survive detector updates and restoration is explicit',()=>{
 setWorkspaceSource({hash:'a'});updateWorkspace({events:[{id:'e1'}]});
 assert.equal(withdrawWorkspaceEvent('unknown'),false);
 assert.equal(withdrawWorkspaceEvent('e1'),true);const revision=workspace.revision;
 updateWorkspace({events:[{id:'e1'}]});assert.equal(workspace.corrected,true);assert.ok(workspace.revision>revision);
 updateWorkspace({events:[{id:'e1'},{id:'e2'}]});assert.equal(workspace.corrected,false);assert.deepEqual(workspace.withdrawn,['e1']);
 withdrawWorkspaceEvent('e1',false);assert.deepEqual(workspace.withdrawn,[]);
 setWorkspaceSource(null);assert.equal(workspace.source,null);assert.equal(workspace.events.length,0);
});
test('cinematic accessibility uses only reached film observations',()=>{
 const input={source:'pitchside',clipTime:4,language:'en',mode:'fan'};
 const description=sourceDescription(input);assert.doesNotMatch(description.detail,/Harbor|Northbridge|completed passes/i);
 const transcript=sourceTranscript(input);assert.ok(transcript.length);assert.ok(transcript.every(row=>row.at<=4));assert.ok(transcript.some(row=>/sideline/.test(row.detail)));
 assert.equal(sourceTranscript({...input,clipTime:0}).length,1);
});
test('measured evidence withdrawal reaches Publish without replacing the local player',async()=>{
 const dom=new JSDOM('<body><section id="watch"></section><section id="centre"></section><section id="truth"></section><section id="inside"></section><button id="truth-nav"></button><button id="inside-nav"></button><button id="lab-nav"></button><select id="session-mode"><option value="fan">Fan</option></select><select id="session-language"><option value="en">English</option></select></body>',{url:'https://example.test/'});
 const saved=new Map();for(const key of ['document','CustomEvent','Event']){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:dom.window[key]});}
 try{
  await import('../dist/uploaded-journey.js');const {openVideoEvidence}=await import('../dist/video-evidence.js');
  document.dispatchEvent(new CustomEvent('btr-upload-source',{detail:{hash:'a'.repeat(64),url:'blob:local-test',name:'Fictional sample',synthetic:true,measured:true,metadata:{duration:60,width:640,height:360}}}));
  const player=document.querySelector('#watch video');
  const event={id:'pass-1',type:'pass',start:1,end:2,distance:12,speed:43.2,evidence:{firstFrame:24,lastFrame:48}};
  document.dispatchEvent(new CustomEvent('btr-upload-detection',{detail:{events:[event]}}));assert.equal(document.querySelector('#watch video'),player,'new evidence must not remount playback');
  openVideoEvidence({snapshot:{t:2,events:[event]},frame:'data:image/png;base64,',posts:[]},'truth');
  [...document.querySelectorAll('#truth button')].find(b=>b.textContent==='Withdraw this event’s detection').click();
  let packet=JSON.parse(document.querySelector('#inside pre').textContent);assert.equal(packet.corrected,true);assert.equal(packet.cue,null);assert.deepEqual(packet.withdrawn_event_ids,['pass-1']);
  document.dispatchEvent(new CustomEvent('btr-upload-detection',{detail:{events:[event]}}));packet=JSON.parse(document.querySelector('#inside pre').textContent);assert.equal(packet.cue,null);
  document.dispatchEvent(new CustomEvent('btr-upload-clear'));assert.equal(document.body.classList.contains('has-upload-dossier'),false);
 }finally{setWorkspaceSource(null);for(const [key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}dom.window.close();}
});
test('follow-up novelty check detects paraphrased viewing advice',()=>{
 assert.equal(repeatsInsight('Watch the defender feet and attacker hips beside the ball.',[{summary:'Watch the attacker hips and defender feet beside the ball.'}]),true);
 assert.equal(repeatsInsight('A continuous wide angle would reveal the receiver’s next touch after the cut.',[{summary:'The defender follows beside the attacker.'}]),false);
});
