import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENARIOS,events,distance,position} from '../dist/engine.js';
import {analyzePlay,samePlayWindow} from '../dist/play-analysis.js';
import {matchStory,matchExport,localPanel} from '../dist/match-story.js';
import {pitchsideStory,pitchsidePanel} from '../dist/pitchside-story.js';
import {validateMatchPost} from '../api/match-desk.mjs';
const press=SCENARIOS.find(s=>s.id==='press');
test('attack tempo measures regain to shot release, not goal arrival or film progress',()=>{
 assert.equal(analyzePlay(press,9.99).regain,undefined);
 assert.equal(analyzePlay(press,28.99).interval,null);
 const a=analyzePlay(press,29);assert.equal(a.interval,18);assert.equal(a.passes.length,2);
 assert.notEqual(a.interval,19);assert.equal(analyzePlay(SCENARIOS[2],28).interval,20);
 assert.match(a.summary,/18 seconds/);assert.doesNotMatch(analyzePlay(press,28).summary,/Goal recorded/);
});
test('forward passing gain is longitudinal and excludes carries, failed passes and future receptions',()=>{
 const all=events(press),p=all.filter(e=>e.type==='pass'&&e.team==='harbor');
 assert.equal(analyzePlay(press,14.99).forwardGain,null);
 const a=analyzePlay(press,15);assert.equal(a.passes.length,1);assert.equal(a.forwardGain,p[0].endPosition[0]-p[0].start[0]);
 const b=analyzePlay(press,23);assert.ok(Math.abs(b.forwardGain-20.769841269841265)<1e-8);
 assert.notEqual(b.forwardGain,p.reduce((n,e)=>n+e.distance,0));assert.equal(b.passes.length,2);
});
test('pressure compares only the possession window and exports its actual coordinate samples',()=>{
 assert.equal(analyzePlay(press,4.99).pressure,null);
 const a=analyzePlay(press,6.5).pressure;assert.equal(a.end,6.5);assert.ok(a.samples.every(s=>s.second<=6.5));
 assert.equal(a.to,distance(position(press,8,6.5),position(press,106,6.5)));
 const b=analyzePlay(press,29).pressure;assert.equal(b.end,7);assert.ok(b.closed>1.3&&b.closed<1.4);
 assert.doesNotMatch(analyzePlay(press,6).summary,/later interception|Goal recorded/);
});
test('localized calculations, role citations and recap exports stay within their evidence cutoff',()=>{
 for(const language of ['en','es','pt'])for(const time of [0,6,7.5,10,15,23,28.9,29,36]){
  const input={scenario:'press',time,language,team:'harbor',mode:'math'},s=matchStory(input),posts=localPanel(s),out=matchExport(input,posts),ids=new Set(out.evidence.map(e=>e.id));
  assert.equal(out.story.recap,s.analysis.summary);assert.ok(out.analysis.second<=time);
  assert.ok(posts.every(p=>p.evidence_ids.every(id=>ids.has(id))));assert.ok(out.cue.evidence_ids.every(id=>ids.has(id)));
  assert.ok(s.analysis.seen.every(e=>e.end<=time));assert.ok(s.analysis.chapters.filter(c=>c.reached).every(c=>c.at<=time));
  if(time>=10)assert.equal(new Set(posts.map(p=>p.summary)).size,5);
 }
});
test('film editorial challenges are specific to the scene and never announce a future action',()=>{
 const post=(time,role)=>pitchsidePanel(pitchsideStory({time})).find(p=>p.role===role);
 assert.doesNotMatch(post(32.25,'reviewer').summary,/fall is visible/);assert.match(post(36,'reviewer').summary,/fall is visible/);
 assert.doesNotMatch(post(48.25,'reviewer').summary,/gesture is visible/);assert.match(post(50,'reviewer').summary,/gesture is visible/);
 assert.doesNotMatch(post(8.25,'reviewer').summary,/reception verifies/i);assert.match(post(12,'reviewer').summary,/reception verifies/i);
 assert.notEqual(post(22,'reviewer').summary,post(46,'reviewer').summary);
 assert.notEqual(post(22,'presenter').summary,post(22,'analyst').summary);
});
test('generic Host conclusions cannot replace a football-specific takeaway',()=>{
 const packet=pitchsideStory({time:22}),post={takeaway:'The evidence allows viewers to judge how the defender reacts.',headline:'Watch closely',caution:'Only this scene.',replay_cue:'Replay the next touch.',evidence_ids:{primary:'pitchside-carry',secondary:null}};
 assert.throws(()=>validateMatchPost({post},packet,'presenter'),/specific judgment/);
 assert.ok(validateMatchPost({post:{...post,takeaway:'Judge control by access to the next touch, rather than who appears ahead.'}},packet,'presenter'));
 assert.throws(()=>validateMatchPost({post:{...post,takeaway:'Assess if the next receiver is positioned to advance play.'}},packet,'presenter'),/viewing question/);
});
test('a newly completed event retires the old discussion rather than keeping stale math',()=>{
 assert.equal(samePlayWindow(press,14,10),true);
 assert.equal(samePlayWindow(press,15,10),false);
 assert.equal(samePlayWindow(press,23,15),false);
 assert.equal(samePlayWindow(press,36,29),true);
 assert.equal(samePlayWindow(press,28.9,29),false);
});
test('synthetic coordinates cannot become invented technique observations',()=>{
 const p=matchStory({scenario:'press',time:29,language:'en'}),post={interpretation:'The passer adjusted the angle of the pass, shifting from a lateral to a forward trajectory.',headline:'The next pass',caution:'A synthetic sequence.',evidence_ids:{primary:'press-evt-004',secondary:null}};
 assert.throws(()=>validateMatchPost({post},p,'analyst'),/Technique claim/);
 assert.ok(validateMatchPost({post:{...post,interpretation:'The completed pass connects the passer to a receiver closer to goal.'}},p,'analyst'));
});
