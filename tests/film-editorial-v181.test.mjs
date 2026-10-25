import test from 'node:test';
import assert from 'node:assert/strict';
import {unsupportedFilmIntent,filmHostContributionIssue,filmHostRemit,filmHostPolicy} from '../api/film-editorial-contract.mjs';
import {validateMatchPost} from '../api/match-desk.mjs';
import {pitchsideStory} from '../dist/pitchside-story.js';

test('an unrelated disclaimer cannot launder a hedged intent claim',()=>{
 for(const text of [
  'This stance suggests an intent to contest the ball, but it does not confirm an active tackle or interception.',
  'The defender appears to want the ball. The outcome is unverified.',
  'The position indicates intent; intent is otherwise unknown.',
  'Su postura sugiere intención de disputar el balón, pero no confirma una entrada.',
  'A postura sugere intenção de disputar a bola, mas não confirma um desarme.'
 ]) assert.equal(unsupportedFilmIntent(text),true,text);
 for(const text of ['Intent remains unverified based on this evidence.','The stance does not establish intent to challenge or intercept.','The visible duel can be described, but its purpose or success cannot be asserted.'])assert.equal(unsupportedFilmIntent(text),false,text);
});
test('opening intent guard applies to the headline as well as the main text',()=>{
 const packet=pitchsideStory({time:25,language:'en'});
 const post={interpretation:'The defender is close to the attacker.',headline:'Intent to contest',caution:'The outcome is unverified.',evidence_ids:{primary:packet.evidence.at(-1).id}};
 assert.throws(()=>validateMatchPost({post},packet,'analyst',{round:1}),/Unsupported player intent/);
});
test('Host must add an editorial decision instead of a second evidence audit',()=>{
 const scout=[{summary:'The defender’s positioning does not establish intent to challenge or intercept.'}];
 assert.ok(filmHostContributionIssue('The defender’s positioning does not establish intent to challenge or intercept. The visible duel can be described.',scout));
 assert.ok(filmHostContributionIssue('The evidence confirms a pass but does not establish a line break; a wider view is needed.',[]));
 assert.equal(filmHostContributionIssue('The broadcast can describe a marking position. Marking and a completed tackle are different claims.',scout),null);
 assert.equal(filmHostContributionIssue('Controlling the ball and getting past an opponent are different achievements.',[]),null);
});

test('opening Host cannot add unrecorded pressure or prevention',()=>{
 const packet=pitchsideStory({time:22,language:'en'});
 const post={takeaway:'The attacker’s close control maintains pressure on the defender, preventing an immediate escape.',headline:'Close control',caution:'The result is unverified.',replay_cue:'Replay the touch.',evidence_ids:{primary:packet.evidence.at(-1).id}};
 assert.throws(()=>validateMatchPost({post},packet,'presenter',{round:1}),/causal effect/);
 assert.ok(filmHostContributionIssue('The defender’s close positioning indicates a potential challenge, but the shot does not confirm any defensive action or tackle.',[]));
});

test('source remit requires both football concepts, not a magic publication word',()=>{
 const packet=pitchsideStory({time:12,language:'en'}),remit=filmHostRemit(packet);
 assert.equal(remit.kind,'connection');
 assert.ok(filmHostContributionIssue('The broadcast shows a pass.',[],remit));
 assert.equal(filmHostContributionIssue('A completed pass is not proof of breaking the defensive line.',[],remit),null);
 assert.match(filmHostPolicy(packet),/NOT continuous match play/);
 for(const language of ['en','es','pt'])assert.match(filmHostPolicy(pitchsideStory({time:12,language})),/application supplies the reviewed headline, caution and replay cue/);
 assert.equal(filmHostRemit(pitchsideStory({time:22})).kind,'control');
 assert.equal(filmHostRemit(pitchsideStory({time:25})).kind,'marking');
});

test('the recorded pressure and failed-escape paraphrase is rejected',()=>{
 const packet=pitchsideStory({time:22,language:'en'});
 for(const interpretation of ["The defender's position remains reactive, indicating ongoing pressure.","The attacker's touch is not leading to an escape."]){
 assert.throws(()=>validateMatchPost({post:{interpretation,headline:'Close control',caution:'Outcome unverified.',evidence_ids:{primary:packet.evidence.at(-1).id}}},packet,'analyst',{round:2}),/unverified outcome/);
 }
});
