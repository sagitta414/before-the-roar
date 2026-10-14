import test from 'node:test';
import assert from 'node:assert/strict';
import {specialistTools} from '../api/desk-tools.mjs';
import {CLIP_BEATS} from '../dist/featured-clip.js';
import {PRESENTER_PROFILES,PRESENTER_IDS} from '../dist/presenter-profiles.js';
import {PartyThread} from '../dist/party-state.js';

test('specialist tools use source timestamps with units and refuse unavailable physical metrics',()=>{
 for(const language of ['en','es','pt']){
  const tools=specialistTools('math',language);
  assert.deepEqual(tools.items.map(x=>x.value),[1.3,1.2]);
  for(const item of tools.items){const [a,b]=item.evidence_ids.map(id=>CLIP_BEATS.find(x=>x.id===id));assert.equal(item.value,Math.round((b.at-a.at)*100)/100);assert.equal(item.unit,'seconds');assert.ok(item.note);assert.ok(item.expression.includes(' s'));assert.ok(!item.expression.includes('km'));}
  for(const unavailable of ['shot_speed','goalkeeper_reaction_time','xG','pass_accuracy'])assert.ok(tools.unavailable.includes(unavailable));
  const guide=specialistTools('guide',language);assert.equal(guide.items.length,3);assert.equal(guide.source,'curated-localized-football-glossary');assert.ok(guide.items.every(i=>i.label&&i.text&&i.evidence_ids.every(id=>CLIP_BEATS.some(b=>b.id===id))));
 }
 assert.match(specialistTools('math','en').items[1].note,/Not ball travel time or goalkeeper reaction time/);
 assert.equal(specialistTools('analyst'),null);
});

test('five agent identities share profiles, question prompts and thread acceptance without draft regression',()=>{
 assert.deepEqual(PRESENTER_IDS,['analyst','guide','math','reviewer','presenter']);
 const thread=new PartyThread('en','fan');
 for(const p of PRESENTER_PROFILES){assert.ok(p.prompt&&p.tools&&p.boundary&&p.handoff);assert.equal(p.expertise.length,3);assert.equal(p.method.length,3);assert.ok(p.question.length<=180);thread.accept('draft',{role:p.id,summary:'draft'});thread.accept('post',{role:p.id,summary:'final',tools:specialistTools(p.id)});thread.accept('draft',{role:p.id,summary:'stale'});assert.equal(thread.posts.get(p.id).summary,'final');assert.equal(thread.drafts.has(p.id),false);}
 thread.accept('post',{role:'invented',summary:'invalid'});assert.equal(thread.posts.size,5);assert.equal(thread.posts.get('math').tools.items[0].value,1.3);
});
