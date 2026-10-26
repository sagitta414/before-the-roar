// Capture current public product screens without generating model output.
import { createRequire } from 'node:module';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2];
if (!origin?.startsWith('https://')) throw Error('Pass the public HTTPS app origin');
const output = 'demo/showcase-v196';
await mkdir(output, { recursive: true });
await mkdir('tmp/submission-demo-v196', { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, recordVideo: { dir: 'tmp/submission-demo-v196', size: { width: 1600, height: 900 } } });
const page = await context.newPage();
const posts = [];
page.on('request', request => {
  if (request.method() === 'POST' && /\/api\/(match-desk|desk|narrative|vision)/.test(request.url())) posts.push(request.url());
});
const started = Date.now();
const marks = [];
const mark = name => { const at = (Date.now() - started) / 1000; marks.push({ name, at }); console.log(`${name}: ${at.toFixed(2)}s`); };
const pause = ms => page.waitForTimeout(ms);
try {
  await page.goto(`${origin}/#watch`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const enter = page.getByRole('button', { name: 'Truth Lab' });
  await enter.click();
  await pause(700);
  await page.locator('.story-spine__step[data-section=centre]').click();
  mark('understand');
  await pause(1600);
  await page.locator('.understand-modes [data-mode=math]').click();
  await pause(1900);
  await page.locator('.understand-modes [data-mode=beginner]').click();
  await pause(2500);
  await page.screenshot({ path: `${output}/understand.png` });
  await page.locator('.story-spine__step[data-section=inside]').click();
  mark('publish');
  await pause(1400);
  await page.locator('[data-publish-mode-select]').selectOption('math');
  await pause(1800);
  await page.locator('[data-publish-mode-select]').selectOption('beginner');
  await pause(2800);
  await page.screenshot({ path: `${output}/publish.png` });
  await page.locator('.story-spine__step[data-section=truth]').click();
  mark('truth');
  await pause(3000);
  await page.screenshot({ path: `${output}/truth.png` });
  await page.locator('.accessibility-launcher').click();
  mark('accessibility');
  await pause(1200);
  await page.locator('#a11y-color-vision').selectOption('redGreen');
  await pause(4500);
  await page.screenshot({ path: `${output}/accessibility.png` });
} finally {
  await context.close();
  await copyFile(await page.video().path(), `${output}/current-ui.webm`);
  await browser.close();
  await writeFile(`${output}/current-capture.json`, JSON.stringify({ origin, created_at: new Date().toISOString(), marks, model_requests: posts.length, scope: 'Current public Understand, Publish, and Truth Lab screens captured without generating new model output.' }, null, 2) + '\n');
}
if (posts.length) throw Error(`Unexpected model requests: ${posts.length}`);
