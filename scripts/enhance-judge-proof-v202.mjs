// Add a readable, timed evidence ticker to the existing full-frame judge cut.
// The source capture, narration, captions, and soundtrack remain unchanged.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const source='dist/assets/before-the-roar-judge-v201.mp4';
const target='dist/assets/before-the-roar-judge-v202.mp4';
const work='tmp/submission-demo-v202';
const archive='demo/showcase-v202';
const sha=async file=>createHash('sha256').update(await readFile(file)).digest('hex');
const run=(bin,args)=>{const r=spawnSync(bin,args,{encoding:'utf8',maxBuffer:8e6});if(r.status!==0)throw Error(`${bin}: ${r.stderr||r.error}`);return r.stdout.trim()};
await mkdir(work,{recursive:true});await mkdir(archive,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const cards=[
 {id:'record',eyebrow:'TRUTH LAB · ONE RECORD CHANGES',headline:'13.0 m  →  0.0 m',detail:'The defender is held at his starting position.',accent:'#ff315d'},
 {id:'claim',eyebrow:'CHECK · THE EVIDENCE CHANGES THE STORY',headline:'MOVEMENT CLAIM WITHDRAWN',detail:'The two completed passes remain supported.',accent:'#c9ff32'},
];
try{
 const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
 for(const card of cards){
  await page.setContent(`<html><body style="margin:0;background:transparent"><div style="position:absolute;left:656px;top:146px;width:898px;height:164px;box-sizing:border-box;padding:16px 25px;background:linear-gradient(105deg,rgba(6,13,22,.97),rgba(12,27,39,.96));border-left:7px solid ${card.accent};border-bottom:2px solid ${card.accent};box-shadow:0 16px 42px #0009;color:white;font-family:Arial,sans-serif"><div style="color:${card.accent};font-size:19px;font-weight:900;letter-spacing:2.1px">${card.eyebrow}</div><div style="font-size:${card.id==='claim'?40:54}px;font-weight:900;letter-spacing:-1.3px;margin-top:4px;white-space:nowrap">${card.headline}</div><div style="font-size:22px;color:#e5edf4;margin-top:2px">${card.detail}</div></div></body></html>`);
  await page.screenshot({path:`${work}/${card.id}.png`,omitBackground:true});
 }
 await page.close();
}finally{await browser.close()}
// The underlying full-screen app stays visible. Each panel occupies only the
// spare upper-right region and appears exactly when its narration refers to it.
const filter=[
 '[1:v]format=rgba,fade=t=in:st=54.25:d=0.22:alpha=1,fade=t=out:st=60.05:d=0.25:alpha=1[record]',
 "[0:v][record]overlay=0:0:format=auto:enable='between(t,54.25,60.38)'[stage1]",
 '[2:v]format=rgba,fade=t=in:st=60.38:d=0.22:alpha=1,fade=t=out:st=66.12:d=0.25:alpha=1[claim]',
 "[stage1][claim]overlay=0:0:format=auto:enable='between(t,60.38,66.42)',format=yuv420p[v]",
].join(';');
run('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',source,'-loop','1','-framerate','30','-i',`${work}/record.png`,'-loop','1','-framerate','30','-i',`${work}/claim.png`,'-filter_complex',filter,'-map','[v]','-map','0:a:0','-t','114.666','-c:v','libx264','-preset','veryfast','-crf','22','-maxrate','4000k','-bufsize','8000k','-g','60','-c:a','copy','-movflags','+faststart',target]);
run('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss','57','-i',target,'-frames:v','1',`${work}/truth-preview.png`]);
run('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss','62','-i',target,'-frames:v','1',`${work}/claim-preview.png`]);
const original=JSON.parse(await readFile('demo/showcase-v201/judge-provenance.json','utf8'));
await writeFile(`${archive}/judge-provenance.json`,JSON.stringify({version:202,file:target,sha256:await sha(target),bytes:(await stat(target)).size,source_file:source,source_sha256:await sha(source),edit:'Two timed, legible evidence callouts at 54.25–60.38 and 60.38–66.42 seconds. Full-frame app capture, original audio and burned-in captions are preserved. The callouts explain an authored Truth Lab counterfactual; they do not assert football causality or independent validation.',overlays:await Promise.all(cards.map(async(card,i)=>({id:card.id,file:`${work}/${card.id}.png`,sha256:await sha(`${work}/${card.id}.png`),start_seconds:i?60.38:54.25,end_seconds:i?66.42:60.38}))),source_provenance:'demo/showcase-v201/judge-provenance.json',source_capture_model_requests:original.live_model_requests_in_v187_capture},null,2)+'\n');
console.log(JSON.stringify({target,bytes:(await stat(target)).size,sha256:await sha(target)}));
