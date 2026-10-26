// Full-frame judge edit. Focus graphics direct attention without cropping the app.
// All UI is recorded footage; the overlays and narration are explicitly post-production.
import { readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const archive = 'demo/showcase-v199';
const work = 'tmp/submission-demo-v199';
const output = 'dist/assets/before-the-roar-judge-v199.mp4';
const film = 'dist/assets/pitchside-minute.mp4';
const watch = 'demo/showcase-v196/sources/01-watch.mp4';
const understand = 'demo/showcase-v196/current-ui.webm';
const understandClean = 'demo/showcase-v199/understand-clean.mp4';
const measured = 'demo/showcase-v188/sources/measure.mp4';
const r1 = 'demo/showcase-v188/opening-crew-ui.webm';
const challenge = 'demo/showcase-v187/live-ui-uncut.webm';
const phone = 'demo/showcase-v188/sources/phone.mp4';
const architecture = 'demo/showcase-v196/sources/09-architecture.mp4';
const scenes = [
  { id:'cold-open', seconds:6, file:film, from:3, span:6, caption:'Did the run create the space?', focus:[{start:.15,end:1.95,r:62,track:[{time:0,x:850,y:708},{time:.5,x:826,y:738},{time:1,x:705,y:766},{time:1.5,x:586,y:820},{time:1.95,x:560,y:865}],color:'#fc315d'}] },
  { id:'watch', seconds:8, file:watch, from:0, span:6.4, caption:'Watch the film. Question the story.', focus:[{start:.5,end:3.2,x:36,y:242,w:1030,h:554,label:'FICTIONAL FILM',color:'#fc315d'},{start:3.3,end:7.7,x:1080,y:315,w:478,h:490,label:'AI WATCH PARTY',color:'#bafa27'}] },
  { id:'understand', seconds:8.4, file:understandClean, from:0, span:8.4, focus:[{start:.4,end:4.5,x:290,y:272,w:420,h:51,label:'NEW TO FOOTBALL',color:'#49b8ff'},{start:4.6,end:8.2,x:1012,y:362,w:540,h:430,label:'WHAT TO WATCH NEXT',color:'#49b8ff'}] },
  { id:'measure', seconds:7, file:measured, from:1, span:7, caption:'Controlled synthetic video is measured separately.', focus:[{start:.7,end:4.4,x:40,y:52,w:1060,h:284,label:'CONTROLLED VIDEO',color:'#bafa27'},{start:4.5,end:6.8,x:1105,y:48,w:468,h:418,label:'SOURCE-BOUNDED ANALYSIS',color:'#49b8ff'}] },
  { id:'first-round', seconds:10, file:r1, from:32, span:6.9, focus:[{start:.2,end:1.8,x:1080,y:375,w:478,h:157,label:'SCOUT · OBSERVE',color:'#bafa27'},{start:1.9,end:3.2,x:1080,y:535,w:478,h:167,label:'GUIDE · QUESTION',color:'#49b8ff'},{start:3.3,end:6.9,x:1080,y:704,w:478,h:104,label:'VECTOR · 23.7 M',color:'#bafa27'},{start:7,end:9.7,x:1080,y:472,w:478,h:61,label:'LIMIT · CAUSE UNKNOWN',color:'#fc315d'}] },
  { id:'viewer-challenge', seconds:5.5, file:challenge, from:5.2, span:5.5, focus:[{start:.4,end:2.6,x:1080,y:407,w:476,h:95,label:'VIEWER CHALLENGE',color:'#fc315d'},{start:2.7,end:5.3,x:1080,y:500,w:476,h:164,label:'EVIDENCE-BOUND ANSWER',color:'#49b8ff'}] },
  { id:'truth-lab', seconds:5, file:challenge, from:11.8, span:4.2, focus:[{start:.6,end:2.6,x:56,y:376,w:725,h:106,label:'ORIGINAL · 13.0 M',color:'#fc315d'},{start:2.7,end:4.8,x:815,y:376,w:727,h:106,label:'CHANGED · 0.0 M',color:'#bafa27'}] },
  { id:'corrected-round', seconds:5, file:challenge, from:15.9, span:4.3, caption:'The movement claim is withdrawn. The passes remain.', focus:[{start:.7,end:4.7,x:1080,y:498,w:477,h:160,label:'CORRECTED ROUND · R2',color:'#bafa27'}] },
  { id:'receipts', seconds:4.6, file:challenge, from:20.1, span:1.75, focus:[{start:.3,end:4.3,x:1080,y:352,w:475,h:440,label:'INSIDE THE AI DESK',color:'#49b8ff'}] },
  { id:'phone', seconds:7.2, file:phone, from:0, span:7.2, focus:[{start:.6,end:6.9,x:1209,y:51,w:370,h:782,label:'PAIRED PHONE · R2',color:'#bafa27'}] },
  { id:'accessibility', seconds:7, file:understand, from:18.1, span:6.7, caption:'More ways to follow the same checked play.', focus:[{start:.8,end:3.6,x:262,y:250,w:565,h:490,label:'COLOR-SAFE MARKERS',color:'#49b8ff'},{start:3.7,end:6.7,x:850,y:420,w:485,h:108,label:'DESCRIPTIVE TRANSCRIPT',color:'#bafa27'}] },
  { id:'publish', seconds:7, file:understand, from:10, span:4, focus:[{start:.4,end:3,x:68,y:449,w:1122,h:381,label:'ONE CHECKED SOURCE',color:'#fc315d'},{start:3.1,end:6.7,x:1208,y:403,w:344,h:466,label:'OUTPUT DIRECTOR',color:'#fc315d'}] },
  { id:'architecture', seconds:10, file:architecture, from:0, span:9, focus:[{start:.3,end:1.9,x:306,y:265,w:236,h:111,label:'CONTAINER APPS',color:'#fc315d'},{start:2,end:3.8,x:306,y:379,w:236,h:109,label:'ENTRA',color:'#49b8ff'},{start:3.9,end:5.3,x:573,y:489,w:268,h:115,label:'FOUNDRY REFEREE',color:'#bafa27'},{start:5.4,end:7.8,x:879,y:263,w:237,h:114,label:'BLOB CHECKPOINTS',color:'#49b8ff'},{start:7.9,end:9.7,x:879,y:379,w:237,h:108,label:'EVIDENCE LEDGER',color:'#bafa27'}] },
  { id:'closing', seconds:4, file:film, from:40, span:4, caption:'Before the Roar. Every claim earned.', focus:[] },
];
const run = (bin,args) => { const r=spawnSync(bin,args,{encoding:'utf8',maxBuffer:8e6}); if(r.status!==0) throw Error(`${bin}: ${r.stderr||r.error}`); return r.stdout.trim(); };
const duration = file => Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',file]));
const hash = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const voiceTexts = JSON.parse(await readFile('scripts/demo-v199-voice.json','utf8')).map(item => item.text);
const voiceBreaks = (file, count, seconds) => {
  if (count < 2) return [];
  const result = spawnSync('ffmpeg',['-hide_banner','-i',file,'-af','silencedetect=noise=-35dB:d=0.12','-f','null','-'],{encoding:'utf8',maxBuffer:4e6});
  if(result.status!==0) throw Error(`Could not align voice pauses: ${file}`);
  const pauses=[...result.stderr.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)]
    .map(match=>({start:Number(match[1]),end:Number(match[2]),length:Number(match[3])}))
    .filter(pause=>pause.start>.2 && pause.end<seconds-.3)
    .sort((a,b)=>b.length-a.length).slice(0,count-1).sort((a,b)=>a.start-b.start);
  if(pauses.length!==count-1) throw Error(`Voice has ${pauses.length} usable sentence pauses, expected ${count-1}: ${file}`);
  return pauses;
};
const clock = s => {const ms=Math.round(s*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
const escapeXml = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
await mkdir(work,{recursive:true}); await mkdir(archive,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
const manifest=[];
try {
  for(const [index,scene] of scenes.entries()){
    const target=`${work}/${String(index).padStart(2,'0')}-${scene.id}.mp4`;
    const voice=`${archive}/voice/voice-${index}.wav`;
    const args=['-hide_banner','-loglevel','error','-y','-ss',String(scene.from),'-t',String(scene.span),'-i',scene.file];
    const overlays=[];
    for(const [i,focus] of scene.focus.entries()){
      const color=focus.color;
      if(focus.track){
        let first;
        for(let frame=0;frame<=Math.ceil(focus.end*30);frame++){
          const time=frame/30;
          const next=focus.track.findIndex(point=>point.time>=time);
          const left=focus.track[Math.max(0,next-1)];
          const right=focus.track[next<0?focus.track.length-1:next];
          const progress=right.time===left.time?0:Math.max(0,Math.min(1,(time-left.time)/(right.time-left.time)));
          const x=left.x+(right.x-left.x)*progress;
          const y=left.y+(right.y-left.y)*progress;
          const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><circle cx="${x}" cy="${y}" r="${focus.r+10}" fill="none" stroke="${color}" stroke-opacity=".35" stroke-width="3"/><circle cx="${x}" cy="${y}" r="${focus.r}" fill="none" stroke="${color}" stroke-width="5"/></svg>`;
          await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
          const png=`${work}/focus-${index}-${i}-${String(frame).padStart(3,'0')}.png`;
          await page.screenshot({path:png,omitBackground:true});
          first??=png;
        }
        args.push('-framerate','30','-i',`${work}/focus-${index}-${i}-%03d.png`);
        overlays.push({png:first,start:focus.start,end:focus.end,sha256:await hash(first),track:focus.track});
        continue;
      }
      const shape=focus.cx!==undefined ? `<circle cx="${focus.cx}" cy="${focus.cy}" r="${focus.r}" fill="none" stroke="${color}" stroke-width="5"/><circle cx="${focus.cx}" cy="${focus.cy}" r="${focus.r+13}" fill="none" stroke="${color}" stroke-opacity=".36" stroke-width="3"/>` : `<rect x="${focus.x}" y="${focus.y}" width="${focus.w}" height="${focus.h}" rx="10" fill="none" stroke="${color}" stroke-width="5"/><path d="M${focus.x+24} ${focus.y-8}h74" stroke="${color}" stroke-width="4"/>`;
      const lx=focus.cx!==undefined?Math.max(28,focus.cx-100):Math.max(28,focus.x+12);
      const ly=focus.cx!==undefined?Math.max(55,focus.cy-focus.r-62):Math.max(55,focus.y-48);
      const labelWidth=Math.max(230,focus.label.length*14+40);
      const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><defs><filter id="glow"><feGaussianBlur stdDeviation="9"/></filter></defs><g opacity=".55" filter="url(#glow)">${shape}</g><g>${shape}</g><rect x="${lx}" y="${ly}" width="${labelWidth}" height="38" rx="4" fill="#06131c" fill-opacity=".94" stroke="${color}" stroke-width="2"/><text x="${lx+16}" y="${ly+26}" fill="#fff" font-family="Arial,sans-serif" font-weight="800" font-size="19" letter-spacing="1.2">${escapeXml(focus.label)}</text></svg>`;
      await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
      const png=`${work}/focus-${index}-${i}.png`;
      await page.screenshot({path:png,omitBackground:true});
      args.push('-loop','1','-framerate','30','-i',png);
      overlays.push({png,start:focus.start,end:focus.end,sha256:await hash(png)});
    }
    if(scene.narration!==false) args.push('-i',voice);
    const speed=scene.span/scene.seconds;
    if(speed<(scene.id==='receipts'?.35:scene.id==='publish'?.55:.65) || speed>1.25) throw Error(`Excessive speed change for ${scene.id}: ${speed}`);
    const filters=[`[0:v]trim=duration=${scene.span},setpts=${(scene.seconds/scene.span).toFixed(6)}*(PTS-STARTPTS),fps=30,scale=1600:900:force_original_aspect_ratio=decrease,pad=1600:900:(ow-iw)/2:(oh-ih)/2:color=0x06131c,format=yuv420p[b0]`];
    let previous='b0';
    for(const [i,overlay] of overlays.entries()){
      const node=`b${i+1}`;
      const source=`o${i}`;
      const fadeOut=Math.max(overlay.start+.3,overlay.end-.28);
      filters.push(`[${i+1}:v]format=rgba,fade=t=in:st=${overlay.start}:d=0.28:alpha=1,fade=t=out:st=${fadeOut}:d=0.28:alpha=1[${source}]`);
      filters.push(`[${previous}][${source}]overlay=0:0:format=auto:enable='between(t,${overlay.start},${overlay.end})'[${node}]`);
      previous=node;
    }
    filters.push(`[${previous}]format=yuv420p[v]`);
    if(scene.narration!==false){
      const voiceSeconds=duration(voice);
      const tempo=Math.max(.88,voiceSeconds/(scene.seconds-.15));
      if(tempo>1.18) throw Error(`Narration too long for ${scene.id}: ${voiceSeconds}s`);
      filters.push(`[${1+overlays.length}:a]atempo=${tempo.toFixed(3)},adelay=80|80,apad,atrim=duration=${scene.seconds}[a]`);
    } else filters.push(`anullsrc=r=48000:cl=stereo,atrim=duration=${scene.seconds}[a]`);
    args.push('-filter_complex',filters.join(';'),'-map','[v]','-map','[a]','-t',String(scene.seconds),'-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-r','30','-c:a','aac','-ar','48000','-b:a','160k',target);
    run('ffmpeg',args);
    manifest.push({id:scene.id,seconds:scene.seconds,source:scene.file,source_sha256:await hash(scene.file),from:scene.from,span:scene.span,voice,voice_sha256:await hash(voice),voice_text:voiceTexts[index],overlays});
    console.log(`${index+1}/${scenes.length} ${scene.id}`);
  }
} finally {await browser.close();}
const elapsed=scenes.reduce((n,scene)=>n+scene.seconds,0);
if(elapsed>=120) throw Error(`Judge cut too long: ${elapsed}s`);
await writeFile(`${work}/concat.txt`,scenes.map((scene,i)=>`file '${process.cwd().replaceAll('\\','/')}/${work}/${String(i).padStart(2,'0')}-${scene.id}.mp4'`).join('\n'));
let offset=0;
const aligned=[];
for(const [i,scene] of scenes.entries()){
  const voice=`${archive}/voice/voice-${i}.wav`;
  const spoken=voiceTexts[i];
  const sentences=spoken.match(/[^.!?]+[.!?]+/g)?.map(sentence=>sentence.trim()) ?? [spoken];
  if(sentences.join(' ')!==spoken) throw Error(`Cannot split narration exactly: ${scene.id}`);
  const voiceSeconds=duration(voice);
  const tempo=Math.max(.88,voiceSeconds/(scene.seconds-.15));
  const breaks=voiceBreaks(voice,sentences.length,voiceSeconds);
  let start=0;
  for(const [index,sentence] of sentences.entries()){
    const end=index<breaks.length?breaks[index].start:voiceSeconds-.08;
    const srtStart=Math.max(offset,offset+start/tempo+.08);
    const srtEnd=Math.min(offset+scene.seconds-.12,offset+end/tempo+.13);
    if(srtEnd<=srtStart) throw Error(`Invalid narration interval: ${scene.id} ${index}`);
    aligned.push({scene:scene.id,start:srtStart,end:srtEnd,text:sentence});
    start=breaks[index]?.end ?? end;
  }
  offset+=scene.seconds;
}
const srt=aligned.map((line,index)=>`${index+1}\n${clock(line.start)} --> ${clock(line.end)}\n${line.text}\n`).join('\n');
await writeFile(`${archive}/judge.srt`,srt);
await writeFile(`${archive}/judge-transcript.txt`,scenes.map((scene,index)=>`${scene.id.toUpperCase()}: ${voiceTexts[index]}`).join('\n')+'\n');
// Decode each voice segment directly to PCM, concatenate once, and encode the
// final soundtrack only once. Concatenating fourteen separately encoded AAC
// tracks introduced audible boundary glitches in the previous cut.
const audioFiles=[];
for(const [index,scene] of scenes.entries()){
  const voice=`${archive}/voice/voice-${index}.wav`;
  const voiceSeconds=duration(voice);
  const tempo=Math.max(.88,voiceSeconds/(scene.seconds-.15));
  const pcm=`${work}/voice-pcm-${String(index).padStart(2,'0')}.wav`;
  // Sample-count trimming matters: timestamp trimming lost 1,792 samples per
  // scene, making the voice drift more than half a second by the final scene.
  run('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',voice,'-af',`atempo=${tempo.toFixed(3)},adelay=80|80,apad=pad_dur=1,atrim=end_sample=${Math.round(scene.seconds*48000)},asetpts=PTS-STARTPTS`,'-ar','48000','-ac','2','-c:a','pcm_s16le',pcm]);
  audioFiles.push(pcm);
}
await writeFile(`${work}/audio-concat.txt`,audioFiles.map(file=>`file '${process.cwd().replaceAll('\\','/')}/${file}'`).join('\n'));
const audioMaster=`${archive}/voice-master.wav`;
run('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',`${work}/audio-concat.txt`,'-c:a','pcm_s16le',audioMaster]);
if(Math.abs(duration(audioMaster)-elapsed)>.005) throw Error(`Voice master drift: ${duration(audioMaster)}s versus ${elapsed}s video`);
run('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',`${work}/concat.txt`,'-i',audioMaster,'-stream_loop','1','-i',film,'-filter_complex',`[0:v]subtitles=${archive}/judge.srt:force_style='FontName=Arial,FontSize=11,Outline=1,Shadow=0,MarginV=14,BorderStyle=3,OutlineColour=&HAA000000',fade=t=in:st=0:d=0.15,fade=t=out:st=${elapsed-0.4}:d=0.4[v];[1:a]highpass=f=65,loudnorm=I=-16:TP=-1.5:LRA=9[voice];[2:a]volume=0.045,atrim=duration=${elapsed},asetpts=PTS-STARTPTS[bed];[voice][bed]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.9[a]`,'-map','[v]','-map','[a]','-c:v','libx264','-preset','veryfast','-crf','22','-maxrate','4000k','-bufsize','8000k','-g','60','-c:a','aac','-b:a','160k','-movflags','+faststart',output]);
run('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss','9','-i',output,'-frames:v','1','dist/assets/demo-v199-poster.jpg']);
const oldCapture=JSON.parse(await readFile('demo/showcase-v187/capture.json','utf8'));
const currentCapture=JSON.parse(await readFile('demo/showcase-v196/current-capture.json','utf8'));
await writeFile(`${archive}/judge-provenance.json`,JSON.stringify({version:199,file:output,duration_seconds:duration(output),sha256:await hash(output),bytes:(await stat(output)).size,scenes:manifest,caption_alignment:aligned,voice_master:audioMaster,voice_master_sha256:await hash(audioMaster),ambient_source:film,ambient_source_sha256:await hash(film),live_model_requests_in_v187_capture:oldCapture.model_requests_used,model_requests_in_current_screen_capture:currentCapture.model_requests,boundaries:'Full-frame moving source recordings and two real Understand screenshots joined by a dissolve with post-produced focus graphics, a ball-tracking circle, Azure Speech narration mixed from one PCM master and verbatim sentence captions aligned to pauses in each voice WAV. Cinematic film, controlled synthetic video, synthetic match discussions and current product screen capture are distinct sources. The recorded challenge and correction come from an older continuous public-app capture. Truth Lab tests evidence dependence, not football causation. This edit is not independent commentary evaluation or unfamiliar broadcast-video validation.'},null,2)+'\n');
console.log(`Judge cut: ${duration(output).toFixed(1)}s, ${(await stat(output)).size} bytes`);
