import { createRequire } from "node:module";
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require(process.env.BTR_SHARP_PATH || "C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");
const root = path.resolve(import.meta.dirname, "..");
const work = path.join(root, "tmp", "cinematic-demo");
const demo = path.join(root, "demo");
const film = path.join(root, "dist", "assets", "pitchside-minute.mp4");
const narration = path.join(root, "tmp", "btr-demo-narration-v2.wav");
const output = path.join(demo, "before-the-roar-cinematic-judge-demo.mp4");
await mkdir(work, { recursive: true });

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: "inherit" });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)));
});

const row = (y, n, role, mode, detail, color = "#ff5575") => `
  <rect x="1270" y="${y}" width="570" height="76" rx="7" fill="#0b1520" stroke="#35495c"/>
  <text x="1292" y="${y + 30}" fill="#6f8296" font-family="Arial" font-weight="800" font-size="15">${n}</text>
  <text x="1340" y="${y + 30}" fill="#fff" font-family="Arial" font-weight="900" font-size="21">${esc(role)}</text>
  <text x="1340" y="${y + 56}" fill="${color}" font-family="Arial" font-weight="800" font-size="13" letter-spacing="1">${esc(mode)}</text>
  <text x="1812" y="${y + 44}" text-anchor="end" fill="#aab9c8" font-family="Arial" font-size="16">${esc(detail)}</text>`;

async function overlay(name, { eyebrow, title, subtitle, panel = "", lower = "", accent = "#ff315d", shade = true }) {
  const svg = Buffer.from(`<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="side" x1="0" x2="1"><stop stop-color="#05080d" stop-opacity="0"/><stop offset=".24" stop-color="#05080d" stop-opacity=".74"/><stop offset="1" stop-color="#05080d" stop-opacity=".97"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="16" stdDeviation="18" flood-opacity=".65"/></filter></defs>
    <rect width="1920" height="7" fill="${accent}"/>
    <rect y="7" width="1920" height="78" fill="#05080d" fill-opacity=".82"/>
    <text x="54" y="55" fill="#fff" font-family="Arial" font-style="italic" font-weight="900" font-size="34">BTR›</text>
    <text x="170" y="35" fill="#fff" font-family="Arial" font-weight="800" font-size="12" letter-spacing="4">BEFORE THE ROAR</text>
    <text x="170" y="59" fill="#9fb0c3" font-family="Arial" font-weight="800" font-size="12" letter-spacing="3">${esc(eyebrow.toUpperCase())}</text>
    <rect x="1490" y="24" width="376" height="37" rx="4" fill="#111b25" stroke="#536375"/><circle cx="1520" cy="42" r="6" fill="#b6ff2f"/><text x="1540" y="49" fill="#fff" font-family="Arial" font-weight="800" font-size="14" letter-spacing="2">AI-GENERATED COMPANION FILM</text>
    ${shade ? '<rect x="1110" y="85" width="810" height="995" fill="url(#side)"/>' : ''}
    ${panel}
    ${lower ? `<rect x="54" y="810" width="1040" height="177" rx="8" fill="#071019" fill-opacity=".90" stroke="#394b5d" stroke-width="2" filter="url(#s)"/><rect x="54" y="810" width="9" height="177" fill="${accent}"/><text x="92" y="856" fill="${accent}" font-family="Arial" font-weight="900" font-size="15" letter-spacing="3">${esc(lower)}</text><text x="92" y="920" fill="#fff" font-family="Arial" font-weight="900" font-size="42">${esc(title)}</text><text x="92" y="962" fill="#b4c1ce" font-family="Arial" font-size="21">${esc(subtitle)}</text>` : ''}
  </svg>`);
  const target = path.join(work, name);
  await sharp(svg).png().toFile(target);
  return target;
}

const panels = {
  open: await overlay("00-open.png", { eyebrow:"THE DEFINING BTR MOMENT", title:"Did the run create the space?", subtitle:"A convincing picture is still only a claim.", lower:"LIVE ACTION / THE QUESTION", shade:false }),
  crew: await overlay("01-crew.png", { eyebrow:"FRESH PUBLIC EXECUTION", title:"Four model specialists. One deterministic calculator.", subtitle:"Each handoff is visible while the match continues.", lower:"AZURE MULTI-AGENT INVESTIGATION", accent:"#b6ff2f", panel:`
    <rect x="1238" y="122" width="630" height="706" rx="12" fill="#071019" fill-opacity=".94" stroke="#3a5064" stroke-width="2"/>
    <text x="1270" y="170" fill="#b6ff2f" font-family="Arial" font-weight="800" font-size="15" letter-spacing="3">LIVE · SPECIALIST HANDOFFS</text>
    ${row(198,"01","SCOUT","AZURE MODEL","find the angle")}${row(286,"02","GUIDE","AZURE MODEL","teach the concept")}${row(374,"03","VECTOR","DETERMINISTIC","23.7 m","#b6ff2f")}${row(462,"04","CHECK","AZURE MODEL","challenge cause")}${row(550,"05","HOST","AZURE MODEL","publish verdict")}
    <rect x="1270" y="662" width="570" height="112" rx="7" fill="#152014" stroke="#658b43"/><text x="1296" y="704" fill="#b6ff2f" font-family="Arial" font-weight="900" font-size="20">DELIVERED · 3.2 SECONDS</text><text x="1296" y="741" fill="#d4dde5" font-family="Arial" font-size="17">Four Azure requests · Vector in code</text>` }),
  receipts: await overlay("02-receipts.png", { eyebrow:"INSIDE THE AI DESK", title:"The work leaves receipts.", subtitle:"Public execution details, without private chain-of-thought.", lower:"REQUESTS · SOURCES · LATENCY", accent:"#b6ff2f", panel:`
    <rect x="1238" y="122" width="630" height="735" rx="12" fill="#071019" fill-opacity=".95" stroke="#3a5064" stroke-width="2"/>
    <text x="1270" y="170" fill="#b6ff2f" font-family="Arial" font-weight="800" font-size="15" letter-spacing="3">LIVE · 4 REQUESTS COMPLETED</text>
    ${row(198,"01","SCOUT","RESPONSE ID","0.95 s")}${row(286,"02","GUIDE","RESPONSE ID","0.80 s")}${row(374,"03","VECTOR","0 MODEL CALLS","23.7 m","#b6ff2f")}${row(462,"04","CHECK","RESPONSE ID","0.65 s")}${row(550,"05","HOST","RESPONSE ID","0.64 s")}
    <text x="1270" y="686" fill="#ff6b87" font-family="Arial" font-weight="800" font-size="16">CHECK'S CHALLENGE</text><text x="1270" y="728" fill="#fff" font-family="Arial" font-weight="700" font-size="22">Movement is observed.</text><text x="1270" y="760" fill="#fff" font-family="Arial" font-weight="700" font-size="22">Causation is not proven.</text><text x="1270" y="812" fill="#91a4b8" font-family="Arial" font-size="16">Evidence IDs remain inspectable.</text>` }),
  math: await overlay("03-math.png", { eyebrow:"VECTOR + CHECK", title:"Measure the play. Challenge the story.", subtitle:"The number describes the ball; it does not prove why the defender moved.", lower:"DETERMINISTIC CALCULATION", panel:`
    <rect x="1238" y="138" width="630" height="686" rx="12" fill="#071019" fill-opacity=".95" stroke="#3a5064" stroke-width="2"/>
    <text x="1270" y="188" fill="#b6ff2f" font-family="Arial" font-weight="800" font-size="15" letter-spacing="3">FORWARD PASSING GAIN</text><text x="1270" y="300" fill="#fff" font-family="Arial" font-weight="900" font-size="96">23.7 m</text>
    <text x="1270" y="354" fill="#aab9c8" font-family="Arial" font-size="19">(58.25 − 44.92) + (69.83 − 59.50)</text><text x="1270" y="394" fill="#aab9c8" font-family="Arial" font-size="19">Completed passes only · carries excluded</text>
    <rect x="1270" y="452" width="566" height="4" fill="#ff315d"/><text x="1270" y="510" fill="#ff5c7b" font-family="Arial" font-weight="800" font-size="16" letter-spacing="3">CHECK / EVIDENCE LIMIT</text><text x="1270" y="562" fill="#fff" font-family="Arial" font-weight="800" font-size="25">The timing supports coincidence.</text><text x="1270" y="603" fill="#fff" font-family="Arial" font-weight="800" font-size="25">It does not establish cause.</text><text x="1270" y="676" fill="#b4c1ce" font-family="Arial" font-size="19">Next test: compare a similar attack</text><text x="1270" y="706" fill="#b4c1ce" font-family="Arial" font-size="19">where the wide run changes.</text>` }),
  question: await overlay("04-question.png", { eyebrow:"TRUTH LAB", title:"What if the defender never shifted?", subtitle:"Keep the play on screen. Change only the evidence under dispute.", lower:"CONTROLLED COUNTERFACTUAL", panel:`
    <rect x="1238" y="160" width="630" height="600" rx="12" fill="#110b12" fill-opacity=".96" stroke="#ff315d" stroke-width="2"/><text x="1274" y="218" fill="#ff5c7b" font-family="Arial" font-weight="800" font-size="15" letter-spacing="3">THE CLAIM UNDER PRESSURE</text><text x="1274" y="300" fill="#fff" font-family="Arial" font-weight="900" font-size="34">The run moved</text><text x="1274" y="346" fill="#fff" font-family="Arial" font-weight="900" font-size="34">the defender.</text><text x="1274" y="430" fill="#aab9c8" font-family="Arial" font-size="20">Original tracking · R1</text><text x="1274" y="520" fill="#fff" font-family="Arial" font-weight="900" font-size="78">13.0 m</text><text x="1274" y="567" fill="#aab9c8" font-family="Arial" font-size="18">measured lateral displacement</text><rect x="1274" y="630" width="540" height="76" rx="5" fill="#ff315d"/><text x="1544" y="678" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="900" font-size="22">CHANGE ONE RECORD →</text>` }),
  corrected: await overlay("05-corrected.png", { eyebrow:"TRUTH LAB / REVISION R2", title:"One correction. Three consequences.", subtitle:"The action stays visible while the explanation repairs itself.", lower:"EVIDENCE CHANGED", accent:"#b6ff2f", panel:`
    <rect x="1208" y="120" width="660" height="760" rx="12" fill="#071019" fill-opacity=".96" stroke="#6d9148" stroke-width="2"/><text x="1246" y="172" fill="#b6ff2f" font-family="Arial" font-weight="800" font-size="15" letter-spacing="3">ORIGINAL R1 → CORRECTED R2</text>
    <text x="1246" y="280" fill="#fff" font-family="Arial" font-weight="900" font-size="64">13.0 m → 0.0 m</text><text x="1246" y="326" fill="#aab9c8" font-family="Arial" font-size="18">Defender displacement</text>
    <rect x="1246" y="376" width="584" height="112" rx="7" fill="#111b25"/><text x="1276" y="418" fill="#91a4b8" font-family="Arial" font-weight="800" font-size="14">CALCULATION</text><text x="1276" y="461" fill="#b6ff2f" font-family="Arial" font-weight="900" font-size="26">23.7 m · RETAINED</text>
    <rect x="1246" y="506" width="584" height="112" rx="7" fill="#241019"/><text x="1276" y="548" fill="#ff6c88" font-family="Arial" font-weight="800" font-size="14">MOVEMENT CLAIM</text><text x="1276" y="591" fill="#fff" font-family="Arial" font-weight="900" font-size="26">WITHDRAWN</text>
    <rect x="1246" y="636" width="584" height="112" rx="7" fill="#111b25"/><text x="1276" y="678" fill="#91a4b8" font-family="Arial" font-weight="800" font-size="14">AUDIENCE STORY</text><text x="1276" y="721" fill="#fff" font-family="Arial" font-weight="900" font-size="26">REVISED</text><text x="1246" y="812" fill="#aab9c8" font-family="Arial" font-size="17">Two completed passes remain in the record.</text>` }),
  foundry: await overlay("07-foundry.png", { eyebrow:"MICROSOFT FOUNDRY", title:"Measure the claim. Publish the limit.", subtitle:"Evaluation stays visible while the match remains the main event.", lower:"RECORDED EVIDENCE COURT", panel:`
    <rect x="1238" y="142" width="630" height="690" rx="12" fill="#071019" fill-opacity=".96" stroke="#3a5064" stroke-width="2"/><text x="1272" y="198" fill="#ff5c7b" font-family="Arial" font-weight="800" font-size="14" letter-spacing="3">CREW vs SINGLE-MODEL BASELINE</text><text x="1272" y="340" fill="#fff" font-family="Arial" font-weight="900" font-size="100">46</text><text x="1480" y="340" fill="#718295" font-family="Arial" font-size="45">vs</text><text x="1602" y="340" fill="#fff" font-family="Arial" font-weight="900" font-size="100">45</text><text x="1272" y="390" fill="#b6ff2f" font-family="Arial" font-weight="800" font-size="17">CREW</text><text x="1606" y="390" fill="#aab9c8" font-family="Arial" font-weight="800" font-size="17">BASELINE</text><text x="1272" y="480" fill="#fff" font-family="Arial" font-weight="800" font-size="23">Six preregistered synthetic cases</text><text x="1272" y="524" fill="#aab9c8" font-family="Arial" font-size="17">Two blinded evaluator passes</text><rect x="1272" y="576" width="548" height="2" fill="#3d5063"/><text x="1272" y="630" fill="#ff6c88" font-family="Arial" font-weight="800" font-size="16">EVIDENCE LIMIT</text><text x="1272" y="672" fill="#fff" font-family="Arial" font-weight="700" font-size="21">Narrow model-scored result.</text><text x="1272" y="708" fill="#fff" font-family="Arial" font-weight="700" font-size="21">Human blind review pending.</text><text x="1272" y="774" fill="#ffd166" font-family="Arial" font-weight="900" font-size="19">NO SUPERIORITY CLAIM</text>` }),
  close: await overlay("08-close.png", { eyebrow:"BEFORE THE ROAR", title:"Every claim earned.", subtitle:"Reason. Verify. Correct. Communicate.", lower:"TRY THE DEFINING MOMENT", shade:false, panel:`<rect x="1110" y="172" width="754" height="238" rx="12" fill="#071019" fill-opacity=".92" stroke="#ff315d" stroke-width="2"/><text x="1150" y="238" fill="#ff5c7b" font-family="Arial" font-weight="800" font-size="15" letter-spacing="3">LIVE JUDGE ROUTE</text><text x="1150" y="302" fill="#fff" font-family="Arial" font-weight="900" font-size="27">before-the-roar.sagitta107.chatgpt.site</text><text x="1150" y="350" fill="#b6ff2f" font-family="Arial" font-weight="800" font-size="22">/?judge=1#watch</text>` }),
};

// Put the current corrected phone state inside a broadcast overlay.
const phoneBase = await overlay("06-phone-base.png", { eyebrow:"POCKET DIRECTOR / REVISION R2", title:"One truth. Four ways to understand it.", subtitle:"The same correction reaches every personalized view.", lower:"SYNCHRONIZED SECOND SCREEN", panel:`<rect x="1218" y="120" width="650" height="820" rx="12" fill="#071019" fill-opacity=".92" stroke="#3a5064" stroke-width="2"/><text x="1252" y="178" fill="#b6ff2f" font-family="Arial" font-weight="800" font-size="15" letter-spacing="3">LIVE WITH THE MAIN SCREEN</text>` });
const phoneImage = await sharp(path.join(root,"tmp","live-demo-capture","mobile-current.jpg")).resize({height:720}).jpeg({quality:94}).toBuffer();
panels.phone = path.join(work,"06-phone.png");
await sharp(phoneBase).composite([{input:phoneImage,left:1422,top:196}]).png().toFile(panels.phone);

const segments = [
  {start:0,duration:9,overlay:panels.open},
  {start:9,duration:15,overlay:panels.crew},
  {start:24,duration:14,overlay:panels.receipts},
  {start:38,duration:14,overlay:panels.math},
  {start:52,duration:8,overlay:panels.question},
  {start:0,duration:15,overlay:panels.corrected},
  {start:15,duration:14,overlay:panels.phone},
  {start:29,duration:10,overlay:panels.foundry},
  {start:39,duration:6,overlay:panels.close},
];

let elapsed=0; const manifest=[];
for (let i=0;i<segments.length;i++) {
  const s=segments[i], target=path.join(work,`segment-${String(i).padStart(2,"0")}.mp4`);
  await run("ffmpeg",["-hide_banner","-loglevel","error","-y","-ss",String(s.start),"-i",film,"-loop","1","-i",s.overlay,"-t",String(s.duration),"-filter_complex","[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080[bg];[bg][1:v]overlay=0:0,format=yuv420p,fps=30","-an","-c:v","libx264","-preset","fast","-crf","18",target]);
  manifest.push(`file '${target.replaceAll("'","'\\''")}'`); elapsed+=s.duration;
}
await writeFile(path.join(work,"segments.txt"),manifest.join("\n")+"\n");
await run("ffmpeg",["-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",path.join(work,"segments.txt"),"-c","copy",path.join(work,"silent.mp4")]);

const captions=`1\n00:00:00,000 --> 00:00:09,000\nThe movement looks convincing. Does the evidence prove the story?\n\n2\n00:00:09,000 --> 00:00:24,000\nFour Azure specialists investigate while Vector calculates from the match record.\n\n3\n00:00:24,000 --> 00:00:38,000\nEvery live request leaves sources, response IDs, handoffs and latency.\n\n4\n00:00:38,000 --> 00:00:52,000\n23.7 metres describes the ball. It does not prove why the defender moved.\n\n5\n00:00:52,000 --> 00:01:00,000\nTruth Lab changes only the disputed tracking observation.\n\n6\n00:01:00,000 --> 00:01:15,000\n13.0 metres becomes 0.0. The calculation survives; the movement claim is withdrawn.\n\n7\n00:01:15,000 --> 00:01:29,000\nPocket Director receives the corrected story in four personalized views.\n\n8\n00:01:29,000 --> 00:01:39,000\nFoundry records a narrow result and publishes its limitation.\n\n9\n00:01:39,000 --> 00:01:45,000\nEvery claim earned.\n`;
const captionsPath=path.join(demo,"before-the-roar-cinematic-judge-demo.srt");
await writeFile(captionsPath,captions);
await run("ffmpeg",["-hide_banner","-loglevel","error","-y","-i",path.join(work,"silent.mp4"),"-i",narration,"-filter_complex",`[0:v]subtitles=demo/before-the-roar-cinematic-judge-demo.srt:force_style='FontName=Arial,FontSize=9,PrimaryColour=&H00FFFFFF,OutlineColour=&HCC000000,BorderStyle=3,Outline=1,Shadow=0,Alignment=2,MarginV=18'[v];[1:a]highpass=f=70,lowpass=f=15000,loudnorm=I=-16:TP=-1.5:LRA=7,apad=pad_dur=20[a]`,"-map","[v]","-map","[a]","-t",String(elapsed),"-c:v","libx264","-preset","medium","-crf","21","-c:a","aac","-b:a","192k","-pix_fmt","yuv420p","-movflags","+faststart",output]);
await run("ffmpeg",["-hide_banner","-loglevel","error","-y","-i",output,"-vf","scale=-2:720","-c:v","libx264","-preset","medium","-crf","27","-c:a","aac","-b:a","128k","-movflags","+faststart",path.join(demo,"before-the-roar-cinematic-judge-demo-share.mp4")]);
await copyFile(path.join(demo,"before-the-roar-judge-demo-v2-transcript.txt"),path.join(demo,"before-the-roar-cinematic-judge-demo-transcript.txt"));
await writeFile(path.join(demo,"before-the-roar-cinematic-judge-demo-provenance.json"),JSON.stringify({schema:"btr.cinematic-submission-demo.v1",created_at:new Date().toISOString(),duration_seconds:elapsed,visual_strategy:"AI-generated fictional companion film remains visible for the complete demo; evidence and application proof appear as broadcast overlays.",film:{source:"dist/assets/pitchside-minute.mp4",real_match_data:false,measurement_source:false,label_visible:true},fresh_execution:{azure_model_requests:4,deterministic_role:"Vector",delivery_seconds:3.2},correction:{defender_shift_m:[13,0],claim_withdrawn:true,pass_calculation_retained:true},evaluation:{crew_points:46,baseline_points:45,kind:"recorded model-scored comparison",independent_human_review:"pending"},narration:{provider:"Azure AI Speech",burned_captions:true}},null,2));
console.log(`Created ${output}`); console.log(`Duration: ${elapsed} seconds`);
