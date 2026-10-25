import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require(process.env.BTR_SHARP_PATH || 'C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const work = 'tmp/submission-demo-v187';
const archive = 'demo/showcase-v187';
const scenes = JSON.parse(await readFile('scripts/demo-v187-scenes.json', 'utf8'));
const raw = await readFile('demo/showcase-v186/live-sequence.json');
const proof = JSON.parse(raw);
const captureRaw = await readFile(`${archive}/capture.json`);
const capture = JSON.parse(captureRaw);
if (!proof.complete || proof.rounds.length !== 3 || proof.rounds.some(round => !round.complete)) throw Error('Live proof is incomplete');
if (proof.rounds.some(round => round.events.some(event => event.type === 'post' && event.data.engine === 'reviewed_fallback'))) throw Error('The selected live proof contains fallback posts');
if (capture.model_requests_used !== 8 || capture.requests.length !== 2) throw Error('The browser capture needs two new four-model rounds');
await mkdir(work, { recursive: true });
await mkdir(archive, { recursive: true });
const run = args => {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8', maxBuffer: 8e6 });
  if (result.status !== 0) throw Error(result.stderr || String(result.error));
};
const seconds = file => {
  const result = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  if (result.status !== 0) throw Error(result.stderr);
  return Number(result.stdout.trim());
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function wrap(value, limit = 50) {
  const words = String(value).split(/\s+/), lines = [];
  let line = '';
  for (const word of words) {
    if (`${line} ${word}`.trim().length > limit && line) { lines.push(line); line = word; }
    else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines;
}
const textLines = (value, x, y, size = 29, color = '#e8f1f7', max = 54, leading = size * 1.26) =>
  wrap(value, max).map((line, i) => `<text x="${x}" y="${y + i * leading}" font-family="Arial" font-size="${size}" fill="${color}">${esc(line)}</text>`).join('');
const post = (index, role) => proof.rounds[index].events.find(event => event.type === 'post' && event.data.role === role)?.data;
const headline = (eyebrow, title, note, accent = '#ff315d') => `
  <rect width="1920" height="1080" fill="#071019"/><path d="M0 0h1920" stroke="${accent}" stroke-width="12"/>
  <text x="78" y="80" font-family="Arial" font-size="22" font-weight="bold" letter-spacing="3" fill="${accent}">${esc(eyebrow)}</text>
  <text x="78" y="158" font-family="Arial" font-size="60" font-weight="bold" fill="#ffffff">${esc(title)}</text>
  ${textLines(note, 80, 206, 25, '#a7bcca', 105, 32)}<path d="M78 236h1764" stroke="#294454" stroke-width="2"/>`;
function row(y, label, body, color = '#b6ff2f', max = 94) {
  return `<rect x="78" y="${y}" width="1764" height="154" rx="6" fill="#10202d" stroke="#365264"/>
    <rect x="78" y="${y}" width="8" height="154" fill="${color}"/>
    <text x="110" y="${y + 37}" font-family="Arial" font-size="23" font-weight="bold" fill="${color}">${esc(label)}</text>
    ${textLines(body, 110, y + 78, 28, '#ffffff', max, 36)}`;
}
const stages = {
  'opening-round': () => headline('PUBLIC RUN / REVISION R1 / 4 AZURE MODEL REQUESTS', 'Five roles. Four model calls. One checked line.', 'Exact public SSE contributions, visualized. Vector calculates in code.') +
    row(265, 'SCOUT / AZURE MODEL', post(0, 'analyst').summary, '#66c9ff') +
    row(430, 'VECTOR / DETERMINISTIC', post(0, 'math').summary, '#b6ff2f') +
    row(595, 'CHECK / AZURE MODEL + EVIDENCE GATE', post(0, 'reviewer').summary, '#ffb96c') +
    row(760, 'HOST / AZURE MODEL', post(0, 'presenter').summary, '#ff6b86'),
  'challenge-round': () => headline('PUBLIC RUN / ROUND 2 / SAME R1 EVIDENCE', 'A viewer challenges the crew.', proof.rounds[1].input.question) +
    `<rect x="78" y="276" width="560" height="535" rx="8" fill="#172b36" stroke="#365264"/>
    <text x="120" y="395" font-family="Arial" font-size="145" font-weight="bold" fill="#b6ff2f">13.0 m</text>
    ${textLines('Defender displacement recorded in R1. Movement is measurable. Cause is not.', 120, 458, 28, '#e8f1f7', 28, 37)}
    <rect x="675" y="276" width="1167" height="245" rx="8" fill="#10202d" stroke="#365264"/>
    <text x="715" y="327" font-family="Arial" font-size="25" font-weight="bold" fill="#ffb96c">CHECK / AZURE MODEL</text>
    ${textLines(post(1, 'reviewer').summary, 715, 384, 32, '#ffffff', 66, 43)}
    <rect x="675" y="540" width="1167" height="271" rx="8" fill="#10202d" stroke="#ff315d"/>
    <text x="715" y="590" font-family="Arial" font-size="25" font-weight="bold" fill="#ff6b86">HOST / WHAT WOULD CHANGE THE VERDICT</text>
    ${textLines('Replay the defender at pass release, then use a comparable attack without that run.', 715, 650, 32, '#ffffff', 61, 43)}
    ${textLines('The evidence has not changed. The follow-up separates a measured shift from a causal claim.', 80, 900, 29, '#b6ff2f', 100, 39)}`,
  'corrected-round': () => headline('PUBLIC RUN / ROUND 3 / CORRECTED REVISION R2', 'The evidence changed. So did the line.', 'The R2 round is a new conversation because the source revision changed.') +
    `<rect x="78" y="285" width="815" height="254" rx="8" fill="#172b36" stroke="#ff315d"/>
    <text x="116" y="370" font-family="Arial" font-size="76" font-weight="bold" fill="#ff6b86">13.0 → 0.0 m</text>
    <text x="116" y="432" font-family="Arial" font-size="29" fill="#ffffff">DEFENDER SHIFT / TRACKING CORRECTION</text>
    <rect x="915" y="285" width="927" height="254" rx="8" fill="#172b36" stroke="#b6ff2f"/>
    <text x="958" y="370" font-family="Arial" font-size="76" font-weight="bold" fill="#b6ff2f">2 passes</text>
    <text x="958" y="432" font-family="Arial" font-size="29" fill="#ffffff">23.7 m FORWARD GAIN SURVIVES</text>
    ${row(574, 'CHECK / AZURE MODEL', post(2, 'reviewer').summary, '#ffb96c')}
    ${row(755, 'HOST / AZURE MODEL / OPENING LINE', post(2, 'presenter').summary.split(' The correction')[0], '#ff6b86', 101)}`,
  publish: () => headline('BROADCAST OUTPUT / R2 / VISUALIZED FROM LIVE RECEIPTS', 'Publish the narrower story.', 'This is the prepared line and its evidence state, not a confirmed phone delivery.') +
    `<rect x="78" y="281" width="1764" height="373" rx="8" fill="#10202d" stroke="#ff315d"/>
    <text x="115" y="335" font-family="Arial" font-size="25" font-weight="bold" fill="#ff6b86">HOST / CORRECTED BROADCAST LINE</text>
    ${textLines(post(2, 'presenter').summary, 115, 392, 34, '#ffffff', 92, 46)}
    <rect x="78" y="683" width="560" height="210" rx="8" fill="#142934" stroke="#b6ff2f"/>
    <text x="110" y="737" font-family="Arial" font-size="25" font-weight="bold" fill="#b6ff2f">SUPPORTED</text>
    ${textLines('Two completed passes · 23.7 m forward gain', 110, 792, 29, '#ffffff', 28, 38)}
    <rect x="668" y="683" width="560" height="210" rx="8" fill="#142934" stroke="#ff315d"/>
    <text x="700" y="737" font-family="Arial" font-size="25" font-weight="bold" fill="#ff6b86">WITHDRAWN</text>
    ${textLines('Defender-movement and spacing claim', 700, 792, 29, '#ffffff', 28, 38)}
    <rect x="1258" y="683" width="584" height="210" rx="8" fill="#142934" stroke="#66c9ff"/>
    <text x="1290" y="737" font-family="Arial" font-size="25" font-weight="bold" fill="#66c9ff">DELIVERY STATE</text>
    ${textLines('Prepared · phone receipt pending', 1290, 792, 29, '#ffffff', 28, 38)}`
};
for (const [id, build] of Object.entries(stages)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">${build()}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${work}/${id}.png`);
}
const phone = await sharp('tmp/submission-demo-v7/phone.png').resize(1920, 1080).png().toBuffer();
await sharp(phone).composite([{ input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><rect x="0" y="0" width="1920" height="130" fill="#071019"/><text x="70" y="72" font-family="Arial" font-size="45" font-weight="bold" fill="white">R2 / SAME CORRECTION, PERSONALIZED FOR A NEW FAN</text><text x="70" y="108" font-family="Arial" font-size="20" fill="#b6ff2f">PAIRED-PHONE REFERENCE CAPTURE · RECEIPT AFTER RECONNECTION</text></svg>'), left: 0, top: 0 }]).png().toFile(`${work}/phone.png`);
for (const [i, scene] of scenes.entries()) {
  const voice = `${work}/voice-${i}.wav`, speech = seconds(voice);
  const tempo = Math.max(1, speech / (scene.duration - .25));
  if (tempo > 1.12) throw Error(`${scene.id} narration overrun: ${speech}s`);
  let inputs, filter;
  if (scene.id === 'opening' || scene.id === 'closing') {
    inputs = ['-ss', scene.id === 'opening' ? '2' : '34', '-stream_loop', '-1', '-i', 'dist/assets/pitchside-minute.mp4', '-i', voice];
    const title = scene.id === 'opening' ? 'BEFORE THE ROAR / EVERY PLAY HAS A WHY' : 'ONE MATCH. EVERY PERSPECTIVE.';
    filter = `[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,drawbox=x=56:y=790:w=1730:h=120:color=0x071019@0.86:t=fill,drawbox=x=56:y=790:w=10:h=120:color=0xff315d:t=fill,drawtext=text='${title}':x=88:y=835:fontsize=48:fontcolor=white:fontfile='C\\:/Windows/Fonts/arialbd.ttf',drawtext=text='AI-GENERATED FICTIONAL FOOTBALL':x=60:y=68:fontsize=23:fontcolor=white:fontfile='C\\:/Windows/Fonts/arialbd.ttf'[v]`;
  } else if (scene.id.startsWith('ui-')) {
    const source = `${archive}/live-ui-uncut.webm`;
    const cuts = { 'ui-challenge': [3.2, 8.6], 'ui-correction': [11.8, 4.1], 'ui-r2': [15.9, 6.7] };
    const [start, span] = cuts[scene.id];
    const stretch = scene.duration / span;
    inputs = ['-ss', String(start), '-t', String(span), '-i', source, '-i', voice];
    filter = `[0:v]setpts=${stretch.toFixed(6)}*(PTS-STARTPTS),scale=1920:1080,drawbox=x=0:y=0:w=iw:h=54:color=0x071019@0.92:t=fill,drawtext=text='PUBLIC APP / CONTINUOUS SCREEN CAPTURE / 8 NEW AZURE MODEL REQUESTS':x=30:y=15:fontsize=22:fontcolor=white:fontfile='C\\:/Windows/Fonts/arialbd.ttf'[v]`;
  } else if (scene.id === 'r2-receipts') {
    inputs = ['-loop', '1', '-i', `${archive}/r2-receipts.png`, '-i', voice];
    filter = `[0:v]scale=1920:1080,zoompan=z='1.0+0.012*on/${scene.duration * 30}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1920x1080:fps=30,drawbox=x=0:y=0:w=iw:h=50:color=0x071019@0.92:t=fill,drawtext=text='R2 / RECORDED PUBLIC APP / FOUR LIVE MODEL RECEIPTS':x=30:y=15:fontsize=22:fontcolor=white:fontfile='C\\:/Windows/Fonts/arialbd.ttf'[v]`;
  } else if (scene.id === 'watch' || scene.id === 'architecture') {
    const source = scene.id === 'watch' ? 'demo/showcase-v175/watch-recording.mp4' : `demo/showcase-v174/${scene.id}-uncut.mp4`;
    inputs = ['-i', source, '-i', voice];
    const label = scene.id === 'watch' ? 'AI FILM / REVIEWED-NOTE PLAYBACK · SEPARATE FROM MEASURED MATCH' : 'SECURE / RECORDED INTERACTIVE ARCHITECTURE';
    filter = `[0:v]scale=1920:1080,tpad=stop_mode=clone:stop_duration=6,drawbox=x=0:y=0:w=iw:h=50:color=0x071019@0.94:t=fill,drawtext=text='${label}':x=30:y=15:fontsize=22:fontcolor=white:fontfile='C\\:/Windows/Fonts/arialbd.ttf'[v]`;
  } else {
    inputs = ['-loop', '1', '-i', `${work}/${scene.id}.png`, '-i', voice];
    filter = `[0:v]scale=1920:1080,zoompan=z='1.0+0.014*on/${scene.duration * 30}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1920x1080:fps=30[v]`;
  }
  filter += `;[1:a]atempo=${tempo},adelay=100|100,apad,atrim=duration=${scene.duration}[a]`;
  run([...inputs, '-filter_complex', filter, '-map', '[v]', '-map', '[a]', '-t', String(scene.duration), '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-ar', '48000', '-b:a', '160k', `${work}/${scene.id}.mp4`]);
  scene.speech = speech / tempo;
  console.log(`Rendered ${scene.id}`);
}
const stamp = time => { const n = Math.round(time * 1000); return `${String(Math.floor(n / 3600000)).padStart(2, '0')}:${String(Math.floor(n / 60000) % 60).padStart(2, '0')}:${String(Math.floor(n / 1000) % 60).padStart(2, '0')},${String(n % 1000).padStart(3, '0')}`; };
let elapsed = 0, index = 1;
const captions = [], timings = [], concat = [];
for (const scene of scenes) {
  const path = `${work}/${scene.id}.mp4`, duration = seconds(path);
  concat.push(`file '${process.cwd().replaceAll('\\', '/')}/${path}'`);
  let offset = 0;
  for (const line of scene.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [scene.text]) {
    const span = scene.speech * line.length / scene.text.length;
    captions.push(`${index++}\n${stamp(elapsed + .1 + offset)} --> ${stamp(elapsed + .1 + offset + span)}\n${line.trim()}\n`);
    offset += span;
  }
  timings.push({ id: scene.id, start: elapsed, duration });
  elapsed += duration;
}
if (elapsed >= 120) throw Error(`Judge cut exceeds two minutes: ${elapsed}`);
await writeFile(`${work}/concat.txt`, concat.join('\n'));
await writeFile(`${archive}/judge.srt`, captions.join('\n'));
await writeFile(`${archive}/judge-transcript.txt`, scenes.map(scene => scene.text).join('\n\n'));
const output = 'dist/assets/before-the-roar-judge-v187.mp4';
run(['-f', 'concat', '-safe', '0', '-i', `${work}/concat.txt`, '-vf', `subtitles=${archive}/judge.srt:force_style='FontName=Arial,FontSize=10,Outline=1,Shadow=0,MarginV=9,BorderStyle=3,OutlineColour=&H99000000',scale=1600:900,fade=t=in:st=0:d=0.2,fade=t=out:st=${elapsed - .5}:d=0.5`, '-af', 'highpass=f=65,loudnorm=I=-16:TP=-1.5:LRA=9', '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-maxrate', '3000k', '-bufsize', '6000k', '-g', '60', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', output]);
run(['-ss', '40', '-i', output, '-frames:v', '1', 'dist/assets/demo-v187-poster.jpg']);
const bytes = await readFile(output);
await writeFile(`${archive}/judge-provenance.json`, JSON.stringify({
  version: 187, file: output, duration_seconds: seconds(output), sha256: hash(bytes), bytes: (await stat(output)).size,
  opening_receipts: 'demo/showcase-v186/live-sequence.json', opening_receipts_sha256: hash(raw),
  fresh_browser_capture: `${archive}/live-ui-uncut.webm`, fresh_browser_capture_sha256: hash(await readFile(`${archive}/live-ui-uncut.webm`)), capture_metadata_sha256: hash(captureRaw),
  release: { capture_image_tag: 'v186-judge', opening_receipt_release: proof.release }, opening_round_model_requests: 4, browser_round_model_requests: capture.model_requests_used, model_roles_per_round: ['Scout', 'Guide', 'Check', 'Host'], deterministic_role: 'Vector',
  timings,
  visual_sources: 'Opening and Watch use fictional AI film and recorded app playback. The first receipt card visualizes a separate public SSE round captured in v186. The 30-second middle sequence uses consecutive excerpts from one continuous public browser screen recording of two fresh four-model rounds with a deterministic Truth Lab correction between them, slowed to fit narration. The R2 receipt frame is from that run. Phone is a paired R2 reference capture after reconnect. Architecture is earlier app footage. Publish is a receipt-derived editorial visualization.',
  voice: 'Azure AI Speech HD narration added in editing, not live agent speech.',
  evidence_scope: 'The AI film and measured synthetic match are separate sources. The correction tests evidence dependence, not football causality. No independent commentary preference or unfamiliar broadcast-video accuracy is claimed.'
}, null, 2) + '\n');
console.log(`Judge cut: ${elapsed.toFixed(2)} seconds, ${bytes.length} bytes`);
