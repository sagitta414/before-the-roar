import test from 'node:test';import assert from 'node:assert/strict';
import {editorialIssues} from '../dist/editorial-quality.js';import {guidedSnapshot,guidedInput} from '../dist/guided-model.js';
test('observed live weaknesses are rejected even when numbers are spelled out',()=>{
 assert.ok(editorialIssues('analyst','Two completed passes progressed the ball forward.').length);
 assert.ok(editorialIssues('analyst','The pass covers fifty-eight meters.').length);
 assert.ok(editorialIssues('guide','What was the distance covered by each completed pass?').length);
 assert.ok(editorialIssues('presenter','The passing was effective.').length);
 assert.ok(editorialIssues('presenter','Forward passes connect the recovery to the shot.',[{role:'analyst',summary:'Forward passes connect the runner to the attack.'}]).length);
 assert.deepEqual(editorialIssues('guide','Is the next receiver ahead of the ball?'),[]);
});
test('an archived contribution must meet current checks before appearing as saved AI',()=>{
 const input=guidedInput(),posts=guidedSnapshot().posts.map(p=>p.role==='guide'?{...p,engine:'azure_openai',summary:'What distance did the passes cover?'}:p),pack={recorded_at:'2026-10-15T20:00:00Z',cases:[{input,team:{posts}}]};
 const snapshot=guidedSnapshot({},pack);assert.deepEqual(snapshot.posts.map(p=>p.role),['analyst','guide','math','reviewer','presenter']);assert.equal(snapshot.posts.find(p=>p.role==='guide').engine,'reviewed_fallback');assert.match(snapshot.posts.find(p=>p.role==='guide').caution,/current editorial checks/);
});
