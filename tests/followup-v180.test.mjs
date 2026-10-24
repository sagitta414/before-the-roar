import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {followupBrief} from '../api/film-followup.mjs';
import {pitchsideStory} from '../dist/pitchside-story.js';
import {validateMatchPost} from '../api/match-desk.mjs';

test('simultaneous film movement cannot become an asserted causal reaction',()=>{
 const packet=pitchsideStory({time:22,language:'en'});
 for(const interpretation of ['Close control is forcing the defender to adjust.','The defender shifts in response to the attacker’s touch.']) {
  assert.throws(()=>validateMatchPost({post:{interpretation,headline:'Watch the duel',caution:'Outcome unresolved.',evidence_ids:{primary:packet.evidence.at(-1).id}}},packet,'analyst'),/Simultaneous movement/);
 }
});

test('third round avoids both previously offered viewing comparisons',()=>{
 const packet=pitchsideStory({time:22,language:'en'});
 const conversation={previousCutoff:22,previous:[{role:'guide',summary:'Whose feet can reach the ball?'},{role:'guide',summary:'Does the gap grow within this shot?'}]};
 const brief=followupBrief(packet,conversation,'What else can I check?','guide');
 assert.equal(brief.comparison_axis,'frame-coverage');
 assert.deepEqual(brief.new_evidence_ids,[]);
 const host=followupBrief(packet,conversation,'Did he escape?','presenter');
 assert.equal(host.contribution_contract,'publication decision');
 assert.match(host.task,/withhold the beaten-defender label/);
 assert.match(host.task,/takeaway must not contain a replay question/);
});

test('Truth Lab summary tests movement evidence without claiming causal proof',async()=>{
 const source=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
 assert.ok(!source.includes('The defender was pulled wide by the run.'));
 assert.match(source,/Neither record proves what caused the movement/);
});

test('Guide follow-ups use the current scene rather than one universal duel question',()=>{
 const prior={previousCutoff:60,previous:[{role:'guide',summary:'What happens next?'}]};
 const keeper=followupBrief(pitchsideStory({time:46}),prior,'Was that a save?','guide');
 assert.equal(keeper.comparison_axis,'ball-origin');
 assert.match(keeper.task,/unseen origin/);
 assert.equal(followupBrief(pitchsideStory({time:12}),prior,'Was the line broken?','guide').comparison_axis,'frame-coverage');
 assert.equal(followupBrief(pitchsideStory({time:22}),prior,'Did he escape?','guide').comparison_axis,'separation');
});
