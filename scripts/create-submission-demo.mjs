import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require(
  process.env.BTR_SHARP_PATH ||
    "C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp",
);

const root = path.resolve(import.meta.dirname, "..");
const work = path.join(root, "tmp", "submission-demo");
const output = path.join(root, "demo", "before-the-roar-judge-demo.mp4");
await mkdir(work, { recursive: true });
await mkdir(path.dirname(output), { recursive: true });

const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)),
    );
  });

async function broadcastFrame({ source, outputName, eyebrow, title, accent = "#f53652" }) {
  const screenshot = await sharp(source)
    .resize(1740, 902, { fit: "contain", background: "#070b10" })
    .jpeg({ quality: 94 })
    .toBuffer();
  const svg = Buffer.from(`
    <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow"><feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#000" flood-opacity=".65"/></filter>
      </defs>
      <rect width="1920" height="1080" fill="#070b10"/>
      <rect width="1920" height="7" fill="${accent}"/>
      <text x="80" y="69" fill="#fff" font-family="Arial" font-style="italic" font-weight="900" font-size="42">BTR›</text>
      <text x="228" y="43" fill="#f2f5f8" font-family="Arial" font-weight="700" font-size="13" letter-spacing="5">BEFORE THE ROAR</text>
      <text x="228" y="68" fill="#9dafc1" font-family="Arial" font-weight="700" font-size="12" letter-spacing="3">${escape(eyebrow.toUpperCase())}</text>
      <text x="1840" y="54" text-anchor="end" fill="${accent}" font-family="Arial" font-weight="800" font-size="27">${escape(title)}</text>
      <rect x="80" y="100" width="1760" height="914" rx="13" fill="#0d141d" stroke="#344150" stroke-width="2" filter="url(#shadow)"/>
      <rect x="80" y="100" width="9" height="914" fill="${accent}"/>
    </svg>`);
  const target = path.join(work, outputName);
  await sharp(svg)
    .composite([{ input: screenshot, left: 90, top: 106 }])
    .png()
    .toFile(target);
  return target;
}

async function titleCard(outputName, kicker, title, subtitle) {
  const svg = Buffer.from(`
    <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow"><stop stop-color="#283646"/><stop offset="1" stop-color="#070b10"/></radialGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="32"/></filter>
      </defs>
      <rect width="1920" height="1080" fill="#070b10"/>
      <circle cx="1390" cy="300" r="390" fill="#f53652" opacity=".13" filter="url(#soft)"/>
      <circle cx="470" cy="870" r="500" fill="#adff2f" opacity=".07" filter="url(#soft)"/>
      <path d="M0 140 H1920 M0 940 H1920" stroke="#273444" stroke-width="2"/>
      <path d="M1500 0 L1920 420 M0 760 L320 1080" stroke="#f53652" stroke-width="5" opacity=".7"/>
      <text x="130" y="190" fill="#fff" font-family="Arial" font-style="italic" font-weight="900" font-size="82">BTR›</text>
      <text x="130" y="360" fill="#f53652" font-family="Arial" font-weight="800" font-size="25" letter-spacing="8">${escape(kicker.toUpperCase())}</text>
      <text x="130" y="505" fill="#fff" font-family="Arial" font-weight="900" font-size="103">${escape(title)}</text>
      <text x="134" y="594" fill="#bcc9d8" font-family="Arial" font-weight="400" font-size="38">${escape(subtitle)}</text>
      <rect x="130" y="710" width="620" height="6" fill="#f53652"/>
      <text x="130" y="775" fill="#d9ee75" font-family="Arial" font-weight="700" font-size="24" letter-spacing="3">SYNTHETIC FOOTBALL · EXPLAINABLE AI · MICROSOFT AZURE</text>
    </svg>`);
  const target = path.join(work, outputName);
  await sharp(svg).png().toFile(target);
  return target;
}

async function phoneFrame(outputName) {
  const source = path.join(root, "tmp", "judge-mobile.png");
  const phone = await sharp(source)
    .resize({ height: 820 })
    .jpeg({ quality: 94 })
    .toBuffer();
  const svg = Buffer.from(`
    <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      <rect width="1920" height="1080" fill="#070b10"/>
      <rect width="1920" height="7" fill="#f53652"/>
      <text x="90" y="90" fill="#f53652" font-family="Arial" font-weight="800" font-size="22" letter-spacing="6">POCKET DIRECTOR</text>
      <text x="90" y="210" fill="#fff" font-family="Arial" font-weight="900" font-size="72">The same trusted story.</text>
      <text x="90" y="294" fill="#fff" font-family="Arial" font-weight="900" font-size="72">Made for every fan.</text>
      <text x="94" y="390" fill="#b9c8d8" font-family="Arial" font-size="30">New to football. Show the math. Tactical view.</text>
      <text x="94" y="438" fill="#b9c8d8" font-family="Arial" font-size="30">Club, player and language preferences travel with the moment.</text>
      <rect x="90" y="540" width="820" height="190" rx="8" fill="#111a25" stroke="#354457" stroke-width="2"/>
      <text x="130" y="604" fill="#d9ee75" font-family="Arial" font-weight="800" font-size="21" letter-spacing="3">ONE EVIDENCE REVISION</text>
      <text x="130" y="665" fill="#fff" font-family="Arial" font-weight="800" font-size="36">Broadcast and phone update together.</text>
      <text x="130" y="710" fill="#9fb0c3" font-family="Arial" font-size="24">No refresh. No separate explanation to reconcile.</text>
      <rect x="1260" y="100" width="480" height="880" rx="58" fill="#020407" stroke="#526174" stroke-width="5"/>
      <rect x="1410" y="123" width="180" height="24" rx="12" fill="#161e27"/>
    </svg>`);
  const target = path.join(work, outputName);
  await sharp(svg)
    .composite([{ input: phone, left: 1320, top: 158 }])
    .png()
    .toFile(target);
  return target;
}

const frames = {
  title: await titleCard(
    "00-title.png",
    "Inside the game",
    "Every claim earned.",
    "One football moment. Five specialists. A story you can question.",
  ),
  inject: await broadcastFrame({
    source: path.join(root, "tmp", "demo-r111-stage-1.jpg"),
    outputName: "01-inject.png",
    eyebrow: "01 · live synthetic event",
    title: "THE MOMENT ENTERS",
  }),
  investigate: await broadcastFrame({
    source: path.join(root, "tmp", "demo-r111-stage-2.jpg"),
    outputName: "02-investigate.png",
    eyebrow: "02 · specialist handoffs",
    title: "THE CREW INVESTIGATES",
  }),
  calculate: await broadcastFrame({
    source: path.join(root, "tmp", "demo-r111-stage-3.jpg"),
    outputName: "03-calculate.png",
    eyebrow: "03 · deterministic calculation",
    title: "23.7 METRES, SOURCED",
  }),
  correct: await broadcastFrame({
    source: path.join(root, "tmp", "demo-r111-stage-4.jpg"),
    outputName: "04-correct.png",
    eyebrow: "04 · truth lab",
    title: "CHANGE THE EVIDENCE",
  }),
  publish: await broadcastFrame({
    source: path.join(root, "tmp", "demo-r111-stage-5.jpg"),
    outputName: "05-publish.png",
    eyebrow: "05 · audience output",
    title: "PUBLISH WHAT SURVIVES",
  }),
  challenge: await broadcastFrame({
    source: path.join(root, "tmp", "demo-r111-challenge.jpg"),
    outputName: "06-challenge.png",
    eyebrow: "truth lab",
    title: "ORIGINAL vs CORRECTED",
  }),
  understand: await broadcastFrame({
    source: path.join(root, "tmp", "demo-r111-understand.jpg"),
    outputName: "07-understand.png",
    eyebrow: "personalized match centre",
    title: "SEE THE SHAPE",
  }),
  measure: await broadcastFrame({
    source: path.join(root, "tmp", "demo-r111-measure.jpg"),
    outputName: "08-measure.png",
    eyebrow: "measured match lab",
    title: "FROM PIXELS TO PROOF",
  }),
  proof: await broadcastFrame({
    source: path.join(root, "tmp", "demo-r111-publish.jpg"),
    outputName: "09-proof.png",
    eyebrow: "production desk",
    title: "INSPECT THE RECEIPTS",
  }),
  engineers: await broadcastFrame({
    source: path.join(root, "tmp", "demo-r111-engineers.jpg"),
    outputName: "10-engineers.png",
    eyebrow: "purposeful multi-agent design",
    title: "FIVE JOBS. ONE DECISION.",
  }),
  secure: await broadcastFrame({
    source: path.join(root, "tmp", "demo-r111-secure.jpg"),
    outputName: "11-secure.png",
    eyebrow: "microsoft security",
    title: "TRUST BUILT INTO THE PLAY",
  }),
  phone: await phoneFrame("12-phone.png"),
  close: await titleCard(
    "13-close.png",
    "Before the Roar",
    "Every perspective.",
    "Reason. Verify. Correct. Communicate.",
  ),
};

const segments = [
  { key: "title", duration: 3 },
  { video: path.join(root, "dist", "assets", "pitchside-minute.mp4"), start: 0, duration: 8, label: "AI-GENERATED CINEMATIC COMPANION" },
  { key: "inject", duration: 8 },
  { key: "investigate", duration: 10 },
  { key: "calculate", duration: 9 },
  { key: "correct", duration: 11 },
  { video: path.join(root, "dist", "assets", "pitchside-minute.mp4"), start: 31, duration: 5, label: "AI-GENERATED CINEMATIC COMPANION" },
  { key: "publish", duration: 7 },
  { key: "challenge", duration: 8 },
  { key: "understand", duration: 7 },
  { key: "measure", duration: 7 },
  { key: "proof", duration: 9 },
  { key: "engineers", duration: 7 },
  { key: "secure", duration: 6 },
  { key: "phone", duration: 7 },
  { key: "close", duration: 4 },
];

let elapsed = 0;
const manifest = [];
for (let index = 0; index < segments.length; index += 1) {
  const segment = segments[index];
  const target = path.join(work, `segment-${String(index).padStart(2, "0")}.mp4`);
  const fadeOut = Math.max(0, segment.duration - 0.35);
  if (segment.video) {
    await run("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y",
      "-ss", String(segment.start || 0), "-i", segment.video,
      "-t", String(segment.duration),
      "-vf", `scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,drawbox=x=0:y=0:w=iw:h=72:color=0x070b10@0.82:t=fill,drawbox=x=0:y=0:w=iw:h=7:color=0xf53652@1:t=fill,drawtext=text='BTR  /  ${segment.label}':x=58:y=25:fontsize=25:fontcolor=white:fontfile='C\\:/Windows/Fonts/arialbd.ttf',fade=t=in:st=0:d=0.3,fade=t=out:st=${fadeOut}:d=0.35,fps=30`,
      "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "19", "-pix_fmt", "yuv420p", target,
    ]);
  } else {
    await run("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y",
      "-loop", "1", "-i", frames[segment.key],
      "-t", String(segment.duration),
      "-vf", `scale=1920:1080,zoompan=z='min(zoom+0.00022,1.025)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,fade=t=in:st=0:d=0.3,fade=t=out:st=${fadeOut}:d=0.35`,
      "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "19", "-pix_fmt", "yuv420p", target,
    ]);
  }
  manifest.push(`file '${target.replaceAll("'", "'\\''")}'`);
  elapsed += segment.duration;
}

const manifestPath = path.join(work, "segments.txt");
await writeFile(manifestPath, `${manifest.join("\n")}\n`);
const silentVideo = path.join(work, "silent.mp4");
await run("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-f", "concat", "-safe", "0", "-i", manifestPath,
  "-c", "copy", silentVideo,
]);

const narration = path.join(root, "tmp", "btr-demo-narration.wav");
const narrationFast = path.join(work, "narration-fast.wav");
await run("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-i", narration, "-filter:a", "atempo=1.18,highpass=f=70,lowpass=f=15000,loudnorm=I=-16:TP=-1.5:LRA=8",
  narrationFast,
]);

await run("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-i", silentVideo, "-i", narrationFast,
  "-map", "0:v:0", "-map", "1:a:0",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
  "-shortest", "-movflags", "+faststart", output,
]);

const transcript = `BEFORE THE ROAR — JUDGE DEMO NARRATION

Football data can tell you what happened. Before the Roar asks the harder question: why did it matter, and can that explanation survive a challenge?

Here is the moment. At 67:16, a synthetic tracking event enters the studio. A winger moves wide. A defender follows. The ball keeps travelling through the centre.

Five specialists investigate the same evidence. Scout spots the movement. Guide explains what a new fan should watch. Vector calculates 23.7 metres of forward passing gain. Check pushes back: movement happened, but the data does not prove why. Host publishes only what the evidence supports.

Then we change one record. The defender's measured shift falls from 13 metres to zero. The completed passes remain. The unsupported claim is withdrawn, and the broadcast line changes with it. One correction. Three visible consequences.

The same match becomes a different experience for every viewer. A newcomer gets the football idea. An analyst gets the positional consequence and its limits. A numbers fan gets the equation. A supporter can follow a club, a player, or a preferred language.

Behind the broadcast, the Production Desk shows exactly what ran: live model requests, deterministic calculations, saved replay, execution IDs, latency, sources, and recovery state. Microsoft Foundry acts as an evidence court, auditing the public claims and the handoffs between specialists.

Azure Container Apps runs the service. Microsoft Entra ID and role-based access protect resources. Blob Storage preserves conflict-safe proof. Pocket Director carries the same trusted explanation to the fan's phone.

Before the Roar turns one football moment into match intelligence that can reason, verify, correct, and communicate. Every play. Every perspective. Every claim earned.
`;
await writeFile(path.join(root, "demo", "before-the-roar-judge-demo-transcript.txt"), transcript);
await writeFile(
  path.join(root, "demo", "before-the-roar-judge-demo-provenance.json"),
  JSON.stringify(
    {
      schema: "btr.submission-demo.v1",
      created_at: new Date().toISOString(),
      duration_seconds: elapsed,
      visual_sources: {
        application: "Current public release 111 screenshots captured from the functioning app",
        cinematic: "AI-generated fictional football companion footage supplied by the project creator; separately labelled in-video",
        mobile: "Responsive application screenshot",
      },
      narration: {
        provider: "Azure AI Speech",
        voice: "en-US-GuyNeural",
        style: "newscast-casual",
        post_processing: "tempo 1.18, speech EQ, EBU R128 loudness normalization",
      },
      claims: {
        live_stadium_feed: false,
        real_match_data: false,
        cinematic_is_measurement_source: false,
        guided_rehearsal_uses_model_requests: false,
        public_app_url: "https://before-the-roar.sagitta107.chatgpt.site",
      },
    },
    null,
    2,
  ),
);

console.log(`Created ${output}`);
console.log(`Visual timeline: ${elapsed} seconds`);
