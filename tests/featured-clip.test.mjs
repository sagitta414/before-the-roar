import test from 'node:test';
import assert from 'node:assert/strict';
import {CLIP_BEATS,clipStory,clipOverlayPacket} from '../dist/featured-clip.js';
test('clip evidence never includes a future annotation when playing or scrubbing backward',()=>{
 for(const t of [0,.24,.25,1.8,3.3,8,2,0]){
  const n=clipStory(t);
  assert.ok(n.evidence.every(e=>e.sequence_time_ms<=t*1000));
  assert.equal(n.evidence.length,CLIP_BEATS.filter(b=>b.at<=t).length);
 }
});
test('all audiences and languages preserve uncertainty and do not invent tracking metrics',()=>{
 for(const mode of ['casual','analyst','player'])for(const lang of ['en','es']){
  const p=clipOverlayPacket(8,mode,lang);
  assert.equal(p.metrics,null);assert.equal(p.match_time_ms,null);assert.equal(p.outcome,'unconfirmed');
  assert.equal(p.claims.length,5);assert.equal(p.annotation_method,'manual-visual-review');
  assert.equal(p.valid_until_sequence_time_ms,8000);
  assert.deepEqual(p.evidence_ids,p.claims.map(e=>e.id));
 }
 assert.notEqual(clipStory(4.5,'casual').body,clipStory(4.5,'analyst').body);
 assert.notEqual(clipStory(4.5,'player','en').body,clipStory(4.5,'player','es').body);
});
test('clip export clamps invalid or out-of-range times to the media duration',()=>{
 for(const [input,expected] of [[-2,0],[NaN,0],[100,8000]])assert.equal(clipOverlayPacket(input,'analyst','en').sequence_time_ms,expected);
});
