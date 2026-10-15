import test from 'node:test';
import assert from 'node:assert/strict';
import {repeatsContribution,validateMatchPost} from '../api/match-desk.mjs';
import {localPanel,matchStory} from '../dist/match-story.js';
import {pitchsidePanel,pitchsideStory} from '../dist/pitchside-story.js';
test('obvious copied Host contributions are rejected while a distinct replay takeaway is retained',()=>{
 const summary='The receiving touch lets the nearby defender adjust before the ball moves away.';
 assert.equal(repeatsContribution(summary,[{summary}]),true);
 assert.equal(repeatsContribution(summary.toUpperCase()+'!',[{summary}]),true);
 assert.equal(repeatsContribution(summary+' Look again.',[{summary}]),true);
 assert.equal(repeatsContribution('The outcome is still open. Replay the receiver’s feet before judging the attack.',[{summary}]),false);
 assert.equal(repeatsContribution('Um passe envia a bola a um companheiro.',[{summary:'Um passe envia a bola a um companheiro.'}]),true);
});
test('reviewed closing notes are distinct and preserve corrections and early cutoffs',()=>{
 for(const language of ['en','es','pt'])for(const scenario of ['wide','press','counter'])for(const time of [0,8,18,36]){
  const s=matchStory({scenario,time,language,mode:'fan',team:'harbor',focus:7}),posts=localPanel(s);
  assert.notEqual(posts[0].summary,posts[4].summary);
  assert.ok(posts.every(p=>p.cutoff===time));
 }
 const corrected=localPanel(matchStory({scenario:'wide',time:18,corrected:true,language:'en'}));assert.match(corrected[4].summary,/corrected record/);
 const early=pitchsidePanel(pitchsideStory({time:2,language:'en'}));assert.doesNotMatch(early[4].summary,/leaves view|receiving touch|catch/);
 for(const language of ['en','es','pt']){const posts=pitchsidePanel(pitchsideStory({time:60,language}));assert.notEqual(posts[0].summary,posts[4].summary);}
});
test('Host must supply a localized replay instruction without inventing an actor or metric',()=>{
 for(const [language,cue]of [['en','Replay the receiving touch.'],['es','Repite el toque al recibir.'],['pt','Reveja o toque ao receber.']]){
  const packet=pitchsideStory({time:60,language}),post={interpretation:'The outcome remains open.',headline:'Watch the touch',caution:'The wider play is unknown.',evidence_ids:{primary:'pitchside-blue-receive',secondary:null}};
  assert.throws(()=>validateMatchPost({post},packet,'presenter'),/replay cue/);
  assert.equal(validateMatchPost({post:{...post,replay_cue:cue}},packet,'presenter').replay_cue,cue);
  assert.throws(()=>validateMatchPost({post:{...post,replay_cue:'Replay Moreau running.'}},packet,'presenter'),/Player attribution/);
  assert.throws(()=>validateMatchPost({post:{...post,replay_cue:'Replay the 95 km/h pass.'}},packet,'presenter'),/replay cue/);
 }
});
