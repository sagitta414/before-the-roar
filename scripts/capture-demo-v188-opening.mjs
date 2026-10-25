// Record the previously generated R1 discussion in the real public Watch UI.
// This does not send a new model request; the later v187 capture contains the new rounds.
import { createRequire } from 'node:module';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin=process.argv[2];
if(!origin?.startsWith('https://'))throw Error('Pass the public HTTPS origin');
const output='demo/showcase-v188';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const context=await browser.newContext({viewport:{width:1600,height:900},recordVideo:{dir:'tmp/submission-demo-v188',size:{width:1600,height:900}}});
const page=await context.newPage();const requests=[];page.on('request',r=>{if(r.url().includes('/api/match-desk')&&r.method()==='POST')requests.push(r.url());});
try{
 await page.goto(`${origin}/#watch`,{waitUntil:'domcontentloaded',timeout:45000});
 await page.getByRole('button',{name:'Truth Lab'}).click();
 await page.locator('.story-spine__step[data-section=watch]').click();
 await page.locator('#watch-source').selectOption('match');
 await page.waitForTimeout(1000);
 await page.locator('#room-panel').evaluate(node=>node.scrollTo({top:0,behavior:'instant'}));
 const replay=page.locator('#match-video');if(await replay.count())await replay.evaluate(video=>video.play().catch(()=>{}));
 await page.waitForTimeout(2100);
 await page.locator('#room-panel').evaluate(node=>node.scrollTo({top:node.scrollHeight/2,behavior:'smooth'}));
 await page.waitForTimeout(2200);
 await page.locator('#room-panel').evaluate(node=>node.scrollTo({top:node.scrollHeight,behavior:'smooth'}));
 await page.waitForTimeout(2100);
 await page.locator('#desk-tab').click();
 await page.waitForTimeout(2800);
}finally{
 await context.close();await copyFile(await page.video().path(),`${output}/opening-crew-ui.webm`);
 await browser.close();
 await writeFile(`${output}/opening-capture.json`,JSON.stringify({origin,model_requests:requests.length,scope:'Recorded public UI showing a previously generated original-revision discussion; no fresh model request in this recording.'},null,2)+'\n');
}
if(requests.length)throw Error(`Unexpected new model requests: ${requests.length}`);
