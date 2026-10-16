import test from 'node:test';
import assert from 'node:assert/strict';
import {createTourClock} from '../dist/tour-clock.js';
test('the full 105-second tour advances without animation frames or media playback',()=>{
 let now=0;const tour=createTourClock(()=>now);tour.start();
 for(const [second,step]of [[0,0],[17,0],[18,1],[36,2],[52,3],[72,4],[105,4]]){now=second*1000;assert.equal(tour.read().step,step);}
 assert.equal(tour.read().status,'complete');assert.equal(tour.read().seconds,105);assert.equal(tour.read().language,'es');assert.equal(tour.read().mode,'math');assert.equal(tour.read().corrected,true);
});
test('pausing preserves elapsed time and resume continues instead of restarting',()=>{
 let now=0;const tour=createTourClock(()=>now);tour.start();now=53000;tour.pause();now=200000;assert.equal(tour.read().seconds,53);assert.equal(tour.read().status,'paused');tour.resume();now+=7000;assert.equal(tour.read().seconds,60);assert.equal(tour.read().corrected,true);tour.reset();assert.equal(tour.read().status,'idle');tour.start();assert.equal(tour.read().seconds,0);
});
