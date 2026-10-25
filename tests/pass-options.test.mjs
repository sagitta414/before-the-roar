import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {comparePassOptions} from '../dist/pass-options.js';

const model=JSON.parse(readFileSync(new URL('../dist/assets/tracking/pass-model.json',import.meta.url)));
const roster=[
 {id:6,name:'Amir Cole',team:'harbor',x:20,y:34,confidence:.9},
 {id:8,name:'Mateo Silva',team:'harbor',x:40,y:34,confidence:.9},
 {id:10,name:'Rafael Costa',team:'harbor',x:48,y:26,confidence:.9},
 {id:7,name:'Luca Moreau',team:'harbor',x:37,y:52,confidence:.9},
 {id:101,name:'Max Berg',team:'north',x:36,y:36,confidence:.9},
 {id:102,name:'Jules Laurent',team:'north',x:46,y:24,confidence:.9}
];
const flight={from:roster[0],start:4.2,origin:{x:20,y:34},defenders:roster.slice(4),releaseRoster:roster};
const event={id:'video-1',type:'pass',from:6,to:8,start:4.2,end:5.1,evidence:{firstFrame:126,lastFrame:153}};

test('compares a completed pass only with teammates visible in the release snapshot',()=>{
 const result=comparePassOptions(event,flight,model);
 assert.equal(result.actual.id,8);
 assert.equal(result.alternatives.length,2);
 assert.deepEqual(result.alternatives.map(x=>x.id),[10,7]);
 assert.equal(result.actual.observed,true);
 assert.ok(result.alternatives.every(x=>!x.observed&&Number.isFinite(x.difficulty)&&x.clearance>=0));
 assert.deepEqual(result.sourceFrames,event.evidence);
 assert.match(result.limitation,/neither completion nor player intent is known/);
});

test('withholds comparison when release identity, receiver or defender evidence is missing',()=>{
 assert.equal(comparePassOptions({...event,type:'shot'},flight,model),null);
 assert.equal(comparePassOptions(event,{...flight,releaseRoster:roster.filter(x=>x.id!==8)},model),null);
 assert.equal(comparePassOptions(event,{...flight,defenders:[]},model),null);
 assert.equal(comparePassOptions(event,{...flight,start:3.1},model),null);
 assert.equal(comparePassOptions(event,{...flight,releaseRoster:roster.map(x=>x.id===10?{...x,confidence:.1}:x).filter(x=>x.id!==7)},model),null);
});

test('changing an unplayed route never changes the observed pass or its source',()=>{
 const first=comparePassOptions(event,flight,model);
 const second=comparePassOptions(event,{...flight,releaseRoster:roster.map(x=>x.id===10?{...x,x:60}:x)},model);
 assert.deepEqual(first.actual,second.actual);
 assert.equal(first.eventId,second.eventId);
 assert.notEqual(first.alternatives[0].progress,second.alternatives[0].progress);
});
