import test from 'node:test';
import assert from 'node:assert/strict';
import {matchStory,localPanel} from '../dist/match-story.js';
import {productionPacket} from '../dist/studio-lab-model.js';
import {SCENARIOS} from '../dist/engine.js';
import {studyResult} from '../dist/viewer-study.js';
import {validateMatchPost} from '../api/match-desk.mjs';
const base={scenario:'wide',time:16,language:'en',mode:'analyst',team:'harbor',focus:7};
test('width context reproduces the coordinates and correction without changing completed pass measurements',()=>{
 const a=matchStory(base),b=matchStory({...base,corrected:true});
 assert.equal(a.football.record.width.runner_lateral_displacement_m,12);
 assert.equal(a.football.record.width.defender_lateral_displacement_m,13);
 assert.equal(b.football.record.width.defender_lateral_displacement_m,0);
 assert.equal(a.football.record.pass_path_m,b.football.record.pass_path_m);
 assert.deepEqual(a.analysis.passes,b.analysis.passes);
 assert.equal(matchStory({...base,time:15.9}).football.record.width,undefined);
});
test('all localized audiences and standalone cues retain the correction while their pass math stays valid',()=>{
 for(const language of ['en','es','pt'])for(const mode of ['fan','beginner','math','analyst','player']){
  const p=matchStory({...base,corrected:true,language,mode});
  assert.match(p.body,/correct|correg|corrig/i);assert.match(localPanel(p).find(x=>x.role==='guide').summary,/correct|correg|corrig/i);
  assert.equal(p.cue.overlay.body,p.body);assert.equal(p.stats,matchStory({...base,language,mode}).stats);
  if(['beginner','math','analyst'].includes(mode))assert.match(productionPacket(SCENARIOS[0],16,{corrected:true,language,mode}).overlay.body,/correct|correg|corrig/i);
 }
});
test('football context never discloses events or tracking beyond its current cutoff',()=>{
 for(const scenario of SCENARIOS)for(const time of [0,4,6,10,12,16,28,36]){
  const p=matchStory({...base,scenario:scenario.id,time}),r=p.football.record;
  assert.equal(r.second,time);assert.ok(r.event_ids.every(id=>p.analysis.seen.some(e=>e.id===id&&e.end<=time)));
  assert.equal(r.pass_path_m,p.analysis.passes.reduce((n,e)=>n+e.distance,0));
 }
});
test('a corrected AI conclusion cannot silently retain an uncorrected story',()=>{
 const packet=matchStory({...base,corrected:true});
 assert.throws(()=>validateMatchPost({post:{interpretation:'The winger and defender move toward the touchline.',headline:'The wide channel',caution:'Movement alone does not establish intent.',evidence_ids:{primary:packet.football.record.id,secondary:null}}},packet,'analyst'),/explicit changed conclusion/);
});
test('viewer task check reports only actual answers, incomplete attempts and task time',()=>{
 assert.equal(studyResult({},1234).completed,false);
 const r=studyResult({correction:0,math:1,source:2},44000);assert.equal(r.completed,true);assert.equal(r.correct,3);assert.equal(r.elapsed_seconds,44);assert.equal(r.kind,'voluntary-self-check');
 assert.equal(studyResult({correction:1,math:1,source:0},-100).correct,1);
});
test('editorial prose cannot turn uncertain causation into a claim of no influence',()=>{
 const packet=matchStory(base);
 for(const takeaway of ["The winger's run does not influence the defender's actions directly.","The winger's run does not directly influence the defender's actions.","The run doesn't affect the defender.","A corrida não teve efeito sobre o defensor.","La carrera no afecta al defensor."])
  assert.throws(()=>validateMatchPost({post:{takeaway,headline:'The wide channel',caution:'Only this sequence is available.',replay_cue:'Replay the winger and defender.',evidence_ids:{primary:packet.football.record.id,secondary:null}}},packet,'presenter'),/proof of no influence/);
});
