import test from 'node:test';
import assert from 'node:assert/strict';
import {publishPacket} from '../dist/publish-state.js';
import {pitchsideStory} from '../dist/pitchside-story.js';
import {buildPerspectiveRecap} from '../dist/pocket-accessibility.js';
import {validateMatchPost} from '../api/match-desk.mjs';
test('publish respects film cutoff and does not borrow previous-shot evidence',()=>{
 const waiting=publishPacket({source:'pitchside',clipTime:16,time:30,language:'en'});
 assert.equal(waiting.ready,false);assert.equal(waiting.story.cutoff,16);assert.equal(waiting.evidence.length,0);
 const ready=publishPacket({source:'pitchside',clipTime:17,language:'en'});
 assert.equal(ready.ready,true);assert.ok(ready.evidence.every(e=>e.second>=16&&e.second<=17));assert.notEqual(ready.key,waiting.key);
});
test('Spanish film recap has actual observations instead of record-type placeholders',()=>{
 const story=pitchsideStory({time:26,language:'es'});
 const recap=buildPerspectiveRecap({preset:'spanish20',story,alternateStory:story});
 assert.ok(recap.entries.length>1);
 for(const entry of recap.entries){assert.ok(entry.timestamp_s<=26);assert.ok(entry.narration.length>25);assert.doesNotMatch(entry.narration,/^(observation|football context|reviewed frame)$/);}
});
test('film guard rejects inferred intent even when qualified',()=>{
 const packet=pitchsideStory({time:26,language:'en'});
 const raw={post:{interpretation:'The close stance suggests an attempt to challenge the attacker.',headline:'Close stance',caution:'The outcome is unknown.',evidence_ids:{primary:packet.evidence.at(-1).id}}};
 assert.throws(()=>validateMatchPost(raw,packet,'analyst'),/intent/);
});
