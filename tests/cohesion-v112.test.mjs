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

test('v112 presents a concise judge dashboard and progressive disclosure',async()=>{
 const source=await readFile(new URL('../dist/cohesion.js',import.meta.url),'utf8');
 for(const text of ['JUDGE SNAPSHOT','238 TESTS','100 FIXTURES','Open the full production lab','Lineups +'])assert.match(source,new RegExp(text));
 const index=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 assert.match(index,/cohesion\.css\?v=112/);
 assert.match(index,/cohesion\.js\?v=112/);
});
