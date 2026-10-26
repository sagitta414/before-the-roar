// Tighten the judge cut without cropping the application or changing claims.
// Each video segment carries its original audio and burned-in captions.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const source='dist/assets/before-the-roar-judge-v202.mp4';
const target='dist/assets/before-the-roar-judge-v205.mp4';
const work='tmp/submission-demo-v205';
const archive='demo/showcase-v205';
const sha=async file=>createHash('sha256').update(await readFile(file)).digest('hex');
const run=(bin,args)=>{const r=spawnSync(bin,args,{encoding:'utf8',maxBuffer:8e6});if(r.status!==0)throw Error(`${bin}: ${r.stderr||r.error}`);return r.stdout.trim()};
await mkdir(work,{recursive:true});await mkdir(archive,{recursive:true});

const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
 await page.setContent(`<html><body style="margin:0;background:transparent"><div style="position:absolute;left:40px;top:16px;width:680px;height:88px;box-sizing:border-box;padding:12px 20px;background:#07111c;border-left:7px solid #c9ff32;border-bottom:2px solid #c9ff32;box-shadow:0 12px 30px #0009;color:white;font-family:Arial,sans-serif"><div style="color:#c9ff32;font-size:18px;font-weight:900;letter-spacing:2px">03 / THE CORRECTION REACHES THE FAN</div><div style="font-size:31px;font-weight:900;letter-spacing:-.7px;margin-top:2px">BOTH SCREENS UPDATED</div></div></body></html>`);
 await page.screenshot({path:`${work}/both-screens.png`,omitBackground:true});
}finally{await browser.close()}

// Remove a two-second redundant agent close-up at a sentence boundary, then
// put the phone response directly after the corrected discussion. The receipt
// segment follows as operational proof. Original narration stays paired with
// its original image and captions throughout.
const cuts=[
 {from:0,to:37.5,label:'opening'},
 {from:39.5,to:66.43,label:'challenge-and-correction'},
 {from:72,to:80.71,label:'phone-update'},
 {from:66.43,to:72,label:'receipts'},
 {from:80.71,to:114.666341,label:'finish'},
];
const parts=[];
for(const [i,cut] of cuts.entries()){
 parts.push(`[0:v]trim=start=${cut.from}:end=${cut.to},setpts=PTS-STARTPTS[v${i}]`);
 parts.push(`[0:a]atrim=start=${cut.from}:end=${cut.to},asetpts=PTS-STARTPTS[a${i}]`);
}
parts.push(`${cuts.map((_,i)=>`[v${i}][a${i}]`).join('')}concat=n=${cuts.length}:v=1:a=1[base][audio]`);
// New phone segment occupies 64.43-73.14 seconds after the two-second cut.
parts.push(`[1:v]format=rgba,fade=t=in:st=64.43:d=0.22:alpha=1,fade=t=out:st=72.89:d=0.25:alpha=1[card]`);
parts.push(`[base][card]overlay=0:0:format=auto:enable='between(t,64.43,73.14)',format=yuv420p[video]`);
run('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',source,'-loop','1','-framerate','30','-i',`${work}/both-screens.png`,'-filter_complex',parts.join(';'),'-map','[video]','-map','[audio]','-t','112.666','-c:v','libx264','-preset','veryfast','-crf','22','-maxrate','4000k','-bufsize','8000k','-g','60','-c:a','aac','-b:a','192k','-movflags','+faststart',target]);
const duration=Number(run('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',target]));
const sourceProvenance=JSON.parse(await readFile('demo/showcase-v202/judge-provenance.json','utf8'));
await writeFile(`${archive}/judge-provenance.json`,JSON.stringify({version:205,file:target,duration_seconds:duration,sha256:await sha(target),bytes:(await stat(target)).size,source_file:source,source_sha256:await sha(source),edit:'A redundant two-second agent view is removed at a sentence boundary. The phone segment and its original audio/captions move immediately after the corrected round; receipts follow. A third full-frame label states that both screens updated. The v202 record and claim callouts remain in the source. No new model request or independent evaluation is implied.',segments:cuts,added_overlay:{file:`${work}/both-screens.png`,sha256:await sha(`${work}/both-screens.png`),start_seconds:64.43,end_seconds:73.14},source_provenance:'demo/showcase-v202/judge-provenance.json',source_capture_model_requests:sourceProvenance.source_capture_model_requests},null,2)+'\n');
console.log(JSON.stringify({target,duration,bytes:(await stat(target)).size,sha256:await sha(target)}));
