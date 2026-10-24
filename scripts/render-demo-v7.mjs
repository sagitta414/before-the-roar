import {readFile,writeFile,mkdir,copyFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(process.env.BTR_SHARP_PATH||'C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const work='tmp/submission-demo-v7', raw='tmp/demo-v7-capture', archive='demo/showcase-v175';
await mkdir(archive,{recursive:true});await mkdir(work,{recursive:true});
const scenes=JSON.parse(await readFile('scripts/demo-v7-scenes.json','utf8'));
function run(args){const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8',maxBuffer:8e6});if(r.status!==0)throw Error(r.stderr||String(r.error));}
function seconds(file){const r=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',file],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);return Number(r.stdout.trim());}
const frames=JSON.parse(await readFile(`${raw}/watch-timing.json`,'utf8'));let list='';
for(let i=0;i<frames.length;i++)list+=`file '${frames[i].file}'\nduration ${Math.max(.001,i+1<frames.length?frames[i+1].time-frames[i].time:.1)}\n`;
list+=`file '${frames.at(-1).file}'\n`;await writeFile(`${raw}/watch.txt`,list);
run(['-f','concat','-safe','0','-i',`${raw}/watch.txt`,'-vf','scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p',`${archive}/watch-recording.mp4`]);
await copyFile(`${raw}/watch-timing.json`,`${archive}/watch-timing.json`);
// Compose actual product surfaces. No fictional UI and no presenter title cards.
run(['-ss','12','-i','demo/showcase-v174/correction-uncut.mp4','-frames:v','1',`${work}/desktop-r2.png`]);
const background=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><rect width="1920" height="1080" fill="#071019"/><path d="M0 1040L1920 70" stroke="#20394f" stroke-width="2"/><text x="70" y="85" font-family="Arial" font-size="34" font-weight="bold" fill="white">ONE CORRECTION. BOTH SCREENS.</text></svg>');
const desktop=await sharp(`${work}/desktop-r2.png`).resize(1420,799).png().toBuffer();
const phone=await sharp('demo/showcase-v174/phone-r2.png').resize({height:930}).png().toBuffer();
await sharp(background).composite([{input:desktop,left:25,top:145},{input:phone,left:1460,top:65}]).png().toFile(`${work}/phone.png`);
for(let i=0;i<scenes.length;i++){
 const s=scenes[i],voice=`${work}/voice-${i}.wav`,speech=seconds(voice),len=s.duration;
 const tempo=Math.max(1,speech/(len-.3));if(tempo>1.12)throw Error(`Shorten ${s.id}: ${speech}s for ${len}s`);
 let inputs,filter;
 if(['opening','closing'].includes(s.kind)){
  inputs=['-ss',s.kind==='opening'?'2':'34','-stream_loop','-1','-i','dist/assets/pitchside-minute.mp4','-i',voice];
  const headline=s.kind==='opening'?'BTR / BEFORE THE ROAR':'BEFORE THE ROAR / EVERY PLAY HAS A WHY';
  filter=`[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30,drawbox=x=60:y=760:w=1490:h=105:color=0x071019@0.86:t=fill,drawbox=x=60:y=760:w=9:h=105:color=0xff315d:t=fill,drawtext=text='${headline}':x=95:y=791:fontsize=45:fontcolor=white:fontfile='C\\:/Windows/Fonts/arialbd.ttf',drawtext=text='AI-GENERATED FICTIONAL FOOTBALL':x=60:y=55:fontsize=22:fontcolor=white:fontfile='C\\:/Windows/Fonts/arialbd.ttf'[v]`;
 }else if(['watch','correction','architecture'].includes(s.kind)){
  const path=s.kind==='watch'?`${archive}/watch-recording.mp4`:`demo/showcase-v174/${s.kind}-uncut.mp4`;
  inputs=['-i',path,'-i',voice];const label=s.kind==='watch'?'WATCH / RECORDED PLAYBACK WITH REVIEWED NOTES':s.kind==='correction'?'TRUTH LAB / UNCUT DETERMINISTIC CORRECTION':'SECURE / RECORDED INTERACTIVE ARCHITECTURE';
  filter=`[0:v]tpad=stop_mode=clone:stop_duration=5,drawbox=x=0:y=0:w=iw:h=46:color=0x071019:t=fill,drawtext=text='${label}':x=30:y=13:fontsize=20:fontcolor=white:fontfile='C\\:/Windows/Fonts/arialbd.ttf'[v]`;
 }else{
  const path=s.kind==='phone'?`${work}/phone.png`:`demo/showcase-captures/${s.frame}`;
  inputs=['-loop','1','-i',path,'-i',voice];filter=`[0:v]scale=1920:1080,zoompan=z='1.0+0.018*on/${len*30}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1920x1080:fps=30[v]`;
 }
 filter+=`;[1:a]atempo=${tempo},adelay=100|100,apad,atrim=duration=${len}[a]`;
 run([...inputs,'-filter_complex',filter,'-map','[v]','-map','[a]','-t',String(len),'-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-r','30','-c:a','aac','-ar','48000','-b:a','160k',`${work}/${s.id}.mp4`]);
 s.speech=speech/tempo;console.log(`Rendered ${s.id}`);
}
const old=JSON.parse(await readFile('scripts/demo-v5-scenes.json','utf8'));
const legacy=i=>({id:`live-${i}`,text:old[i].text,path:`tmp/submission-demo-v5/part-${i}.mp4`});
const full=[scenes[0],scenes[1],...[3,4,5,6].map(legacy),scenes[2],scenes[3],...[9,10].map(legacy),scenes[4],scenes[5],legacy(13),scenes[6],legacy(15),scenes[7],scenes[8]];
const stamp=t=>{let m=Math.round(t*1000);return `${String(Math.floor(m/3600000)).padStart(2,'0')}:${String(Math.floor(m/60000)%60).padStart(2,'0')}:${String(Math.floor(m/1000)%60).padStart(2,'0')},${String(m%1000).padStart(3,'0')}`;};
for(const [cut,items] of [['judge',scenes],['showcase',full]]){
 let elapsed=0,index=1;const captions=[],timings=[],concat=[];
 for(const s of items){const path=s.path||`${work}/${s.id}.mp4`,duration=seconds(path),speech=s.speech||duration-.5;concat.push(`file '${process.cwd().replaceAll('\\','/')}/${path}'`);let offset=0;for(const line of s.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[s.text]){const span=speech*line.length/s.text.length;captions.push(`${index++}\n${stamp(elapsed+.1+offset)} --> ${stamp(elapsed+.1+offset+span)}\n${line.trim()}\n`);offset+=span;}timings.push({id:s.id,start:elapsed,duration});elapsed+=duration;}
 if(cut==='judge'&&elapsed>=120)throw Error('Judge cut exceeds two minutes');
 await writeFile(`${work}/${cut}-concat.txt`,concat.join('\n'));await writeFile(`${archive}/${cut}.srt`,captions.join('\n'));await writeFile(`${archive}/${cut}-transcript.txt`,items.map(s=>s.text).join('\n\n'));
 const hosted=`dist/assets/before-the-roar-${cut}-v175.mp4`;
 run(['-f','concat','-safe','0','-i',`${work}/${cut}-concat.txt`,'-i','demo/showcase-v174/btr-original-sonic.wav','-filter_complex',`[0:v]subtitles=${archive}/${cut}.srt:force_style='FontName=Arial,FontSize=14,Outline=1,Shadow=0,MarginV=14,BorderStyle=3,OutlineColour=&H99000000',scale=1600:900,fade=t=in:st=0:d=0.2,fade=t=out:st=${elapsed-.5}:d=0.5[v];[1:a]adelay=${Math.round((elapsed-2.8)*1000)}|${Math.round((elapsed-2.8)*1000)}[sig];[0:a][sig]amix=inputs=2:duration=first:normalize=0,highpass=f=65,loudnorm=I=-16:TP=-1.5:LRA=9[a]`,'-map','[v]','-map','[a]','-c:v','libx264','-preset','fast','-crf','23','-maxrate','3000k','-bufsize','6000k','-g','60','-c:a','aac','-b:a','160k','-movflags','+faststart',hosted]);
 await writeFile(`${archive}/${cut}-provenance.json`,JSON.stringify({version:175,duration_seconds:seconds(hosted),sha256:createHash('sha256').update(await readFile(hosted)).digest('hex'),bytes:(await stat(hosted)).size,timings,product_seconds:elapsed-11,portrait_card_seconds:0,watch:'New timestamp-preserving screen recording of playback and reviewed notes. No fresh model requests claimed.',live_ai:'Full tour retains actual v173 AI response captures and visible Host failure; demo voices are added in editing.',correction:'Uncut deterministic correction from v174. Phone output captured after reconnect; no uninterrupted sync claim.',architecture:'Actual app animation, not fresh Azure service requests.',evaluation:'Early comparison only; independent superiority not established.'},null,2));
 console.log(`${cut}: ${elapsed.toFixed(2)}s`);
}
run(['-ss','4','-i',`${archive}/watch-recording.mp4`,'-frames:v','1','dist/assets/demo-v175-poster.jpg']);
