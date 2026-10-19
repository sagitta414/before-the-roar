import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {access, copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

const CURRENT_SOURCE = 'dist/tracking-model.js';
const FROZEN_SOURCE =
  'docs/proof/detectors/sha256-394e7ac1888be14502e0abccde7090f09f7a79c56235721d10734a49b97e31c2.js';
const EXPECTED_HASH = '394e7ac1888be14502e0abccde7090f09f7a79c56235721d10734a49b97e31c2';
const args = new Set(process.argv.slice(2));
const publish = args.has('--publish');
const publishTargets = [
  'docs/proof/tracking-holdout-v146-plan.json',
  'docs/proof/tracking-holdout-v146.json',
  'dist/assets/tracking/holdout-current.json'
];
const runRoot = resolve(
  process.env.BTR_HOLDOUT_OUTPUT || join(tmpdir(), `btr-tracking-holdout-${Date.now()}`)
);

const cases = [
  {id: 'release-standard', seed: 10401},
  {id: 'release-compressed-dim', seed: 10402, filter: 'eq=brightness=-0.07:saturation=0.84'},
  {id: 'release-low-light', seed: 10403, filter: 'eq=brightness=-0.19:saturation=0.68'},
  {
    id: 'release-noisy-floodlights',
    seed: 10404,
    filter: 'eq=brightness=-0.09:saturation=0.8,noise=alls=5:allf=t'
  },
  {id: 'release-darkness-boundary', seed: 10405, filter: 'eq=brightness=-0.31:saturation=0.43'}
];

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = bytes => Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'));

function commandWorks(command, prefix = [], versionFlag = '--version') {
  const result = spawnSync(command, [...prefix, versionFlag], {encoding: 'utf8', windowsHide: true});
  return result.status === 0;
}

function resolvePython() {
  const configured = process.env.BTR_PYTHON || process.env.PYTHON;
  const candidates = configured
    ? [{command: configured, prefix: []}]
    : process.platform === 'win32'
      ? [
          {command: 'py', prefix: ['-3']},
          {command: 'python', prefix: []},
          {command: 'python3', prefix: []}
        ]
      : [
          {command: 'python3', prefix: []},
          {command: 'python', prefix: []}
        ];
  const match = candidates.find(item => commandWorks(item.command, item.prefix));
  if (!match) throw new Error('Python 3 was not found. Set BTR_PYTHON to an executable path.');
  return match;
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    windowsHide: true
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `${command} failed`);
  return result.stdout;
}

const currentSource = canonical(await readFile(CURRENT_SOURCE));
const frozenSource = await readFile(FROZEN_SOURCE);
if (sha256(currentSource) !== EXPECTED_HASH || sha256(frozenSource) !== EXPECTED_HASH) {
  throw new Error('The shipping detector does not match its immutable source artifact.');
}

if (publish) {
  const existing = [];
  for (const target of publishTargets) {
    try {
      await access(target);
      existing.push(target);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  if (existing.length) {
    throw new Error(
      `Refusing to overwrite immutable holdout evidence: ${existing.join(', ')}`
    );
  }
}

const python = resolvePython();
const ffmpeg = process.env.BTR_FFMPEG || 'ffmpeg';
if (!commandWorks(ffmpeg, [], '-version')) {
  throw new Error('ffmpeg was not found. Set BTR_FFMPEG to an executable path.');
}

await mkdir(runRoot, {recursive: true});
const report = {
  version: 'v146-current-detector-holdout',
  detector_sha256: EXPECTED_HASH,
  detector_source: FROZEN_SOURCE,
  created_at: new Date().toISOString(),
  method:
    'The current detector was archived before five new synthetic seeds were generated. Each case changes positions and timings; four change exposure, saturation, compression or noise after rendering. Results are retained without tuning or rerunning. This is controlled synthetic evidence, not independent real-world or broadcast validation.',
  cases: []
};
const plan = {...report, plan: cases};
const planPath = join(runRoot, 'tracking-holdout-v146-plan.json');
await writeFile(planPath, JSON.stringify(plan, null, 2));
if (publish) await writeFile(publishTargets[0], JSON.stringify(plan, null, 2));

for (const item of cases) {
  const folder = join(runRoot, `case-${item.seed}`);
  await mkdir(folder, {recursive: true});
  run(python.command, [
    ...python.prefix,
    'scripts/create-tracking-video.py',
    '--seed',
    String(item.seed),
    '--output',
    folder,
    '--truth',
    join(folder, 'truth.json')
  ]);
  if (item.filter) {
    run(ffmpeg, [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      join(folder, 'training-minute.mp4'),
      '-vf',
      item.filter,
      '-c:v',
      'libx264',
      '-crf',
      '28',
      join(folder, 'perturbed.mp4')
    ]);
    await copyFile(join(folder, 'perturbed.mp4'), join(folder, 'training-minute.mp4'));
  }
  const output = join(folder, 'report.json');
  run(process.execPath, ['scripts/evaluate-tracking.mjs', folder, join(folder, 'truth.json'), output]);
  const result = JSON.parse(await readFile(output, 'utf8'));
  report.cases.push({...item, ...result});
  console.log(
    JSON.stringify({
      case: item.id,
      expected: result.expectedEvents,
      detected: result.detectedEvents,
      matched: result.matchedEvents
    })
  );
}

if (sha256(canonical(await readFile(CURRENT_SOURCE))) !== EXPECTED_HASH) {
  throw new Error('Detector changed during holdout');
}
const resultPath = join(runRoot, 'tracking-holdout-v146.json');
await writeFile(resultPath, JSON.stringify(report, null, 2));
if (publish) {
  await writeFile(publishTargets[1], JSON.stringify(report, null, 2));
  await writeFile(publishTargets[2], JSON.stringify(report, null, 2));
}
console.log(JSON.stringify({runRoot, planPath, resultPath, published: publish}));
