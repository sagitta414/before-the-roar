import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_SESSION} from '../dist/match-session.js';
import {buildAccessibleReplay,replayCueAt} from '../dist/accessible-replay-core.js';

test('accessible film replay stops at the reached cutoff and uses only reviewed beats',()=>{
 const plan=buildAccessibleReplay({...DEFAULT_SESSION,source:'pitchside',clipTime:6,language:'en'});
 assert.equal(plan.start,0);assert.equal(plan.end,6);assert.match(plan.video,/pitchside-minute\.mp4$/);
 assert.ok(plan.cues.every(cue=>cue.at<=6));
 assert.ok(plan.cues.every(cue=>typeof cue.detail==='string'));
 assert.ok(plan.evidenceIds.every(id=>!id.includes('reception')));
 assert.match(replayCueAt(plan,6).text,/ball leaves the bottom of the frame/i);
});

test('corrected synthetic replay withdraws movement while retaining completed events',()=>{
 const base={...DEFAULT_SESSION,source:'match',scenario:'wide',time:26,language:'en'};
 const original=buildAccessibleReplay(base),corrected=buildAccessibleReplay({...base,corrected:true});
 assert.equal(corrected.end,26);assert.equal(corrected.revision,2);
 assert.equal(original.revision,1);
 assert.deepEqual(corrected.cues.filter(c=>c.kind==='calculated').map(c=>c.evidenceIds[0]),original.cues.filter(c=>c.kind==='calculated').map(c=>c.evidenceIds[0]));
 assert.match(corrected.cues.find(c=>c.kind==='correction').text,/withdrawn/i);
 assert.ok(corrected.cues.every(cue=>cue.at<=corrected.end));
 assert.ok(!corrected.cues.some(cue=>/the run caused the defender/i.test(cue.text)));
});

test('measured replay uses recorded events, localized captions and synthetic sound positions',()=>{
 const base={...DEFAULT_SESSION,source:'match',scenario:'press',time:18};
 const en=buildAccessibleReplay({...base,language:'en'}),es=buildAccessibleReplay({...base,language:'es'}),pt=buildAccessibleReplay({...base,language:'pt'});
 assert.match(en.cues.find(cue=>cue.at===5).text,/Arlo King completes a pass to Samir Ali/);
 assert.match(es.cues.find(cue=>cue.at===5).text,/Pase|pase/);
 assert.match(pt.cues.find(cue=>cue.at===5).text,/passe/);
 assert.deepEqual(en.cues.filter(cue=>cue.at>0).map(cue=>cue.evidenceIds[0]),['press-evt-001','press-evt-002','press-evt-003']);
 assert.ok(en.cues.filter(cue=>cue.at>0).every(cue=>cue.pan>=-1&&cue.pan<=1));
 assert.equal(en.cues.find(cue=>cue.at===10).possessionChange,true);
 assert.doesNotMatch(en.cues[0].detail,/intercept|Amir Cole/i);
});

test('accessible replay has a discoverable launch, bounded custom player and color key',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 const script=readFileSync(new URL('../dist/accessible-replay.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../dist/accessible-replay.css',import.meta.url),'utf8');
 assert.match(html,/accessible-replay\.js\?v=195/);
 assert.match(html,/accessible-replay\.css\?v=195/);
 assert.match(script,/\.viewing-actions/);
 assert.match(script,/video\.currentTime>=plan\.end/);
 assert.match(script,/aria-live="polite"/);
 assert.match(script,/captionContrast\(\)/);
 assert.match(css,/var\(--btr-home/);
});
