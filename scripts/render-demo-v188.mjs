// Assemble the judge cut exclusively from moving film or recorded product UI.
// The existing v187 voice takes remain edited narration, not live agent audio.
import { readFile, writeFile, mkdir, stat, copyFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const work = 'tmp/submission-demo-v188';
const archive = 'demo/showcase-v188';
const scenes = JSON.parse(await readFile('scripts/demo-v187-scenes.json', 'utf8'));
const source = {
  film: 'dist/assets/pitchside-minute.mp4',
  watch: 'demo/showcase-v175/watch-recording.mp4',
  measured: 'demo/showcase-v188/sources/measure.mp4',
  live: 'demo/showcase-v187/live-ui-uncut.webm',
  savedCrew: 'demo/showcase-v188/opening-crew-ui.webm',
  phone: 'demo/showcase-v188/sources/phone.mp4',
  publish: 'demo/showcase-v188/sources/publish.mp4',
  architecture: 'demo/showcase-v174/architecture-uncut.mp4',
};
const cuts = {
  opening: { file: source.film, from: 2, span: 4, label: 'FICTIONAL AI FILM / NOT MEASURED FOOTAGE' },
  watch: { file: source.watch, from: 0, span: 6, label: 'WATCH / RECORDED PUBLIC APP' },
  'opening-round': { file: source.savedCrew, from: 33, span: 10.8, label: 'PUBLIC APP / SAVED ORIGINAL R1 DISCUSSION' },
  'ui-challenge': { file: source.live, from: 5.4, span: 6.4, label: 'PUBLIC APP / VIEWER CHALLENGE / R1' },
  'ui-correction': { file: source.live, from: 11.8, span: 4.1, label: 'TRUTH LAB / ONE TRACKING CORRECTION' },
  'ui-r2': { file: source.live, from: 15.9, span: 4.1, label: 'PUBLIC APP / NEW QUESTION / R2' },
  'r2-receipts': { file: source.live, from: 20, span: 1.88, label: 'AI DESK / FOUR LIVE MODEL RECEIPTS' },
  phone: { file: source.phone, from: 0, span: 10, label: 'PAIRED PHONE / EARLIER REFERENCE CAPTURE' },
  publish: { file: source.publish, from: 0, span: 9, label: 'PUBLISH / EARLIER RECORDED APP VIEW' },
  architecture: { file: source.architecture, from: 0, span: 9, label: 'SECURE / RECORDED INTERACTIVE ARCHITECTURE' },
  closing: { file: source.film, from: 34, span: 5, label: 'BEFORE THE ROAR / EVERY PLAY HAS A WHY' },
};
const run = (program, args) => {
  const result = spawnSync(program, args, { encoding: 'utf8', maxBuffer: 8e6 });
  if (result.status !== 0) throw Error(`${program}: ${result.stderr || result.error}`);
  return result.stdout.trim();
};
const hashFile = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const duration = file => Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]));
await mkdir(work, { recursive: true });
await mkdir(archive, { recursive: true });
const recordings = [];
for (const [index, scene] of scenes.entries()) {
  const cut = cuts[scene.id];
  if (!cut) throw Error(`No moving source for ${scene.id}`);
  const voice = `demo/showcase-v188/sources/voice-${index}.wav`;
  const speech = duration(voice);
  const tempo = Math.max(1, speech / (scene.duration - 0.25));
  if (tempo > 1.12) throw Error(`Narration overruns ${scene.id}`);
  const label = cut.label.replaceAll(':', '\\:').replaceAll("'", '');
  const videoFilter = `setpts=${(scene.duration / cut.span).toFixed(6)}*(PTS-STARTPTS),fps=30,scale=1600:900:force_original_aspect_ratio=increase,crop=1600:900,drawbox=x=0:y=0:w=iw:h=44:color=0x071019@0.90:t=fill,drawtext=text='${label}':x=22:y=12:fontsize=18:fontcolor=white:fontfile='C\\:/Windows/Fonts/arialbd.ttf'[v]`;
  const args = ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(cut.from), '-t', String(cut.span), '-i', cut.file];
  // Show both moving cinematic play and the separate pixel-measured replay.
  if (scene.id === 'watch') args.push('-ss', '0', '-t', '7', '-i', source.measured);
  args.push('-i', voice);
  const filter = scene.id === 'watch'
    ? `[0:v]setpts=${(6 / cut.span).toFixed(6)}*(PTS-STARTPTS),fps=30,scale=1600:900,setsar=1[v0];[1:v]setpts=PTS-STARTPTS,fps=30,scale=1600:900,setsar=1[v1];[v0][v1]concat=n=2:v=1:a=0,drawbox=x=0:y=0:w=iw:h=44:color=0x071019@0.90:t=fill,drawtext=text='AI FILM THEN SEPARATE MEASURED SYNTHETIC REPLAY':x=22:y=12:fontsize=18:fontcolor=white:fontfile='C\\:/Windows/Fonts/arialbd.ttf'[v];[2:a]atempo=${tempo},adelay=100|100,apad,atrim=duration=${scene.duration}[a]`
    : `[0:v]${videoFilter};[1:a]atempo=${tempo},adelay=100|100,apad,atrim=duration=${scene.duration}[a]`;
  const output = `${work}/${String(index).padStart(2, '0')}-${scene.id}.mp4`;
  run('ffmpeg', [...args, '-filter_complex', filter, '-map', '[v]', '-map', '[a]', '-t', String(scene.duration), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-ar', '48000', '-b:a', '160k', output]);
  recordings.push({ ...scene, file: output, source: cut.file, source_sha256: await hashFile(cut.file), cut_start_seconds: cut.from, cut_span_seconds: cut.span, voice_sha256: await hashFile(voice) });
  console.log(`Rendered ${index + 1}/${scenes.length}: ${scene.id}`);
}
const elapsed = scenes.reduce((total, scene) => total + scene.duration, 0);
if (elapsed >= 120) throw Error('Judge video exceeds two minutes');
await writeFile(`${work}/concat.txt`, recordings.map(scene => `file '${process.cwd().replaceAll('\\', '/')}/${scene.file}'`).join('\n'));
await copyFile('demo/showcase-v187/judge.srt', `${archive}/judge.srt`);
await copyFile('demo/showcase-v187/judge-transcript.txt', `${archive}/judge-transcript.txt`);
const output = 'dist/assets/before-the-roar-judge-v188.mp4';
run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${work}/concat.txt`, '-vf', `subtitles=${archive}/judge.srt:force_style='FontName=Arial,FontSize=10,Outline=1,Shadow=0,MarginV=9,BorderStyle=3,OutlineColour=&H99000000',fade=t=in:st=0:d=0.2,fade=t=out:st=${elapsed - 0.5}:d=0.5`, '-af', 'highpass=f=65,loudnorm=I=-16:TP=-1.5:LRA=9', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-maxrate', '3500k', '-bufsize', '7000k', '-g', '60', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', output]);
run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', '42', '-i', output, '-frames:v', '1', 'dist/assets/demo-v188-poster.jpg']);
const proof = JSON.parse(await readFile('demo/showcase-v187/capture.json', 'utf8'));
await writeFile(`${archive}/judge-provenance.json`, JSON.stringify({
  version: 188, file: output, duration_seconds: duration(output), sha256: await hashFile(output), bytes: (await stat(output)).size,
  moving_footage_only: true, scenes: recordings.map(({ id, duration: seconds, source: file, source_sha256, cut_start_seconds, cut_span_seconds, voice_sha256 }) => ({ id, seconds, file, source_sha256, cut_start_seconds, cut_span_seconds, voice_sha256 })),
  measured_replay: source.measured, measured_replay_sha256: await hashFile(source.measured),
  live_capture: 'demo/showcase-v187/live-ui-uncut.webm', live_capture_sha256: await hashFile(source.live), model_requests_in_capture: proof.model_requests_used,
  boundaries: 'The AI film, synthetic measured replay and specialist discussion have separate sources. Browser footage is time-stretched and edited. The opening R1 is a saved public-app discussion with zero new requests in its recording; the later R1 challenge and R2 correction are from a separate capture with eight new model requests. The phone and Publish views are older recorded product footage; phone receipt is shown after reconnection. No static cards are used. Azure AI Speech narration is added in editing, not live agent speech. Evidence correction shows source dependence, not causal football proof. This is not independent commentary evaluation or general broadcast detection validation.'
}, null, 2) + '\n');
console.log(`Judge cut: ${duration(output).toFixed(1)} seconds, moving footage only`);
