import {optionalMedia} from './media-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mediaPlan,localMediaTime,globalMediaTime,bindMedia} from '../dist/film-media.js';
import {sceneGuide} from '../dist/scene-guide.js';
import {pitchsideStory,pitchsidePanel} from '../dist/pitchside-story.js';
import {matchStory} from '../dist/match-story.js';
import {validateMatchPost} from '../api/match-desk.mjs';
import {createSession} from '../dist/match-session.js';
import {FILM_SCENES,scenePlayback,sceneStudy} from '../dist/film-math.js';

class Video extends EventTarget{
 constructor(){super();this.readyState=0;this.currentTime=0;this.paused=true;this.seeking=false;this.loads=0;this.plays=0;}
 load(){this.readyState=0;this.loads++;} pause(){this.paused=true;} play(){this.plays++;this.paused=false;return Promise.resolve();}
 removeAttribute(name){delete this[name];}
 ready(){this.readyState=4;this.dispatchEvent(new Event('loadedmetadata'));this.dispatchEvent(new Event('loadeddata'));}
}
test('a stalled playing film offers recovery and retry restores its evidence time',async()=>{
 const video=new Video(),states=[];let timeout=null;const m=bindMedia(video,s=>states.push(s),{set:fn=>{timeout=fn;return 1;},clear:()=>{timeout=null;}});
 m.sync(mediaPlan({clipTime:22}));video.ready();await m.play();video.dispatchEvent(new Event('waiting'));assert.equal(states.at(-1),'buffering');assert.ok(timeout);timeout();assert.equal(states.at(-1),'slow');
 const retry=m.retry();video.ready();assert.equal(await retry,true);assert.equal(m.globalTime(),22);assert.equal(video.loads,2);assert.equal(states.at(-1),'ready');
 video.dispatchEvent(new Event('stalled'));assert.ok(timeout);m.unload();assert.equal(timeout,null);assert.equal(states.at(-1),'idle');
});
test('a media error resolves pending play and can recover without resetting the playhead',async()=>{
 const video=new Video(),states=[],m=bindMedia(video,s=>states.push(s));m.sync(mediaPlan({clipTime:46,studyScene:true}));const waiting=m.play();video.dispatchEvent(new Event('error'));assert.equal(await waiting,false);assert.equal(states.at(-1),'error');const retry=m.retry();video.ready();assert.equal(await retry,true);assert.equal(m.globalTime(),46);
});
test('scene-local files preserve the global evidence clock at every cut and in full-reel mode',()=>{
 for(const time of [0,.25,7.958333,8,16,23.958333,24,32,40,48,51.958333,52,59.958333,60]){
  const p=mediaPlan({clipTime:time,studyScene:true});assert.equal(globalMediaTime(p,localMediaTime(p,time)),time);
  assert.ok(p.src.startsWith('assets/pitchside-scene-'));if(optionalMedia){assert.ok(fs.existsSync('dist/'+p.src));assert.ok(fs.existsSync('dist/'+p.poster));}
  const reel=mediaPlan({clipTime:time,studyScene:false});assert.equal(reel.offset,0);assert.equal(reel.duration,60);assert.equal(reel.src,'assets/pitchside-minute.mp4');
 }
 const p=mediaPlan({source:'match',scenario:'press',time:29});assert.equal(p.src,'assets/press-film.mp4');assert.equal(localMediaTime(p,29),29);
});
test('the optional scene-study file is small and has metadata before media bytes',{skip:!optionalMedia},()=>{
 const p=mediaPlan({studyScene:true}),b=fs.readFileSync('dist/'+p.src);assert.ok(b.length<2500000);
 const boxes=[];for(let i=0;i+8<b.length;){const size=b.readUInt32BE(i);if(size<8)break;boxes.push(b.toString('ascii',i+4,i+8));i+=size;}
 assert.ok(boxes.indexOf('moov')<boxes.indexOf('mdat'));
});
test('lazy playback seeks on metadata and cancels pending play when a scene changes',async()=>{
 const v=new Video(),states=[],m=bindMedia(v,s=>states.push(s));assert.equal(v.loads,0);
 m.sync(mediaPlan({clipTime:22,studyScene:true}));const pending=m.play();m.sync(mediaPlan({clipTime:34,studyScene:true}));v.ready();
 assert.equal(await pending,false);assert.equal(v.plays,0);assert.equal(v.currentTime,2);assert.equal(m.globalTime(),34);
 assert.equal(await m.play(),true);assert.equal(v.plays,1);assert.ok(states.includes('ready'));
});
test('unloading a hidden player cancels loading and does not resurrect playback',async()=>{
 const v=new Video(),m=bindMedia(v);m.sync(mediaPlan());const pending=m.play();m.unload();v.ready();assert.equal(await pending,false);assert.equal(v.src,undefined);assert.equal(v.plays,0);
});
test('a seek can become playable through canplay without a second loadeddata event',async()=>{
 const v=new Video(),m=bindMedia(v);m.sync(mediaPlan({clipTime:46,studyScene:true}));v.readyState=1;v.dispatchEvent(new Event('loadedmetadata'));const pending=m.play();v.readyState=4;v.dispatchEvent(new Event('seeked'));v.dispatchEvent(new Event('canplay'));assert.equal(await pending,true);assert.equal(v.currentTime,6);assert.equal(v.plays,1);
});

test('a fresh session plays the full minute across every cut and reaches the complete recap',()=>{
 const session=createSession({source:'pitchside'}),initial=mediaPlan(session.get());assert.equal(initial.src,'assets/pitchside-minute.mp4');assert.equal(initial.duration,60);
 for(const scene of FILM_SCENES){
  const state=session.get(),next=scenePlayback(scene.end-.1,Math.min(60,scene.end+.1),state.studyScene);
  assert.equal(next.stop,false);session.set({clipTime:next.time},'film');
  const plan=mediaPlan(session.get());assert.equal(plan.src,initial.src);assert.equal(plan.offset,0);assert.equal(sceneStudy(next.time,state.studyScene).complete,false);
 }
 const story=pitchsideStory({time:session.get().clipTime});assert.equal(story.complete,true);assert.ok(story.recap.includes('sideline'));assert.ok(story.recap.includes('goalkeeper'));assert.ok(story.evidence.some(e=>e.id==='pitchside-blue-receive'));
});
test('seeking while a play request is waiting invalidates the old request',async()=>{
 const v=new Video(),m=bindMedia(v);m.sync(mediaPlan({clipTime:2}));const pending=m.play();m.sync(mediaPlan({clipTime:6}));v.ready();assert.equal(await pending,false);assert.equal(v.plays,0);assert.equal(m.globalTime(),6);
});
test('every empty scene has a localized briefing without exporting future annotations',()=>{
 for(const language of ['en','es','pt'])for(const start of [0,8,16,24,32,40,48,52]){
  const g=sceneGuide(start,language),p=pitchsideStory({time:start,language});assert.ok(g.empty);assert.ok(g.title&&g.lesson);assert.ok(g.firstAt>start);assert.ok(g.firstAt<g.scene.end);
  assert.ok(g.markers.every(m=>!m.reached&&m.title===null));assert.ok(p.evidence.every(e=>e.second<=start));
  const next=sceneGuide(g.firstAt,language);assert.equal(next.empty,false);assert.ok(next.markers.some(m=>m.reached&&m.title));
 }
});
test('Host rejects the observed instruction-shaped conclusion and localized equivalents',()=>{
 for(const [language,takeaway]of [['en','Evaluate how quickly the team transitions from defense to attack after regaining possession.'],['es','Evalúa cómo cambia el equipo tras recuperar.'],['pt','Avalie como a equipe muda após recuperar.']]){
  const packet=matchStory({scenario:'press',time:29,language}),post={takeaway,headline:'Transition',caution:'Only this sequence.',replay_cue:{en:'Replay the forward receiver.',es:'Repite el receptor.',pt:'Reveja o receptor.'}[language],evidence_ids:{primary:'press-evt-004',secondary:null}};
  assert.throws(()=>validateMatchPost({post},packet,'presenter'),/conclusion/);
 }
 const packet=pitchsideStory({time:22}),post={takeaway:'The outcome remains uncertain.',headline:'Control',caution:'Only this scene.',replay_cue:'Replay the next touch.',evidence_ids:{primary:'pitchside-carry',secondary:null}};
 assert.throws(()=>validateMatchPost({post},packet,'presenter'));
 assert.throws(()=>validateMatchPost({post:{...post,takeaway:"Understanding the goalkeeper's role in possession is crucial. This moment illustrates the importance of securing the ball."}},packet,'presenter'),/importance/);
 assert.ok(validateMatchPost({post:{...post,takeaway:pitchsidePanel(packet).find(p=>p.role==='presenter').summary}},packet,'presenter'));
});
