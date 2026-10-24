import test from 'node:test';import assert from 'node:assert/strict';import {scoreClips} from '../scripts/score-external-benchmark.mjs';
const clip={annotation_status:'human-reviewed',used_for_tuning:false,duration_seconds:60,rejected:false,truth:[{type:'pass',second:3}],detected:[{type:'pass',second:3.1},{type:'pass',second:3.2}]};
test('benchmark matches one detection per annotation and retains false positives',()=>{const s=scoreClips([clip]);assert.equal(s.events.matched,1);assert.equal(s.events.precision,.5);assert.equal(s.events.recall,1);assert.equal(s.events.false_positives_per_minute,1);assert.equal(s.speed.mae_kmh,null);assert.equal(s.identity.accuracy,null);});
test('rejected unseen clips count as misses instead of disappearing from recall',()=>{const s=scoreClips([{...clip,rejected:true,detected:[]}]);assert.equal(s.events.recall,0);assert.equal(s.events.precision,null);assert.equal(s.compatibility.rejection_rate,1);});
test('unreviewed labels and unsupported speed references cannot produce claims',()=>{assert.throws(()=>scoreClips([{...clip,annotation_status:'automatic'}]));assert.throws(()=>scoreClips([{...clip,speeds:[{reference_method:'guessed',reference_kmh:20,detected_kmh:21}]}]));});

test('invalid annotations are rejected even when detector found nothing',()=>{assert.throws(()=>scoreClips([{...clip,detected:[],truth:[{type:'pass',second:Infinity}]}]));});
