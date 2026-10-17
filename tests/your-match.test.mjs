import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENARIOS,events} from '../dist/engine.js';
import {personalizedMatch} from '../dist/your-match-model.js';
import {createSession} from '../dist/match-session.js';

test('personal highlights change with club, player and lens while staying behind the live cutoff',()=>{
 const s=SCENARIOS.find(item=>item.id==='press');
 const harbor=personalizedMatch(s,23,{team:'harbor',focus:8,mode:'player'});
 const north=personalizedMatch(s,23,{team:'north',focus:106,mode:'fan'});
 assert.notEqual(harbor.moments[0].id,north.moments[0].id);
 assert.ok(harbor.moments[0].playerRelated);
 assert.ok(north.moments.some(item=>item.summary.includes('loses possession')));
 assert.ok(harbor.moments.every(item=>item.time<=23));
 assert.ok(harbor.moments.every(item=>events(s).some(event=>event.id===item.id&&event.end<=23)));
 assert.equal(harbor.player.involvements,2);
 assert.equal(north.player.involvements,2);
 assert.ok(harbor.recap.includes('Mateo Silva'));
 assert.notEqual(harbor.recap,north.recap);
 const crossClub=personalizedMatch(s,23,{team:'north',focus:8,mode:'player'});
 assert.ok(crossClub.moments[0].summary.includes('Your player completes'));
 assert.ok(crossClub.recap.includes('completed passes: 1'));
 assert.ok(crossClub.ranked.some(item=>item.action.includes('intercepts the pass from')));
});

test('pace changes volume, detail keeps metrics optional, and corrections never fabricate an event',()=>{
 const s=SCENARIOS[0],base={team:'harbor',focus:7,language:'en'};
 const early=personalizedMatch(s,0,base);
 assert.equal(early.moments.length,0);
 assert.ok(early.player.noEvent);
 const essential=personalizedMatch(s,36,{...base,insightPace:'essential'});
 const every=personalizedMatch(s,36,{...base,insightPace:'every'});
 assert.equal(essential.moments.length,1);
 assert.equal(every.moments.length,events(s).length);
 assert.notEqual(personalizedMatch(s,36,{...base,mode:'math'}).recap,personalizedMatch(s,36,{...base,mode:'beginner'}).recap);
 const corrected=personalizedMatch(s,36,{...base,corrected:true});
 assert.deepEqual(corrected.ranked.map(x=>x.id),personalizedMatch(s,36,base).ranked.map(x=>x.id));
 assert.ok(corrected.correction.includes('withdrawn'));
 assert.equal(personalizedMatch(s,18,base).correction,null);
});

test('three languages keep names, clocks, and counts tied to the same completed events',()=>{
 const s=SCENARIOS[2];
 const results=['en','es','pt'].map(language=>personalizedMatch(s,28,{language,team:'neutral',focus:9}));
 for(const result of results){
  assert.equal(result.moments.length,3);
  assert.equal(result.player.involvements,2);
  assert.equal(result.complete,false);
  assert.equal(result.ranked.length,events(s).length);
  assert.ok(result.moments.every(item=>item.clock.startsWith('78:')));
 }
 assert.equal(new Set(results.map(result=>result.moments[0].title)).size,3);
});

test('the personal display settings follow the shared match session',()=>{
 const session=createSession();
 session.set({insightPace:'essential',insightDetail:'full',team:'north',focus:106});
 assert.equal(session.get().insightPace,'essential');
 assert.equal(session.get().insightDetail,'full');
 session.set({insightPace:'invalid',insightDetail:'invalid'});
 assert.equal(session.get().insightPace,'balanced');
 assert.equal(session.get().insightDetail,'quick');
});
