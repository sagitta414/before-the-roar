import test from 'node:test';
import assert from 'node:assert/strict';
import {PartyThread,partyKey,normalizeQuestion} from '../dist/party-state.js';
import {createApp} from '../api/server.mjs';
test('questions are bounded and cache keys separate question, language and audience',()=>{
 assert.equal(normalizeQuestion(' Did\nhe   score? '),'Did he score?');
 for(const value of [null,{},'x'.repeat(181)])assert.throws(()=>normalizeQuestion(value));
 const keys=[partyKey('en','fan'),partyKey('es','fan'),partyKey('en','math'),partyKey('en','fan','Did he score?')];assert.equal(new Set(keys).size,4);
});
test('thread drafts cannot overwrite a finalized post or leak between questions',()=>{
 const a=new PartyThread('en','fan'),b=new PartyThread('en','fan','Did he score?');
 a.accept('draft',{role:'analyst',summary:'unfinished'});a.accept('post',{role:'analyst',summary:'checked'});a.accept('draft',{role:'analyst',summary:'stale'});
 assert.equal(a.posts.get('analyst').summary,'checked');assert.equal(a.drafts.size,0);assert.equal(b.posts.size,0);
 a.accept('draft',{role:'reviewer',summary:'unfinished'});a.fail('Disconnected');assert.equal(a.drafts.size,0);assert.equal(a.pending,false);assert.equal(a.posts.size,1);
});
test('question endpoint rejects invalid input and forwards normalized viewer question',async()=>{
 let calls=0;const app=createApp({desk:{discuss:async(input,emit)=>{calls++;assert.equal(input.question,'Did he score?');emit('complete',{posts:0});}}});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${app.server.address().port}/api/desk`;
 try{for(const question of [null,{},'x'.repeat(181)])assert.equal((await fetch(url,{method:'POST',body:JSON.stringify({question})})).status,400);assert.equal(calls,0);const response=await fetch(url,{method:'POST',body:JSON.stringify({question:' Did he  score? '})});assert.equal(response.status,200);assert.match(await response.text(),/event: complete/);assert.equal(calls,1);}finally{app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}
});
