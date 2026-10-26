// Recut the judge demo from recorded moving UI and separately labeled film.
// No model response is synthesized by this script; narration is edited Azure Speech.
import { readFile, writeFile, stat, mkdir, copyFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const work = 'tmp/submission-demo-v196';
const archive = 'demo/showcase-v196';
const current = `${archive}/current-ui.webm`;
const live = 'demo/showcase-v187/live-ui-uncut.webm';
const saved = 'demo/showcase-v188/opening-crew-ui.webm';
const old = `${archive}/sources`;
const output = 'dist/assets/before-the-roar-judge-v196.mp4';
const scenes = [
  { id: 'opening', seconds: 4, reuse: `${old}/00-opening.mp4`, caption: 'Before the Roar. Every play has a why.' },
  { id: 'watch', seconds: 13, reuse: `${old}/01-watch.mp4`, caption: 'A fictional film opens the match. The measured replay is a separate synthetic source.' },
  { id: 'understand', seconds: 10, file: current, from: 2.5, span: 6.3, voice: `${archive}/voice/voice-0.wav`, label: 'UNDERSTAND / BEGINNER AND MATH EXPLANATIONS', caption: 'Watch the ball. Then watch who moves without it. The explanation stays inside the evidence.' },
  { id: 'opening-round', seconds: 11, file: saved, from: 33, span: 4, voice: 'demo/showcase-v188/sources/voice-2.wav', label: 'ORIGINAL R1 / SAVED PUBLIC-APP DISCUSSION', focus: true, caption: 'Four Azure specialists investigate. Vector calculates in code. Check challenges the inference.' },
  { id: 'ui-challenge', seconds: 12, file: live, from: 5.4, span: 6.4, voice: 'demo/showcase-v188/sources/voice-3.wav', label: 'VIEWER CHALLENGE / RECORDED LIVE ROUND', focus: true, caption: 'Can the runner be credited for the defender shifting? Check says the cause is unproven.' },
  { id: 'ui-correction', seconds: 7, reuse: `${old}/04-ui-correction.mp4`, caption: 'Truth Lab changes one synthetic defender record: 13 metres becomes zero.' },
  { id: 'ui-r2', seconds: 11, file: live, from: 15.9, span: 4.1, voice: 'demo/showcase-v188/sources/voice-5.wav', label: 'CORRECTED R2 / NEW AZURE MODEL ROUND', focus: true, caption: 'The movement claim is withdrawn. Two completed passes remain supported.' },
  { id: 'r2-receipts', seconds: 8, file: live, from: 20, span: 1.88, voice: 'demo/showcase-v188/sources/voice-6.wav', label: 'AI DESK / FOUR LIVE REQUESTS + DETERMINISTIC VECTOR', focus: true, caption: 'Four live model receipts. Vector’s passing calculation remains deterministic.' },
  { id: 'phone', seconds: 10, reuse: `${old}/07-phone.mp4`, caption: 'Pocket Director shows the corrected revision to a new fan after reconnection.' },
  { id: 'accessibility', seconds: 8, file: current, from: 18.2, span: 6, voice: `${archive}/voice/voice-1.wav`, label: 'ACCESSIBILITY / SAME EVIDENCE, YOUR WAY', caption: 'Captions, spoken replay, distinct markers, and a readable transcript carry the same evidence.' },
  { id: 'publish', seconds: 9, file: current, from: 8.9, span: 6.2, voice: 'demo/showcase-v188/sources/voice-8.wav', label: 'CURRENT PUBLISH / THREE AUDIENCE PREVIEWS', caption: 'One evidence revision, three previews. Preparation is distinct from confirmed delivery.' },
  { id: 'architecture', seconds: 9, reuse: `${old}/09-architecture.mp4`, caption: 'Container Apps, Entra identity, Foundry, and Blob checkpoints support the workflow.' },
  { id: 'closing', seconds: 5, reuse: `${old}/10-closing.mp4`, caption: 'One match. Every perspective. Before the Roar.' },
];
const run = (bin, args) => {
  const result = spawnSync(bin, args, { encoding: 'utf8', maxBuffer: 8e6 });
  if (result.status !== 0) throw Error(`${bin}: ${result.stderr || result.error}`);
  return result.stdout.trim();
};
const duration = file => Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]));
const hash = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const clock = s => { const ms = Math.round(s * 1000); return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
await mkdir(work, { recursive: true });
const manifest = [];
for (const [index, scene] of scenes.entries()) {
  const target = `${work}/${String(index).padStart(2, '0')}-${scene.id}.mp4`;
  if (scene.reuse) {
    await copyFile(scene.reuse, target);
  } else {
    const speech = duration(scene.voice);
    const tempo = Math.max(0.90, speech / (scene.seconds - 0.16));
    if (tempo > 1.15) throw Error(`Narration too long for ${scene.id}`);
    const crop = scene.focus ? 'crop=800:450:800:230,' : '';
    const label = scene.label.replaceAll("'", '').replaceAll(':', '\\:');
    const video = `[0:v]setpts=${(scene.seconds / scene.span).toFixed(6)}*(PTS-STARTPTS),fps=30,${crop}scale=1600:900:force_original_aspect_ratio=increase,crop=1600:900,drawbox=x=0:y=0:w=iw:h=52:color=0x071019@0.94:t=fill,drawtext=text='${label}':x=25:y=13:fontsize=22:fontcolor=white:fontfile='C\\:/Windows/Fonts/arialbd.ttf'[v]`;
    const audio = `[1:a]atempo=${tempo},adelay=100|100,apad,atrim=duration=${scene.seconds}[a]`;
    run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(scene.from), '-t', String(scene.span), '-i', scene.file, '-i', scene.voice, '-filter_complex', `${video};${audio}`, '-map', '[v]', '-map', '[a]', '-t', String(scene.seconds), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-ar', '48000', '-b:a', '160k', target]);
  }
  manifest.push({ id: scene.id, seconds: scene.seconds, source: scene.reuse || scene.file, source_sha256: await hash(scene.reuse || scene.file), from: scene.from ?? 0, span: scene.span ?? scene.seconds, voice: scene.voice || 'v188 rendered segment', voice_sha256: scene.voice ? await hash(scene.voice) : null });
  console.log(`${index + 1}/${scenes.length} ${scene.id}`);
}
const elapsed = scenes.reduce((sum, scene) => sum + scene.seconds, 0);
if (elapsed >= 120) throw Error(`Judge cut is ${elapsed}s, above the limit`);
await writeFile(`${work}/concat.txt`, manifest.map((_, i) => `file '${process.cwd().replaceAll('\\', '/')}/${work}/${String(i).padStart(2, '0')}-${scenes[i].id}.mp4'`).join('\n'));
let offset = 0;
const srt = scenes.map((scene, i) => { const start = offset; offset += scene.seconds; return `${i + 1}\n${clock(start)} --> ${clock(offset - 0.14)}\n${scene.caption}\n`; }).join('\n');
await writeFile(`${archive}/judge.srt`, srt);
await writeFile(`${archive}/judge-transcript.txt`, scenes.map(s => `${s.id.toUpperCase()}: ${s.caption}`).join('\n') + '\n');
run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${work}/concat.txt`, '-stream_loop', '1', '-i', 'dist/assets/pitchside-minute.mp4', '-filter_complex', `[0:v]subtitles=${archive}/judge.srt:force_style='FontName=Arial,FontSize=11,Outline=1,Shadow=0,MarginV=12,BorderStyle=3,OutlineColour=&H99000000',fade=t=in:st=0:d=0.2,fade=t=out:st=${elapsed - 0.5}:d=0.5[v];[0:a]highpass=f=65,loudnorm=I=-16:TP=-1.5:LRA=9[voice];[1:a]volume=0.035,atrim=duration=${elapsed},asetpts=PTS-STARTPTS[bed];[voice][bed]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.90[a]`, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-maxrate', '3500k', '-bufsize', '7000k', '-g', '60', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', output]);
run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '8', '-i', output, '-frames:v', '1', 'dist/assets/demo-v196-poster.jpg']);
const capture = JSON.parse(await readFile('demo/showcase-v187/capture.json', 'utf8'));
const currentCapture = JSON.parse(await readFile(`${archive}/current-capture.json`, 'utf8'));
await writeFile(`${archive}/judge-provenance.json`, JSON.stringify({ version: 196, file: output, duration_seconds: duration(output), sha256: await hash(output), bytes: (await stat(output)).size, scenes: manifest, ambient_source: 'dist/assets/pitchside-minute.mp4', ambient_source_sha256: await hash('dist/assets/pitchside-minute.mp4'), ambient_mix_volume: 0.035, live_model_requests_in_v187_capture: capture.model_requests_used, model_requests_in_current_screen_capture: currentCapture.model_requests, boundaries: 'Edited moving footage with speech, low-level film ambience and captions added afterward. The cinematic film, controlled measured replay, live synthetic match discussions and current product screen capture have distinct sources. R1 is saved; the later R1 challenge and R2 correction are one older public-app capture. New Understand, Publish and Accessibility footage is current public UI with zero model requests. Truth Lab tests evidence dependence, not football causation. The film is not calibrated measured footage. This is not independent commentary evaluation or broadcast-video validation.' }, null, 2) + '\n');
console.log(`Judge cut: ${duration(output).toFixed(1)}s, ${(await stat(output)).size} bytes`);
