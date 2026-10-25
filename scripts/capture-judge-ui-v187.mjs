// Record a bounded public-browser run. Never substitute staged SSE posts for live UI.
import { createRequire } from 'node:module';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2];
if (!origin?.startsWith('https://')) throw Error('Provide the public HTTPS app origin');
const output = 'demo/showcase-v187';
await mkdir(output, { recursive: true });
const allowanceBefore = await fetch(`${origin}/api/health`).then(response => response.json()).then(data => data.usage);
if (allowanceBefore.limit - allowanceBefore.used < 8) throw Error('Need eight available model requests for this bounded capture');
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, recordVideo: { dir: 'tmp/submission-demo-v187', size: { width: 1600, height: 900 } } });
const page = await context.newPage();
const started = Date.now();
const marks = [];
const mark = (step, detail = '') => { const at = (Date.now() - started) / 1000; marks.push({ step, at, detail }); console.log(`${at.toFixed(1)}s ${step} ${detail}`); };
const requests = [];
page.on('request', request => {
  if (request.url().includes('/api/match-desk') && request.method() === 'POST') {
    const body = JSON.parse(request.postData() || '{}');
    requests.push({ at: (Date.now() - started) / 1000, question: body.question, corrected: body.corrected, scenario: body.scenario });
  }
});
const waitForRound = async label => {
  await page.locator('#send-question').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelector('#send-question')?.disabled === true, null, { timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('#send-question')?.disabled === false, null, { timeout: 110000 });
  mark(`${label}-complete`, (await page.locator('#party-status').innerText()).slice(0, 140));
};
try {
  await page.goto(`${origin}/#watch`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.getByRole('button', { name: 'Truth Lab' }).click();
  await page.locator('.story-spine__step[data-section=watch]').click();
  await page.locator('#watch-source').selectOption('match');
  await page.waitForTimeout(1200);
  mark('watch-r1');
  await page.screenshot({ path: `${output}/r1-before.png` });
  const question = 'Can we credit the runner for the defender shifting in this wide-run play, or is that beyond the tracking? What should I check at pass release?';
  await page.locator('#question').fill(question);
  mark('challenge-entered');
  await page.waitForTimeout(900);
  await page.locator('#send-question').click();
  mark('challenge-sent');
  await waitForRound('challenge');
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${output}/challenge-complete.png` });
  await page.locator('#room-panel').evaluate(element => element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' }));
  await page.waitForTimeout(1700);
  mark('challenge-last-posts');
  await page.locator('.story-spine__step[data-section=truth]').click();
  const enterExperiment = page.getByRole('button', { name: /Try the evidence-change demonstration/ });
  if (await enterExperiment.isVisible().catch(() => false)) await enterExperiment.click();
  mark('truth-r1');
  await page.getByRole('button', { name: /Change the defender’s tracking/ }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  await page.getByRole('button', { name: /Change the defender’s tracking/ }).click();
  mark('correction-applied');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${output}/r2-correction.png` });
  await page.locator('.story-spine__step[data-section=watch]').click();
  await page.locator('#watch-source').selectOption('match');
  await page.waitForTimeout(900);
  mark('watch-r2');
  await page.locator('#question').fill('Corrected tracking says Laurent moved zero metres laterally. Which earlier movement claim is invalid, and which passing calculation survives?');
  await page.locator('#send-question').click();
  mark('r2-question-sent');
  await waitForRound('r2');
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${output}/r2-complete.png` });
  await page.locator('#desk-tab').click();
  mark('ai-desk');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${output}/r2-receipts.png` });
} finally {
  await context.close();
  const recorded = await page.video().path();
  await copyFile(recorded, `${output}/live-ui-uncut.webm`);
  await browser.close();
  const allowanceAfter = await fetch(`${origin}/api/health`).then(response => response.json()).then(data => data.usage);
  await writeFile(`${output}/capture.json`, JSON.stringify({ origin, created_at: new Date().toISOString(), duration_seconds: (Date.now() - started) / 1000, marks, requests, allowance_before: allowanceBefore, allowance_after: allowanceAfter, model_requests_used: allowanceAfter.used - allowanceBefore.used, scope: 'Real public UI recording, with health-counted model requests. It is an edited judge demo, not an uncut continuous match broadcast. Film footage remains a separate source.' }, null, 2) + '\n');
}
