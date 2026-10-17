import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENARIOS} from '../dist/engine.js';
import {sequenceBrief,productionPacket,datasetRows} from '../dist/studio-lab-model.js';
test('production datasets resolve every cue citation without exporting future events or tracking',()=>{
 for(const s of SCENARIOS)for(const t of [0,3,6,18.13,29,36,100])for(const corrected of [false,true]){
  const rows=datasetRows(s,t,{corrected}),cutoff=Math.min(t,36),ids=new Set(rows.map(r=>r.id)),cue=rows.at(-1);
  assert.ok(rows.filter(r=>r.record_type==='event').every(e=>e.end<=cutoff));
  assert.ok(rows.filter(r=>r.record_type.startsWith('tracking')).every(e=>e.second<=cutoff));
  assert.ok(rows.filter(r=>r.record_type==='observation').every(e=>e.t<=cutoff));
  assert.ok(cue.evidence_ids.every(id=>ids.has(id)),JSON.stringify(cue));
  assert.ok(cue.expires_at_ms>=cue.clock_ms);assert.ok(cue.expires_at_ms<=(s.minute*60+36)*1000);
 }
});
test('three localized perspectives share exact evidence and preserve saved shots and corrections',()=>{
 for(const language of ['en','es','pt']){
  const b=sequenceBrief(SCENARIOS[2],36,{language});assert.equal(b.score.harbor,0);assert.ok(b.cards[0].text.includes({en:'saves',es:'detiene',pt:'defende'}[language]));
  const first=productionPacket(SCENARIOS[0],18,{language,mode:'beginner',corrected:true});
  for(const mode of ['math','analyst'])assert.deepEqual(productionPacket(SCENARIOS[0],18,{language,mode,corrected:true}).evidence_ids,first.evidence_ids);
  assert.equal(first.revision,2);assert.ok(sequenceBrief(SCENARIOS[0],18,{language,corrected:true}).cards[2].text.includes({en:'withdrawn',es:'retira',pt:'retirada'}[language]));
  const corrected=sequenceBrief(SCENARIOS[0],18,{language,corrected:true});assert.equal(new Set(corrected.cards.map(c=>c.text)).size,3);
  const original=sequenceBrief(SCENARIOS[0],18,{language});
  assert.notEqual(original.takeaway,corrected.takeaway);
  assert.ok(corrected.takeaway.includes({en:'no longer supports',es:'ya no respalda',pt:'já não sustenta'}[language]));
  assert.equal(corrected.cards[1].equation,sequenceBrief(SCENARIOS[0],18,{language,corrected:false}).cards[1].equation);
  assert.ok(corrected.cards[0].text.includes({en:'without the ball',es:'sin balón',pt:'sem bola'}[language]));
 }
});
test('empty attempts do not become zero percent and pass math uses recorded duration',()=>{
 const b=sequenceBrief(SCENARIOS[0],0);assert.equal(b.state.metrics.completion,null);assert.ok(!b.cards[1].text.includes('0%'));
 const later=sequenceBrief(SCENARIOS[0],18);assert.ok(Math.abs(later.lastPass.speed-later.lastPass.distance/(later.lastPass.end-later.lastPass.t)*3.6)<1e-9);
 const p=productionPacket(SCENARIOS[0],18,{language:'unknown',mode:'unknown',focus:999});assert.equal(p.audience.language,'en');assert.equal(p.audience.mode,'beginner');assert.equal(p.audience.focus_player_id,7);
});
