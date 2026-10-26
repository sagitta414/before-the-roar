// Derive presentation assets from the shirt-cleaned fictional minute.
// The original generated master and its evidence record stay immutable.
import {readFile, writeFile, readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root='dist/assets';
const clean=`${root}/pitchside-minute-clean.mp4`;
const original=`${root}/pitchside-minute.mp4`;
const run=(args)=>{const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8'});if(result.status!==0)throw Error(result.stderr||'ffmpeg failed');};
const hash=async file=>createHash('sha256').update(await readFile(file)).digest('hex');
run(['-ss','3.5','-i',clean,'-frames:v','1','-q:v','2',`${root}/pitchside-minute-clean-poster.jpg`]);
const cuts=[0,8,16,24,32,40,48,52,60];
for(let index=0;index<8;index++){
 const start=cuts[index],duration=cuts[index+1]-start;
 run(['-ss',String(start),'-i',clean,'-t',String(duration),'-map','0:v','-map','0:a?','-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart',`${root}/pitchside-clean-scene-${index}.mp4`]);
 run(['-ss',String(start+.5),'-i',clean,'-frames:v','1','-q:v','3',`${root}/pitchside-clean-scene-${index}.jpg`]);
}
const files=(await readdir('dist')).filter(name=>/\.(js|html|css)$/.test(name));
for(const name of files){
 const path=`dist/${name}`;
 const before=await readFile(path,'utf8');
 const after=before
  .replaceAll('pitchside-minute.mp4','pitchside-minute-clean.mp4')
  .replaceAll('pitchside-minute-poster.jpg','pitchside-minute-clean-poster.jpg')
  .replaceAll('pitchside-scene-','pitchside-clean-scene-')
  .replaceAll('assets/vision/frame-${String(Math.floor(scene.start)).padStart(2,\'0\')}.jpg','assets/pitchside-clean-scene-${i}.jpg');
 if(after!==before)await writeFile(path,after);
}
await writeFile(`${root}/pitchside-minute-clean-provenance.json`,JSON.stringify({schema:'btr.fictional-film-presentation-edit.v1',source:original,source_sha256:await hash(original),presentation:clean,presentation_sha256:await hash(clean),method:'Tracked jersey-surface inpainting of visible generated shirt marks; no ball, motion, timing, or match-event data changed. Original generated master retained for provenance.',measurement_source:false,shot_continuity_claim:false},null,2)+'\n');
console.log('Published clean fictional film and eight study scenes.');
