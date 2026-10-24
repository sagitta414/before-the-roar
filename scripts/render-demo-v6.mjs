import {readFile,writeFile,mkdir,copyFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const sharp=require(process.env.BTR_SHARP_PATH||'C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const work='tmp/submission-demo-v6', raw='tmp/demo-v6-capture', archive='demo/showcase-v174';
await mkdir(archive,{recursive:true});await mkdir(work,{recursive:true});
const scenes=JSON.parse(await readFile('scripts/demo-v6-scenes.json','utf8'));
const rebuild=process.argv.find(x=>x.startsWith('--rebuild='))?.split('=')[1].split(',');
function run(args){const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8',maxBuffer:8e6});if(r.status!==0)throw Error(r.stderr||String(r.error));}
function seconds(file){const r=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',file],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);return Number(r.stdout.trim());}
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
function text(s,x,y,size=40,color='#fff',weight=700){return `<text x="${x}" y="${y}" fill="${color}" font-family="Arial" font-size="${size}" font-weight="${weight}">${esc(s)}</text>`;}
function lines(s,x,y,width=42,size=44,color='#fff'){let out='',line='',row=0;for(const w of s.split(' ')){if((line+w).length>width){out+=text(line,x,y+row++*(size*1.35),size,color);line='';}line+=w+' ';}return out+text(line.trim(),x,y+row*size*1.35,size,color);}
const svg=body=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">${body}</svg>`);
const base=`<defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#142638"/><stop offset="1" stop-color="#03070e"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#g)"/><path d="M0 890L1920 180M0 1040L1920 330" stroke="#193247" stroke-width="2"/><path d="M1540 0L1240 1080H1320L1620 0Z" fill="#ff315d" opacity=".08"/>`;
const signature=(()=>{const rate=48000,n=rate*3,b=Buffer.alloc(44+n*2);b.write('RIFF');b.writeUInt32LE(36+n*2,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);for(let i=0;i<n;i++){const t=i/rate;let v=0;for(const [start,f] of [[0,196],[.24,293.665],[.52,392]]){const q=t-start;if(q>=0)v+=(Math.sin(2*Math.PI*f*q)+.25*Math.sin(2*Math.PI*f*2*q))*Math.min(1,q/.015)*Math.exp(-q*3.5)*.14;}b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2);}return b;})();
await writeFile(`${archive}/btr-original-sonic.wav`,signature);
// Timestamp-preserving screen capture: no frames or pauses removed from the correction.
for(const [name,timing] of [['correction','correction'],['architecture','trace']]){
 if(rebuild) continue;
 const frames=JSON.parse(await readFile(`${raw}/${timing}-timing.json`,'utf8'));let list='';
 for(let i=0;i<frames.length;i++){const span=i+1<frames.length?frames[i+1].time-frames[i].time:.1;list+=`file '${frames[i].file}'\nduration ${Math.max(.001,span)}\n`;}
 list+=`file '${frames.at(-1).file}'\n`;await writeFile(`${raw}/${name}.txt`,list);
 run(['-f','concat','-safe','0','-i',`${raw}/${name}.txt`,'-vf','scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',`${archive}/${name}-uncut.mp4`]);
 await copyFile(`${raw}/${timing}-timing.json`,`${archive}/${name}-timing.json`);
}
await copyFile(`${raw}/phone.png`,`${archive}/phone-r2.png`);
const crewCopy={scout:['THE OBSERVATION','A run wide. A defender shifts.','Potential space inside','SYNTHETIC TRACKING / R1'],guide:['THE EXPLANATION','Movement without the ball.','Watch the defender’s response','BEGINNER VIEW / SAME EVIDENCE'],vector:['THE CALCULATION','23.7 m','Forward passing gain · 2 completed passes','DETERMINISTIC / NOT A CAUSAL MEASURE'],check:['THE CHALLENGE','Timing is not causation.','Change the observation. Test the claim.','EVIDENCE REVIEW / QUALIFIED'],host:['THE TAKEAWAY','The passes stand.','The interpretation must survive the test.','EDITORIAL SYNTHESIS / CONDITIONAL']};
for(const s of scenes){
 let body=base;
 if(s.kind==='crew'){
  const [label,headline,sub,evidence]=crewCopy[s.id];
  body+=text('BTR / THE EVIDENCE DESK',90,88,25,'#93aec5')+text(label,660,225,23,'#'+s.accent)+lines(headline,660,345,28,s.id==='vector'?105:62)+lines(sub,660,545,43,31,'#bdcddd')+`<rect x="660" y="650" width="1140" height="86" rx="8" fill="#0d1d2b" stroke="#${s.accent}"/>`+text(evidence,690,703,23,'#'+s.accent);
  body+=text(s.role,90,840,64,'#'+s.accent)+text('EDITED CREW SCENE / SCRIPTED FROM SYNTHETIC EVIDENCE / AI VOICES',90,125,20,'#a3b3c4');
  const portrait=await sharp(`dist/assets/${s.id}-portrait.webp`).resize(470,620,{fit:'cover'}).png().toBuffer();
  await sharp(svg(body)).composite([{input:portrait,left:90,top:160}]).png().toFile(`${work}/${s.id}.png`);
 }else if(s.kind==='phone'){
  body+=text('ONE CORRECTION. EVERY SCREEN.',100,160,54)+text('POCKET DIRECTOR',100,245,23,'#ff4169')+lines('The evidence changed.',100,385,24,72)+text('R2 / 67:16 / SYNCED',100,600,34,'#c5ef47')+lines('A different perspective. The same facts.',100,700,35,35,'#b8c9da')+text('CAPTURED PAIRED OUTPUT / SYNTHETIC MATCH',100,960,22,'#92abc1');
  const phone=await sharp(`${archive}/phone-r2.png`).resize({height:930}).png().toBuffer();await sharp(svg(body)).composite([{input:phone,left:1290,top:70}]).png().toFile(`${work}/${s.id}.png`);
 }else if(['hook','film','closing'].includes(s.kind)){
  body=`<defs><linearGradient id="shade"><stop stop-color="#02060c" stop-opacity=".95"/><stop offset="1" stop-color="#02060c" stop-opacity=".15"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#shade)"/>`;
  if(s.kind==='hook')body+=text('THE MOMENT BEFORE THE STORY.',100,170,27,'#b7cddd')+text('THE DEFENDER',100,400,112)+text('MOVED.',100,535,112)+text('OR DID HE?',100,700,112,'#ff315d');
  else if(s.kind==='closing')body+=text('BTR ›',100,370,210)+text('BEFORE THE ROAR.',110,535,68)+text('EVERY PLAY HAS A WHY.',110,645,68,'#ff4169')+text('WATCH THE PLAY. QUESTION THE STORY.',110,800,29,'#c4d4e4');
  else body+=text('BTR ORIGINALS',90,120,28)+text('FIVE SPECIALISTS.',90,715,74)+text('ONE CORRECTABLE STORY.',90,805,66,'#ff4169');
  body+=text('AI-GENERATED FICTIONAL FILM / MEASUREMENTS USE SEPARATE SYNTHETIC EVIDENCE',90,60,20,'#bccbd9');await sharp(svg(body)).png().toFile(`${work}/${s.id}.png`);
 }
}
const stamp=t=>{let m=Math.round(t*1000);return `${String(Math.floor(m/3600000)).padStart(2,'0')}:${String(Math.floor(m/60000)%60).padStart(2,'0')}:${String(Math.floor(m/1000)%60).padStart(2,'0')},${String(m%1000).padStart(3,'0')}`;};
for(let i=0;i<scenes.length;i++){
 const s=scenes[i],voice=`${work}/voice-${i}.wav`,speech=seconds(voice),len=s.duration;
 if(speech>len-.1)console.log(`Scene ${s.id}: fit ${speech}s into ${len}s`);
 const tempo=Math.max(1,speech/(len-.35));if(tempo>1.12)throw Error(`Narration too fast: ${s.id} ${tempo}`);
 if(rebuild&&!rebuild.includes(s.id)){s.audio_seconds=speech;s.audio_tempo=tempo;continue;}
 let inputs,filter,ai=1;
 if(['hook','film','closing'].includes(s.kind)){
  inputs=['-ss',s.kind==='closing'?'35':'2','-stream_loop','-1','-i','dist/assets/pitchside-minute.mp4','-loop','1','-i',`${work}/${s.id}.png`,'-i',voice];ai=2;
  filter=`[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30[bg];[bg][1:v]overlay=x='max(0,40-160*t)':y=0[v]`;
 }else if(['correction','architecture'].includes(s.kind)){
  inputs=['-i',`${archive}/${s.kind}-uncut.mp4`,'-i',voice];
  const label=s.kind==='correction'?'UNCUT CORRECTION / DETERMINISTIC DEMONSTRATION / NO NEW MODEL REQUEST':'ARCHITECTURE TRACE / RECORDED APP ANIMATION';
  filter=`[0:v]tpad=stop_mode=clone:stop_duration=5,drawbox=x=0:y=0:w=iw:h=52:color=0x07111d:t=fill,drawtext=text='${label}':x=30:y=15:fontsize=21:fontcolor=white:fontfile='C\\:/Windows/Fonts/arialbd.ttf'[v]`;
 }else{
  let path=`${work}/${s.id}.png`;if(s.kind==='capture')path=`demo/showcase-captures/${s.frame}`;
  inputs=['-loop','1','-i',path,'-i',voice];
  filter=`[0:v]scale=1920:1080,zoompan=z='1.0+0.025*on/${len*30}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1920x1080:fps=30[v]`;
 }
 filter+=`;[${ai}:a]atempo=${tempo},adelay=150|150,apad,atrim=duration=${len}[a]`;
 run([...inputs,'-filter_complex',filter,'-map','[v]','-map','[a]','-t',String(len),'-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-r','30','-c:a','aac','-ar','48000','-b:a','160k',`${work}/${s.id}.mp4`]);
 s.audio_seconds=speech;s.audio_tempo=tempo;console.log(`Rendered ${s.id}`);
}
// Full tour keeps the broader app walkthrough, with the new story and real correction at its core.
const older=JSON.parse(await readFile('scripts/demo-v5-scenes.json','utf8'));
const full=[...scenes.slice(0,7),...[2,3,4,5,6,7,8,9,10].map(i=>({id:`old-${i}`,text:older[i].text,path:`tmp/submission-demo-v5/part-${i}.mp4`})),scenes[7],scenes[8],...[13,14,15].map(i=>({id:`old-${i}`,text:older[i].text,path:`tmp/submission-demo-v5/part-${i}.mp4`})),scenes[11],scenes[12]];
for(const [cut,items] of [['judge',scenes],['showcase',full]]){
 let elapsed=0,idx=1;const captions=[],timings=[],concat=[];
 for(const s of items){const path=s.path||`${work}/${s.id}.mp4`;const dur=seconds(path);concat.push(`file '${process.cwd().replaceAll('\\','/')}/${path}'`);const speech=s.audio_seconds?s.audio_seconds/s.audio_tempo:dur-.5;let offset=0;for(const sentence of s.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[s.text]){const span=speech*sentence.length/s.text.length;captions.push(`${idx++}\n${stamp(elapsed+.15+offset)} --> ${stamp(elapsed+.15+offset+span)}\n${sentence.trim()}\n`);offset+=span;}timings.push({id:s.id,start:elapsed,duration:dur});elapsed+=dur;}
 if(cut==='judge'&&elapsed>=120)throw Error('Judge cut exceeds 2 minutes');
 await writeFile(`${work}/${cut}-concat.txt`,concat.join('\n'));await writeFile(`${archive}/${cut}.srt`,captions.join('\n'));await writeFile(`${archive}/${cut}-transcript.txt`,items.map(s=>s.text).join('\n\n'));
 const sigAt=elapsed-2.9;
 run(['-f','concat','-safe','0','-i',`${work}/${cut}-concat.txt`,'-i',`${archive}/btr-original-sonic.wav`,'-filter_complex',`[0:v]subtitles=${archive}/${cut}.srt:force_style='FontName=Arial,FontSize=14,Outline=1,Shadow=0,MarginV=14,BorderStyle=3,OutlineColour=&H99000000',fade=t=in:st=0:d=0.2,fade=t=out:st=${elapsed-.6}:d=0.6[v];[1:a]adelay=${Math.round(sigAt*1000)}|${Math.round(sigAt*1000)}[sonic];[0:a][sonic]amix=inputs=2:duration=first:normalize=0,highpass=f=65,loudnorm=I=-16:TP=-1.5:LRA=9[a]`,'-map','[v]','-map','[a]','-c:v','libx264','-preset','fast','-crf','22','-maxrate','4200k','-bufsize','8400k','-g','60','-c:a','aac','-b:a','160k','-movflags','+faststart',`${archive}/${cut}-master.mp4`]);
 const hosted=`dist/assets/before-the-roar-${cut}-v174.mp4`;
 run(['-i',`${archive}/${cut}-master.mp4`,'-vf','scale=1600:900','-c:v','libx264','-preset','fast','-crf','24','-maxrate','2500k','-bufsize','5000k','-g','60','-c:a','aac','-b:a','128k','-movflags','+faststart',hosted]);
 const hash=createHash('sha256').update(await readFile(hosted)).digest('hex');
 await writeFile(`${archive}/${cut}-provenance.json`,JSON.stringify({version:174,duration_seconds:seconds(hosted),sha256:hash,bytes:(await stat(hosted)).size,timings,voices:'Azure AI Speech. Crew scene is explicitly scripted from synthetic evidence, not a fresh five-agent execution.',correction:'Continuous timestamp-preserving browser capture of deterministic correction. Frozen final frame pads the scene; no internal edits or acceleration.',mobile:'Paired R2 output captured after connection reload; not evidence of uninterrupted automatic delivery.',architecture:'Recorded interactive architecture animation, not a new Azure execution trace.',sound:'Original synthesized three-note BTR signature, no third-party music.',evaluation:'No claim of independent commentary superiority.'},null,2));
 console.log(`${cut}: ${elapsed.toFixed(2)} seconds`);
}
run(['-i',`${work}/closing.mp4`,'-ss','2','-frames:v','1','dist/assets/demo-v174-poster.jpg']);
