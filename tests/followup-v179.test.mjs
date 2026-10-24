import test from 'node:test';
import assert from 'node:assert/strict';
import {filmEvidence,followupBrief,filmFollowupPolicy} from '../api/film-followup.mjs';
import {pitchsideStory} from '../dist/pitchside-story.js';
import {executionProfile} from '../dist/execution-profile.js';

test('a question about the current film shot cannot import earlier action',()=>{
 const packet=pitchsideStory({time:25,language:'en'});
 const records=filmEvidence(packet,'Did the defender intend to win the ball?');
 assert.ok(records.length);assert.ok(records.every(e=>e.second>=24&&e.second<=25));
 assert.ok(filmEvidence(packet,'Compare earlier shots across the whole film').length>records.length);
});
test('unchanged evidence creates three distinct follow-up jobs without invented events',()=>{
 const packet=pitchsideStory({time:25,language:'en'}),conversation={previous:[{cutoff:25,role:'analyst',summary:'An earlier interpretation.'}]};
 const briefs=['analyst','guide','presenter'].map(role=>followupBrief(packet,conversation,'Can the evidence establish intent?',role));
 assert.equal(new Set(briefs.map(b=>b.task)).size,3);
 for(const b of briefs){assert.deepEqual(b.new_evidence_ids,[]);assert.match(b.evidence_change,/unchanged/);}
 assert.match(briefs[0].task,/Retract/);assert.match(briefs[1].task,/comparison/);assert.match(briefs[2].task,/corrected audience line/);
});
test('new evidence is bounded by the earlier and current cutoff',()=>{
 const packet=pitchsideStory({time:26,language:'en'}),b=followupBrief(packet,{previous:[{cutoff:24} ]},'What changed?','analyst');
 assert.ok(b.new_evidence_ids.length);assert.ok(b.current_observations.every(e=>e.second>=24&&e.second<=26));
});
test('follow-up policy does not force an invented football consequence',()=>{
 const p=filmFollowupPolicy({language:'en',mode:'analyst'},'presenter','Conversational');
 assert.match(p,/Do not force a new football consequence/);assert.match(p,/prior_round/);assert.match(p,/takeaway/);
});
test('execution profiles distinguish film, synthetic match and local uploads',()=>{
 assert.match(executionProfile('pitchside').heading,/3 MODEL/);assert.match(executionProfile('pitchside').detail,/Check applies evidence rules/);assert.match(executionProfile('pitchside').detail,/up to 3 editorial retries/);
 assert.match(executionProfile('match').heading,/4 MODEL/);assert.match(executionProfile('upload').heading,/LOCAL/);
 for(const source of ['match','pitchside'])assert.match(executionProfile(source).detail,/0 new calls/);
});
