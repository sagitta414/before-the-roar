import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sourceCatalog} from '../api/grounded-desk.mjs';
import {matchStory,localPanel} from '../dist/match-story.js';

test('Foundry evidence court audits claims, handoff value and the release condition',async()=>{
  const source=await readFile(new URL('../api/foundry-referee.mjs',import.meta.url),'utf8');
  for(const field of ['role_distinction_score','decision_usefulness_score','claim_audit','handoff_assessment','strongest_contribution','release_condition'])assert.match(source,new RegExp(field));
  const ui=await readFile(new URL('../dist/production-desk.js',import.meta.url),'utf8');
  for(const label of ['CLAIM-BY-CLAIM AUDIT','FIVE-ROLE VALUE CHECK','ROLE VALUE','DECISION VALUE'])assert.match(ui,new RegExp(label));
});

test('the causal Host combines observation, calculation, challenge and a next replay decision',()=>{
  const packet=matchStory({source:'match',scenario:'wide',time:16,corrected:false,language:'en',mode:'analyst',focus:7,team:'harbor'}),notes=localPanel(packet),catalog=sourceCatalog(packet,notes),host=catalog.causation_test.posts.find(post=>post.role==='presenter');
  assert.match(host.summary,/23\.7 m/);
  assert.match(host.summary,/Check is right to withhold cause/);
  assert.match(host.summary,/pass release/);
  assert.match(host.summary,/comparable attack without that run/);
});

test('the public quality claim matches the blinded order-reversed score artifact',async()=>{
  const artifact=JSON.parse(await readFile(new URL('../dist/assets/commentary-quality-court.json',import.meta.url),'utf8'));
  assert.equal(artifact.evaluator_passes.length,2);
  assert.equal(artifact.score.overall.crew_points,46);
  assert.equal(artifact.score.overall.baseline_points,45);
  assert.equal(artifact.score.grounding.crew_points,45);
  assert.equal(artifact.score.grounding.baseline_points,43);
  assert.equal(artifact.score.decision_usefulness.crew_points,47);
  assert.equal(artifact.score.decision_usefulness.baseline_points,45);
  assert.ok(artifact.evaluator_passes.every(pass=>pass.response_id));
});
