import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin=process.argv[2]||'http://127.0.0.1:4396';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
for(const width of [1365,390]){
 const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`${origin}/#centre`,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForTimeout(950);
 if(await page.locator('.btr-enter').isVisible().catch(()=>false))await page.locator('.btr-enter').click();
 await page.locator('.story-spine__step[data-section=centre]').click();
 await page.evaluate(async()=>{const {matchSession}=await import('/match-session.js');matchSession.set({source:'match',scenario:'wide',time:16,team:'harbor',section:'centre'},'kick-check');});
 await page.locator('.kick-outcomes').waitFor({state:'visible'});
 let values=await page.locator('.kick-outcome-value strong').allTextContents();
 if(values.join('|')!=='100%|—|—')throw Error(JSON.stringify({width,values,errors}));
 await page.screenshot({path:`tmp/kick-outcomes-${width}.png`,animations:'disabled'});
 await page.evaluate(async()=>{const {matchSession}=await import('/match-session.js');matchSession.set({time:31},'kick-check');});
 values=await page.locator('.kick-outcome-value strong').allTextContents();
 if(values.join('|')!=='100%|100%|100%'||errors.length)throw Error(JSON.stringify({width,values,errors}));
 await page.evaluate(async()=>{const {matchSession}=await import('/match-session.js');matchSession.set({source:'pitchside'},'kick-check');});
 if(await page.locator('.kick-outcomes').isVisible())throw Error('Synthetic kick rates leaked into film mode.');
 await page.close();
}
await browser.close();
console.log('Kick outcome strip passed desktop and mobile playhead checks.');
