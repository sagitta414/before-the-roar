import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VideoTracker,createPixelDetector,passEstimate,passFeatures} from '../dist/tracking-model.js';
const cal=JSON.parse(readFileSync(new URL('../dist/assets/tracking/calibration.json',import.meta.url)));
const model=JSON.parse(readFileSync(new URL('../dist/assets/tracking/pass-model.json',import.meta.url)));
const players=()=>[{id:6,team:'harbor',x:10,y:34},{id:8,team:'harbor',x:30,y:34},{id:101,team:'north',x:40,y:40}];
function run({missing=false,teleport=false}={}){const tracker=new VideoTracker(cal,model);for(let i=0;i<30;i++){const t=i/10,x=t<1?10:t<2?10+(t-1)*20:30;tracker.update({players:players(),ball:missing?null:{x:teleport&&t>=1?104:x,y:34}},t);}return tracker;}
test('observed transfer emits one attributed pass with release-time evidence',()=>{const t=run();assert.equal(t.events.length,1);const e=t.events[0];assert.equal(e.type,'pass');assert.equal(e.from,6);assert.equal(e.to,8);assert.ok(e.speed>60&&e.speed<80);assert.equal(e.quality.distance,20);assert.ok(e.evidence.firstFrame<e.evidence.lastFrame);});
test('no ball evidence means no invented event',()=>{const t=run({missing:true});assert.equal(t.events.length,0);assert.match(t.status,/withheld/);});
test('a teleport cannot masquerade as a shot',()=>assert.equal(run({teleport:true}).events.length,0));
test('seeking resets events and requires new evidence',()=>{const t=run();assert.equal(t.events.length,1);t.update({players:players(),ball:{x:10,y:34}},0);assert.equal(t.events.length,0);});
test('missing player evidence prevents pass attribution',()=>{const t=new VideoTracker(cal,model);for(let i=0;i<30;i++)t.update({players:[],ball:{x:10+i,y:34}},i/10);assert.equal(t.events.length,0);assert.match(t.status,/withheld/);});
test('difficulty increases with length, receiver pressure and obstructed lane',()=>{const f={distance:20,pressure:8,clearance:6},base=passEstimate(f,model).difficulty;for(const change of [{distance:40},{pressure:1},{clearance:.5}])assert.ok(passEstimate({...f,...change},model).difficulty>base);assert.equal(passEstimate({...f,pressure:null},model),null);});
test('passing-lane clearance uses the segment, not the infinite line',()=>{const f=passFeatures({x:0,y:0},{x:10,y:0},[{x:20,y:0}]);assert.equal(f.clearance,10);assert.equal(f.pressure,10);});
test('synthetic held-out model improves over constant baseline',()=>{assert.equal(model.test,800);assert.ok(model.brier<model.baselineBrier);});
test('pixel enrollment recognizes a moved marker and evidence removal withholds it',()=>{const w=480,h=320,data=new Uint8ClampedArray(w*h*4),rgb=cal.roster[0].color;for(let y=80;y<84;y++)for(let x=120;x<125;x++){const k=(y*w+x)*4;data.set([...rgb,255],k);}const detect=createPixelDetector(cal),d=detect(data,w,h);assert.equal(d.players.length,1);assert.equal(d.players[0].id,cal.roster[0].id);assert.ok(d.players[0].x>10&&d.players[0].x<30);assert.equal(detect(data,w,h,{hideTracking:true}).players.length,0);assert.equal(d.ball,null);});
