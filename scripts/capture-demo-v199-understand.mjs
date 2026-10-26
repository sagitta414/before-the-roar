// Capture only the product screen used under the Understand narration.
// Frame screenshots avoid the text corruption in the older WebM screencast.
import { createRequire } from 'node:module';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.argv[2] ?? 'http://127.0.0.1:4396';
const archive = 'demo/showcase-v199';
const frames = 'tmp/submission-demo-v199/understand-frames';
await mkdir(archive, { recursive: true });
await mkdir(frames, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
const posts = [];
page.on('request', request => { if (request.method() === 'POST' && /\/api\/(match-desk|desk|narrative|vision)/.test(request.url())) posts.push(request.url()); });
try {
  await page.goto(`${origin}/#centre`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  if (await page.getByRole('button', { name: 'Truth Lab' }).isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Truth Lab' }).click();
  }
  await page.locator('.story-spine__step[data-section=centre]').click();
  await page.locator('.understand-modes [data-mode=beginner]').click();
  await page.evaluate(() => document.fonts.ready);
  // Headless Chrome intermittently drops glyphs from the display webfont in
  // recorded frames. Use a stable system font for this video capture only.
  await page.addStyleTag({ content: '.understand-now, .understand-now * { font-family: Arial, sans-serif !important; font-kerning: normal !important; text-rendering: optimizeLegibility !important; }' });
  await page.waitForTimeout(500);
  for (let frame = 0; frame < 126; frame++) {
    if (frame === 76) {
      await page.locator('.understand-modes [data-mode=math]').click();
      await page.waitForTimeout(160);
    }
    await page.screenshot({ path: `${frames}/${String(frame).padStart(4, '0')}.png`, animations: 'disabled' });
  }
} finally { await browser.close(); }
if (posts.length) throw Error(`Unexpected model requests: ${posts.length}`);
const beginner = `${archive}/understand-beginner.png`;
const math = `${archive}/understand-math.png`;
await copyFile(`${frames}/0060.png`, beginner);
await copyFile(`${frames}/0112.png`, math);
// Hold two verified, crisp frames of the real UI and dissolve between modes.
// The screenshot stream itself intermittently loses individual font glyphs.
const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-loop', '1', '-t', '5.2', '-i', beginner, '-loop', '1', '-t', '3.8', '-i', math, '-filter_complex', '[0:v]fps=30,format=yuv420p[a];[1:v]fps=30,format=yuv420p[b];[a][b]xfade=transition=fade:duration=0.6:offset=4.6[v]', '-map', '[v]', '-t', '8.4', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '30', `${archive}/understand-clean.mp4`], { encoding: 'utf8', maxBuffer: 4e6 });
if (result.status !== 0) throw Error(result.stderr || String(result.error));
await writeFile(`${archive}/understand-capture.json`, JSON.stringify({ source: origin, fps: 15, frames: 126, seconds: 8.4, model_requests: posts.length, scope: 'Two source screenshots of the real Understand UI, beginner then math, joined by a 0.6-second dissolve. No welcome screen or generated model response.' }, null, 2) + '\n');
