import test from 'node:test';
import assert from 'node:assert/strict';
import {judgeProof} from '../dist/judge-mode-model.js';

test('one source revision updates the number, withdraws the claim and changes the narrative',()=>{
 const proof=judgeProof({runId:'test-run',startedAt:100});
 assert.equal(proof.run_id,'test-run');
 assert.deepEqual(proof.outcomes,{calculation_updated:true,claim_withdrawn:true,narrative_changed:true,unaffected_facts_preserved:true});
 assert.equal(proof.original.measurement,'13.0 m');
 assert.equal(proof.corrected.measurement,'0.0 m');
 assert.equal(proof.corrected.status,'withdrawn');
 assert.equal(proof.preserved.passes,'2');
 assert.equal(proof.event.match_clock,'67:16');
 assert.equal(proof.event.id,proof.original.evidence_id);
});

test('the judge proof shows an evidence-backed disagreement and corrected Host output',()=>{
 const proof=judgeProof();
 assert.deepEqual(proof.handoffs.map(item=>item.role),['Scout','Guide','Vector','Check','Host','Truth Lab','Check','Host']);
 assert.ok(proof.handoffs.every(item=>item.evidence.length));
 assert.notEqual(proof.handoffs[4].text,proof.handoffs[7].text);
 assert.match(proof.handoffs[3].text,/does not prove/i);
});
