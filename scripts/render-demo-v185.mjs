import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require(process.env.BTR_SHARP_PATH || 'C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const work = 'tmp/submission-demo-v185';
const archive = 'demo/showcase-v185';
const previous = 'tmp/submission-demo-v7';
await mkdir(work, { recursive: true });
await mkdir(archive, { recursive: true });
const scenes = JSON.parse(await readFile('scripts/demo-v7-scenes.json', 'utf8'));
const old = JSON.parse(await readFile('scripts/demo-v5-scenes.json', 'utf8'));
scenes.find(scene => scene.id === 'phone').duration = 13;
scenes.find(scene => scene.id === 'phone').text = 'Pocket Director now opens with a beginner explanation. Choose a player, language, or deeper view. Pair your phone to receive the same source revision and corrections. This screen is the unpaired interactive demo.';
const run = args => {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8', maxBuffer: 8e6 });
  if (result.status !== 0) throw Error(result.stderr || String(result.error));
};
const seconds = path => {
  const result = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], { encoding: 'utf8' });
  if (result.status !== 0) throw Error(result.stderr);
  return Number(result.stdout.trim());
};
const freshFrames = {
  understand: `${archive}/understand-current.png`,
  publish: `${archive}/publish-current.png`,
};
const desktop = await sharp(freshFrames.understand).resize(1410, 793).png().toBuffer();
const phone = await sharp(`${archive}/pocket-beginner-current.png`).resize({ height: 925 }).png().toBuffer();
const background = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><rect width="1920" height="1080" fill="#071019"/><path d="M0 1060L1920 60" stroke="#20394f" stroke-width="2"/><text x="42" y="82" font-family="Arial" font-size="34" font-weight="bold" fill="white">ONE STORY. MADE FOR YOUR SCREEN.</text><text x="43" y="112" font-family="Arial" font-size="19" fill="#c4d2df">CURRENT PRODUCT CAPTURES / LOCAL INTERACTIVE DEMO</text></svg>');
await sharp(background).composite([{ input: desktop, left: 30, top: 155 }, { input: phone, left: 1437, top: 80 }]).png().toFile(`${work}/phone.png`);

for (const scene of scenes.filter(item => ['understand', 'phone', 'publish'].includes(item.id))) {
  const source = scene.id === 'phone' ? `${work}/phone.png` : freshFrames[scene.id];
  const voice = scene.id === 'phone' ? `${archive}/voice-phone.wav` : `${previous}/voice-${scenes.indexOf(scene)}.wav`;
  const speech = seconds(voice);
  const tempo = Math.max(1, speech / (scene.duration - .3));
  if (tempo > 1.12) throw Error(`Narration overrun: ${scene.id}`);
  const filter = `[0:v]scale=1920:1080,zoompan=z='1.0+0.018*on/${scene.duration * 30}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1920x1080:fps=30[v];[1:a]atempo=${tempo},adelay=100|100,apad,atrim=duration=${scene.duration}[a]`;
  run(['-loop', '1', '-i', source, '-i', voice, '-filter_complex', filter, '-map', '[v]', '-map', '[a]', '-t', String(scene.duration), '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-ar', '48000', '-b:a', '160k', `${work}/${scene.id}.mp4`]);
  scene.speech = speech / tempo;
  console.log(`Rendered ${scene.id}`);
}

const legacy = i => ({ id: `live-${i}`, text: old[i].text, path: `tmp/submission-demo-v5/part-${i}.mp4` });
const syncedPhone = { id: 'paired-phone', text: 'Now the uploaded clip reaches your phone. The video stays on the computer. Withdraw its observation, and the phone removes the claim and its numbers. The source receipt remains. One correction, shared across both screens.', path: 'tmp/demo-v177/phone-segment.mp4' };
const full = [scenes[0], scenes[1], ...[3, 4, 5, 6].map(legacy), scenes[2], scenes[3], ...[9, 10].map(legacy), scenes[4], scenes[5], legacy(13), scenes[6], legacy(15), syncedPhone, scenes[7], scenes[8]];
const stamp = time => {
  const n = Math.round(time * 1000);
  return `${String(Math.floor(n / 3600000)).padStart(2, '0')}:${String(Math.floor(n / 60000) % 60).padStart(2, '0')}:${String(Math.floor(n / 1000) % 60).padStart(2, '0')},${String(n % 1000).padStart(3, '0')}`;
};
for (const [cut, items] of [['judge', scenes], ['showcase', full]]) {
  let elapsed = 0, index = 1;
  const captions = [], timings = [], concat = [];
  for (const scene of items) {
    const path = scene.path || `${['understand', 'phone', 'publish'].includes(scene.id) ? work : previous}/${scene.id}.mp4`;
    const duration = seconds(path);
    const speech = scene.speech || duration - .5;
    concat.push(`file '${process.cwd().replaceAll('\\', '/')}/${path}'`);
    let offset = 0;
    for (const line of scene.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [scene.text]) {
      const span = speech * line.length / scene.text.length;
      captions.push(`${index++}\n${stamp(elapsed + .1 + offset)} --> ${stamp(elapsed + .1 + offset + span)}\n${line.trim()}\n`);
      offset += span;
    }
    timings.push({ id: scene.id, start: elapsed, duration });
    elapsed += duration;
  }
  if (cut === 'judge' && elapsed >= 120) throw Error('Judge cut exceeds two minutes');
  await writeFile(`${work}/${cut}-concat.txt`, concat.join('\n'));
  await writeFile(`${archive}/${cut}.srt`, captions.join('\n'));
  await writeFile(`${archive}/${cut}-transcript.txt`, items.map(scene => scene.text).join('\n\n'));
  const output = `dist/assets/before-the-roar-${cut}-v185.mp4`;
  run(['-f', 'concat', '-safe', '0', '-i', `${work}/${cut}-concat.txt`, '-i', 'demo/showcase-v174/btr-original-sonic.wav', '-filter_complex', `[0:v]subtitles=${archive}/${cut}.srt:force_style='FontName=Arial,FontSize=14,Outline=1,Shadow=0,MarginV=14,BorderStyle=3,OutlineColour=&H99000000',scale=1600:900,fade=t=in:st=0:d=0.2,fade=t=out:st=${elapsed - .5}:d=0.5[v];[1:a]adelay=${Math.round((elapsed - 2.8) * 1000)}|${Math.round((elapsed - 2.8) * 1000)}[sig];[0:a][sig]amix=inputs=2:duration=first:normalize=0,highpass=f=65,loudnorm=I=-16:TP=-1.5:LRA=9[a]`, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-maxrate', '3000k', '-bufsize', '6000k', '-g', '60', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', output]);
  const bytes = await readFile(output);
  await writeFile(`${archive}/${cut}-provenance.json`, JSON.stringify({ version: 185, file: output, duration_seconds: seconds(output), sha256: createHash('sha256').update(bytes).digest('hex'), bytes: (await stat(output)).size, timings, refreshed_captures: ['Understand', 'Publish', 'Pocket Director beginner mode'], previous_recordings: 'Moving Watch, Truth Lab correction, architecture, and extended model exchanges are retained from v175/v174/v173 recordings. The expanded cut retains the v177 paired phone correction. They are edited demonstrations, not a fresh live run on v185.', narration: 'Azure AI Speech HD narration from the prior production, plus one newly recorded Pocket Director line; narration is not live agent speech.', evidence_scope: 'The cinematic film and controlled measured clip are separate sources. Truth Lab correction is deterministic. Independent commentary superiority and unfamiliar broadcast-video accuracy remain unproven.' }, null, 2));
  console.log(`${cut}: ${elapsed.toFixed(2)} seconds`);
}
