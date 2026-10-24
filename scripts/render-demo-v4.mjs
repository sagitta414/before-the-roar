import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(process.env.BTR_SHARP_PATH || 'C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const work='tmp/submission-demo-v4';
await mkdir(work,{recursive:true});
const scenes=JSON.parse(await readFile('scripts/demo-v4-scenes.json','utf8'));
function run(cmd,args){const r=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:8e6});if(r.status!==0)throw new Error(r.stderr||r.error);return r.stdout;}
function duration(file){return Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',file]).trim());}
const stamp=t=>{const ms=Math.round(t*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
const title=Buffer.from(`<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"><stop stop-color="#030812" stop-opacity=".97"/><stop offset="1" stop-color="#030812" stop-opacity=".15"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#g)"/><path d="M1520 0L1190 1080H1320L1650 0Z" fill="#ff315d" opacity=".8"/><text x="110" y="170" fill="#fff" font-family="Arial" font-size="22" letter-spacing="8">FOOTBALL. FROM EVERY ANGLE.</text><text x="95" y="450" fill="white" font-family="Arial" font-style="italic" font-weight="900" font-size="245">BTR</text><text x="610" y="450" fill="#ff315d" font-family="Arial" font-size="220">›</text><text x="110" y="570" fill="white" font-family="Arial" font-weight="900" font-size="69">BEFORE THE ROAR.</text><text x="110" y="665" fill="#ff456a" font-family="Arial" font-weight="900" font-size="69">EVERY CLAIM EARNED.</text><rect x="110" y="735" width="670" height="4" fill="#ff315d"/><text x="110" y="802" fill="#d1d9e3" font-family="Arial" font-size="26">WATCH THE PLAY. QUESTION THE STORY.</text><text x="110" y="970" fill="#b2c4d6" font-family="Arial" font-size="19" letter-spacing="3">SYNTHETIC FOOTBALL  /  POWERED BY MICROSOFT AZURE</text></svg>`);
await sharp(title).png().toFile(`${work}/opening.png`);
let elapsed=0,captionIndex=1;const captions=[],manifest=[],timings=[];
for(let i=0;i<scenes.length;i++){
 const s=scenes[i],voice=`${work}/voice-${i}.wav`,speech=duration(voice),len=speech+0.45;
 const target=`${work}/part-${i}.mp4`;let inputs=[],vf;
 if(s.frame==='opening'||s.frame==='closing'){
   inputs=['-ss',s.frame==='opening'?'3':'33','-stream_loop','-1','-i','dist/assets/pitchside-minute.mp4','-loop','1','-i',`${work}/opening.png`,'-i',voice];
   vf=`[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30[bg];[bg][1:v]overlay=x='max(0,90-180*t)':y=0,drawbox=x=110:y=735:w='670':h=4:color=0xff315d:t=fill,fade=t=in:st=0:d=0.25[v];[2:a]adelay=150|150,apad,atrim=duration=${len}[a]`;
 }else if(s.frame==='film'){
   inputs=['-ss','8','-stream_loop','-1','-i','dist/assets/pitchside-minute.mp4','-i',voice];
   vf=`[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30,drawbox=x=0:y=0:w=iw:h=64:color=0x05080d@0.8:t=fill,drawtext=text='BTR / AI-GENERATED FICTIONAL FOOTBALL':x=45:y=22:fontsize=23:fontcolor=white:fontfile='C\\:/Windows/Fonts/arialbd.ttf'[v];[1:a]adelay=150|150,apad,atrim=duration=${len}[a]`;
 }else{
   const frame=s.frame==='04-proof.png'?'04-proof-card.png':s.frame;
   inputs=['-loop','1','-i',`tmp/submission-demo-v3/${frame}`,'-i',voice];
   vf=`[0:v]scale=2304:1296,zoompan=z='1.02+0.012*on/${Math.ceil(len*30)}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1920x1080:fps=30[v];[1:a]adelay=150|150,apad,atrim=duration=${len}[a]`;
 }
 run('ffmpeg',['-hide_banner','-loglevel','error','-y',...inputs,'-filter_complex',vf,'-map','[v]','-map','[a]','-t',String(len),'-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-r','30','-c:a','aac','-ar','48000','-b:a','192k',target]);
 const actual=duration(target),sentences=s.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[s.text];let offset=0;
 for(const sentence of sentences){const span=speech*sentence.length/s.text.length;captions.push(`${captionIndex++}\n${stamp(elapsed+0.15+offset)} --> ${stamp(elapsed+0.15+offset+span)}\n${sentence.trim()}\n`);offset+=span;}
 timings.push({scene:i,frame:s.frame,start:elapsed,duration:actual,speech_seconds:speech});elapsed+=actual;
 manifest.push(`file 'part-${i}.mp4'`);console.log(`Scene ${i+1}/${scenes.length}: ${actual.toFixed(2)}s`);
}
if(elapsed>=120)throw new Error(`Demo too long: ${elapsed}`);
await writeFile(`${work}/concat.txt`,manifest.join('\n'));
await writeFile('demo/before-the-roar-premiere.srt',captions.join('\n'));
run('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',`${work}/concat.txt`,'-vf',"subtitles=demo/before-the-roar-premiere.srt:force_style='FontName=Arial,FontSize=20,Outline=1,Shadow=0,MarginV=24,BorderStyle=3,OutlineColour=&H99000000'",'-af','highpass=f=65,loudnorm=I=-16:TP=-1.5:LRA=9','-c:v','libx264','-preset','fast','-crf','21','-maxrate','4500k','-bufsize','9000k','-g','60','-c:a','aac','-ar','48000','-b:a','160k','-movflags','+faststart','demo/before-the-roar-premiere.mp4']);
run('ffmpeg',['-hide_banner','-loglevel','error','-y','-i','demo/before-the-roar-premiere.mp4','-vf','scale=1600:900','-c:v','libx264','-preset','fast','-crf','24','-maxrate','2500k','-bufsize','5000k','-g','60','-c:a','aac','-b:a','128k','-movflags','+faststart','dist/assets/before-the-roar-premiere-v172.mp4']);
run('ffmpeg',['-hide_banner','-loglevel','error','-y','-i','demo/before-the-roar-premiere.mp4','-ss','2','-frames:v','1','dist/assets/demo-premiere-poster.jpg']);
await writeFile('demo/before-the-roar-premiere-provenance.json',JSON.stringify({version:4,duration_seconds:elapsed,voice:JSON.parse(await readFile(`${work}/voice.json`,'utf8')),timings,visuals:'Edited recorded app captures and labelled fictional AI footage. Not a continuous live recording.',captions:'Sentence timings proportional within measured scene audio; scene boundaries synchronized to recorded narration.',evaluation:'Early model-scored comparison; independent human superiority remains unproven.'},null,2));
await writeFile('demo/before-the-roar-premiere-transcript.txt',scenes.map(s=>s.text).join('\n\n'));
console.log(`Rendered ${elapsed.toFixed(2)} seconds`);

