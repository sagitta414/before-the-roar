import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {matchStory} from '../dist/match-story.js';

const base={scenario:'wide',time:16,corrected:false,language:'en',focus:7,team:'harbor'};

test('fan and tactical modes answer different audience needs',()=>{
 const fan=matchStory({...base,mode:'fan'}),analyst=matchStory({...base,mode:'analyst'}),beginner=matchStory({...base,mode:'beginner'}),math=matchStory({...base,mode:'math'}),player=matchStory({...base,mode:'player'});
 assert.equal(new Set([fan.body,analyst.body,beginner.body,math.body,player.body]).size,5);
 assert.match(fan.body,/duel|replay/i);
 assert.match(analyst.body,/channel|spacing|positional/i);
 assert.match(beginner.body,/run|player|ball/i);
 assert.match(math.body,/23\.7|pass/i);
 assert.match(player.body,/Moreau|m /i);
});

test('corrected fan and tactical modes cannot retain the withdrawn defender movement',()=>{
 for(const language of ['en','es','pt'])for(const mode of ['fan','analyst']){
  const story=matchStory({...base,corrected:true,language,mode});
  assert.match(story.body,/0[.,]0 m|starting position|posición inicial|posição inicial/i);
  assert.doesNotMatch(story.body,/Laurent shifts laterally|Laurent se desplaza lateralmente|Laurent se desloca lateralmente/i);
 }
});

test('v112 presents a concise judge dashboard and progressive disclosure',async()=>{
 const source=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
 for(const text of ['JUDGE SNAPSHOT','269 TESTS','39 / 40','Fixed-camera synthetic holdout','2 SCREENS','Open the full production lab','Lineups +','Broadcast feeling. Measured proof.','NO TRANSFERRED METRICS','MICROSOFT FOUNDRY'])assert.match(source,new RegExp(text));
 const watch=await readFile(new URL('../dist/match-watch.js',import.meta.url),'utf8');
 assert.doesNotMatch(watch,/Ask the crew · 1 AI request/);
 assert.match(watch,/Ask the crew · 4 AI requests/);
 const index=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  assert.match(index,/cohesion\.css\?v=126/);
  assert.match(index,/wide-desktop\.css\?v=135/);
  assert.match(index,/cohesion\.js\?v=126/);
  assert.match(index,/match-watch\.js\?v=116/);
  assert.match(index,/watch-evidence-chain\.css\?v=133/);
  assert.match(index,/watch-evidence-chain\.js\?v=132/);
  assert.match(index,/id="chain-tab"/);
  assert.match(index,/id="chain-panel"/);
  assert.match(index,/guided-tour\.css\?v=113/);
  assert.match(index,/guided-tour\.js\?video=65&v=122/);
});

test('live action leads and deeper proof stays inspectable on demand',async()=>{
 const cohesion=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
 const tour=await readFile(new URL('../dist/guided-tour.js',import.meta.url),'utf8');
 assert.match(cohesion,/liveStage\.after\(dossier,executionKey\)/);
 assert.match(tour,/liveStage\.after\(launcher\)/);
 assert.match(cohesion,/inside-operations/);
 assert.match(cohesion,/46–45 OVERALL · 45–43 GROUNDING · 47–45 DECISION/);
});

test('judge evidence uses current results and publishes visual limits',async()=>{
 const room=await readFile(new URL('../dist/evidence-room.html',import.meta.url),'utf8');
 const roomScript=await readFile(new URL('../dist/evidence-room.js',import.meta.url),'utf8');
 const tour=await readFile(new URL('../dist/guided-tour.js',import.meta.url),'utf8');
 const demo=await readFile(new URL('../scripts/create-cinematic-judge-demo.mjs',import.meta.url),'utf8');
 assert.match(room,/39 of 40 events found\. In a controlled fixture\./);
 assert.match(room,/fixed camera, known pitch calibration, enrolled colour markers/i);
 assert.match(room,/eight independently generated shots/i);
 assert.match(room,/not presented as one continuously observed play/i);
 assert.doesNotMatch(room,/retained comparison below predates|new photorealistic film has not been rendered/i);
 assert.match(roomScript,/assets\/tracking\/holdout-current\.json/);
 assert.match(roomScript,/assets\/commentary-quality-court\.json/);
 assert.match(tour,/fixed-camera synthetic holdout/);
 assert.match(demo,/EDITED GENERATED SHOTS · NOT CONTINUOUS PLAY/);
 assert.match(demo,/FontSize=13/);
});

