// Edited captures of the real UI, not a rendered recreation or a continuous recording.
import {readFile,writeFile} from 'node:fs/promises';import {spawn} from 'node:child_process';
const frames=JSON.parse(await readFile('tmp/v43-browser-capture/frames.json','utf8'));
const nearest=t=>frames.reduce((best,f)=>Math.abs(f.time-t)<Math.abs(best.time-t)?f:best,frames[0]);
const segments=[{at:0,length:18},{at:18,length:18},{at:50,length:16,hold:true},{at:52,length:20},{at:72,length:14},{at:85,length:5,hold:true},{at:133,length:14,hold:true}];
const selected=[];for(const s of segments)for(let i=0;i<s.length;i++)selected.push(nearest(s.at+(s.hold?0:i)));
const manifest=selected.map(f=>`file '${f.file}'\nduration 1`).join('\n')+`\nfile '${selected.at(-1).file}'\n`;
await writeFile('tmp/v43-browser-capture/edit.txt',manifest);
const args=['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i','tmp/v43-browser-capture/edit.txt','-t','105','-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2,fps=24','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart','-an','dist/assets/btr-app-demo-v43.mp4'];
await new Promise((resolve,reject)=>{const p=spawn('ffmpeg',args,{stdio:'inherit'});p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(Error('Encoding failed')));});
await writeFile('dist/assets/btr-app-demo-v43-provenance.json',JSON.stringify({schema:'btr.demo-capture.v1',duration_seconds:105,kind:'edited-application-screen-capture',source:'Actual screenshots of the functioning local BTR guided tour',capture_frequency:'approximately one frame per second; selected sections held for reading',continuous_recording:false,fresh_ai:false,content:'Saved v42 AI contributions, deterministic calculations and reviewed notes, labeled in the app',audio:false,synthetic_match_data:true,editing:'Holds the calculation for reading; removes gaps between capture batches; retains the visible correction and audience switches',submission_host_pending:true},null,2));
console.log('Created 105-second edited app capture. No live-generation or continuous-recording claim.');
