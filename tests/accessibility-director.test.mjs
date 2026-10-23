import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ACCESSIBILITY_MOMENTS,ACCESSIBILITY_PROFILES,accessibleStatus,defaultAccessibilitySettings,descriptiveLine,momentAt,settingsForProfile} from '../dist/accessibility-core.js';

test('accessibility profiles provide distinct multimodal experiences',()=>{
 assert.equal(ACCESSIBILITY_PROFILES.vision.settings.narration,true);
 assert.equal(ACCESSIBILITY_PROFILES.hearing.settings.captions,true);
 assert.equal(ACCESSIBILITY_PROFILES.cognitive.settings.plainLanguage,true);
 assert.equal(ACCESSIBILITY_PROFILES.sensory.settings.reducedMotion,true);
 assert.notDeepEqual(ACCESSIBILITY_PROFILES.vision.settings,ACCESSIBILITY_PROFILES.hearing.settings);
});

test('profile settings retain explicit user choices while adding the preset',()=>{
 const settings=settingsForProfile('hearing',{...defaultAccessibilitySettings(),largeText:true});
 assert.equal(settings.profile,'hearing');
 assert.equal(settings.captions,true);
 assert.equal(settings.transcript,true);
 assert.equal(settings.largeText,true);
 assert.match(accessibleStatus(settings),/tools active/);
});

test('descriptive transcript follows the current play and exposes a correction',()=>{
 assert.equal(momentAt(0).clock,'67:00');
 assert.equal(momentAt(17).clock,'67:16');
 assert.equal(momentAt(59).kind,'correction');
 assert.match(descriptiveLine(momentAt(8),{plainLanguage:true}),/67:08/);
 assert.match(descriptiveLine(null,{correction:true}),/claim is withdrawn/);
 assert.equal(ACCESSIBILITY_MOMENTS.length,8);
});

test('desktop and pocket surfaces load the shared accessibility system',async()=>{
 const [desktop,pocket,script]=await Promise.all([
  readFile(new URL('../dist/index.html',import.meta.url),'utf8'),
  readFile(new URL('../dist/pocket-director.html',import.meta.url),'utf8'),
  readFile(new URL('../dist/pocket-director.js',import.meta.url),'utf8')
 ]);
 assert.match(desktop,/accessibility-director\.js\?v=170/);
 assert.match(desktop,/accessibility-director\.css\?v=170/);
 assert.match(pocket,/data-access-profile="vision"/);
 assert.match(pocket,/DESCRIPTIVE MATCH TRANSCRIPT/);
 assert.match(script,/ACCESSIBILITY_MOMENTS/);
});
