import test from 'node:test';
import assert from 'node:assert/strict';
import {guidedSnapshot,guidedInput,savedGuidePosts,GUIDE_STEPS} from '../dist/guided-model.js';
test('the first-visit demo has complete evidence with no model or network dependency',()=>{
 const a=guidedSnapshot(),b=guidedSnapshot({corrected:true});
 assert.equal(GUIDE_STEPS.length,5);assert.equal(a.export.demonstration.fresh_model_calls,0);
 assert.equal(a.posts.length,5);assert.equal(a.story.review.decision,'qualify');assert.equal(b.story.review.decision,'withdraw');
 assert.equal(a.story.stats,b.story.stats);assert.equal(a.story.analysis.forwardGain,b.story.analysis.forwardGain);
 assert.equal(a.story.analysis.passes.length,2);assert.ok(a.story.analysis.forwardGain>20);
 for(const snapshot of [a,b]){const ids=new Set(snapshot.export.evidence.map(e=>e.id));assert.ok(snapshot.posts.every(p=>p.evidence_ids.every(id=>ids.has(id))));}
});
test('saved AI never crosses language, time, revision or audience boundaries',()=>{
 const input=guidedInput(),posts=guidedSnapshot().posts,pack={cases:[{input,team:{posts}}]};assert.equal(savedGuidePosts(pack,input),posts);
 for(const patch of [{language:'es'},{mode:'math'},{corrected:true},{time:5}])assert.equal(savedGuidePosts(pack,{...input,...patch}),null);
 const bad={cases:[{input,team:{posts:posts.map((p,i)=>i===0?{...p,evidence_ids:['invented']}:p)}}]};assert.equal(savedGuidePosts(bad,input),null);
});
test('the demonstration preserves its evidence when personalized in each language',()=>{
 for(const language of ['en','es','pt']){const beginner=guidedSnapshot({language,mode:'beginner',corrected:true}),math=guidedSnapshot({language,mode:'math',corrected:true});assert.notEqual(beginner.story.body,math.story.body);assert.equal(beginner.story.stats,math.story.stats);assert.equal(math.story.revision,2);assert.equal(math.story.review.decision,'withdraw');}
});
