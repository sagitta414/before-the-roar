import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMatchPost} from '../api/match-desk.mjs';
import {matchStory} from '../dist/match-story.js';
import {followUpMetric} from '../api/conversation.mjs';

const input={scenario:'wide',time:26,corrected:true,language:'pt',mode:'math',focus:7,team:'harbor'};
test('follow-up math uses reached tracking and never switches to a missing shot',()=>{
 const original=matchStory({...input,time:16,corrected:false,language:'en'}),corrected=matchStory({...input,time:16,language:'en'});
 assert.equal(followUpMetric(original).value,'13.0 m');
 assert.equal(followUpMetric(corrected).value,'0.0 m');
 assert.deepEqual(followUpMetric(corrected).evidence_ids,[corrected.football.record.id]);
 const early=matchStory({...input,scenario:'press',time:6,corrected:false});
 const metric=followUpMetric(early);
 assert.ok(!metric||metric.value!=='—');
});
test('Portuguese correction is accepted without weakening causation and numeric guards',()=>{
 const packet=matchStory(input);
 const post={headline:'A explicação muda',caution:'A influência continua sem comprovação.',takeaway:'A correção muda a explicação: o avanço central permanece registrado, mas o relato de que o defensor acompanhou a corrida foi retirado.',replay_cue:'Reveja o corredor e o defensor.',evidence_ids:{primary:packet.football.record.id,secondary:null}};
 assert.ok(validateMatchPost({post},packet,'presenter'));
 assert.throws(()=>validateMatchPost({post:{...post,takeaway:'A correção mostra que a corrida não influenciou o defensor.'}},packet,'presenter'),/no influence/);
 assert.throws(()=>validateMatchPost({post:{...post,takeaway:post.takeaway+' O avanço foi 23 m.'}},packet,'presenter'),/Invalid editorial/);
 assert.throws(()=>validateMatchPost({post:{...post,evidence_ids:{primary:'future-record'}}},packet,'presenter'),/cutoff/);
 assert.throws(()=>validateMatchPost({post:{...post,takeaway:'A correção revela uma distração defensiva.'}},packet,'presenter'),/attention/);
});
