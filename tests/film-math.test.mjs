import test from 'node:test';
import assert from 'node:assert/strict';
import {filmMath,scenePlayback,sceneStudy} from '../dist/film-math.js';
import {pitchsideStory,pitchsidePanel,PITCHSIDE_BEATS,pitchsideExport} from '../dist/pitchside-story.js';
const math=(time,language='en')=>filmMath({time,language,evidence:pitchsideStory({time,language}).evidence});
test('local football numbers use reviewed roles and never carry an overload across a cut',()=>{
 assert.equal(math(8).value,'—');assert.equal(math(8.25).value,'2 v 1');assert.equal(math(8.25).edge,1);
 assert.equal(math(16).value,'—');assert.equal(math(16.25).value,'1 v 1');assert.equal(math(22).edge,0);
 assert.equal(math(52.25).edge,null);assert.equal(math(52.25).players.defenders,null);
 assert.equal(pitchsideStory({time:24}).resolved,false);
});
test('receiving and goalkeeper counts never become pass accuracy or save percentage',()=>{
 assert.equal(math(11.99).receptions,null);assert.equal(math(12).receptions,1);
 assert.equal(math(22).receptions,null);assert.equal(math(55.99).receptions,null);assert.equal(math(56).receptions,1);
 assert.equal(math(40.74).catches,null);assert.equal(math(40.75).catches,1);
 for(const time of [12,44,56])assert.ok(!/\d\s*%/.test(math(time).equation));
});
test('every film calculation cites available records from its own scene in all languages',()=>{
 for(const language of ['en','es','pt'])for(const time of [0,...PITCHSIDE_BEATS.map(b=>b.second),60]){
  const p=pitchsideStory({time,language}),m=math(time,language),post=pitchsidePanel(p).find(p=>p.role==='math');
  assert.equal(post.summary,m.summary);assert.equal(post.working,m.equation);assert.ok(!/clip progress|37%|progreso del clip|progresso do clipe/i.test(post.summary));
  assert.ok(m.evidence_ids.every(id=>m.records.some(e=>e.id===id&&e.second<=time)));
  assert.equal(pitchsideExport({time,language}).calculations,m.equation);
 }
});
test('one-scene playback stops before a cut and normal reel playback remains continuous',()=>{
 assert.deepEqual(scenePlayback(7.9,8.1,false),{time:8.1,stop:false});
 assert.deepEqual(scenePlayback(7.9,8.1,true),{time:8-1/24,stop:true});
 assert.deepEqual(scenePlayback(22,22.5,true),{time:22.5,stop:false});
 assert.equal(scenePlayback(59.9,60,true).time,60-1/24);
});
test('scene completion gets its own render state inside the final half-second',()=>{
 const before=sceneStudy(23.6,true),after=sceneStudy(scenePlayback(23.8,24.1,true).time,true);
 assert.equal(before.complete,false);assert.equal(after.complete,true);
 assert.equal(after.replayAt,16);assert.equal(after.nextAt,24);
 assert.equal(sceneStudy(60-1/24,true).nextAt,0);assert.equal(sceneStudy(60-1/24,false).complete,false);
});
