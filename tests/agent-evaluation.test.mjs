import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluateBaseline,EXTENDED_CASES,FOLLOW_UP_QUESTION,blindReviewPack} from '../api/agent-evaluation.mjs';
import {matchStory,localPanel} from '../dist/match-story.js';

test('the comparison rejects repeated follow-ups and keeps a new Guide question free of the opening definition',()=>{
 const packet=matchStory(EXTENDED_CASES[0].input);
 const raw={
  analyst:{interpretation:'The runner moves wide while the defender shifts toward the same side.'},
  guide:{viewing_question:'Does the defender move toward the runner?'},
  presenter:{takeaway:'Central progression and the wide run are different parts of this attack.',replay_cue:'Replay the runner and defender together.'}
 };
 for(const p of Object.values(raw))Object.assign(p,{headline:'Follow the route',caution:'Causation remains unproven.',evidence_ids:{primary:'wide-evt-002',secondary:null}});
 const support=localPanel(packet).filter(p=>['math','reviewer'].includes(p.role));
 const opening=evaluateBaseline(raw,packet,{support});assert.equal(opening.accepted,3);
 const repeat=evaluateBaseline(raw,packet,{support,previous:opening.posts});assert.equal(repeat.accepted,0);assert.ok(repeat.rejections.every(p=>/previous contribution/.test(p.reason)));
 raw.guide.viewing_question='Is the receiver beside the touchline or in the centre?';
 const follow=evaluateBaseline(raw,packet,{support,previous:opening.posts});
 assert.equal(follow.posts.find(p=>p.role==='guide').summary,raw.guide.viewing_question);
});

test('blind review retains rejected proposals instead of substituting the crew fallback',()=>{
 const pack=blindReviewPack({policy:'test',cases:[{id:'rejected',team:{raw:{analyst:{post:{interpretation:'Rejected original'}}},posts:[{role:'analyst',summary:'Authored fallback'}]},baseline:{raw:{analyst:{interpretation:'Baseline original'}},posts:[]}}]});
 assert.equal(pack.cases[0].arms[0].posts[0].summary,'Rejected original');
 assert.equal(pack.cases[0].arms[1].posts[0].summary,'Baseline original');
 assert.equal(pack.cases[0].arms[0].posts[1].summary,null);
});

test('the preregistered conversation comparison has twelve paired cases within sixty requests',async()=>{
 const plan=JSON.parse(await readFile(new URL('../docs/proof/v44-evaluation-plan.json',import.meta.url)));
 assert.deepEqual(plan.cases,EXTENDED_CASES.slice(0,11));assert.equal(plan.follow_up.parent,plan.cases[0].id);
 assert.equal(plan.follow_up.question,FOLLOW_UP_QUESTION);assert.equal(plan.follow_up.paired,true);
 assert.equal(plan.maximum_requests,plan.cases.length*5+5);assert.equal(plan.maximum_requests,60);
});
