import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPerspectiveRecap,detectMatchSignals,signalDefinition,spatialDescription} from '../dist/pocket-accessibility.js';

const event=(id,type,end,extra={})=>({id,record_type:'event',type,end,team:'harbor',outcome:'complete',...extra});
const story=(events,extra={})=>({cutoff:20,clock:'67:20',title:'Reached play',body:'A bounded explanation.',analysis:{seen:events,pressure:null},brief:{language:'en',player:{id:7,name:'Luca Moreau',displacement:12.4}},evidence:[...events,{id:'calc-1',record_type:'derived_analysis',second:20,description:'Two completed passes.'}],review:{decision:'qualify',reason:'The timing does not prove cause.',evidence_ids:events.map(item=>item.id)},...extra});

test('sensory cues are distinct and evidence-triggered',()=>{
 const before=story([event('p1','pass',5)]),after=story([event('p1','pass',5),event('t1','tackle',12),event('s1','shot',18,{outcome:'saved'})]);
 assert.deepEqual(detectMatchSignals(before,after).map(signal=>signal.kind),['possession','shot']);
 assert.notDeepEqual(signalDefinition('possession','harbor').pattern,signalDefinition('possession','north').pattern);
 assert.deepEqual(signalDefinition('correction').pattern,[30,52,30]);
 assert.deepEqual(signalDefinition('shot').pattern,[82]);
 assert.equal(detectMatchSignals(after,after).length,0);
});

test('spoken movement description preserves the measurement limitation',()=>{
 assert.match(spatialDescription(story([])),/12\.4 metres/);
 assert.match(spatialDescription(story([])),/not total distance run/);
});

test('Perspective Director exports a bounded evidence package',()=>{
 const reached=story([event('p1','pass',5,{from:7,to:8}),event('s1','shot',18,{from:9,outcome:'saved'})]);
 const player=buildPerspectiveRecap({preset:'player',story:reached,alternateStory:reached,focusName:'Luca Moreau'});
 assert.equal(player.schema,'btr.perspective-recap.v1');
 assert.equal(player.synthetic,true);
 assert.deepEqual(player.entries.flatMap(entry=>entry.evidence_ids),['p1']);
 assert.ok(player.entries.every(entry=>entry.timestamp_s<=reached.cutoff));
 const disputed=buildPerspectiveRecap({preset:'disputed',story:reached,alternateStory:reached,corrected:true});
 assert.equal(disputed.correction_status,'corrected');
 assert.match(disputed.entries[0].narration,/withdrawn/i);
 const spanish=buildPerspectiveRecap({preset:'spanish20',story:{...reached,brief:{...reached.brief,language:'es'},body:'La jugada está revisada.'},alternateStory:{...reached,body:'La jugada está revisada.'}});
 assert.equal(spanish.language,'es');
 assert.equal(spanish.target_duration_s,20);
});
